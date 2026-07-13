# @jxdltd/companies-house-spec

A curated OpenAPI spec for the [Companies House Public Data API](https://developer.company-information.service.gov.uk/), plus the scripts that maintain it. Private workspace package, consumed by [`@jxdltd/companies-house`](../sdk) to generate its client.

The upstream spec published by Companies House is a multi-file Swagger 2.0 fragment layout with a number of defects that break codegen or misrepresent the live API. This package downloads it, bundles it into a single file, and applies targeted fixes to produce `spec/companies-house.json`, exported as:

```ts
import spec from "@jxdltd/companies-house-spec/openapi.json";
```

## Layout

- `spec/swagger.json` - upstream entry point, with `$ref`s into the sibling fragment files and `spec/models/`.
- `spec/companies-house.json` - the bundled, corrected output. This is the only file consumers should use.
- `src/download-spec.ts` - downloads the upstream fragments.
- `src/fix-spec.ts` - applies the fixes to the bundled spec; individual fixes live in `src/fixes.ts`.

## Updating the spec

```sh
vp run download-spec   # re-fetch the upstream fragments into spec/
vp run update-spec     # bundle with Redocly and apply the fixes
```

`download-spec` starts from `swagger.json` and follows `$ref`s, so the file list never needs hardcoding. It also absorbs two upstream quirks: absolute `$ref` URLs pointing at Companies House's own localhost, and a two-directory fragment layout that is flattened locally.

`update-spec` bundles the fragments with `redocly bundle`, then runs `fix-spec.ts`. Each fix corrects one upstream defect, including:

- Declaring the HTTP Basic security scheme the API actually uses.
- Fixing malformed path templates and legacy parameter definitions.
- Assigning stable `operationId`s (see `src/operation-ids.ts`), which become the SDK's method names.
- Hoisting object `items`, stripping leaked path-item keys, normalizing tags, and relaxing pagination parameter constraints.

After updating, regenerate the SDK with `vp run generate` in `packages/sdk` and review the diff of `src/generated/`.
