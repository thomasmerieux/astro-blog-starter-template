// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://danaandthomas.party',
  integrations: [mdx(), sitemap(), tailwind()],
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      persist: true,
    },
    imageService: 'compile',
  }),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'ro'],
  },
});
