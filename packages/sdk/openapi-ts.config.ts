import { fileURLToPath } from "node:url";
import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: fileURLToPath(import.meta.resolve("@jxdltd/companies-house-spec/openapi.json")),
  output: "src/generated",
  plugins: [
    "@hey-api/client-fetch",
    {
      instance: "CompaniesHouse",
      name: "@hey-api/sdk",
    },
  ],
});
