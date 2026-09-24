import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
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
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log(m.text());
  });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:4173/cyber.html?case=colonial', {
    waitUntil: 'networkidle0',
  });
  await page.waitForSelector('#app[data-ready="true"]');
  await page.$eval('.system-scene', (e) => (e.dataset.identity = 'retained'));
  const before = await page.$eval('.system-scene', (e) =>
    e.getBoundingClientRect().toJSON(),
  );
  await page.click('.it-component rect');
  await new Promise((r) => setTimeout(r, 500));
  assert.equal(
    await page.$eval('.system-scene', (e) => e.dataset.identity),
    'retained',
    'Opening evidence must preserve the scene DOM',
  );
  assert.deepEqual(
    await page.$eval('.system-scene', (e) =>
      e.getBoundingClientRect().toJSON(),
    ),
    before,
  );
  assert.match(await page.$eval('#panel', (e) => e.textContent), /testimony/i);
  await page.click('#close-inspector');
  assert.equal(
    await page.$eval('.system-scene', (e) => e.dataset.identity),
    'retained',
  );
  await page.click('[data-event="event-recovery"]');
  assert.match(
    await page.$eval('.pipe-component', (e) => e.textContent),
    /RESTARTED/,
  );
  await page.click('[data-event="event-attack"]');
  assert.match(
    await page.$eval('.pipe-component', (e) => e.textContent),
    /SHUTDOWN/,
  );
  await page.click('[data-event="event-attribution"]');
  assert.match(
    await page.$eval('.attribution-component', (e) => e.textContent),
    /DarkSide/,
  );
  await page.click('[data-entity="pipeline"]');
  assert.equal(
    await page.$eval('.system-scene', (e) => e.dataset.focus),
    'pipeline',
  );
  await page.screenshot({ path: 'output/persistent-desktop.png' });
  await page.click('.geography-component rect');
  assert.match(
    await page.$eval('#panel', (e) => e.textContent),
    /Energy Information/,
  );
  await page.click('#close-inspector');
  await page.setViewport({ width: 390, height: 844 });
  await page.screenshot({
    path: 'output/persistent-mobile.png',
    fullPage: true,
  });
  await page.click('.pipe-component rect');
  assert.equal(
    await page.$eval('#investigation', (e) => getComputedStyle(e).position),
    'fixed',
  );
  await page.screenshot({ path: 'output/persistent-mobile-evidence.png' });
  await page.click('#close-inspector');
  assert.equal(
    await page.$eval('#investigation', (e) => getComputedStyle(e).display),
    'none',
  );
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  await page.select('#case-picker', 'kyivstar');
  await page.waitForFunction(() =>
    document.querySelector('.stage-heading')?.textContent.includes('Kyivstar'),
  );
  await page.waitForSelector('#app[data-ready="true"]');
  await page.click('#interval');
  assert.match(await page.$eval('#panel', (e) => e.textContent), /2024-01-22/);
  assert.deepEqual(errors, []);
  console.log(
    'PASS: persistent DOM and layout on evidence, reversible timeline state, attribution, subject focus, matched source, mobile drawer and no overflow/errors',
  );
} finally {
  await browser.close();
}
