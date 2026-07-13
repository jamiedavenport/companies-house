// Downloads the upstream Companies House Public Data API Swagger fragments
// into spec/, starting from swagger.json and following $refs so the file
// list never needs hardcoding. Run update-spec afterwards to rebuild the
// bundled and corrected companies-house.json.
//
// Upstream quirks this script absorbs:
// - Many $refs are absolute URLs pointing at Companies House's own
//   localhost (http://127.0.0.1:10000/...); only their paths are usable.
// - Fragments live under two sibling directories upstream (spec/ and
//   models/); locally models/ is nested inside spec/, so every ref is
//   rewritten relative to the local layout.
import { mkdirSync, writeFileSync } from "node:fs";

const ROOT =
  "https://developer-specs.company-information.service.gov.uk/api.ch.gov.uk-specifications/swagger-2.0/";
const OUT = new URL("../spec/", import.meta.url);

// Upstream path relative to ROOT -> local path relative to spec/.
const localPath = (upstreamRel: string): string =>
  upstreamRel.startsWith("spec/") ? upstreamRel.slice("spec/".length) : upstreamRel;

// Relative ref from one local file to another, e.g. "./models/filings.json".
const relativeRef = (fromFile: string, toFile: string): string => {
  const from = fromFile.split("/").slice(0, -1);
  const to = toFile.split("/");
  while (from.length > 0 && to.length > 1 && from[0] === to[0]) {
    from.shift();
    to.shift();
  }
  const ups = "../".repeat(from.length);
  return `${ups || "./"}${to.join("/")}`;
};

// Rewrites $refs in place to the local layout and returns the upstream
// paths (relative to ROOT) of every referenced file.
function rewriteRefs(node: unknown, fileUrl: URL, refs: Set<string>): void {
  if (Array.isArray(node)) {
    for (const value of node) rewriteRefs(value, fileUrl, refs);
    return;
  }
  if (node === null || typeof node !== "object") return;
  const record = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (key === "$ref" && typeof value === "string" && !value.startsWith("#")) {
      const [file, hash] = value.split("#");
      // Absolute refs carry a bogus host; resolve by path only.
      const target = new URL(new URL(file ?? "", fileUrl).pathname, ROOT).href;
      if (!target.startsWith(ROOT)) {
        throw new Error(`ref escapes spec root: ${value} (in ${fileUrl})`);
      }
      const upstreamRel = target.slice(ROOT.length);
      refs.add(upstreamRel);
      const from = localPath(fileUrl.href.slice(ROOT.length));
      record[key] = `${relativeRef(from, localPath(upstreamRel))}${hash ? `#${hash}` : ""}`;
    } else {
      rewriteRefs(value, fileUrl, refs);
    }
  }
}

const seen = new Set<string>();
const queue = ["spec/swagger.json"];

while (queue.length > 0) {
  const rel = queue.shift();
  if (!rel || seen.has(rel)) continue;
  seen.add(rel);

  const url = new URL(rel, ROOT);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  const json: unknown = await res.json();

  const refs = new Set<string>();
  rewriteRefs(json, url, refs);
  queue.push(...refs);

  const dest = new URL(localPath(rel), OUT);
  mkdirSync(new URL(".", dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(json, null, 2)}\n`);
}

console.log(`download-spec: fetched ${seen.size} files from ${ROOT}`);
