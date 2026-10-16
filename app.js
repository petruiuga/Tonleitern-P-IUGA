const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} = React;

// ─── Metronom mit vier synthetisierten Klängen ───
// Genaues Timing über Vorausplanung im Audio-Takt (nicht über setInterval allein).

const METRO_SOUNDS = ["Mechanisch", "Hoch", "Dirigentenstock", "Klatschen"];
const SUBDIVISIONS = [{
  label: "♩",
  n: 1
}, {
  label: "♪♪",
  n: 2
}, {
  label: "Triole",
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
function Metronom() {
  const [bpm, setBpm] = useState(80);
  const [beats, setBeats] = useState(4);
  const [sub, setSub] = useState(1);
  const [sound, setSound] = useState("Mechanisch");
  const [accent, setAccent] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const tapsRef = useRef([]);
  const stateRef = useRef({});
  stateRef.current = {
    bpm,
    beats,
    sub,
    sound,
    accent,
    volume
  };
  const engineRef = useRef(null);
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
  };
  const start = async () => {
    await Tone.start();
    const ctx = Tone.getContext().rawContext;
    const out = ctx.createGain();
    out.gain.value = stateRef.current.volume;
    out.connect(ctx.destination);
    const e = {
      ctx,
      out,
      next: ctx.currentTime + 0.08,
      tick: 0,
      timeouts: []
    };
    e.timer = setInterval(() => {
      const s = stateRef.current;
      out.gain.setTargetAtTime(s.volume, ctx.currentTime, 0.02);
      while (e.next < ctx.currentTime + 0.12) {
        const perBeat = s.sub;
        const tickInBar = e.tick % (s.beats * perBeat);
        const onBeat = tickInBar % perBeat === 0;
        const beatNo = Math.floor(tickInBar / perBeat);
        const level = onBeat ? beatNo === 0 && s.accent && s.beats > 1 ? 2 : 1 : 0;
        playClick(ctx, out, e.next, s.sound, level);
        if (onBeat) {
          const delay = Math.max(0, (e.next - ctx.currentTime) * 1000);
          const id = setTimeout(() => setBeat(beatNo), delay);
          e.timeouts.push(id);
          if (e.timeouts.length > 32) e.timeouts.shift();
        }
        e.next += 60 / s.bpm / perBeat;
        e.tick++;
      }
    }, 25);
    engineRef.current = e;
    setRunning(true);
    document.activeElement?.blur?.();
  };
  useEffect(() => () => engineRef.current && stop(), []);

  // Takt- oder Unterteilungswechsel: am Taktanfang neu einsetzen
  useEffect(() => {
    if (engineRef.current) engineRef.current.tick = 0;
  }, [beats, sub]);
  const tap = () => {
    const now = performance.now();
    const taps = tapsRef.current.filter(t => now - t < 2500);
    taps.push(now);
    tapsRef.current = taps;
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.max(30, Math.min(240, Math.round(60000 / avg))));
    }
  };
  const preview = async name => {
    setSound(name);
    if (engineRef.current) return;
    await Tone.start();
    const ctx = Tone.getContext().rawContext;
    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(ctx.destination);
    playClick(ctx, out, ctx.currentTime + 0.02, name, 2);
    playClick(ctx, out, ctx.currentTime + 0.42, name, 1);
    setTimeout(() => out.disconnect(), 1500);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "mt"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "ds-sub"
  }, "Metronom"), /*#__PURE__*/React.createElement("div", {
    className: "mt-sounds"
  }, METRO_SOUNDS.map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: `ds-chip ${s === sound ? "active" : ""}`,
    onClick: () => preview(s)
  }, s))), /*#__PURE__*/React.createElement("div", {
    className: "mt-main"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: () => setBpm(b => Math.max(30, b - 1)),
    "aria-label": "Langsamer"
  }, "\u2212"), /*#__PURE__*/React.createElement("div", {
    className: "mt-bpm"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mt-num"
  }, bpm), /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "Schl\xE4ge pro Minute")), /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: () => setBpm(b => Math.min(240, b + 1)),
    "aria-label": "Schneller"
  }, "+")), /*#__PURE__*/React.createElement("input", {
    className: "mt-slider",
    type: "range",
    min: 30,
    max: 240,
    value: bpm,
    onChange: e => setBpm(Number(e.target.value)),
    "aria-label": "Tempo"
  }), /*#__PURE__*/React.createElement("div", {
    className: "mt-dots",
    "aria-hidden": "true"
  }, Array.from({
    length: beats
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `mt-dot ${i === beat ? "on" : ""} ${i === 0 && accent && beats > 1 ? "one" : ""}`
  }))), /*#__PURE__*/React.createElement("div", {
    className: "ds-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: `ds-btn ds-main ${running ? "on" : ""}`,
    onClick: running ? stop : start
  }, running ? "■ Metronom stoppen" : "▶ Metronom starten"), /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: tap
  }, "Tap")), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("label", null, "Takt", " ", /*#__PURE__*/React.createElement("select", {
    value: beats,
    onChange: e => setBeats(Number(e.target.value))
  }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 12].map(b => /*#__PURE__*/React.createElement("option", {
    key: b,
    value: b
  }, b === 1 ? "ohne" : `${b}er`)))), /*#__PURE__*/React.createElement("label", null, "Unterteilung", " ", /*#__PURE__*/React.createElement("select", {
    value: sub,
    onChange: e => setSub(Number(e.target.value))
  }, SUBDIVISIONS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.n,
    value: s.n
  }, s.label)))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: accent,
    onChange: e => setAccent(e.target.checked)
  }), " Betonte Eins"), /*#__PURE__*/React.createElement("label", null, "Lautst\xE4rke", " ", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 0,
    max: 1,
    step: 0.05,
    value: volume,
    onChange: e => setVolume(Number(e.target.value))
  }))));
}

