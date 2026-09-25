import { TONGA_STORY } from './story.js';
import { createStoryWorld } from './storyWorld.js';
import './storyPlayer.css';

/** A directed explanation on the native world. Every interruption leaves a resumable chapter. */
export function createStoryPlayer({
  root,
  viewer,
  runtime,
  actions,
  inspect,
  presentationChanged,
}) {
  const panel = document.createElement('section');
  panel.id = 'reality-story';
  panel.setAttribute('aria-label', 'The Tonga story');
  panel.innerHTML = `<div class="story-heading"><span>REALITY DEBUGGER / TONGA, 2022</span><button id="story-explore">Explore evidence</button></div>
    <div class="story-caption"><div id="story-progress"></div><h1 id="story-title"></h1><p id="story-body"></p><p id="story-takeaway"></p><p id="story-answer" hidden></p>
    <div class="story-questions"><button id="story-question"></button><button id="story-source">How do we know? ↗</button></div>
    <div class="story-navigation"><button id="story-start">Explain what happened →</button><button id="story-back">← Back</button><button id="story-play">Pause</button><button id="story-next">Next →</button><span id="story-position"></span></div>
    <small class="story-credit">Built on <a href="https://github.com/bilawalsidhu/gods-eye-view" target="_blank" rel="noopener noreferrer">Bilawal Sidhu’s God's Eye View</a> · Sources: Cloudflare, NASA JPL, ITU · Cable reference © TeleGeography CC BY-NC-SA</small></div>`;
  root.append(panel);
  const $ = (selector) => panel.querySelector(selector);
  const world = createStoryWorld({
    viewer,
    root,
    inspect: (id) => {
      pause();
      inspect(id);
    },
  });
  let index = -1;
  let playing = false;
  let exploring = false;
  let timer;
  let generation = 0;
  let disposed = false;
  const state = () => ({
    index,
    playing,
    exploring,
    phase:
      index < 0
        ? 'intro'
        : index >= TONGA_STORY.chapters.length
          ? 'conclusion'
          : 'chapter',
  });
  const clear = () => {
    clearTimeout(timer);
    generation++;
  };
  function pause(cancelAction = true) {
    clear();
    if (cancelAction) actions.cancel();
    playing = false;
    $('#story-play').textContent = 'Resume explanation';
  }
  const render = () => {
    const chapter = TONGA_STORY.chapters[index];
    const intro = index < 0;
    const ending = !intro && !chapter;
    root.classList.toggle('story-mode', !exploring);
    presentationChanged?.();
    panel.classList.toggle('story-exploring', exploring);
    panel.dataset.phase = state().phase;
    panel.dataset.chapter = chapter?.id || state().phase;
    $('#story-title').textContent =
      chapter?.title ||
      (intro ? TONGA_STORY.title : 'What this crisis reveals');
    $('#story-body').textContent =
      chapter?.body ||
      (intro ? TONGA_STORY.introduction : TONGA_STORY.conclusion);
    $('#story-takeaway').textContent = chapter
      ? chapter.takeaway
      : intro
        ? 'A guided explanation in about two minutes. Pause and inspect any claim.'
        : 'A repaired international link did not establish recovery for every island.';
    $('#story-progress').textContent = chapter
      ? `${String(index + 1).padStart(2, '0')} / 05 · ${chapter.question}`
      : intro
        ? 'ONE CONNECTION. A NATIONAL COMMUNICATIONS CRISIS.'
        : 'THE TAKEAWAY';
    $('#story-position').textContent = chapter ? `${index + 1} of 5` : '';
    $('#story-start').hidden = !!chapter;
    $('#story-start').textContent = ending
      ? 'Replay the explanation ↺'
      : 'Explain what happened →';
    for (const id of [
      '#story-back',
      '#story-play',
      '#story-next',
      '#story-source',
      '#story-question',
    ])
      $(id).hidden = !chapter;
    $('#story-back').disabled = index === 0;
    $('#story-next').textContent =
      index === 4 ? 'What did we learn? →' : 'Next →';
    $('#story-play').textContent = playing
      ? 'Pause explanation'
      : 'Resume explanation';
    $('#story-question').textContent = chapter?.questionLabel || '';
    $('#story-explore').textContent = exploring
      ? 'Return to explanation'
      : 'Explore evidence';
    $('#story-answer').hidden = true;
    $('#story-body').hidden = false;
    world.show(
      exploring
        ? null
        : chapter ||
            (intro ? TONGA_STORY.chapters[0] : TONGA_STORY.chapters[4]),
    );
  };
  async function go(next, auto = false) {
    clear();
    actions.cancel();
    if (disposed) return;
    index = Math.max(0, Math.min(TONGA_STORY.chapters.length, next));
    playing = auto && index < TONGA_STORY.chapters.length;
    exploring = false;
    root.querySelector('#reality-evidence').hidden = true;
    const chapter = TONGA_STORY.chapters[index];
    runtime.setLens('ALL');
    if (chapter) runtime.setTime(chapter.time);
    render();
    if (!chapter) return;
    const chapterStarted = performance.now();
    const token = generation;
    const target = chapter.cameraTarget || 'tonga';
    const result = await actions.run('go', { target, silent: true });
    if (disposed || token !== generation || !playing) return;
    if (!result.ok) {
      pause();
      return;
    }
    // Captions are already readable during navigation; include that travel in the chapter's duration.
    const remaining = Math.max(
      1000,
      chapter.durationSec * 1000 - (performance.now() - chapterStarted),
    );
    timer = setTimeout(() => go(index + 1, true), remaining);
  }
  function play() {
    return go(index < 0 || index >= 5 ? 0 : index, true);
  }
  async function question() {
    pause();
    const chapter = TONGA_STORY.chapters[index];
    if (!chapter) return;
    if (!$('#story-answer').hidden) return go(index);
    $('#story-answer').textContent = chapter.questionAnswer || chapter.takeaway;
    $('#story-answer').hidden = false;
    $('#story-body').hidden = true;
    $('#story-question').textContent = 'Back to explanation';
    if (index === 0) await actions.run('follow');
    else {
      if (index === 1 || index === 2) runtime.setLens('OBSERVED');
      world.show({
        ...chapter,
        visualType: chapter.visualType,
        answering: true,
      });
      await actions.run('go', { target: 'tonga', silent: true });
    }
  }
  const click = (event) => {
    switch (event.target.closest('button')?.id) {
      case 'story-start':
        play();
        break;
      case 'story-play':
        if (playing) {
          pause();
          actions.cancel();
        } else play();
        break;
      case 'story-next':
        go(index + 1);
        break;
      case 'story-back':
        go(index - 1);
        break;
      case 'story-source':
        pause();
        actions.cancel();
        inspect(TONGA_STORY.chapters[index].sourceRecordId);
        break;
      case 'story-question':
        question();
        break;
      case 'story-explore':
        pause();
        actions.cancel();
        exploring = !exploring;
        if (!exploring && index >= 0 && index < 5) go(index);
        else render();
        break;
    }
  };
  panel.addEventListener('click', click);
  const interrupt = () => pause();
  viewer.canvas.addEventListener('pointerdown', interrupt);
  viewer.canvas.addEventListener('wheel', interrupt, { passive: true });
  const key = (event) => {
    if (event.key === 'Escape') pause();
  };
  document.addEventListener('keydown', key);
  render();
  return {
    getState: state,
    go,
    play,
    pause,
    destroy() {
      disposed = true;
      clear();
      viewer.canvas.removeEventListener('pointerdown', interrupt);
      viewer.canvas.removeEventListener('wheel', interrupt);
      document.removeEventListener('keydown', key);
      world.destroy();
      panel.remove();
      root.classList.remove('story-mode');
    },
  };
}
