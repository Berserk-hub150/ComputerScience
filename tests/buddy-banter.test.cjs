const { test } = require('node:test');
const assert = require('node:assert/strict');
const { phrases, shuffledLines, bubblePosition } = require('../assets/js/buddy-banter.js');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
function hoverHarness() {
  let now = 0, sequence = 0;
  const timers = new Map(), frames = new Map();
  const elements = new Map();
  for (const id of ['duck-guide', 'duck-walker', 'duck-launcher', 'duck-panel', 'duck-position-menu', 'buddy-speech', 'buddy-speech-text', 'buddy-banter-toggle']) {
    const el = new EventTarget();
    Object.assign(el, { hidden: ['duck-panel', 'duck-position-menu', 'buddy-speech'].includes(id), dataset: {}, textContent: '', style: { setProperty() {} }, setAttribute() {}, getBoundingClientRect: () => ({ x: 100, y: 300, width: 90, height: 57 }) });
    elements.set(id, el);
  }
  const doc = new EventTarget();doc.hidden = false;doc.getElementById = id => elements.get(id);
  const storage = new Map();
  const sandbox = { module: { exports: {} }, Math, innerWidth: 1363, innerHeight: 937,
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    setTimeout: (callback, delay) => { const id = ++sequence;timers.set(id, { at: now + delay, callback });return id; },
    clearTimeout: id => timers.delete(id), requestAnimationFrame: callback => { const id = ++sequence;frames.set(id, callback);return id; }, cancelAnimationFrame: id => frames.delete(id)
  };
  runInNewContext(readFileSync(require.resolve('../assets/js/buddy-banter.js'), 'utf8'), sandbox);
  sandbox.module.exports.init(doc);
  return {
    el: id => elements.get(id),
    event: (id, name) => elements.get(id).dispatchEvent(new Event(name)),
    advance: delta => { const end = now + delta;for (;;) { const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];if (!next) break;now = next[1].at;timers.delete(next[0]);next[1].callback(); }now = end; },
    pending: () => timers.size
  };
}
test('there are no automatic messages, and only hovering the dog starts speech', () => {
  const h = hoverHarness();
  assert.equal(h.pending(), 0);
  h.advance(120000);assert.ok(h.el('buddy-speech').hidden);
  h.event('duck-walker', 'pointerenter');assert.ok(h.el('buddy-speech').hidden);
  h.event('duck-launcher', 'pointerenter');assert.equal(h.el('buddy-speech').hidden, false);
  const first = h.el('buddy-speech-text').textContent;
  h.event('duck-launcher', 'pointerleave');assert.ok(h.el('buddy-speech').hidden);assert.equal(h.pending(), 0);
  h.advance(120000);assert.ok(h.el('buddy-speech').hidden);
  h.event('duck-launcher', 'pointerenter');assert.notEqual(h.el('buddy-speech-text').textContent, first);
});
test('staying over the dog cycles different messages with a pause, and leaving cancels the pause', () => {
  const h = hoverHarness();h.event('duck-launcher', 'pointerenter');
  const first = h.el('buddy-speech-text').textContent;
  h.advance(5200);assert.ok(h.el('buddy-speech').hidden);
  h.advance(700);assert.equal(h.el('buddy-speech').hidden, false);assert.notEqual(h.el('buddy-speech-text').textContent, first);
  h.advance(5200);h.event('duck-launcher', 'pointerleave');h.advance(700);assert.ok(h.el('buddy-speech').hidden);assert.equal(h.pending(), 0);
});
test('opening a menu or muting cancels speech without scheduling messages for later', () => {
  for (const [id, event] of [['duck-guide', 'buddy-menu-open'], ['duck-guide', 'duck-panel-toggle'], ['buddy-banter-toggle', 'click']]) {
    const h = hoverHarness();h.event('duck-launcher', 'pointerenter');h.event(id, event);
    assert.ok(h.el('buddy-speech').hidden);assert.equal(h.pending(), 0);
    h.advance(120000);assert.ok(h.el('buddy-speech').hidden);
  }
});
test('the joke collection contains the requested examples and at least fifty unique lines', () => {
  assert.ok(phrases.length >= 50);
  assert.equal(new Set(phrases).size, phrases.length);
  assert.ok(phrases.some(p => p.includes('Enrico Papi')));
  assert.ok(phrases.includes('Già qui a studiare?'));
  assert.ok(phrases.includes('Non studiare, vai al Dada!'));
});
test('each joke appears once in a shuffled cycle, without repeating the previous ending', () => {
  const previous = phrases[1];
  const cycle = shuffledLines(() => 0, previous);
  assert.equal(cycle.length, phrases.length);
  assert.equal(new Set(cycle).size, phrases.length);
  assert.notEqual(cycle[0], previous);
  assert.deepEqual(cycle.slice().sort(), phrases.slice().sort());
});
test('speech remains on screen near either corner and can move below the dog', () => {
  for (const anchor of [{ x: 0, y: 500, width: 90, height: 57 }, { x: 270, y: 8, width: 90, height: 57 }]) {
    const p = bubblePosition(anchor, { width: 216, height: 60 }, { width: 320, height: 568 });
    assert.ok(p.x >= 10 && p.x + 216 <= 310);
    assert.ok(p.y >= 8 && p.y + 60 <= 558);
  }
  assert.equal(bubblePosition({ x: 150, y: 8, width: 90, height: 57 }, { width: 216, height: 60 }, { width: 320, height: 568 }).below, true);
});
