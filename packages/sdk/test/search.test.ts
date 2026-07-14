import { expect, test } from "vite-plus/test";
import { createClient, createConfig } from "../src/generated/client/index.ts";
import { ch, describeLive, expectData } from "./fixtures.ts";

describeLive("search endpoints", () => {
  test("searchAll returns mixed results", async () => {
    const data = expectData(await ch.searchAll({ query: { q: "tesco", items_per_page: 5 } }));
    expect(data.items?.length).toBeGreaterThan(0);
  });

  test("searchCompanies finds companies", async () => {
    const data = expectData(await ch.searchCompanies({ query: { q: "tesco", items_per_page: 5 } }));
    expect(data.items?.length).toBeGreaterThan(0);
    expect(data.items?.[0]?.company_number).toBeTypeOf("string");
  });

  test("searchOfficers finds officers", async () => {
    const data = expectData(await ch.searchOfficers({ query: { q: "smith", items_per_page: 5 } }));
    expect(data.items?.length).toBeGreaterThan(0);
  });

  test("searchDisqualifiedOfficers finds officers", async () => {
    const data = expectData(
      await ch.searchDisqualifiedOfficers({ query: { q: "smith", items_per_page: 5 } }),
    );
    expect(data.items?.length).toBeGreaterThan(0);
  });

  test("searchDissolvedCompanies finds companies", async () => {
    // search_type is required, and the documented default "best-match"
    // returns 404; "alphabetical" and "previous-name-dissolved" work.
    const data = expectData(
      await ch.searchDissolvedCompanies({
        query: { q: "woolworths", search_type: "alphabetical" },
      }),
    );
    expect(data.items?.length).toBeGreaterThan(0);
  });

  test("searchCompaniesAlphabetically finds companies", async () => {
    const data = expectData(await ch.searchCompaniesAlphabetically({ query: { q: "tesco" } }));
    expect(data.items?.length).toBeGreaterThan(0);
  });

  test("advancedCompanySearch filters companies", async () => {
    const data = expectData(
      await ch.advancedCompanySearch({
        query: { company_name_includes: "tesco", company_status: ["active"] },
      }),
    );
    expect(data.items?.length).toBeGreaterThan(0);
  });
});

test("unauthenticated requests are rejected with 401", async () => {
  const anonymous = createClient(
    createConfig({ baseUrl: "https://api.company-information.service.gov.uk" }),
  );
  const { response } = await ch.searchCompanies({ client: anonymous, query: { q: "test" } });
  expect(response.status).toBe(401);
});
