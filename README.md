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

## Buddy — il cane guida

Buddy è un cagnolino pixel art cliccabile, senza AI o dipendenze JavaScript. Percorre tutti e quattro i bordi di ogni riquadro nella homepage e di ogni pulsante delle risorse nelle pagine interne. Gira sugli spigoli e passa alla superficie successiva soltanto dopo aver completato il giro. Le superfici si ricavano dagli elementi `data-buddy-platform`, senza un numero fisso di corsi o link. Il percorso si aggiorna quando si scorre o si ridimensiona la pagina. Quando lo fissi in un angolo, guarda verso il centro del sito.

**Metti negli angoli**, accanto al cane e dentro la guida, permette di fissarlo in basso a sinistra o a destra; **Torna sui riquadri** riprende il percorso. La preferenza resta locale. Il cane si ferma quando lo avvicini con il mouse, usi la tastiera o apri la guida; rispetta la preferenza di movimento ridotto.

Buddy mostra 56 battute originali su studio, informatica e vita a Camerino, inclusi gli spunti dell'utente su Enrico Papi e il Dada. Il fumetto compare per pochi secondi, con pause fra una frase e l'altra e senza ripetizioni immediate. Puoi sospenderlo con **Battute: attive / in pausa**, dentro la guida. Le battute non sono risposte AI e non inviano dati a servizi esterni.

- Scrivi ad esempio **“Webex di ML”**, **“appunti CSD”**, **“Classroom AAM”** o **“registrazioni”** dopo aver scelto un corso.
- I pulsanti rapidi permettono di scegliere materia e risorsa; il corso selezionato viene ricordato nella scheda del browser.
- **Mostramelo ◎** apre la pagina del corso e cerchia il pulsante esatto. **Esc** chiude la guida o rimuove il cerchio.
- Se un link non è presente nei dati del corso, la guida lo segnala. Non conosce orari, codici d'accesso, esami o contenuti delle piattaforme esterne.

I collegamenti vengono generati da `_includes/duck-guide.html` leggendo i medesimi campi `index.md` delle pagine: non occorre aggiornare un secondo elenco. Le domande non vengono trasmesse né salvate; `sessionStorage` conserva solo la materia selezionata. Le richieste GitHub per la data di aggiornamento delle pagine restano indipendenti dalla guida.

Il motore di ricerca è in `assets/js/guide-engine.js`; interfaccia e cerchio sono in `assets/js/duck-guide.js` e `assets/css/duck-guide.css`. La mascotte usa la tavola originale di [rmazanek su OpenGameArt](https://opengameart.org/content/dog-3), pubblicata con licenza CC0, basata sui lavori di Shepardskin e Hellkipz. `assets/img/pixel-dog.png` è il PNG originale, senza modifiche. Crediti e formato sono in `assets/img/pixel-dog.LICENSE.txt`. Percorso, salti e sequenze di camminata, sosta e seduta sono gestiti da `assets/js/duck-motion.js`; frasi e fumetti da `assets/js/buddy-banter.js`.

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
