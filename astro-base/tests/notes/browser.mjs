import assert from 'node:assert/strict';
import { cp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const app = process.cwd();
const workspace = path.join(app, '.cache/notes-test');
const fixture = path.join(workspace, 'app');
const artifacts = path.join(workspace, 'artifacts');
await rm(fixture, { recursive: true, force: true });
await mkdir(fixture, { recursive: true });
await mkdir(artifacts, { recursive: true });
for (const name of [
  'src',
  'scripts',
  'public',
  'astro.config.mjs',
  'tsconfig.json',
  'package.json',
]) {
  await cp(path.join(app, name), path.join(fixture, name), { recursive: true });
}
await symlink(
  path.join(app, 'node_modules'),
  path.join(fixture, 'node_modules'),
  'dir'
);
const notes = path.join(fixture, 'src/content/notes');
await rm(notes, { recursive: true, force: true });
await mkdir(notes, { recursive: true });
for (const [i, name] of [
  'articles/errors/npm-ci/image1.png',
  'articles/errors/tailscale-device-tag/image1.png',
  'notes/2026-10-16/cover.jpg',
].entries()) {
  await cp(
    path.join(app, 'src/content', name),
    path.join(notes, `cover-${i}${path.extname(name)}`)
  );
}
const sampleTitles = [
  '생각을 남기는 연습',
  'AI와 함께 일한다는 것',
  '빠르게 만드는 일, 오래 생각하는 일',
];
for (let i = 0; i < 40; i++) {
  const id = `test-${String(i).padStart(2, '0')}`;
  const date = new Date(Date.UTC(2026, 9, 10 - i)).toISOString().slice(0, 10);
  const img = i % 3;
  await writeFile(
    path.join(notes, `${id}.mdx`),
    `---\ntitle: "${sampleTitles[img]} ${i + 1}"\ndate: "${date}"\ncoverImage: ./cover-${img}.${img === 2 ? 'jpg' : 'png'}\n---\n\n이 글은 자동 검증용 노트입니다. ${'생각과 판단의 흐름을 부담 없이 기록합니다. '.repeat(20)}\n\n## 다음 생각\n\n**정적 본문 ${id}**\n\n- 기록하기\n- 다시 읽기\n`
  );
}
await writeFile(
  path.join(notes, 'draft.mdx'),
  '---\ntitle: DRAFT MUST NOT PUBLISH\ndate: "2026-10-11"\ncoverImage: ./cover-0.png\ndraft: true\n---\nDraft'
);
const fallback = {
  source: 'unsplash',
  src: 'https://images.unsplash.com/notes-test-fixture',
  width: 1200,
  height: 800,
  alt: 'MOCK API FALLBACK',
  attribution: {
    photoId: 'fixture',
    photographer: 'Fixture Photographer',
    photographerUrl:
      'https://unsplash.com/@fixture?utm_source=yelihi_notes&utm_medium=referral',
    photoUrl:
      'https://unsplash.com/photos/fixture?utm_source=yelihi_notes&utm_medium=referral',
  },
};
await writeFile(
  path.join(fixture, 'src/content/articles/test-local-priority.mdx'),
  `---\ntitle: Local cover priority\nexcerpt: Fixture\ndate: '2000.01.01'\ncategory: Test\ncoverImage: ../notes/cover-0.png\nunsplashCover: ${JSON.stringify(fallback)}\n---\nLocal cover wins.\n`
);

await writeFile(
  path.join(fixture, 'src/data/note-covers.json'),
  JSON.stringify({ version: 1, default: fallback, notes: {} })
);
// Validate actual fixture image bytes during the build without an external API.
const preload = path.join(workspace, 'image-fetch.mjs');
await writeFile(
  preload,
  `
import { readFile } from 'node:fs/promises';
const bytes = await readFile(${JSON.stringify(path.join(notes, 'cover-0.png'))});
const original = globalThis.fetch;
globalThis.fetch = (url, options) => String(url) === ${JSON.stringify(fallback.src)}
  ? Promise.resolve(new Response(bytes, { headers: { 'Content-Type': 'image/png' } }))
  : original(url, options);
`
);
const build = spawn(
  process.execPath,
  ['--import', preload, path.join(app, 'node_modules/.bin/astro'), 'build'],
  {
    cwd: fixture,
    env: { ...process.env, SITE_URL: 'https://notes-fixture.pages.dev' },
    stdio: ['ignore', 'pipe', 'pipe'],
  }
);
let output = '';
build.stdout.on('data', (data) => {
  output += data;
});
build.stderr.on('data', (data) => {
  output += data;
});
const code = await new Promise((resolve, reject) => {
  build.once('error', reject);
  build.once('close', resolve);
});
await writeFile(path.join(artifacts, 'build.log'), output);
assert.equal(
  code,
  0,
  `Fixture static build failed. See ${path.join(artifacts, 'build.log')}\n${output.slice(-3500)}`
);

// Serve only the generated static output; no dev server or client router is involved.
const dist = path.join(fixture, 'dist');
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const local = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
  if (!local.startsWith(`${dist}${path.sep}`) && local !== dist) {
    res.writeHead(403).end();
    return;
  }
  const file = path.extname(local) ? local : path.join(local, 'index.html');
  try {
    const data = await readFile(file);
    const types = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.webp': 'image/webp',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.woff2': 'font/woff2',
    };
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
    });
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true });
const report = [];
async function waitFor(fn, label) {
  const start = Date.now();
  while (!(await fn())) {
    if (Date.now() - start > 10000) throw new Error(`Timed out: ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
}
async function enhanced(page) {
  await page.locator('.notes-explorer[data-enhanced="true"]').waitFor();
}
async function desktopTop(page) {
  return page.locator('.note-scroll').evaluate((el) => el.scrollTop);
}
async function progress(page) {
  return Number(
    await page
      .locator('.note-selection-line span')
      .getAttribute('data-progress')
  );
}
async function selected(page) {
  return page
    .locator('.note-entry.is-selected a.note-photo-link')
    .getAttribute('data-note-id');
}
try {
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 1000 },
  });
  const staticPage = await nojs.newPage();
  await staticPage.goto(`${origin}/notes/`);
  assert.equal(await staticPage.locator('.note-entry').count(), 40);
  const links = await staticPage
    .locator('.note-entry a.note-photo-link')
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('href')));
  assert.equal(new Set(links).size, 40);
  await staticPage.goto(`${origin}${links[0]}`);
  assert.match(
    await staticPage.locator('.note-body').textContent(),
    /정적 본문 test-00/
  );
  assert.equal(
    await staticPage.locator('link[rel=canonical]').getAttribute('href'),
    'https://notes-fixture.pages.dev/notes/test-00/'
  );
  assert.match(
    await staticPage
      .locator('meta[property="og:image"]')
      .getAttribute('content'),
    /^https:\/\/notes-fixture.pages.dev\/notes-media\//
  );
  const sitemap = await readFile(path.join(dist, 'sitemap-0.xml'), 'utf8');
  assert.match(sitemap, /notes\/test-39/);
  assert.ok(!sitemap.includes('/notes/draft'));
  const articleCoverSources = [];
  for (const route of ['/', '/articles/', '/articles/infra/mac-mini-server/']) {
    await staticPage.goto(`${origin}${route}`);
    assert.ok(
      (await staticPage
        .locator('img[src^="https://images.unsplash.com/"]')
        .count()) > 0
    );
    articleCoverSources.push(
      await staticPage
        .locator('img[src^="https://images.unsplash.com/"]')
        .first()
        .getAttribute('src')
    );
    const credit = staticPage.locator('[data-unsplash-credit]').first();
    assert.equal(await credit.locator('a').count(), 2);
    assert.equal(
      await credit.evaluate((node) => Boolean(node.closest('a'))),
      false
    );
    assert.match(
      await credit.locator('a').first().getAttribute('href'),
      /^https:\/\/unsplash\.com\//
    );
  }
  assert.equal(
    new Set(articleCoverSources).size,
    1,
    'Same fixed cover on home/list/detail'
  );
  await staticPage.goto(`${origin}/articles/test-local-priority/`);
  assert.equal(await staticPage.locator('[data-unsplash-credit]').count(), 0);
  assert.equal(
    await staticPage.locator('article img[src^="/_astro/"]').count(),
    1
  );
  await staticPage.goto(`${origin}/articles/`);
  assert.ok(
    (await staticPage.locator('img[src^="/_astro/"]').count()) > 0,
    'Local Article covers still use optimized assets'
  );
  report.push(
    'Article Unsplash hotlink and independent credits on home/list/detail; local cover assets passed'
  );
  await nojs.close();
  report.push(
    '40 unique static links, no-JS body, canonical/OG/sitemap and draft exclusion passed'
  );

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    addEventListener('pageshow', (event) => {
      document.documentElement.dataset.bfcache = String(event.persisted);
    });
  });
  await page.goto(`${origin}/notes/`);
  await enhanced(page);
  assert.equal(await page.locator('.note-entry').count(), 10);
  assert.equal(await selected(page), 'test-00');
  assert.equal(await desktopTop(page), 0);
  const fullHeight = await page
    .locator('.note-scroll')
    .evaluate((el) => el.scrollHeight);
  assert.equal(await progress(page), 0);
  await page.locator('.note-scroll').evaluate((el) => {
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  });
  await waitFor(
    async () => Math.abs((await progress(page)) - 0.5) < 0.001,
    'overall 50%'
  );
  assert.equal(
    await page.locator('.note-scroll').evaluate((el) => el.scrollHeight),
    fullHeight
  );
  assert.equal(await page.locator('.note-entry').count(), 30);
  assert.equal(await selected(page), 'test-20');
  await page
    .locator('.note-preview .note-image-frame[data-image-state=ready]')
    .waitFor();
  const previewRatio = await page
    .locator('.note-preview .note-image-frame')
    .evaluate((el) => el.clientWidth / el.clientHeight);
  assert.ok(previewRatio < 1.8, `Preview image is too flat: ${previewRatio}`);
  await page.screenshot({
    animations: 'disabled',
    path: path.join(artifacts, 'desktop.png'),
  });
  const before = await desktopTop(page);
  await page.locator('.note-preview .note-read').click();
  await page.waitForURL('**/notes/test-20/');
  assert.match(
    await page.locator('.note-body').textContent(),
    /정적 본문 test-20/
  );
  await page
    .locator('.note-cover .note-image-frame[data-image-state=ready]')
    .waitFor();
  await page.screenshot({
    animations: 'disabled',
    path: path.join(artifacts, 'detail.png'),
  });
  await page.goBack();
  await enhanced(page);
  await waitFor(
    async () => Math.abs((await desktopTop(page)) - before) <= 2,
    'desktop Back position'
  );
  assert.equal(await selected(page), 'test-20');
  report.push(
    `Desktop Back <=2px passed; observed bfcache=${await page.locator('html').getAttribute('data-bfcache')}`
  );
  await page.locator('.note-scroll').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await waitFor(async () => (await progress(page)) === 1, '100%');
  assert.equal(await selected(page), 'test-39');
  assert.equal(await page.locator('.note-entry').count(), 40);
  assert.equal(
    await page.locator('.note-scroll').evaluate((el) => el.scrollHeight),
    fullHeight
  );
  await page.locator('.note-scroll').evaluate((el) => {
    el.scrollTop = 220 * 4;
  });
  await waitFor(
    async () => (await selected(page)) === 'test-04',
    'reverse selection'
  );
  await page.locator('a[data-note-id="test-05"]').focus();
  await waitFor(
    async () => (await selected(page)) === 'test-05',
    'keyboard selection'
  );
  await page.keyboard.press('Enter');
  await page.waitForURL('**/notes/test-05/');
  await page.goBack();
  await enhanced(page);
  assert.equal(await selected(page), 'test-05');
  await page.setViewportSize({ width: 390, height: 844 });
  await waitFor(
    async () => (await selected(page)) === 'test-05',
    'responsive anchor'
  );
  assert.equal(await page.locator('.note-preview').isVisible(), false);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    true
  );
  await waitFor(
    async () => (await page.evaluate(() => scrollY)) > 0,
    'mobile anchor applied'
  );
  await page.evaluate(() => window.scrollTo(0, 2400));
  await waitFor(
    async () => (await page.evaluate(() => scrollY)) === 2400,
    'mobile scroll'
  );
  await waitFor(
    async () => Number(await progress(page)) > 0.2,
    'mobile progress'
  ).catch(async (error) => {
    console.log(
      await page.evaluate(() => ({
        top: scrollY,
        height: innerHeight,
        full: document.documentElement.scrollHeight,
        progress: document.querySelector('.note-selection-line span').dataset
          .progress,
        body: getComputedStyle(document.body).overflow,
        html: getComputedStyle(document.documentElement).overflow,
      }))
    );
    throw error;
  });
  const mobileId = await selected(page);
  const mobileBefore = await page.evaluate(() => scrollY);
  await page.screenshot({
    animations: 'disabled',
    path: path.join(artifacts, 'mobile.png'),
  });
  await page.locator('.note-selected-label a').click();
  await page.waitForURL(`**/notes/${mobileId}/`);
  await page.goBack();
  await enhanced(page);
  await waitFor(
    async () =>
      Math.abs((await page.evaluate(() => scrollY)) - mobileBefore) <= 2,
    'mobile Back'
  );
  assert.equal(await selected(page), mobileId);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(
    await page
      .locator('.note-entry-photo')
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    '0s'
  );
  await page.setViewportSize({ width: 320, height: 568 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    true
  );
  await page.getByRole('button', { name: '테마 전환' }).click();
  assert.ok(
    await page.locator('html').evaluate((el) => el.classList.contains('dark'))
  );
  await page.locator('.note-selected-label a').click();
  await page.getByRole('link', { name: 'Notes', exact: true }).click();
  await enhanced(page);
  await waitFor(
    async () => (await selected(page)) === 'test-00',
    'fresh Notes entry starts at newest'
  );
  assert.equal(await page.evaluate(() => scrollY), 0);
  assert.deepEqual(errors, []);
  report.push(
    'newest-first entry, taller preview, batch denominator, 100%, reverse, keyboard, desktop/mobile anchor, mobile Back, 320px, dark and reduced motion passed'
  );
  await context.close();

  const mediaContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const fixtureImage = await readFile(path.join(notes, 'cover-0.png'));
  let fallbackRequests = 0;
  await mediaContext.route('**/notes-media/**', (route) => route.abort());
  await mediaContext.route('https://images.unsplash.com/**', async (route) => {
    fallbackRequests++;
    await route.fulfill({ contentType: 'image/png', body: fixtureImage });
  });
  const mediaPage = await mediaContext.newPage();
  await mediaPage.goto(`${origin}/notes/test-00/`);
  await mediaPage
    .locator('.note-image-frame[data-image-state="ready"]')
    .waitFor();
  assert.match(
    await mediaPage.locator('.note-cover img').getAttribute('src'),
    /images.unsplash.com/
  );
  assert.match(
    await mediaPage.locator('.note-credit').textContent(),
    /Fixture Photographer.*Unsplash/
  );
  assert.equal(fallbackRequests, 1);
  await mediaContext.unroute('https://images.unsplash.com/**');
  await mediaContext.route('https://images.unsplash.com/**', (route) =>
    route.abort()
  );
  await mediaPage.reload();
  await mediaPage
    .locator('.note-image-frame[data-image-state="empty"]')
    .waitFor();
  assert.equal(await mediaPage.locator('.note-cover img').count(), 0);
  assert.match(
    await mediaPage.locator('.note-body').textContent(),
    /정적 본문/
  );
  await mediaContext.close();
  report.push(
    'cached image error, one attributed fallback and final network-free placeholder passed'
  );

  const denied = await browser.newContext();
  await denied.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Denied', 'SecurityError');
      },
    });
  });
  const deniedPage = await denied.newPage();
  await deniedPage.goto(`${origin}/notes/`);
  await enhanced(deniedPage);
  await deniedPage.locator('.note-read').click();
  assert.match(deniedPage.url(), /\/notes\/test-00\//);
  await denied.close();
  report.push('denied storage preserves detail navigation');
  console.log(report.join('\n'));
  await writeFile(
    path.join(artifacts, 'report.json'),
    JSON.stringify({ passed: true, checks: report }, null, 2)
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
