import { expect, test } from "vite-plus/test";
import { client, CompaniesHouse, createCompaniesHouseClient } from "./index.ts";

test("default client is configured with the Companies House base URL", () => {
  expect(client.getConfig().baseUrl).toBe("https://api.company-information.service.gov.uk");
});

test("createCompaniesHouseClient returns an isolated SDK instance", () => {
  const ch = createCompaniesHouseClient({ apiKey: "test" });
  expect(ch).toBeInstanceOf(CompaniesHouse);
  expect(typeof ch.getCompanyProfile).toBe("function");
});

test("retry waits for the rate-limit window on 429", async () => {
  const responses = [
    new Response("slow down", {
      status: 429,
      headers: { "x-ratelimit-reset": String(Math.ceil(Date.now() / 1000) + 1) },
    }),
    Response.json({ company_number: "00445790" }),
  ];
  const calls: Request[] = [];
  const ch = createCompaniesHouseClient({
    apiKey: "test",
    fetch: (input) => {
      calls.push(input as Request);
      return Promise.resolve(responses[calls.length - 1] as Response);
    },
  });

  const { data, response } = await ch.getCompanyProfile({
    path: { company_number: "00445790" },
  });
  expect(calls.length).toBe(2);
  expect(response.status).toBe(200);
  expect(data?.company_number).toBe("00445790");
});

test("retry gives up after maxRetries on 5xx", async () => {
  let calls = 0;
  const ch = createCompaniesHouseClient({
    apiKey: "test",
    retry: { maxRetries: 2, backoffBaseMs: 1 },
    fetch: () => {
      calls++;
      return Promise.resolve(new Response("boom", { status: 502 }));
    },
  });

  const { response } = await ch.getCompanyProfile({ path: { company_number: "00445790" } });
  expect(response.status).toBe(502);
  expect(calls).toBe(3);
});
