const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} = React;
// ─── Sprachen: Deutsch, English, Français, Română ───
// Texte stehen im Code auf Deutsch; t() liefert die Übersetzung der gewählten Sprache.
// Notennamen: deutsch (H, B, Fis, Es), englisch (B, B♭, F♯, E♭), französisch (Si, Si♭, Fa♯, Mi♭),
// rumänisch (Si, Si♭, Fa♯, Mi♭, aber Re statt Ré).

const LANGS = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  ro: "Română"
};
const LANG_KEY = "tonleitern-lang";
const LANG = (() => {
  try {
    const s = window.localStorage.getItem(LANG_KEY);
    if (LANGS[s]) return s;
  } catch {/* kein Speicher */}
  const n = (navigator.language || "").slice(0, 2).toLowerCase();
  return LANGS[n] ? n : "en";
})();
function setLang(l) {
  try {
    window.localStorage.setItem(LANG_KEY, l);
  } catch {/* kein Speicher */}
  window.location.reload();
}

// [English, Français]
const TR = {
  // Allgemein / Navigation
  "Tonleitern & Drone": ["Scales & Drone", "Gammes & Bourdon"],
  "Stimmgerät": ["Tuner", "Accordeur"],
  "Metronom": ["Metronome", "Métronome"],
  "Tonleitern": ["Scales", "Gammes"],
  "Drone": ["Drone", "Bourdon"],
  "Sprache": ["Language", "Langue"],
  "Oktave": ["Octave", "Octave"],
  "Lautstärke": ["Volume", "Volume"],
  "■ Stopp": ["■ Stop", "■ Stop"],
  // Stimmgerät
  "Kammerton a¹": ["Concert pitch A4", "Diapason La"],
  "zu tief": ["too low", "trop bas"],
  "sauber": ["in tune", "juste"],
  "zu hoch": ["too high", "trop haut"],
  "Spiel einen Ton…": ["Play a note…", "Jouez une note…"],
  "Mikrofon aus": ["Microphone off", "Micro éteint"],
  "Stimmgerät aus": ["Tuner off", "Accordeur éteint"],
  "🎤 Stimmgerät an": ["🎤 Tuner on", "🎤 Allumer l’accordeur"],
  "■ Aufnahme beenden ({n} Töne)": ["■ Stop recording ({n} notes)", "■ Arrêter l’enregistrement ({n} notes)"],
  "● Aufnahme mit Auswertung": ["● Record with analysis", "● Enregistrer avec analyse"],
  "Sauber bis ±": ["In tune within ±", "Juste à ±"],
  "Bisher: {ok} sauber · {low} zu tief · {high} zu hoch": ["So far: {ok} in tune · {low} too low · {high} too high", "Jusqu’ici : {ok} justes · {low} trop bas · {high} trop haut"],
  "Auswertung": ["Analysis", "Analyse"],
  "Keine gehaltenen Töne erkannt. Töne etwas länger halten und näher ans Mikrofon.": ["No sustained notes detected. Hold the notes a little longer and move closer to the microphone.", "Aucune note tenue détectée. Tenez les notes un peu plus longtemps et rapprochez-vous du micro."],
  "Töne": ["Notes", "Notes"],
  "sauber ({p} %)": ["in tune ({p} %)", "justes ({p} %)"],
  "Ø Abweichung (Cent)": ["Avg. deviation (cents)", "Écart moyen (cents)"],
  "Ton": ["Note", "Note"],
  "Anzahl": ["Count", "Nombre"],
  "Ø Cent": ["Avg. cents", "Cents moy."],
  "Cent": ["cents", "cents"],
  "Aufnahme anhören": ["Listen to the recording", "Écouter l’enregistrement"],
  "Stimmton": ["Reference tone", "Note de référence"],
  "Halten (bis erneut tippen)": ["Hold (until tapped again)", "Tenir (jusqu’au prochain appui)"],
  "Fehler": ["Error", "Erreur"],
  "Dieser Browser gibt hier kein Mikrofon frei (Seite muss über https geöffnet sein).": ["This browser does not allow the microphone here (the page must be opened via https).", "Ce navigateur n’autorise pas le micro ici (la page doit être ouverte en https)."],
  "In diesem Vorschaufenster blockiert die umgebende Seite das Mikrofon, auch wenn der Browser es erlaubt hat. In der installierten App bzw. auf der eigenen Internetadresse funktioniert das Stimmgerät. Der Stimmton geht hier trotzdem.": ["In this preview window the surrounding page blocks the microphone, even if the browser allowed it. The tuner works in the installed app or at the app’s own web address. The reference tone still works here.", "Dans cette fenêtre d’aperçu, la page qui l’entoure bloque le micro, même si le navigateur l’a autorisé. L’accordeur fonctionne dans l’app installée ou à sa propre adresse web. La note de référence fonctionne quand même ici."],
  "Kein Zugriff aufs Mikrofon. Bitte in den Browser-Einstellungen für diese Seite erlauben und neu laden.": ["No access to the microphone. Please allow it for this page in the browser settings and reload.", "Pas d’accès au micro. Autorisez-le pour cette page dans les réglages du navigateur, puis rechargez."],
  "Kein Mikrofon gefunden.": ["No microphone found.", "Aucun micro trouvé."],
  "Das Mikrofon wird gerade von einer anderen App benutzt.": ["The microphone is being used by another app.", "Le micro est utilisé par une autre app."],
  "Mikrofon nicht verfügbar ({name}). Der Stimmton funktioniert trotzdem.": ["Microphone not available ({name}). The reference tone still works.", "Micro indisponible ({name}). La note de référence fonctionne quand même."],
  // Metronom
  "Mechanisch": ["Mechanical", "Mécanique"],
  "Hoch": ["High", "Aigu"],
  "Dirigentenstock": ["Conductor’s baton", "Baguette de chef"],
  "Klatschen": ["Clapping", "Claquements de mains"],
  "Triole": ["Triplet", "Triolet"],
  "Langsamer": ["Slower", "Plus lent"],
  "Schneller": ["Faster", "Plus rapide"],
  "Schläge pro Minute": ["beats per minute", "battements par minute"],
  "Tempo": ["Tempo", "Tempo"],
  "■ Metronom stoppen": ["■ Stop metronome", "■ Arrêter le métronome"],
  "▶ Metronom starten": ["▶ Start metronome", "▶ Démarrer le métronome"],
  "Takt": ["Meter", "Mesure"],
  "ohne": ["none", "aucune"],
  "{b}er": ["{b} beats", "{b} temps"],
  "Unterteilung": ["Subdivision", "Subdivision"],
  "Betonte Eins": ["Accent on beat 1", "Premier temps accentué"],
  "Zählstimme": ["Counting voice", "Voix qui compte"],
  "aus": ["off", "désactivée"],
  "Stimme + Klang": ["Voice + click", "Voix + clic"],
  "nur Stimme": ["Voice only", "Voix seule"],
  "Taktwechsel (z. B. „5/8 3/4“ oder „7/8(2+2+3)“), leer = normaler Takt": ["Changing meters (e.g. “5/8 3/4” or “7/8(2+2+3)”), empty = normal meter", "Changements de mesure (p. ex. « 5/8 3/4 » ou « 7/8(2+2+3) »), vide = mesure normale"],
  "Das Tempo gilt für die Viertelnote. In Achteltakten zählt jede Achtel, der Anfang jeder Gruppe ist betont (5/8 = 3+2).": ["The tempo is for the quarter note. In eighth-note meters every eighth is counted and the start of each group is accented (5/8 = 3+2).", "Le tempo vaut pour la noire. Dans les mesures en croches, chaque croche est comptée et le début de chaque groupe est accentué (5/8 = 3+2)."],
  "Empfindlichkeit": ["Sensitivity", "Sensibilité"],
  "normal": ["normal", "normale"],
  "hoch": ["high", "élevée"],
  "sehr hoch": ["very high", "très élevée"],
  "und": ["and", "et"],
  "Stimme": ["Voice", "Voix"],
  "Standard": ["Standard", "Standard"],
  "Eigene": ["My own", "La mienne"],
  "Eigene Stimme aufnehmen": ["Record your own voice", "Enregistrer votre propre voix"],
  "Tippe auf „Alle aufnehmen“ und sprich jedes Wort, sobald es groß erscheint. Fehlende Wörter spricht die Standardstimme.": ["Tap “Record all” and say each word as soon as it appears in large letters. Missing words are spoken by the standard voice.", "Touchez « Tout enregistrer » et dites chaque mot dès qu’il apparaît en grand. Les mots manquants sont dits par la voix standard."],
  "Aufnahme beenden": ["Stop recording", "Arrêter l’enregistrement"],
  "Alle aufnehmen": ["Record all", "Tout enregistrer"],
  "Aufnehmen": ["Record", "Enregistrer"],
  "Anhören": ["Listen", "Écouter"],
  "Löschen": ["Delete", "Supprimer"],
  "Takt anhängen": ["Add a bar", "Ajouter une mesure"],
  "Letzten Takt entfernen": ["Remove last bar", "Retirer la dernière mesure"],
  "Eine Saite · 2 Finger": ["One string · 2 fingers", "Une corde · 2 doigts"],
  "Eine Saite · 3 Finger": ["One string · 3 fingers", "Une corde · 3 doigts"],
  "{n}er Gruppe": ["group of {n}", "groupe de {n}"],
  "Fingersatz": ["Fingering", "Doigté"],
  "kleine Zahl = Finger, 0 = leere Saite": ["small number = finger, 0 = open string", "petit chiffre = doigt, 0 = corde à vide"],
  "{up} Töne aufwärts, {down} abwärts": ["{up} notes up, {down} down", "{up} notes en montant, {down} en descendant"],
  "Alle Lagen nacheinander": ["All positions in a row", "Toutes les positions à la suite"],
  "Tonfolge": ["Sequence", "Suite de notes"],
  "Akkord": ["Chord", "Accord"],
  "Moll": ["Minor", "Mineur"],
  "Dur 7": ["Dominant 7", "Septième de dominante"],
  "Moll 7": ["Minor 7", "Mineur 7"],
  "Maj 7": ["Maj 7", "Maj 7"],
  "Quinte": ["Fifth", "Quinte"],
  "Quarte": ["Fourth", "Quarte"],
  "Halbton": ["Semitone", "Demi-ton"],
  "Leeren": ["Clear", "Effacer"],
  "Reine Stimmung (zum Grundton)": ["Just intonation (to the root)", "Intonation juste (par rapport à la fondamentale)"],
  "Pedal verschiebt um": ["Pedal moves by", "La pédale transpose de"],
  "rein gestimmt": ["just intonation", "intonation juste"],
  "gleichstufig": ["equal temperament", "tempérament égal"],
  "Ganztonschritt": ["Whole step", "Ton entier"],
  // Tonleitern / Griffbrett
  "Tonleitern über 4 Saiten": ["Scales across 4 strings", "Gammes sur 4 cordes"],
  "Lagen": ["Positions", "Positions"],
  "Gruppen": ["Groups", "Groupes"],
  "Regionen": ["Regions", "Régions"],
  "Grundton": ["Root", "Tonique"],
  "Tonleiter": ["Scale", "Gamme"],
  "Dur": ["Major", "Majeur"],
  "Moll natürlich": ["Natural minor", "Mineur naturel"],
  "Moll harmonisch": ["Harmonic minor", "Mineur harmonique"],
  "Moll melodisch": ["Melodic minor", "Mineur mélodique"],
  "Chromatisch": ["Chromatic", "Chromatique"],
  "Ganzton": ["Whole tone", "Par tons"],
  "Grundton = Drone ({n})": ["Root = drone ({n})", "Tonique = bourdon ({n})"],
  "Lage": ["Position", "Position"],
  "Gruppe": ["Group", "Groupe"],
  "{g}er": ["{g} per string", "{g} par corde"],
  "Ab Stufe": ["From degree", "À partir du degré"],
  "Griffbrett": ["Fingerboard", "Touche"],
  "In dieser Lage passt die Folge nicht aufs Griffbrett.": ["In this position the sequence does not fit on the fingerboard.", "Dans cette position, la séquence ne tient pas sur la touche."],
  "{up} Töne aufwärts, {down} abwärts · kleine Zahl = Finger, 0 = leere Saite": ["{up} notes up, {down} down · small number = finger, 0 = open string", "{up} notes en montant, {down} en descendant · petit chiffre = doigt, 0 = corde à vide"],
  ", + = Daumen (blauer Rand)": [", + = thumb (blue outline)", ", + = pouce (contour bleu)"],
  "{g} Töne pro Saite, {up} aufwärts und zurück": ["{g} notes per string, {up} up and back", "{g} notes par corde, {up} en montant et retour"],
  " · grüner Ring = aktueller Drone-Ton": [" · green ring = current drone note", " · anneau vert = note actuelle du bourdon"],
  "▶ Abspielen": ["▶ Play", "▶ Jouer"],
  "Leersaiten beim Saitenwechsel": ["Open strings when changing strings", "Cordes à vide aux changements de corde"],
  "Alle Stufen nacheinander": ["All degrees in a row", "Tous les degrés à la suite"],
  "Eine Oktave höher (notiert)": ["One octave higher (as written)", "Une octave plus haut (comme écrit)"],
  // Regionen
  "Saite": ["String", "Corde"],
  "{s}-Saite": ["{s} string", "Corde de {s}"],
  "Regionen der Saite": ["Regions of the string", "Régions de la corde"],
  "Untere Lagen (Region 1–2)": ["Lower positions (regions 1–2)", "Positions basses (régions 1–2)"],
  "Obere Lagen (ab Region 3)": ["Upper positions (from region 3)", "Positions hautes (dès la région 3)"],
  "Sattel": ["Nut", "Sillet"],
  "→ Steg": ["→ Bridge", "→ Chevalet"],
  "Daumen-Lagen (Region 3: 1–4, Region 4: 1–3)": ["Thumb positions (region 3: 1–4, region 4: 1–3)", "Positions du pouce (région 3 : 1–4, région 4 : 1–3)"],
  "◇ = Flageolett (antippen zum Anhören) · ↓ = Naturseptime, klingt tiefer · Abstände zum Steg hin gedehnt": ["◇ = harmonic (tap to listen) · ↓ = natural seventh, sounds lower · distances stretched towards the bridge", "◇ = harmonique (toucher pour écouter) · ↓ = septième naturelle, sonne plus bas · distances étirées vers le chevalet"],
  "Region": ["Region", "Région"],
  "untere Lagen, ab der 2. Region schon mit Daumen möglich.": ["lower positions; from region 2 the thumb can already be used.", "positions basses ; dès la région 2, le pouce est déjà possible."],
  "obere Lagen, Daumen auf {list} (1.–4. Lage).": ["upper positions, thumb on {list} (positions 1–4).", "positions hautes, pouce sur {list} (positions 1 à 4)."],
  "Daumen auf {list} (1.–3. Lage).": ["thumb on {list} (positions 1–3).", "pouce sur {list} (positions 1 à 3)."],
  "Flageoletts {h}, dazu die Zwischentöne {s}.": ["harmonics {h}, plus the stopped notes {s} in between.", "harmoniques {h}, plus les notes intermédiaires {s}."],
  "Flageoletts {h}.": ["harmonics {h}.", "harmoniques {h}."],
  // Drone-Sequenz
  "Drone-Sequenz": ["Drone sequence", "Séquence de bourdons"],
  "Jetzt": ["Now", "Maintenant"],
  "keine Töne": ["no notes", "aucune note"],
  "Nächster": ["Next", "Suivant"],
  "Zurück": ["Back", "Précédent"],
  "Weiter": ["Next", "Suivant"],
  "▶ Drone starten": ["▶ Start drone", "▶ Démarrer le bourdon"],
  "Der Browser blockiert den Ton ({s}). Bitte Stopp und noch einmal „Drone starten“ tippen.": ["The browser is blocking the sound ({s}). Please tap Stop and then “Start drone” again.", "Le navigateur bloque le son ({s}). Touchez Stop puis à nouveau « Démarrer le bourdon »."],
  "Tonfolge (z. B. „C G D A“, Akkorde mit Bindestrich: „C-E-G-B“, Oktave optional: „G1“)": ["Note sequence (e.g. “C G D A”, chords with hyphens: “C-E-G-B♭”, octave optional: “G1”)", "Suite de notes (p. ex. « Do Sol Ré La », accords avec tirets : « Do-Mi-Sol-Si♭ », octave facultative : « Sol1 »)"],
  "Nicht erkannt: {e}": ["Not recognised: {e}", "Non reconnu : {e}"],
  "Vorlage wählen…": ["Choose a preset…", "Choisir un modèle…"],
  "Gespeichert": ["Saved", "Enregistrées"],
  "Folge speichern": ["Save sequence", "Enregistrer la suite"],
  "Name für diese Folge:": ["Name for this sequence:", "Nom de cette suite :"],
  "Klang": ["Sound", "Son"],
  "Quinte (bei Einzeltönen)": ["Fifth (single notes)", "Quinte (notes seules)"],
  "Oktave dazu": ["Add octave", "Ajouter l’octave"],
  "Endlos": ["Loop", "En boucle"],
  "Leertaste": ["Space", "Espace"],
  "Quintenzirkel": ["Circle of fifths", "Cycle des quintes"],
  "Quartenzirkel": ["Circle of fourths", "Cycle des quartes"],
  "Blues in F": ["Blues in F", "Blues en Fa"],
  "Kadenz I–IV–V–I": ["Cadence I–IV–V–I", "Cadence I–IV–V–I"],
  "Akkorde I–IV–V–I": ["Chords I–IV–V–I", "Accords I–IV–V–I"],
  "Septakkorde (Quartenzirkel)": ["Seventh chords (circle of fourths)", "Accords de septième (cycle des quartes)"],
  "Kontrabass": ["Double bass", "Contrebasse"],
  "Klavier": ["Piano", "Piano"],
  "Oboe": ["Oboe", "Hautbois"],
  "Violine": ["Violin", "Violon"],
  "Sinus": ["Sine", "Sinus"],
  "Kein Ton? Lautstärke am Gerät prüfen, am iPhone den Stummschalter aus. Laptop- und Handylautsprecher geben tiefe Töne kaum wieder: Oktave 3 oder 4 wählen oder Kopfhörer nutzen.": ["No sound? Check the device volume and turn off the silent switch on iPhone. Laptop and phone speakers barely reproduce low notes: choose octave 3 or 4 or use headphones.", "Pas de son ? Vérifiez le volume de l’appareil et désactivez le mode silencieux de l’iPhone. Les haut-parleurs d’ordinateur et de téléphone rendent mal les graves : choisissez l’octave 3 ou 4 ou utilisez un casque."],
  "Pedal: weiter = Pfeil rechts/unten, Bild ab, Leertaste, Enter · zurück = Pfeil links/oben, Bild auf.": ["Pedal: next = arrow right/down, Page Down, Space, Enter · back = arrow left/up, Page Up.", "Pédale : suivant = flèche droite/bas, Page suivante, Espace, Entrée · précédent = flèche gauche/haut, Page précédente."],
  "Zuletzt empfangen:": ["Last received:", "Dernière touche reçue :"]
};

