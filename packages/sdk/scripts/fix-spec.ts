// Normalizes the bundled Companies House Swagger 2.0 spec so that
// @hey-api/openapi-ts can parse it. The upstream spec is a multi-file
// fragment layout with several non-standard constructs; each fix in
// fixes.ts corrects one of them.
import { readFileSync, writeFileSync } from "node:fs";
import {
  assignOperationIds,
  fixChargeLinks,
  fixLegacyParameters,
  fixPathTemplates,
  fixSecurity,
  hoistObjectItems,
  normalizeTags,
  relaxPaginationParams,
  stripLeakedPathItemKeys,
} from "./fixes.ts";
import type { Spec } from "./types.ts";

const SPEC = new URL("../spec/companies-house.json", import.meta.url);

const spec = JSON.parse(readFileSync(SPEC, "utf8")) as Spec;

fixSecurity(spec);
fixPathTemplates(spec);
stripLeakedPathItemKeys(spec);
fixLegacyParameters(spec);
const operationCount = assignOperationIds(spec);
const hoisted = hoistObjectItems(spec.definitions);
fixChargeLinks(spec);
relaxPaginationParams(spec);
normalizeTags(spec);

writeFileSync(SPEC, `${JSON.stringify(spec, null, 2)}\n`);
console.log(`fix-spec: normalized ${operationCount} operations, hoisted ${hoisted} object schemas`);
