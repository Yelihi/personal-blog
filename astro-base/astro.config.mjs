// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  integrations: [mdx(), sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      external: ['motion', 'framer-motion'],
    },
  },
  adapter: cloudflare(),
  markdown: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: [
      'rehype-slug',
      ['rehype-autolink-headings', { behavior: 'wrap' }],
    ],
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {},
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