// ─── Stimmgerät mit Intonations-Aufnahme ───
// Hört übers Mikrofon zu, zeigt Ton und Abweichung (zu tief / sauber / zu hoch)
// mit Verlaufskurve. Während einer Aufnahme wird jeder gehaltene Ton ausgewertet,
// am Ende gibt es eine Zusammenfassung und die Aufnahme zum Anhören.

// Frequenz zum gewählten Kammerton A (a¹ = MIDI 69)
function midiToFreq(midi, a4) {
  return a4 * Math.pow(2, (midi - 69) / 12);
}
const NOTE_NAMES = ["C", "Cis", "D", "Es", "E", "F", "Fis", "G", "As", "A", "B", "H"];
const A4_CHOICES = Array.from({
  length: 26
}, (_, i) => 420 + i);
const A4_QUICK = [435, 440, 442, 443];
const TOLERANCES = [5, 10, 15, 20];
const TRACE_LEN = 70; // ~6 Sekunden Verlauf

// Tonhöhenerkennung (YIN), reicht bis zum tiefen E des Kontrabasses (41 Hz)
function detectPitch(buf, sr) {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < 0.01) return null;
  const minTau = Math.floor(sr / 1200);
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
    if (cmnd[t] < 0.15) {
      while (t + 1 <= maxTau && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
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
  const name = e?.name || "Fehler";
  if (!navigator.mediaDevices?.getUserMedia) return "Dieser Browser gibt hier kein Mikrofon frei (Seite muss über https geöffnet sein).";
  if (inFrame() && (name === "NotAllowedError" || name === "SecurityError")) return "In diesem Vorschaufenster blockiert die umgebende Seite das Mikrofon, auch wenn der Browser es erlaubt hat. In der installierten App bzw. auf der eigenen Internetadresse funktioniert das Stimmgerät. Der Stimmton geht hier trotzdem.";
  if (name === "NotAllowedError") return "Kein Zugriff aufs Mikrofon. Bitte in den Browser-Einstellungen für diese Seite erlauben und neu laden.";
  if (name === "NotFoundError") return "Kein Mikrofon gefunden.";
  if (name === "NotReadableError") return "Das Mikrofon wird gerade von einer anderen App benutzt.";
  return `Mikrofon nicht verfügbar (${name}). Der Stimmton funktioniert trotzdem.`;
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
  tief: "zu tief",
  ok: "sauber",
  hoch: "zu hoch"
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
  tol
}) {
  // Halbkreis von −50 bis +50 Cent, grüne Zone = Toleranz
  const R = 120;
  const cx = 150;
  const cy = 140;
  const ang = c => Math.max(-50, Math.min(50, c)) / 50 * (Math.PI / 2.2);
  const pt = (c, r = R) => [cx + r * Math.sin(ang(c)), cy - r * Math.cos(ang(c))];
  const arc = (c1, c2, r = R) => {
    const [x1, y1] = pt(c1, r);
    const [x2, y2] = pt(c2, r);
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`;
  };
  const [nx, ny] = pt(cents, R - 8);
  return /*#__PURE__*/React.createElement("svg", {
    className: "tu-gauge",
    viewBox: "0 0 300 160",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: arc(-50, -tol),
    stroke: "var(--tu-low)",
    strokeWidth: "14",
    fill: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: arc(-tol, tol),
    stroke: "var(--ok)",
    strokeWidth: "14",
    fill: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: arc(tol, 50),
    stroke: "var(--tu-high)",
    strokeWidth: "14",
    fill: "none"
  }), [-50, -25, 0, 25, 50].map(c => {
    const [x, y] = pt(c, R + 16);
    return /*#__PURE__*/React.createElement("text", {
      key: c,
      x: x,
      y: y + 4,
      textAnchor: "middle",
      fontSize: "11",
      fill: "var(--muted)"
    }, c > 0 ? `+${c}` : c);
  }), active && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: cx,
    y1: cy,
    x2: nx,
    y2: ny,
    stroke: "var(--text)",
    strokeWidth: "3.5",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: cx,
    cy: cy,
    r: "7",
    fill: "var(--text)"
  })));
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

  // Aktuellen Ton abschließen: mindestens ~0,3 s gehalten zählt als gespielter Ton
  const closeEvent = () => {
    const r = recRef.current;
    const c = r.cur;
    r.cur = null;
    if (!r.active || !c || c.cents.length < 3) return;
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
      const timer = setInterval(() => {
        analyser.getFloatTimeDomainData(buf);
        const f = detectPitch(buf, ctx.sampleRate);
        if (!f) {
          history.length = 0;
          setReading(null);
          setTrace(t => [...t, null].slice(-TRACE_LEN));
          closeEvent();
          return;
        }
        history.push(f);
        if (history.length > 5) history.shift();
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
        const r = recRef.current;
        if (r.active) {
          if (r.cur && r.cur.midi !== midi) closeEvent();
          if (!r.cur) r.cur = {
            midi,
            cents: [],
            seen: 0
          };
          // die ersten Messungen eines Tons (Anstrich) nicht werten
          r.cur.seen++;
          if (r.cur.seen > 2) r.cur.cents.push(cents);
        }
      }, 90);
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
  }, "Stimmger\xE4t"), /*#__PURE__*/React.createElement("label", null, "Kammerton a\xB9", " ", /*#__PURE__*/React.createElement("select", {
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
    tol: tol
  }), /*#__PURE__*/React.createElement("div", {
    className: "tu-big"
  }, /*#__PURE__*/React.createElement("span", {
    className: "tu-note"
  }, reading ? reading.name : "–", reading && /*#__PURE__*/React.createElement("sub", null, reading.octave)), /*#__PURE__*/React.createElement("span", {
    className: `tu-verdict ${v || ""}`
  }, reading ? VERDICT_TEXT[v] : on ? "Spiel einen Ton…" : "Mikrofon aus"), /*#__PURE__*/React.createElement("span", {
    className: "tu-info"
  }, reading ? `${cents > 0 ? "+" : ""}${cents} Cent · ${reading.freq.toFixed(1)} Hz` : " "))), /*#__PURE__*/React.createElement(Trace, {
    trace: trace,
    tol: tol
  })), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ds-btn-sm",
    onClick: on ? stopMic : startMic,
    disabled: recording
  }, on ? "Stimmgerät aus" : "🎤 Stimmgerät an"), /*#__PURE__*/React.createElement("button", {
    className: `ds-btn-sm ${recording ? "rec" : ""}`,
    onClick: recording ? stopRecording : startRecording
  }, recording ? `■ Aufnahme beenden (${events.length} Töne)` : "● Aufnahme mit Auswertung"), /*#__PURE__*/React.createElement("label", null, "Sauber bis \xB1", " ", /*#__PURE__*/React.createElement("select", {
    value: tol,
    onChange: e => setTol(Number(e.target.value))
  }, TOLERANCES.map(t => /*#__PURE__*/React.createElement("option", {
    key: t,
    value: t
  }, t, " Cent"))))), recording && liveSum && /*#__PURE__*/React.createElement("p", {
    className: "tu-info"
  }, "Bisher: ", liveSum.count.ok, " sauber \xB7 ", liveSum.count.tief, " zu tief \xB7 ", liveSum.count.hoch, " zu hoch"), sum && /*#__PURE__*/React.createElement("div", {
    className: "tu-result"
  }, /*#__PURE__*/React.createElement("h4", null, "Auswertung"), sum.total === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "tu-info"
  }, "Keine gehaltenen T\xF6ne erkannt. T\xF6ne etwas l\xE4nger halten und n\xE4her ans Mikrofon.") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "tu-stats"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, sum.total), /*#__PURE__*/React.createElement("span", null, "T\xF6ne")), /*#__PURE__*/React.createElement("div", {
    className: "ok"
  }, /*#__PURE__*/React.createElement("b", null, sum.count.ok), /*#__PURE__*/React.createElement("span", null, "sauber (", Math.round(sum.count.ok / sum.total * 100), " %)")), /*#__PURE__*/React.createElement("div", {
    className: "tief"
  }, /*#__PURE__*/React.createElement("b", null, sum.count.tief), /*#__PURE__*/React.createElement("span", null, "zu tief")), /*#__PURE__*/React.createElement("div", {
    className: "hoch"
  }, /*#__PURE__*/React.createElement("b", null, sum.count.hoch), /*#__PURE__*/React.createElement("span", null, "zu hoch")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, sum.avgAbs), /*#__PURE__*/React.createElement("span", null, "\xD8 Abweichung (Cent)"))), /*#__PURE__*/React.createElement("div", {
    className: "tu-seq"
  }, result.map((e, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `tu-ev ${verdict(e.cents, tol)}`,
    title: `${e.cents > 0 ? "+" : ""}${e.cents} Cent`
  }, e.name, /*#__PURE__*/React.createElement("sub", null, e.cents > 0 ? "+" : "", e.cents)))), /*#__PURE__*/React.createElement("table", {
    className: "tu-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Ton"), /*#__PURE__*/React.createElement("th", null, "Anzahl"), /*#__PURE__*/React.createElement("th", null, "\xD8 Cent"), /*#__PURE__*/React.createElement("th", null, "zu tief"), /*#__PURE__*/React.createElement("th", null, "sauber"), /*#__PURE__*/React.createElement("th", null, "zu hoch"))), /*#__PURE__*/React.createElement("tbody", null, sum.rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.name + r.octave
  }, /*#__PURE__*/React.createElement("td", null, r.name, /*#__PURE__*/React.createElement("sub", null, r.octave)), /*#__PURE__*/React.createElement("td", null, r.n), /*#__PURE__*/React.createElement("td", {
    className: verdict(r.avg, tol)
  }, r.avg > 0 ? "+" : "", r.avg), /*#__PURE__*/React.createElement("td", null, r.tief || ""), /*#__PURE__*/React.createElement("td", null, r.ok || ""), /*#__PURE__*/React.createElement("td", null, r.hoch || "")))))), audioUrl && /*#__PURE__*/React.createElement("div", {
    className: "tu-audio"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "Aufnahme anh\xF6ren"), /*#__PURE__*/React.createElement("audio", {
    controls: true,
    src: audioUrl
  }))), /*#__PURE__*/React.createElement("div", {
    className: "tu-ref"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "Stimmton"), /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("label", null, "Oktave", " ", /*#__PURE__*/React.createElement("select", {
    value: refOctave,
    onChange: e => setRefOctave(Number(e.target.value))
  }, [1, 2, 3, 4, 5].map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o)))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: hold,
    onChange: e => setHold(e.target.checked)
  }), " Halten (bis erneut tippen)"), refMidi != null && /*#__PURE__*/React.createElement("span", {
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
}];
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
  const name = (midi, desc) => spell(root, desc && down ? down : up, pcOf(midi));
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

// Gruppen: 3, 4, 5 oder 6 Leitertöne auf jeder Saite, von Stufe zu Stufe höher
function buildGroup({
  rootIndex,
  scale,
  lageFret,
  size,
  stage
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
  const downSeq = [...upSeq].reverse().slice(1).map(x => lowerForDescent(x, ctx.downShift(x.midi)));
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
    "aria-label": "Griffbrett"
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
  }, l.label))), /*#__PURE__*/React.createElement("text", {
    x: NUT_X - 32,
    y: 198,
    textAnchor: "middle",
    fontSize: "11",
    fill: "var(--muted)"
  }, "Lage"), /*#__PURE__*/React.createElement("rect", {
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
    x: 10,
    y: STRING_Y(i) + 5,
    fontSize: "14",
    fontWeight: "700",
    fill: "var(--wood)"
  }, s.name))), Object.entries(used).map(([k, list]) => {
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
  const nm = semi => SHARP_NAMES[(open + semi) % 12];
  const laneY = lane => 52 + lane * 80;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "Saite"), STRINGS.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s.name,
    className: `ds-chip ${i === stringIdx ? "active" : ""}`,
    onClick: () => setStringIdx(i)
  }, s.name, "-Saite"))), /*#__PURE__*/React.createElement("div", {
    className: "fb-wrap"
  }, /*#__PURE__*/React.createElement("svg", {
    className: "fb rg",
    viewBox: `0 0 ${RW} 320`,
    role: "img",
    "aria-label": "Regionen der Saite"
  }, /*#__PURE__*/React.createElement("text", {
    x: (rx(0) + rx(0.5)) / 2,
    y: 16,
    textAnchor: "middle",
    fontSize: "13",
    fontWeight: "700",
    fill: "var(--wood)"
  }, "Untere Lagen (Region 1\u20132)"), /*#__PURE__*/React.createElement("text", {
    x: (rx(0.5) + rx(0.92)) / 2,
    y: 16,
    textAnchor: "middle",
    fontSize: "13",
    fontWeight: "700",
    fill: "var(--wood)"
  }, "Obere Lagen (ab Region 3)"), /*#__PURE__*/React.createElement("line", {
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
  }, "Sattel"), /*#__PURE__*/React.createElement("text", {
    x: RX1 - 4,
    y: 196,
    textAnchor: "end",
    fontSize: "11",
    fill: "var(--muted)"
  }, "\u2192 Steg"), REGIONS.map(r => {
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
  }, "Daumen-Lagen (Region 3: 1\u20134, Region 4: 1\u20133)"), R5_STOPPED.map(f => {
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
  }, "\u25C7 = Flageolett (antippen zum Anh\xF6ren) \xB7 \u2193 = Naturseptime, klingt tiefer \xB7 Abst\xE4nde zum Steg hin gedehnt"))), /*#__PURE__*/React.createElement("ul", {
    className: "rg-list"
  }, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Region 1\u20132"), " (", nm(0), "\u2013", nm(19), "\u2013", nm(24), "): untere Lagen, ab der 2. Region schon mit Daumen m\xF6glich."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Region 3"), " (", nm(12), "\u2013", nm(19), "): obere Lagen, Daumen auf ", [12, 14, 16, 17].map(nm).join(", "), " (1.\u20134. Lage)."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Region 4"), " (", nm(19), "\u2013", nm(24), "): Daumen auf ", [19, 21, 22].map(nm).join(", "), " (1.\u20133. Lage)."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Region 5"), " (", nm(24), "\u2013", nm(31), "): Flageoletts ", [24, 28, 31].map(nm).join("–"), ", dazu die Zwischent\xF6ne ", R5_STOPPED.map(nm).join(" "), "."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Region 6"), ": Flageoletts ", [28, 31, 34, 36].map(nm).join("–"), "."), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("b", null, "Region 7"), ": Flageoletts ", [31, 34, 36, 38, 40].map(nm).join("–"), ".")));
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
  const [stage, setStage] = useState(0);
  const [allStages, setAllStages] = useState(false);
  const [bpm, setBpm] = useState(72);
  const [notated, setNotated] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  const synthRef = useRef(null);
  const timerRef = useRef(null);
  const lageFret = LAGEN[lage].fret;
  const stages = useMemo(() => stageNames(rootIndex, scale, lageFret, 11), [rootIndex, scale, lageFret]);
  const run = useMemo(() => {
    if (mode === "gruppen") return buildGroup({
      rootIndex,
      scale,
      lageFret,
      size: groupSize,
      stage
    });
    return buildRun({
      rootIndex,
      scale,
      lageFret,
      openStrings
    });
  }, [mode, rootIndex, scale, lageFret, openStrings, groupSize, stage]);
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
  }, [mode, rootIndex, scale, lage, openStrings, groupSize]);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  const play = async () => {
    if (playing) return stop();
    await Tone.start();
    setPlaying(true);
    const beat = 60 / bpm;
    // Gruppen „alle Stufen“: Stufe für Stufe nacheinander
    const plan = mode === "gruppen" && allStages ? stages.map((_, k) => ({
      k,
      run: buildGroup({
        rootIndex,
        scale,
        lageFret,
        size: groupSize,
        stage: k
      })
    })).filter(p => p.run.notes.length) : [{
      k: stage,
      run
    }];
    const stepPlay = (p, i) => {
      if (p >= plan.length) return stop();
      const seq = plan[p].run.notes;
      if (i >= seq.length) return stepPlay(p + 1, 0);
      if (i === 0 && mode === "gruppen") setStage(plan[p].k);
      setCurrent(i);
      synthRef.current?.triggerAttackRelease(freqOf(seq[i].midi), beat * 0.9);
      timerRef.current = setTimeout(() => stepPlay(p, i + 1), beat * 1000);
    };
    stepPlay(0, 0);
    document.activeElement?.blur?.();
  };
  const playMidi = async midi => {
    await Tone.start();
    synthRef.current?.triggerAttackRelease(freqOf(midi), 1.2);
  };
  const playNote = n => {
    playMidi(n.midi);
    setCurrent(n.i);
  };
  const dronePc = dronePcs?.[0];
  const droneRootIndex = dronePc == null ? -1 : ROOTS.findIndex(r => r.pc === dronePc);
  const thumb = lageFret >= THUMB_FROM_FRET;
  return /*#__PURE__*/React.createElement("div", {
    className: "gt"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "ds-sub"
  }, "Tonleitern \xFCber 4 Saiten"), /*#__PURE__*/React.createElement("div", {
    className: "gt-tabs",
    role: "tablist"
  }, [["lage", "Lagen"], ["gruppen", "Gruppen"], ["regionen", "Regionen"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    role: "tab",
    "aria-selected": mode === k,
    className: `gt-tab ${mode === k ? "active" : ""}`,
    onClick: () => {
      stop();
      setMode(k);
    }
  }, l))), mode === "regionen" ? /*#__PURE__*/React.createElement(Regionen, {
    onPlay: playMidi
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("label", null, "Grundton", " ", /*#__PURE__*/React.createElement("select", {
    value: rootIndex,
    onChange: e => setRootIndex(Number(e.target.value))
  }, ROOTS.map((r, i) => /*#__PURE__*/React.createElement("option", {
    key: r.name,
    value: i
  }, r.name)))), /*#__PURE__*/React.createElement("label", null, "Tonleiter", " ", /*#__PURE__*/React.createElement("select", {
    value: scale,
    onChange: e => setScale(e.target.value)
  }, Object.keys(SCALES).map(s => /*#__PURE__*/React.createElement("option", {
    key: s
  }, s)))), droneRootIndex >= 0 && droneRootIndex !== rootIndex && /*#__PURE__*/React.createElement("button", {
    className: "ds-btn-sm",
    onClick: () => setRootIndex(droneRootIndex)
  }, "Grundton = Drone (", ROOTS[droneRootIndex].name, ")")), /*#__PURE__*/React.createElement("div", {
    className: "gt-lagen"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "Lage"), LAGEN.map((l, i) => /*#__PURE__*/React.createElement("button", {
    key: l.label,
    className: `ds-chip ${i === lage ? "active" : ""} ${l.half ? "half" : ""}`,
    onClick: () => {
      setLage(i);
      setStage(0);
    }
  }, l.label))), mode === "gruppen" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "Gruppe"), [3, 4, 5, 6].map(g => /*#__PURE__*/React.createElement("button", {
    key: g,
    className: `ds-chip ${g === groupSize ? "active" : ""}`,
    onClick: () => setGroupSize(g)
  }, g, "er"))), /*#__PURE__*/React.createElement("div", {
    className: "gt-lagen"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "Ab Stufe"), stages.map((nm, k) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: `ds-chip ${k === stage ? "active" : ""}`,
    onClick: () => setStage(k)
  }, nm)))), /*#__PURE__*/React.createElement("div", {
    className: "fb-wrap"
  }, /*#__PURE__*/React.createElement(Fingerboard, {
    notes: notes,
    current: current,
    lageFret: lageFret,
    dronePcs: dronePcs,
    onNote: playNote,
    showWindow: mode === "lage"
  })), notes.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, "In dieser Lage passt die Folge nicht aufs Griffbrett.") : /*#__PURE__*/React.createElement("div", {
    className: "gt-seq"
  }, notes.map((n, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: `gt-n ${i === current ? "active" : ""} ${i === up ? "turn" : ""}`
  }, n.name, fingerLabel(n.finger) && /*#__PURE__*/React.createElement("sub", null, fingerLabel(n.finger))))), /*#__PURE__*/React.createElement("p", {
    className: "ds-hint",
    style: {
      marginTop: 4
    }
  }, mode === "lage" ? `${up} Töne aufwärts, ${notes.length - up} abwärts · kleine Zahl = Finger, 0 = leere Saite${thumb ? ", + = Daumen (blauer Rand)" : ""}` : `${groupSize} Töne pro Saite, ${up} aufwärts und zurück`, dronePcs && " · grüner Ring = aktueller Drone-Ton"), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    className: `ds-btn-sm ${playing ? "on" : ""}`,
    onClick: play
  }, playing ? "■ Stopp" : "▶ Abspielen"), /*#__PURE__*/React.createElement("label", null, "Tempo ", bpm, " ", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: 40,
    max: 180,
    value: bpm,
    onChange: e => setBpm(Number(e.target.value))
  })), mode === "lage" && /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: openStrings,
    onChange: e => setOpenStrings(e.target.checked)
  }), " Leersaiten beim Saitenwechsel"), mode === "gruppen" && /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: allStages,
    onChange: e => setAllStages(e.target.checked)
  }), " Alle Stufen nacheinander"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: notated,
    onChange: e => setNotated(e.target.checked)
  }), " Eine Oktave h\xF6her (notiert)"))));
}

// ─── Drone-Sequenz ───────────────────────────────────────────────
// Tonfolge eingeben, jeder Ton (oder Akkord, z. B. „C-E-G-B“) wird als gehaltener Bordun gespielt.
// Mit dem Bluetooth-Pedal (Page Turner) vor/zurück durch die Folge.

const PC = {
  c: 0,
  d: 2,
  e: 4,
  f: 5,
  g: 7,
  a: 9,
  h: 11
};

// Deutsche und englische Schreibweise: C Cis Des D Es E F Fis Ges G As A B H, auch C# Eb Bb.
// Optional Oktavzahl am Ende (z. B. "G1"), sonst gilt die gewählte Drone-Oktave.
function parseToken(raw) {
  const t = raw.trim().toLowerCase();
  const m = t.match(/^([a-h])(isis|eses|is|es|s|#|b)?(-?\d)?$/);
  if (!m) return null;
  const [, letter, acc = "", oct] = m;
  let pc;
  if (letter === "b") {
    if (acc) return null;
    pc = 10;
  } else {
    pc = PC[letter];
    if (acc === "is" || acc === "#") pc += 1;else if (acc === "isis") pc += 2;else if (acc === "eses") pc -= 2;else if (acc === "es" || acc === "b") pc -= 1;else if (acc === "s") {
      if (letter !== "a" && letter !== "e") return null;
      pc -= 1;
    }
  }
  const label = raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1).replace(/-?\d$/, "");
  return {
    label,
    pc: (pc + 12) % 12,
    octave: oct !== undefined ? Number(oct) : null
  };
}

// Ein Schritt ist ein Ton oder ein Akkord: Töne mit „-“ oder „+“ verbunden, z. B. „C-E-G-B“
function parseSequence(text) {
  const tokens = text.split(/[\s,;|]+/).filter(Boolean);
  const notes = [];
  const errors = [];
  tokens.forEach(tok => {
    const parts = tok.split(/[+\-](?=[a-hA-H])/).filter(Boolean);
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
const PRESETS = {
  Quintenzirkel: "C G D A E H Fis Des As Es B F",
  Quartenzirkel: "C F B Es As Des Fis H E A D G",
  Chromatisch: "C Cis D Es E F Fis G As A B H",
  "Blues in F": "F B F F B B F F C B F C",
  "Kadenz I–IV–V–I": "C F G C",
  "Akkorde I–IV–V–I": "C-E-G F-A-C G-H-D C-E-G",
  "Septakkorde (Quartenzirkel)": "C-E-G-B F-A-C-Es B-D-F-As Es-G-B-Des"
};

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
function DroneSequenz() {
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
  const synthRef = useRef(null);
  const chainRef = useRef(null);
  const soundingRef = useRef([]);
  const {
    notes,
    errors
  } = parseSequence(text);
  const current = notes[Math.min(index, notes.length - 1)];
  const nextNote = notes.length ? notes[index + 1 < notes.length ? index + 1 : loop ? 0 : index] : null;

  // Gespeicherte Folgen laden
  useEffect(() => {
    loadSaved().then(d => {
      if (!d) return;
      if (d.text) setText(d.text);
      if (d.saved) setSaved(d.saved);
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
      a4
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
    if (current.chord) {
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
  }, [running, current?.label, current?.octave, index, octave, fifth, upperOctave, timbre, a4]);

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
    setIndex(i => {
      const n = notes.length;
      if (!n) return 0;
      const j = i + dir;
      if (j >= n) return loop ? 0 : n - 1;
      if (j < 0) return loop ? n - 1 : 0;
      return j;
    });
  }, [notes.length, loop]);

  // Pedal / Tastatur
  useEffect(() => {
    const onKey = e => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (NEXT_KEYS.includes(e.key)) {
        e.preventDefault();
        setLastKey(e.key === " " ? "Leertaste" : e.key);
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
    const name = window.prompt("Name für diese Folge:");
    if (name) setSaved(s => ({
      ...s,
      [name]: text
    }));
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ds"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "ds-title"
  }, "Tonleitern & Drone"), /*#__PURE__*/React.createElement("nav", {
    className: "ds-nav"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#stimmgeraet"
  }, "Stimmger\xE4t"), /*#__PURE__*/React.createElement("a", {
    href: "#metronom"
  }, "Metronom"), /*#__PURE__*/React.createElement("a", {
    href: "#tonleitern"
  }, "Tonleitern"), /*#__PURE__*/React.createElement("a", {
    href: "#drone"
  }, "Drone")), /*#__PURE__*/React.createElement("section", {
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
  }, "Drone-Sequenz"), /*#__PURE__*/React.createElement("div", {
    className: "ds-stage"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ds-now"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "Jetzt"), /*#__PURE__*/React.createElement("span", {
    className: `ds-note ${current?.chord ? "chord" : ""}`
  }, current ? current.label : "–"), /*#__PURE__*/React.createElement("span", {
    className: "ds-pos"
  }, notes.length ? `${index + 1} / ${notes.length}` : "keine Töne")), /*#__PURE__*/React.createElement("div", {
    className: "ds-next"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ds-label"
  }, "N\xE4chster"), /*#__PURE__*/React.createElement("span", {
    className: "ds-note-sm"
  }, nextNote && nextNote !== current ? nextNote.label : "–"))), /*#__PURE__*/React.createElement("div", {
    className: "ds-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: () => step(-1),
    "aria-label": "Zur\xFCck"
  }, "\u25C0"), /*#__PURE__*/React.createElement("button", {
    className: `ds-btn ds-main ${running ? "on" : ""}`,
    onClick: toggle
  }, running ? "■ Stopp" : "▶ Drone starten"), /*#__PURE__*/React.createElement("button", {
    className: "ds-btn",
    onClick: () => step(1),
    "aria-label": "Weiter"
  }, "\u25B6")), running && audioState && audioState !== "running" && /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, "Der Browser blockiert den Ton (", audioState, "). Bitte Stopp und noch einmal \u201EDrone starten\u201C tippen."), /*#__PURE__*/React.createElement("div", {
    className: "ds-chips"
  }, notes.map((n, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: `ds-chip ${i === index ? "active" : ""}`,
    onClick: () => setIndex(i)
  }, n.label))), /*#__PURE__*/React.createElement("label", {
    className: "ds-field"
  }, /*#__PURE__*/React.createElement("span", null, "Tonfolge (z. B. \u201EC G D A\u201C, Akkorde mit Bindestrich: \u201EC-E-G-B\u201C, Oktave optional: \u201EG1\u201C)"), /*#__PURE__*/React.createElement("textarea", {
    rows: 2,
    value: text,
    onChange: e => setText(e.target.value)
  })), errors.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "ds-error"
  }, "Nicht erkannt: ", errors.join(", ")), /*#__PURE__*/React.createElement("div", {
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
  }, "Vorlage w\xE4hlen\u2026"), Object.entries(PRESETS).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: v
  }, k)), Object.keys(saved).length > 0 && /*#__PURE__*/React.createElement("optgroup", {
    label: "Gespeichert"
  }, Object.entries(saved).map(([k, v]) => /*#__PURE__*/React.createElement("option", {
    key: k,
    value: v
  }, k)))), /*#__PURE__*/React.createElement("button", {
    className: "ds-btn-sm",
    onClick: saveCurrent
  }, "Folge speichern")), /*#__PURE__*/React.createElement("div", {
    className: "ds-row ds-wrap"
  }, /*#__PURE__*/React.createElement("label", null, "Klang", " ", /*#__PURE__*/React.createElement("select", {
    value: timbre,
    onChange: e => setTimbre(e.target.value)
  }, Object.keys(TIMBRES).map(k => /*#__PURE__*/React.createElement("option", {
    key: k
  }, k)))), /*#__PURE__*/React.createElement("label", null, "Oktave", " ", /*#__PURE__*/React.createElement("select", {
    value: octave,
    onChange: e => setOctave(Number(e.target.value))
  }, [1, 2, 3, 4].map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o)))), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: fifth,
    onChange: e => setFifth(e.target.checked)
  }), " Quinte (bei Einzelt\xF6nen)"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: upperOctave,
    onChange: e => setUpperOctave(e.target.checked)
  }), " Oktave dazu"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: loop,
    onChange: e => setLoop(e.target.checked)
  }), " Endlos"), /*#__PURE__*/React.createElement("label", null, "Lautst\xE4rke", " ", /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: -40,
    max: 0,
    value: volume,
    onChange: e => setVolume(Number(e.target.value))
  }))), /*#__PURE__*/React.createElement("p", {
    className: "ds-hint"
  }, "Kein Ton? Lautst\xE4rke am Ger\xE4t pr\xFCfen, am iPhone den Stummschalter aus. Laptop- und Handylautsprecher geben tiefe T\xF6ne kaum wieder: Oktave 3 oder 4 w\xE4hlen oder Kopfh\xF6rer nutzen.", /*#__PURE__*/React.createElement("br", null), "Pedal: weiter = Pfeil rechts/unten, Bild ab, Leertaste, Enter \xB7 zur\xFCck = Pfeil links/oben, Bild auf.", lastKey && /*#__PURE__*/React.createElement(React.Fragment, null, " Zuletzt empfangen: ", /*#__PURE__*/React.createElement("b", null, lastKey)))));
}
ReactDOM.createRoot(document.getElementById("root")).render( /*#__PURE__*/React.createElement(DroneSequenz, null));