// Load CH_API_KEY from .env for local runs; CI provides it via the environment.
try {
  process.loadEnvFile(new URL("../.env", import.meta.url).pathname);
} catch {
  // no .env present (e.g. CI); live tests skip unless CH_API_KEY is set
}