// Română
const RO = {
  "Tonleitern & Drone": "Game & Bordun",
  "Stimmgerät": "Acordor",
  "Metronom": "Metronom",
  "Tonleitern": "Game",
  "Drone": "Bordun",
  "Sprache": "Limbă",
  "Oktave": "Octava",
  "Lautstärke": "Volum",
  "■ Stopp": "■ Stop",
  "Kammerton a¹": "Diapazon La",
  "zu tief": "prea jos",
  "sauber": "curat",
  "zu hoch": "prea sus",
  "Spiel einen Ton…": "Cântă o notă…",
  "Mikrofon aus": "Microfon oprit",
  "Stimmgerät aus": "Oprește acordorul",
  "🎤 Stimmgerät an": "🎤 Pornește acordorul",
  "■ Aufnahme beenden ({n} Töne)": "■ Oprește înregistrarea ({n} note)",
  "● Aufnahme mit Auswertung": "● Înregistrare cu evaluare",
  "Sauber bis ±": "Curat până la ±",
  "Bisher: {ok} sauber · {low} zu tief · {high} zu hoch": "Până acum: {ok} curate · {low} prea jos · {high} prea sus",
  "Auswertung": "Evaluare",
  "Keine gehaltenen Töne erkannt. Töne etwas länger halten und näher ans Mikrofon.": "Nu s-au recunoscut note ținute. Ține notele puțin mai mult și apropie-te de microfon.",
  "Töne": "Note",
  "sauber ({p} %)": "curate ({p} %)",
  "Ø Abweichung (Cent)": "Abatere medie (cenți)",
  "Ton": "Notă",
  "Anzahl": "Număr",
  "Ø Cent": "Cenți medii",
  "Cent": "cenți",
  "Aufnahme anhören": "Ascultă înregistrarea",
  "Stimmton": "Notă de referință",
  "Halten (bis erneut tippen)": "Ține (până la următoarea atingere)",
  "Fehler": "Eroare",
  "Dieser Browser gibt hier kein Mikrofon frei (Seite muss über https geöffnet sein).": "Acest browser nu permite microfonul aici (pagina trebuie deschisă prin https).",
  "In diesem Vorschaufenster blockiert die umgebende Seite das Mikrofon, auch wenn der Browser es erlaubt hat. In der installierten App bzw. auf der eigenen Internetadresse funktioniert das Stimmgerät. Der Stimmton geht hier trotzdem.": "În această fereastră de previzualizare, pagina din jur blochează microfonul, chiar dacă browserul l-a permis. Acordorul funcționează în aplicația instalată sau la adresa proprie a aplicației. Nota de referință funcționează totuși aici.",
  "Kein Zugriff aufs Mikrofon. Bitte in den Browser-Einstellungen für diese Seite erlauben und neu laden.": "Nu există acces la microfon. Permite-l pentru această pagină în setările browserului și reîncarcă.",
  "Kein Mikrofon gefunden.": "Nu s-a găsit niciun microfon.",
  "Das Mikrofon wird gerade von einer anderen App benutzt.": "Microfonul este folosit de o altă aplicație.",
  "Mikrofon nicht verfügbar ({name}). Der Stimmton funktioniert trotzdem.": "Microfon indisponibil ({name}). Nota de referință funcționează totuși.",
  "Mechanisch": "Mecanic",
  "Hoch": "Înalt",
  "Dirigentenstock": "Bagheta dirijorului",
  "Klatschen": "Bătăi din palme",
  "Triole": "Triolet",
  "Langsamer": "Mai rar",
  "Schneller": "Mai repede",
  "Schläge pro Minute": "bătăi pe minut",
  "Tempo": "Tempo",
  "■ Metronom stoppen": "■ Oprește metronomul",
  "▶ Metronom starten": "▶ Pornește metronomul",
  "Takt": "Măsură",
  "ohne": "fără",
  "{b}er": "{b} timpi",
  "Unterteilung": "Subdiviziune",
  "Betonte Eins": "Accent pe timpul 1",
  "Zählstimme": "Voce care numără",
  "aus": "oprit",
  "Stimme + Klang": "Voce + clic",
  "nur Stimme": "Doar voce",
  "Taktwechsel (z. B. „5/8 3/4“ oder „7/8(2+2+3)“), leer = normaler Takt": "Schimbări de măsură (de ex. „5/8 3/4” sau „7/8(2+2+3)”), gol = măsură normală",
  "Das Tempo gilt für die Viertelnote. In Achteltakten zählt jede Achtel, der Anfang jeder Gruppe ist betont (5/8 = 3+2).": "Tempoul se referă la pătrime. În măsurile cu optimi se numără fiecare optime, iar începutul fiecărui grup este accentuat (5/8 = 3+2).",
  "Empfindlichkeit": "Sensibilitate",
  "normal": "normală",
  "hoch": "ridicată",
  "sehr hoch": "foarte ridicată",
  "und": "și",
  "Stimme": "Voce",
  "Standard": "Standard",
  "Eigene": "Proprie",
  "Eigene Stimme aufnehmen": "Înregistrează-ți propria voce",
  "Tippe auf „Alle aufnehmen“ und sprich jedes Wort, sobald es groß erscheint. Fehlende Wörter spricht die Standardstimme.": "Atinge „Înregistrează tot” și spune fiecare cuvânt imediat ce apare mare. Cuvintele lipsă sunt spuse de vocea standard.",
  "Aufnahme beenden": "Oprește înregistrarea",
  "Alle aufnehmen": "Înregistrează tot",
  "Aufnehmen": "Înregistrează",
  "Anhören": "Ascultă",
  "Löschen": "Șterge",
  "Takt anhängen": "Adaugă o măsură",
  "Letzten Takt entfernen": "Elimină ultima măsură",
  "Eine Saite · 2 Finger": "O coardă · 2 degete",
  "Eine Saite · 3 Finger": "O coardă · 3 degete",
  "{n}er Gruppe": "grup de {n}",
  "Fingersatz": "Digitație",
  "kleine Zahl = Finger, 0 = leere Saite": "cifra mică = deget, 0 = coardă liberă",
  "{up} Töne aufwärts, {down} abwärts": "{up} note în sus, {down} în jos",
  "Alle Lagen nacheinander": "Toate pozițiile la rând",
  "Tonfolge": "Succesiune",
  "Akkord": "Acord",
  "Moll": "Minor",
  "Dur 7": "Septimă de dominantă",
  "Moll 7": "Minor 7",
  "Maj 7": "Maj 7",
  "Quinte": "Cvintă",
  "Quarte": "Cvartă",
  "Halbton": "Semiton",
  "Leeren": "Golește",
  "Reine Stimmung (zum Grundton)": "Intonație naturală (față de tonică)",
  "Pedal verschiebt um": "Pedala mută cu",
  "rein gestimmt": "intonație naturală",
  "gleichstufig": "temperat egal",
  "Ganztonschritt": "Ton întreg",
  "Tonleitern über 4 Saiten": "Game pe 4 coarde",
  "Lagen": "Poziții",
  "Gruppen": "Grupuri",
  "Regionen": "Regiuni",
  "Grundton": "Tonica",
  "Tonleiter": "Gama",
  "Dur": "Major",
  "Moll natürlich": "Minor natural",
  "Moll harmonisch": "Minor armonic",
  "Moll melodisch": "Minor melodic",
  "Chromatisch": "Cromatic",
  "Ganzton": "Hexatonală (tonuri întregi)",
  "Grundton = Drone ({n})": "Tonica = bordun ({n})",
  "Lage": "Poziția",
  "Gruppe": "Grup",
  "{g}er": "{g} pe coardă",
  "Ab Stufe": "De la treapta",
  "Griffbrett": "Tastieră",
  "In dieser Lage passt die Folge nicht aufs Griffbrett.": "În această poziție, secvența nu încape pe tastieră.",
  "{up} Töne aufwärts, {down} abwärts · kleine Zahl = Finger, 0 = leere Saite": "{up} note în sus, {down} în jos · cifra mică = deget, 0 = coardă liberă",
  ", + = Daumen (blauer Rand)": ", + = degetul mare (contur albastru)",
  "{g} Töne pro Saite, {up} aufwärts und zurück": "{g} note pe coardă, {up} în sus și înapoi",
  " · grüner Ring = aktueller Drone-Ton": " · cerc verde = nota actuală a bordunului",
  "▶ Abspielen": "▶ Redă",
  "Leersaiten beim Saitenwechsel": "Coarde libere la schimbarea coardei",
  "Alle Stufen nacheinander": "Toate treptele la rând",
  "Eine Oktave höher (notiert)": "O octavă mai sus (cum se scrie)",
  "Saite": "Coarda",
  "{s}-Saite": "Coarda {s}",
  "Regionen der Saite": "Regiunile coardei",
  "Untere Lagen (Region 1–2)": "Poziții joase (regiunile 1–2)",
  "Obere Lagen (ab Region 3)": "Poziții înalte (de la regiunea 3)",
  "Sattel": "Prag",
  "→ Steg": "→ Căluș",
  "Daumen-Lagen (Region 3: 1–4, Region 4: 1–3)": "Poziții cu degetul mare (regiunea 3: 1–4, regiunea 4: 1–3)",
  "◇ = Flageolett (antippen zum Anhören) · ↓ = Naturseptime, klingt tiefer · Abstände zum Steg hin gedehnt": "◇ = flageolet (atinge pentru a asculta) · ↓ = septima naturală, sună mai jos · distanțele sunt mărite spre căluș",
  "Region": "Regiunea",
  "untere Lagen, ab der 2. Region schon mit Daumen möglich.": "poziții joase; din regiunea 2 se poate folosi deja degetul mare.",
  "obere Lagen, Daumen auf {list} (1.–4. Lage).": "poziții înalte, degetul mare pe {list} (pozițiile 1–4).",
  "Daumen auf {list} (1.–3. Lage).": "degetul mare pe {list} (pozițiile 1–3).",
  "Flageoletts {h}, dazu die Zwischentöne {s}.": "flageolete {h}, plus notele intermediare {s}.",
  "Flageoletts {h}.": "flageolete {h}.",
  "Drone-Sequenz": "Secvență de bordun",
  "Jetzt": "Acum",
  "keine Töne": "nicio notă",
  "Nächster": "Următorul",
  "Zurück": "Înapoi",
  "Weiter": "Înainte",
  "▶ Drone starten": "▶ Pornește bordunul",
  "Der Browser blockiert den Ton ({s}). Bitte Stopp und noch einmal „Drone starten“ tippen.": "Browserul blochează sunetul ({s}). Atinge Stop și apoi din nou „Pornește bordunul”.",
  "Tonfolge (z. B. „C G D A“, Akkorde mit Bindestrich: „C-E-G-B“, Oktave optional: „G1“)": "Succesiune de note (de ex. „Do Sol Re La”, acorduri cu cratimă: „Do-Mi-Sol-Si♭”, octava opțional: „Sol1”)",
  "Nicht erkannt: {e}": "Nerecunoscut: {e}",
  "Vorlage wählen…": "Alege un model…",
  "Gespeichert": "Salvate",
  "Folge speichern": "Salvează succesiunea",
  "Name für diese Folge:": "Numele acestei succesiuni:",
  "Klang": "Sunet",
  "Quinte (bei Einzeltönen)": "Cvintă (la note simple)",
  "Oktave dazu": "Adaugă octava",
  "Endlos": "În buclă",
  "Leertaste": "Spațiu",
  "Quintenzirkel": "Cercul cvintelor",
  "Quartenzirkel": "Cercul cvartelor",
  "Blues in F": "Blues în Fa",
  "Kadenz I–IV–V–I": "Cadența I–IV–V–I",
  "Akkorde I–IV–V–I": "Acorduri I–IV–V–I",
  "Septakkorde (Quartenzirkel)": "Acorduri de septimă (cercul cvartelor)",
  "Kontrabass": "Contrabas",
  "Klavier": "Pian",
  "Oboe": "Oboi",
  "Violine": "Vioară",
  "Sinus": "Sinus",
  "Kein Ton? Lautstärke am Gerät prüfen, am iPhone den Stummschalter aus. Laptop- und Handylautsprecher geben tiefe Töne kaum wieder: Oktave 3 oder 4 wählen oder Kopfhörer nutzen.": "Nu se aude? Verifică volumul dispozitivului și dezactivează modul silențios pe iPhone. Difuzoarele de laptop și telefon redau slab notele joase: alege octava 3 sau 4 sau folosește căști.",
  "Pedal: weiter = Pfeil rechts/unten, Bild ab, Leertaste, Enter · zurück = Pfeil links/oben, Bild auf.": "Pedală: înainte = săgeată dreapta/jos, Page Down, Spațiu, Enter · înapoi = săgeată stânga/sus, Page Up.",
  "Zuletzt empfangen:": "Ultima tastă primită:"
};
function t(de, vars) {
  const row = TR[de];
  let s = LANG === "de" ? de : LANG === "ro" ? RO[de] ?? de : row ? row[LANG === "en" ? 0 : 1] : de;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}

// ─── Notennamen ───
// Ein Ton ist { letter: 0–6 (C D E F G A H/B), acc: −2…+2 }.
const NATURAL = [0, 2, 4, 5, 7, 9, 11];
const DE_LETTERS = ["C", "D", "E", "F", "G", "A", "H"];
const EN_LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const FR_SYL = ["Do", "Ré", "Mi", "Fa", "Sol", "La", "Si"];
const RO_SYL = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
const pcOf = n => (NATURAL[n.letter] + n.acc + 24) % 12;
function renderIn(lang, {
  letter,
  acc
}) {
  if (lang === "de") {
    const L = DE_LETTERS[letter];
    if (acc === 0) return L;
    if (acc > 0) return L + "is".repeat(acc);
    if (L === "H") return acc === -1 ? "B" : "Heses";
    if (L === "E" || L === "A") return acc === -1 ? L + "s" : L + "ses";
    return L + "es".repeat(-acc);
  }
  const base = lang === "fr" ? FR_SYL[letter] : lang === "ro" ? RO_SYL[letter] : EN_LETTERS[letter];
  return base + (acc > 0 ? "♯".repeat(acc) : "♭".repeat(-acc));
}
const ACC = {
  "": 0,
  "#": 1,
  "##": 2,
  x: 2,
  b: -1,
  bb: -2
};
function parseIn(lang, raw) {
  const s = raw.trim().toLowerCase().replace(/♯/g, "#").replace(/♭/g, "b");
  let m;
  if (lang === "en") {
    m = s.match(/^([a-g])(##|#|x|bb|b)?(-?\d)?$/);
    if (!m) return null;
    return {
      letter: "cdefgab".indexOf(m[1]),
      acc: ACC[m[2] || ""],
      oct: m[3]
    };
  }
  if (lang === "fr" || lang === "ro") {
    m = s.match(/^(do|ut|ré|re|mi|fa|sol|la|si)(##|#|bb|b)?(-?\d)?$/);
    if (!m) return null;
    const syl = {
      do: 0,
      ut: 0,
      "ré": 1,
      re: 1,
      mi: 2,
      fa: 3,
      sol: 4,
      la: 5,
      si: 6
    }[m[1]];
    return {
      letter: syl,
      acc: ACC[m[2] || ""],
      oct: m[3]
    };
  }
  m = s.match(/^([a-h])(isis|eses|ses|is|es|s|##|#|bb|b)?(-?\d)?$/);
  if (!m) return null;
  const [, l, a = "", oct] = m;
  if (l === "b") return a ? null : {
    letter: 6,
    acc: -1,
    oct
  };
  if ((a === "s" || a === "ses") && l !== "a" && l !== "e") return null;
  const acc = {
    "": 0,
    is: 1,
    isis: 2,
    "#": 1,
    "##": 2,
    es: -1,
    s: -1,
    b: -1,
    eses: -2,
    ses: -2,
    bb: -2
  }[a];
  return {
    letter: "cdefgah".indexOf(l),
    acc,
    oct
  };
}

// Erst in der bevorzugten Sprache lesen, dann in den anderen (so geht auch „Fis“ im Englischen).
function parseNote(raw, prefer = LANG) {
  for (const l of [prefer, ...Object.keys(LANGS).filter(x => x !== prefer)]) {
    const n = parseIn(l, raw);
    if (n) return {
      ...n,
      oct: n.oct !== undefined ? Number(n.oct) : null
    };
  }
  return null;
}
const noteLabel = n => renderIn(LANG, n);

// Deutschen Notennamen (aus der Tonleiter-Logik) in der gewählten Sprache anzeigen
function nn(germanName) {
  if (LANG === "de") return germanName;
  const n = parseIn("de", germanName);
  return n ? renderIn(LANG, n) : germanName;
}

// Tonfolge (Text) aus einer Sprache in die gewählte übertragen, z. B. Vorlagen und gespeicherte Folgen
function convertSeq(text, from) {
  if (from === LANG) return text;
  return text.split(/([\s,;|]+)/).map((tok, i) => i % 2 ? tok : tok.split(/([+\-])(?=[a-zA-ZÀ-ÿ])/).map((p, j) => {
    if (j % 2) return p;
    const n = parseNote(p, from);
    return n ? renderIn(LANG, n) + (n.oct != null ? n.oct : "") : p;
  }).join("")).join("");
}
try {
  document.documentElement.lang = LANG;
  document.title = t("Tonleitern & Drone");
} catch {/* ohne Dokument */}

// Gemeinsame Audio-Hilfen

// iPhone/iPad: Web Audio ist bei Stummschalter stumm. Ein stilles, laufendes
// <audio>-Element schaltet die Audio-Sitzung auf "Wiedergabe" um.
const SILENT_WAV = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";
let unlockAudio = null;
function unlockIOSAudio() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = "playback";
  } catch {/* nicht unterstützt */}
  try {
    if (!unlockAudio) {
      unlockAudio = new Audio(SILENT_WAV);
      unlockAudio.loop = true;
      unlockAudio.setAttribute("playsinline", "");
    }
    unlockAudio.play().catch(() => {});
  } catch {/* optional */}
}

// ─── Metronom mit vier synthetisierten Klängen ───
// Genaues Timing über Vorausplanung im Audio-Takt (nicht über setInterval allein).
// Zählstimme (eins, zwei, …) in der gewählten Sprache, Taktwechsel wie „5/8 3/4“.

const METRO_SOUNDS = ["Mechanisch", "Hoch", "Dirigentenstock", "Klatschen"];
const SUBDIVISIONS = [{
  label: "♩",
  n: 1
}, {
  label: "♪♪",
  n: 2
}, {
  label: t("Triole"),
  n: 3
}, {
  label: "♬♬",
  n: 4
}];
let noiseBuf = null;
function noise(ctx) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
function env(ctx, out, t, peak, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  g.connect(out);
  return g;
}
function noiseHit(ctx, out, t, {
  freq,
  q,
  peak,
  decay,
  type = "bandpass"
}) {
  const src = ctx.createBufferSource();
  src.buffer = noise(ctx);
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  src.connect(f).connect(env(ctx, out, t, peak, decay));
  src.start(t, Math.random() * 0.5);
  src.stop(t + decay + 0.02);
}
function tone(ctx, out, t, {
  freq,
  type = "sine",
  peak,
  decay
}) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.connect(env(ctx, out, t, peak, decay));
  o.start(t);
  o.stop(t + decay + 0.02);
}

// level: 2 = Takt-Eins, 1 = Zählzeit, 0 = Unterteilung
function playClick(ctx, out, t, sound, level) {
  const v = level === 2 ? 1 : level === 1 ? 0.75 : 0.35;
  switch (sound) {
    case "Mechanisch":
      // Holzklacken des Pendelmetronoms, auf der Eins die Glocke
      noiseHit(ctx, out, t, {
        freq: 2600,
        q: 6,
        peak: 1.4 * v,
        decay: 0.03
      });
      tone(ctx, out, t, {
        freq: 1700,
        type: "triangle",
        peak: 0.35 * v,
        decay: 0.012
      });
      if (level === 2) {
        tone(ctx, out, t, {
          freq: 2637,
          peak: 0.25,
          decay: 0.6
        });
        tone(ctx, out, t, {
          freq: 3951,
          peak: 0.1,
          decay: 0.35
        });
      }
      break;
    case "Hoch":
      tone(ctx, out, t, {
        freq: level === 2 ? 3520 : level === 1 ? 2794 : 2093,
        peak: 0.45 * v,
        decay: 0.05
      });
      break;
    case "Dirigentenstock":
      // Taktstock aufs Pult: harter, trockener Schlag
      noiseHit(ctx, out, t, {
        freq: 4200,
        q: 2.5,
        peak: 1.2 * v,
        decay: 0.012
      });
      tone(ctx, out, t, {
        freq: level === 2 ? 620 : 820,
        type: "triangle",
        peak: 0.6 * v,
        decay: 0.035
      });
      break;
    case "Klatschen":
      // mehrere kurze Rauschstöße wie bei echtem Händeklatschen
      [0, 0.009, 0.019].forEach(dt => noiseHit(ctx, out, t + dt, {
        freq: 1150,
        q: 1.4,
        peak: 1.1 * v,
        decay: 0.012
      }));
      noiseHit(ctx, out, t + 0.026, {
        freq: 1100,
        q: 1.2,
        peak: 0.9 * v,
        decay: 0.09
      });
      break;
    default:
  }
}

// ─── Zählstimme: kurze Aufnahmen 1–12 und „und“ pro Sprache (Ordner voice/) ───
// Dazu eigene Aufnahmen (wie bei Navi-Apps), gespeichert im Browser (IndexedDB).
const VOICE_WORDS = [...Array.from({
  length: 12
}, (_, i) => String(i + 1)), "and"];
const voiceCache = {};
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("tonleitern", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("voice");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function idbDo(mode, fn) {
  const db = await idb();
  return new Promise((res, rej) => {
    const tx = db.transaction("voice", mode);
    const req = fn(tx.objectStore("voice"));
    tx.oncomplete = () => res(req?.result);
    tx.onerror = () => rej(tx.error);
  });
}
const ownGetAll = async () => {
  try {
    const out = {};
    await Promise.all(VOICE_WORDS.map(async w => {
      const b = await idbDo("readonly", st => st.get(w));
      if (b) out[w] = b;
    }));
    return out;
  } catch {
    return {};
  }
};
const ownPut = (w, blob) => idbDo("readwrite", st => st.put(blob, w));
const ownDel = w => idbDo("readwrite", st => st.delete(w));
const decode = (ctx, ab) => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej));

// Stille vorn und hinten abschneiden, damit das Wort genau auf dem Schlag beginnt
function trimBuffer(ctx, buf) {
  const x = buf.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i]));
  if (!peak) return buf;
  const thr = peak * 0.08;
  let a = 0;
  while (a < x.length && Math.abs(x[a]) < thr) a++;
  let b = x.length - 1;
  while (b > a && Math.abs(x[b]) < thr) b--;
  a = Math.max(0, a - Math.floor(buf.sampleRate * 0.008));
  b = Math.min(x.length, b + Math.floor(buf.sampleRate * 0.06));
  const out = ctx.createBuffer(1, b - a, buf.sampleRate);
  const y = out.getChannelData(0);
  const gain = 0.9 / peak;
  for (let i = 0; i < y.length; i++) y[i] = x[a + i] * gain;
  return out;
}
function loadVoice(ctx, own) {
  const key = LANG + (own ? ":own" : "");
  if (!voiceCache[key]) {
    voiceCache[key] = (async () => {
      const std = Object.fromEntries(await Promise.all(VOICE_WORDS.map(n => fetch(`voice/${LANG}/${n}.wav`).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => decode(ctx, b)).then(buf => [n, buf]).catch(() => [n, null]))));
      if (!own) return std;
      const blobs = await ownGetAll();
      await Promise.all(Object.entries(blobs).map(async ([w, blob]) => {
        try {
          std[w] = trimBuffer(ctx, await decode(ctx, await blob.arrayBuffer()));
        } catch {/* Aufnahme unlesbar: Standardstimme */}
      }));
      return std;
    })();
  }
  return voiceCache[key];
}

