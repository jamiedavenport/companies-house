// Fixes for the bundled Companies House Swagger 2.0 spec, applied in the
// order they appear by fix-spec.ts. Each corrects a defect in the upstream
// spec that would otherwise break codegen or misrepresent the live API.
import { OPERATION_IDS } from "./operation-ids.ts";
import type { Operation, PathItem, Spec } from "./types.ts";

const METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch"]);

const operations = (item: PathItem): [string, Operation][] =>
  Object.entries(item).filter(([method]) => METHODS.has(method)) as [string, Operation][];

const allOperations = (spec: Spec): [string, string, Operation][] =>
  Object.entries(spec.paths).flatMap(([path, item]) =>
    operations(item).map(([method, op]): [string, string, Operation] => [path, method, op]),
  );

const camel = (s: string): string => {
  const parts = s.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return parts
    .map((p, i) => (i === 0 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1)))
    .join("");
};

// The spec declares an "api_key" header scheme, but the API actually
// authenticates with HTTP basic auth (API key as username, blank password).
// Operations also reference an undefined "oauth2" scheme.
export function fixSecurity(spec: Spec): void {
  spec.securityDefinitions = { api_key: { type: "basic" } };
  for (const [, , op] of allOperations(spec)) {
    op.security = op.security?.map((s) => ("oauth2" in s ? { api_key: [] } : s));
  }
}

// Path templates and parameter names disagree in places, e.g.
// "/company/{companyNumber}" declares a "company_number" parameter, and one
// PSC path never declares its "company_number" placeholder at all. Rename
// placeholders to the declared parameter names and synthesize the missing
// parameters so the client can substitute every placeholder.
export function fixPathTemplates(spec: Spec): void {
  for (const [path, item] of Object.entries({ ...spec.paths })) {
    const placeholders = [...path.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
    if (placeholders.length === 0) continue;

    const ops = operations(item);
    const paramNames = new Set(
      ops.flatMap(([, op]) =>
        (op.parameters ?? []).filter((p) => p.in === "path").map((p) => p.name),
      ),
    );

    const unmatchedParams = [...paramNames].filter((n) => n && !placeholders.includes(n));
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
}

// Fragment files leak sibling keys (e.g. "definitions") into path items.
export function stripLeakedPathItemKeys(spec: Spec): void {
  for (const item of Object.values(spec.paths)) {
    for (const key of Object.keys(item)) {
      if (!METHODS.has(key) && key !== "parameters") delete item[key];
    }
  }
}

// The charges endpoints use pre-Swagger "paramType"/"title" keys.
export function fixLegacyParameters(spec: Spec): void {
  for (const [, , op] of allOperations(spec)) {
    for (const param of op.parameters ?? []) {
      if (param.paramType && !param.in) {
        param.in = param.paramType === "form" ? "formData" : param.paramType;
      }
      delete param.paramType;
      if (!param.name && param.title) param.name = camel(param.title);
    }
  }
}

// Most upstream operations have no operationId; assign the explicit names
// from operation-ids.ts and derive unique fallbacks for anything unmapped.
export function assignOperationIds(spec: Spec): number {
  const seenIds = new Set<string>();
  for (const [path, method, op] of allOperations(spec)) {
    const explicit = OPERATION_IDS[`${method} ${path}`];
    if (explicit) {
      op.operationId = explicit;
    } else if (!op.operationId) {
      const base = camel(op["x-operationName"] ?? op.summary ?? `${method} ${path}`);
      let id = base;
      for (let i = 2; seenIds.has(id); i++) id = `${base}${i}`;
      op.operationId = id;
    }
    if (seenIds.has(op.operationId)) {
      throw new Error(`duplicate operationId: ${op.operationId}`);
    }
    seenIds.add(op.operationId);
  }
  return seenIds.size;
}

// The spec widely uses `{ "type": "object", "items": { "$ref": ... } }` with
// two distinct meanings: for properties named "items" it means a real array
// (every list resource returns "items": [...]), and everywhere else it means
// "an object with the referenced shape". JSON Schema ignores "items" on
// objects, which collapses both to {}. Convert each to its intended schema.
export function hoistObjectItems(root: unknown): number {
  let hoisted = 0;
  const visit = (node: unknown, key: string): void => {
    if (Array.isArray(node)) {
      for (const value of node) visit(value, key);
      return;
    }
    if (node === null || typeof node !== "object") return;
    const schema = node as Record<string, unknown>;
    if (schema.type === "object" && schema.items && !schema.properties) {
      const { items } = schema;
      for (const k of Object.keys(schema)) delete schema[k];
      if (key === "items") {
        Object.assign(schema, { type: "array", items });
      } else {
        Object.assign(schema, items);
      }
      hoisted++;
    }
    for (const [k, value] of Object.entries(schema)) visit(value, k);
  };
  visit(root, "");
  return hoisted;
}

// The spec types chargeDetails.links as an array, but the live API returns
// a single links object ({"self": ...}).
export function fixChargeLinks(spec: Spec): void {
  spec.definitions.chargeDetails.properties.links = { $ref: "#/definitions/charge_links" };
}

// PSC list endpoints wrongly mark their pagination query parameters as
// required (and type them as strings, unlike every other endpoint); the live
// API accepts requests without them and parses numbers.
export function relaxPaginationParams(spec: Spec): void {
  for (const [, , op] of allOperations(spec)) {
    for (const param of op.parameters ?? []) {
      if (
        param.in === "query" &&
        ["items_per_page", "start_index", "register_view"].includes(param.name ?? "")
      ) {
        param.required = false;
        if (param.name !== "register_view") param.type = "integer";
      }
    }
  }
}

// Tag names are camelCase identifiers, which reference UIs like Scalar render
// verbatim in the sidebar. Surface each tag's description as its
// x-displayName, and drop tags that no operation references.
export function normalizeTags(spec: Spec): void {
  const usedTags = new Set(allOperations(spec).flatMap(([, , op]) => op.tags ?? []));
  spec.tags = (spec.tags ?? [])
    .filter((tag) => usedTags.has(tag.name))
    .map((tag) => ({ ...tag, "x-displayName": tag["x-displayName"] ?? tag.description }));
}
