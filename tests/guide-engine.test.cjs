const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../assets/js/guide-engine.js');
// Read the same authoritative front matter used by Jekyll, without another URL catalog.
const courses = ['machine-learning', 'complex-system-design', 'agent-based-adaptive-modelling', 'multiagent-system-lab'].map(slug => {
  const text = fs.readFileSync(path.join(__dirname, '..', slug, 'index.md'), 'utf8').split('---')[1];
  const fields = Object.fromEntries(text.trim().split('\n').map(line => {
    const colon = line.indexOf(':');
    return [line.slice(0, colon), line.slice(colon + 1).trim().replace(/^"|"$/g, '')];
  }));
  return { id: fields.code.toLowerCase(), title: fields.title, url: '/ComputerScience/' + slug + '/', notion: fields.original_url, webex: fields.webex_url, learning: fields.learning_url, learningLabel: fields.learning_label || 'Materiale', recordings: fields.recordings_url, palozz: fields.course_materials_url };
});
const answer = (q, context) => engine.answer(q, courses, context);
test('natural Italian question returns the actual ML Webex and only that resource', () => {
  const r = answer('Dove trovo il Webex di ML?');
  assert.equal(r.context, 'ml');
  assert.deepEqual(r.results[0].resources.map(x => x.kind), ['webex']);
  assert.equal(r.results[0].resources[0].url, 'https://unicam.webex.com/meet/michele.loreti');
});
test('AAM resolves to the ABM page; accents and punctuation are normalized', () => {
  const r = answer('Dov’è il CLASSROOM dell’AAM?');
  assert.equal(r.context, 'abm');
  assert.equal(r.results[0].resources[0].url, courses[2].learning);
});
test('course context supports a follow-up resource request', () => {
  assert.equal(answer('appunti', 'masl').results[0].resources[0].url, courses[3].notion);
});
test('a named course overrides remembered context', () => {
  assert.equal(answer('Webex di CSD', 'ml').context, 'csd');
});
test('missing resources remain absent instead of using a different course', () => {
  const r = answer('registrazioni CSD');
  assert.deepEqual(r.results[0].resources, []);
  assert.deepEqual(r.results[0].missing, ['recordings']);
});
test('Classroom never silently maps to Moodle', () => {
  const r = answer('Classroom ML');
  assert.equal(r.results[0].resources.length, 0);
  assert.deepEqual(r.results[0].missing, ['classroom']);
});
test('Moodle / Classroom accepts the available platform', () => {
  assert.equal(answer('Moodle / Classroom', 'abm').results[0].resources[0].url, courses[2].learning);
});
test('an unspecified course asks for disambiguation and keeps the resource intent', () => {
  const r = answer('Webex');
  assert.equal(r.type, 'choose');
  assert.equal(r.choices.length, 4);
  assert.deepEqual(r.kinds, ['webex']);
});
test('a shared teacher does not select a course arbitrarily', () => {
  assert.deepEqual(answer('Webex Merelli').choices.map(c => c.id), ['abm', 'masl']);
});
test('multiple explicit resources are both returned', () => {
  assert.deepEqual(answer('Webex e registrazioni di ML').results[0].resources.map(r => r.kind), ['webex', 'recordings']);
});
test('multiple named courses return separate correct links', () => {
  const r = answer('Webex ML e CSD');
  assert.deepEqual(r.results.map(x => x.course.id), ['ml', 'csd']);
  assert.notEqual(r.results[0].resources[0].url, r.results[1].resources[0].url);
});
test('all-course request overrides context', () => {
  assert.equal(answer('Tutti i Webex', 'ml').results.length, 4);
});
test('unknown content and unavailable schedules are not invented', () => {
  assert.equal(answer('spiegami il teorema di Bayes', 'ml').type, 'unknown');
  assert.equal(answer('quando è l’esame di ML?').type, 'unknown');
});
test('literal input markup cannot become a URL or produce a made-up result', () => {
  assert.equal(answer('<img src=x onerror=alert(1)>').type, 'unknown');
  assert.deepEqual(engine.resources({ notion: 'javascript:alert(1)' }), []);
});
test('aliases, common misspellings and an unknown context are handled', () => {
  assert.equal(answer('webxe machine laerning').context, 'ml');
  assert.equal(answer('appunti di complex systems design').context, 'csd');
  assert.equal(answer('webex', 'not-a-course').type, 'choose');
});
test('a greeting and privacy question explain the bounded guide', () => {
  assert.equal(answer('ciao').type, 'help');
  assert.match(answer('sei una AI?').text, /senza AI/);
});