// Eigene Zählstimme aufnehmen: alle Wörter nacheinander oder einzeln
function EigeneStimme({
  onChange
}) {
  const [have, setHave] = useState({});
  const [busy, setBusy] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [err, setErr] = useState("");
  const stopRef = useRef(false);
  const refresh = () => ownGetAll().then(setHave);
  useEffect(() => {
    refresh();
  }, []);
  const label = w => w === "and" ? t("und") : w;
  const recordOne = (stream, ms) => new Promise(res => {
    const mr = new MediaRecorder(stream);
    const chunks = [];
    mr.ondataavailable = e => e.data.size && chunks.push(e.data);
    mr.onstop = () => res(new Blob(chunks, {
      type: mr.mimeType || "audio/webm"
    }));
    mr.start();
    setTimeout(() => mr.state === "recording" && mr.stop(), ms);
  });
  const run = async words => {
    setErr("");
    stopRef.current = false;
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });
    } catch (e) {
      setErr(t("Kein Zugriff aufs Mikrofon. Bitte in den Browser-Einstellungen für diese Seite erlauben und neu laden."));
      return;
    }
    try {
      for (const w of words) {
        if (stopRef.current) break;
        setBusy(w);
        setPrompt(label(w));
        await new Promise(r => setTimeout(r, 450));
        const blob = await recordOne(stream, 1300);
        await ownPut(w, blob);
      }
    } finally {
      stream.getTracks().forEach(x => x.stop());
      setBusy(null);
      setPrompt("");
      delete voiceCache[LANG + ":own"];
      refresh();
      onChange?.();
    }
  };
  const play = async w => {
    await Tone.start();
    const ctx = Tone.getContext().rawContext;
    const blob = have[w];
    if (!blob) return;
    const src = ctx.createBufferSource();
    src.buffer = trimBuffer(ctx, await decode(ctx, await blob.arrayBuffer()));
    src.connect(ctx.destination);
    src.start();
  };
  const remove = async w => {
    await ownDel(w);
    delete voiceCache[LANG + ":own"];
    refresh();
    onChange?.();
  };
  return /*#__PURE__*/React.createElement("details", {
    className: "mt-own"
  }, /*#__PURE__*/React.createElement("summary", null, t("Eigene Stimme aufnehmen")), /*#__PURE__*/React.createElement("p", {
    className: "ds-hint"
  }, t("Tippe auf „Alle aufnehmen“ und sprich jedes Wort, sobald es groß erscheint. Fehlende Wörter spricht die Standardstimme.")), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, busy ? /*#__PURE__*/React.createElement("button", {
    className: "ds-btn-sm rec",
    onClick: () => stopRef.current = true
  }, "\u25A0 ", t("Aufnahme beenden")) : /*#__PURE__*/React.createElement("button", {
    className: "ds-btn-sm",
    onClick: () => run(VOICE_WORDS)
  }, "\u25CF ", t("Alle aufnehmen")), prompt && /*#__PURE__*/React.createElement("span", {
    className: "mt-prompt"
  }, prompt)), /*#__PURE__*/React.createElement("div", {
    className: "mt-words"
  }, VOICE_WORDS.map(w => /*#__PURE__*/React.createElement("div", {
    key: w,
    className: `mt-word ${have[w] ? "has" : ""} ${busy === w ? "rec" : ""}`
  }, /*#__PURE__*/React.createElement("b", null, label(w)), /*#__PURE__*/React.createElement("button", {
    className: "ds-chip",
    disabled: !!busy,
    onClick: () => run([w]),
    "aria-label": t("Aufnehmen")
  }, "\u25CF"), have[w] && /*#__PURE__*/React.createElement("button", {
    className: "ds-chip",
    onClick: () => play(w),
    "aria-label": t("Anhören")
  }, "\u25B6"), have[w] && /*#__PURE__*/React.createElement("button", {
    className: "ds-chip",
    disabled: !!busy,
    onClick: () => remove(w),
    "aria-label": t("Löschen")
  }, "\u2715")))), err && /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, err));
}

// ─── Taktwechsel ───
// „5/8 3/4“, „4/4 + 6/8“, Gruppen in Klammern: „7/8(2+2+3)“. Tempo gilt für die Viertel.
const DEFAULT_GROUPS = {
  4: [2, 2],
  5: [3, 2],
  6: [3, 3],
  7: [2, 2, 3],
  8: [3, 3, 2],
  9: [3, 3, 3],
  10: [3, 3, 2, 2],
  11: [3, 3, 3, 2],
  12: [3, 3, 3, 3]
};
const METER_PRESETS = ["5/8 3/4", "4/4 6/8", "5/8 2/4", "3/8 2/4", "3/4 2/4", "7/8(2+2+3)"];
// Bausteine zum Zusammenstellen beliebiger Folgen
const METER_BLOCKS = ["2/4", "3/4", "4/4", "5/4", "2/8", "3/8", "5/8", "6/8", "7/8", "9/8", "12/8"];
function parseMeters(text) {
  const bars = [];
  const bad = [];
  text.split(/[\s,;|]+|\+(?=\d+\/)/).filter(x => x && x !== "+").forEach(tok => {
    const m = tok.match(/^(\d{1,2})\/(2|4|8|16)(?:\((\d+(?:\+\d+)*)\))?$/);
    if (!m || Number(m[1]) < 1) return bad.push(tok);
    const num = Number(m[1]);
    const den = Number(m[2]);
    let groups = m[3] ? m[3].split("+").map(Number) : null;
    if (groups && groups.reduce((a, b) => a + b, 0) !== num) groups = null;
    if (!groups && den >= 8) groups = DEFAULT_GROUPS[num] || [num];
    bars.push({
      num,
      den,
      groups,
      label: tok
    });
  });
  return {
    bars,
    bad
  };
}

// Schläge eines Takts: Dauer, Betonung (2 Eins, 1 Zählzeit/Gruppe, 0 leise), gesprochenes Wort, Punkt
function barPlan(bar, s) {
  const q = 60 / s.bpm;
  const out = [];
  const many = s.meters.length > 1;
  if (bar.den <= 4) {
    const beatDur = q * (4 / bar.den);
    for (let b = 0; b < bar.num; b++) {
      for (let k = 0; k < s.sub; k++) {
        const level = k ? 0 : b === 0 && s.accent && (bar.num > 1 || many) ? 2 : 1;
        const word = k === 0 ? String(b + 1) : s.sub === 2 ? "and" : null;
        out.push({
          dur: beatDur / s.sub,
          level,
          word,
          dot: k === 0 ? b : null
        });
      }
    }
  } else {
    const starts = new Set();
    bar.groups.reduce((acc, g) => (starts.add(acc), acc + g), 0);
    const d = q * (4 / bar.den);
    for (let k = 0; k < bar.num; k++) {
      const level = k === 0 ? s.accent ? 2 : 1 : starts.has(k) ? 1 : 0;
      out.push({
        dur: d,
        level,
        word: String(k + 1),
        dot: k
      });
    }
  }
  return out;
}
function dotsFor(bar, accent, many) {
  if (bar.den <= 4) return Array.from({
    length: bar.num
  }, (_, i) => i === 0 && accent && (bar.num > 1 || many) ? "one" : "");
  const starts = new Set();
  bar.groups.reduce((acc, g) => (starts.add(acc), acc + g), 0);
  return Array.from({
    length: bar.num
  }, (_, i) => i === 0 && accent ? "one" : starts.has(i) ? "grp" : "small");
}
function Metronom() {
  const [bpm, setBpm] = useState(80);
  const [beats, setBeats] = useState(4);
  const [sub, setSub] = useState(1);
  const [sound, setSound] = useState("Mechanisch");
  const [accent, setAccent] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [voice, setVoice] = useState("off");
  const [ownVoice, setOwnVoice] = useState(false);
  const [meterText, setMeterText] = useState("");
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [barNo, setBarNo] = useState(0);
  const tapsRef = useRef([]);
  const stateRef = useRef({});
  const engineRef = useRef(null);
  const parsed = parseMeters(meterText);
  const meters = meterText.trim() && parsed.bars.length ? parsed.bars : [{
    num: beats,
    den: 4,
    groups: null,
    label: `${beats}/4`
  }];
  stateRef.current = {
    bpm,
    sub,
    sound,
    accent,
    volume,
    voice,
    meters
  };
  const ownRef = useRef(ownVoice);
  ownRef.current = ownVoice;
  const stop = () => {
    const e = engineRef.current;
    if (e) {
      clearInterval(e.timer);
      e.timeouts.forEach(clearTimeout);
      e.out.gain.setTargetAtTime(0, e.ctx.currentTime, 0.01);
      setTimeout(() => e.out.disconnect(), 200);
    }
    engineRef.current = null;
    setRunning(false);
    setBeat(-1);
    setBarNo(0);
  };
  const playWord = (e, word, time, level) => {
    const buf = e.voice && e.voice[word];
    if (!buf) return;
    if (e.lastVoice) {
      try {
        e.lastVoice.stop(time);
      } catch {/* schon beendet */}
    }
    const src = e.ctx.createBufferSource();
    src.buffer = buf;
    const g = e.ctx.createGain();
    g.gain.value = level === 2 ? 1.1 : level === 1 ? 0.9 : 0.7;
    src.connect(g).connect(e.out);
    src.start(time);
    e.lastVoice = src;
  };
  const start = async () => {
    // iPhone: ohne das spielt Web Audio bei Stummschalter nicht (das Mikrofon schaltet es sonst frei)
    unlockIOSAudio();
    await Tone.start();
    const ctx = Tone.getContext().rawContext;
    const out = ctx.createGain();
    out.gain.value = stateRef.current.volume;
    out.connect(ctx.destination);
    const e = {
      ctx,
      out,
      next: 0,
      bar: 0,
      tick: 0,
      plan: null,
      timeouts: [],
      voice: null
    };
    e.voice = await loadVoice(ctx, ownRef.current);
    e.next = ctx.currentTime + 0.1;
    e.timer = setInterval(() => {
      const s = stateRef.current;
      out.gain.setTargetAtTime(s.volume, ctx.currentTime, 0.02);
      while (e.next < ctx.currentTime + 0.12) {
        if (!e.plan || e.tick >= e.plan.length) {
          if (e.plan) e.bar = (e.bar + 1) % s.meters.length;
          if (e.bar >= s.meters.length) e.bar = 0;
          e.plan = barPlan(s.meters[e.bar], s);
          e.tick = 0;
        }
        const tk = e.plan[e.tick];
        if (s.voice !== "only") playClick(ctx, out, e.next, s.sound, tk.level);
        if (s.voice !== "off" && tk.word) playWord(e, tk.word, e.next, tk.level);
        if (tk.dot != null) {
          const delay = Math.max(0, (e.next - ctx.currentTime) * 1000);
          const b = e.bar;
          const id = setTimeout(() => {
            setBeat(tk.dot);
            setBarNo(b);
          }, delay);
          e.timeouts.push(id);
          if (e.timeouts.length > 32) e.timeouts.shift();
        }
        e.next += tk.dur;
        e.tick++;
      }
    }, 25);
    engineRef.current = e;
    setRunning(true);
    document.activeElement?.blur?.();
  };
  useEffect(() => () => engineRef.current && stop(), []);
  const reloadVoice = () => {
    const e = engineRef.current;
    if (e) loadVoice(e.ctx, ownRef.current).then(v => e.voice = v);
  };
  useEffect(reloadVoice, [ownVoice]);

  // Takt-, Unterteilungs- oder Taktwechsel-Änderung: am Anfang neu einsetzen
  const meterKey = meters.map(m => m.label).join(" ");
  useEffect(() => {
    const e = engineRef.current;
    if (e) {
      e.bar = 0;
      e.plan = null;
    }
  }, [beats, sub, meterKey]);
  const tap = () => {
    const now = performance.now();
    const taps = tapsRef.current.filter(x => now - x < 2500);
    taps.push(now);
    tapsRef.current = taps;
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((x, i) => x - taps[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.max(30, Math.min(240, Math.round(60000 / avg))));
    }
  };
  const preview = async name => {
    setSound(name);
    if (engineRef.current) return;
    unlockIOSAudio();
    await Tone.start();
    const ctx = Tone.getContext().rawContext;
    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(ctx.destination);
    playClick(ctx, out, ctx.currentTime + 0.02, name, 2);
    playClick(ctx, out, ctx.currentTime + 0.42, name, 1);
    setTimeout(() => out.disconnect(), 1500);
  };
  const curBar = meters[Math.min(barNo, meters.length - 1)];
  const dots = dotsFor(curBar, accent, meters.length > 1);
  return /*#__PURE__*/React.createElement("div", {
    className: "mt"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "ds-sub"
  }, t("Metronom")), /*#__PURE__*/React.createElement("div", {
    className: "mt-sounds"
  }, METRO_SOUNDS.map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: `ds-chip ${s === sound ? "active" : ""}`,
    onClick: () => preview(s)
  }, t(s)))), /*#__PURE__*/React.createElement("div", {
    className: "mt-main"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: () => setBpm(b => Math.max(30, b - 1)),
    "aria-label": t("Langsamer")
  }, "\u2212"), /*#__PURE__*/React.createElement("div", {
    className: "mt-bpm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mt-num"
  }, bpm), /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Schläge pro Minute"))), /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: () => setBpm(b => Math.min(240, b + 1)),
    "aria-label": t("Schneller")
  }, "+")), /*#__PURE__*/React.createElement("input", {
    className: "mt-slider",
    type: "range",
    min: 30,
    max: 240,
    value: bpm,
    onChange: e => setBpm(Number(e.target.value)),
    "aria-label": t("Tempo")
  }), meters.length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "mt-bars",
    "aria-hidden": "true"
  }, meters.map((m, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `mt-bar ${running && i === barNo ? "on" : ""}`
  }, m.label))), /*#__PURE__*/React.createElement("div", {
    className: "mt-dots",
    "aria-hidden": "true"
  }, dots.map((cls, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `mt-dot ${cls} ${running && i === beat ? "on" : ""}`
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ds-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: `ds-btn ds-main ${running ? "on" : ""}`,
    onClick: running ? stop : start
  }, running ? t("■ Metronom stoppen") : t("▶ Metronom starten")), /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: tap
  }, "Tap")), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("label", null, t("Zählstimme"), " ", /*#__PURE__*/React.createElement("select", {
    value: voice,
    onChange: e => setVoice(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "off"
  }, t("aus")), /*#__PURE__*/React.createElement("option", {
    value: "click"
  }, t("Stimme + Klang")), /*#__PURE__*/React.createElement("option", {
    value: "only"
  }, t("nur Stimme")))), voice !== "off" && /*#__PURE__*/React.createElement("label", null, t("Stimme"), " ", /*#__PURE__*/React.createElement("select", {
    value: ownVoice ? "own" : "std",
    onChange: e => setOwnVoice(e.target.value === "own")
  }, /*#__PURE__*/React.createElement("option", {
    value: "std"
  }, t("Standard")), /*#__PURE__*/React.createElement("option", {
    value: "own"
  }, t("Eigene")))), /*#__PURE__*/React.createElement("label", null, t("Takt"), " ", /*#__PURE__*/React.createElement("select", {
    value: beats,
    onChange: e => setBeats(Number(e.target.value)),
    disabled: !!meterText.trim() && parsed.bars.length > 0
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 12].map(b => /*#__PURE__*/React.createElement("option", {
    key: b,
    value: b
  }, b === 1 ? t("ohne") : t("{b}er", {
    b
  }))))), /*#__PURE__*/React.createElement("label", null, t("Unterteilung"), " ", /*#__PURE__*/React.createElement("select", {
    value: sub,
    onChange: e => setSub(Number(e.target.value))
  }, SUBDIVISIONS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.n,
    value: s.n
  }, s.label)))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: accent,
    onChange: e => setAccent(e.target.checked)
  }), " ", t("Betonte Eins")), /*#__PURE__*/React.createElement("label", null, t("Lautstärke"), " ", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: 1,
    step: 0.05,
    value: volume,
    onChange: e => setVolume(Number(e.target.value))
  }))), voice !== "off" && ownVoice && /*#__PURE__*/React.createElement(EigeneStimme, {
    onChange: reloadVoice
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-meter"
  }, /*#__PURE__*/React.createElement("label", {
    className: "ds-field"
  }, /*#__PURE__*/React.createElement("span", null, t("Taktwechsel (z. B. „5/8 3/4“ oder „7/8(2+2+3)“), leer = normaler Takt")), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: meterText,
    onChange: e => setMeterText(e.target.value),
    placeholder: "5/8 3/4"
  })), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, METER_PRESETS.map(p => /*#__PURE__*/React.createElement("button", {
    key: p,
    className: `ds-chip ${meterText.trim() === p ? "active" : ""}`,
    onClick: () => setMeterText(p)
  }, p.replace(" ", " + "))), meterText && /*#__PURE__*/React.createElement("button", {
    className: "ds-chip",
    onClick: () => setMeterText("")
  }, t("aus"))), /*#__PURE__*/React.createElement("div", {
    className: "mt-blocks"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Takt anhängen")), METER_BLOCKS.map(m => /*#__PURE__*/React.createElement("button", {
    key: m,
    className: "ds-chip",
    onClick: () => setMeterText(x => (x.trim() ? x.trim() + " " : "") + m)
  }, "+ ", m)), meterText.trim() && /*#__PURE__*/React.createElement("button", {
    className: "ds-chip",
    onClick: () => setMeterText(x => x.trim().split(/\s+/).slice(0, -1).join(" ")),
    "aria-label": t("Letzten Takt entfernen")
  }, "\u232B")), parsed.bad.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, t("Nicht erkannt: {e}", {
    e: parsed.bad.join(", ")
  })), /*#__PURE__*/React.createElement("p", {
    className: "ds-hint"
  }, t("Das Tempo gilt für die Viertelnote. In Achteltakten zählt jede Achtel, der Anfang jeder Gruppe ist betont (5/8 = 3+2)."))));
}

