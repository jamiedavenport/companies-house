---
name: initial-spec
description: Build the Companies House Public Data API spec as OpenAPI 3.1 from scratch by scanning the live Developer Hub docs and companieshouse/api-sdk-node, then validate it with Redocly and the HeyAPI generator. Use when bootstrapping or fully regenerating the spec without relying on the upstream swagger fragments.
---

# initial-spec

Produce a complete OpenAPI 3.1 spec for the Companies House Public Data API
(`https://api.company-information.service.gov.uk`) from primary sources, not
from the upstream Swagger 2.0 fragments. Output defaults to
`packages/spec/spec/companies-house.json`; an argument may override the output
path (use a scratch path for dry runs and comparisons).

## Sources of truth, in order of authority

1. **Developer Hub docs** - the reference index at
   `https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference`
   and each operation/resource page under it (append `?v=latest`). These carry
   parameters, response codes, and field tables.
2. **companieshouse/api-sdk-node** (GitHub) - route string literals in
   `src/services/*/service.ts` and wire-format `*Resource` types in
   `src/services/*/types.ts`. Companies House ships endpoints here before
   documenting them. Use `gh api` to read files; never clone.
3. The live API, only when a key is available, to break ties (401/404 checks).

## Ground rules

- **Never invent.** Every path, parameter, field, type, and enum value must be
  traceable to source 1 or 2. If a page fails to fetch or a table is ambiguous,
  record it in a `gaps` list and move on; a reported hole beats a guessed fill.
- Wire format is snake_case; do not camelCase anything. api-sdk-node's mapped
  camelCase types are NOT wire truth; only its `*Resource` types are.
- Only include endpoints that belong to the public read-only surface. An
  endpoint found only in api-sdk-node is included only if it is key-auth
  reachable (or flagged in `gaps` as unverified).

## Procedure

1. **Enumerate.** Fetch the reference index and list every operation. List
   api-sdk-node `src/services` route literals; union, flagging SDK-only routes.
2. **Fan out.** Spawn one subagent per endpoint group (search, company core,
   officers, filings/charges/insolvency/exemptions/establishments, PSC, plus
   one api-sdk-node scanner). Each agent writes an OpenAPI 3.1 fragment
   `{"paths": {...}, "components": {"schemas": {...}}}` to a fragments
   directory and reports operations covered plus gaps. Fragments must be
   self-contained: local `#/components/schemas/...` refs only; shared shapes
   (e.g. Address) are duplicated per fragment and deduplicated at assembly.
3. **Assemble and curate.** Merge the fragments into one document (a scratch
   script is fine; don't commit it): identical schema names with identical
   shapes merge, conflicting shapes get a group suffix; add `info`, `servers`,
   and HTTP Basic security (API key as username). Then apply the standing
   curations listed in the `update-spec` skill (docs-vs-live overrides) and
   quarantine `sdkOnly` candidates out of the spec.
4. **Validate.** `redocly lint` the curated spec (CLI in
   `packages/spec/node_modules/.bin`); fix structural errors. Then run the
   HeyAPI generator (`@hey-api/openapi-ts`, same plugins as
   `packages/sdk/openapi-ts.config.ts`) against it and confirm it generates
   without errors.
5. **Report.** Emit the spec, the consolidated `gaps` list, and (for dry runs)
   a comparison against the committed spec if one exists.

## Conventions

- `openapi: 3.1.0`. One `get`/`post` per path as documented.
- `operationId`s are published SDK method names and must not drift: when a
  committed spec exists, reuse its operationId for every method+path it
  covers. New endpoints get a name in the same style (`searchCompanies`,
  `getCompanyProfile`, `listOfficers`, ...).
- Schema names are UpperCamelCase resource names matching the docs
  (`CompanyProfile`, `OfficerList`). Response `links` objects and `items`
  arrays are typed, not free-form objects.
- Parameters: document `items_per_page`, `start_index` and friends as plain
  optional integers (no max, mirroring `relaxPaginationParams`).
- Every operation documents `200` (or documented success code) with a JSON
  schema, plus documented error codes with no body unless the docs give one.
- Enum values are captured only when the docs list them inline; otherwise use
  `string` and keep the description's pointer to the enumeration constants.

## Failure handling

If more than two fragment agents fail to produce output, stop and report
rather than assembling a partial spec. Reruns are cheap; a silently thin spec
is not.
