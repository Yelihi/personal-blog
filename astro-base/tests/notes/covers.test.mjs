import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  chooseCover,
  readCoverRegistry,
  verifyCoverImage,
} from '../../scripts/note-covers.mjs';
import { prepareNoteCovers } from '../../scripts/prepare-note-covers.mjs';
import { prepareNoteAssets } from '../../scripts/prepare-note-assets.mjs';

const pixels = await sharp({
  create: { width: 16, height: 12, channels: 3, background: '#335544' },
})
  .png()
  .toBuffer();
const cover = (id = 'default') => ({
  source: 'unsplash',
  src: `https://images.unsplash.com/${id}?ixid=test`,
  width: 16,
  height: 12,
  alt: 'Forest canopy',
  attribution: {
    photoId: id,
    photographer: 'Fixture',
    photographerUrl: 'https://unsplash.com/@fixture',
    photoUrl: `https://unsplash.com/photos/${id}`,
  },
});
const photo = (id = 'picked', description = 'Forest canopy') => ({
  id,
  width: 16,
  height: 12,
  alt_description: description,
  urls: { regular: cover(id).src },
  user: { name: 'Fixture', links: { html: 'https://unsplash.com/@fixture' } },
  links: {
    html: `https://unsplash.com/photos/${id}`,
    download_location: `https://api.unsplash.com/photos/${id}/download`,
  },
});
const json = (data) =>
  new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
const image = () =>
  new Response(pixels, { headers: { 'Content-Type': 'image/png' } });
const quiet = () => {};
const noNetwork = () => {
  throw new Error('Unexpected network request');
};
async function fixture(
  t,
  notes,
  registry = { version: 1, default: cover(), notes: {} }
) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'notes-covers-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'src/content/notes'), { recursive: true });
  await mkdir(path.join(root, 'src/data'), { recursive: true });
  await writeFile(
    path.join(root, 'src/data/note-covers.json'),
    JSON.stringify(registry)
  );
  for (const [id, metadata] of Object.entries(notes)) {
    await writeFile(
      path.join(root, `src/content/notes/${id}.mdx`),
      `---\ntitle: ${id}\ndate: '2026-10-11'\n${metadata}\n---\n\nA thought.\n`
    );
  }
  return root;
}
const registryBytes = (root) =>
  readFile(path.join(root, 'src/data/note-covers.json'), 'utf8');
const manifest = async (root) =>
  JSON.parse(
    await readFile(path.join(root, '.cache/notes/covers.json'), 'utf8')
  );
async function clean(root) {
  assert.deepEqual((await readdir(path.join(root, 'src/data'))).sort(), [
    'note-covers.json',
  ]);
}

test('random search filters described people, validates bytes, then tracks only the chosen photo', async () => {
  const calls = [];
  let candidates = 0;
  const selected = await chooseCover('test-key', async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/photos/random'))
      return json(
        photo(
          'picked',
          ++candidates === 1 ? 'A woman in a forest' : 'Forest canopy'
        )
      );
    if (String(url).includes('/download')) return json({ url: cover().src });
    return image();
  });
  assert.equal(candidates, 2);
  assert.equal(calls.filter((c) => c.url.includes('/download')).length, 1);
  assert.match(selected.src, /ixid=test/);
  assert.match(selected.attribution.photographerUrl, /utm_source=yelihi_notes/);
  for (const call of calls) {
    assert.equal(call.options.redirect, 'error');
    if (call.url.startsWith('https://api.unsplash.com/'))
      assert.equal(call.options.headers.Authorization, 'Client-ID test-key');
    else assert.equal(call.options.headers, undefined);
  }
  const query = new URL(calls[0].url);
  assert.equal(query.searchParams.get('content_filter'), 'high');
  assert.equal(query.searchParams.get('orientation'), 'landscape');
  assert.match(
    query.searchParams.get('query'),
    /landscape|clouds sky|abstract texture/
  );
});

test('candidate filtering stops after three attempts and never tracks rejected candidates', async () => {
  let calls = 0;
  await assert.rejects(
    chooseCover('test-key', async (url) => {
      calls++;
      assert.match(String(url), /photos\/random/);
      return json(photo('person', 'People on a beach'));
    }),
    /three candidates/
  );
  assert.equal(calls, 3);
});

