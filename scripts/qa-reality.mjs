import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const output = path.resolve(process.env.QA_OUTPUT_DIR || 'artifacts/reality');
await mkdir(output, { recursive: true });
const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
const report = {
  provenance: {
    baseURL,
    serverMode: process.env.QA_SERVER_MODE || 'unspecified',
    startedAt: new Date().toISOString(),
    revision: execFileSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8',
    }).trim(),
    workingTree: execFileSync('git', ['status', '--porcelain'], {
      encoding: 'utf8',
    }).trim(),
  },
  checks: [],
  captures: [],
  pageErrors: [],
  consoleErrors: [],
};
const check = (name, passed, detail) => {
  report.checks.push({ name, passed: !!passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
};
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--enable-webgl',
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
const state = () =>
  page.evaluate(() => {
    const { viewer } = window.__godsEyeView;
    const context = window.__realityDebugger.runtime.getContext();
    const source = viewer.dataSources.getByName('Reality Debugger · Tonga')[0];
    const camera = viewer.camera.positionCartographic;
    return {
      time: context.time,
      lens: context.lens,
      records: context.records.map(({ id, status }) => ({ id, status })),
      rendered:
        source?.entities.values
          .filter((entity) => entity.show)
          .map((entity) => entity.id) || [],
      camera: [camera.longitude, camera.latitude, camera.height],
    };
  });
const action = (name, args = {}) =>
  page.evaluate(
    (name, args) => window.__realityDebugger.actions.run(name, args),
    name,
    args,
  );
const renderFrame = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const scene = window.__godsEyeView.viewer.scene;
        const remove = scene.postRender.addEventListener(() => {
          remove();
          resolve();
        });
        scene.requestRender();
      }),
  );
