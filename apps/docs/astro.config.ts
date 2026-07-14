import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://companies-house.jxd.dev",
  integrations: [
    starlight({
      title: "Companies House SDK",
      description: "A modern, fully typed TypeScript SDK for the Companies House Public Data API.",
      favicon: "/favicon.svg",
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
