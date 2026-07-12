import { createClient, createConfig } from "./generated/client/index.ts";
import { CompaniesHouse } from "./generated/sdk.gen.ts";
import { createRetryFetch, type RetryOptions } from "./retry.ts";

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
   * Underlying fetch implementation.
   * @default globalThis.fetch
   */
  fetch?: typeof fetch;
  /**
   * Rate-limit-aware retry behavior; pass `false` to disable retries.
   */
  retry?: RetryOptions | false;
};

/** Creates a configured, isolated Companies House SDK instance. */
export function createCompaniesHouseClient(options: CompaniesHouseClientOptions): CompaniesHouse {
  const {
    apiKey,
    baseUrl = "https://api.company-information.service.gov.uk",
    fetch: baseFetch = globalThis.fetch,
    retry = {},
  } = options;

  const client = createClient(
    createConfig({
      auth: () => `${apiKey}:`,
      baseUrl,
      fetch: retry === false ? baseFetch : createRetryFetch(baseFetch, retry),
    }),
  );
  return new CompaniesHouse({ client });
}