// ─── Stimmgerät mit Intonations-Aufnahme ───
// Hört übers Mikrofon zu, zeigt Ton und Abweichung (zu tief / sauber / zu hoch)
// mit Verlaufskurve. Während einer Aufnahme wird jeder gehaltene Ton ausgewertet,
// am Ende gibt es eine Zusammenfassung und die Aufnahme zum Anhören.

// Frequenz zum gewählten Kammerton A (a¹ = MIDI 69)
function midiToFreq(midi, a4) {
  return a4 * Math.pow(2, (midi - 69) / 12);
}
const NOTE_NAMES = ["C", "Cis", "D", "Es", "E", "F", "Fis", "G", "As", "A", "B", "H"].map(nn);
const A4_CHOICES = Array.from({
  length: 26
}, (_, i) => 420 + i);
const A4_QUICK = [435, 440, 442, 443];
const TOLERANCES = [5, 10, 15, 20];
const TRACE_LEN = 120; // ~5 Sekunden Verlauf

// Empfindlichkeit: Mindestlautstärke (RMS), ab der ein Ton erkannt wird
const SENSITIVITY = {
  normal: 0.006,
  hoch: 0.002,
  "sehr hoch": 0.0007
};
const rmsOf = buf => {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
};

// Tonhöhenerkennung (YIN) vom tiefen E des Kontrabasses (41 Hz) bis in die Flageolett-Lagen (~1500 Hz).
// Bei 44,1/48 kHz wird erst auf die halbe Abtastrate gemittelt: viermal weniger Rechenarbeit,
// damit auch schnelle Töne in kurzen Abständen gemessen werden können.
function detectPitch(input, srIn, minRms = 0.006) {
  if (rmsOf(input) < minRms) return null;
  let buf = input;
  let sr = srIn;
  if (srIn > 32000) {
    buf = new Float32Array(input.length >> 1);
    for (let i = 0; i < buf.length; i++) buf[i] = (input[2 * i] + input[2 * i + 1]) / 2;
    sr = srIn / 2;
  }
  const minTau = Math.max(2, Math.floor(sr / 1500));
  const maxTau = Math.min(Math.floor(sr / 38), Math.floor(buf.length / 2));
  const W = buf.length - maxTau;
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < W; i++) {
      const diff = buf[i] - buf[i + tau];
      sum += diff * diff;
    }
    d[tau] = sum;
  }
  let running = 0;
  let tau = -1;
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  for (let t = 1; t <= maxTau; t++) {
    running += d[t];
    cmnd[t] = running ? d[t] * t / running : 1;
  }
  for (let t = minTau; t <= maxTau; t++) {
    if (cmnd[t] < 0.2) {
      while (t + 1 <= maxTau && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  // leise oder obertonreiche Töne: deutlichstes Minimum nehmen, wenn es klar genug ist
  if (tau < 0) {
    let best = minTau;
    for (let t = minTau; t <= maxTau; t++) if (cmnd[t] < cmnd[best]) best = t;
    if (cmnd[best] < 0.35) tau = best;
  }
  if (tau < 0) return null;
  const x0 = cmnd[tau - 1] ?? cmnd[tau];
  const x2 = cmnd[tau + 1] ?? cmnd[tau];
  const denom = x0 + x2 - 2 * cmnd[tau];
  const better = denom ? tau + (x0 - x2) / (2 * denom) : tau;
  return sr / better;
}

// Läuft die Seite eingebettet (z. B. als Vorschau in claude.ai), darf sie das Mikrofon oft
// gar nicht benutzen, auch wenn der Browser es erlaubt hat.
function inFrame() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
function micErrorText(e) {
  const name = e?.name || t("Fehler");
  if (!navigator.mediaDevices?.getUserMedia) return t("Dieser Browser gibt hier kein Mikrofon frei (Seite muss über https geöffnet sein).");
  if (inFrame() && (name === "NotAllowedError" || name === "SecurityError")) return t("In diesem Vorschaufenster blockiert die umgebende Seite das Mikrofon, auch wenn der Browser es erlaubt hat. In der installierten App bzw. auf der eigenen Internetadresse funktioniert das Stimmgerät. Der Stimmton geht hier trotzdem.");
  if (name === "NotAllowedError") return t("Kein Zugriff aufs Mikrofon. Bitte in den Browser-Einstellungen für diese Seite erlauben und neu laden.");
  if (name === "NotFoundError") return t("Kein Mikrofon gefunden.");
  if (name === "NotReadableError") return t("Das Mikrofon wird gerade von einer anderen App benutzt.");
  return t("Mikrofon nicht verfügbar ({name}). Der Stimmton funktioniert trotzdem.", {
    name
  });
}
const median = arr => {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
function verdict(cents, tol) {
  if (cents < -tol) return "tief";
  if (cents > tol) return "hoch";
  return "ok";
}
const VERDICT_TEXT = {
  tief: t("zu tief"),
  ok: t("sauber"),
  hoch: t("zu hoch")
};

// Zusammenfassung der aufgenommenen Töne
function summarize(events, tol) {
  const total = events.length;
  const count = {
    tief: 0,
    ok: 0,
    hoch: 0
  };
  const perNote = {};
  events.forEach(e => {
    const v = verdict(e.cents, tol);
    count[v]++;
    const key = e.name + e.octave;
    const p = perNote[key] ||= {
      name: e.name,
      octave: e.octave,
      midi: e.midi,
      n: 0,
      sum: 0,
      tief: 0,
      ok: 0,
      hoch: 0
    };
    p.n++;
    p.sum += e.cents;
    p[v]++;
  });
  const rows = Object.values(perNote).map(p => ({
    ...p,
    avg: Math.round(p.sum / p.n)
  })).sort((a, b) => a.midi - b.midi);
  const avgAbs = total ? Math.round(events.reduce((s, e) => s + Math.abs(e.cents), 0) / total) : 0;
  return {
    total,
    count,
    rows,
    avgAbs
  };
}
function Gauge({
  cents,
  active,
  tol,
  v
}) {
  // Halbkreis von −50 bis +50 Cent mit Strichskala. Der Zeiger ist immer da (in Ruhe auf 0);
  // der Bereich, in dem er steht, leuchtet: grün = sauber, blau = zu tief, rot = zu hoch.
  const R = 120;
  const cx = 150;
  const cy = 145;
  const MAX = Math.PI / 2.2;
  const ang = c => Math.max(-50, Math.min(50, c)) / 50 * MAX;
  const pt = (c, r = R) => [cx + r * Math.sin(ang(c)), cy - r * Math.cos(ang(c))];
  const arc = (c1, c2, r = R) => {
    const [x1, y1] = pt(c1, r);
    const [x2, y2] = pt(c2, r);
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`;
  };
  const zone = (name, c1, c2, color) => {
    const lit = active && v === name;
    return /*#__PURE__*/React.createElement("path", {
      d: arc(c1, c2),
      stroke: color,
      strokeWidth: lit ? 16 : 12,
      fill: "none",
      opacity: lit ? 1 : 0.32,
      style: lit ? {
        filter: `drop-shadow(0 0 6px ${color})`
      } : undefined
    });
  };
  const ticks = [];
  for (let c = -50; c <= 50; c += 5) {
    const big = c % 25 === 0;
    const mid = c % 10 === 0;
    const [x1, y1] = pt(c, R - 12);
    const [x2, y2] = pt(c, R - (big ? 30 : mid ? 24 : 19));
    ticks.push( /*#__PURE__*/React.createElement("line", {
      key: c,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      stroke: "var(--muted)",
      strokeWidth: big ? 2 : 1
    }));
  }
  const color = !active ? "var(--muted)" : v === "ok" ? "var(--ok)" : v === "tief" ? "var(--tu-low)" : "var(--tu-high)";
  const deg = active ? ang(cents) * 180 / Math.PI : 0;
  return /*#__PURE__*/React.createElement("svg", {
    className: "tu-gauge",
    viewBox: "0 0 300 160",
    "aria-hidden": "true"
  }, zone("tief", -50, -tol, "var(--tu-low)"), zone("ok", -tol, tol, "var(--ok)"), zone("hoch", tol, 50, "var(--tu-high)"), ticks, [-50, -25, 0, 25, 50].map(c => {
    const [x, y] = pt(c, R + 16);
    return /*#__PURE__*/React.createElement("text", {
      key: c,
      x: x,
      y: y + 4,
      textAnchor: "middle",
      fontSize: "11",
      fill: "var(--muted)"
    }, c > 0 ? `+${c}` : c);
  }), /*#__PURE__*/React.createElement("g", {
    style: {
      transform: `rotate(${deg}deg)`,
      transformOrigin: `${cx}px ${cy}px`,
      transition: "transform .12s ease-out"
    }
  }, /*#__PURE__*/React.createElement("line", {
    x1: cx,
    y1: cy,
    x2: cx,
    y2: cy - R + 6,
    stroke: color,
    strokeWidth: "3.5",
    strokeLinecap: "round",
    style: active ? {
      filter: `drop-shadow(0 0 4px ${color})`
    } : undefined
  })), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: "7",
    fill: color
  }));
}
function Trace({
  trace,
  tol
}) {
  const W = 300;
  const H = 70;
  const y = c => H / 2 - Math.max(-50, Math.min(50, c)) / 50 * (H / 2 - 4);
  const pts = trace.map((c, i) => c == null ? null : `${i / (TRACE_LEN - 1) * W},${y(c)}`).filter(Boolean);
  return /*#__PURE__*/React.createElement("svg", {
    className: "tu-trace",
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: y(tol),
    width: W,
    height: y(-tol) - y(tol),
    fill: "var(--ok)",
    opacity: "0.15"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "0",
    x2: W,
    y1: H / 2,
    y2: H / 2,
    stroke: "var(--line)"
  }), pts.length > 1 && /*#__PURE__*/React.createElement("polyline", {
    points: pts.join(" "),
    fill: "none",
    stroke: "var(--wood)",
    strokeWidth: "2"
  }));
}
function Stimmgeraet({
  a4,
  setA4,
  onRefTone,
  refMidi
}) {
  const [refOctave, setRefOctave] = useState(3);
  const [hold, setHold] = useState(true);
  const [on, setOn] = useState(false);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(null);
  const [trace, setTrace] = useState([]);
  const [tol, setTol] = useState(10);
  const [sens, setSens] = useState("hoch");
  const sensRef = useRef(sens);
  sensRef.current = sens;
  const [recording, setRecording] = useState(false);
  const [events, setEvents] = useState([]);
  const [result, setResult] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const ref = useRef(null);
  const a4Ref = useRef(a4);
  a4Ref.current = a4;
  const recRef = useRef({
    active: false,
    events: [],
    cur: null
  });

  // Aktuellen Ton abschließen: zwei gültige Messungen (~0,1 s) zählen schon als gespielter Ton
  const closeEvent = () => {
    const r = recRef.current;
    const c = r.cur;
    r.cur = null;
    if (!r.active || !c || c.cents.length < 2) return;
    const ev = {
      midi: c.midi,
      name: NOTE_NAMES[(c.midi % 12 + 12) % 12],
      octave: Math.floor(c.midi / 12) - 1,
      cents: Math.round(median(c.cents))
    };
    r.events.push(ev);
    setEvents([...r.events]);
  };
  const stopMic = () => {
    const r = ref.current;
    if (r) {
      clearInterval(r.timer);
      r.stream.getTracks().forEach(t => t.stop());
      r.ctx.close();
    }
    ref.current = null;
    setOn(false);
    setReading(null);
    setTrace([]);
  };
  const startMic = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      src.connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const history = [];
      let quiet = 0;
      let lastRms = 0;
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        const level = rmsOf(buf);
        const f = detectPitch(buf, ctx.sampleRate, SENSITIVITY[sensRef.current]);
        const r = recRef.current;
        if (!f) {
          // eine einzelne Fehlmessung beendet den Ton noch nicht
          if (++quiet >= 2) {
            history.length = 0;
            setReading(null);
            closeEvent();
          }
          setTrace(t => [...t, null].slice(-TRACE_LEN));
          lastRms = level;
          return;
        }
        quiet = 0;
        const rawExact = 69 + 12 * Math.log2(f / a4Ref.current);
        const rawMidi = Math.round(rawExact);
        // Anzeige ruhig halten (Median aus 3), bei Tonwechsel sofort umspringen
        if (history.length && Math.abs(69 + 12 * Math.log2(history[history.length - 1] / a4Ref.current) - rawExact) > 0.6) history.length = 0;
        history.push(f);
        if (history.length > 3) history.shift();
        const med = median(history);
        const midiExact = 69 + 12 * Math.log2(med / a4Ref.current);
        const midi = Math.round(midiExact);
        const cents = Math.round((midiExact - midi) * 100);
        setReading({
          freq: med,
          midi,
          name: NOTE_NAMES[(midi % 12 + 12) % 12],
          octave: Math.floor(midi / 12) - 1,
          cents
        });
        setTrace(t => [...t, cents].slice(-TRACE_LEN));
        if (r.active) {
          const rawCents = Math.round((rawExact - rawMidi) * 100);
          // neuer Ton: andere Tonhöhe, oder gleicher Ton neu angestrichen (Lautstärke springt hoch)
          // Kurze Pause im Ton (neuer Bogenstrich) erkennen: die neuesten ~80 ms in Blöcken ansehen
          const B = Math.floor(ctx.sampleRate / 100);
          const blocks = [];
          for (let k = buf.length - 8 * B; k < buf.length; k += B) blocks.push(rmsOf(buf.subarray(k, k + B)));
          const peak = Math.max(r.cur?.peak || 0, ...blocks);
          const dip = Math.min(...blocks.slice(0, -1)) < peak * 0.3 && blocks[blocks.length - 1] > peak * 0.6;
          const reattack = r.cur && r.cur.cents.length >= 2 && (dip || level > lastRms * 1.8 && level > 0.01);
          if (r.cur && (r.cur.midi !== rawMidi || reattack)) closeEvent();
          if (!r.cur) r.cur = {
            midi: rawMidi,
            cents: [],
            seen: 0,
            peak: 0
          };
          r.cur.peak = Math.max(r.cur.peak, ...blocks);
          // die erste Messung eines Tons (Anstrich) nicht werten
          r.cur.seen++;
          if (r.cur.seen > 1) r.cur.cents.push(rawCents);
        }
        lastRms = level;
      }, 40);
      ref.current = {
        stream,
        ctx,
        timer
      };
      setOn(true);
      return stream;
    } catch (e) {
      setError(micErrorText(e));
      return null;
    }
  };
  const startRecording = async () => {
    const stream = ref.current?.stream || (await startMic());
    if (!stream) return;
    recRef.current = {
      active: true,
      events: [],
      cur: null
    };
    setEvents([]);
    setResult(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");
    try {
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => e.data.size && chunks.push(e.data);
      mr.onstop = () => setAudioUrl(URL.createObjectURL(new Blob(chunks, {
        type: mr.mimeType || "audio/webm"
      })));
      mr.start();
      recRef.current.mr = mr;
    } catch {
      /* Audioaufnahme nicht möglich: Auswertung läuft trotzdem */
    }
    setRecording(true);
  };
  const stopRecording = () => {
    closeEvent();
    const r = recRef.current;
    r.active = false;
    try {
      r.mr?.state === "recording" && r.mr.stop();
    } catch {/* ignorieren */}
    setRecording(false);
    setResult(r.events);
  };
  useEffect(() => () => {
    if (ref.current) stopMic();
  }, []);
  const cents = reading?.cents ?? 0;
  const v = reading ? verdict(cents, tol) : null;
  const sum = result ? summarize(result, tol) : null;
  const liveSum = recording ? summarize(events, tol) : null;
  return /*#__PURE__*/React.createElement("div", {
    className: "tu"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tu-head"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "ds-sub"
  }, t("Stimmgerät")), /*#__PURE__*/React.createElement("label", null, t("Kammerton a¹"), " ", /*#__PURE__*/React.createElement("select", {
    value: a4,
    onChange: e => setA4(Number(e.target.value))
  }, A4_CHOICES.map(f => /*#__PURE__*/React.createElement("option", {
    key: f,
    value: f
  }, f, " Hz")))), /*#__PURE__*/React.createElement("div", {
    className: "tu-quick"
  }, A4_QUICK.map(f => /*#__PURE__*/React.createElement("button", {
    key: f,
    className: `ds-chip ${f === a4 ? "active" : ""}`,
    onClick: () => setA4(f)
  }, f)))), /*#__PURE__*/React.createElement("div", {
    className: `tu-live ${v || ""}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "tu-gauge-wrap"
  }, /*#__PURE__*/React.createElement(Gauge, {
    cents: cents,
    active: !!reading,
    tol: tol,
    v: v
  }), /*#__PURE__*/React.createElement("div", {
    className: "tu-big"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tu-note"
  }, reading ? reading.name : "–", reading && /*#__PURE__*/React.createElement("sub", null, reading.octave)), /*#__PURE__*/React.createElement("span", {
    className: `tu-verdict ${v || ""}`
  }, reading ? VERDICT_TEXT[v] : on ? t("Spiel einen Ton…") : t("Mikrofon aus")), /*#__PURE__*/React.createElement("span", {
    className: "tu-info"
  }, reading ? `${cents > 0 ? "+" : ""}${cents} ${t("Cent")} · ${reading.freq.toFixed(1)} Hz` : " "))), /*#__PURE__*/React.createElement(Trace, {
    trace: trace,
    tol: tol
  })), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ds-btn-sm",
    onClick: on ? stopMic : startMic,
    disabled: recording
  }, on ? t("Stimmgerät aus") : t("🎤 Stimmgerät an")), /*#__PURE__*/React.createElement("button", {
    className: `ds-btn-sm ${recording ? "rec" : ""}`,
    onClick: recording ? stopRecording : startRecording
  }, recording ? t("■ Aufnahme beenden ({n} Töne)", {
    n: events.length
  }) : t("● Aufnahme mit Auswertung")), /*#__PURE__*/React.createElement("label", null, t("Empfindlichkeit"), " ", /*#__PURE__*/React.createElement("select", {
    value: sens,
    onChange: e => setSens(e.target.value)
  }, Object.keys(SENSITIVITY).map(k => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, t(k))))), /*#__PURE__*/React.createElement("label", null, t("Sauber bis ±"), " ", /*#__PURE__*/React.createElement("select", {
    value: tol,
    onChange: e => setTol(Number(e.target.value))
  }, TOLERANCES.map(x => /*#__PURE__*/React.createElement("option", {
    key: x,
    value: x
  }, x, " ", t("Cent")))))), recording && liveSum && /*#__PURE__*/React.createElement("p", {
    className: "tu-info"
  }, t("Bisher: {ok} sauber · {low} zu tief · {high} zu hoch", {
    ok: liveSum.count.ok,
    low: liveSum.count.tief,
    high: liveSum.count.hoch
  })), sum && /*#__PURE__*/React.createElement("div", {
    className: "tu-result"
  }, /*#__PURE__*/React.createElement("h4", null, t("Auswertung")), sum.total === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "tu-info"
  }, t("Keine gehaltenen Töne erkannt. Töne etwas länger halten und näher ans Mikrofon.")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "tu-stats"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, sum.total), /*#__PURE__*/React.createElement("span", null, t("Töne"))), /*#__PURE__*/React.createElement("div", {
    className: "ok"
  }, /*#__PURE__*/React.createElement("b", null, sum.count.ok), /*#__PURE__*/React.createElement("span", null, t("sauber ({p} %)", {
    p: Math.round(sum.count.ok / sum.total * 100)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "tief"
  }, /*#__PURE__*/React.createElement("b", null, sum.count.tief), /*#__PURE__*/React.createElement("span", null, t("zu tief"))), /*#__PURE__*/React.createElement("div", {
    className: "hoch"
  }, /*#__PURE__*/React.createElement("b", null, sum.count.hoch), /*#__PURE__*/React.createElement("span", null, t("zu hoch"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, sum.avgAbs), /*#__PURE__*/React.createElement("span", null, t("Ø Abweichung (Cent)")))), /*#__PURE__*/React.createElement("div", {
    className: "tu-seq"
  }, result.map((e, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `tu-ev ${verdict(e.cents, tol)}`,
    title: `${e.cents > 0 ? "+" : ""}${e.cents} ${t("Cent")}`
  }, e.name, /*#__PURE__*/React.createElement("sub", null, e.cents > 0 ? "+" : "", e.cents)))), /*#__PURE__*/React.createElement("table", {
    className: "tu-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, t("Ton")), /*#__PURE__*/React.createElement("th", null, t("Anzahl")), /*#__PURE__*/React.createElement("th", null, t("Ø Cent")), /*#__PURE__*/React.createElement("th", null, t("zu tief")), /*#__PURE__*/React.createElement("th", null, t("sauber")), /*#__PURE__*/React.createElement("th", null, t("zu hoch")))), /*#__PURE__*/React.createElement("tbody", null, sum.rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.name + r.octave
  }, /*#__PURE__*/React.createElement("td", null, r.name, /*#__PURE__*/React.createElement("sub", null, r.octave)), /*#__PURE__*/React.createElement("td", null, r.n), /*#__PURE__*/React.createElement("td", {
    className: verdict(r.avg, tol)
  }, r.avg > 0 ? "+" : "", r.avg), /*#__PURE__*/React.createElement("td", null, r.tief || ""), /*#__PURE__*/React.createElement("td", null, r.ok || ""), /*#__PURE__*/React.createElement("td", null, r.hoch || "")))))), audioUrl && /*#__PURE__*/React.createElement("div", {
    className: "tu-audio"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Aufnahme anhören")), /*#__PURE__*/React.createElement("audio", {
    controls: true,
    src: audioUrl
  }))), /*#__PURE__*/React.createElement("div", {
    className: "tu-ref"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Stimmton")), /*#__PURE__*/React.createElement("div", {
    className: "tu-keys"
  }, NOTE_NAMES.map((n, pc) => {
    const midi = 12 * (refOctave + 1) + pc;
    return /*#__PURE__*/React.createElement("button", {
      key: n,
      className: `ds-chip ${refMidi === midi ? "active" : ""}`,
      title: `${midiToFreq(midi, a4).toFixed(1)} Hz`,
      onClick: () => onRefTone(midi, hold)
    }, n);
  })), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("label", null, t("Oktave"), " ", /*#__PURE__*/React.createElement("select", {
    value: refOctave,
    onChange: e => setRefOctave(Number(e.target.value))
  }, [1, 2, 3, 4, 5].map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o)))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: hold,
    onChange: e => setHold(e.target.checked)
  }), " ", t("Halten (bis erneut tippen)")), refMidi != null && /*#__PURE__*/React.createElement("span", {
    className: "tu-info"
  }, NOTE_NAMES[refMidi % 12], Math.floor(refMidi / 12) - 1, " = ", midiToFreq(refMidi, a4).toFixed(1), " Hz"))), error && /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, error));
}

