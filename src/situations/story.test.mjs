import test from 'node:test';
import assert from 'node:assert/strict';
import { TONGA_STORY } from './story.js';
import { tongaSituation } from './tonga.js';
import { createSituationRuntime } from './runtime.js';

test('dependency chapter shows historical support for the sole cable and Fiji connection', () => {
  const runtime = createSituationRuntime(tongaSituation);
  try {
    const dependency = runtime.inspect(TONGA_STORY.chapters[0].sourceRecordId);
    assert.equal(dependency.record.status, 'REPORTED');
    assert.equal(dependency.record.geometry, undefined);
    assert.deepEqual(dependency.record.evidenceIds, [
      'sole-international-link',
      'fiji-international-link',
    ]);
    assert.ok(
      dependency.evidence.some(
        (item) =>
          item.sourceId === 'itu-response' &&
          item.summary.includes('sole submarine cable'),
      ),
    );
    assert.ok(
      dependency.evidence.some(
        (item) =>
          item.sourceId === 'cloudflare-return' &&
          item.summary.includes('Fiji'),
      ),
    );
    assert.ok(!dependency.evidence.some((item) => item.id === 'cable-map'));
  } finally {
    runtime.destroy();
  }
});

test('every explanatory chapter opens real provenance and a valid mission time', () => {
  const runtime = createSituationRuntime(tongaSituation);
  try {
    for (const chapter of TONGA_STORY.chapters) {
      const inspected = runtime.inspect(chapter.sourceRecordId);
      assert.ok(
        inspected.evidence.length,
        `${chapter.id} needs inspectable evidence`,
      );
      assert.ok(
        inspected.sources.length,
        `${chapter.id} needs inspectable sources`,
      );
      assert.ok(
        inspected.sources.every((source) => source.url.startsWith('https://')),
      );
      runtime.setTime(chapter.time);
      assert.equal(runtime.getContext().time, chapter.time);
    }
  } finally {
    runtime.destroy();
  }
});

test('five concise chapters have playable actions, destinations and a bounded narrated duration', () => {
  const chapters = TONGA_STORY.chapters;
  assert.equal(chapters.length, 5);
  assert.equal(
    new Set(chapters.map((chapter) => chapter.id)).size,
    chapters.length,
  );
  const actionNames = new Set([
    'follow',
    'observed',
    'timing',
    'fallback',
    'recovery',
  ]);
  const destinations = new Set([
    'pacific',
    ...tongaSituation.entities.map((record) => record.id),
  ]);
  for (const chapter of chapters) {
    for (const field of [
      'id',
      'title',
      'question',
      'body',
      'takeaway',
      'questionLabel',
      'questionAnswer',
      'visualType',
    ]) {
      assert.ok(
        typeof chapter[field] === 'string' && chapter[field].trim(),
        `${chapter.id}: ${field}`,
      );
    }
    assert.ok(actionNames.has(chapter.questionAction));
    assert.ok(destinations.has(chapter.cameraTarget));
    assert.ok(Number.isFinite(chapter.durationSec) && chapter.durationSec > 0);
    assert.ok(
      chapter.body.split(/\s+/).length <= 60,
      'Chapter must stay readable during playback',
    );
  }
  const duration = chapters.reduce(
    (sum, chapter) => sum + chapter.durationSec,
    0,
  );
  assert.ok(duration >= 60 && duration <= 120);
  assert.ok(TONGA_STORY.introduction.trim() && TONGA_STORY.conclusion.trim());
});

test('the narrative preserves the chronology gap and does not claim complete island recovery', () => {
  const evidence = TONGA_STORY.chapters.find(
    (chapter) => chapter.id === 'evidence',
  );
  assert.equal(evidence.sourceRecordId, 'chronology-gap');
  assert.match(evidence.body, /03:00.*04:14.*05:30/);
  assert.match(evidence.takeaway, /unresolved/);
  assert.match(
    TONGA_STORY.conclusion,
    /did not establish recovery for every island/,
  );
  assert.match(
    TONGA_STORY.chapters.find((chapter) => chapter.id === 'recovery').body,
    /domestic cable.*still needed work/,
  );
});
