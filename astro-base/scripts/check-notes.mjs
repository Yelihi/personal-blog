import { spawnSync } from 'node:child_process';
import { ESLint } from 'eslint';
import globals from 'globals';

// Existing repository-wide formatting failures are recorded in the FS baseline.
const paths = [
  'scripts',
  'tests/notes',
  'src/components/react/notes',
  'src/composables/buildNoteIndex.ts',
  'src/composables/transferImagesFormat.ts',
  'src/components/react/UnsplashCredit.tsx',
  'src/components/react/ArticleCardSection.tsx',
  'src/pages/notes',
  'src/styles/notes.css',
  'src/content/notes/**/*.mdx',
  'src/data/note-covers.json',
  'src/content.config.ts',
  'src/components/react/Header.tsx',
  'src/components/BaseHead.astro',
  'src/layouts/Default.astro',
  'astro.config.mjs',
  'package.json',
  'tsconfig.notes.json',
];
const formatting = spawnSync(
  process.execPath,
  ['node_modules/prettier/bin/prettier.cjs', '--check', ...paths],
  { stdio: 'inherit' }
);
if (formatting.status !== 0) process.exit(formatting.status ?? 1);
const eslint = new ESLint({
  overrideConfig: [
    {
      languageOptions: { globals: { ...globals.browser, ...globals.node } },
      rules: { 'no-console': 'off' },
    },
  ],
});
const results = await eslint.lintFiles(
  paths.filter(
    (p) =>
      !p.endsWith('.css') &&
      !p.endsWith('.json') &&
      !p.includes('content/notes')
  )
);
const formatter = await eslint.loadFormatter('stylish');
const output = formatter.format(results);
if (output) console.log(output);
if (results.some((result) => result.errorCount > 0)) process.exit(1);
console.log('Notes formatting and lint passed.');
