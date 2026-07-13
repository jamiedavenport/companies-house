import { createClient, createConfig } from "./generated/client/index.ts";
import { CompaniesHouse } from "./generated/sdk.gen.ts";

export type CompaniesHouseClientOptions = {
  /**
   * REST API key from the Companies House developer hub. Sent as the HTTP
   * basic auth username on every request.
   */
  apiKey: string;
  /**
   * @default "https://api.company-information.service.gov.uk"
   */
  baseUrl?: string;
  /**
   * Underlying fetch implementation. Wrap it to add cross-cutting behavior
   * such as retries, rate limiting, or logging.
   * @default globalThis.fetch
   */
  fetch?: typeof fetch;
};

/** Creates a configured, isolated Companies House SDK instance. */
export function createCompaniesHouseClient(options: CompaniesHouseClientOptions): CompaniesHouse {
  const {
    apiKey,
    baseUrl = "https://api.company-information.service.gov.uk",
    fetch: baseFetch = globalThis.fetch,
  } = options;

  const client = createClient(
    createConfig({
      auth: () => `${apiKey}:`,
      baseUrl,
      fetch: baseFetch,
    }),
  );
  return new CompaniesHouse({ client });
}
