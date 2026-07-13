---
title: Error Handling
description: Work with the result shape, or opt into throwing variants.
---

Calls return `{ data, error, response }` rather than throwing on API errors:

```ts
const { data, error, response } = await ch.getCompanyProfile({
  path: { company_number: "00000000" },
});

if (error) {
  console.error(response.status, error);
}
```

## Throwing variants

Pass `throwOnError: true` on a call to get a throwing variant with non-optional `data`:

```ts
const { data } = await ch.getCompanyProfile({
  path: { company_number: "00445790" },
  throwOnError: true,
});
```
