// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [
    mdx(),
    sitemap(),
    tailwind({ applyBaseStyles: false }),
    react(),
  ],
  adapter: cloudflare(),
  // image: {
  //   // Cloudflare Pages의 자동 이미지 최적화와 충돌 방지
  //   service: {
  //     entrypoint: 'astro/assets/services/noop',
  //     config: {},
  //   },
  // },
});
