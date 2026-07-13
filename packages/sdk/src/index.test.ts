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

test("requests go through the provided fetch implementation", async () => {
  const calls: Request[] = [];
  const ch = createCompaniesHouseClient({
    apiKey: "test",
    fetch: (input) => {
      calls.push(input as Request);
      return Promise.resolve(Response.json({ company_number: "00445790" }));
    },
  });

  const { data, response } = await ch.getCompanyProfile({
    path: { company_number: "00445790" },
  });
  expect(calls.length).toBe(1);
  expect(response.status).toBe(200);
  expect(data?.company_number).toBe("00445790");
});