test('invalid image bytes and untrusted URLs cannot be selected or tracked', async () => {
  await assert.rejects(
    verifyCoverImage(
      { ...cover(), src: 'http://images.unsplash.com/a' },
      noNetwork
    ),
    /Invalid/
  );
  await assert.rejects(
    verifyCoverImage(
      { ...cover(), src: 'https://attacker.example/a' },
      noNetwork
    ),
    /Invalid/
  );
  await assert.rejects(
    verifyCoverImage(cover(), async () => new Response('not an image'))
  );
  let tracked = false;
  await assert.rejects(
    chooseCover('key', async (url) => {
      if (String(url).includes('/random')) return json(photo());
      if (String(url).includes('/download')) tracked = true;
      return new Response('broken');
    })
  );
  assert.equal(tracked, false);
});

test('large responses are bounded and the stream is cancelled', async () => {
  let cancelled = false;
  const response = new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(20 * 1024 * 1024 + 1));
      },
      cancel() {
        cancelled = true;
      },
    })
  );
  await assert.rejects(
    verifyCoverImage(cover(), async () => response),
    /20MB/
  );
  assert.equal(cancelled, true);
});

test('local metadata and saved selections do not request random photos', async (t) => {
  const root = await fixture(
    t,
    { local: 'coverImage: ./local.png', saved: '' },
    { version: 1, default: cover(), notes: { saved: cover('saved') } }
  );
  const before = await registryBytes(root);
  const summary = await prepareNoteCovers(root, {
    fetcher: noNetwork,
    warn: quiet,
  });
  assert.deepEqual(summary, { selected: 0, reused: 1, local: 1, fallback: 0 });
  assert.equal(await registryBytes(root), before);
  await clean(root);
});

test('first selection persists, a second run reuses it with no random or tracking requests', async (t) => {
  const root = await fixture(t, { thought: '' });
  const calls = [];
  const fetcher = async (url) => {
    calls.push(String(url));
    if (String(url).includes('/random')) return json(photo());
    if (String(url).includes('/download')) return json({});
    return image();
  };
  assert.equal(
    (await prepareNoteCovers(root, { accessKey: 'key', fetcher, warn: quiet }))
      .selected,
    1
  );
  const before = await registryBytes(root);
  assert.equal(
    (await readCoverRegistry(root)).notes.thought.attribution.photoId,
    'picked'
  );
  await prepareNoteCovers(root, { fetcher: noNetwork, warn: quiet });
  assert.equal(await registryBytes(root), before);
  assert.equal(calls.filter((url) => url.includes('/random')).length, 1);
  assert.equal(calls.filter((url) => url.includes('/download')).length, 1);
  await clean(root);
});

test('rate limits stop further selection requests and fallback is never frozen in the registry', async (t) => {
  const root = await fixture(
    t,
    Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`note-${i}`, '']))
  );
  const before = await registryBytes(root);
  let requests = 0;
  const result = await prepareNoteCovers(root, {
    accessKey: 'key',
    fetcher: async () => {
      requests++;
      return new Response('', { status: 429 });
    },
    warn: quiet,
  });
  assert.equal(requests, 1);
  assert.equal(result.fallback, 40);
  assert.equal(await registryBytes(root), before);
  await clean(root);
});

test('no key uses an existing default without persisting it as a choice', async (t) => {
  const root = await fixture(t, { thought: '' });
  const before = await registryBytes(root);
  assert.equal(
    (await prepareNoteCovers(root, { fetcher: noNetwork, warn: quiet }))
      .fallback,
    1
  );
  assert.equal(await registryBytes(root), before);
  await clean(root);
});

test('failed default acquisition stops and removes the owned lock', async (t) => {
  const root = await fixture(
    t,
    { thought: '' },
    { version: 1, default: null, notes: {} }
  );
  const before = await registryBytes(root);
  await assert.rejects(
    prepareNoteCovers(root, { fetcher: noNetwork }),
    /UNSPLASH_ACCESS_KEY/
  );
  assert.equal(await registryBytes(root), before);
  await clean(root);
});

test('first preparation saves one attributed default even when the note has a local image', async (t) => {
  const root = await fixture(
    t,
    { local: 'coverImage: ./local.png' },
    { version: 1, default: null, notes: {} }
  );
  let random = 0;
  const result = await prepareNoteCovers(root, {
    accessKey: 'key',
    fetcher: async (url) => {
      if (String(url).includes('/random')) {
        random++;
        return json(photo('initial-default'));
      }
      if (String(url).includes('/download')) return json({});
      return image();
    },
  });
  assert.equal(random, 1);
  assert.equal(result.local, 1);
  const registry = await readCoverRegistry(root);
  assert.equal(registry.default.attribution.photoId, 'initial-default');
  assert.deepEqual(registry.notes, {});
  await clean(root);
});

