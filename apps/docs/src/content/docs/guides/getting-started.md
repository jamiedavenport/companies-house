---
title: Getting Started
description: Install the SDK, create a client, and make your first request.
---

## Installation

```sh
npm install @jxdltd/companies-house
```

Requires Node.js 22.18 or later. The SDK authenticates with your API key, so use it server-side only; never ship the key to a browser.

## Get an API key

Get a REST API key from the [Companies House developer hub](https://developer.company-information.service.gov.uk/). Register an application and create a **live** key for the Public Data API.

## Make your first request

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

Browse every endpoint, parameter, and response shape in the [API Reference](/reference).
