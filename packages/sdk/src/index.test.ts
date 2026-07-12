import { expect, test } from "vite-plus/test";
import { client, searchCompanies } from "./index.js";

test("client is configured with the Companies House base URL", () => {
  expect(client.getConfig().baseUrl).toBe("https://api.company-information.service.gov.uk");
});

test("SDK exposes generated operations", () => {
  expect(searchCompanies).toBeTypeOf("function");
});
