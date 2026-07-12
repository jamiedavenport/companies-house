import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./spec/companies-house.json",
  output: "src/generated",
  plugins: ["@hey-api/client-fetch"],
});
