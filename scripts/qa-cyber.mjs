/** Real-browser offline acceptance. Run against dev or preview: node scripts/qa-cyber.mjs [URL]. */
import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
const url = process.argv[2] || 'http://127.0.0.1:4173/cyber.html';
mkdirSync('output', { recursive: true });
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
  timeout: 60000,
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  const errors = [],
    external = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  const network = await page.createCDPSession();
  await network.send('Network.enable');
  await network.send('Network.setBlockedURLs', { urls: ['https://*'] });
  page.on('request', (r) => {
    if (
      /^https?:/.test(r.url()) &&
      new URL(r.url()).origin !== new URL(url).origin
    )
      external.push(r.url());
  });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('#app[data-ready="true"]', { timeout: 60000 });
  assert.equal(
    await page.$eval('#app', (e) => e.dataset.globe),
    'ready',
    'Real WebGL globe must render',
  );
  await page.waitForSelector('#globe[data-rendered="true"]');
  const canvas = await page.$('#globe canvas');
  const pixels = await canvas.screenshot();
  const stats = await sharp(pixels).stats();
  assert.ok(
    stats.channels.slice(0, 3).some((channel) => channel.stdev > 15),
    'Globe pixels must contain rendered geography, not a uniform blank canvas',
  );
  await page.screenshot({ path: 'output/cyber-desktop.png' });
  await page.click('#interval');
  assert.match(await page.$eval('#panel', (e) => e.textContent), /2024-01-22/);
  assert.match(
    await page.$eval('#panel', (e) => e.textContent),
    /published summary/i,
  );
  await page.screenshot({ path: 'output/cyber-evidence.png' });
  await page.select('#timezone', 'Kyiv');
  assert.match(
    await page.$eval('#interval-time', (e) => e.textContent),
    /06:30/,
  );
  await page.click('[data-event="event-voice"]');
  assert.match(await page.$eval('#panel', (e) => e.textContent), /18:00 Kyiv/);
  await page.click('[data-event="event-recovery"]');
  assert.match(
    await page.$eval('#panel', (e) => e.textContent),
    /government-controlled territory/,
  );
  await page.click('#map-select');
  assert.match(
    await page.$eval('#selection-context', (e) => e.textContent),
    /Country-level context/,
  );
  await page.click('#boundary-toggle');
  await page.click('#imagery-toggle');
  await page.click('#boundary-toggle');
  await page.click('#imagery-toggle');
  await page.click('#focus');
  await page.click('#evidence-tab');
  await page.type('#evidence-search', 'cloudflare');
  assert.equal(await page.$$eval('.source-card', (e) => e.length), 1);
  await page.click('#findings-tab');
  await page.keyboard.press('ArrowRight');
  assert.equal(
    await page.$eval('#evidence-tab', (e) => e.getAttribute('aria-selected')),
    'true',
  );
  await page.keyboard.press('Escape');
  assert.equal(
    await page.$eval('#findings-tab', (e) => e.getAttribute('aria-selected')),
    'true',
  );
  await page.click('[data-event="event-attack"]');
  for (const [width, height, name] of [
    [1100, 800, 'laptop'],
    [390, 844, 'mobile'],
  ]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `${name} must not overflow horizontally`,
    );
    await page.screenshot({ path: `output/cyber-${name}.png`, fullPage: true });
  }
  assert.deepEqual(
    external,
    [],
    'Scenario must make zero external data requests',
  );
  assert.deepEqual(errors, [], 'No runtime or HTTP errors');
  console.log(
    'PASS: WebGL globe, offline assets, provenance, milestone selection, Kyiv/UTC, subject selection, layer controls, search, keyboard tabs, responsive layouts. Renderer: SwiftShader.',
  );
} finally {
  await browser.close();
}