// ─── Griffbrett mit Tonleitern über 4 Saiten (Lagensystem Prof. Petru Iuga) ───
// Lage = Bund des 1. Fingers auf der E-Saite: 1 F, 1½ Fis, 2 G, 2½ Gis, 3 A, 3½ B, 4 H,
// 5 C (keine 4½, H–C ist ein diatonischer Halbton), 5½ Cis, 6 D, 6½ Es, 7 E.
// Bis Lage 5½: Hand reicht pro Saite von einem Bund unter der Lage bis drei darüber, Finger 1-2-4.
// Ab Lage 6: Daumen (+) auf der nächsten Saite unter dem 1. Finger, dann 1 und 3.
// Variante „Leersaiten“: beim Saitenwechsel wird eine leere Saite genommen, wo es passt.

const LAGEN = [{
  label: "1",
  fret: 1
}, {
  label: "1½",
  fret: 2,
  half: true
}, {
  label: "2",
  fret: 3
}, {
  label: "2½",
  fret: 4,
  half: true
}, {
  label: "3",
  fret: 5
}, {
  label: "3½",
  fret: 6,
  half: true
}, {
  label: "4",
  fret: 7
}, {
  label: "5",
  fret: 8
}, {
  label: "5½",
  fret: 9,
  half: true
}, {
  label: "6",
  fret: 10
}, {
  label: "6½",
  fret: 11,
  half: true
}, {
  label: "7",
  fret: 12
},
// Obere Lagen (Region 3 und 4), mit Daumen, stufenweise bis zum zweiten C auf der E-Saite
{
  label: "8",
  fret: 13,
  region: 3
}, {
  label: "9",
  fret: 15,
  region: 3
}, {
  label: "10",
  fret: 17,
  region: 3
}, {
  label: "11",
  fret: 19,
  region: 4
}, {
  label: "12",
  fret: 20,
  region: 4
}];
const lageName = l => l.label;
const THUMB_FROM_FRET = 10; // ab Lage 6 (D auf der E-Saite) mit Daumen

// Klingende Tonhöhe der leeren Saiten (MIDI): E1, A1, D2, G2
const STRINGS = [{
  name: "E",
  midi: 28
}, {
  name: "A",
  midi: 33
}, {
  name: "D",
  midi: 38
}, {
  name: "G",
  midi: 43
}];
const SCALES = {
  Dur: {
    up: [0, 2, 4, 5, 7, 9, 11]
  },
  "Moll natürlich": {
    up: [0, 2, 3, 5, 7, 8, 10]
  },
  "Moll harmonisch": {
    up: [0, 2, 3, 5, 7, 8, 11]
  },
  "Moll melodisch": {
    up: [0, 2, 3, 5, 7, 9, 11],
    down: [0, 2, 3, 5, 7, 8, 10]
  },
  Chromatisch: {
    up: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  },
  Ganzton: {
    up: [0, 2, 4, 6, 8, 10]
  }
};

// Grundtöne mit Buchstabe (0 = C … 6 = H) und Vorzeichen, für richtige Schreibweise
const ROOTS = [{
  name: "C",
  pc: 0,
  letter: 0,
  alt: 0
}, {
  name: "Cis",
  pc: 1,
  letter: 0,
  alt: 1
}, {
  name: "Des",
  pc: 1,
  letter: 1,
  alt: -1
}, {
  name: "D",
  pc: 2,
  letter: 1,
  alt: 0
}, {
  name: "Es",
  pc: 3,
  letter: 2,
  alt: -1
}, {
  name: "E",
  pc: 4,
  letter: 2,
  alt: 0
}, {
  name: "F",
  pc: 5,
  letter: 3,
  alt: 0
}, {
  name: "Fis",
  pc: 6,
  letter: 3,
  alt: 1
}, {
  name: "Ges",
  pc: 6,
  letter: 4,
  alt: -1
}, {
  name: "G",
  pc: 7,
  letter: 4,
  alt: 0
}, {
  name: "As",
  pc: 8,
  letter: 5,
  alt: -1
}, {
  name: "A",
  pc: 9,
  letter: 5,
  alt: 0
}, {
  name: "B",
  pc: 10,
  letter: 6,
  alt: -1
}, {
  name: "H",
  pc: 11,
  letter: 6,
  alt: 0
}];
const LETTERS = ["C", "D", "E", "F", "G", "A", "H"];
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];
const SHARP_NAMES = ["C", "Cis", "D", "Dis", "E", "F", "Fis", "G", "Gis", "A", "Ais", "H"];
const FLAT_NAMES = ["C", "Des", "D", "Es", "E", "F", "Ges", "G", "As", "A", "B", "H"];
function germanName(letter, acc) {
  const L = LETTERS[letter];
  if (acc === 0) return L;
  if (acc > 0) return L + "is".repeat(acc);
  if (L === "H") return acc === -1 ? "B" : "Heses";
  if (L === "E" || L === "A") return acc === -1 ? L + "s" : L + "ses";
  return L + "es".repeat(-acc);
}
function spell(root, intervals, pc) {
  const deg = intervals.indexOf((pc - root.pc + 12) % 12);
  if (intervals.length === 7 && deg >= 0) {
    const letter = (root.letter + deg) % 7;
    let acc = (pc - NATURAL_PC[letter] + 12) % 12;
    if (acc > 6) acc -= 12;
    return germanName(letter, acc);
  }
  const flats = root.alt < 0 || root.name === "F";
  return (flats ? FLAT_NAMES : SHARP_NAMES)[pc];
}

// ─── Fingersätze ───
// Untere Lagen: pro Saite nach Anzahl der gegriffenen Töne 1 · 1-2/1-4 · 1-2-4 · 1-2-3-4
function fingersLow(list) {
  const sorted = [...list].sort((a, b) => a.fret - b.fret);
  const k = sorted.length;
  let pattern;
  if (k === 1) pattern = [1];else if (k === 2) pattern = sorted[1].fret - sorted[0].fret <= 1 ? [1, 2] : [1, 4];else if (k === 3) pattern = [1, 2, 4];else pattern = [1, 2, 3, 4, 4, 4];
  sorted.forEach((n, i) => n.finger = pattern[i]);
}

// Daumenlage: unter dem Lagenbund Daumen, auf dem Lagenbund 1, einen Bund höher 2, zwei höher 3
function fingersThumb(list, lageFret) {
  list.forEach(n => {
    const off = n.fret - lageFret;
    n.finger = off < 0 ? "+" : off === 0 ? 1 : off === 1 ? 2 : 3;
  });
}

// Fingersatz je Griffstelle (wiederholte Töne behalten ihren Finger)
function assignFingers(notes, lageFret, baseFret) {
  const unique = {};
  notes.forEach(n => {
    const k = `${n.string}-${n.fret}`;
    if (!unique[k]) unique[k] = {
      string: n.string,
      fret: n.fret
    };
  });
  const byString = {};
  Object.values(unique).forEach(u => {
    if (u.fret > 0) (byString[u.string] ||= []).push(u);else u.finger = 0;
  });
  Object.values(byString).forEach(list => lageFret >= THUMB_FROM_FRET ? fingersThumb(list, baseFret) : fingersLow(list));
  notes.forEach(n => n.finger = unique[`${n.string}-${n.fret}`].finger);
}
const fingerLabel = f => f === undefined || f === null ? "" : String(f);
function scaleContext(rootIndex, scale) {
  const root = ROOTS[rootIndex];
  const up = SCALES[scale].up;
  const down = SCALES[scale].down;
  const pcOf = midi => (midi % 12 + 12) % 12;
  const inScale = midi => up.includes((midi - root.pc + 1200) % 12);
  // Abwärts-Form (melodisch Moll): Halbtonverschiebung der Stufe
  const downShift = midi => {
    if (!down) return 0;
    const deg = up.indexOf((midi - root.pc + 1200) % 12);
    return deg < 0 ? 0 : down[deg] - up[deg];
  };
  const name = (midi, desc) => nn(spell(root, desc && down ? down : up, pcOf(midi)));
  return {
    root,
    up,
    down,
    inScale,
    downShift,
    name
  };
}
function nextInScale(midi, inScale) {
  do midi++; while (!inScale(midi));
  return midi;
}

// Startton der Lage: Leiterton auf der E-Saite (Lagenbund zuerst)
function startFretFor(lageFret, inScale) {
  return [lageFret, lageFret + 1, lageFret + 2, lageFret - 1].find(f => f >= 1 && inScale(STRINGS[0].midi + f));
}

// Lagen-Tonleiter: so viele Leitertöne wie die Hand in der Lage über 4 Saiten erreicht (bis 12)
function positionAscent({
  lageFret,
  openStrings,
  inScale
}) {
  const thumb = lageFret >= THUMB_FROM_FRET;
  const startFret = startFretFor(lageFret, inScale);
  if (startFret === undefined) return [];
  // Daumenlage richtet sich nach dem tatsächlichen Startton (1. Finger)
  const lo = thumb ? startFret - 2 : Math.max(lageFret - 1, 1);
  const hi = thumb ? startFret + 2 : lageFret + 3;
  const fits = fret => fret >= lo && fret <= hi;
  const asc = [{
    string: 0,
    fret: startFret,
    midi: STRINGS[0].midi + startFret
  }];
  let midi = asc[0].midi;
  while (asc.length < 12) {
    midi = nextInScale(midi, inScale);
    const last = asc[asc.length - 1];
    const fretHere = midi - STRINGS[last.string].midi;
    let placed = null;
    if (fits(fretHere) && fretHere > last.fret) {
      placed = {
        string: last.string,
        fret: fretHere
      };
    } else if (last.string < 3) {
      const s = last.string + 1;
      const fretNext = midi - STRINGS[s].midi;
      if (openStrings && fretNext === 0) placed = {
        string: s,
        fret: 0
      };else if (fits(fretNext)) placed = {
        string: s,
        fret: fretNext
      };else if (!openStrings && fretNext === 0 && fretHere <= hi + 1) placed = {
        string: last.string,
        fret: fretHere
      };
    }
    if (!placed) break;
    asc.push({
      ...placed,
      midi
    });
  }
  return asc;
}

// Abwärts-Variante eines Tons (melodisch Moll): gleiche Saite, sonst tiefere Saite
function lowerForDescent(n, shift) {
  if (!shift) return {
    ...n
  };
  const m = n.midi + shift;
  if (n.fret + shift >= 0) return {
    ...n,
    midi: m,
    fret: n.fret + shift
  };
  const s = Math.max(0, n.string - 1);
  return {
    string: s,
    fret: m - STRINGS[s].midi,
    midi: m
  };
}
function finish(upSeq, downSeq, ctx, lageFret, withFingers) {
  if (withFingers) {
    const baseFret = upSeq[0].fret;
    assignFingers(upSeq, lageFret, baseFret);
    // gleiche Griffe abwärts übernehmen, veränderte Töne neu bestimmen
    const map = {};
    upSeq.forEach(n => map[`${n.string}-${n.fret}`] = n.finger);
    const fresh = downSeq.filter(n => map[`${n.string}-${n.fret}`] === undefined);
    assignFingers(fresh, lageFret, baseFret);
    downSeq.forEach(n => {
      const f = map[`${n.string}-${n.fret}`];
      if (f !== undefined) n.finger = f;
    });
  }
  const all = [...upSeq.map(n => ({
    ...n,
    desc: false
  })), ...downSeq.map(n => ({
    ...n,
    desc: true
  }))];
  return {
    notes: all.map((n, i) => ({
      ...n,
      i,
      name: ctx.name(n.midi, n.desc)
    })),
    up: upSeq.length
  };
}

// 12 Töne aufwärts und 12 zurück. Erreicht die Lage nur 11 Töne (z. B. F G A H C D E F G A H),
// werden beim Umkehren die letzten zwei wiederholt: … A H A, dann H A G … F G.
function buildRun({
  rootIndex,
  scale,
  lageFret,
  openStrings
}) {
  const ctx = scaleContext(rootIndex, scale);
  const asc = positionAscent({
    lageFret,
    openStrings,
    inScale: ctx.inScale
  });
  if (!asc.length) return {
    notes: [],
    up: 0,
    unique: 0
  };
  const n = asc.length;
  const desc = [...asc].reverse().map(x => lowerForDescent(x, ctx.downShift(x.midi)));
  let upSeq;
  let downSeq;
  if (n >= 12 || n < 3) {
    upSeq = asc.map(x => ({
      ...x
    }));
    downSeq = desc.slice(1);
  } else {
    upSeq = [...asc, asc[n - 2]].map(x => ({
      ...x
    }));
    downSeq = [...desc, desc[n - 2]];
  }
  return {
    ...finish(upSeq, downSeq, ctx, lageFret, true),
    unique: n
  };
}

// Gruppen: 3, 4, 5 oder 6 Leitertöne auf jeder Saite, von Stufe zu Stufe höher.
// Fingersatz je Saite in Teilgruppen (z. B. 4er = 2+2, 1+3, 3+1); jede Teilgruppe ist eine Handstellung.
const GROUP_SPLITS = {
  3: ["3", "1+2", "2+1"],
  4: ["2+2", "1+3", "3+1", "4"],
  5: ["2+3", "1+4", "3+2", "4+1"],
  6: ["3+3", "2+4", "4+2", "2+2+2"]
};

