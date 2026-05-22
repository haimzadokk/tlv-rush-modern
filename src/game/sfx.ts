// Lightweight WebAudio SFX. No assets, no network. Lazy AudioContext so we
// only create it after a user gesture (autoplay-policy safe).
import { getSound } from "./settings";

let _ctx: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (!getSound()) return null;
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

type Tone = {
  freq: number;
  toFreq?: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  delay?: number;
};

function tone(c: AudioContext, t: Tone) {
  const now = c.currentTime + (t.delay ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = t.type ?? "sine";
  osc.frequency.setValueAtTime(t.freq, now);
  if (t.toFreq != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, t.toFreq), now + t.dur);
  }
  const v = t.vol ?? 0.18;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(v, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + t.dur);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + t.dur + 0.05);
}

export function sfxJumpDodge() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 520, toFreq: 980, dur: 0.18, type: "triangle", vol: 0.22 });
  tone(c, { freq: 1040, toFreq: 1560, dur: 0.12, type: "sine", vol: 0.12, delay: 0.04 });
}

export function sfxDuckDodge() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 360, toFreq: 180, dur: 0.22, type: "sawtooth", vol: 0.16 });
  tone(c, { freq: 720, toFreq: 480, dur: 0.14, type: "sine", vol: 0.1, delay: 0.02 });
}

export function sfxSwerveDodge() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 660, toFreq: 880, dur: 0.14, type: "square", vol: 0.14 });
}

export function sfxHit() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 220, toFreq: 70, dur: 0.32, type: "sawtooth", vol: 0.28 });
  tone(c, { freq: 140, toFreq: 50, dur: 0.4, type: "square", vol: 0.18, delay: 0.02 });
}

export function sfxShield() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 880, toFreq: 1320, dur: 0.18, type: "sine", vol: 0.2 });
  tone(c, { freq: 1320, toFreq: 1760, dur: 0.14, type: "triangle", vol: 0.14, delay: 0.05 });
}

export function sfxCoin() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 988, dur: 0.07, type: "square", vol: 0.18 });
  tone(c, { freq: 1319, dur: 0.16, type: "square", vol: 0.18, delay: 0.06 });
}

export function sfxPowerup() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 660, toFreq: 990, dur: 0.12, type: "triangle", vol: 0.2 });
  tone(c, { freq: 990, toFreq: 1320, dur: 0.12, type: "triangle", vol: 0.18, delay: 0.08 });
  tone(c, { freq: 1320, toFreq: 1760, dur: 0.18, type: "sine", vol: 0.14, delay: 0.16 });
}

export function sfxGameOver() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 523, toFreq: 392, dur: 0.22, type: "square", vol: 0.22 });
  tone(c, { freq: 392, toFreq: 311, dur: 0.26, type: "square", vol: 0.22, delay: 0.22 });
  tone(c, { freq: 311, toFreq: 196, dur: 0.5, type: "sawtooth", vol: 0.22, delay: 0.5 });
  tone(c, { freq: 110, toFreq: 55, dur: 0.7, type: "sine", vol: 0.18, delay: 0.5 });
}

export function sfxZoneChange() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 392, toFreq: 587, dur: 0.18, type: "triangle", vol: 0.16 });
  tone(c, { freq: 587, toFreq: 784, dur: 0.18, type: "triangle", vol: 0.16, delay: 0.1 });
  tone(c, { freq: 784, toFreq: 988, dur: 0.22, type: "sine", vol: 0.14, delay: 0.2 });
}

export function sfxNearMiss() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 1480, toFreq: 1760, dur: 0.08, type: "triangle", vol: 0.12 });
  tone(c, { freq: 1760, toFreq: 880, dur: 0.12, type: "sine", vol: 0.08, delay: 0.04 });
}

export function sfxCombo(level: number) {
  const c = ctx();
  if (!c) return;
  // Higher combo = higher pitch
  const base = 660 + Math.min(8, level) * 90;
  tone(c, { freq: base, dur: 0.05, type: "square", vol: 0.14 });
  tone(c, { freq: base * 1.5, dur: 0.07, type: "triangle", vol: 0.12, delay: 0.04 });
}

export function sfxNewRecord() {
  const c = ctx();
  if (!c) return;
  const notes = [523, 659, 784, 988, 1319];
  notes.forEach((f, i) =>
    tone(c, { freq: f, dur: 0.14, type: "triangle", vol: 0.18, delay: i * 0.08 }),
  );
}

export function sfxDash() {
  const c = ctx();
  if (!c) return;
  tone(c, { freq: 220, toFreq: 880, dur: 0.18, type: "sawtooth", vol: 0.18 });
  tone(c, { freq: 1240, toFreq: 620, dur: 0.12, type: "sine", vol: 0.1, delay: 0.06 });
}
