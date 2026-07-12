export type RetryOptions = {
  /**
   * Maximum retry attempts after the initial request.
   * @default 3
   */
  maxRetries?: number;
  /**
   * Upper bound on a single wait. Companies House rate-limit windows are five
   * minutes, so a 429 near the start of a window can ask for a long pause;
   * waits beyond this bound return the 429 response instead of sleeping.
   * @default 60_000
   */
  maxWaitMs?: number;
  /**
   * Base delay for exponential backoff on 5xx responses and network errors.
   * @default 500
   */
  backoffBaseMs?: number;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wraps fetch with Companies House-aware retries: 429s wait until the
 * `x-ratelimit-reset` window opens, and 5xx responses or network errors are
 * retried with exponential backoff. Only idempotent requests are retried.
 */
export function createRetryFetch(
  baseFetch: typeof fetch,
  options: RetryOptions = {},
): typeof fetch {
  const { maxRetries = 3, maxWaitMs = 60_000, backoffBaseMs = 500 } = options;

  return async (input, init) => {
    const method = init?.method ?? (input instanceof Request ? input.method : "GET");
    const retryable = method === "GET" || method === "HEAD";

    let attempt = 0;
    for (;;) {
      const request = input instanceof Request ? input.clone() : input;
      let response: Response | undefined;
      let networkError: unknown;
      try {
        response = await baseFetch(request, init);
      } catch (error) {
        networkError = error;
      }

      if (response && response.status < 500 && response.status !== 429) {
        return response;
      }
      if (!retryable || attempt >= maxRetries) {
        if (response) return response;
        throw networkError;
      }

      let waitMs = backoffBaseMs * 2 ** attempt * (1 + Math.random());
      if (response?.status === 429) {
        const reset = Number(response.headers.get("x-ratelimit-reset"));
        if (Number.isFinite(reset) && reset > 0) {
          waitMs = Math.max(reset * 1000 - Date.now(), 1_000);
        }
        if (waitMs > maxWaitMs) return response;
      }

      attempt++;
      await sleep(Math.min(waitMs, maxWaitMs));
    }
  };
}
