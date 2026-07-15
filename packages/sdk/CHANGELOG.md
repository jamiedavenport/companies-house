# @jxdltd/companies-house

## 0.2.1

### Patch Changes

- de65cbc: Align the package README with the root README: banner, badges, blog link, and Work with us section

## 0.2.0

### Minor Changes

- 87c6e28: Regenerate the client from a new OpenAPI 3.1 spec built from the live Developer Hub documentation and Companies House's own SDK, replacing the repaired upstream Swagger 2.0 spec. All 34 method names are unchanged. Types are substantially more complete and correct:

  - Search results are now fully typed (`title`, `address_snippet`, `snippet`, `matches`, `links`, and pagination fields were previously missing; advanced, dissolved, and alphabetical search items had no schema at all).
  - Fields the old spec left as `unknown` are now typed, including company profile sub-objects (`accounts`, `confirmation_statement`, `foreign_company_details`, `links`), `registers`, and officer `name_elements`.
  - Shapes the old spec misdescribed are corrected and verified against the live API: `exemptions` and `registers` are objects (not arrays), officer `date_of_birth` is an object, and search `hits` is a number.
  - New ECCTA fields such as `identity_verification_details` on officers and PSCs are included.

  Breaking for code that referenced the old shapes: `listCharges` pagination params are now snake_case `items_per_page`/`start_index` (previously `itemsPerPage`/`startIndex`; verified live), and `advancedCompanySearch`'s `company_status` and `company_type` filters take arrays.
