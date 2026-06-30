// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';

import react from '@astrojs/react';

// import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  integrations: [mdx(), sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['motion', 'framer-motion', 'motion/react'],
    },
  },
  // adapter: cloudflare(),
  markdown: {
    syntaxHighlight: {
      type: "shiki",
      excludeLangs: ['mermaid', 'math']
    },
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: [
      'rehype-slug',
      ['rehype-autolink-headings', { behavior: 'wrap' }],
      rehypeMermaid
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
  fonts: [{
    provider: fontProviders.fontsource(),
    name: "Pretendard",
    weights: [400, 500, 600, 700, 800, 900],
    styles: ["normal", "italic"],
    subsets: ["korean", "latin"],
    formats: ["woff2", "woff"],
    fallbacks: ["sans-serif"],
    cssVariable: "--font-pretendard",
  }],
  build: {
    inlineStylesheets: 'auto',
  },
});