test('CI prebuild uses committed metadata without credentials or random preparation', async (t) => {
  const root = await fixture(
    t,
    { thought: '' },
    { version: 1, default: null, notes: {} }
  );
  const before = await registryBytes(root);
  const result = await promisify(execFile)(
    process.execPath,
    [
      fileURLToPath(
        new URL('../../scripts/prepare-note-covers.mjs', import.meta.url)
      ),
      '--local-only',
    ],
    { cwd: root, env: { ...process.env, CI: 'true', UNSPLASH_ACCESS_KEY: '' } }
  );
  assert.match(result.stdout, /no random selection/);
  assert.equal(await registryBytes(root), before);
  await clean(root);
});

test('tracking failure does not persist a selection', async (t) => {
  const root = await fixture(t, { thought: '' });
  const before = await registryBytes(root);
  const result = await prepareNoteCovers(root, {
    accessKey: 'key',
    warn: quiet,
    fetcher: async (url) => {
      if (String(url).includes('/random')) return json(photo());
      if (String(url).includes('/download'))
        return new Response('', { status: 503 });
      return image();
    },
  });
  assert.equal(result.fallback, 1);
  assert.equal(await registryBytes(root), before);
  await clean(root);
});

test('drafts are excluded and a pre-existing lock is preserved', async (t) => {
  const root = await fixture(
    t,
    { thought: 'draft: true' },
    { version: 1, default: null, notes: {} }
  );
  assert.equal(
    (await prepareNoteCovers(root, { fetcher: noNetwork })).selected,
    0
  );
  const lock = path.join(root, 'src/data/.note-covers.lock');
  await writeFile(lock, 'another process');
  await assert.rejects(
    prepareNoteCovers(root, { includeDrafts: true, fetcher: noNetwork }),
    /Another cover preparation/
  );
  assert.equal(await readFile(lock, 'utf8'), 'another process');
});

test('build verifies each unique remote image once and falls back without changing saved choices', async (t) => {
  const root = await fixture(
    t,
    { one: '', two: '' },
    {
      version: 1,
      default: cover(),
      notes: { one: cover('broken'), two: cover('broken') },
    }
  );
  const before = await registryBytes(root);
  const calls = [];
  await prepareNoteAssets(root, {
    verifyRemote: true,
    warn: quiet,
    fetcher: async (url) => {
      calls.push(String(url));
      return String(url).includes('/broken')
        ? new Response('', { status: 404 })
        : image();
    },
  });
  const result = await manifest(root);
  assert.equal(calls.length, 2);
  assert.equal(result.covers.one.src, cover().src);
  assert.equal(result.covers.two.src, result.covers.one.src);
  assert.equal(result.fallback.src, cover().src);
  assert.equal(await registryBytes(root), before);
});

test('a real local image wins over a saved remote choice; bad local paths use the validated default', async (t) => {
  const root = await fixture(
    t,
    {
      local: 'coverImage: ./local.png',
      broken: 'coverImage: ./missing.png',
      escape: 'coverImage: ../../../outside.png',
    },
    { version: 1, default: cover(), notes: { local: cover('previous') } }
  );
  await writeFile(path.join(root, 'src/content/notes/local.png'), pixels);
  await writeFile(path.join(root, 'outside.png'), pixels);
  let requests = 0;
  await prepareNoteAssets(root, {
    verifyRemote: true,
    warn: quiet,
    fetcher: async (url) => {
      requests++;
      assert.equal(String(url), cover().src);
      return image();
    },
  });
  const result = await manifest(root);
  assert.equal(result.covers.local.source, 'local');
  assert.match(result.covers.local.src, /^\/notes-media\/[a-f0-9]+\.webp$/);
  assert.equal(
    (await sharp(path.join(root, 'public', result.covers.local.src)).metadata())
      .format,
    'webp'
  );
  assert.equal(result.covers.broken.src, cover().src);
  assert.equal(result.covers.escape.src, cover().src);
  assert.equal(requests, 1);
});

test('no valid primary or fallback stops before writing a manifest', async (t) => {
  const root = await fixture(t, { thought: '' });
  await assert.rejects(
    prepareNoteAssets(root, {
      verifyRemote: true,
      warn: quiet,
      fetcher: async () => new Response('bad bytes'),
    }),
    /No cover/
  );
  await assert.rejects(manifest(root), /ENOENT/);
});
