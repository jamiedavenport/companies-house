import spec from "@jxdltd/companies-house-spec/openapi.json";
import { createMarkdownFromOpenApi } from "@scalar/openapi-to-markdown";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const markdown = await createMarkdownFromOpenApi(JSON.stringify(spec));
  return new Response(markdown, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
