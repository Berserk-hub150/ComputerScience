const { test } = require('node:test');
const assert = require('node:assert/strict');
const { phrases, shuffledLines, bubblePosition } = require('../assets/js/buddy-banter.js');
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