// Untere Lagen: Ganzton 1-4, Halbton 1-2; drei Töne 1-2-4.
// Daumenlagen: + 1 2 3; drei Töne kleine Terz + 1 2, große Terz + 1 3; zwei Töne Halbton 1-2, Ganzton 1-3.
function subgroupFingers(midis, thumb) {
  const span = midis[midis.length - 1] - midis[0];
  const k = midis.length;
  if (k === 1) return [1];
  if (thumb) {
    if (k === 2) return span <= 1 ? [1, 2] : [1, 3];
    if (k === 3) return ["+", 1, span <= 3 ? 2 : 3];
    return ["+", 1, 2, 3, 3, 3].slice(0, k);
  }
  if (k === 2) return span <= 1 ? [1, 2] : [1, 4];
  if (k === 3) return [1, 2, 4];
  return [1, 2, 3, 4, 4, 4].slice(0, k);
}
function buildGroup({
  rootIndex,
  scale,
  lageFret,
  size,
  stage,
  split
}) {
  const ctx = scaleContext(rootIndex, scale);
  const startFret = startFretFor(lageFret, ctx.inScale);
  if (startFret === undefined) return {
    notes: [],
    up: 0
  };
  let midi = STRINGS[0].midi + startFret;
  for (let k = 0; k < stage; k++) midi = nextInScale(midi, ctx.inScale);
  const upSeq = [];
  for (let j = 0; j < size * 4; j++) {
    const string = Math.floor(j / size);
    upSeq.push({
      string,
      fret: midi - STRINGS[string].midi,
      midi
    });
    midi = nextInScale(midi, ctx.inScale);
  }
  // nur was auf dem Griffbrett liegt (bis etwa zur Quinte über der Oktave)
  if (upSeq.some(x => x.fret < 0 || x.fret > 26)) return {
    notes: [],
    up: 0
  };
  // ab D auf der E-Saite (Lage 6) mit Daumen
  const thumb = upSeq[0].fret >= THUMB_FROM_FRET;
  const parts = (split && GROUP_SPLITS[size].includes(split) ? split : GROUP_SPLITS[size][0]).split("+").map(Number);
  for (let st = 0; st < 4; st++) {
    let i = st * size;
    parts.forEach(p => {
      const sub = upSeq.slice(i, i + p);
      subgroupFingers(sub.map(x => x.midi), thumb).forEach((f, j) => sub[j].finger = f);
      i += p;
    });
  }
  upSeq.forEach(x => x.fret === 0 && (x.finger = 0));
  const fingerAt = {};
  upSeq.forEach(x => fingerAt[x.midi] = x.finger);
  const downSeq = [...upSeq].reverse().slice(1).map(x => {
    const n = lowerForDescent(x, ctx.downShift(x.midi));
    return {
      ...n,
      finger: fingerAt[n.midi] ?? x.finger
    };
  });
  return finish(upSeq, downSeq, ctx, lageFret, false);
}

// Name der Startstufe (für die Stufenwahl der Gruppen)
function stageNames(rootIndex, scale, lageFret, count) {
  const ctx = scaleContext(rootIndex, scale);
  const startFret = startFretFor(lageFret, ctx.inScale);
  if (startFret === undefined) return [];
  let midi = STRINGS[0].midi + startFret;
  const out = [];
  for (let k = 0; k < count; k++) {
    out.push(ctx.name(midi, false));
    midi = nextInScale(midi, ctx.inScale);
  }
  return out;
}

// ─── Tonleitern auf einer Saite ───
// Startton einer Saite: leere Saite, wenn sie zur Tonleiter gehört, sonst der nächste Leiterton darüber
function firstOnString(open, ctx, minFret = 0) {
  let m = open + minFret;
  while (!ctx.inScale(m)) m++;
  return m;
}
function oneStringStages(rootIndex, scale, string, kind) {
  const ctx = scaleContext(rootIndex, scale);
  const open = STRINGS[string].midi;
  // 2 Finger: ab der leeren Saite bis zur Oktave; 3 Finger (6er): ab D bis E, (9er): ab D bis D auf der G-Saite
  const count = kind === "2" ? 8 : kind === "6" ? 9 : 8;
  let m = firstOnString(open, ctx, kind === "2" ? 0 : 7);
  const out = [];
  for (let k = 0; k < count; k++) {
    out.push({
      midi: m,
      name: ctx.name(m, false)
    });
    m = nextInScale(m, ctx.inScale);
  }
  return out;
}
function descendOnString(x, ctx) {
  const shift = ctx.downShift(x.midi);
  return shift && x.fret + shift >= 0 ? {
    ...x,
    midi: x.midi + shift,
    fret: x.fret + shift
  } : {
    ...x
  };
}

// Mit zwei Fingern: je zwei Töne eine Handstellung. Unter der Oktave Ganzton 1-4, Halbton 2-4,
// ab der Oktave (12. Bund) Ganzton 1-3, Halbton 2-3. 11 Töne aufwärts, letzte zwei wiederholt, und zurück.
function buildTwoFinger({
  rootIndex,
  scale,
  string,
  stage
}) {
  const ctx = scaleContext(rootIndex, scale);
  const open = STRINGS[string].midi;
  const st = oneStringStages(rootIndex, scale, string, "2")[stage];
  if (!st) return {
    notes: [],
    up: 0
  };
  const asc = [];
  let m = st.midi;
  for (let k = 0; k < 11; k++) {
    asc.push({
      string,
      fret: m - open,
      midi: m
    });
    m = nextInScale(m, ctx.inScale);
  }
  let i = 0;
  if (asc[0].fret === 0) {
    asc[0].finger = 0;
    i = 1;
  }
  for (; i < asc.length; i += 2) {
    const a = asc[i];
    const b = asc[i + 1];
    const high = a.fret >= 12;
    if (!b) {
      a.finger = 1;
      break;
    }
    const half = b.midi - a.midi <= 1;
    a.finger = half ? 2 : 1;
    b.finger = high ? 3 : 4;
  }
  const n = asc.length;
  const fingerAt = {};
  asc.forEach(x => fingerAt[x.midi] = x.finger);
  const desc = [...asc].reverse().map(x => {
    const d = descendOnString(x, ctx);
    return {
      ...d,
      finger: fingerAt[d.midi] ?? x.finger
    };
  });
  const upSeq = [...asc, asc[n - 2]].map(x => ({
    ...x
  }));
  const downSeq = [...desc, desc[n - 2]];
  return finish(upSeq, downSeq, ctx, 0, false);
}

// Mit drei Fingern und Daumen: Dreiergruppen, kleine Terz + 1 2, große Terz + 1 3. 6er oder 9er Gruppe, und zurück.
function buildThreeFinger({
  rootIndex,
  scale,
  string,
  stage,
  size
}) {
  const ctx = scaleContext(rootIndex, scale);
  const open = STRINGS[string].midi;
  const st = oneStringStages(rootIndex, scale, string, String(size))[stage];
  if (!st) return {
    notes: [],
    up: 0
  };
  const upSeq = [];
  let m = st.midi;
  for (let k = 0; k < size; k++) {
    upSeq.push({
      string,
      fret: m - open,
      midi: m
    });
    m = nextInScale(m, ctx.inScale);
  }
  for (let i = 0; i < size; i += 3) {
    const tri = upSeq.slice(i, i + 3);
    const span = tri[tri.length - 1].midi - tri[0].midi;
    ["+", 1, span <= 3 ? 2 : 3].forEach((f, j) => tri[j] && (tri[j].finger = f));
  }
  const fingerAt = {};
  upSeq.forEach(x => fingerAt[x.midi] = x.finger);
  const downSeq = [...upSeq].reverse().slice(1).map(x => {
    const d = descendOnString(x, ctx);
    return {
      ...d,
      finger: fingerAt[d.midi] ?? x.finger
    };
  });
  return finish(upSeq, downSeq, ctx, 0, false);
}

// ─── Griffbrett-Darstellung ───
const W = 940;
const NUT_X = 84;
const STRING_Y = s => 40 + (3 - s) * 40; // G oben, E unten

function Fingerboard({
  notes,
  current,
  lageFret,
  dronePcs,
  onNote,
  showWindow
}) {
  const maxF = Math.max(14, ...notes.map(n => n.fret + 1));
  const L = (W - NUT_X - 12) / (1 - Math.pow(2, -maxF / 12));
  const fretX = f => NUT_X + L * (1 - Math.pow(2, -f / 12));
  const noteX = f => f === 0 ? NUT_X - 32 : (fretX(f - 1) + fretX(f)) / 2;
  const thumb = lageFret >= THUMB_FROM_FRET;
  const base = notes.length ? notes[0].fret : lageFret;
  const lo = thumb ? base - 2 : Math.max(lageFret - 1, 1);
  const hi = thumb ? base + 2 : lageFret + 3;
  const used = {};
  notes.forEach(n => {
    const k = `${n.string}-${n.fret}`;
    (used[k] ||= []).push(n);
  });
  const cur = notes[current];
  return /*#__PURE__*/React.createElement("svg", {
    className: "fb",
    viewBox: `0 0 ${W} 200`,
    role: "img",
    "aria-label": t("Griffbrett")
  }, /*#__PURE__*/React.createElement("defs", null, /*#__PURE__*/React.createElement("linearGradient", {
    id: "fbWood",
    x1: "0",
    x2: "0",
    y1: "0",
    y2: "1"
  }, /*#__PURE__*/React.createElement("stop", {
    offset: "0",
    stopColor: "var(--fb-wood-1)"
  }), /*#__PURE__*/React.createElement("stop", {
    offset: "1",
    stopColor: "var(--fb-wood-2)"
  }))), /*#__PURE__*/React.createElement("rect", {
    x: NUT_X,
    y: 18,
    width: fretX(maxF) - NUT_X,
    height: 164,
    rx: 6,
    fill: "url(#fbWood)"
  }), showWindow && /*#__PURE__*/React.createElement("rect", {
    className: "fb-win",
    x: fretX(lo - 1),
    y: 18,
    width: fretX(hi) - fretX(lo - 1),
    height: 164,
    fill: "var(--brass)",
    opacity: "0.16"
  }), LAGEN.filter(l => l.fret <= maxF).map(l => /*#__PURE__*/React.createElement("g", {
    key: l.label
  }, /*#__PURE__*/React.createElement("line", {
    x1: fretX(l.fret - 1),
    x2: fretX(l.fret - 1),
    y1: 18,
    y2: 182,
    stroke: l.half ? "var(--fb-blue)" : "var(--fb-line)",
    strokeWidth: l.half ? 1.2 : 1,
    strokeDasharray: l.half ? "4 3" : undefined
  }), /*#__PURE__*/React.createElement("text", {
    x: noteX(l.fret),
    y: 198,
    textAnchor: "middle",
    fontSize: l.half ? 10 : 12,
    fill: l.half ? "var(--fb-blue)" : "var(--muted)",
    fontWeight: l.fret === lageFret ? 700 : 400
  }, lageName(l)))), /*#__PURE__*/React.createElement("text", {
    x: NUT_X - 32,
    y: 198,
    textAnchor: "middle",
    fontSize: "11",
    fill: "var(--muted)"
  }, t("Lage")), /*#__PURE__*/React.createElement("rect", {
    x: NUT_X - 5,
    y: 16,
    width: 7,
    height: 168,
    rx: 2,
    fill: "var(--brass)"
  }), STRINGS.map((s, i) => /*#__PURE__*/React.createElement("g", {
    key: s.name
  }, /*#__PURE__*/React.createElement("line", {
    x1: NUT_X,
    x2: fretX(maxF),
    y1: STRING_Y(i),
    y2: STRING_Y(i),
    stroke: "var(--fb-string)",
    strokeWidth: 1 + (3 - i) * 0.6
  }), /*#__PURE__*/React.createElement("text", {
    x: 6,
    y: STRING_Y(i) + 5,
    fontSize: nn(s.name).length > 1 ? 12 : 14,
    fontWeight: "700",
    fill: "var(--wood)"
  }, nn(s.name)))), Object.entries(used).map(([k, list]) => {
    const n = list[0];
    const x = noteX(n.fret);
    const y = STRING_Y(n.string);
    const isCur = cur && cur.string === n.string && cur.fret === n.fret;
    const isDrone = dronePcs && dronePcs.includes((n.midi % 12 + 12) % 12);
    const first = list[0].i === 0;
    const fl = fingerLabel(n.finger);
    return /*#__PURE__*/React.createElement("g", {
      key: k,
      className: "fb-note",
      onClick: () => onNote(n),
      style: {
        cursor: "pointer"
      }
    }, isDrone && /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: 19,
      fill: "none",
      stroke: "var(--ok)",
      strokeWidth: 2.5
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: 15,
      fill: isCur ? "var(--wood)" : n.fret === 0 ? "var(--panel)" : first ? "var(--brass)" : "var(--brass-soft)",
      stroke: isCur ? "var(--wood)" : n.finger === "+" ? "var(--fb-blue)" : "var(--brass)",
      strokeWidth: n.finger === "+" ? 2.5 : 1.5
    }), /*#__PURE__*/React.createElement("text", {
      x: x,
      y: y + 4,
      textAnchor: "middle",
      fontSize: n.name.length > 3 ? 9 : 11,
      fontWeight: "700",
      fill: isCur ? "#fff" : "var(--text)"
    }, n.name), fl && /*#__PURE__*/React.createElement("text", {
      x: x + 15,
      y: y - 12,
      textAnchor: "middle",
      fontSize: "12",
      fontWeight: "700",
      fill: "var(--fb-string)"
    }, fl));
  }));
}

// ─── 7 Regionen nach den Flageoletts (von der G-Saite aus gedacht, gilt für jede Saite) ───
// Lage auf der Saite als Anteil der Saitenlänge; Abstände zum Steg hin gedehnt dargestellt.
const H_SEMI = {
  2: 12,
  3: 19,
  4: 24,
  5: 28,
  6: 31,
  7: 34,
  8: 36,
  9: 38,
  10: 40
};
const REGIONS = [{
  n: 1,
  from: 0,
  to: 1 / 3,
  semis: [0, 19],
  lane: 0
}, {
  n: 2,
  from: 1 / 3,
  to: 1 / 2,
  semis: [19, 24],
  lane: 0
}, {
  n: 3,
  from: 1 / 2,
  to: 2 / 3,
  semis: [12, 19],
  lane: 0
}, {
  n: 4,
  from: 2 / 3,
  to: 3 / 4,
  semis: [19, 24],
  lane: 0
}, {
  n: 5,
  from: 3 / 4,
  to: 5 / 6,
  semis: [24, 31],
  lane: 0,
  harm: [4, 5, 6]
}, {
  n: 6,
  from: 4 / 5,
  to: 7 / 8,
  semis: [28, 36],
  lane: 1,
  harm: [5, 6, 7, 8]
}, {
  n: 7,
  from: 5 / 6,
  to: 9 / 10,
  semis: [31, 40],
  lane: 2,
  harm: [6, 7, 8, 9, 10]
}];
// Obere Lagen in Region 3 (Daumen auf G, A, H, C) und 4 (D, E, F) als Bünde der G-Saite
const UPPER_LAGEN = [{
  region: 3,
  frets: [12, 14, 16, 17]
}, {
  region: 4,
  frets: [19, 21, 22]
}];
const R5_STOPPED = [24, 26, 28, 29, 31]; // G A H C D auf der G-Saite

const RW = 940;
const RX0 = 46;
const RX1 = 920;
// stückweise lineare Dehnung: untere Hälfte 38 %, Region 3–4 28 %, Steg-Bereich 34 %
const rx = frac => {
  const bp = [[0, 0], [0.5, 0.38], [0.75, 0.66], [0.92, 1], [1, 1.04]];
  for (let i = 1; i < bp.length; i++) {
    if (frac <= bp[i][0]) {
      const [a0, b0] = bp[i - 1];
      const [a1, b1] = bp[i];
      return RX0 + (b0 + (frac - a0) / (a1 - a0) * (b1 - b0)) * (RX1 - RX0) / 1.04;
    }
  }
  return RX1;
};
const fretFrac = f => 1 - Math.pow(2, -f / 12);
function Regionen({
  onPlay
}) {
  const [stringIdx, setStringIdx] = useState(3);
  const open = STRINGS[stringIdx].midi;
  const nm = semi => nn(SHARP_NAMES[(open + semi) % 12]);
  const laneY = lane => 52 + lane * 80;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Saite")), STRINGS.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s.name,
    className: `ds-chip ${i === stringIdx ? "active" : ""}`,
    onClick: () => setStringIdx(i)
  }, t("{s}-Saite", {
    s: nn(s.name)
  })))), /*#__PURE__*/React.createElement("div", {
    className: "fb-wrap"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "fb rg",
    viewBox: `0 0 ${RW} 320`,
    role: "img",
    "aria-label": t("Regionen der Saite")
  }, /*#__PURE__*/React.createElement("text", {
    x: (rx(0) + rx(0.5)) / 2,
    y: 16,
    textAnchor: "middle",
    fontSize: "13",
    fontWeight: "700",
    fill: "var(--wood)"
  }, t("Untere Lagen (Region 1–2)")), /*#__PURE__*/React.createElement("text", {
    x: (rx(0.5) + rx(0.92)) / 2,
    y: 16,
    textAnchor: "middle",
    fontSize: "13",
    fontWeight: "700",
    fill: "var(--wood)"
  }, t("Obere Lagen (ab Region 3)")), /*#__PURE__*/React.createElement("line", {
    x1: rx(0.5),
    x2: rx(0.5),
    y1: 22,
    y2: 210,
    stroke: "var(--wood)",
    strokeDasharray: "5 4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: RX0 - 6,
    y: 30,
    width: 6,
    height: 150,
    rx: 2,
    fill: "var(--brass)"
  }), /*#__PURE__*/React.createElement("text", {
    x: RX0 - 3,
    y: 196,
    textAnchor: "middle",
    fontSize: "11",
    fill: "var(--muted)"
  }, t("Sattel")), /*#__PURE__*/React.createElement("text", {
    x: RX1 - 4,
    y: 196,
    textAnchor: "end",
    fontSize: "11",
    fill: "var(--muted)"
  }, t("→ Steg")), REGIONS.map(r => {
    const y = laneY(r.lane);
    const x0 = rx(r.from);
    const x1 = rx(r.to);
    return /*#__PURE__*/React.createElement("g", {
      key: r.n
    }, /*#__PURE__*/React.createElement("rect", {
      x: x0,
      y: y - 16,
      width: x1 - x0,
      height: 32,
      rx: 6,
      fill: r.n % 2 ? "var(--brass-soft)" : "var(--panel)",
      stroke: "var(--brass)"
    }), /*#__PURE__*/React.createElement("text", {
      x: (x0 + x1) / 2,
      y: y - 2,
      textAnchor: "middle",
      fontSize: "13",
      fontWeight: "700",
      fill: "var(--wood)"
    }, r.n), /*#__PURE__*/React.createElement("text", {
      x: (x0 + x1) / 2,
      y: y + 11,
      textAnchor: "middle",
      fontSize: "10",
      fill: "var(--text)"
    }, nm(r.semis[0]), "\u2013", nm(r.semis[1])));
  }), UPPER_LAGEN.map(u => u.frets.map((f, i) => {
    const x = rx(fretFrac(f));
    return /*#__PURE__*/React.createElement("g", {
      key: f,
      className: "fb-note",
      style: {
        cursor: "pointer"
      },
      onClick: () => onPlay(open + f)
    }, /*#__PURE__*/React.createElement("line", {
      x1: x,
      x2: x,
      y1: 70,
      y2: 150,
      stroke: "var(--fb-blue)",
      strokeWidth: "1.5"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: 150,
      r: 11,
      fill: "var(--panel)",
      stroke: "var(--fb-blue)",
      strokeWidth: "2"
    }), /*#__PURE__*/React.createElement("text", {
      x: x,
      y: 154,
      textAnchor: "middle",
      fontSize: "10",
      fontWeight: "700",
      fill: "var(--text)"
    }, nm(f)), /*#__PURE__*/React.createElement("text", {
      x: x,
      y: 174,
      textAnchor: "middle",
      fontSize: "9",
      fill: "var(--fb-blue)"
    }, i + 1, "."));
  })), /*#__PURE__*/React.createElement("text", {
    x: rx(0.5) + 6,
    y: 206,
    textAnchor: "start",
    fontSize: "10",
    fill: "var(--fb-blue)"
  }, t("Daumen-Lagen (Region 3: 1–4, Region 4: 1–3)")), R5_STOPPED.map(f => {
    const x = rx(fretFrac(f));
    return /*#__PURE__*/React.createElement("g", {
      key: f,
      className: "fb-note",
      style: {
        cursor: "pointer"
      },
      onClick: () => onPlay(open + f)
    }, /*#__PURE__*/React.createElement("line", {
      x1: x,
      x2: x,
      y1: 30,
      y2: 40,
      stroke: "var(--wood)",
      strokeWidth: "2"
    }));
  }), REGIONS.filter(r => r.harm).map(r => r.harm.map(h => {
    const x = rx(1 - 1 / h);
    const y = laneY(r.lane) + 32;
    return /*#__PURE__*/React.createElement("g", {
      key: `${r.n}-${h}`,
      className: "fb-note",
      style: {
        cursor: "pointer"
      },
      onClick: () => onPlay(open + H_SEMI[h])
    }, /*#__PURE__*/React.createElement("path", {
      d: `M${x},${y - 8} L${x + 8},${y} L${x},${y + 8} L${x - 8},${y} Z`,
      fill: "var(--panel)",
      stroke: "var(--wood)",
      strokeWidth: "1.5"
    }), /*#__PURE__*/React.createElement("text", {
      x: x,
      y: y + 20,
      textAnchor: "middle",
      fontSize: "10",
      fontWeight: "700",
      fill: "var(--text)"
    }, nm(H_SEMI[h]), h === 7 ? "↓" : ""));
  })), /*#__PURE__*/React.createElement("text", {
    x: RX0,
    y: 312,
    fontSize: "11",
    fill: "var(--muted)"
  }, t("◇ = Flageolett (antippen zum Anhören) · ↓ = Naturseptime, klingt tiefer · Abstände zum Steg hin gedehnt")))), /*#__PURE__*/React.createElement("ul", {
    className: "rg-list"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, t("Region"), " 1\u20132"), " (", nm(0), "\u2013", nm(19), "\u2013", nm(24), "): ", t("untere Lagen, ab der 2. Region schon mit Daumen möglich.")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, t("Region"), " 3"), " (", nm(12), "\u2013", nm(19), "): ", t("obere Lagen, Daumen auf {list} (1.–4. Lage).", {
    list: [12, 14, 16, 17].map(nm).join(", ")
  })), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, t("Region"), " 4"), " (", nm(19), "\u2013", nm(24), "): ", t("Daumen auf {list} (1.–3. Lage).", {
    list: [19, 21, 22].map(nm).join(", ")
  })), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, t("Region"), " 5"), " (", nm(24), "\u2013", nm(31), "): ", t("Flageoletts {h}, dazu die Zwischentöne {s}.", {
    h: [24, 28, 31].map(nm).join("–"),
    s: R5_STOPPED.map(nm).join(" ")
  })), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, t("Region"), " 6"), ": ", t("Flageoletts {h}.", {
    h: [28, 31, 34, 36].map(nm).join("–")
  })), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, t("Region"), " 7"), ": ", t("Flageoletts {h}.", {
    h: [31, 34, 36, 38, 40].map(nm).join("–")
  }))));
}

