# Companies House SDK

A _modern_ Typescript SDK for the Companies House API.

## Usage

```ts
import { createCompaniesHouseClient } from "@jxdltd/companies-house";

const ch = createCompaniesHouseClient({ apiKey: process.env.CH_API_KEY! });

const { data } = await ch.getCompanyProfile({
  path: { company_number: "00445790" },
});
```

- Fully typed request parameters and responses for all 34 endpoints of the Public Data API.
- Thin by design: a typed transport over `fetch` with auth handled for you; bring your own retry, rate-limiting, or caching policy via the `fetch` option.
- Isolated instances: create as many clients as you need with different keys; nothing is shared or global.
- Verified daily: a scheduled integration suite runs every endpoint against the live API, catching upstream drift before you do.

## Prior Art

- [@companieshouse/api-sdk-node](https://github.com/companieshouse/api-sdk-node) - The official Node.js SDK, written in TypeScript and actively maintained. It is primarily built for Companies House's own internal web services (ERIC headers, auth propagation), uses an Either-style result pattern, and its docs and packaging are geared towards internal use rather than third-party developers.
- [companies-house](https://www.npmjs.com/package/companies-house) - Community JavaScript client, unmaintained (last published ~10 years ago).
- [companies-house-api](https://www.npmjs.com/package/companies-house-api) - Community client, explicitly marked as no longer supported.
- [companies-house-api-es6](https://www.npmjs.com/package/companies-house-api-es6) - ES6 community client, last published ~6 years ago.
- [companies-house-uk](https://github.com/nicewaytodoit/companies-house-uk) - Community package that maps API responses to more readable keys and enumerated values, rather than providing a full typed client.

In short: the official SDK exists but is designed around Companies House's internal needs, and the community alternatives are abandoned or narrow in scope. None offers a modern, fully typed, developer-friendly SDK for third-party TypeScript projects, which is the gap this SDK aims to fill.

## Stack

- [Hey API](https://heyapi.dev/) - Generates the typed client and TypeScript types from the Companies House OpenAPI specification, so the SDK stays in sync with the API surface.
- [Scalar](https://scalar.com/) - Powers the interactive API reference documentation from the same OpenAPI specification.
- [Vite+](https://viteplus.dev/) - Unified toolchain (`vp`) wrapping Vite, Rolldown, Vitest, tsdown, Oxlint, and Oxfmt for dev, build, test, lint, and formatting.
- [pnpm](https://pnpm.io/) workspaces - Monorepo layout with `apps/*`, `packages/*`, and `tools/*`, using catalog-pinned dependencies.
- [TypeScript](https://www.typescriptlang.org/) - Strictly typed throughout, published as ESM.
