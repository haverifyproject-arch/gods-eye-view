import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const output = path.resolve(
  process.env.QA_OUTPUT_DIR || 'artifacts/reality-story',
);
const baseURL = process.env.QA_BASE_URL || 'http://127.0.0.1:4173';
await mkdir(output, { recursive: true });
const report = {
  provenance: {
    startedAt: new Date().toISOString(),
    baseURL,
    serverMode: process.env.QA_SERVER_MODE || 'unspecified',
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
  visualAcceptance:
    'PENDING: inspect images and assess comprehension in STORY-ACCEPTANCE.md',
};
const check = (name, passed, detail) => {
  report.checks.push({ name, passed: !!passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
};
const browser = await puppeteer.launch({
  headless: true,
  args: [
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
let recording;
const state = () =>
  page.evaluate(() => {
    const app = window.__realityDebugger;
    const viewer = window.__godsEyeView.viewer;
    const camera = viewer.camera.positionCartographic;
    const text = (id) => document.querySelector(id)?.textContent?.trim() || '';
    return {
      ...app.story.getState(),
      title: text('#story-title'),
      body: text('#story-body'),
      takeaway: text('#story-takeaway'),
      question: text('#story-question'),
      time: app.runtime.getContext().time,
      lens: app.runtime.getContext().lens,
      records: app.runtime.getContext().records.map((item) => item.id),
      camera: [camera.longitude, camera.latitude, camera.height],
      sources: Array.from({ length: viewer.dataSources.length }, (_, i) => {
        const source = viewer.dataSources.get(i);
        return {
          name: source.name,
          entities: source.entities.values
            .filter((item) => item.show)
            .map((item) => item.id),
        };
      }),
    };
  });
const settle = async () => {
  await page.waitForFunction(
    () => {
      const viewer = window.__godsEyeView?.viewer;
      viewer?.scene.requestRender();
      return viewer?.dataSourceDisplay.ready;
    },
    { timeout: 20000, polling: 'raf' },
  );
  await page.evaluate(
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
};
const capture = async (name) => {
  await settle();
  const snapshot = await state();
  const layout = await page.evaluate(() => {
    const diagram = document
      .querySelector('.reality-story-stage')
      ?.getBoundingClientRect();
    const caption = document
      .querySelector('.story-caption')
      ?.getBoundingClientRect();
    if (!diagram || !caption) return null;
    return {
      diagram: {
        x: diagram.x,
        y: diagram.y,
        width: diagram.width,
        height: diagram.height,
      },
      caption: {
        x: caption.x,
        y: caption.y,
        width: caption.width,
        height: caption.height,
      },
      overlap:
        diagram.left < caption.right &&
        diagram.right > caption.left &&
        diagram.top < caption.bottom &&
        diagram.bottom > caption.top,
      captionInViewport:
        caption.top >= 0 &&
        caption.bottom <= innerHeight &&
        caption.right <= innerWidth,
    };
  });
  await page.screenshot({ path: path.join(output, `${name}.png`) });
  report.captures.push({ name, ...snapshot, layout });
  if (!name.includes('evidence')) {
    check(
      `${name}: diagram and explanation do not overlap`,
      !!layout && !layout.overlap,
      layout,
    );
    check(`${name}: explanation fits viewport`, !!layout?.captionInViewport);
  }
  return snapshot;
};
const visible = (selector) =>
  page
    .$eval(selector, (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return (
        !node.hidden &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.bottom <= innerHeight
      );
    })
    .catch(() => false);
const waitChapter = (index) =>
  page.waitForFunction(
    (index) => {
      const story = window.__realityDebugger.story.getState();
      return story.phase === 'chapter' && story.index === index;
    },
    { timeout: 20000 },
    index,
  );
const changedWorld = (a, b) =>
  a.time !== b.time ||
  a.lens !== b.lens ||
  JSON.stringify(a.sources) !== JSON.stringify(b.sources) ||
  a.camera.some(
    (value, i) => Math.abs(value - b.camera[i]) > (i === 2 ? 1000 : 0.001),
  );

try {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ]);
  await page.goto(`${baseURL}/?situation=tonga`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  });
  await page.waitForFunction(() => window.__realityDebugger?.story, {
    timeout: 90000,
  });
  if (process.env.QA_STORY_TARGETED === '1') {
    for (const [label, width, height] of [
      ['desktop', 1440, 900],
      ['mobile', 390, 844],
      ['laptop', 1366, 768],
    ]) {
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__realityDebugger?.story, {
        timeout: 90000,
      });
      await page.click('#story-start');
      await waitChapter(0);
      if ((await state()).playing) await page.click('#story-play');
      if (label === 'laptop') await capture('targeted-laptop-chapter');
      await page.click('#story-next');
      await waitChapter(1);
      await page.click('#story-next');
      await waitChapter(2);
      await page.click('#story-question');
      await page.waitForSelector('#story-answer', { visible: true });
      await capture(`targeted-${label}-answer`);
      check(
        `${label}: answer replaces chapter body`,
        await page.$eval('#story-body', (node) => node.hidden),
      );
      await page.click('#story-question');
      check(
        `${label}: return restores chapter explanation`,
        await page.$eval('#story-body', (node) => !node.hidden),
      );
    }
  } else if (process.env.QA_STORY_AUTOPLAY_ONLY !== '1') {
    const opening = await capture('00-opening');
    check(
      'Opening presents an Explain action',
      opening.phase === 'intro' && (await visible('#story-start')),
      opening,
    );
    await page.click('#story-start');
    await waitChapter(0);
    // Keep screenshot review deterministic; playback itself is checked through visible controls below.
    if ((await state()).playing) await page.click('#story-play');
    let previous = opening;
    const chapters = [];
    for (let index = 0; index < 5; index++) {
      if (index) {
        await page.click('#story-next');
        await waitChapter(index);
      }
      const chapter = await capture(`0${index + 1}-chapter`);
      chapters.push(chapter);
      check(
        `Chapter ${index + 1} exposes explanation, takeaway and question`,
        !!chapter.title &&
          !!chapter.body &&
          !!chapter.takeaway &&
          !!chapter.question,
        chapter,
      );
      if (index > 0)
        check(
          `Chapter ${index + 1} materially changes the world`,
          changedWorld(previous, chapter),
        );
      previous = chapter;
      if (index === 2) {
        await page.click('#story-question');
        await page.waitForSelector('#story-answer', { visible: true });
        const answer = await capture('06-question-answer');
        check(
          'Chapter question answers in place and pauses the explanation',
          answer.index === 2 &&
            !answer.playing &&
            (await page.$eval(
              '#story-answer',
              (node) => !!node.textContent.trim(),
            )),
        );
        check(
          'Question operates the evidence world',
          changedWorld(chapter, answer),
        );
      }
      if (index === 1) {
        await page.click('#story-back');
        await waitChapter(0);
        check(
          'Back returns to the preceding chapter',
          (await state()).index === 0,
        );
        await page.click('#story-next');
        await waitChapter(1);
        await page.click('#story-play');
        await page.waitForFunction(
          () => window.__realityDebugger.story.getState().playing,
        );
        await page.click('#story-source');
        await page.waitForFunction(
          () => !window.__realityDebugger.story.getState().playing,
        );
        await page.waitForSelector('#reality-close-evidence', {
          visible: true,
        });
        const evidence = await capture('06-evidence-paused');
        check(
          'Evidence pauses progression without losing chapter',
          evidence.index === 1 && !evidence.playing,
        );
        await page.click('#reality-close-evidence');
        await page.click('#story-play');
        await page.waitForFunction(
          () => window.__realityDebugger.story.getState().playing,
        );
        check(
          'Playback resumes from inspected chapter',
          (await state()).index === 1,
        );
        await page.click('#story-play');
      }
    }
    check(
      'Chapters tell distinct steps',
      new Set(chapters.map((chapter) => chapter.title)).size === 5,
    );
    await page.click('#story-next');
    await page.waitForFunction(
      () => window.__realityDebugger.story.getState().phase === 'conclusion',
    );
    const conclusion = await capture('07-conclusion');
    check(
      'End supplies a conclusion',
      conclusion.phase === 'conclusion' &&
        !!conclusion.body &&
        !!conclusion.takeaway,
      conclusion,
    );
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__realityDebugger?.story, {
      timeout: 90000,
    });
    await capture('08-mobile-opening');
    check('Mobile Explain is reachable', await visible('#story-start'));
    await page.click('#story-start');
    await waitChapter(0);
    if ((await state()).playing) await page.click('#story-play');
    await capture('09-mobile-chapter');
    check(
      'Mobile chapter navigation is reachable',
      (await visible('#story-next')) && (await visible('#story-play')),
    );
    await page.click('#story-source');
    await page.waitForSelector('#reality-close-evidence', { visible: true });
    await capture('10-mobile-evidence');
    check(
      'Mobile evidence can be dismissed',
      await visible('#reality-close-evidence'),
    );
    check(
      'Mobile has no horizontal page overflow',
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  if (process.env.QA_RECORD === '1') {
    await page.setViewport({
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
    });
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__realityDebugger?.story, {
      timeout: 90000,
    });
    try {
      recording = await page.screencast({
        path: path.join(output, 'story-demo.webm'),
        fps: 5,
        scale: 0.75,
        quality: 35,
        ...(process.env.QA_FFMPEG_PATH
          ? { ffmpegPath: process.env.QA_FFMPEG_PATH }
          : {}),
      });
      report.recording = 'story-demo.webm';
    } catch (error) {
      report.recordingUnavailable = error.message;
    }
    const started = Date.now();
    await page.click('#story-start');
    if (!(await state()).playing) await page.click('#story-play');
    await page.waitForFunction(
      () => window.__realityDebugger.story.getState().phase === 'conclusion',
      { timeout: 150000 },
    );
    const durationSeconds = (Date.now() - started) / 1000;
    check(
      'Uninterrupted explanation finishes in 60–120 seconds',
      durationSeconds >= 60 && durationSeconds <= 120,
      durationSeconds,
    );
    await writeFile(
      path.join(output, 'report.json'),
      JSON.stringify(report, null, 2),
    );
    await recording?.stop();
    recording = null;
  }
  check(
    'No unhandled application exception',
    report.pageErrors.length === 0,
    report.pageErrors,
  );
} catch (error) {
  check('Story harness completes', false, error.stack || error.message);
} finally {
  await recording?.stop().catch(() => {});
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
if (report.checks.some((item) => !item.passed)) process.exitCode = 1;
