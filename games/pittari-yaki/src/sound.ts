export type Sfx =
  | 'flip'
  | 'place'
  | 'serve'
  | 'serveCheese'
  | 'burn'
  | 'fire'
  | 'cool'
  | 'cheese'
  | 'extra'
  | 'pass'
  | 'win'
  | 'tap'
  | 'hover';

const MUSIC_KEY = 'pittari:music';
const SFX_KEY = 'pittari:sfx';
const MUSIC_LEVEL = 0.32;
const DUCK_LEVEL = 0.12;

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) !== 'off';
  } catch {
    return true;
  }
}

function writeFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? 'on' : 'off');
  } catch {}
}

let ctx: AudioContext | null = null;
let master: GainNode;
let musicBus: GainNode;
let sfxBus: GainNode;
let noiseBuf: AudioBuffer;
export let musicOn = readFlag(MUSIC_KEY);
export let sfxOn = readFlag(SFX_KEY);
let musicWanted = false;
let ducked = false;
let nextBar = 0;
let bar = 0;
let loop = 0;

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function ensure(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  musicBus.gain.value = musicOn ? MUSIC_LEVEL : 0;
  musicBus.connect(master);
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.8;
  sfxBus.connect(master);
  const n = ctx.sampleRate * 2;
  noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  return ctx;
}

interface ToneOpts {
  type?: OscillatorType;
  vol?: number;
  attack?: number;
  slide?: number;
  out?: AudioNode;
}

function tone(f: number, t: number, d: number, { type = 'sine', vol = 0.3, attack = 0.005, slide = 0, out = sfxBus }: ToneOpts = {}) {
  const c = ctx!;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + d + 0.05);
}

interface NoiseOpts {
  vol?: number;
  freq?: number;
  q?: number;
  type?: BiquadFilterType;
  sweep?: number;
  out?: AudioNode;
}

function noise(t: number, d: number, { vol = 0.3, freq = 2000, q = 1, type = 'bandpass', sweep = 0, out = sfxBus }: NoiseOpts = {}) {
  const c = ctx!;
  const s = c.createBufferSource();
  s.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + d);
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(f).connect(g).connect(out);
  s.start(t, Math.random() * 0.5, d + 0.05);
}

export function play(name: Sfx, opts: { value?: number; delay?: number } = {}) {
  if (!sfxOn || !ensure() || ctx!.state !== 'running') return;
  const t = ctx!.currentTime + (opts.delay ?? 0) / 1000;
  switch (name) {
    case 'flip':
      noise(t, 0.12, { vol: 0.35, freq: 1200, sweep: 5000, q: 0.8 });
      break;
    case 'place': {
      const v = opts.value ?? 6;
      const f = 620 - v * 26;
      tone(f, t, 0.08 + v * 0.004, { type: 'triangle', vol: 0.4 });
      noise(t, 0.03, { vol: 0.18, freq: 3200 - v * 140 });
      break;
    }
    case 'serve':
      [72, 76, 79, 84].forEach((m, i) => tone(mtof(m), t + i * 0.07, 0.5, { type: 'triangle', vol: 0.25 }));
      tone(mtof(96), t + 0.28, 0.6, { vol: 0.08 });
      break;
    case 'serveCheese':
      [72, 76, 79, 84, 88].forEach((m, i) => tone(mtof(m), t + i * 0.06, 0.6, { type: 'triangle', vol: 0.25 }));
      [91, 96].forEach((m, i) => tone(mtof(m), t + 0.3 + i * 0.08, 0.6, { vol: 0.1 }));
      break;
    case 'burn':
      noise(t, 0.7, { vol: 0.3, freq: 4000, q: 0.5, type: 'highpass' });
      tone(110, t, 0.35, { vol: 0.5, slide: 0.5 });
      break;
    case 'fire':
      noise(t, 0.45, { vol: 0.45, freq: 300, sweep: 2500, q: 0.7 });
      break;
    case 'cool':
      [96, 93, 89, 84].forEach((m, i) => tone(mtof(m), t + i * 0.06, 0.4, { vol: 0.12 }));
      break;
    case 'cheese':
      tone(300, t, 0.18, { vol: 0.5, slide: 2.2 });
      break;
    case 'extra':
      noise(t, 0.08, { vol: 0.3, freq: 1500, sweep: 5000 });
      noise(t + 0.1, 0.08, { vol: 0.3, freq: 1500, sweep: 5000 });
      tone(mtof(88), t + 0.22, 0.4, { type: 'triangle', vol: 0.2 });
      break;
    case 'pass':
      noise(t, 0.5, { vol: 0.22, freq: 400, sweep: 1600, q: 1.5 });
      break;
    case 'win':
      ([[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.54], [84, 0.66]] as const).forEach(([m, d]) => {
        tone(mtof(m), t + d, 0.35, { type: 'square', vol: 0.07 });
        tone(mtof(m), t + d, 0.35, { type: 'triangle', vol: 0.2 });
      });
      tone(mtof(48), t + 0.36, 0.8, { type: 'triangle', vol: 0.3 });
      break;
    case 'tap':
      tone(900, t, 0.04, { type: 'triangle', vol: 0.14 });
      break;
    case 'hover':
      tone(1300, t, 0.03, { type: 'sine', vol: 0.04 });
      break;
  }
}

