---
name: update-spec
description: Refresh packages/spec/spec/companies-house.json in place by re-checking the live Developer Hub docs and companieshouse/api-sdk-node, then regenerate the SDK, run the checks and tests, and present the diff. Use for drift detection or whenever upstream may have changed.
---

# update-spec

Bring the committed OpenAPI 3.1 spec (`packages/spec/spec/companies-house.json`)
back in line with the live API surface, editing it in place. The spec is
committed, so `git diff` is the comparison and review surface; validation is
the SDK regeneration plus tests.

## Sources of truth, in order of authority

1. The live API (via the integration tests) for anything disputed.
2. **Developer Hub docs** - the reference index at
   `https://developer-specs.company-information.service.gov.uk/companies-house-public-data-api/reference`
   and each operation/resource page under it (append `?v=latest`).
3. **companieshouse/api-sdk-node** (GitHub, read via `gh api`, never clone) -
   route literals in `src/services/*/service.ts` and snake_case `*Resource`
   types. Companies House ships endpoints here before documenting them.

Never invent: every path, parameter, field, type, and enum value must be
traceable to a source. An ambiguous or unfetchable page is reported as a gap,
not guessed at.

## Procedure

1. **Detect drift.** Compare the committed spec's operations against (a) the
   docs reference index and (b) api-sdk-node's route literals. For schema
   drift, fan out subagents per endpoint group (see `initial-spec` for the
   grouping), giving each agent the committed schema for its operations and
   asking it to report only differences against the docs.
2. **Apply.** Edit `packages/spec/spec/companies-house.json` directly:
   - New fields/operations from the docs: usually real; add them.
   - Fields that disappeared from the docs: suspicious. Docs pages
     intermittently render incompletely; re-fetch before dropping a
     published type.
   - Wire format is snake_case; keep documented typos verbatim
     (`assests_ceased_released`, `unfiletered_count`).
   - operationIds are published SDK method names; never change existing ones.
     New operations get names in the same style (`getCompanyProfile`,
     `listOfficers`, ...).
   - Respect the standing curations below.
3. **Validate.** `redocly lint` the spec (CLI in
   `packages/spec/node_modules/.bin`), then in `packages/sdk`:
   `vp run generate`, `vp check`, `vp test run`. Review the `src/generated/`
   diff; method names and existing param names must not change without a
   deliberate, stated decision.
4. **Deliver.** Present the spec diff and what drove each change. Never
   commit or push; that is the user's call. When run unattended (schedule),
   report the drift and leave the working tree changes for review; no drift
   means saying so in one line.

## Standing curations (docs are wrong; live API wins)

Reapply these whenever the affected areas are touched; do not "correct" them
back to the docs:

- **Charge links are objects.** The docs type `links` on charge details,
  charge transactions, and charge insolvency cases as arrays; the live API
  returns a single links object in each case.
- **Charges list paginates.** The charges operation page documents no
  pagination parameters; the spec carries optional integer `items_per_page`
  and `start_index` (verified against the live API 2026-07-14:
  `items_per_page=1` returns one of nine charges).
- **Search `hits` is an integer.** Docs say string; api-sdk-node types it
  `number` and the live API returns one.
- **sdkOnly quarantine.** Endpoints found only in api-sdk-node (currently:
  company metrics, late-filing penalties, advanced-search CSV, condensed SIC
  codes) stay OUT of the spec until the integration tests prove they answer
  to key auth. Track them in the report; promote only with test coverage.

## Failure handling

If extraction is partial (agents failed, docs unreachable), stop and report.
Never leave the committed spec half-updated: apply a coherent set of changes
or revert to HEAD with `git checkout -- packages/spec/spec/companies-house.json`.
