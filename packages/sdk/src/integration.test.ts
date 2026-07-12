import { beforeAll, describe, expect, test } from "vite-plus/test";
import { createClient, createConfig } from "./generated/client/index.ts";
import { client, companyProfile, registeredOfficeAddress, searchCompanies } from "./index.ts";

const apiKey = process.env.CH_API_KEY;

// Companies House allows 600 requests per 5-minute window per key; this
// suite makes 5, so scheduled runs are nowhere near the limit.
describe.skipIf(!apiKey)("live Companies House API", () => {
  beforeAll(() => {
    client.setConfig({ auth: () => `${apiKey}:` });
  });

  test("companyProfile returns a known company", async () => {
    const { data, response } = await companyProfile({ path: { company_number: "00006400" } });
    expect(response.status).toBe(200);
    expect(data?.company_number).toBe("00006400");
    expect(data?.company_name).toBeTypeOf("string");
    expect(data?.date_of_creation).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("searchCompanies finds results", async () => {
    const { data, response } = await searchCompanies({ query: { q: "tesco", items_per_page: 5 } });
    expect(response.status).toBe(200);
    expect(data?.items?.length).toBeGreaterThan(0);
    expect(data?.items?.[0]?.company_number).toBeTypeOf("string");
  });

  test("registeredOfficeAddress returns an address", async () => {
    const { data, response } = await registeredOfficeAddress({
      path: { company_number: "00006400" },
    });
    expect(response.status).toBe(200);
    expect(data?.address_line_1 ?? data?.premises).toBeTypeOf("string");
  });

  test("unknown company returns 404", async () => {
    const { data, response } = await companyProfile({ path: { company_number: "OO000000" } });
    expect(response.status).toBe(404);
    expect(data).toBeUndefined();
  });
});

test("unauthenticated requests are rejected with 401", async () => {
  const anonymous = createClient(
    createConfig({ baseUrl: "https://api.company-information.service.gov.uk" }),
  );
  const { response } = await searchCompanies({ client: anonymous, query: { q: "test" } });
  expect(response.status).toBe(401);
});
