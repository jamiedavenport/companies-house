import { expect, test } from "vite-plus/test";
import { ch, describeLive, expectData, fixtures, idFromLink } from "./fixtures.ts";

describeLive("company endpoints", () => {
  test("companyProfile returns a known company", async () => {
    const data = expectData(
      await ch.getCompanyProfile({ path: { company_number: fixtures.company } }),
    );
    expect(data.company_number).toBe(fixtures.company);
    expect(data.company_name).toBeTypeOf("string");
    expect(data.date_of_creation).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("companyProfile returns 404 for an unknown company", async () => {
    const { data, response } = await ch.getCompanyProfile({ path: { company_number: "OO000000" } });
    expect(response.status).toBe(404);
    expect(data).toBeUndefined();
  });

  test("registeredOfficeAddress returns an address", async () => {
    const data = expectData(
      await ch.getRegisteredOfficeAddress({ path: { company_number: fixtures.company } }),
    );
    expect(data.address_line_1 ?? data.premises).toBeTypeOf("string");
  });

  test("filing history list and item", async () => {
    const history = expectData(
      await ch.listFilingHistory({
        path: { company_number: fixtures.company },
        query: { items_per_page: 1 },
      }),
    );
    const transactionId = history.items?.[0]?.transaction_id;
    expect(transactionId).toBeTypeOf("string");

    const item = expectData(
      await ch.getFilingHistoryItem({
        path: { company_number: fixtures.company, transaction_id: transactionId! },
      }),
    );
    expect(item.transaction_id).toBe(transactionId);
  });

  test("charges list and charge detail", async () => {
    const charges = expectData(
      await ch.listCharges({ path: { company_number: fixtures.company } }),
    );
    expect(charges.total_count).toBeGreaterThan(0);
    const chargeId = idFromLink(charges.items?.[0]?.links?.self);
    expect(chargeId).not.toBe("");

    const charge = expectData(
      await ch.getCharge({ path: { company_number: fixtures.company, charge_id: chargeId } }),
    );
    expect(charge.charge_number ?? charge.charge_code).toBeDefined();
  });

  test("exemptions returns PSC exemptions", async () => {
    const data = expectData(await ch.getExemptions({ path: { company_number: fixtures.company } }));
    expect(data.exemptions).toBeDefined();
  });

  test("insolvency returns liquidation details", async () => {
    const data = expectData(
      await ch.getInsolvency({ path: { company_number: fixtures.liquidationCompany } }),
    );
    expect(data.status).toContain("liquidation");
  });

  test("ukEstablishments lists establishments of an overseas company", async () => {
    const data = expectData(
      await ch.listUkEstablishments({ path: { company_number: fixtures.overseaCompany } }),
    );
    expect(data.items?.length).toBeGreaterThan(0);
  });

  test("registers returns 404 for a company keeping registers itself", async () => {
    // No stable public fixture exists: electing to keep statutory registers
    // at Companies House is rare. This documents the error contract; if it
    // starts failing, a 200 fixture has become available.
    const { response } = await ch.getRegisters({ path: { company_number: fixtures.company } });
    expect(response.status).toBe(404);
  });
});