const settle = async () => {
  await renderFrame();
  await page.waitForFunction(
    () => {
      const viewer = window.__godsEyeView.viewer;
      viewer.scene.requestRender();
      return viewer.dataSourceDisplay.ready;
    },
    { timeout: 15000, polling: 'raf' },
  );
  await renderFrame();
};
const capture = async (name) => {
  await settle();
  const snapshot = await state();
  await page.screenshot({ path: path.join(output, `${name}.png`) });
  report.captures.push({ name, ...snapshot });
  return snapshot;
};
const command = async (text) => {
  await page.type('#reality-command', text);
  await page.click('#reality-command-form button[type="submit"]');
  await settle();
};
try {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  await page.goto(`${baseURL}/?situation=tonga`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForFunction(
    () => window.__realityDebugger && window.__godsEyeView,
    { timeout: 90000 },
  );
  // This harness checks the retained exploration controls; story QA covers the default guided entry.
  if (await page.$('#story-explore')) await page.click('#story-explore');
  await settle();
  await page.evaluate(() => {
    window.__qaOriginalViewer = window.__godsEyeView.viewer;
  });
  const start = await capture('01-start');
  check(
    'Mission uses one native canvas',
    await page.$$eval('.cesium-widget canvas', (nodes) => nodes.length === 1),
  );
  check('Pacific opening is wide', start.camera[2] > 2000000, start.camera);
  if (process.env.QA_OUTAGE_ONLY === '1') {
    await action('go', { target: 'tonga' });
    await action('time', { time: '2022-01-15T05:30:00Z' });
    await capture('04-outage');
    check(
      'No unhandled application exceptions',
      report.pageErrors.length === 0,
      report.pageErrors,
    );
  }
  if (process.env.QA_TARGETED === '1') {
    await action('time', { time: '2022-01-15T04:14:00Z' });
    check('Cable traversal succeeds', (await action('follow')).ok);
    await capture('03-follow');
    await action('go', { target: 'tonga' });
    await action('time', { time: '2022-01-15T05:30:00Z' });
    await capture('04-outage');
    check(
      'Timeline preserves minute precision',
      await page.$eval('#reality-time-label', (node) =>
        /05:30/.test(node.textContent),
      ),
    );
    await page.evaluate(() => {
      window.__qaMediaChanged = new Promise((resolve) => {
        matchMedia('(prefers-reduced-motion: reduce)').addEventListener(
          'change',
          () => requestAnimationFrame(resolve),
          { once: true },
        );
      });
    });
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);
    await page.evaluate(() => window.__qaMediaChanged);
    const hit = await page.evaluate(
      () => document.elementFromPoint(100, 300)?.tagName,
    );
    check('Cancellation gesture targets canvas', hit === 'CANVAS', hit);
    await page.evaluate(() => {
      window.__qaPendingMotion = window.__realityDebugger.actions.run('follow');
    });
    await page.mouse.move(100, 300);
    await page.mouse.down();
    await page.mouse.up();
    const cancelled = await page.evaluate(() => window.__qaPendingMotion);
    check(
      'Pointer cancels motion honestly',
      cancelled.cancelled === true && !cancelled.ok,
      cancelled,
    );
    check(
      'No unhandled application exceptions',
      report.pageErrors.length === 0,
      report.pageErrors,
    );
  }
  if (
    process.env.QA_START_ONLY !== '1' &&
    process.env.QA_TARGETED !== '1' &&
    process.env.QA_OUTAGE_ONLY !== '1'
  ) {
    check(
      'Invalid destination reports failure',
      !(await action('go', { target: 'does-not-exist' })).ok,
    );
    await action('time', { time: '2022-01-15T04:14:00Z' });
    check(
      'Volcano approach succeeds',
      (await action('go', { target: 'volcano' })).ok,
    );
    const approach = await capture('02-approach');
    check(
      'Approach moves native camera',
      Math.abs(approach.camera[2] - start.camera[2]) > 100000,
    );
    check('Cable traversal succeeds', (await action('follow')).ok);
    const follow = await capture('03-follow');
    check(
      'Cable traversal ends near Fiji',
      Math.abs((follow.camera[0] * 180) / Math.PI - 178.44) < 1,
    );
    await action('go', { target: 'tonga' });
    await action('time', { time: '2022-01-15T05:30:00Z' });
    const outage = await capture('04-outage');
    check(
      'Outage changes rendered world',
      JSON.stringify(start.rendered) !== JSON.stringify(outage.rendered),
    );
    await command('observed only');
    const observed = await capture('05-observed');
    check('Text command sets observed lens', observed.lens === 'OBSERVED');
    check(
      'Observed excludes other evidence states',
      observed.records.length > 0 &&
        observed.records.every((record) => record.status === 'OBSERVED'),
    );
    check(
      'Observed materially removes geometry',
      observed.rendered.length < outage.rendered.length,
    );
    await command('all evidence');
    const full = await capture('06-full');
    check(
      'All evidence restores geometry',
      full.rendered.length > observed.rendered.length,
    );
    await page.click('#reality-unknown');
    await capture('07-unknown');
    check('Unknown lens applied', (await state()).lens === 'UNKNOWN');
    if (await page.$('#reality-close-evidence'))
      await page.click('#reality-close-evidence');
    await action('lens', { lens: 'ALL' });
    await command('show recovery');
    const recovery = await capture('08-recovery');
    check(
      'Recovery is temporally distinct',
      recovery.time.startsWith('2022-02-22'),
    );
    check(
      'Recovery changes world',
      JSON.stringify(recovery.rendered) !== JSON.stringify(outage.rendered),
    );
    await page.evaluate(() =>
      window.__realityDebugger.inspect('traffic-return'),
    );
    await capture('09-source');
    check(
      'Source includes publisher and dates',
      await page.$eval(
        '#reality-evidence',
        (node) =>
          !node.hidden &&
          /Cloudflare/.test(node.textContent) &&
          /Published/.test(node.textContent) &&
          /retrieved/i.test(node.textContent),
      ),
    );
    check(
      'Source has secure attribution link',
      await page.$eval(
        '#reality-evidence a',
        (node) =>
          node.href.startsWith('https://') && node.rel.includes('noopener'),
      ),
    );
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await capture('10-mobile-source');
    check(
      'Mobile has no horizontal overflow',
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    );
    await page.click('#reality-close-evidence');
    await action('go', { target: 'volcano' });
    await capture('11-mobile-approach');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    const trace = await action('trace');
    check(
      'Trace traverses actual visible relationship records',
      trace.ok &&
        trace.result.relationships.some(
          (edge) => edge.id === 'damage-connection',
        ),
    );
    await settle();
    check(
      'World connector is an interrogable association',
      await page.$eval(
        '[data-relationship="damage-connection"]',
        (node) =>
          node.tagName === 'BUTTON' &&
          node.getAttribute('aria-label').includes('ASSOCIATED_WITH'),
      ),
    );
    await capture('12-trace');
    check(
      'Relationship without declared geography cannot be pinned',
      await page.$eval('#reality-pin-evidence', (node) => node.disabled),
    );
    await action('lens', { lens: 'OBSERVED' });
    check(
      'Trace respects evidence filtering',
      !(await action('trace', { id: 'traffic-collapse' })).ok,
    );
    await action('lens', { lens: 'ALL' });
    check('Before/after comparison succeeds', (await action('compare')).ok);
    check(
      'Comparison ends at observed outage time',
      (await state()).time === '2022-01-15T05:30:00Z',
    );
    await page.evaluate(() =>
      window.__realityDebugger.inspect('traffic-collapse'),
    );
    await page.click('#reality-pin-evidence');
    await page.waitForSelector('[data-remove-annotation="traffic-collapse"]');
    await settle();
    check(
      'Source action stages an annotation in the world',
      await page.$eval(
        '.reality-world-evidence',
        (node) =>
          !node.hidden &&
          node.textContent.includes('Pinned') &&
          node.textContent.includes('Cloudflare'),
      ),
    );
    check(
      'Pin closes temporary source popup',
      await page.$eval('#reality-evidence', (node) => node.hidden),
    );
    await capture('13-annotation');
    await page.click('[data-remove-annotation="traffic-collapse"]');
    check(
      'User can remove world annotation',
      !(await page.$('[data-remove-annotation]')),
    );
    check(
      'Explicit annotation succeeds',
      (await action('annotate', { id: 'traffic-collapse' })).ok,
    );
    await action('reset');
    check(
      'Reset removes staged annotation',
      !(await page.$('[data-remove-annotation]')),
    );
    check(
      'Annotation cannot invent an unsupported anchor',
      !(await action('annotate', { id: 'international-cable' })).ok,
    );
    await page.evaluate(() => {
      window.__qaMediaChanged = new Promise((resolve) => {
        matchMedia('(prefers-reduced-motion: reduce)').addEventListener(
          'change',
          () => requestAnimationFrame(resolve),
          { once: true },
        );
      });
    });
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);
    await page.evaluate(() => window.__qaMediaChanged);
    if (process.env.QA_REALTIME === '1') {
      const began = Date.now();
      const replay = await action('replay');
      const seconds = (Date.now() - began) / 1000;
      check(
        'Normal-motion walkthrough completes in 60–120 seconds',
        replay.ok && seconds >= 60 && seconds <= 120,
        { seconds, replay },
      );
    }
    await page.evaluate(() => {
      window.__qaPendingMotion = window.__realityDebugger.actions.run('follow');
    });
    await page.mouse.move(100, 300);
    await page.mouse.down();
    await page.mouse.up();
    const cancelled = await page.evaluate(() => window.__qaPendingMotion);
    check(
      'Pointer cancels motion honestly',
      cancelled.cancelled === true && cancelled.ok === false,
      cancelled,
    );
    await page.evaluate(() => {
      window.__qaPendingMotion = window.__realityDebugger.actions.run('follow');
      window.__godsEyeView.styleManager._runExplicitNavigation(
        'QA camera handoff',
        () => true,
      );
    });
    const handoff = await page.evaluate(() => window.__qaPendingMotion);
    check(
      'Native camera handoff cancels mission motion',
      handoff.cancelled === true && handoff.ok === false,
      handoff,
    );
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ]);
    check(
      'Action after interruption succeeds',
      (await action('go', { target: 'tonga' })).ok,
    );
    await page.click('#reality-exit');
    check(
      'Exit cleans geometry and preserves viewer',
      await page.evaluate(
        () =>
          !window.__realityDebugger &&
          !document.querySelector('#reality-mode') &&
          !document.body.classList.contains('reality-active') &&
          window.__godsEyeView.viewer === window.__qaOriginalViewer &&
          window.__godsEyeView.viewer.dataSources.getByName(
            'Reality Debugger · Tonga',
          ).length === 0 &&
          window.__godsEyeView.viewer.dataSources.getByName(
            'Reality Debugger · geographic reference',
          ).length === 0,
      ),
    );
    check(
      'No unhandled application exceptions',
      report.pageErrors.length === 0,
      report.pageErrors,
    );
  }
} catch (error) {
  check('Browser pass completed', false, error.stack);
  await page
    .screenshot({ path: path.join(output, 'failure.png') })
    .catch(() => {});
} finally {
  report.visualAcceptance =
    'PENDING: open and inspect all nine required screenshots';
  await writeFile(
    path.join(
      output,
      process.env.QA_OUTAGE_ONLY === '1'
        ? 'report-outage.json'
        : process.env.QA_TARGETED === '1'
          ? 'report-targeted.json'
          : 'report.json',
    ),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
if (report.checks.some((result) => !result.passed)) process.exitCode = 1;
