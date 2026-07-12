// Normalizes the bundled Companies House Swagger 2.0 spec so that
// @hey-api/openapi-ts can parse it. The upstream spec is a multi-file
// fragment layout with several non-standard constructs.
import { readFileSync, writeFileSync } from "node:fs";

const SPEC = new URL("../spec/companies-house.json", import.meta.url);
const METHODS = new Set(["get", "put", "post", "delete", "options", "head", "patch"]);

// Most upstream operations have no operationId, producing generated names
// like "list2". Explicit names for every operation, keyed by method + path
// (after the path-template fixes below).
const OPERATION_IDS = {
  "get /search": "searchAll",
  "get /search/companies": "searchCompanies",
  "get /search/officers": "searchOfficers",
  "get /search/disqualified-officers": "searchDisqualifiedOfficers",
  "get /dissolved-search/companies": "searchDissolvedCompanies",
  "get /alphabetical-search/companies": "searchCompaniesAlphabetically",
  "get /advanced-search/companies": "advancedCompanySearch",
  "get /company/{company_number}": "getCompanyProfile",
  "get /company/{company_number}/registered-office-address": "getRegisteredOfficeAddress",
  "get /company/{company_number}/officers": "listOfficers",
  "get /company/{company_number}/appointments/{appointment_id}": "getOfficerAppointment",
  "get /officers/{officer_id}/appointments": "listOfficerAppointments",
  "get /company/{company_number}/registers": "getRegisters",
  "get /company/{company_number}/filing-history": "listFilingHistory",
  "get /company/{company_number}/filing-history/{transaction_id}": "getFilingHistoryItem",
  "get /company/{company_number}/exemptions": "getExemptions",
  "get /disqualified-officers/natural/{officer_id}": "getNaturalDisqualification",
  "get /disqualified-officers/corporate/{officer_id}": "getCorporateDisqualification",
  "get /company/{company_number}/charges": "listCharges",
  "get /company/{company_number}/charges/{charge_id}": "getCharge",
  "get /company/{company_number}/insolvency": "getInsolvency",
  "get /company/{company_number}/uk-establishments": "listUkEstablishments",
  "get /company/{company_number}/persons-with-significant-control":
    "listPersonsWithSignificantControl",
  "get /company/{company_number}/persons-with-significant-control/individual/{notification_id}":
    "getIndividualPsc",
  "get /company/{company_number}/persons-with-significant-control/individual-beneficial-owner/{notification_id}":
    "getIndividualBeneficialOwner",
  "get /company/{company_number}/persons-with-significant-control/corporate-entity/{notification_id}":
    "getCorporateEntityPsc",
  "get /company/{company_number}/persons-with-significant-control/corporate-entity-beneficial-owner/{notification_id}":
    "getCorporateEntityBeneficialOwner",
  "get /company/{company_number}/persons-with-significant-control/legal-person/{notification_id}":
    "getLegalPersonPsc",
  "get /company/{company_number}/persons-with-significant-control/legal-person-beneficial-owner/{notification_id}":
    "getLegalPersonBeneficialOwner",
  "get /company/{company_number}/persons-with-significant-control-statements": "listPscStatements",
  "get /company/{company_number}/persons-with-significant-control-statements/{statement_id}":
    "getPscStatement",
  "get /company/{company_number}/persons-with-significant-control/super-secure/{super_secure_id}":
    "getSuperSecurePsc",
  "get /company/{company_number}/persons-with-significant-control/super-secure-beneficial-owner/{super_secure_id}":
    "getSuperSecureBeneficialOwner",
  "get /company/{company_number}/persons-with-significant-control/{psc_id}/notifications":
    "listPscNotifications",
};

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
}

// The spec widely uses `{ "type": "object", "items": { "$ref": ... } }` with
// two distinct meanings: for properties named "items" it means a real array
// (every list resource returns "items": [...]), and everywhere else it means
// "an object with the referenced shape". JSON Schema ignores "items" on
// objects, which collapses both to {}. Convert each to its intended schema.
let hoisted = 0;
const hoistObjectItems = (node, key) => {
  if (Array.isArray(node)) {
    for (const value of node) hoistObjectItems(value, key);
    return;
  }
  if (node === null || typeof node !== "object") return;
  if (node.type === "object" && node.items && !node.properties) {
    const { items } = node;
    for (const k of Object.keys(node)) delete node[k];
    if (key === "items") {
      Object.assign(node, { type: "array", items });
    } else {
      Object.assign(node, items);
    }
    hoisted++;
  }
  for (const [k, value] of Object.entries(node)) hoistObjectItems(value, k);
};
hoistObjectItems(spec.definitions, "");

// The spec types chargeDetails.links as an array, but the live API returns
// a single links object ({"self": ...}).
spec.definitions.chargeDetails.properties.links = { $ref: "#/definitions/charge_links" };

// PSC list endpoints wrongly mark their pagination query parameters as
// required; the live API accepts requests without them.
for (const item of Object.values(spec.paths)) {
  for (const [method, op] of Object.entries(item)) {
    if (!METHODS.has(method)) continue;
    for (const param of op.parameters ?? []) {
      if (
        param.in === "query" &&
        ["items_per_page", "start_index", "register_view"].includes(param.name)
      ) {
        param.required = false;
      }
    }
  }
}

writeFileSync(SPEC, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`fix-spec: normalized ${seenIds.size} operations, hoisted ${hoisted} object schemas`);
