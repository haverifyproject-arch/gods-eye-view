import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
try {
  const page = await browser.newPage();
  const errors = [],
    external = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.url().startsWith('https://')) external.push(r.url());
  });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:4173/cyber.html?case=colonial', {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('#app[data-ready="true"]');
  await page.waitForSelector('#globe[data-rendered="true"]');
  await new Promise((r) => setTimeout(r, 1700));
  const before = await (await page.$('#globe canvas')).screenshot();
  assert.ok(
    (await sharp(before).stats()).channels[0].stdev > 15,
    'Globe must contain visible geography',
  );
  await page.screenshot({ path: 'output/explorer-desktop.png' });
  await page.click('[data-place="houston"]');
  await new Promise((r) => setTimeout(r, 1600));
  assert.notDeepEqual(
    await (await page.$('#globe canvas')).screenshot(),
    before,
    'Drill-down changes rendered geography',
  );
  assert.match(
    await page.$eval('#selection-context', (e) => e.textContent),
    /Houston/,
  );
  await page.click('[data-claim="c-houston"]');
  assert.match(await page.$eval('#panel', (e) => e.textContent), /Census/);
  assert.equal(await page.$eval('#globe', (e) => e.dataset.focus), 'houston');
  await page.click('#close-inspector');
  await page.click('#compare-toggle');
  assert.match(
    await page.$eval('#comparison-rows', (e) => e.textContent),
    /Shutdown reported/,
  );
  assert.match(
    await page.$eval('#comparison-rows', (e) => e.textContent),
    /Full-system restart/,
  );
  await page.screenshot({ path: 'output/explorer-comparison.png' });
  await page.click('[data-date="event-recovery"]');
  assert.equal(
    await page.$eval('#globe', (e) => e.dataset.milestone),
    'event-recovery',
  );
  await page.click('#compare-close');
  await page.click('#tour-start');
  await page.click('#tour-next');
  assert.equal(await page.$eval('#globe', (e) => e.dataset.focus), 'houston');
  await page.screenshot({ path: 'output/explorer-tour.png' });
  await page.click('#tour-close');
  await page.click('#system-view');
  assert.equal(
    await page.$eval('#app', (e) => e.classList.contains('globe-explorer')),
    false,
  );
  await page.$eval('.system-scene', (e) => (e.dataset.identity = 'retained'));
  await page.click('.it-component rect');
  assert.equal(
    await page.$eval('.system-scene', (e) => e.dataset.identity),
    'retained',
  );
  await page.click('#close-inspector');
  await page.click('#geography-view');
  await page.setViewport({ width: 390, height: 844 });
  await page.click('[data-place="linden"]');
  await new Promise((r) => setTimeout(r, 1600));
  await page.screenshot({ path: 'output/explorer-mobile.png', fullPage: true });
  await page.click('#context-evidence');
  assert.match(await page.$eval('#panel', (e) => e.textContent), /Census/);
  await page.click('#close-inspector');
  await page.click('#world-evidence');
  assert.equal(
    await page.$eval('#investigation', (e) => getComputedStyle(e).position),
    'fixed',
  );
  await page.click('#close-inspector');
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.click('#share-view');
  assert.match(page.url(), /subject=linden/);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('#app[data-ready="true"]');
  assert.match(
    await page.$eval('#selection-context', (e) => e.textContent),
    /Linden/,
  );
  await page.select('#case-picker', 'kyivstar');
  await page.waitForFunction(() =>
    document.querySelector('.stage-heading')?.textContent.includes('Kyivstar'),
  );
  await page.waitForSelector('#app[data-ready="true"]');
  await page.click('#interval');
  assert.match(await page.$eval('#panel', (e) => e.textContent), /2024-01-22/);
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(
    'PASS: rendered globe, geographic drill-down, Census evidence, date comparison, tour, stable dependency scene, mobile drawer, share restoration and optional Kyivstar. Zero external data requests.',
  );
} finally {
  await browser.close();
}