const BPM = 104;
const Q = 60 / BPM;
const MELODY: [number, number][] = [
  [72, 1], [76, 1], [79, 1], [76, 1], [77, 1], [81, 1], [79, 2],
  [76, 1], [79, 1], [84, 1], [83, 1], [81, 1], [79, 1], [76, 2],
  [74, 1], [77, 1], [81, 1], [77, 1], [76, 1], [79, 1], [84, 2],
  [83, 1], [79, 1], [77, 1], [74, 1], [72, 4],
];
const BASS = [48, 53, 48, 53, 50, 48, 43, 48];
const CHORDS = [[60, 64, 67], [60, 65, 69], [60, 64, 67], [57, 60, 64], [62, 65, 69], [60, 64, 67], [59, 62, 67], [60, 64, 67]];

function musicBox(m: number, t: number, d: number) {
  tone(mtof(m), t, d * 1.6, { vol: 0.16, out: musicBus });
  tone(mtof(m) * 4, t, d * 0.5, { vol: 0.04, out: musicBus });
}

function scheduleMusic() {
  const c = ctx!;
  while (nextBar < c.currentTime + 0.6) {
    const t = nextBar;
    const b = bar % 8;
    let at = 0;
    for (const [m, d] of MELODY) {
      if (at >= b * 4 && at < b * 4 + 4) musicBox(m, t + (at - b * 4) * Q, d * Q);
      at += d;
    }
    tone(mtof(BASS[b]), t, Q * 1.8, { type: 'triangle', vol: 0.22, out: musicBus });
    tone(mtof(BASS[b] + 7), t + 2 * Q, Q * 1.8, { type: 'triangle', vol: 0.16, out: musicBus });
    for (const m of CHORDS[b]) {
      tone(mtof(m), t + Q, Q * 0.5, { vol: 0.05, out: musicBus });
      tone(mtof(m), t + 3 * Q, Q * 0.5, { vol: 0.05, out: musicBus });
    }
    for (let i = 0; i < 8; i++) noise(t + (i * Q) / 2, 0.03, { vol: i % 2 ? 0.04 : 0.07, freq: 8000, type: 'highpass', out: musicBus });
    nextBar += 4 * Q;
    bar++;
  }
}

function startLoop() {
  if (loop || !ctx || ctx.state !== 'running' || !musicOn || !musicWanted) return;
  nextBar = ctx.currentTime + 0.1;
  bar = 0;
  scheduleMusic();
  loop = window.setInterval(scheduleMusic, 200);
}

function stopLoop() {
  clearInterval(loop);
  loop = 0;
}

function musicLevel(): number {
  return musicOn ? (ducked ? DUCK_LEVEL : MUSIC_LEVEL) : 0;
}

/** Must run inside a user gesture the first time so the browser lets audio start. */
export function unlock() {
  if (!ensure()) return;
  if (ctx!.state === 'suspended') void ctx!.resume().then(startLoop);
  else startLoop();
}

export function startMusic() {
  musicWanted = true;
  ducked = false;
  if (ctx) musicBus.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.2);
  startLoop();
}

export function duckMusic(on: boolean) {
  ducked = on;
  if (ctx) musicBus.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.3);
}

export function setMusic(on: boolean) {
  musicOn = on;
  writeFlag(MUSIC_KEY, on);
  if (!ctx) return;
  musicBus.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.1);
  if (on) startLoop();
  else window.setTimeout(() => !musicOn && stopLoop(), 400);
}

export function setSfx(on: boolean) {
  sfxOn = on;
  writeFlag(SFX_KEY, on);
}

document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) {
    stopLoop();
    void ctx.suspend();
  } else {
    void ctx.resume().then(startLoop);
  }
});