// ─── Hauptbaustein ───
function GriffbrettTonleiter({
  a4 = 440,
  dronePcs = null
}) {
  const [mode, setMode] = useState("lage");
  const [rootIndex, setRootIndex] = useState(0);
  const [scale, setScale] = useState("Dur");
  const [lage, setLage] = useState(0);
  const [openStrings, setOpenStrings] = useState(true);
  const [groupSize, setGroupSize] = useState(3);
  const [splits, setSplits] = useState({});
  const [stage, setStage] = useState(0);
  const [oneString, setOneString] = useState(3);
  const [threeSize, setThreeSize] = useState(6);
  const [allStages, setAllStages] = useState(false);
  const [bpm, setBpm] = useState(72);
  const [notated, setNotated] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  const synthRef = useRef(null);
  const timerRef = useRef(null);
  const lageFret = LAGEN[lage].fret;
  const wrapRef = useRef(null);
  const single = mode === "saite2" || mode === "saite3";

  // Stufen (Starttöne) je Art
  const stages = useMemo(() => {
    if (mode === "saite2") return oneStringStages(rootIndex, scale, oneString, "2").map(x => x.name);
    if (mode === "saite3") return oneStringStages(rootIndex, scale, oneString, String(threeSize)).map(x => x.name);
    return stageNames(rootIndex, scale, lageFret, 11);
  }, [mode, rootIndex, scale, lageFret, oneString, threeSize]);
  const buildFor = k => {
    if (mode === "gruppen") return buildGroup({
      rootIndex,
      scale,
      lageFret,
      size: groupSize,
      stage: k,
      split: splits[groupSize]
    });
    if (mode === "saite2") return buildTwoFinger({
      rootIndex,
      scale,
      string: oneString,
      stage: k
    });
    if (mode === "saite3") return buildThreeFinger({
      rootIndex,
      scale,
      string: oneString,
      stage: k,
      size: threeSize
    });
    return buildRun({
      rootIndex,
      scale,
      lageFret: LAGEN[k].fret,
      openStrings
    });
  };
  const run = useMemo(() => buildFor(mode === "lage" ? lage : stage),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [mode, rootIndex, scale, lage, openStrings, groupSize, stage, splits, oneString, threeSize]);
  const {
    notes,
    up
  } = run;
  useEffect(() => {
    const vol = new Tone.Volume(-8).toDestination();
    const filter = new Tone.Filter(2200, "lowpass").connect(vol);
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.5,
        release: 0.6
      }
    }).connect(filter);
    synthRef.current = synth;
    return () => {
      synth.dispose();
      filter.dispose();
      vol.dispose();
    };
  }, []);
  const freqOf = midi => a4 * Math.pow(2, (midi + (notated ? 12 : 0) - 69) / 12);
  const stop = () => {
    clearTimeout(timerRef.current);
    setPlaying(false);
    setCurrent(-1);
  };
  useEffect(() => {
    if (!playing) setCurrent(-1);
  }, [mode, rootIndex, scale, lage, openStrings, groupSize, oneString, threeSize]);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const play = async () => {
    if (playing) return stop();
    unlockIOSAudio();
    await Tone.start();
    setPlaying(true);
    const beat = 60 / bpm;
    // „alle Stufen“: Lage für Lage bzw. Stufe für Stufe nacheinander
    const keys = mode === "lage" ? LAGEN.map((_, k) => k).slice(lage) : stages.map((_, k) => k).slice(stage);
    const plan = allStages ? keys.map(k => ({
      k,
      run: buildFor(k)
    })).filter(p => p.run.notes.length) : [{
      k: mode === "lage" ? lage : stage,
      run
    }];
    const stepPlay = (p, i) => {
      if (p >= plan.length) return stop();
      const seq = plan[p].run.notes;
      if (i >= seq.length) return stepPlay(p + 1, 0);
      if (i === 0 && allStages) (mode === "lage" ? setLage : setStage)(plan[p].k);
      setCurrent(i);
      synthRef.current?.triggerAttackRelease(freqOf(seq[i].midi), beat * 0.9);
      timerRef.current = setTimeout(() => stepPlay(p, i + 1), beat * 1000);
    };
    stepPlay(0, 0);
    document.activeElement?.blur?.();
  };
  const playMidi = async midi => {
    unlockIOSAudio();
    await Tone.start();
    synthRef.current?.triggerAttackRelease(freqOf(midi), 1.2);
  };
  const playNote = n => {
    playMidi(n.midi);
    setCurrent(n.i);
  };

  // Auf schmalen Bildschirmen das Griffbrett zur gewählten Lage scrollen (obere Lagen liegen weit rechts)
  useEffect(() => {
    const wrap = wrapRef.current;
    const target = wrap?.querySelector(".fb-win") || wrap?.querySelector(".fb-note");
    if (!wrap || !target || wrap.scrollWidth <= wrap.clientWidth) return;
    const w = wrap.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    wrap.scrollTo({
      left: wrap.scrollLeft + r.left - w.left - (w.width - r.width) / 2,
      behavior: "smooth"
    });
  }, [lage, mode, rootIndex, scale, stage, oneString, threeSize]);
  const dronePc = dronePcs?.[0];
  const droneRootIndex = dronePc == null ? -1 : ROOTS.findIndex(r => r.pc === dronePc);
  const hasThumb = notes.some(n => n.finger === "+");
  const region = LAGEN[lage].region;
  const TABS = [["lage", "Lagen"], ["gruppen", "Gruppen"], ["saite2", "Eine Saite · 2 Finger"], ["saite3", "Eine Saite · 3 Finger"], ["regionen", "Regionen"]];
  const legend = t("kleine Zahl = Finger, 0 = leere Saite") + (hasThumb ? t(", + = Daumen (blauer Rand)") : "");
  let info;
  if (mode === "lage") info = t("{up} Töne aufwärts, {down} abwärts", {
    up,
    down: notes.length - up
  }) + (region ? ` · ${t("Region")} ${region}` : "");else if (mode === "gruppen") info = t("{g} Töne pro Saite, {up} aufwärts und zurück", {
    g: groupSize,
    up
  });else info = t("{up} Töne aufwärts, {down} abwärts", {
    up,
    down: notes.length - up
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "gt"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "ds-sub"
  }, t("Tonleitern")), /*#__PURE__*/React.createElement("div", {
    className: "gt-tabs",
    role: "tablist"
  }, TABS.map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    role: "tab",
    "aria-selected": mode === k,
    className: `gt-tab ${mode === k ? "active" : ""}`,
    onClick: () => {
      stop();
      setMode(k);
      setStage(0);
    }
  }, t(l)))), mode === "regionen" ? /*#__PURE__*/React.createElement(Regionen, {
    onPlay: playMidi
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("label", null, t("Grundton"), " ", /*#__PURE__*/React.createElement("select", {
    value: rootIndex,
    onChange: e => setRootIndex(Number(e.target.value))
  }, ROOTS.map((r, i) => /*#__PURE__*/React.createElement("option", {
    key: r.name,
    value: i
  }, nn(r.name))))), /*#__PURE__*/React.createElement("label", null, t("Tonleiter"), " ", /*#__PURE__*/React.createElement("select", {
    value: scale,
    onChange: e => setScale(e.target.value)
  }, Object.keys(SCALES).map(s => /*#__PURE__*/React.createElement("option", {
    key: s,
    value: s
  }, t(s))))), droneRootIndex >= 0 && droneRootIndex !== rootIndex && /*#__PURE__*/React.createElement("button", {
    className: "ds-btn-sm",
    onClick: () => setRootIndex(droneRootIndex)
  }, t("Grundton = Drone ({n})", {
    n: nn(ROOTS[droneRootIndex].name)
  }))), !single && /*#__PURE__*/React.createElement("div", {
    className: "gt-lagen"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Lage")), LAGEN.map((l, i) => /*#__PURE__*/React.createElement("button", {
    key: l.label,
    className: `ds-chip ${i === lage ? "active" : ""} ${l.half ? "half" : ""} ${l.fret >= THUMB_FROM_FRET ? "thumb" : ""}`,
    onClick: () => {
      setLage(i);
      setStage(0);
    }
  }, l.label))), single && /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Saite")), STRINGS.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s.name,
    className: `ds-chip ${i === oneString ? "active" : ""}`,
    onClick: () => {
      setOneString(i);
      setStage(0);
    }
  }, t("{s}-Saite", {
    s: nn(s.name)
  })))), mode === "saite3" && /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Gruppe")), [6, 9].map(g => /*#__PURE__*/React.createElement("button", {
    key: g,
    className: `ds-chip ${g === threeSize ? "active" : ""}`,
    onClick: () => {
      setThreeSize(g);
      setStage(0);
    }
  }, t("{n}er Gruppe", {
    n: g
  })))), mode === "gruppen" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Gruppe")), [3, 4, 5, 6].map(g => /*#__PURE__*/React.createElement("button", {
    key: g,
    className: `ds-chip ${g === groupSize ? "active" : ""}`,
    onClick: () => setGroupSize(g)
  }, t("{g}er", {
    g
  })))), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Fingersatz")), GROUP_SPLITS[groupSize].map(sp => /*#__PURE__*/React.createElement("button", {
    key: sp,
    className: `ds-chip ${sp === (splits[groupSize] || GROUP_SPLITS[groupSize][0]) ? "active" : ""}`,
    onClick: () => setSplits(x => ({
      ...x,
      [groupSize]: sp
    }))
  }, sp)))), mode !== "lage" && /*#__PURE__*/React.createElement("div", {
    className: "gt-lagen"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Ab Stufe")), stages.map((nm, k) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: `ds-chip ${k === stage ? "active" : ""}`,
    onClick: () => setStage(k)
  }, nm))), /*#__PURE__*/React.createElement("div", {
    className: "fb-wrap",
    ref: wrapRef
  }, /*#__PURE__*/React.createElement(Fingerboard, {
    notes: notes,
    current: current,
    lageFret: single ? 0 : lageFret,
    dronePcs: dronePcs,
    onNote: playNote,
    showWindow: mode === "lage"
  })), notes.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, t("In dieser Lage passt die Folge nicht aufs Griffbrett.")) : /*#__PURE__*/React.createElement("div", {
    className: "gt-seq"
  }, notes.map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `gt-n ${i === current ? "active" : ""} ${i === up ? "turn" : ""}`
  }, n.name, fingerLabel(n.finger) && /*#__PURE__*/React.createElement("sub", null, fingerLabel(n.finger))))), /*#__PURE__*/React.createElement("p", {
    className: "ds-hint",
    style: {
      marginTop: 4
    }
  }, info, " \xB7 ", legend, dronePcs && t(" · grüner Ring = aktueller Drone-Ton")), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    className: `ds-btn-sm ${playing ? "on" : ""}`,
    onClick: play
  }, playing ? t("■ Stopp") : t("▶ Abspielen")), /*#__PURE__*/React.createElement("label", null, t("Tempo"), " ", bpm, " ", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 40,
    max: 180,
    value: bpm,
    onChange: e => setBpm(Number(e.target.value))
  })), mode === "lage" && /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: openStrings,
    onChange: e => setOpenStrings(e.target.checked)
  }), " ", t("Leersaiten beim Saitenwechsel")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: allStages,
    onChange: e => setAllStages(e.target.checked)
  }), " ", mode === "lage" ? t("Alle Lagen nacheinander") : t("Alle Stufen nacheinander")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: notated,
    onChange: e => setNotated(e.target.checked)
  }), " ", t("Eine Oktave höher (notiert)")))));
}

// ─── Drone-Sequenz ───────────────────────────────────────────────
// Tonfolge eingeben, jeder Ton (oder Akkord, z. B. „C-E-G-B“) wird als gehaltener Bordun gespielt.
// Mit dem Bluetooth-Pedal (Page Turner) vor/zurück durch die Folge.

// Notennamen in allen drei Sprachen: C Cis Des H B / C C♯ D♭ B B♭ / Do Do♯ Ré♭ Si Si♭ (auch # und b).
// Optional Oktavzahl am Ende (z. B. "G1"), sonst gilt die gewählte Drone-Oktave.
function parseToken(raw) {
  const n = parseNote(raw);
  if (!n) return null;
  return {
    label: noteLabel(n),
    pc: pcOf(n),
    octave: n.oct
  };
}

// Ein Schritt ist ein Ton oder ein Akkord: Töne mit „-“ oder „+“ verbunden, z. B. „C-E-G-B“
function parseSequence(text) {
  const tokens = text.split(/[\s,;|]+/).filter(Boolean);
  const notes = [];
  const errors = [];
  tokens.forEach(tok => {
    const parts = tok.split(/[+\-](?=[a-zA-ZÀ-ÿ])/).filter(Boolean);
    const parsed = parts.map(parseToken);
    if (parsed.length && parsed.every(Boolean)) {
      notes.push({
        label: parsed.map(n => n.label).join("–"),
        pc: parsed[0].pc,
        octave: parsed[0].octave,
        tones: parsed,
        chord: parsed.length > 1
      });
    } else errors.push(tok);
  });
  return {
    notes,
    errors
  };
}
const PRESETS_DE = {
  Quintenzirkel: "C G D A E H Fis Des As Es B F",
  Quartenzirkel: "C F B Es As Des Fis H E A D G",
  Chromatisch: "C Cis D Es E F Fis G As A B H",
  "Blues in F": "F B F F B B F F C B F C",
  "Kadenz I–IV–V–I": "C F G C",
  "Akkorde I–IV–V–I": "C-E-G F-A-C G-H-D C-E-G",
  "Septakkorde (Quartenzirkel)": "C-E-G-B F-A-C-Es B-D-F-As Es-G-B-Des"
};
// Vorlagen in der gewählten Sprache
const PRESETS = Object.fromEntries(Object.entries(PRESETS_DE).map(([k, v]) => [k, convertSeq(v, "de")]));

