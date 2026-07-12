// Normalizes the bundled Companies House Swagger 2.0 spec so that
// @hey-api/openapi-ts can parse it. The upstream spec is a multi-file
// fragment layout with several non-standard constructs.
import { readFileSync, writeFileSync } from "node:fs";

const SPEC = new URL("../spec/bundled.json", import.meta.url);
const METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch"]);

const spec = JSON.parse(readFileSync(SPEC, "utf8"));

// The spec declares an "api_key" header scheme, but the API actually
// authenticates with HTTP basic auth (API key as username, blank password).
spec.securityDefinitions = { api_key: { type: "basic" } };

const camel = (s) => {
  const parts = s.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return parts
    .map((p, i) => (i === 0 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1)))
    .join("");
};

const seenIds = new Set();

// Path templates and parameter names disagree in places, e.g.
// "/company/{companyNumber}" declares a "company_number" parameter, and one
// PSC path never declares its "company_number" placeholder at all. Rename
// placeholders to the declared parameter names and synthesize the missing
// parameters so the client can substitute every placeholder.
for (const [path, item] of Object.entries({ ...spec.paths })) {
  const placeholders = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
  if (placeholders.length === 0) continue;

  const ops = Object.entries(item).filter(([m]) => METHODS.has(m));
  const paramNames = new Set(
    ops.flatMap(([, op]) =>
      (op.parameters ?? []).filter((p) => p.in === "path").map((p) => p.name),
    ),
  );

  const unmatchedParams = [...paramNames].filter((n) => !placeholders.includes(n));
  let newPath = path;
  for (const ph of placeholders.filter((p) => !paramNames.has(p))) {
    const replacement = unmatchedParams.shift();
    if (replacement) {
      newPath = newPath.replace(`{${ph}}`, `{${replacement}}`);
    } else {
      for (const [, op] of ops) {
        op.parameters ??= [];
        op.parameters.push({ name: ph, in: "path", required: true, type: "string" });
      }
    }
  }
  if (newPath !== path) {
    delete spec.paths[path];
    spec.paths[newPath] = item;
  }
}

for (const [path, item] of Object.entries(spec.paths)) {
  // Fragment files leak sibling keys (e.g. "definitions") into path items.
  for (const key of Object.keys(item)) {
    if (!METHODS.has(key) && key !== "parameters") delete item[key];
  }

  for (const [method, op] of Object.entries(item)) {
    if (!METHODS.has(method)) continue;

    // The charges endpoints use pre-Swagger "paramType"/"title" keys.
    for (const param of op.parameters ?? []) {
      if (param.paramType && !param.in) {
        param.in = param.paramType === "form" ? "formData" : param.paramType;
      }
      delete param.paramType;
      if (!param.name && param.title) param.name = camel(param.title);
    }

    // Operations reference an undefined "oauth2" scheme; the API actually
    // authenticates with an API key sent via HTTP basic auth.
    if (op.security) {
      op.security = op.security.map((s) => ("oauth2" in s ? { api_key: [] } : s));
    }

    if (!op.operationId) {
      const base = camel(op["x-operationName"] ?? op.summary ?? `${method} ${path}`);
      let id = base;
      for (let i = 2; seenIds.has(id); i++) id = `${base}${i}`;
      op.operationId = id;
    }
    seenIds.add(op.operationId);
  }
}

writeFileSync(SPEC, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`fix-spec: normalized ${seenIds.size} operations`);
