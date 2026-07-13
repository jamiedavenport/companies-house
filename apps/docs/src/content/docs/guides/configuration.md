---
title: Configuration
description: Client options, and how to add your own retry or rate-limiting policy.
---

```ts
const ch = createCompaniesHouseClient({
  apiKey: process.env.CH_API_KEY!, // required
  baseUrl: "https://api.company-information.service.gov.uk", // default
  fetch: globalThis.fetch, // bring your own fetch implementation
});
```

## Retries and rate limiting

The SDK deliberately ships no retry or rate-limiting policy; wrap the `fetch` option to add your own. For example, with [`fetch-retry`](https://www.npmjs.com/package/fetch-retry):

```ts
import fetchRetry from "fetch-retry";

const ch = createCompaniesHouseClient({
  apiKey: process.env.CH_API_KEY!,
  fetch: fetchRetry(globalThis.fetch),
});
```

The Companies House API rate limit is 600 requests per five-minute window; 429 responses include an `x-ratelimit-reset` header your policy can honor.
