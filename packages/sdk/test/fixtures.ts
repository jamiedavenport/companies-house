import { describe, expect } from "vite-plus/test";

// Live fixtures verified against the API on 2026-07-13. The scheduled cron
// run re-verifies them; a failure can mean upstream data changed rather than
// an SDK bug, so check the company on find-and-update.company-information
// before assuming a regression.
export const fixtures = {
  /** TESCO PLC: officers, filing history, charges, and a PSC exemption. */
  company: "00445790",
  /** TESCO STORES LIMITED: corporate-entity PSC. */
  corporatePscCompany: "00519500",
  /** GYMSHARK TOPCO LIMITED: individual PSC. */
  individualPscCompany: "16577203",
  /** NETWORK RAIL LIMITED: legal-person PSC (Secretary of State). */
  legalPersonPscCompany: "04402220",
  /** PLANNED MEDIA COMMUNICATIONS LIMITED: in liquidation. */
  liquidationCompany: "NI017846",
  /** LAWERS JERSEY LIMITED: active overseas company with UK establishments. */
  overseaCompany: "SF000623",
  /** Overseas entity with individual beneficial owners and PSC statements. */
  overseasEntity: "OE000001",
  /** Overseas entity with a corporate-entity beneficial owner. */
  corporateBoEntity: "OE000011",
};

export const describeLive = describe.skipIf(!process.env.CH_API_KEY);

/** Extracts the trailing id segment from a resource link. */
export const idFromLink = (link: string | undefined): string => link?.split("/").pop() ?? "";

/** Asserts a 200 response and returns its data. */
export function expectData<T>(result: { data?: T; response: Response }): T {
  expect(result.response.status).toBe(200);
  expect(result.data).toBeDefined();
  return result.data as T;
}
