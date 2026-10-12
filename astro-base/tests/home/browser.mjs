import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const app = process.cwd();
const fixtureDist = path.join(app, '.cache/notes-test/app/dist');
const productionDist = path.join(app, 'dist');

// Reuse the existing 40-note fixture, including its local images and draft exclusion.
execFileSync(process.execPath, ['tests/notes/browser.mjs'], {
  cwd: app,
  stdio: 'inherit',
});

async function serve(dist) {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const target = path.resolve(dist, `.${decodeURIComponent(url.pathname)}`);
    if (!target.startsWith(`${dist}${path.sep}`) && target !== dist) {
      response.writeHead(403).end();
      return;
    }
    const file = path.extname(target)
      ? target
      : path.join(target, 'index.html');
    try {
      const data = await readFile(file);
      const type =
        {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.webp': 'image/webp',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.woff2': 'font/woff2',
        }[path.extname(file)] ?? 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': type }).end(data);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

const fixture = await serve(fixtureDist);
const production = await serve(productionDist);
const browser = await chromium.launch({ headless: true });
try {
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(production.origin);
  assert.equal(await staticPage.locator('.home-article').count(), 4);
  assert.equal(await staticPage.locator('.home-note-card').count(), 0);
  assert.equal(await staticPage.locator('#home-notes-empty').isVisible(), true);
  assert.equal(await staticPage.locator('#home-note-controls').count(), 0);
  assert.equal(
    (await staticPage.locator('a[href="/notes/"]').count()) > 0,
    true
  );
  assert.equal(
    await staticPage.getByText('카테고리', { exact: true }).count(),
    0
  );
  assert.equal(await staticPage.locator('.home-article img').count(), 4);
  const destinations = await staticPage
    .locator('.home-article a')
    .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  assert.equal(new Set(destinations).size, 4);
  assert.ok(destinations.every((href) => href.startsWith('/articles/')));
  await staticContext.close();

  const motionPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await motionPage.addInitScript(() => {
    window.__homeImageStarts = 0;
    const firstImage = () => document.querySelector('.home-article-media img');
    document.addEventListener(
      'transitionrun',
      (event) => {
        if (event.target === firstImage() && event.propertyName === 'transform')
          window.__homeImageStarts++;
      },
      true
    );
    document.addEventListener(
      'animationstart',
      (event) => {
        if (
          event.target === firstImage() &&
          event.animationName === 'home-image-enter'
        )
          window.__homeImageStarts++;
      },
      true
    );
  });
  await motionPage.goto(production.origin);
  for (let visit = 0; visit < 3; visit++) {
    if (visit) await motionPage.reload();
    await motionPage.waitForTimeout(750);
    assert.ok(
      await motionPage.evaluate(() => window.__homeImageStarts > 0),
      `First image animation missed on visit ${visit + 1}`
    );
  }
  await motionPage.locator('.home-article a').first().hover();
  await motionPage.waitForTimeout(750);
  assert.ok(
    await motionPage
      .locator('.home-article img')
      .first()
      .evaluate(
        (image) =>
          new DOMMatrixReadOnly(getComputedStyle(image).transform).a > 1.04
      )
  );
  await motionPage.mouse.move(0, 0);
  await motionPage.keyboard.press('Tab');
  await motionPage.locator('.home-article a').first().focus();
  await motionPage.waitForTimeout(750);
  assert.equal(
    await motionPage
      .locator('.home-article a')
      .first()
      .evaluate((link) => link.matches(':focus-visible')),
    true
  );
  assert.ok(
    await motionPage
      .locator('.home-article img')
      .first()
      .evaluate(
        (image) =>
          new DOMMatrixReadOnly(getComputedStyle(image).transform).a > 1.04
      )
  );
  await motionPage.emulateMedia({ reducedMotion: 'reduce' });
  await motionPage.reload();
  assert.equal(
    await motionPage.evaluate(() =>
      document.documentElement.classList.contains('home-has-motion')
    ),
    false
  );
  assert.equal(
    await motionPage
      .locator('.home-article img')
      .first()
      .evaluate((image) => getComputedStyle(image).animationName),
    'none'
  );
  await motionPage.close();

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.goto(fixture.origin);
  assert.equal(await page.locator('.home-note-card').count(), 10);
  assert.equal(
    await page.locator('.home-note-card a').first().getAttribute('href'),
    '/notes/test-00/'
  );
  assert.equal(
    await page.locator('#home-note-range').textContent(),
    '1–4 / 10'
  );
  assert.equal(await page.locator('#home-note-prev').isDisabled(), true);
  await page.locator('#home-note-next').click();
  await page.waitForFunction(
    () => document.querySelector('#home-note-range')?.textContent === '2–5 / 10'
  );
  for (let i = 0; i < 5; i++) {
    await page.locator('#home-note-next').click();
    await page.waitForFunction(
      (first) =>
        document
          .querySelector('#home-note-range')
          ?.textContent?.startsWith(`${first}–`),
      i + 3
    );
  }
  assert.equal(
    await page.locator('#home-note-range').textContent(),
    '7–10 / 10'
  );
  assert.equal(await page.locator('#home-note-next').isDisabled(), true);
  await page.locator('.home-note-card a').last().click();
  await page.waitForURL('**/notes/test-09/');
  await page.goBack();
  assert.equal(await page.locator('.home-note-card').count(), 10);

  await page.locator('.home-note-card a').first().focus();
  assert.equal(
    await page
      .locator('.home-note-card')
      .first()
      .evaluate((el) => el.matches(':focus-within')),
    true
  );
  await page.getByRole('button', { name: '테마 전환' }).click();
  assert.equal(
    await page.locator('html').evaluate((el) => el.classList.contains('dark')),
    true
  );
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(
    await page
      .locator('.home-note-card')
      .first()
      .evaluate((el) => getComputedStyle(el, '::before').transitionDuration),
    '0s'
  );
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    ),
    true
  );
  assert.ok(await page.locator('#home-note-next').isVisible());
  await context.close();
  console.log(
    'Home static content, 10-note slider, navigation, dark/reduced motion, and mobile passed'
  );
} finally {
  await browser.close();
  await new Promise((resolve) => fixture.server.close(resolve));
  await new Promise((resolve) => production.server.close(resolve));
}
