import { expect, test } from "vite-plus/test";
import {
  getOfficerAppointment,
  getCorporateDisqualification,
  getNaturalDisqualification,
  listOfficers,
  listOfficerAppointments,
  searchDisqualifiedOfficers,
} from "../src/index.ts";
import { describeLive, expectData, fixtures, idFromLink } from "./fixtures.ts";

describeLive("officer endpoints", () => {
  test("officers list, appointment, and officer appointment list", async () => {
    const officers = expectData(
      await listOfficers({
        path: { company_number: fixtures.company },
        query: { items_per_page: 1 },
      }),
    );
    const officer = officers.items?.[0];
    expect(officer?.name).toBeTypeOf("string");

    // links.self is /company/{company_number}/appointments/{appointment_id}
    const appointmentId = idFromLink(officer?.links?.self);
    expect(appointmentId).not.toBe("");
    const appointment = expectData(
      await getOfficerAppointment({
        path: { company_number: fixtures.company, appointment_id: appointmentId },
      }),
    );
    expect(appointment.name).toBeTypeOf("string");

    // links.officer.appointments is /officers/{officer_id}/appointments
    const officerId = officer?.links?.officer?.appointments?.split("/")[2];
    expect(officerId).toBeTypeOf("string");
    const appointments = expectData(
      await listOfficerAppointments({ path: { officer_id: officerId! } }),
    );
    expect(appointments.items?.length).toBeGreaterThan(0);
  });

  test("natural disqualified officer", async () => {
    const results = expectData(
      await searchDisqualifiedOfficers({ query: { q: "smith", items_per_page: 50 } }),
    );
    const natural = results.items?.find((i) => i.links?.self?.includes("/natural/"));
    expect(natural, "no natural disqualified officer in search results").toBeDefined();

    const officer = expectData(
      await getNaturalDisqualification({ path: { officer_id: idFromLink(natural?.links?.self) } }),
    );
    expect(officer.disqualifications?.length).toBeGreaterThan(0);
  });

  test("corporate disqualified officer", async () => {
    const results = expectData(
      await searchDisqualifiedOfficers({ query: { q: "limited", items_per_page: 50 } }),
    );
    const corporate = results.items?.find((i) => i.links?.self?.includes("/corporate/"));
    expect(corporate, "no corporate disqualified officer in search results").toBeDefined();

    const officer = expectData(
      await getCorporateDisqualification({
        path: { officer_id: idFromLink(corporate?.links?.self) },
      }),
    );
    expect(officer.disqualifications?.length).toBeGreaterThan(0);
  });
});
