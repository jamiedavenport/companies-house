# @jxdltd/companies-house

A modern TypeScript SDK for the [Companies House Public Data API](https://developer.company-information.service.gov.uk/).

- Fully typed request parameters and responses for all 34 endpoints of the Public Data API.
- Thin by design: a typed transport over `fetch` with auth handled for you; bring your own retry, rate-limiting, or caching policy via the `fetch` option.
- Isolated instances: create as many clients as you need with different keys; nothing is shared or global.
- Verified daily: a scheduled integration suite runs every endpoint against the live API, catching upstream drift.

Read the story behind it: [Companies House's API spec is broken. Ours isn't.](https://www.jxd.dev/blog/companies-house-sdk)

## Installation

```sh
npm install @jxdltd/companies-house
```

Requires Node.js 22.18 or later. The SDK authenticates with your API key, so use it server-side only; never ship the key to a browser.

## Getting started

Get a REST API key from the [Companies House developer hub](https://developer.company-information.service.gov.uk/), then:

```ts
import { createCompaniesHouseClient } from "@jxdltd/companies-house";

const ch = createCompaniesHouseClient({ apiKey: process.env.CH_API_KEY! });

const { data } = await ch.getCompanyProfile({
  path: { company_number: "00445790" },
});

console.log(data?.company_name); // "TESCO PLC"
```

Every endpoint is a method on the client, including search:

```ts
const { data } = await ch.searchCompanies({
  query: { q: "lego", items_per_page: 10 },
});
```

## Handling errors

Calls return `{ data, error, response }` rather than throwing on API errors:

```ts
const { data, error, response } = await ch.getCompanyProfile({
  path: { company_number: "00000000" },
});

if (error) {
  console.error(response.status, error);
}
```

Pass `throwOnError: true` on a call to get a throwing variant with non-optional `data`:

```ts
const { data } = await ch.getCompanyProfile({
  path: { company_number: "00445790" },
  throwOnError: true,
});
```

## Configuration

```ts
const ch = createCompaniesHouseClient({
  apiKey: process.env.CH_API_KEY!, // required
  baseUrl: "https://api.company-information.service.gov.uk", // default
  fetch: globalThis.fetch, // bring your own fetch implementation
});
```

The SDK deliberately ships no retry or rate-limiting policy; wrap the `fetch` option to add your own. For example, with [`fetch-retry`](https://www.npmjs.com/package/fetch-retry):

```ts
import fetchRetry from "fetch-retry";

const ch = createCompaniesHouseClient({
  apiKey: process.env.CH_API_KEY!,
  fetch: fetchRetry(globalThis.fetch),
});
```

The Companies House API rate limit is 600 requests per five-minute window; 429 responses include an `x-ratelimit-reset` header your policy can honor.

## License

[MIT](./LICENSE)
