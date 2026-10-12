// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';

import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';
import {
  prepareNoteAssets,
  pruneNoteBuildAssets,
} from './scripts/prepare-note-assets.mjs';
import { remarkNoteExcerpt } from './scripts/note-content.mjs';
import { siteOrigin } from './scripts/site-origin.mjs';

const notesRoot = fileURLToPath(new URL('.', import.meta.url));
const notesAssets = {
  name: 'notes-assets',
  hooks: {
    'astro:config:setup': async ({ command }) =>
      prepareNoteAssets(notesRoot, {
        includeDrafts: command !== 'build',
        verifyRemote: command === 'build',
      }),
    'astro:build:done': async ({ dir }) =>
      pruneNoteBuildAssets(notesRoot, fileURLToPath(dir)),
    'astro:server:setup': ({ server }) => {
      let pending = Promise.resolve();
      const refresh = (file) => {
        if (
          !file.includes('/src/content/notes/') &&
          !file.endsWith('/src/data/note-covers.json')
        )
          return;
        pending = pending
          .then(() => prepareNoteAssets(notesRoot))
          .then(() => {
            server.ws.send({ type: 'full-reload' });
          })
          .catch((error) => server.config.logger.error(error.message));
      };
      server.watcher
        .on('add', refresh)
        .on('change', refresh)
        .on('unlink', refresh);
      server.httpServer?.once('close', () => {
        server.watcher
          .off('add', refresh)
          .off('change', refresh)
          .off('unlink', refresh);
      });
    },
  },
};

// import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: siteOrigin(),
  output: 'static',
  integrations: [notesAssets, mdx(), sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['motion', 'framer-motion', 'motion/react'],
    },
  },
  // adapter: cloudflare(),
  markdown: {
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid', 'math'],
    },
    remarkPlugins: ['remark-gfm', remarkNoteExcerpt],
    rehypePlugins: [
      'rehype-slug',
      ['rehype-autolink-headings', { behavior: 'wrap' }],
      rehypeMermaid,
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
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Pretendard',
      weights: [400, 500, 600, 700, 800, 900],
      styles: ['normal', 'italic'],
      subsets: ['korean', 'latin'],
      formats: ['woff2', 'woff'],
      fallbacks: ['sans-serif'],
      cssVariable: '--font-pretendard',
    },
  ],
  build: {
    inlineStylesheets: 'auto',
  },
});
