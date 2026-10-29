(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.BuddyBanter = api; api.init(document); }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const phrases = [
    'Ciao, sono Enrico Papi. Bau.',
    'Già qui a studiare?',
    'Non studiare, vai al Dada!',
    'Prima un esercizio, poi il Dada. Trattiamo?',
    'Il Dada chiama. La sessione risponde occupato.',
    'Colle Paradiso: il nome prometteva meno salite.',
    'A Camerino si sale. Pure con l’ansia pre-esame.',
    'Il vero cardio? Tornare su a Colle Paradiso.',
    'A Camerino anche il cane fa dislivello.',
    'Questa salita vale almeno tre CFU.',
    'Daje, una pagina e poi ci premiamo.',
    'Mo però aprilo, ’sto Moodle.',
    'Cinque minuti di pausa. Detti tre ore fa.',
    'Il piano era studiare. Poi ho aperto il browser.',
    'Io cerco biscotti, tu cerca gli appunti.',
    'Hai aperto Moodle. È già una vittoria.',
    'Webex aperto, anima ancora in caricamento.',
    'Classroom è un luogo. Il codice è un mistero.',
    'Una scheda per studiare, ventisette per distrarsi.',
    'Il file si chiama definitivo_finale_vero_7.pdf?',
    'Confermo: fissare gli appunti non li fa imparare.',
    'Sto facendo la guardia alla tua concentrazione.',
    'Sono un cane guida. Per i link, per adesso.',
    'Ho annusato il problema. Sa di scadenza.',
    'Questo cane ha più presenze di me.',
    'La vera intelligenza artificiale è capire l’orario.',
    'Oggi niente overfitting: solo overthinking.',
    'Io addestro te. Tu addestra il modello.',
    'Machine Learning? Io imparo solo dove sono i biscotti.',
    'Il mio dataset contiene solo crocchette.',
    'Multiagente? Io e la tua voglia di studiare.',
    'Il sistema più complesso è scegliere da dove iniziare.',
    'AAM: Adesso Apro Moodle. Forse.',
    'Game of Life? Prima sopravviviamo alla sessione.',
    'Il bug non scappa. Io sì, ho quattro zampe.',
    'Se compila al primo colpo, controlla bene.',
    'Un commit e poi stacco. Ultime parole famose.',
    'Il README non conta come studio. O forse sì?',
    'La documentazione la legge il prossimo te.',
    'È una feature. Lo dico con convinzione.',
    'Non sto dormendo: elaboro in background.',
    'Questa è una pausa di complessità O(n).',
    'La mensa è un algoritmo di scelta difficile.',
    'Tra una salita e un appunto, Camerino ti allena.',
    'Meteo personale: nuvoloso con possibilità di consegne.',
    'La sessione arriva. Io intanto mi siedo.',
    'Se mi vedi girare, sto ripassando i bordi.',
    'Sto testando tutte le materie. A zampate.',
    'Ho trovato il link. Per la motivazione ci lavoriamo.',
    'La tua media la calcoliamo dopo un biscotto.',
    'Dada o database? Domanda difficile.',
    'Non procrastino: pianifico una pausa molto lunga.',
    'Hai bevuto un po’ d’acqua? Bau-promemoria.',
    'Una materia alla volta. Io ho quattro zampe, non quattro cervelli.',
    'Questa pagina ha bisogno di meno ansia e più biscotti.',
    'Ci sta una pausa. Ma torna, che ti tengo il posto.'
  ];
  function shuffledLines(random, last) {
    const result = phrases.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    if (result[0] === last) [result[0], result[1]] = [result[1], result[0]];
    return result;
  }
  function bubblePosition(anchor, bubble, viewport) {
    const x = Math.max(10, Math.min(anchor.x + anchor.width / 2 - bubble.width / 2, viewport.width - bubble.width - 10));
    const above = anchor.y - bubble.height - 9;
    const y = above >= 8 ? above : Math.min(viewport.height - bubble.height - 10, anchor.y + anchor.height + 9);
    return { x, y: Math.max(8, y), tail: Math.max(16, Math.min(anchor.x + anchor.width / 2 - x, bubble.width - 16)), below: above < 8 };
  }
  function init(doc) {
    const root = doc.getElementById('duck-guide'), walker = doc.getElementById('duck-walker');
    const bubble = doc.getElementById('buddy-speech'), text = doc.getElementById('buddy-speech-text');
    if (!root || !walker || !bubble) return;
    const panel = doc.getElementById('duck-panel'), menu = doc.getElementById('duck-position-menu');
    const toggle = doc.getElementById('buddy-banter-toggle');
    let enabled = true, queue = [], nextTimer = 0, hideTimer = 0, frame = 0, lastShown = 0, last = '';
    try { enabled = localStorage.getItem('retro-buddy-banter') !== 'off'; last = sessionStorage.getItem('retro-buddy-last-line') || ''; } catch (_) {}
    function sync() { toggle.setAttribute('aria-pressed', String(enabled)); toggle.textContent = enabled ? 'Battute: attive' : 'Battute: in pausa'; }
    function hide() { clearTimeout(hideTimer); cancelAnimationFrame(frame); bubble.hidden = true; frame = 0; }
    function allowed() { return enabled && !doc.hidden && panel.hidden && menu.hidden && !walker.hidden; }
    function place() {
      if (bubble.hidden) return;
      const r = walker.getBoundingClientRect(), b = bubble.getBoundingClientRect();
      const p = bubblePosition({ x: r.x, y: r.y, width: r.width, height: r.height }, { width: b.width, height: b.height }, { width: innerWidth, height: innerHeight });
      bubble.style.transform = 'translate3d(' + p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px,0)';
      bubble.style.setProperty('--buddy-tail-x', p.tail + 'px');
      bubble.dataset.below = String(p.below);
      frame = requestAnimationFrame(place);
    }
    function show(line) {
      if (!allowed()) return;
      hide(); text.textContent = line; last = line; lastShown = performance.now();
      try { sessionStorage.setItem('retro-buddy-last-line', line); } catch (_) {}
      bubble.hidden = false; place(); hideTimer = setTimeout(hide, 5800);
    }
    function showNext() {
      if (!queue.length) queue = shuffledLines(Math.random, last);
      show(queue.shift());
    }
    function schedule(delay) {
      clearTimeout(nextTimer);
      nextTimer = setTimeout(() => { if (allowed()) showNext(); schedule(20000 + Math.random() * 10000); }, delay);
    }
    toggle.addEventListener('click', () => {
      enabled = !enabled; sync(); hide();
      try { localStorage.setItem('retro-buddy-banter', enabled ? 'on' : 'off'); } catch (_) {}
      schedule(3000);
    });
    root.addEventListener('duck-panel-toggle', () => { hide(); if (panel.hidden) schedule(2500); });
    root.addEventListener('buddy-menu-open', hide);
    walker.addEventListener('pointerenter', () => { if (performance.now() - lastShown > 10000) showNext(); });
    doc.addEventListener('visibilitychange', () => { hide(); if (!doc.hidden) schedule(3500); });
    sync();
    let firstVisit = true;
    try { firstVisit = sessionStorage.getItem('retro-buddy-introduced') !== 'yes'; sessionStorage.setItem('retro-buddy-introduced', 'yes'); } catch (_) {}
    nextTimer = setTimeout(() => { if (allowed()) { if (firstVisit) show(phrases[0]); else showNext(); } schedule(20000); }, 1600);
  }
  return { phrases, shuffledLines, bubblePosition, init };
}));