// Klangfarben passend zur Tonleiter-App (synthetisiert).
const TIMBRES = {
  Kontrabass: {
    osc: "sawtooth",
    filter: 1400,
    attack: 0.5,
    release: 1.5,
    vibrato: 0
  },
  Klavier: {
    osc: "triangle",
    filter: 2500,
    attack: 0.02,
    release: 1.2,
    vibrato: 0
  },
  Oboe: {
    osc: "square",
    filter: 1800,
    attack: 0.15,
    release: 0.8,
    vibrato: 0.08
  },
  Violine: {
    osc: "sawtooth",
    filter: 3200,
    attack: 0.3,
    release: 1.0,
    vibrato: 0.12
  },
  Sinus: {
    osc: "sine",
    filter: 5000,
    attack: 0.4,
    release: 1.5,
    vibrato: 0
  }
};
const NEXT_KEYS = ["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"];
const PREV_KEYS = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace"];
const STORAGE_KEY = "drone-sequenz-v1";
async function loadSaved() {
  try {
    if (typeof window !== "undefined" && window.storage?.get) {
      const r = await window.storage.get(STORAGE_KEY);
      return r?.value ? JSON.parse(r.value) : null;
    }
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}
async function save(data) {
  try {
    const s = JSON.stringify(data);
    if (window.storage?.set) await window.storage.set(STORAGE_KEY, s);else window.localStorage.setItem(STORAGE_KEY, s);
  } catch {
    /* Speichern ist optional */
  }
}

// ─── Quintenzirkel: mehrere Töne gleichzeitig als Akkord halten ───
const CIRCLE = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
const PC_NAMES = ["C", "Des", "D", "Es", "E", "F", "Fis", "G", "As", "A", "B", "H"];
// Reine Stimmung zum Grundton (Frequenzverhältnis je Intervall in Halbtönen)
const JUST = [1, 16 / 15, 9 / 8, 6 / 5, 5 / 4, 4 / 3, 45 / 32, 3 / 2, 8 / 5, 5 / 3, 9 / 5, 15 / 8];
const justCents = iv => Math.round(1200 * Math.log2(JUST[iv]) - 100 * iv);
const CHORDS = {
  "Dur": [0, 4, 7],
  "Moll": [0, 3, 7],
  "Dur 7": [0, 4, 7, 10],
  "Moll 7": [0, 3, 7, 10],
  "Maj 7": [0, 4, 7, 11],
  "Quinte": [0, 7]
};
function CircleOfFifths({
  pcs,
  root,
  onToggle
}) {
  const R = 120;
  const c = 150;
  return /*#__PURE__*/React.createElement("svg", {
    className: "cf",
    viewBox: "0 0 300 300",
    role: "group",
    "aria-label": t("Quintenzirkel")
  }, /*#__PURE__*/React.createElement("circle", {
    cx: c,
    cy: c,
    r: R + 26,
    fill: "none",
    stroke: "var(--line)"
  }), CIRCLE.map((pc, i) => {
    const a = i / 12 * 2 * Math.PI - Math.PI / 2;
    const x = c + R * Math.cos(a);
    const y = c + R * Math.sin(a);
    const on = pcs.includes(pc);
    const isRoot = pc === root && on;
    return /*#__PURE__*/React.createElement("g", {
      key: pc,
      className: "cf-note",
      onClick: () => onToggle(pc),
      style: {
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: x,
      cy: y,
      r: 24,
      fill: on ? "var(--brass)" : "var(--panel)",
      stroke: isRoot ? "var(--ok)" : "var(--brass)",
      strokeWidth: isRoot ? 4 : 1.5
    }), /*#__PURE__*/React.createElement("text", {
      x: x,
      y: y + 5,
      textAnchor: "middle",
      fontSize: "15",
      fontWeight: "700",
      fill: on ? "#1c1712" : "var(--text)"
    }, nn(PC_NAMES[pc])));
  }), /*#__PURE__*/React.createElement("text", {
    x: c,
    y: c - 4,
    textAnchor: "middle",
    fontSize: "13",
    fill: "var(--muted)"
  }, t("Grundton")), /*#__PURE__*/React.createElement("text", {
    x: c,
    y: c + 22,
    textAnchor: "middle",
    fontSize: "26",
    fontWeight: "700",
    fill: "var(--ok)"
  }, pcs.length ? nn(PC_NAMES[root]) : "–"));
}

// Bildschirm beim Üben nicht abdunkeln (Screen Wake Lock, nach dem ersten Antippen;
// beim Zurückkehren in die App neu anfordern).
function useKeepScreenOn() {
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let lock = null;
    const request = async () => {
      if (document.visibilityState !== "visible" || lock && !lock.released) return;
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {/* nicht erlaubt, z. B. Energiesparmodus */}
    };
    const onVisible = () => document.visibilityState === "visible" && request();
    window.addEventListener("pointerdown", request);
    document.addEventListener("visibilitychange", onVisible);
    request();
    return () => {
      window.removeEventListener("pointerdown", request);
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.().catch(() => {});
    };
  }, []);
}
function DroneSequenz() {
  useKeepScreenOn();
  const [text, setText] = useState(PRESETS.Quintenzirkel);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [octave, setOctave] = useState(3);
  const [timbre, setTimbre] = useState("Kontrabass");
  const [fifth, setFifth] = useState(true);
  const [upperOctave, setUpperOctave] = useState(false);
  const [volume, setVolume] = useState(-6);
  const [loop, setLoop] = useState(true);
  const [lastKey, setLastKey] = useState("");
  const [saved, setSaved] = useState({});
  const [a4, setA4] = useState(440);
  const [droneMode, setDroneMode] = useState("folge");
  const [circlePcs, setCirclePcs] = useState([0, 4, 7]);
  const [circleRoot, setCircleRoot] = useState(0);
  const [just, setJust] = useState(true);
  const [pedalStep, setPedalStep] = useState(7);
  const synthRef = useRef(null);
  const chainRef = useRef(null);
  const soundingRef = useRef([]);
  const {
    notes,
    errors
  } = parseSequence(text);
  // Quintenzirkel-Akkord: Töne aufwärts ab dem Grundton, wahlweise rein gestimmt
  const circleStep = (() => {
    if (!circlePcs.length) return null;
    const ivs = [...new Set(circlePcs.map(pc => (pc - circleRoot + 12) % 12))].sort((a, b) => a - b);
    return {
      label: ivs.map(iv => noteLabel(parseNote(PC_NAMES[(circleRoot + iv) % 12], "de"))).join("–"),
      pc: circleRoot,
      octave: null,
      tones: ivs.map(iv => ({
        pc: (circleRoot + iv) % 12
      })),
      chord: ivs.length > 1,
      ivs
    };
  })();
  const inCircle = droneMode === "zirkel";
  const current = inCircle ? circleStep : notes[Math.min(index, notes.length - 1)];
  const nextNote = inCircle ? null : notes.length ? notes[index + 1 < notes.length ? index + 1 : loop ? 0 : index] : null;
  const toggleCircle = pc => {
    const next = circlePcs.includes(pc) ? circlePcs.filter(x => x !== pc) : [...circlePcs, pc];
    setCirclePcs(next);
    if (next.length && (!circlePcs.length || !next.includes(circleRoot))) setCircleRoot(next[0]);
  };
  const applyChord = ivs => setCirclePcs(ivs.map(iv => (circleRoot + iv) % 12));

  // Gespeicherte Folgen laden
  useEffect(() => {
    loadSaved().then(d => {
      if (!d) return;
      // in einer anderen Sprache gespeicherte Folgen umschreiben (ältere Daten sind deutsch)
      const from = d.lang || "de";
      if (d.text) setText(convertSeq(d.text, from));
      if (d.saved) setSaved(Object.fromEntries(Object.entries(d.saved).map(([k, v]) => [k, convertSeq(v, from)])));
      if (d.octave) setOctave(d.octave);
      if (d.timbre && TIMBRES[d.timbre]) setTimbre(d.timbre);
      if (d.a4 >= 420 && d.a4 <= 445) setA4(d.a4);
    });
  }, []);
  useEffect(() => {
    save({
      text,
      saved,
      octave,
      timbre,
      a4,
      lang: LANG
    });
  }, [text, saved, octave, timbre, a4]);

  // Synth bauen / bei Klangwechsel neu bauen
  useEffect(() => {
    const t = TIMBRES[timbre];
    const vol = new Tone.Volume(volume).toDestination();
    const filter = new Tone.Filter(t.filter, "lowpass").connect(vol);
    const vib = new Tone.Vibrato(5, t.vibrato).connect(filter);
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: t.osc
      },
      envelope: {
        attack: t.attack,
        decay: 0.2,
        sustain: 0.9,
        release: t.release
      }
    }).connect(vib);
    synth.maxPolyphony = 16;
    synthRef.current = synth;
    chainRef.current = {
      vol,
      filter,
      vib
    };
    soundingRef.current = [];
    return () => {
      synth.releaseAll();
      setTimeout(() => {
        synth.dispose();
        vib.dispose();
        filter.dispose();
        vol.dispose();
      }, t.release * 1000 + 200);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timbre]);
  useEffect(() => {
    if (chainRef.current) chainRef.current.vol.volume.rampTo(volume, 0.1);
  }, [volume]);

  // Gehaltenen Ton wechseln
  useEffect(() => {
    const synth = synthRef.current;
    if (!synth) return;
    if (soundingRef.current.length) synth.triggerRelease(soundingRef.current);
    soundingRef.current = [];
    if (!running || !current) return;
    const root = 12 * ((current.octave ?? octave) + 1) + current.pc;
    const f0 = midiToFreq(root, a4);
    let freqs;
    if (current.ivs) {
      // Quintenzirkel: rein (Verhältnisse zum Grundton) oder gleichstufig
      freqs = current.ivs.map(iv => just ? f0 * JUST[iv] : midiToFreq(root + iv, a4));
      if (current.ivs.length === 1 && fifth) freqs.push(f0 * 1.5);
      if (upperOctave) freqs.push(f0 * 2);
    } else if (current.chord) {
      // Akkordtöne aufwärts geschichtet ab dem ersten Ton
      let prev = root;
      freqs = [f0];
      current.tones.slice(1).forEach(t => {
        let m = t.octave != null ? 12 * (t.octave + 1) + t.pc : 12 * Math.floor(prev / 12) + t.pc;
        if (t.octave == null) while (m <= prev) m += 12;
        freqs.push(midiToFreq(m, a4));
        prev = m;
      });
      if (upperOctave) freqs.push(f0 * 2);
    } else {
      freqs = [f0];
      if (fifth) freqs.push(f0 * 1.5); // reine Quinte, schwebungsfrei
      if (upperOctave) freqs.push(f0 * 2);
    }
    const vel = Math.max(0.3, 0.6 / Math.sqrt(freqs.length / 2));
    synth.triggerAttack(freqs, undefined, vel);
    soundingRef.current = freqs;
  }, [running, current?.label, current?.octave, index, octave, fifth, upperOctave, timbre, a4, just, droneMode]);

  // Stimmton zum gewählten Kammerton: kurz oder gehalten (erneut tippen = aus)
  const [refMidi, setRefMidi] = useState(null);
  const refHeldRef = useRef(null);
  const refTimerRef = useRef(null);
  const stopRefTone = () => {
    clearTimeout(refTimerRef.current);
    if (refHeldRef.current != null) synthRef.current?.triggerRelease(refHeldRef.current);
    refHeldRef.current = null;
    setRefMidi(null);
  };
  const playRefTone = async (midi, hold) => {
    const same = refMidi === midi;
    stopRefTone();
    if (same && hold) return;
    unlockIOSAudio();
    await Tone.start();
    const synth = synthRef.current;
    if (!synth) return;
    const f = midiToFreq(midi, a4);
    synth.triggerAttack(f, undefined, 0.7);
    refHeldRef.current = f;
    setRefMidi(midi);
    if (!hold) refTimerRef.current = setTimeout(stopRefTone, 2500);
  };
  // Kammerton geändert: gehaltenen Stimmton neu stimmen
  useEffect(() => {
    if (refHeldRef.current == null || refMidi == null) return;
    synthRef.current?.triggerRelease(refHeldRef.current);
    const f = midiToFreq(refMidi, a4);
    synthRef.current?.triggerAttack(f, undefined, 0.7);
    refHeldRef.current = f;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a4]);
  const step = useCallback(dir => {
    // Quintenzirkel: Pedal verschiebt den ganzen Akkord (Quinte oder Halbton)
    if (inCircle) {
      const d = (dir * pedalStep + 12) % 12;
      setCirclePcs(list => list.map(pc => (pc + d) % 12));
      setCircleRoot(r => (r + d) % 12);
      return;
    }
    setIndex(i => {
      const n = notes.length;
      if (!n) return 0;
      const j = i + dir;
      if (j >= n) return loop ? 0 : n - 1;
      if (j < 0) return loop ? n - 1 : 0;
      return j;
    });
  }, [notes.length, loop, inCircle, pedalStep]);

  // Pedal / Tastatur
  useEffect(() => {
    const onKey = e => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (NEXT_KEYS.includes(e.key)) {
        e.preventDefault();
        setLastKey(e.key === " " ? t("Leertaste") : e.key);
        step(1);
      } else if (PREV_KEYS.includes(e.key)) {
        e.preventDefault();
        setLastKey(e.key);
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);
  useEffect(() => {
    if (index >= notes.length) setIndex(Math.max(0, notes.length - 1));
  }, [notes.length, index]);
  const [audioState, setAudioState] = useState("");
  const toggle = async () => {
    unlockIOSAudio();
    try {
      await Tone.start();
      if (Tone.context.state !== "running") await Tone.context.resume();
    } catch {/* Zustand wird unten angezeigt */}
    setAudioState(Tone.context.state);
    setRunning(r => !r);
    // Fokus vom Button nehmen, damit Leertaste/Enter vom Pedal nicht den Button auslöst
    document.activeElement?.blur?.();
  };
  const saveCurrent = () => {
    const name = window.prompt(t("Name für diese Folge:"));
    if (name) setSaved(s => ({
      ...s,
      [name]: text
    }));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ds"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ds-head"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "ds-title"
  }, t("Tonleitern & Drone")), /*#__PURE__*/React.createElement("div", {
    className: "ds-lang",
    role: "group",
    "aria-label": t("Sprache")
  }, Object.entries(LANGS).map(([k, name]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: `ds-chip ${k === LANG ? "active" : ""}`,
    title: name,
    "aria-pressed": k === LANG,
    onClick: () => k !== LANG && setLang(k)
  }, k.toUpperCase())))), /*#__PURE__*/React.createElement("nav", {
    className: "ds-nav"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#stimmgeraet"
  }, t("Stimmgerät")), /*#__PURE__*/React.createElement("a", {
    href: "#metronom"
  }, t("Metronom")), /*#__PURE__*/React.createElement("a", {
    href: "#tonleitern"
  }, t("Tonleitern")), /*#__PURE__*/React.createElement("a", {
    href: "#drone"
  }, t("Drone"))), /*#__PURE__*/React.createElement("section", {
    id: "stimmgeraet"
  }, /*#__PURE__*/React.createElement(Stimmgeraet, {
    a4: a4,
    setA4: setA4,
    onRefTone: playRefTone,
    refMidi: refMidi
  })), /*#__PURE__*/React.createElement("section", {
    id: "metronom"
  }, /*#__PURE__*/React.createElement(Metronom, null)), /*#__PURE__*/React.createElement("section", {
    id: "tonleitern"
  }, /*#__PURE__*/React.createElement(GriffbrettTonleiter, {
    a4: a4,
    dronePcs: running && current ? current.tones.map(t => t.pc) : null
  })), /*#__PURE__*/React.createElement("section", {
    id: "drone",
    className: "ds-drone"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "ds-sub"
  }, t("Drone-Sequenz")), /*#__PURE__*/React.createElement("div", {
    className: "gt-tabs",
    role: "tablist"
  }, [["folge", "Tonfolge"], ["zirkel", "Quintenzirkel"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    role: "tab",
    "aria-selected": droneMode === k,
    className: `gt-tab ${droneMode === k ? "active" : ""}`,
    onClick: () => setDroneMode(k)
  }, t(l)))), /*#__PURE__*/React.createElement("div", {
    className: "ds-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ds-now"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Jetzt")), /*#__PURE__*/React.createElement("span", {
    className: `ds-note ${current?.chord ? "chord" : ""}`
  }, current ? current.label : "–"), /*#__PURE__*/React.createElement("span", {
    className: "ds-pos"
  }, inCircle ? just ? t("rein gestimmt") : t("gleichstufig") : notes.length ? `${index + 1} / ${notes.length}` : t("keine Töne"))), /*#__PURE__*/React.createElement("div", {
    className: "ds-next"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Nächster")), /*#__PURE__*/React.createElement("span", {
    className: "ds-note-sm"
  }, nextNote && nextNote !== current ? nextNote.label : "–"))), /*#__PURE__*/React.createElement("div", {
    className: "ds-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: () => step(-1),
    "aria-label": t("Zurück")
  }, "\u25C0"), /*#__PURE__*/React.createElement("button", {
    className: `ds-btn ds-main ${running ? "on" : ""}`,
    onClick: toggle
  }, running ? t("■ Stopp") : t("▶ Drone starten")), /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: () => step(1),
    "aria-label": t("Weiter")
  }, "\u25B6")), running && audioState && audioState !== "running" && /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, t("Der Browser blockiert den Ton ({s}). Bitte Stopp und noch einmal „Drone starten“ tippen.", {
    s: audioState
  })), inCircle && /*#__PURE__*/React.createElement("div", {
    className: "cf-wrap"
  }, /*#__PURE__*/React.createElement(CircleOfFifths, {
    pcs: circlePcs,
    root: circleRoot,
    onToggle: toggleCircle
  }), /*#__PURE__*/React.createElement("div", {
    className: "cf-side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Grundton")), CIRCLE.filter(pc => circlePcs.includes(pc)).map(pc => /*#__PURE__*/React.createElement("button", {
    key: pc,
    className: `ds-chip ${pc === circleRoot ? "active" : ""}`,
    onClick: () => setCircleRoot(pc)
  }, nn(PC_NAMES[pc])))), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, t("Akkord")), Object.entries(CHORDS).map(([k, ivs]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: "ds-chip",
    onClick: () => applyChord(ivs)
  }, t(k))), /*#__PURE__*/React.createElement("button", {
    className: "ds-chip",
    onClick: () => setCirclePcs([])
  }, t("Leeren"))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: just,
    onChange: e => setJust(e.target.checked)
  }), " ", t("Reine Stimmung (zum Grundton)")), just && circleStep && circleStep.ivs.length > 1 && /*#__PURE__*/React.createElement("p", {
    className: "ds-hint cf-cents"
  }, circleStep.ivs.slice(1).map(iv => {
    const c = justCents(iv);
    return `${nn(PC_NAMES[(circleRoot + iv) % 12])} ${c > 0 ? "+" : ""}${c} ${t("Cent")}`;
  }).join(" · ")), /*#__PURE__*/React.createElement("label", null, t("Pedal verschiebt um"), " ", /*#__PURE__*/React.createElement("select", {
    value: pedalStep,
    onChange: e => setPedalStep(Number(e.target.value))
  }, /*#__PURE__*/React.createElement("option", {
    value: 7
  }, t("Quinte")), /*#__PURE__*/React.createElement("option", {
    value: 5
  }, t("Quarte")), /*#__PURE__*/React.createElement("option", {
    value: 1
  }, t("Halbton")), /*#__PURE__*/React.createElement("option", {
    value: 2
  }, t("Ganztonschritt")))))), !inCircle && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ds-chips"
  }, notes.map((n, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: `ds-chip ${i === index ? "active" : ""}`,
    onClick: () => setIndex(i)
  }, n.label))), /*#__PURE__*/React.createElement("label", {
    className: "ds-field"
  }, /*#__PURE__*/React.createElement("span", null, t("Tonfolge (z. B. „C G D A“, Akkorde mit Bindestrich: „C-E-G-B“, Oktave optional: „G1“)")), /*#__PURE__*/React.createElement("textarea", {
    rows: 2,
    value: text,
    onChange: e => setText(e.target.value)
  })), errors.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, t("Nicht erkannt: {e}", {
    e: errors.join(", ")
  })), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("select", {
    value: "",
    onChange: e => {
      if (e.target.value) {
        setText(e.target.value);
        setIndex(0);
      }
    }
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, t("Vorlage wählen…")), Object.entries(PRESETS).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: v
  }, t(k))), Object.keys(saved).length > 0 && /*#__PURE__*/React.createElement("optgroup", {
    label: t("Gespeichert")
  }, Object.entries(saved).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: v
  }, k)))), /*#__PURE__*/React.createElement("button", {
    className: "ds-btn-sm",
    onClick: saveCurrent
  }, t("Folge speichern")))), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("label", null, t("Klang"), " ", /*#__PURE__*/React.createElement("select", {
    value: timbre,
    onChange: e => setTimbre(e.target.value)
  }, Object.keys(TIMBRES).map(k => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: k
  }, t(k))))), /*#__PURE__*/React.createElement("label", null, t("Oktave"), " ", /*#__PURE__*/React.createElement("select", {
    value: octave,
    onChange: e => setOctave(Number(e.target.value))
  }, [1, 2, 3, 4].map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o)))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: fifth,
    onChange: e => setFifth(e.target.checked)
  }), " ", t("Quinte (bei Einzeltönen)")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: upperOctave,
    onChange: e => setUpperOctave(e.target.checked)
  }), " ", t("Oktave dazu")), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: loop,
    onChange: e => setLoop(e.target.checked)
  }), " ", t("Endlos")), /*#__PURE__*/React.createElement("label", null, t("Lautstärke"), " ", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -40,
    max: 0,
    value: volume,
    onChange: e => setVolume(Number(e.target.value))
  }))), /*#__PURE__*/React.createElement("p", {
    className: "ds-hint"
  }, t("Kein Ton? Lautstärke am Gerät prüfen, am iPhone den Stummschalter aus. Laptop- und Handylautsprecher geben tiefe Töne kaum wieder: Oktave 3 oder 4 wählen oder Kopfhörer nutzen."), /*#__PURE__*/React.createElement("br", null), t("Pedal: weiter = Pfeil rechts/unten, Bild ab, Leertaste, Enter · zurück = Pfeil links/oben, Bild auf."), lastKey && /*#__PURE__*/React.createElement(React.Fragment, null, " ", t("Zuletzt empfangen:"), " ", /*#__PURE__*/React.createElement("b", null, lastKey)))), /*#__PURE__*/React.createElement("footer", {
    className: "ds-footer"
  }, "Copyright \xA9 Petru IUGA"));
}
ReactDOM.createRoot(document.getElementById("root")).render( /*#__PURE__*/React.createElement(DroneSequenz, null));