import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'artifacts/native-source-final';
await mkdir(out, { recursive: true });
const report = { checks: [], errors: [] };
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
page.on('pageerror', (error) => report.errors.push(error.message));
try {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4180/?welcome=0', {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForFunction(() => window.__godsEyeView?.worldDebug, {
    timeout: 90000,
  });
  await page.waitForFunction(
    () =>
      document.querySelector('#loading-screen').style.display === 'none' ||
      getComputedStyle(document.querySelector('#loading-screen')).opacity ===
        '0',
    { timeout: 60000 },
  );
  await page.click('[data-debug-action="another"]');
  await page.waitForFunction(
    () => !!window.__godsEyeView.viewer.selectedEntity,
    { timeout: 90000 },
  );
  await new Promise((r) => setTimeout(r, 2200));
  await page.click('#world-debug-details');
  await page.click('[data-debug-action="sources"]');
  for (const [name, width, height] of [
    ['desktop', 1440, 900],
    ['mobile', 390, 844],
  ]) {
    await page.setViewport({ width, height });
    const presentation = await page.evaluate(() => {
      const panel = document
        .querySelector('#world-debug-popover')
        .getBoundingClientRect();
      const source = document.querySelector('#world-debug-evidence');
      const link = source.querySelector('a').getBoundingClientRect();
      const explanation = source.querySelector(':scope > p');
      const e = explanation.getBoundingClientRect();
      const details = source.querySelector('details');
      return {
        publisherVisible: link.top >= panel.top && link.bottom <= panel.bottom,
        explanationVisible: e.top >= panel.top && e.bottom <= panel.bottom,
        explanation: explanation.textContent,
        collapsed: !details.open,
        metadata: details.textContent,
        provenance:
          window.__godsEyeView.worldDebug.getState().inspected.provenance,
      };
    });
    check(
      name + ' publisher and explanation visible without scrolling',
      presentation.publisherVisible && presentation.explanationVisible,
      presentation,
    );
    check(name + ' details collapsed by default', presentation.collapsed);
    await page.screenshot({ path: out + '/' + name + '-source.png' });
    await page.click('#world-debug-evidence summary');
    check(
      name + ' full provenance preserved in expandable details',
      await page.evaluate(() => {
        const details = document.querySelector('#world-debug-evidence details');
        const p =
          window.__godsEyeView.worldDebug.getState().inspected.provenance;
        return (
          details.open &&
          p.every(
            (s) =>
              (!s.time || details.textContent.includes(s.time)) &&
              (!s.retrievedAt || details.textContent.includes(s.retrievedAt)) &&
              (!s.detail || details.textContent.includes(s.detail)),
          )
        );
      }),
    );
    await page.click('#world-debug-evidence summary');
  }
  const originalSelection = await page.evaluate(
    () => window.__godsEyeView.worldDebug.getState().selected.id,
  );
  const nextSelection = await page.evaluate(() => {
    const app = window.__godsEyeView;
    const layer = app.dataManager.layers.get('internet-health').module;
    const next = layer
      .getDebugRecords()
      .find((r) => r.id !== app.worldDebug.getState().selected.id);
    if (!next)
      throw Error(
        'Need two real current countries for source invalidation check',
      );
    layer.selectById(next.id);
    return next.id;
  });
  check(
    'Native selection change clears previously inspected source',
    await page.evaluate((id) => {
      const state = window.__godsEyeView.worldDebug.getState();
      return state.selected.id === id && !state.inspected;
    }, nextSelection),
  );
  await page.evaluate(
    (id) =>
      window.__godsEyeView.dataManager.layers
        .get('internet-health')
        .module.selectById(id),
    originalSelection,
  );
  await page.setViewport({ width: 1440, height: 900 });
  await page.click('[data-debug-action="debug"]');
  await page.waitForFunction(
    () => window.__godsEyeView.worldDebug.getState().status === 'ready',
    { timeout: 90000 },
  );
  await page.click('#world-debug-close');
  const mark = await page.$('.gev-anno[role="button"]');
  if (!mark) throw Error('No native reference annotation available');
  await mark.click();
  const relationId = await page.evaluate(
    () => window.__godsEyeView.worldDebug.getState().inspected.id,
  );
  await page.click('[data-debug-action="sources"]');
  check(
    'Sources follow-up preserves the inspected world relationship',
    await page.evaluate((id) => {
      const state = window.__godsEyeView.worldDebug.getState();
      return (
        state.inspected.id === id &&
        state.relationships.some((r) => r.id === id) &&
        state.inspected.provenance.length > 0
      );
    }, relationId),
    relationId,
  );
  check('No unhandled exceptions', report.errors.length === 0, report.errors);
} catch (error) {
  report.failure = error.stack;
  console.log(error.stack);
  await page.screenshot({ path: out + '/failure.png' }).catch(() => {});
} finally {
  await writeFile(out + '/report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.failure || report.checks.some((c) => !c.passed))
  process.exitCode = 1;
