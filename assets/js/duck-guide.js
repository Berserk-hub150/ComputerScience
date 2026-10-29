(function () {
  'use strict';
  const root = document.getElementById('duck-guide');
  if (!root || !window.RetroGuide) return;
  let courses;
  try { courses = JSON.parse(document.getElementById('duck-course-data').textContent); } catch (_) { return; }
  courses = courses.filter(c => c.id && c.title && typeof c.url === 'string' && c.url.startsWith('/') && !c.url.startsWith('//'));
  if (!courses.length) return;
  const byId = id => courses.find(c => c.id === id);
  const launcher = document.getElementById('duck-launcher');
  const walker = document.getElementById('duck-walker');
  const panel = document.getElementById('duck-panel');
  const log = document.getElementById('duck-messages');
  const input = document.getElementById('duck-input');
  const suggestions = document.getElementById('duck-suggestions');
  const contextLabel = document.getElementById('duck-context');
  const pageCourse = root.dataset.currentCourse;
  const spotlight = document.getElementById('duck-spotlight');
  let context = byId(pageCourse) ? pageCourse : '';
  let markedTarget = null;
  let priorFocus = null;
  try { if (!context) context = byId(sessionStorage.getItem('retro-guide-course'))?.id || ''; } catch (_) {}
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function updateContext() {
    const course = byId(context);
    contextLabel.textContent = course ? course.title : 'Scegli una materia o scrivi una domanda';
    try {
      if (course) sessionStorage.setItem('retro-guide-course', context);
      else sessionStorage.removeItem('retro-guide-course');
    } catch (_) {}
  }
  function setOpen(open) {
    if (open) priorFocus = document.activeElement;
    panel.hidden = !open;
    walker.hidden = open;
    launcher.setAttribute('aria-expanded', String(open));
    root.dispatchEvent(new CustomEvent('duck-panel-toggle', { detail: { open } }));
    if (open) input.focus({ preventScroll: true });
    else if (priorFocus && priorFocus.isConnected && !panel.contains(priorFocus)) priorFocus.focus({ preventScroll: true });
    else launcher.focus({ preventScroll: true });
  }
  function message(text, user) {
    const node = el('div', 'duck-message' + (user ? ' duck-message-user' : ''));
    if (!user) node.append(el('span', 'duck-message-name', 'PAPER DETECTIVE //'));
    node.append(el('p', '', text));
    log.append(node);
    // Bound the DOM during a long session; no conversation is stored or sent elsewhere.
    while (log.children.length > 32) log.firstElementChild.remove();
    return node;
  }
  function scrollLog() { log.scrollTop = log.scrollHeight; }
  function quickActions() {
    if (suggestions.dataset.context === context) return;
    suggestions.dataset.context = context;
    suggestions.replaceChildren();
    const labels = context ? ['Appunti', 'Webex', 'Moodle / Classroom', 'Registrazioni', 'Cambia materia'] : ['Machine Learning', 'Complex System Design', 'AAM', 'MASL'];
    labels.forEach(label => {
      const button = el('button', '', label);
      button.type = 'button';
      button.addEventListener('click', () => ask(label === 'Cambia materia' ? 'Tutte le materie' : label));
      suggestions.append(button);
    });
  }
  function pointUrl(course, resource) {
    const url = new URL(course.url, location.origin);
    url.searchParams.set('guide', resource.kind);
    url.hash = 'resource-' + resource.kind;
    return url.pathname + url.search + url.hash;
  }
  function linkRow(course, resource) {
    const row = el('div', 'duck-result-row');
    const link = el('a', '', resource.label + ' ↗');
    link.href = resource.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const point = el('a', 'duck-point', 'Mostramelo ◎');
    point.href = pointUrl(course, resource);
    point.setAttribute('aria-label', 'Cerchia ' + resource.label + ' nella pagina ' + course.title);
    point.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.querySelector('[data-resource="' + resource.kind + '"]');
      if (pageCourse !== course.id || !target) return;
      event.preventDefault();
      setOpen(false);
      history.replaceState(null, '', point.href);
      mark(target, resource.label);
    });
    row.append(link, point);
    return row;
  }
  function showAnswer(result) {
    const node = message(result.text);
    if (result.context) context = result.context;
    if (result.type === 'choose') {
      result.choices.forEach(course => {
        const button = el('button', 'duck-choice', course.title + ' →');
        button.type = 'button';
        button.addEventListener('click', () => {
          context = course.id;
          ask((result.kinds || []).join(' ') + ' ' + course.title, course.title);
        });
        node.append(button);
      });
    }
    if (result.type === 'results') result.results.forEach(item => {
      const section = el('div', 'duck-result');
      section.append(el('h3', '', item.course.title));
      const missingLabels = { moodle: 'Moodle', classroom: 'Classroom', webex: 'Webex', recordings: 'Registrazioni', notion: 'Appunti Notion', palozz: 'Scheda Palozz' };
      // Moodle / Classroom means either teaching platform; do not report the other as absent.
      const missing = item.missing.filter(k => !(['moodle', 'classroom'].includes(k) && item.resources.some(r => r.kind === 'learning')));
      if (missing.length) section.append(el('p', 'duck-missing', missing.map(k => missingLabels[k]).join(', ') + ': nessun link indicato per questo corso.'));
      item.resources.forEach(resource => section.append(linkRow(item.course, resource)));
      if (!item.resources.length) {
        const link = el('a', 'duck-choice', 'Vedi la pagina della materia →');
        link.href = item.course.url;
        section.append(link);
      }
      if (item.resources.some(r => r.kind === 'recordings' && r.url === item.course.learning)) section.append(el('p', 'duck-missing', 'Le registrazioni rimandano al Moodle del corso; può essere richiesto l’accesso UNICAM.'));
      node.append(section);
    });
    if (result.type === 'unknown' && result.courses) result.courses.forEach(course => {
      const link = el('a', 'duck-choice', 'Apri ' + course.title + ' →');
      link.href = course.url;
      node.append(link);
    });
    updateContext();
    quickActions();
    scrollLog();
  }
  function ask(question, displayText) {
    if (!question.trim()) return;
    message(displayText || question, true);
    showAnswer(window.RetroGuide.answer(question, courses, context));
  }
  function welcome() {
    log.replaceChildren();
    message('Psst… un link scomparso? Ci penso io. Scrivi “Webex di ML”, “appunti CSD” oppure scegli una materia. Con “Mostramelo” ti cerchio il collegamento sulla pagina.');
    updateContext();
    quickActions();
  }
  launcher.addEventListener('click', () => { clearMark(); setOpen(true); });
  root.addEventListener('duck-position-change', () => { if (!panel.hidden) setOpen(false); });
  document.getElementById('duck-close').addEventListener('click', () => setOpen(false));
  document.getElementById('duck-reset').addEventListener('click', () => { context = byId(pageCourse) ? pageCourse : ''; welcome(); input.focus(); });
  document.getElementById('duck-form').addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    ask(question);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!panel.hidden) setOpen(false);
      clearMark();
    }
  });
  function clearMark() {
    spotlight.hidden = true;
    markedTarget = null;
    const url = new URL(location.href);
    if (['notion', 'webex', 'learning', 'recordings', 'palozz'].includes(url.searchParams.get('guide'))) {
      url.searchParams.delete('guide');
      if (url.hash.startsWith('#resource-')) url.hash = '';
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }
  function positionMark() {
    if (!markedTarget) return;
    const box = markedTarget.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight) { spotlight.hidden = true; return; }
    spotlight.hidden = false;
    const ellipse = spotlight.querySelector('ellipse');
    ellipse.setAttribute('cx', box.left + box.width / 2);
    ellipse.setAttribute('cy', box.top + box.height / 2);
    ellipse.setAttribute('rx', box.width / 2 + 12);
    ellipse.setAttribute('ry', box.height / 2 + 12);
    const label = spotlight.querySelector('.duck-spotlight-label');
    label.style.left = Math.max(10, Math.min(box.left, innerWidth - label.offsetWidth - 12)) + 'px';
    label.style.top = (box.bottom + 26 + label.offsetHeight < innerHeight ? box.bottom + 26 : Math.max(8, box.top - label.offsetHeight - 24)) + 'px';
  }
  function mark(target, name) {
    markedTarget = target;
    document.getElementById('duck-spotlight-text').textContent = 'Trovato: ' + name + ' ↗';
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
    target.focus({ preventScroll: true });
    positionMark();
    // Track the smooth scroll and subsequent layout shifts without polling.
    requestAnimationFrame(positionMark);
  }
  document.getElementById('duck-spotlight-close').addEventListener('click', () => { clearMark(); launcher.focus({ preventScroll: true }); });
  let frame = 0;
  function queuePosition() {
    if (!markedTarget || frame) return;
    frame = requestAnimationFrame(() => { frame = 0; positionMark(); });
  }
  window.addEventListener('scroll', queuePosition, { passive: true });
  window.addEventListener('resize', queuePosition);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(queuePosition).observe(document.body);
  welcome();
  const requested = new URLSearchParams(location.search).get('guide');
  if (['notion', 'webex', 'learning', 'recordings', 'palozz'].includes(requested)) {
    const target = document.querySelector('[data-resource="' + requested + '"]');
    if (target) requestAnimationFrame(() => mark(target, target.textContent.replace('↗', '').trim()));
  }
}());
