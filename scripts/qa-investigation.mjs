import puppeteer from 'puppeteer';
import { mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const output = path.resolve('artifacts/investigation');
await mkdir(output, { recursive: true });
const report = {
  checks: [],
  pageErrors: [],
  providers: [],
  startedAt: new Date().toISOString(),
};
const check = (name, passed, detail) => {
  report.checks.push({ name, passed: !!passed, detail });
  console.log(passed ? 'PASS' : 'FAIL', name);
};
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
});
const page = await browser.newPage();
page.on('pageerror', (error) => report.pageErrors.push(error.message));
page.on('response', (response) => {
  if (response.url().includes('api.ioda'))
    report.providers.push({ url: response.url(), status: response.status() });
});
const capture = (name) =>
  page.screenshot({ path: path.join(output, `${name}.png`) });
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
try {
  await page.setViewport({ width: 1440, height: 900 });
  const cdp = await page.createCDPSession();
  await cdp.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: output,
  });
  await page.goto(
    `${process.env.QA_BASE_URL || 'http://127.0.0.1:4180'}/?welcome=0`,
    { waitUntil: 'domcontentloaded', timeout: 90000 },
  );
  await page.waitForFunction(
    () =>
      window.__godsEyeView?.worldDebug &&
      (document.querySelector('#loading-screen')?.style.display === 'none' ||
        getComputedStyle(document.querySelector('#loading-screen')).opacity ===
          '0'),
    { timeout: 90000 },
  );
  await capture('01-entrance');
  const initialCamera = await page.evaluate(() => {
    const c = window.__godsEyeView.viewer.camera.positionCartographic;
    return [c.longitude, c.latitude, c.height];
  });
  check(
    'Discoverable entrance names the investigation',
    await page.$eval('[data-debug-action="explore"]', (node) =>
      node.innerText.includes('Internet anomaly'),
    ),
  );
  await page.click('[data-debug-action="explore"]');
  await page
    .waitForFunction(
      () => !!window.__godsEyeView.worldDebug.getState().progress,
      { timeout: 60000 },
    )
    .catch(() => {});
  await capture('02-checking');
  await page.waitForFunction(
    () => {
      const state = window.__godsEyeView.worldDebug.getState();
      return (
        state.status === 'ready' && !state.progress && !!state.investigation
      );
    },
    { timeout: 120000 },
  );
  await page
    .waitForFunction(
      () => window.__godsEyeView.viewer.scene.globe.tilesLoaded,
      { timeout: 30000 },
    )
    .catch(() => {});
  await pause(1000);
  report.assessment = await page.evaluate(
    () => window.__godsEyeView.worldDebug.getState().investigation,
  );
  await capture('03-assessment');
  check(
    'Explore materially moves the world to the anomaly',
    await page.evaluate((initial) => {
      const c = window.__godsEyeView.viewer.camera.positionCartographic;
      return (
        Math.abs(c.longitude - initial[0]) + Math.abs(c.latitude - initial[1]) >
          0.01 || Math.abs(c.height - initial[2]) > 10000
      );
    }, initialCamera),
  );
  check(
    'Live source checks produce an explicit assessment',
    report.assessment.checks?.length === 2 &&
      report.assessment.verdict !== 'pending',
    {
      verdict: report.assessment.verdict,
      checks: report.assessment.checks?.map(
        ({ id, status, stale, comparison }) => ({
          id,
          status,
          stale,
          comparison,
        }),
      ),
    },
  );
  check(
    'Same-publisher limitation is explicit',
    report.assessment.unknowns.some((text) =>
      text.includes('not independent-provider'),
    ),
  );
  check(
    'No permanent mission or story shell',
    await page.evaluate(
      () => !document.querySelector('#reality-mode, #reality-story'),
    ),
  );
  const downloadStarted = Date.now();
  let downloaded = false;
  await page.click('[data-debug-action="export"]');
  for (let attempt = 0; attempt < 20; attempt++) {
    const files = (await readdir(output)).filter((file) =>
      file.endsWith('.md'),
    );
    const stamps = await Promise.all(
      files.map((file) => stat(path.join(output, file))),
    );
    downloaded = stamps.some((file) => file.mtimeMs >= downloadStarted);
    if (downloaded) break;
    await pause(500);
  }
  check('Findings download as Markdown', downloaded);
  await page.click('#world-debug-world-controls > summary');
  await page.select('#world-debug-filter', 'observed');
  await pause(250);
  check(
    'Evidence filter changes native relationship visibility',
    await page.evaluate(() => {
      const s = window.__godsEyeView.worldDebug.getState();
      return (
        s.filter === 'observed' &&
        s.relationships.every((r) => !r.visible || r.state === 'OBSERVED')
      );
    }),
  );
  await page.select('#world-debug-filter', 'all');
  await page.click('#world-debug-world-controls [data-debug-action="sources"]');
  await pause(250);
  await capture('04-source');
  check(
    'Source inspection provides visible evidence',
    await page.$eval('#world-debug-evidence', (node) => !!node.innerText),
  );
  await page.setViewport({ width: 390, height: 844 });
  await pause(400);
  await capture('05-mobile-source');
  check(
    'Mobile popover fits viewport',
    await page.$eval('#world-debug-popover', (node) => {
      const r = node.getBoundingClientRect();
      return (
        r.left >= 0 &&
        r.right <= innerWidth &&
        r.top >= 0 &&
        r.bottom <= innerHeight
      );
    }),
  );
  await page.$eval('#world-debug-popover', (node) => {
    node.scrollTop = 0;
  });
  await capture('06-mobile-assessment');
  await page.click('#world-debug-world-controls [data-debug-action="clear"]');
  check(
    'Clear removes investigation and closes popover',
    await page.evaluate(
      () =>
        !window.__godsEyeView.worldDebug.getState().investigation &&
        document.querySelector('#world-debug-popover').hidden,
    ),
  );
  await capture('07-mobile-cleared');
} catch (error) {
  report.failure = error.stack;
  check('Workflow completed', false, error.message);
} finally {
  report.visualAcceptance = 'Pending screenshot inspection';
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
if (report.checks.some((item) => !item.passed)) process.exitCode = 1;
