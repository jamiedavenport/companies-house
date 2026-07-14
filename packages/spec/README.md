# @jxdltd/companies-house-spec

A curated OpenAPI 3.1 spec for the [Companies House Public Data API](https://developer.company-information.service.gov.uk/). Private workspace package, consumed by [`@jxdltd/companies-house`](../sdk) to generate its client.

```ts
import spec from "@jxdltd/companies-house-spec/openapi.json";
```

## How the spec is maintained

`spec/companies-house.json` is generated and maintained by two Claude Code skills, not by scripts:

- **`initial-spec`** builds the spec from scratch by scanning the live Developer Hub documentation and [companieshouse/api-sdk-node](https://github.com/companieshouse/api-sdk-node) (where Companies House ships endpoints before documenting them), under a strict "never invent, report gaps" rule.
- **`update-spec`** refreshes the committed spec in place, then regenerates the SDK and runs the checks and tests. The git diff is the review surface.

Both validate through the same gates: `redocly lint`, HeyAPI generation, type checking, and the SDK's live integration tests. Both apply a short list of standing curations where the documentation is provably wrong about the wire format (see the `update-spec` skill), and quarantine endpoints found only in api-sdk-node until the integration tests prove they answer to API-key auth.

## Why not the official OpenAPI spec?

Until July 2026 this package downloaded the official Swagger 2.0 spec and repaired it. That pipeline needed 374 lines of correction code to make the upstream spec usable at all:

- Nine distinct fix passes, each for one class of upstream defect: an undeclared HTTP Basic auth scheme (and references to a nonexistent `oauth2` one), path templates that disagreed with their parameter names, pre-Swagger `paramType`/`title` parameter syntax, sibling keys leaked into path items, pagination parameters wrongly marked required, charge `links` typed as an array when the API returns an object, and tag names unfit for rendering.
- One fix alone (`hoistObjectItems`) corrected **132** occurrences of a non-standard `{"type": "object", "items": ...}` construct that JSON Schema silently collapses to an untyped `{}`, which is why large parts of the old generated types were `unknown`.
- All 34 operation IDs hand-assigned, because upstream defines almost none.
- The download script itself absorbed two more quirks: `$ref` URLs pointing at Companies House's own localhost (`127.0.0.1:10000`), and a two-directory fragment layout spread over 20+ files.

Repair could not fix what upstream never wrote down. The official spec was missing fields the API has returned for years (search results lacked `title`, `address_snippet`, `matches`, and all pagination fields; advanced and dissolved search results had essentially no item schema), missed newer additions like the ECCTA `identity_verification_details` fields, and lags whole endpoints that exist in Companies House's own SDK. Every new upstream defect meant writing another fix, and the whole pipeline was coupled to the exact byte-level quirks of the Swagger 2.0 fragment layout, so any upstream restructuring would have forced a rewrite. Generating from the documentation and SDK source directly produces a more complete, more correct OpenAPI 3.1 document and degrades gracefully when upstream changes shape.

## Updating the spec

Run the `update-spec` skill in Claude Code, review the diff it presents, then regenerate the SDK client in `packages/sdk` (`vp run generate`) if the skill has not already done so, and commit both together.
