import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  readdir,
  rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { compile } from '@mdx-js/mdx';
import {
  calculateTimelineFrame,
  SLOT,
} from '../../src/components/react/notes/timeline.ts';
import {
  parsePosition,
  readReturnPosition,
  saveReturnPosition,
} from '../../src/components/react/notes/returnPosition.ts';
import { siteOrigin } from '../../scripts/site-origin.mjs';
import {
  noteSlug,
  readNoteFiles,
  remarkNoteExcerpt,
} from '../../scripts/note-content.mjs';
import {
  chooseCover,
  validateCover,
  writeRegistry,
} from '../../scripts/note-covers.mjs';
import {
  prepareNoteAssets,
  pruneNoteBuildAssets,
} from '../../scripts/prepare-note-assets.mjs';

const metrics = {
  scrollTop: 0,
  viewportHeight: 800,
  fullScrollHeight: 800 + 39 * SLOT,
  firstCenter: 400,
  markerOffset: 400,
  total: 40,
};
test('0/1/40 notes: progress covers the full fixed extent, both directions and at the end', () => {
  assert.deepEqual(calculateTimelineFrame({ ...metrics, total: 0 }), {
    progress: 0,
    selectedIndex: null,
    requiredCount: 0,
  });
  assert.deepEqual(
    calculateTimelineFrame({ ...metrics, total: 1, fullScrollHeight: 800 }),
    { progress: 0, selectedIndex: 0, requiredCount: 1 }
  );
  const half = calculateTimelineFrame({
    ...metrics,
    scrollTop: (39 * SLOT) / 2,
  });
  assert.equal(half.progress, 0.5);
  assert.equal(half.selectedIndex, 20);
  assert.equal(half.requiredCount, 30);
  assert.equal(
    calculateTimelineFrame({ ...metrics, scrollTop: SLOT * 10 }).progress,
    10 / 39
  );
  assert.equal(
    calculateTimelineFrame({
      ...metrics,
      scrollTop: SLOT * 2,
      previousIndex: 30,
    }).selectedIndex,
    2
  );
  assert.equal(
    calculateTimelineFrame({
      ...metrics,
      scrollTop: SLOT / 2,
      previousIndex: 0,
    }).selectedIndex,
    0
  );
  assert.deepEqual(
    calculateTimelineFrame({ ...metrics, scrollTop: 39 * SLOT }),
    { progress: 1, selectedIndex: 39, requiredCount: 40 }
  );
});
test('return snapshot rejects corrupt, negative and incompatible values; storage failure is harmless', () => {
  const p = {
    version: 1,
    revision: 'a',
    selectedId: 'hello',
    scrollTop: 900,
    anchorOffset: -20,
    mode: 'mobile',
    viewportWidth: 390,
    revealedCount: 10,
    focusedNoteId: null,
  };
  assert.deepEqual(parsePosition(JSON.stringify(p)), p);
  for (const raw of [
    '{',
    'null',
    '{}',
    JSON.stringify({ ...p, version: 2 }),
    JSON.stringify({ ...p, scrollTop: -1 }),
    JSON.stringify({ ...p, anchorOffset: '2' }),
  ])
    assert.equal(parsePosition(raw), null);
  // Node has no browser storage; both operations must catch the boundary failure.
  assert.equal(readReturnPosition('denied'), null);
  assert.equal(
    saveReturnPosition('denied', p as Parameters<typeof saveReturnPosition>[1]),
    false
  );
});
test('origin precedence and route validation', () => {
  assert.equal(
    siteOrigin({
      SITE_URL: 'https://blog.example.com/',
      CF_PAGES_URL: 'https://preview.pages.dev',
    }),
    'https://blog.example.com'
  );
  assert.equal(
    siteOrigin({ CF_PAGES_URL: 'https://preview.pages.dev' }),
    'https://preview.pages.dev'
  );
  assert.equal(
    siteOrigin({
      CF_PAGES_BRANCH: 'main',
      CF_PAGES_URL: 'https://unique.yelihi.pages.dev',
    }),
    'https://yelihi.pages.dev'
  );
  assert.throws(() => siteOrigin({ SITE_URL: 'https://example.com/path' }));
  assert.throws(() => siteOrigin({ SITE_URL: 'javascript:alert(1)' }));
  assert.equal(noteSlug('life/hello/index.mdx'), 'life/hello');
  for (const id of ['../x', 'a//b', 'a?x', '/a'])
    assert.throws(() => noteSlug(id));
});
test('excerpt is text, without evaluated JSX/expressions, and does not modify Articles', () => {
  const tree = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: '생각 ' },
          { type: 'mdxTextExpression', value: 'secret()' },
          { type: 'strong', children: [{ type: 'text', value: '노트' }] },
        ],
      },
    ],
  };
  const file = {
    path: '/src/content/notes/test.mdx',
    data: { astro: { frontmatter: {} as Record<string, unknown> } },
  };
  remarkNoteExcerpt()(tree, file);
  assert.equal(file.data.astro.frontmatter.noteExcerpt, '생각 노트');
  const article = {
    ...file,
    path: '/src/content/articles/test.mdx',
    data: { astro: { frontmatter: {} } },
  };
  remarkNoteExcerpt()(tree, article);
  assert.deepEqual(article.data.astro.frontmatter, {});
});
const mockCover = {
  source: 'unsplash',
  src: 'https://images.unsplash.com/mock-photo?w=1080',
  width: 1200,
  height: 800,
  alt: 'TEST FIXTURE',
  attribution: {
    photoId: 'mock',
    photographer: 'Test Photographer',
    photographerUrl: 'https://unsplash.com/@test',
    photoUrl: 'https://unsplash.com/photos/mock',
  },
};
test('provider preserves hotlinks, adds credit and tracks selection; failures never expose the key', async () => {
  const calls: string[] = [];
  const photo = {
    id: 'mock',
    urls: { regular: mockCover.src },
    width: 1200,
    height: 800,
    alt_description: 'TEST FIXTURE',
    user: {
      name: 'Test Photographer',
      links: { html: mockCover.attribution.photographerUrl },
    },
    links: {
      html: mockCover.attribution.photoUrl,
      download_location: 'https://api.unsplash.com/photos/mock/download',
    },
  };
  const imageBytes = await sharp({
    create: { width: 8, height: 8, channels: 3, background: '#ccc' },
  })
    .png()
    .toBuffer();
  const fetcher = async (url: string, init: RequestInit) => {
    calls.push(String(url));
    if (String(url).startsWith('https://images.unsplash.com/')) {
      assert.equal(init.headers, undefined);
      return new Response(imageBytes);
    }
    assert.equal(
      (init.headers as Record<string, string>).Authorization,
      'Client-ID test-key'
    );
    return { ok: true, json: async () => (calls.length === 1 ? photo : {}) };
  };
  const result = await chooseCover('test-key', fetcher);
  assert.equal(result.src, mockCover.src);
  assert.match(result.attribution.photoUrl, /utm_source=yelihi_notes/);
  assert.equal(calls.length, 3);
  assert.match(calls[2], /download$/);
  assert.ok(!JSON.stringify(result).includes('test-key'));
  await assert.rejects(chooseCover('', fetcher), /UNSPLASH_ACCESS_KEY/);
  await assert.rejects(
    chooseCover('test-key', async () => ({ ok: false, status: 429 })),
    /429/
  );
  await assert.rejects(
    chooseCover('test-key', async () => {
      throw new Error('timeout');
    }),
    /timeout/
  );
  assert.throws(() =>
    validateCover({ ...mockCover, src: 'https://evil.example/photo' })
  );
  assert.throws(() => validateCover({ ...mockCover, width: 0 }));
});
test('build image boundary: local decode, missing/corrupt/traversal default, unavailable default fails; duplicate slug rejected', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'notes-unit-'));
  try {
    const folder = path.join(root, 'src/content/notes/one');
    await mkdir(folder, { recursive: true });
    await writeRegistry(root, { version: 1, default: mockCover, notes: {} });
    await writeFile(
      path.join(folder, 'cover.png'),
      await sharp({
        create: { width: 32, height: 20, channels: 3, background: '#ccc' },
      })
        .png()
        .toBuffer()
    );
    const setNote = (cover: string) =>
      writeFile(
        path.join(folder, 'index.mdx'),
        `---\ntitle: Test\ndate: "2026-10-10"\ncoverImage: ${cover}\n---\nBody`
      );
    await setNote('./cover.png');
    await prepareNoteAssets(root);
    const manifest = () =>
      readFile(path.join(root, '.cache/notes/covers.json'), 'utf8').then(
        JSON.parse
      );
    assert.equal((await manifest()).covers.one.source, 'local');
    await writeFile(
      path.join(folder, 'index.mdx'),
      '---\ntitle: Draft\ndate: "2026-10-10"\ncoverImage: ./missing.png\ndraft: true\n---\nDraft'
    );
    await prepareNoteAssets(root, { includeDrafts: false });
    assert.deepEqual((await manifest()).covers, {});
    assert.equal(
      (await readdir(path.join(root, 'public/notes-media'))).length,
      2
    );
    await pruneNoteBuildAssets(root, path.join(root, 'public'));
    assert.deepEqual(await readdir(path.join(root, 'public/notes-media')), []);
    await pruneNoteBuildAssets(root, path.join(root, 'empty-output'));

    await writeFile(path.join(folder, 'broken.png'), 'not an image');
    for (const image of [
      './broken.png',
      './missing.png',
      '../../../../data/note-covers.json',
    ]) {
      await setNote(image);
      await prepareNoteAssets(root);
      assert.equal((await manifest()).covers.one.src, mockCover.src);
    }
    await writeRegistry(root, { version: 1, default: null, notes: {} });
    await assert.rejects(
      prepareNoteAssets(root),
      /Prepare the Unsplash default/
    );
    await writeFile(
      path.join(root, 'src/content/notes/one.mdx'),
      '---\ntitle: Duplicate\n---\nBody'
    );
    await assert.rejects(readNoteFiles(root), /Duplicate note slug/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('restricted MDX reports inline image and malformed syntax locations', async () => {
  const file = {
    path: '/src/content/notes/test.mdx',
    fail(message: string) {
      throw new Error(message);
    },
    data: { astro: { frontmatter: {} } },
  };
  assert.throws(
    () =>
      remarkNoteExcerpt()(
        { type: 'root', children: [{ type: 'image', url: './inline.png' }] },
        file
      ),
    /coverImage/
  );
  await assert.rejects(
    compile({ value: '# Title\n\n<Unclosed', path: 'bad-note.mdx' }),
    (error: Error & { line?: number }) => error.line === 3
  );
});
