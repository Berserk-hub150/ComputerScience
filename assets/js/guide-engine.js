/* Deterministic resource lookup. No network requests, generated answers or dependencies. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RetroGuide = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }
  const aliases = {
    ml: ['ml', 'machine learning', 'machine laerning', 'machine', 'learning', 'apprendimento automatico', 'loreti'],
    csd: ['csd', 'complex system design', 'complex systems design', 'complex', 'sistemi complessi', 'corradini'],
    abm: ['abm', 'aam', 'agent based adaptive modelling', 'agent based adaptive modeling', 'adaptive', 'modellazione adattiva'],
    masl: ['masl', 'mas', 'multiagent system lab', 'multiagent systems lab', 'multiagent', 'multi agent', 'laboratorio multiagente']
  };
  const resourceAliases = {
    webex: ['webex', 'web ex', 'webx', 'webxe', 'weebex', 'videochiamata', 'videolezione', 'aula virtuale', 'lezione online', 'lezioni online', 'riunione', 'meet'],
    recordings: ['registrazioni', 'registrazione', 'registrata', 'registrate', 'recording', 'recordings', 'rivedere', 'riguardare', 'video lezioni', 'video delle lezioni'],
    notion: ['notion', 'appunti', 'note', 'notes', 'riassunti'],
    moodle: ['moodle', 'modle', 'moodlle', 'elearning', 'e learning'],
    classroom: ['classroom', 'clasroom', 'classrom', 'google classroom'],
    palozz: ['palozz', 'palozzi', 'fonte', 'scheda originale', 'scheda palozz']
  };
  function has(text, phrase) { return (' ' + text + ' ').includes(' ' + phrase + ' '); }
  function detectCourses(text, courses) {
    return courses.filter(c => (aliases[c.id] || [normalize(c.title)]).some(a => has(text, a)));
  }
  function detectResources(text) {
    const matches = Object.keys(resourceAliases).filter(k => resourceAliases[k].some(a => has(text, a)));
    return matches;
  }
  function resources(course, kinds) {
    const all = [
      { kind: 'notion', label: 'Appunti Notion', url: course.notion },
      { kind: 'webex', label: 'Webex', url: course.webex },
      { kind: 'learning', label: course.learningLabel, url: course.learning },
      { kind: 'recordings', label: 'Registrazioni', url: course.recordings },
      { kind: 'palozz', label: 'Scheda Palozz', url: course.palozz }
    ].filter(r => /^https:\/\//.test(r.url || ''));
    if (!kinds || !kinds.length) return all;
    return all.filter(r => kinds.some(k => k === r.kind ||
      ((k === 'moodle' || k === 'classroom') && r.kind === 'learning' && normalize(r.label) === k)));
  }
  function answer(question, courses, context) {
    const text = normalize(question);
    const selected = detectCourses(text, courses);
    const kinds = detectResources(text);
    const current = courses.find(c => c.id === context);
    if (!text) return { type: 'help', text: 'Dimmi una materia o una risorsa: appunti, Webex, Moodle, Classroom, registrazioni o Palozz.' };
    if (/^(ciao|salve|ehi|hey|hello|buongiorno|buonasera)$/.test(text)) return { type: 'help', text: 'Ehi! Sono Paper Detective. Quale materiale cerchiamo?' };
    if (has(text, 'merelli') && !selected.length) {
      return { type: 'choose', text: 'Merelli è indicata per AAM e MASL. Quale dei due corsi ti serve?', choices: courses.filter(c => ['abm', 'masl'].includes(c.id)), kinds };
    }
    if (/\b(orario|orari|quando|esame|esami|scadenza|scadenze|password|codice|voto|crediti|cfu)\b/.test(text)) {
      return { type: 'unknown', text: 'Questa informazione non è nei dati del sito. Posso indicarti appunti e piattaforme del corso, dove controllarla.', courses: selected.length ? selected : current ? [current] : [] };
    }
    if (/\b(ai|intelligenza artificiale|funzioni|funziona|chi sei|cosa sai|cosa puoi|aiuto|help|privacy)\b/.test(text)) {
      return { type: 'help', text: 'Sono una guida senza AI: riconosco materie e risorse, apro i link e ti mostro dove sono sulla pagina. Non leggo le piattaforme esterne e non invio le tue domande a un server.' };
    }
    if (/\b(tutte|tutti|materie|corsi)\b/.test(text) && !selected.length && !kinds.length) {
      return { type: 'choose', text: 'Questi sono i quattro corsi. Scegline uno e troviamo il materiale.', choices: courses, kinds: [] };
    }
    const generic = /\b(link|risorse|risorsa|materiale|materiali|tutto|tutti|tutte|mostra|mostrami|si|ok|apri|corso|lezioni|lezione)\b/.test(text);
    if (!selected.length && !kinds.length && !generic) {
      return { type: 'unknown', text: 'Questo indizio mi sfugge. Prova “Webex di ML”, “appunti CSD” o “Classroom AAM”. Posso trovare i collegamenti, ma non rispondere sui contenuti delle lezioni.' };
    }
    let targets = selected.length ? selected : current ? [current] : [];
    if (/\b(tutti|tutte)\b/.test(text) && !selected.length) targets = courses;
    if (!targets.length) return { type: 'choose', text: 'Per quale materia? Scegli qui sotto: tengo a mente la risorsa che cerchi.', choices: courses, kinds };
    return {
      type: 'results', context: targets.length === 1 ? targets[0].id : context,
      text: kinds.length ? 'Indizi trovati. Puoi aprire il link o farmelo indicare sulla pagina.' : 'Fascicolo aperto: ecco i collegamenti disponibili.',
      results: targets.map(course => ({ course, resources: resources(course, kinds), missing: kinds.filter(k => !resources(course, [k]).length) }))
    };
  }
  return { normalize, answer, resources };
}));
