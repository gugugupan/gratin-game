let ctx: AudioContext | null = null;
let muted = false;
let scratch: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

function ac() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
  if (m) stopScratch();
}
export const isMuted = () => muted;

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, slide = 0) {
  if (muted) return;
  const a = ac();
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

function noise(dur: number, vol: number, hp = 1000) {
  if (muted) return;
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = hp;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export const sfx = {
  pop: () => {
    tone(660, 0.12, 'triangle', 0.12, 1.6);
    setTimeout(() => tone(990, 0.1, 'triangle', 0.08), 60);
  },
  shutter: () => {
    noise(0.08, 0.35, 2500);
    setTimeout(() => noise(0.05, 0.2, 4000), 70);
  },
  error: () => tone(160, 0.22, 'square', 0.06, 0.7),
  tick: () => tone(1200, 0.03, 'sine', 0.04),
  chime: () => {
    [523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.5, 'sine', 0.09), i * 110));
  },
  night: () => {
    [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.6, 'sine', 0.07), i * 160));
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.6, 'triangle', 0.1), i * 120));
  },
  thunder: () => noise(1.2, 0.25, 60),
  step: () => tone(180 + Math.random() * 40, 0.04, 'sine', 0.03),
  erase: () => noise(0.06, 0.05, 1800),
};

export function startScratch() {
  if (muted || scratch) return;
  const a = ac();
  const buf = a.createBuffer(1, a.sampleRate, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const f = a.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = 3200;
  f.Q.value = 0.8;
  const gain = a.createGain();
  gain.gain.value = 0;
  src.connect(f).connect(gain).connect(a.destination);
  src.start();
  scratch = { src, gain };
}

export function scratchLevel(v: number) {
  if (!scratch || !ctx) return;
  scratch.gain.gain.setTargetAtTime(Math.min(0.05, v), ctx.currentTime, 0.03);
}

export function stopScratch() {
  if (!scratch) return;
  scratch.src.stop();
  scratch = null;
}
