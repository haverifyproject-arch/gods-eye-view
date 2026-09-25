import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4180';
const output = path.resolve(
  process.env.QA_OUTPUT_DIR || 'artifacts/native-reset',
);
await mkdir(output, { recursive: true });
const report = {
  provenance: {
    baseURL,
    startedAt: new Date().toISOString(),
    serverMode: process.env.QA_SERVER_MODE || 'unspecified',
    revision: execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim(),
  },
  checks: [],
  pageErrors: [],
  consoleErrors: [],
  providerResponses: [],
  visualAcceptance: 'PENDING: inspect native-reset.png',
};
const check = (name, passed, detail) => {
  report.checks.push({ name, passed: !!passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
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
page.on('console', (message) => {
  if (message.type() === 'error') report.consoleErrors.push(message.text());
});
page.on('response', (response) => {
  if (response.url().includes('earthquake.usgs.gov'))
    report.providerResponses.push({
      url: response.url(),
      status: response.status(),
    });
});
const camera = () =>
  page.evaluate(() => {
    const position = window.__godsEyeView.viewer.camera.positionCartographic;
    return [position.longitude, position.latitude, position.height];
  });
try {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  const hash = '#lat=44&lon=12&alt=5000000&heading=0&pitch=-90&style=normal';
  await page.goto(
    `${baseURL}/?situation=tonga&story=1&welcome=0&qa_preserve=yes${hash}`,
    { waitUntil: 'domcontentloaded', timeout: 90000 },
  );
  await page.waitForFunction(() => window.__godsEyeView?.dataManager, {
    timeout: 90000,
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#loading-screen')?.style.display === 'none' ||
      getComputedStyle(document.querySelector('#loading-screen')).opacity ===
        '0',
    { timeout: 60000 },
  );
  const entry = await page.evaluate(() => ({
    url: location.href,
    hash: location.hash,
    retired: ['#reality-mode', '#reality-story', '#reality-launch'].filter(
      (id) => document.querySelector(id),
    ),
    bodyActive: document.body.classList.contains('reality-active'),
    nativePanel: !!document.querySelector('#data-panel'),
    canvasCount: document.querySelectorAll('.cesium-widget canvas').length,
    globalMission: !!window.__realityDebugger,
    layers: [...window.__godsEyeView.dataManager.layers.keys()],
  }));
  const url = new URL(entry.url);
  check(
    'Retired query entry cannot mount mission or story',
    !entry.retired.length && !entry.bodyActive && !entry.globalMission,
    entry,
  );
  check(
    'Only retired query parameters are removed',
    !url.searchParams.has('situation') &&
      !url.searchParams.has('story') &&
      url.searchParams.get('qa_preserve') === 'yes',
  );
  const restoredHash = new URLSearchParams(entry.hash.slice(1));
  check(
    'Native shared camera hash survives reset',
    Number(restoredHash.get('lat')) === 44 &&
      Number(restoredHash.get('lon')) === 12 &&
      Number(restoredHash.get('alt')) === 5000000 &&
      Number(restoredHash.get('heading')) % 360 === 0 &&
      Number(restoredHash.get('pitch')) === -90 &&
      restoredHash.get('style') === 'normal',
    entry.hash,
  );
  check(
    'Native controls and single viewer remain',
    entry.nativePanel &&
      entry.canvasCount === 1 &&
      entry.layers.includes('earthquakes') &&
      entry.layers.includes('telegeography-submarine-cables'),
    entry.layers,
  );
  await page.waitForFunction(
    () => {
      const p = window.__godsEyeView.viewer.camera.positionCartographic;
      return (
        Math.abs(p.longitude - (12 * Math.PI) / 180) < 0.05 &&
        Math.abs(p.latitude - (44 * Math.PI) / 180) < 0.05
      );
    },
    { timeout: 30000 },
  );
  check(
    'Shared camera restored instead of historical destination',
    true,
    await camera(),
  );
  const before = await camera();
  await page.mouse.move(720, 440);
  await page.mouse.down();
  await page.mouse.move(870, 480, { steps: 15 });
  await page.mouse.up();
  await page.mouse.wheel({ deltaY: -350 });
  await page.waitForFunction(
    (before) => {
      const p = window.__godsEyeView.viewer.camera.positionCartographic;
      return (
        Math.abs(p.longitude - before[0]) > 0.001 ||
        Math.abs(p.latitude - before[1]) > 0.001 ||
        Math.abs(p.height - before[2]) > 1000
      );
    },
    {},
    before,
  );
  check(
    'Unscripted pointer navigation moves the native camera',
    true,
    await camera(),
  );
  await page.evaluate(() =>
    window.__godsEyeView.dataManager.setEnabled('earthquakes', true),
  );
  check(
    'Existing earthquake layer independently enables',
    await page.evaluate(() =>
      window.__godsEyeView.dataManager.isEnabled('earthquakes'),
    ),
  );
  report.nativeContext = await page.evaluate(() => ({
    keys: [...(window.__gevContextStore?.entities?.keys() || [])],
    selected: window.__gevContextStore?.selectedEntityId ?? null,
    activeLayers: [...window.__godsEyeView.dataManager.getEnabledLayerIds()],
  }));
  check(
    'Native current context is not a historical mission selection',
    !report.nativeContext.selected?.startsWith('tonga'),
    report.nativeContext,
  );
  await page.click('#data-panel .panel-collapse-btn');
  await page.screenshot({ path: path.join(output, 'native-reset.png') });
  await page.evaluate(() =>
    window.__godsEyeView.dataManager.setEnabled('earthquakes', false),
  );
  check(
    'Existing earthquake layer independently disables',
    !(await page.evaluate(() =>
      window.__godsEyeView.dataManager.isEnabled('earthquakes'),
    )),
  );
  check(
    'No unhandled application exceptions',
    report.pageErrors.length === 0,
    report.pageErrors,
  );
} catch (error) {
  check('Native reset harness completes', false, error.stack || error.message);
  await page
    .screenshot({ path: path.join(output, 'native-reset-failure.png') })
    .catch(() => {});
} finally {
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
if (report.checks.some((item) => !item.passed)) process.exitCode = 1;
