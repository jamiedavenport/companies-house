import { expect, test } from "vite-plus/test";
import {
  getCorporateEntityPsc,
  getCorporateEntityBeneficialOwner,
  getIndividualPsc,
  getIndividualBeneficialOwner,
  getLegalPersonBeneficialOwner,
  getLegalPersonPsc,
  getPscStatement,
  getSuperSecureBeneficialOwner,
  getSuperSecurePsc,
  listPersonsWithSignificantControl as listPsc,
  listPscNotifications,
  listPscStatements,
} from "../src/index.ts";
import { describeLive, expectData, fixtures, idFromLink } from "./fixtures.ts";

/** Lists a company's PSCs and returns the notification id of the first PSC of `kind`. */
async function firstPscIdOfKind(companyNumber: string, kind: string): Promise<string> {
  const data = expectData(await listPsc({ path: { company_number: companyNumber } }));
  const match = data.items?.find((i) => i.kind === kind);
  expect(match, `no ${kind} PSC on ${companyNumber}`).toBeDefined();
  return idFromLink(match?.links?.self);
}

describeLive("persons with significant control endpoints", () => {
  test("individual PSC", async () => {
    const id = await firstPscIdOfKind(
      fixtures.individualPscCompany,
      "individual-person-with-significant-control",
    );
    const psc = expectData(
      await getIndividualPsc({
        path: { company_number: fixtures.individualPscCompany, notification_id: id },
      }),
    );
    expect(psc.name).toBeTypeOf("string");
  });

  test("corporate entity PSC", async () => {
    const id = await firstPscIdOfKind(
      fixtures.corporatePscCompany,
      "corporate-entity-person-with-significant-control",
    );
    const psc = expectData(
      await getCorporateEntityPsc({
        path: { company_number: fixtures.corporatePscCompany, notification_id: id },
      }),
    );
    expect(psc.name).toBeTypeOf("string");
  });

  test("legal person PSC", async () => {
    const id = await firstPscIdOfKind(
      fixtures.legalPersonPscCompany,
      "legal-person-person-with-significant-control",
    );
    const psc = expectData(
      await getLegalPersonPsc({
        path: { company_number: fixtures.legalPersonPscCompany, notification_id: id },
      }),
    );
    expect(psc.name).toBeTypeOf("string");
  });

  test("individual beneficial owner", async () => {
    const id = await firstPscIdOfKind(fixtures.overseasEntity, "individual-beneficial-owner");
    const owner = expectData(
      await getIndividualBeneficialOwner({
        path: { company_number: fixtures.overseasEntity, notification_id: id },
      }),
    );
    expect(owner.name).toBeTypeOf("string");
  });

  test("corporate entity beneficial owner", async () => {
    const id = await firstPscIdOfKind(
      fixtures.corporateBoEntity,
      "corporate-entity-beneficial-owner",
    );
    const owner = expectData(
      await getCorporateEntityBeneficialOwner({
        path: { company_number: fixtures.corporateBoEntity, notification_id: id },
      }),
    );
    expect(owner.name).toBeTypeOf("string");
  });

  test("legal person beneficial owner returns 404 for an unknown id", async () => {
    // No overseas entity with a legal-person beneficial owner has been found
    // on the register (OE000001-OE000040 scanned on 2026-07-13), so this
    // documents the error contract until a 200 fixture exists.
    const { response } = await getLegalPersonBeneficialOwner({
      path: { company_number: fixtures.overseasEntity, notification_id: "unknown" },
    });
    expect(response.status).toBe(404);
  });

  test("PSC statements list and statement", async () => {
    const statements = expectData(
      await listPscStatements({ path: { company_number: fixtures.overseasEntity } }),
    );
    const statementId = idFromLink(statements.items?.[0]?.links?.self);
    expect(statementId).not.toBe("");

    const statement = expectData(
      await getPscStatement({
        path: { company_number: fixtures.overseasEntity, statement_id: statementId },
      }),
    );
    expect(statement.statement).toBeTypeOf("string");
  });

  test("super secure person returns 404 for an unknown id", async () => {
    // Super-secure PSCs are shielded from public view by design, so no 200
    // fixture can exist; this documents the error contract.
    const { response } = await getSuperSecurePsc({
      path: { company_number: fixtures.company, super_secure_id: "unknown" },
    });
    expect(response.status).toBe(404);
  });

  test("super secure beneficial owner returns 404 for an unknown id", async () => {
    const { response } = await getSuperSecureBeneficialOwner({
      path: { company_number: fixtures.overseasEntity, super_secure_id: "unknown" },
    });
    expect(response.status).toBe(404);
  });

  test("PSC notifications returns 404 even for a real PSC id", async () => {
    // The spec documents this endpoint, but the live API 404s for every psc_id
    // tried (verified 2026-07-13), suggesting it was never deployed. If this
    // test fails with a 200, the endpoint has come to life upstream.
    const id = await firstPscIdOfKind(
      fixtures.corporatePscCompany,
      "corporate-entity-person-with-significant-control",
    );
    const { response } = await listPscNotifications({
      path: { company_number: fixtures.corporatePscCompany, psc_id: id },
    });
    expect(response.status).toBe(404);
  });
});
