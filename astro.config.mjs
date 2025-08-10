// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from '@astrojs/tailwind';

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [mdx(), sitemap(), tailwind()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
    i18n: {
        defaultLocale: "en",
        locales: ["en", "fr", "ro"]
    }
});
