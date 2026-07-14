import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLlmsTxt from "starlight-llms-txt";

export default defineConfig({
  site: "https://companies-house.jxd.dev",
  integrations: [
    starlight({
      title: "Companies House SDK",
      description: "A modern, fully typed TypeScript SDK for the Companies House Public Data API.",
      favicon: "/favicon.svg",
      plugins: [
        starlightLlmsTxt({
          details: [
            "- npm package: `@jxdltd/companies-house` (ESM, TypeScript)",
            "- Server-side only: the Companies House API key must never be exposed to a browser.",
            "- Thin by design: a typed transport over `fetch` with auth handled for you. Retries, rate limiting, caching, and pagination are the consumer's responsibility (customise via the `fetch` option).",
            "- Requests return a `{ data, error }` result object rather than throwing on API errors.",
            "- The OpenAPI spec ships with the package as `@jxdltd/companies-house/openapi.json`.",
          ].join("\n"),
          optionalLinks: [
            {
              label: "API Reference (markdown)",
              url: "https://companies-house.jxd.dev/llms-openapi.txt",
              description:
                "All Public Data API endpoints, parameters, and schemas rendered as markdown from the OpenAPI spec",
            },
            {
              label: "Announcement blog post",
              url: "https://www.jxd.dev/blog/companies-house-sdk",
              description: "The story behind the SDK and how the spec was rebuilt",
            },
          ],
        }),
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/jamiedavenport/companies-house",
        },
      ],
      head: [
        { tag: "link", attrs: { rel: "preconnect", href: "https://rsms.me/" } },
        {
          tag: "link",
          attrs: { rel: "preconnect", href: "https://fonts.googleapis.com" },
        },
        {
          tag: "link",
          attrs: {
            rel: "preconnect",
            href: "https://fonts.gstatic.com",
            crossorigin: "anonymous",
          },
        },
        {
          tag: "link",
          attrs: { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
        },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Mona+Sans:wdth,wght@75..125,200..900&display=swap",
          },
        },
      ],
      customCss: ["./src/styles/custom.css"],
      components: {
        Footer: "./src/components/Footer.astro",
        SocialIcons: "./src/components/SocialIcons.astro",
      },
      sidebar: [
        {
          label: "Guides",
          items: [
            { label: "Getting Started", slug: "guides/getting-started" },
            { label: "Error Handling", slug: "guides/error-handling" },
            { label: "Configuration", slug: "guides/configuration" },
          ],
        },
        { label: "API Reference", link: "/reference" },
        {
          label: "Blog Post",
          link: "https://www.jxd.dev/blog/companies-house-sdk",
          attrs: { target: "_blank" },
        },
      ],
    }),
  ],
});
