// Procedural chiptune-style background music. No assets.
// A small scheduler queues 4-bar patterns slightly ahead of currentTime
// so timing stays rock-solid even if the main thread is busy.
import { getSound } from "./settings";

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (_ctx) return _ctx;
  try {
    const C =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    _ctx = new C();
  } catch {
    return null;
  }
  return _ctx;
}

let masterGain: GainNode | null = null;
let schedulerId: number | null = null;
let nextNoteTime = 0;
let stepIndex = 0;
let running = false;

const BPM = 124;
const STEP_SEC = 60 / BPM / 4; // 16th notes
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;

// Mid-east-flavored A minor pentatonic-ish bassline (16 steps, MIDI notes; -1 = rest)
const BASS: number[] = [45, -1, 45, -1, 52, -1, 45, -1, 43, -1, 43, -1, 50, -1, 48, -1];
// Bright lead arpeggio (32 steps over 2 bars)
const LEAD: number[] = [
  69, 72, 76, 72, 69, 72, 76, 79, 69, 72, 76, 72, 67, 72, 76, 72, 69, 72, 76, 79, 81, 79, 76, 72,
  74, 77, 81, 77, 74, 77, 81, 84,
];
// Kick on 1 & 9, snare on 5 & 13, hat every step (subtle)
function isKick(s: number) {
  return s % 16 === 0 || s % 16 === 8;
}
function isSnare(s: number) {
  return s % 16 === 4 || s % 16 === 12;
}
function isHat(s: number) {
  return s % 2 === 0;
}

function midiToFreq(m: number) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function playNote(
  c: AudioContext,
  freq: number,
  time: number,
  dur: number,
  opts: {
    type?: OscillatorType;
    vol?: number;
    attack?: number;
    release?: number;
  },
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "square";
  osc.frequency.setValueAtTime(freq, time);
  const v = opts.vol ?? 0.12;
  const atk = opts.attack ?? 0.005;
  const rel = opts.release ?? 0.06;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(v, time + atk);
  g.gain.setValueAtTime(v, time + dur);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur + rel);
  osc.connect(g).connect(masterGain ?? c.destination);
  osc.start(time);
  osc.stop(time + dur + rel + 0.02);
}

function playKick(c: AudioContext, time: number) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(140, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.14);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.5, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  osc.connect(g).connect(masterGain ?? c.destination);
  osc.start(time);
  osc.stop(time + 0.22);
}

function playSnare(c: AudioContext, time: number) {
  const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.25, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
  src
    .connect(hp)
    .connect(g)
    .connect(masterGain ?? c.destination);
  src.start(time);
  src.stop(time + 0.14);
}

function playHat(c: AudioContext, time: number) {
  const buf = c.createBuffer(1, c.sampleRate * 0.04, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 6000;
  const g = c.createGain();
  g.gain.setValueAtTime(0.08, time);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.03);
  src
    .connect(hp)
    .connect(g)
    .connect(masterGain ?? c.destination);
  src.start(time);
  src.stop(time + 0.05);
}

function scheduleStep(c: AudioContext, time: number, step: number) {
  if (!getSound()) return;
  const bassNote = BASS[step % BASS.length];
  if (bassNote > 0) {
    playNote(c, midiToFreq(bassNote), time, STEP_SEC * 1.6, { type: "sawtooth", vol: 0.16 });
  }
  const leadNote = LEAD[step % LEAD.length];
  if (leadNote > 0) {
    playNote(c, midiToFreq(leadNote), time, STEP_SEC * 0.9, { type: "square", vol: 0.07 });
    // octave shimmer
    playNote(c, midiToFreq(leadNote + 12), time, STEP_SEC * 0.7, { type: "triangle", vol: 0.035 });
  }
  if (isKick(step)) playKick(c, time);
  if (isSnare(step)) playSnare(c, time);
  if (isHat(step)) playHat(c, time);
}

function scheduler() {
  const c = ctx();
  if (!c || !running) return;
  while (nextNoteTime < c.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(c, nextNoteTime, stepIndex);
    nextNoteTime += STEP_SEC;
    stepIndex = (stepIndex + 1) % 32;
  }
  schedulerId = window.setTimeout(scheduler, LOOKAHEAD_MS);
}

export function startMusic() {
  if (running) return;
  const c = ctx();
  if (!c) return;
  // try to resume if browser suspended the context
  if (c.state === "suspended") c.resume().catch(() => {});
  if (!masterGain) {
    masterGain = c.createGain();
    masterGain.gain.value = 0.55;
    masterGain.connect(c.destination);
  }
  running = true;
  stepIndex = 0;
  nextNoteTime = c.currentTime + 0.08;
  scheduler();
}

export function stopMusic() {
  running = false;
  if (schedulerId !== null) {
    clearTimeout(schedulerId);
    schedulerId = null;
  }
  if (masterGain && _ctx) {
    // quick fade to avoid click
    const now = _ctx.currentTime;
    try {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      const old = masterGain;
      setTimeout(() => {
        try {
          old.disconnect();
        } catch {
          // ignore: node already disconnected
        }
      }, 120);
      masterGain = null;
    } catch {
      masterGain = null;
    }
  }
}

// ─── Menu music ────────────────────────────────────────────────────────────
// Slower, synthwave-style ambient loop for the home + character-select screens.
let menuMasterGain: GainNode | null = null;
let menuSchedulerId: number | null = null;
let menuNextNoteTime = 0;
let menuStepIndex = 0;
let menuRunning = false;

const MENU_BPM = 86;
const MENU_STEP_SEC = 60 / MENU_BPM / 4;

