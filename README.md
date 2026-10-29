<div align="center">

# COMPUTER SCIENCE // RETRO NOTES

**Artificial Intelligence · UNICAM · 1° semestre 2026/27**

<sub>Quattro materie. Una pagina per ciascuna. Stile pixel art, senza complicazioni.</sub>

<br><br>

[**VISITA IL SITO**](https://berserk-hub150.github.io/ComputerScience/)

</div>

---

## Le materie

| Pixel | Corso | Pagina |
|:---:|---|---|
| <img src="https://art.pixilart.com/db3253819eeccd9.png" width="56" alt="Computer pixel art"> | **Machine Learning** | [Apri la pagina](https://berserk-hub150.github.io/ComputerScience/machine-learning/) |
| <img src="https://art.pixilart.com/bfbca2a0e9c0fe5.png" width="56" alt="Pianeta pixel art"> | **Complex System Design** | [Apri la pagina](https://berserk-hub150.github.io/ComputerScience/complex-system-design/) |
| <img src="https://art.pixilart.com/f80e1a349d6ca51.png" width="56" alt="Gatto pixel art"> | **Agent-Based Adaptive Modelling** | [Apri la pagina](https://berserk-hub150.github.io/ComputerScience/agent-based-adaptive-modelling/) |
| <img src="https://art.pixilart.com/e93c1fcc8282bf8.gif" width="56" alt="Robot pixel art"> | **Multiagent System Lab** | [Apri la pagina](https://berserk-hub150.github.io/ComputerScience/multiagent-system-lab/) |

## Collegamenti diretti dei corsi

Ogni pagina mostra **Appunti Notion**, **Webex** e i collegamenti aggiuntivi realmente presenti nelle schede di [Palozz](https://github.com/frapalozz/informatica/tree/main/_materie/computer-science). I pulsanti aprono i collegamenti reali, non una pagina intermedia.

| Materia | Webex | Moodle / Classroom | Registrazioni |
|---|---|---|---|
| Machine Learning | [Loreti](https://unicam.webex.com/meet/michele.loreti) | [Moodle 837](https://elearning.unicam.it/course/view.php?id=837) | [Moodle 837](https://elearning.unicam.it/course/view.php?id=837) |
| Complex System Design | [Corradini](https://unicam.webex.com/meet/flavio.corradini) | Non indicato nella fonte | Non indicate |
| Agent-Based Adaptive Modelling | [Merelli](https://unicam.webex.com/meet/emanuela.merelli) | [Classroom](https://classroom.google.com/u/1/c/ODg2MTMyNDYwODM3) | Non indicate |
| Multiagent System Lab | [Merelli](https://unicam.webex.com/meet/emanuela.merelli) | [Classroom](https://classroom.google.com/u/1/c/ODg2MTMyNDYwODM3) | Non indicate |

Rimangono disponibili i collegamenti agli appunti Notion e alla scheda Palozz originale. Per aggiornare altri link basta modificare la rispettiva pagina `index.md` su GitHub.

## Modificare i collegamenti

Apri il file `index.md` della materia e usa la matita di GitHub per modificare i link presenti nella parte iniziale del file.

- `original_url`: appunti Notion
- `webex_url`: incontro Webex
- `learning_url` e `learning_label`: Moodle o Classroom, se disponibili
- `recordings_url`: registrazioni, se disponibili
- `course_materials_url`: scheda Palozz

Dopo aver modificato un URL, premi **Commit changes**. Le pagine non contengono sezioni vuote o testi provvisori.

## Struttura

```text
ComputerScience/
├── index.html                         # Homepage
├── machine-learning/index.md
├── complex-system-design/index.md
├── agent-based-adaptive-modelling/index.md
├── multiagent-system-lab/index.md
├── _layouts/course.html               # Stile comune delle 4 pagine
└── _config.yml                        # Impostazioni GitHub Pages
```

## Paper Detective

Il papero pixel art animato è una guida locale, senza AI, API esterne o dipendenze JavaScript. È disponibile nella homepage e nelle quattro materie. Cammina nella pagina con zampe alternate e mantello in movimento; quando si ferma, respira, fa l'occhiolino e saluta.

Il pulsante **Metti negli angoli** permette di fissarlo **in basso a sinistra** o **in basso a destra**; **Torna a girare** riprende la camminata. La preferenza è conservata localmente tra pagine e visite. Il movimento si ferma mentre si passa sopra il papero, si usa la tastiera, si apre la chat o la scheda non è visibile; rispetta la preferenza di movimento ridotto.

- Scrivi ad esempio **“Webex di ML”**, **“appunti CSD”**, **“Classroom AAM”** o **“registrazioni”** dopo aver scelto un corso.
- I pulsanti rapidi permettono di scegliere materia e risorsa; il corso selezionato viene ricordato nella scheda del browser.
- **Mostramelo ◎** apre la pagina del corso e cerchia il pulsante esatto. **Esc** chiude la guida o rimuove il cerchio.
- Se un link non è presente nei dati del corso, la guida lo segnala. Non conosce orari, codici d'accesso, esami o contenuti delle piattaforme esterne.

I collegamenti vengono generati da `_includes/duck-guide.html` leggendo i medesimi campi `index.md` delle pagine: non occorre aggiornare un secondo elenco. Le domande non vengono trasmesse né salvate; `sessionStorage` conserva solo la materia selezionata. Le richieste GitHub per la data di aggiornamento delle pagine restano indipendenti dalla guida.

Il motore di ricerca è in `assets/js/guide-engine.js`; interfaccia e cerchio sono in `assets/js/duck-guide.js` e `assets/css/duck-guide.css`. La mascotte usa uno sprite sheet PNG trasparente (`assets/img/paper-detective-sprites-v2.png`), con quattro pose di camminata e quattro pose di riposo, occhiolino e saluto, animate a fotogrammi da CSS. La stessa grafica compare nella chat. Percorsi e posizione sono gestiti da `assets/js/duck-motion.js`.

Verifica della logica e della sintassi, con Node.js 18 o successivo:

```sh
node --test tests/*.test.cjs
node --check assets/js/duck-guide.js
```

## Ultimo aggiornamento

Ogni pagina mostra la data dell'ultimo commit del proprio file, letta dall'API pubblica di GitHub. Se il servizio non è disponibile viene mostrata la data iniziale riportata nel file.

## Pubblicazione

Attiva una volta sola **Settings → Pages → Deploy from a branch → main → /(root)**.

Il sito sarà su **https://berserk-hub150.github.io/ComputerScience/**.

---

<div align="center">
<sub>Made for studying, with some retro pixels.</sub>
</div>
