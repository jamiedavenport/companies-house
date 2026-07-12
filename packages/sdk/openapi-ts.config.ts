import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./spec/bundled.json",
  output: "src/generated",
  plugins: ["@hey-api/client-fetch"],
});