// Am / G / F / E7 — slow, moody, cinematic
const MENU_BASS: number[] = [
  // 16 steps per chord, 4 chords = 64 steps total
  33, -1, -1, -1, -1, -1, -1, -1, 33, -1, -1, -1, -1, -1, -1, -1, 31, -1, -1, -1, -1, -1, -1, -1,
  31, -1, -1, -1, -1, -1, -1, -1, 29, -1, -1, -1, -1, -1, -1, -1, 29, -1, -1, -1, -1, -1, -1, -1,
  28, -1, -1, -1, -1, -1, -1, -1, 28, 32, -1, -1, -1, -1, -1, -1,
];

// Pad chords (3 notes per chord, hold for 16 steps)
const MENU_PADS: number[][] = [
  [57, 60, 64], // Am
  [55, 59, 62], // G
  [53, 57, 60], // F
  [52, 56, 59], // E
];

// Sparse arpeggio over the chords — only certain steps fire
const MENU_ARP: number[] = [
  72, -1, -1, 76, -1, -1, 79, -1, 76, -1, -1, 72, -1, -1, -1, -1, 74, -1, -1, 79, -1, -1, 83, -1,
  79, -1, -1, 74, -1, -1, -1, -1, 72, -1, -1, 77, -1, -1, 81, -1, 77, -1, -1, 72, -1, -1, -1, -1,
  71, -1, -1, 76, -1, -1, 80, -1, 76, -1, -1, 71, -1, -1, -1, -1,
];

function playMenuNote(
  c: AudioContext,
  freq: number,
  time: number,
  dur: number,
  opts: { type?: OscillatorType; vol?: number; attack?: number; release?: number },
) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = opts.type ?? "triangle";
  osc.frequency.setValueAtTime(freq, time);
  const v = opts.vol ?? 0.05;
  const atk = opts.attack ?? 0.05;
  const rel = opts.release ?? 0.25;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(v, time + atk);
  g.gain.setValueAtTime(v, time + dur);
  g.gain.exponentialRampToValueAtTime(0.0001, time + dur + rel);
  osc.connect(g).connect(menuMasterGain ?? c.destination);
  osc.start(time);
  osc.stop(time + dur + rel + 0.05);
}

function scheduleMenuStep(c: AudioContext, time: number, step: number) {
  if (!getSound()) return;
  // Bass: deep, long
  const bn = MENU_BASS[step % MENU_BASS.length];
  if (bn > 0) {
    playMenuNote(c, midiToFreq(bn), time, MENU_STEP_SEC * 14, {
      type: "sine",
      vol: 0.09,
      attack: 0.08,
      release: 0.4,
    });
    playMenuNote(c, midiToFreq(bn + 12), time, MENU_STEP_SEC * 10, {
      type: "triangle",
      vol: 0.05,
      attack: 0.06,
      release: 0.35,
    });
  }
  // Pads: change every 16 steps
  if (step % 16 === 0) {
    const chord = MENU_PADS[Math.floor(step / 16) % MENU_PADS.length];
    for (const n of chord) {
      playMenuNote(c, midiToFreq(n), time, MENU_STEP_SEC * 14, {
        type: "sawtooth",
        vol: 0.022,
        attack: 0.45,
        release: 0.8,
      });
    }
  }
  // Arpeggio sparkles
  const an = MENU_ARP[step % MENU_ARP.length];
  if (an > 0) {
    playMenuNote(c, midiToFreq(an), time, MENU_STEP_SEC * 1.6, {
      type: "triangle",
      vol: 0.045,
      attack: 0.005,
      release: 0.25,
    });
    // Soft octave shimmer
    playMenuNote(c, midiToFreq(an + 12), time, MENU_STEP_SEC * 1.2, {
      type: "sine",
      vol: 0.022,
      attack: 0.005,
      release: 0.2,
    });
  }
  // Very soft hi-hat every 4th step
  if (step % 4 === 0) {
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.025), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    const hp = c.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7000;
    const g = c.createGain();
    g.gain.setValueAtTime(0.035, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    src
      .connect(hp)
      .connect(g)
      .connect(menuMasterGain ?? c.destination);
    src.start(time);
    src.stop(time + 0.05);
  }
}

function menuScheduler() {
  const c = ctx();
  if (!c || !menuRunning) return;
  while (menuNextNoteTime < c.currentTime + SCHEDULE_AHEAD) {
    scheduleMenuStep(c, menuNextNoteTime, menuStepIndex);
    menuNextNoteTime += MENU_STEP_SEC;
    menuStepIndex = (menuStepIndex + 1) % MENU_BASS.length;
  }
  menuSchedulerId = window.setTimeout(menuScheduler, LOOKAHEAD_MS);
}

export function startMenuMusic() {
  if (menuRunning) return;
  const c = ctx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  if (!menuMasterGain) {
    menuMasterGain = c.createGain();
    menuMasterGain.gain.value = 0.45;
    menuMasterGain.connect(c.destination);
  }
  menuRunning = true;
  menuStepIndex = 0;
  menuNextNoteTime = c.currentTime + 0.08;
  menuScheduler();
}

export function stopMenuMusic() {
  menuRunning = false;
  if (menuSchedulerId !== null) {
    clearTimeout(menuSchedulerId);
    menuSchedulerId = null;
  }
  if (menuMasterGain && _ctx) {
    const now = _ctx.currentTime;
    try {
      menuMasterGain.gain.cancelScheduledValues(now);
      menuMasterGain.gain.setValueAtTime(menuMasterGain.gain.value, now);
      menuMasterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      const old = menuMasterGain;
      setTimeout(() => {
        try {
          old.disconnect();
        } catch {
          // ignore
        }
      }, 220);
      menuMasterGain = null;
    } catch {
      menuMasterGain = null;
    }
  }
}
