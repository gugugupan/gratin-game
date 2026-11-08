import '@fontsource/dela-gothic-one';
import '@fontsource/zen-maru-gothic/500.css';
import '@fontsource/zen-maru-gothic/700.css';
import '@fontsource/zcool-qingke-huangyou';
import '@fontsource/noto-sans-sc/500.css';
import '@fontsource/noto-sans-sc/700.css';
import './style.css';
import wordmarkUrl from '../../../public/wordmark.svg';
import {
  F, fop, fstr, GENERATORS, genUnique, make24Pools, nextLevel, pick, pick24, pilePos, rnd, ROUNDS, score, tierOf,
} from './logic.js';
import { applyDocument, LOCALE_LABELS, LOCALES, locale, setLocale, t } from './i18n.js';

const app = document.getElementById('app');
const RM = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function load(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

const MODES = {
  easy: { s: '1+2', fill: 'var(--m1)' },
  as: { s: '+−', fill: 'var(--m2)' },
  mul: { s: '×', fill: 'var(--m3)' },
  t24: { s: '24', fill: 'var(--m4)' },
};
const OPS = [['+', '+'], ['-', '−'], ['*', '×'], ['/', '÷']];
const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷' };

/* ===== breads ===== */
const BREADS = [
  '<ellipse cx="30" cy="28" rx="25" ry="12" fill="#A8561E"/><ellipse cx="30" cy="24" rx="25" ry="14" fill="#D9893A"/><ellipse cx="30" cy="20" rx="19" ry="8" fill="#E9A43A"/><ellipse cx="22" cy="16" rx="6" ry="2.4" fill="#FFE08A"/><g fill="#FFF6E6"><ellipse cx="30" cy="15" rx="1.6" ry="1"/><ellipse cx="37" cy="18" rx="1.6" ry="1"/><ellipse cx="25" cy="21" rx="1.6" ry="1"/></g>',
  '<path d="M8 37V20Q8 7 30 7Q52 7 52 20V37Z" fill="#8C4A1E"/><path d="M8 34V18Q8 4 30 4Q52 4 52 18V34Z" fill="#E9B36A"/><path d="M8 18Q8 4 30 4Q52 4 52 18Q41 13 30 15Q19 13 8 18Z" fill="#B4621F"/><path d="M18 9Q24 7 30 7" stroke="#E9A43A" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
  '<g stroke="#A8561E" stroke-width="1.6"><ellipse cx="11" cy="27" rx="7" ry="5" transform="rotate(-35 11 27)" fill="#D98A2E"/><ellipse cx="49" cy="27" rx="7" ry="5" transform="rotate(35 49 27)" fill="#D98A2E"/><ellipse cx="19" cy="21" rx="8" ry="8" fill="#E39A35"/><ellipse cx="41" cy="21" rx="8" ry="8" fill="#E39A35"/><ellipse cx="30" cy="19" rx="10" ry="11" fill="#E9A43A"/></g><ellipse cx="27" cy="13" rx="4" ry="2" fill="#FFE08A"/>',
  '<g transform="rotate(-10 30 20)"><ellipse cx="30" cy="24" rx="28" ry="8" fill="#A8561E"/><ellipse cx="30" cy="21" rx="28" ry="8" fill="#D9893A"/><g stroke="#F5D39A" stroke-width="3" stroke-linecap="round"><path d="M13 21l7-4"/><path d="M26 21l7-4"/><path d="M39 21l7-4"/></g></g>',
  '<ellipse cx="30" cy="31" rx="25" ry="6" fill="#B4621F"/><path d="M5 30Q5 6 30 6Q55 6 55 30Z" fill="#F5B935"/><g stroke="#D9962E" stroke-width="1.6" fill="none"><path d="M13 16L28 29"/><path d="M22 9L40 28"/><path d="M34 8L50 22"/><path d="M47 16L32 29"/><path d="M38 9L20 28"/><path d="M26 8L10 22"/></g><ellipse cx="21" cy="12" rx="5" ry="2" fill="#FFE08A"/>',
  '<circle cx="6" cy="25" r="5.5" fill="#A8351F"/><circle cx="54" cy="25" r="5.5" fill="#A8351F"/><ellipse cx="30" cy="26" rx="26" ry="12" fill="#A8351F"/><circle cx="6" cy="22" r="5.5" fill="#C9472D"/><circle cx="54" cy="22" r="5.5" fill="#C9472D"/><ellipse cx="30" cy="22" rx="26" ry="12" fill="#C9472D"/><ellipse cx="30" cy="21" rx="21" ry="9" fill="#F5B935"/><g fill="#E39A35"><ellipse cx="22" cy="18" rx="5" ry="2.4"/><ellipse cx="36" cy="25" rx="6" ry="2.4"/><ellipse cx="40" cy="17" rx="2.6" ry="1.6"/></g><g fill="#8C4A1E"><circle cx="27" cy="23" r="1.4"/><circle cx="44" cy="22" r="1.2"/></g><g fill="none" stroke="#E2B49A" stroke-width="2" stroke-linecap="round"><path d="M24 7q-2.5-3 0-6"/><path d="M30 6q-2.5-3 0-6"/><path d="M36 7q-2.5-3 0-6"/></g>',
];
const breadSVG = (tier, r) => `<svg viewBox="0 0 60 40" aria-hidden="true"${r ? ` style="transform:rotate(${r}deg)"` : ''}>${BREADS[tier]}</svg>`;

function drawPile(el, list, base, w, anim, src) {
  const h = (w * 40) / 60;
  el.style.height = Math.round((base - 1) * h * 0.6 + h + 16) + 'px';
  el.innerHTML = list.map((b, k) => {
    const p = pilePos(k, base, w);
    return `<span class="bread" style="width:${w}px;left:calc(50% + ${(p.x - w / 2).toFixed(1)}px);bottom:${(p.y + 8).toFixed(1)}px">${breadSVG(b.t, b.r)}</span>`;
  }).join('');
  if (anim == null) return;
  const e = el.children[anim];
  if (!e) return;
  const done = () => { e.classList.add('land'); const r = e.getBoundingClientRect(); crumbs(r.left + r.width / 2, r.top + r.height * 0.8, 14, 4); };
  if (RM || !src || !e.animate) { done(); return; }
  const r = e.getBoundingClientRect(), dx = src.x - (r.left + r.width / 2), dy = src.y - (r.top + r.height / 2);
  const a = e.animate([
    { transform: `translate(${dx}px,${dy}px) scale(1.5)` },
    { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 50}px) scale(1.25) rotate(-12deg)`, offset: 0.45 },
    { transform: 'none' },
  ], { duration: 720, easing: 'cubic-bezier(.35,.6,.45,1)' });
  a.onfinish = done;
}

/* ===== audio ===== */
let AC = null, soundOn = load('mb:sound', true), NB = null;
function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch {} }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);
function tone(f, t0, dur, type, vol) {
  const c = ac(); if (!c || !soundOn) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'triangle'; o.frequency.value = f;
  const s = c.currentTime + t0;
  g.gain.setValueAtTime(0, s); g.gain.linearRampToValueAtTime(vol || 0.16, s + 0.01); g.gain.exponentialRampToValueAtTime(0.001, s + dur);
  o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + dur + 0.05);
}
function sCorrect(c) { const b = 523.25 * Math.pow(2, Math.min(c - 1, 12) / 12); [1, 1.26, 1.5, 2].forEach((m, i) => tone(b * m, i * 0.06, 0.3, 'triangle', 0.15)); tone(1568, 0.32, 0.6, 'sine', 0.07); }
function sWrong() { tone(196, 0, 0.22, 'sawtooth', 0.07); tone(147, 0.12, 0.3, 'sawtooth', 0.07); }
function sTap() { tone(880, 0, 0.05, 'square', 0.03); }
function sWin() { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(523.25 * Math.pow(2, s / 12), i * 0.09, 0.45, 'triangle', 0.13)); }
function makeNoise() { const c = AC, b = c.createBuffer(1, c.sampleRate, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; NB = b; }

/* ===== layered music: one more layer for every two correct answers ===== */
const STEP = 60 / 116 / 2;
const CH = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
const ROOT = [36, 33, 29, 31];
const MEL = [72, null, 76, null, 79, 76, null, 74, 72, null, 69, null, 72, null, 76, null, 77, null, 76, null, 72, null, 69, 72, 74, null, 71, null, 74, 76, 79, null];
const CTR = [84, null, null, 88, null, null, 86, null, 84, null, null, 81, null, null, 84, null, 81, null, null, 84, null, null, 88, null, 83, null, null, 86, null, null, 91, null];
const mus = { on: false, level: 0, step: 0, next: 0, timer: null, bus: null };
function busOut() {
  const c = AC;
  if (!mus.bus) { mus.bus = c.createGain(); const comp = c.createDynamicsCompressor(); mus.bus.connect(comp); comp.connect(c.destination); }
  mus.bus.gain.value = soundOn ? 0.5 : 0;
  return mus.bus;
}
function nt(m, t0, d, type, vol, lp) {
  const c = AC, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = mf(m);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0005, t0 + d);
  let n = o;
  if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); n = f; }
  n.connect(g); g.connect(mus.bus); o.start(t0); o.stop(t0 + d + 0.05);
}
function nz(t0, d, vol, type, freq) {
  const c = AC, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = NB; f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0005, t0 + d);
  s.connect(f); f.connect(g); g.connect(mus.bus); s.start(t0); s.stop(t0 + d + 0.02);
}
function kick(t0) {
  const c = AC, o = c.createOscillator(), g = c.createGain();
  o.frequency.setValueAtTime(150, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.12);
  g.gain.setValueAtTime(0.55, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
  o.connect(g); g.connect(mus.bus); o.start(t0); o.stop(t0 + 0.32);
}
function playStep(s, t0) {
  const bar = s >> 3, b = s & 7, L = mus.level, ch = CH[bar];
  if (MEL[s] !== null) nt(MEL[s], t0, STEP * 1.9, 'triangle', 0.13);
  if (L >= 1 && b % 2 === 0) nt(ROOT[bar] + [0, 12, 7, 12][b / 2], t0, STEP * 1.7, 'triangle', 0.24, 700);
  if (L >= 2) { if (b === 0 || b === 4 || (b === 7 && bar === 3)) kick(t0); nz(t0, b % 2 ? 0.06 : 0.03, b % 2 ? 0.12 : 0.05, 'highpass', 7000); }
  if (L >= 3) nt(ch[s % 3] + 12, t0, STEP * 0.9, 'square', 0.035, 2600);
  if (L >= 4 && (b === 2 || b === 6)) { nz(t0, 0.18, 0.28, 'bandpass', 1600); nz(t0 + 0.012, 0.12, 0.18, 'bandpass', 2400); }
  if (L >= 5) { if (b === 0) ch.forEach((m) => nt(m + 12, t0, STEP * 7.5, 'sawtooth', 0.028, 1800)); if (CTR[s] !== null) nt(CTR[s], t0, STEP * 1.5, 'sawtooth', 0.05, 3200); }
}
function sched() { if (!mus.on || !AC) return; while (mus.next < AC.currentTime + 0.15) { playStep(mus.step, mus.next); mus.next += STEP; mus.step = (mus.step + 1) % 32; } }
function musicStart() { const c = ac(); if (!c) return; if (!NB) makeNoise(); busOut(); mus.on = true; mus.step = 0; mus.next = c.currentTime + 0.08; clearInterval(mus.timer); mus.timer = setInterval(sched, 25); }
function musicStop() { mus.on = false; clearInterval(mus.timer); mus.timer = null; }

/* ===== particles: crumbs and steam ===== */
const cv = document.getElementById('fx'), ctx = cv.getContext('2d');
let W = 0, H = 0, P = [], raf = null;
const CRUMB = ['#F5B935', '#E39A35', '#C9472D', '#8C4A1E', '#FFE08A', '#D9893A'];
function size() { const d = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); }
size();
addEventListener('resize', size);
function run() { if (!raf) raf = requestAnimationFrame(loop); }
function add(p) { if (P.length < 900) P.push(p); }
function loop() {
  ctx.clearRect(0, 0, W, H);
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    p.vx *= p.dr; p.vy = p.vy * p.dr + p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life--;
    if (p.life <= 0 || p.y > H + 40) { P.splice(i, 1); continue; }
    const a = Math.min(1, p.life / p.fade);
    if (p.k === 'crumb') {
      ctx.globalAlpha = a; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.ellipse(0, 0, p.w / 2, p.h / 2, 0, 0, 7); ctx.fill(); ctx.restore();
    } else {
      p.r += p.sp; ctx.globalAlpha = a * p.o; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  raf = P.length ? requestAnimationFrame(loop) : null;
}
const lim = (n) => (RM ? Math.ceil(n / 5) : n);
function crumbs(x, y, n, sp = 8, ang, spread = 0.8) {
  for (let i = 0; i < lim(n); i++) {
    const a = ang === undefined ? Math.random() * Math.PI * 2 : ang + (Math.random() - 0.5) * spread, v = Math.random() * sp + 1.5;
    add({ k: 'crumb', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2.5, g: 0.28, dr: 0.97, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 70 + Math.random() * 50, fade: 25, c: pick(CRUMB), w: Math.random() * 6 + 4, h: Math.random() * 4 + 3 });
  }
  run();
}
function puff(x, y, c, n, spread = 60) {
  for (let i = 0; i < lim(n); i++) add({ k: 'puff', x: x + (Math.random() - 0.5) * spread, y: y + Math.random() * 10, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random() * 1.2, g: -0.004, dr: 0.99, rot: 0, vr: 0, r: 6 + Math.random() * 8, sp: 0.3, o: 0.6, c, life: 60 + Math.random() * 20, fade: 60 });
  run();
}
function cls(el, c) { if (!el) return; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); }
function praise(w, c) { const p = document.getElementById('praise'); p.innerHTML = `<span class="w">${w}</span>${c ? `<span class="c">${c}</span>` : ''}`; cls(p, 'go'); }
function toast(html) { const e = document.getElementById('toast'); e.innerHTML = html; cls(e, 'go'); }

/* ===== icons ===== */
const ICON_SOUND_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ICON_DEL = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/></svg>';
const HAND = '<svg class="hand" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="14" fill="rgba(201,71,45,.25)"/><circle cx="17" cy="17" r="8" fill="#C9472D" stroke="#FFF6E6" stroke-width="3"/></svg>';

/* ===== game ===== */
let G = null;
const isPad = (m) => m !== 't24';
const TUT_KEY = 'mb:tut24';

function start(mode) {
  ac();
  G = { mode, i: 0, lvl: 0, wrongRun: 0, combo: 0, maxCombo: 0, score: 0, correct: 0, res: [], locked: false, input: '', t0: performance.now(), shell: false, breads: [], seen: new Set(), used: new Set() };
  if (mode === 't24') G.pools = make24Pools();
  mus.level = 0;
  musicStart();
  setupQ();
  render();
  if (mode === 't24' && !load(TUT_KEY, false)) showTut();
}
function setupQ() {
  G.input = ''; G.locked = false; G.qStart = performance.now(); G.bad = null;
  G.q = G.mode === 't24' ? pick24(G.pools, G.lvl, G.used) : genUnique(GENERATORS[G.mode], G.lvl, G.used);
  if (G.mode === 't24') {
    G.orig = G.q.nums.map((n, k) => ({ f: F(n), id: k }));
    G.cards = G.orig.map((c) => ({ ...c }));
    G.sel = null; G.tgt = null; G.hist = []; G.fresh = null; G.hint = '';
  }
}

function render() {
  applyDocument();
  if (!G) return renderHome();
  if (G.done) return renderEnd();
  renderGame();
}

function renderHome() {
  musicStop();
  const total = load('mb:total', 0), shelf = load('mb:shelf', []);
  app.innerHTML = `
  <div class="langs"><a href="../" aria-label="グラタンゲーム"><img src="${wordmarkUrl}" alt="グラタンゲーム" width="132" height="34"></a>
    <div class="seg" role="group" aria-label="Language">${LOCALES.map((l) => `<button data-act="lang" data-l="${l}" aria-pressed="${l === locale}">${LOCALE_LABELS[l]}</button>`).join('')}</div></div>
  <div class="hero"><h1>${t('title')}</h1></div>
  <div class="modes">${Object.entries(MODES).map(([k, m]) => {
    const b = load('mb:best:' + k, 0);
    return `<button class="mode" style="background:${m.fill}" data-mode="${k}"><span class="sym">${m.s}</span><span><b>${t('mode.' + k)}</b><small>${t('mode.' + k + '.d')}</small></span>${b ? `<span class="best">${t('best', { n: b })}</span>` : ''}</button>`;
  }).join('')}</div>
  <section class="shelf"><h2>${t('shelf')}<small>${total ? t('shelf.total', { n: total }) : t('shelf.empty')}</small></h2><div class="pile" id="shelfPile"></div></section>
  <button class="cta2" data-act="sound">${soundOn ? t('sound.on') : t('sound.off')}</button>`;
  drawPile(document.getElementById('shelfPile'), shelf.slice(-28), 7, 44);
}

function renderGame() {
  if (!G.shell) {
    app.innerHTML = '<div class="top" id="top"></div><div class="meta" id="meta"></div><div id="qwrap"></div><div class="bake"><div class="pile" id="pile"></div></div><div id="ctrl"></div>';
    G.shell = true;
    drawPile(document.getElementById('pile'), G.breads, 4, 58);
  }
  const lv = Math.floor(G.lvl / 2) + 1, lvTxt = `<span class="lv">${t('level')} <b>${'●'.repeat(lv)}${'○'.repeat(5 - lv)}</b></span>`;
  document.getElementById('top').innerHTML = `<button class="icon" data-act="home" aria-label="${t('aria.home')}">${ICON_X}</button>
    <div class="pips">${Array.from({ length: ROUNDS }, (_, k) => `<i class="${k < G.res.length ? (G.res[k] ? 'ok' : 'no') : k === G.i ? 'now' : ''}"></i>`).join('')}</div>
    ${G.mode === 't24' ? `<button class="icon" data-act="help" aria-label="${t('aria.help')}">?</button>` : ''}
    <button class="icon" data-act="sound" aria-label="${soundOn ? t('aria.soundOn') : t('aria.soundOff')}">${soundOn ? ICON_SOUND_ON : ICON_SOUND_OFF}</button>`;
  document.getElementById('meta').innerHTML = `<span class="score">${G.score}</span>
    <span class="chips"><span class="chip ${G.combo >= 2 ? 'hot' : ''}" id="combo">${G.combo >= 2 ? t('streak', { n: G.combo }) : t('streak.zero')}</span>
    <span class="chip" title="${t('chip.breads')}">${breadSVG(0)}${G.breads.length}</span></span>`;
  const q = G.q, qw = document.getElementById('qwrap'), ct = document.getElementById('ctrl');
  const qno = `<div class="qno">${t('qno', { n: G.i + 1 })}　${lvTxt}</div>`;
  if (isPad(G.mode)) {
    qw.innerHTML = `<div class="qbox" id="qbox">${qno}<div class="q">${q.t} =</div>
      <div class="ans ${G.bad !== null ? 'bad' : ''}" id="ans">${G.bad !== null ? t('answer', { n: q.ans }) : G.input + '<span class="cur"></span>'}</div></div>`;
    if (!ct.querySelector('.pad')) {
      ct.innerHTML = `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button class="key" data-k="${n}">${n}</button>`).join('')}
        <button class="key alt" data-k="c">${t('clear')}</button><button class="key" data-k="0">0</button><button class="key alt" data-k="del" aria-label="${t('aria.del')}">${ICON_DEL}</button></div>`;
    }
  } else {
    qw.innerHTML = `<div class="qbox" id="qbox" style="padding:14px 12px">${qno}
      <div class="board">${G.cards.map((c, k) => {
        const s = fstr(c.f);
        return `<button class="nc ${G.sel === k ? 'sel' : ''} ${G.tgt === k ? 'tgt' : ''} ${G.fresh === c.id ? 'fresh' : ''} ${s.includes('/') ? 'frac' : ''}" data-c="${k}">${s}</button>`;
      }).join('')}</div>
      ${G.tgt != null ? `<div class="opop" id="opop"><span class="pq">${fstr(G.cards[G.sel].f)} ○ ${fstr(G.cards[G.tgt].f)}</span><div class="row">${OPS.map(([o, s], i) => `<button class="op o${i + 1}" data-o="${o}" aria-label="${s}">${s}</button>`).join('')}</div></div>` : ''}
      ${G.bad ? `<div class="sol">${G.bad} = 24</div>` : ''}</div>`;
    placePop();
    ct.innerHTML = `<div class="hint" id="hint">${G.hint}</div>
      <div class="tools"><button class="tool" data-act="undo">${t('undo')}</button><button class="tool" data-act="reset">${t('reset')}</button><button class="tool" data-act="skip">${t('skip')}</button></div>`;
  }
}

function press(k) {
  if (G.locked) return;
  sTap();
  const ans = String(G.q.ans);
  if (k === 'c') G.input = '';
  else if (k === 'del') G.input = G.input.slice(0, -1);
  else if (G.input.length < 4) G.input += k;
  document.getElementById('ans').innerHTML = G.input + '<span class="cur"></span>';
  if (G.input.length >= ans.length) { if (G.input === ans) right(); else wrong(); }
}

function right() {
  G.locked = true; G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); G.correct++; G.res.push(true);
  G.wrongRun = 0; G.lvl = nextLevel(G.lvl, true, 0);
  const fast = (performance.now() - G.qStart) / 1000 < (G.mode === 't24' ? 20 : 3);
  const gain = score(G.combo, fast);
  G.score += gain;
  mus.level = Math.min(5, Math.ceil(G.correct / 2));
  const tier = tierOf(G.combo), b = { t: tier, r: rnd(-8, 8) };
  G.breads.push(b);
  save('mb:total', load('mb:total', 0) + 1);
  const shelf = load('mb:shelf', []); shelf.push(b); save('mb:shelf', shelf.slice(-28));
  const qb = document.getElementById('qbox').getBoundingClientRect(), src = { x: qb.left + qb.width / 2, y: qb.top + qb.height / 2 };
  renderGame();
  drawPile(document.getElementById('pile'), G.breads, 4, 58, G.breads.length - 1, src);
  celebrate(gain, fast, src);
  if (tier >= 2 && !G.seen.has(tier)) { G.seen.add(tier); setTimeout(() => toast(`${breadSVG(tier)}${t('newBread', { bread: t('bread.' + tier), n: G.combo })}`), 450); }
  setTimeout(next, 1150);
}

function wrong(sol) {
  G.locked = true; G.combo = 0; G.res.push(false); G.bad = sol || ''; sWrong();
  G.wrongRun++;
  const lower = nextLevel(G.lvl, false, G.wrongRun);
  if (lower < G.lvl && G.i < ROUNDS - 1) setTimeout(() => toast(t('easier')), 500);
  G.lvl = lower;
  renderGame();
  const q = document.getElementById('qbox');
  cls(q, 'shake');
  const r = q.getBoundingClientRect();
  puff(r.left + r.width / 2, r.top + 8, '#7A6A60', 10, r.width * 0.5);
  navigator.vibrate?.(120);
  setTimeout(next, G.mode === 't24' ? 2600 : 1500);
}

function next() { G.i++; if (G.i >= ROUNDS) { finish(); return; } setupQ(); renderGame(); }

function celebrate(gain, fast, src) {
  const q = document.getElementById('qbox'), r = q.getBoundingClientRect(), c = G.combo;
  sCorrect(c); cls(q, 'bounce'); cls(document.getElementById('combo'), 'pop');
  puff(r.left + r.width / 2, r.top + 6, '#E2B49A', 8 + Math.min(c, 6) * 2, r.width * 0.6);
  crumbs(src.x, src.y, 26 + c * 8, 6 + Math.min(c, 8));
  if (c >= 5) { crumbs(10, H - 20, 40, 16, -Math.PI / 3, 0.6); crumbs(W - 10, H - 20, 40, 16, (-Math.PI * 2) / 3, 0.6); }
  const words = t(c >= 10 ? 'praise.10' : c >= 7 ? 'praise.7' : c >= 4 ? 'praise.4' : 'praise.1').split('|');
  praise(fast ? t('praise.fast') : pick(words), `+${gain}${c >= 2 ? '　' + t('praise.streak', { n: c }) : ''}`);
}

function finish() {
  G.done = true; G.time = Math.round((performance.now() - G.t0) / 1000);
  const k = 'mb:best:' + G.mode;
  G.prevBest = load(k, 0);
  if (G.score > G.prevBest) save(k, G.score);
  renderEnd();
  window.scrollTo(0, 0);
  if (G.correct >= 7) {
    sWin();
    const n = G.correct === ROUNDS ? 6 : 3;
    for (let i = 0; i < n; i++) setTimeout(() => crumbs(W * (0.15 + Math.random() * 0.7), H * (0.2 + Math.random() * 0.3), 60, 10), i * 220);
    if (G.correct === ROUNDS) setTimeout(() => praise(t('praise.perfect'), t('praise.perfect.c')), 300);
  } else musicStop();
}

function renderEnd() {
  const rec = G.score > G.prevBest && G.score > 0, n = G.breads.length;
  const title = t(n === ROUNDS ? 'end.10' : n >= 7 ? 'end.7' : n >= 4 ? 'end.4' : n ? 'end.1' : 'end.0');
  app.innerHTML = `
  <div class="result"><h2>${title}</h2><div class="muted">${t('end.count', { n })}</div>
    <div class="bake" style="width:100%;min-height:0"><div class="pile" id="endPile"></div></div>
    <div class="big">${G.score}</div><div class="muted">${rec ? t('end.record') : t('end.best', { n: Math.max(G.prevBest, G.score) })}</div></div>
  <div class="stat"><div><b>${G.correct}/${ROUNDS}</b><small>${t('stat.correct')}</small></div><div><b>×${G.maxCombo}</b><small>${t('stat.streak')}</small></div><div><b>${t('seconds', { n: G.time })}</b><small>${t('stat.time')}</small></div></div>
  <button class="cta" data-act="again">${t('again')}</button>
  <button class="cta2" data-act="menu">${t('menu')}</button>`;
  drawPile(document.getElementById('endPile'), G.breads, 4, 64);
}

/* ===== 24: tap or drag one number onto another, then pick a sign ===== */
function placePop() {
  const p = document.getElementById('opop');
  if (!p) return;
  const c = document.querySelector(`.board .nc[data-c="${G.tgt}"]`), q = document.getElementById('qbox');
  if (!c || !q) return;
  let l = c.offsetLeft + c.offsetWidth / 2 - p.offsetWidth / 2;
  l = Math.max(6, Math.min(q.clientWidth - p.offsetWidth - 6, l));
  p.style.left = l + 'px';
  p.style.top = c.offsetTop + (c.offsetHeight - p.offsetHeight) / 2 + 'px';
}
function openPop(i, k) { G.sel = i; G.tgt = k; G.fresh = null; G.popAt = performance.now(); renderGame(); }
function tapCard(k) {
  if (G.locked) return;
  sTap();
  if (G.tgt != null) { G.tgt = null; G.sel = k === G.sel ? null : k; renderGame(); return; }
  if (G.sel === null || k === G.sel) { G.sel = k === G.sel ? null : k; G.fresh = null; renderGame(); return; }
  openPop(G.sel, k);
}
function tapOp(o) { if (G.locked || G.tgt == null || G.sel == null) return; sTap(); combine(G.sel, G.tgt, o); }
function combine(i, k, op) {
  G.tgt = null; G.sel = i;
  const a = G.cards[i], b = G.cards[k], r = fop(a.f, b.f, op);
  if (!r) { G.hint = t('div0'); renderGame(); return; }
  G.hist.push(G.cards.map((c) => ({ ...c })));
  const id = 100 + G.hist.length, eq = `${fstr(a.f)} ${SYM[op]} ${fstr(b.f)} = ${fstr(r)}`;
  G.hint = eq;
  G.cards = G.cards.filter((_, j) => j !== i && j !== k);
  const pos = Math.min(k > i ? k - 1 : k, G.cards.length);
  G.cards.splice(pos, 0, { f: r, id });
  G.sel = G.cards.length > 1 ? pos : null; G.fresh = id;
  if (G.cards.length === 1) {
    if (r.d === 1 && r.n === 24) { renderGame(); right(); return; }
    G.hint = t('not24', { eq });
    renderGame(); sWrong(); cls(document.getElementById('qbox'), 'shake');
    G.locked = true;
    setTimeout(() => { G.locked = false; G.cards = G.orig.map((c) => ({ ...c })); G.hist = []; G.sel = null; G.fresh = null; renderGame(); }, 900);
    return;
  }
  tone(660 + G.hist.length * 110, 0, 0.12, 'triangle', 0.1);
  renderGame();
  const el = document.querySelector('.nc.fresh');
  if (el) { const rr = el.getBoundingClientRect(); crumbs(rr.left + rr.width / 2, rr.top + rr.height / 2, 14, 4); }
}

let drag = null;
app.addEventListener('pointerdown', (e) => {
  const tEl = e.target.closest('.board .nc');
  if (!tEl || !G || G.locked || e.button > 0) return;
  drag = { k: +tEl.dataset.c, el: tEl, x: e.clientX, y: e.clientY, on: false, ghost: null, over: null, rect: tEl.getBoundingClientRect() };
});
function endDrag() { if (!drag) return; drag.ghost?.remove(); drag.el.classList.remove('lift'); drag.over?.classList.remove('over'); }
addEventListener('pointermove', (e) => {
  if (!drag) return;
  if (!drag.on) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    drag.on = true;
    if (G.tgt != null) { G.tgt = null; document.getElementById('opop')?.remove(); }
    const g = drag.el.cloneNode(true);
    g.className = 'nc ghost'; g.removeAttribute('data-c');
    g.style.width = drag.rect.width + 'px'; g.style.height = drag.rect.height + 'px';
    document.body.appendChild(g);
    drag.ghost = g; drag.el.classList.add('lift'); sTap();
  }
  e.preventDefault();
  drag.ghost.style.transform = `translate(${e.clientX - drag.rect.width / 2}px,${e.clientY - drag.rect.height / 2}px) rotate(-4deg) scale(1.06)`;
  const u = document.elementFromPoint(e.clientX, e.clientY), o = u && u.closest('.board .nc');
  const ov = o && o !== drag.el ? o : null;
  if (ov !== drag.over) { drag.over?.classList.remove('over'); ov?.classList.add('over'); drag.over = ov; }
}, { passive: false });
addEventListener('pointerup', () => {
  if (!drag) return;
  const d = drag;
  endDrag(); drag = null;
  if (!d.on) { tapCard(d.k); return; }
  if (d.over) { sTap(); openPop(d.k, +d.over.dataset.c); } else { G.sel = null; renderGame(); }
});
addEventListener('pointercancel', () => { if (drag) { endDrag(); drag = null; if (G) renderGame(); } });
document.addEventListener('click', (e) => {
  if (!G || G.tgt == null || performance.now() - (G.popAt || 0) < 350) return;
  if (e.target.closest('.opop,.board .nc')) return;
  G.tgt = null; G.sel = null; renderGame();
});

/* ===== tutorial ===== */
function showTut() {
  closeTut();
  const el = document.createElement('div');
  el.className = 'tut'; el.id = 'tut';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'tutTitle');
  el.innerHTML = `<div class="tut-card"><h2 id="tutTitle">${t('tut.title')}</h2>
    <div class="demo" aria-hidden="true"><div class="d b">8</div><div class="d r">24</div><div class="d a">3</div>
      <div class="pp"><span>+</span><span>−</span><span class="hit">×</span><span>÷</span></div>${HAND}</div>
    <ol><li>${t('tut.1')}</li><li>${t('tut.2')}</li><li>${t('tut.3')}</li></ol>
    <button class="cta" data-tut="ok">${t('tut.ok')}</button></div>`;
  document.body.appendChild(el);
  el.querySelector('button').focus();
  el.addEventListener('click', (e) => { if (e.target === el || e.target.closest('[data-tut]')) closeTut(); });
}
function closeTut() {
  const el = document.getElementById('tut');
  if (!el) return;
  el.remove();
  save(TUT_KEY, true);
  if (G && !G.done) G.qStart = performance.now();
}

/* ===== events ===== */
app.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.mode) start(d.mode);
  else if (d.k !== undefined) press(d.k);
  else if (d.c !== undefined) { if (e.detail === 0) tapCard(+d.c); }
  else if (d.o) tapOp(d.o);
  else if (d.act === 'lang') { setLocale(d.l); render(); }
  else if (d.act === 'help') showTut();
  else if (d.act === 'sound') { soundOn = !soundOn; save('mb:sound', soundOn); if (mus.bus) mus.bus.gain.value = soundOn ? 0.5 : 0; render(); }
  else if (d.act === 'home' || d.act === 'menu') { G = null; mus.level = 0; render(); }
  else if (d.act === 'again') start(G.mode);
  else if (d.act === 'undo' && !G.locked && G.hist.length) { G.cards = G.hist.pop(); G.sel = null; G.tgt = null; G.fresh = null; G.hint = ''; renderGame(); }
  else if (d.act === 'reset' && !G.locked) { G.cards = G.orig.map((c) => ({ ...c })); G.hist = []; G.sel = null; G.tgt = null; G.fresh = null; G.hint = ''; renderGame(); }
  else if (d.act === 'skip' && !G.locked) { G.cards = G.orig.map((c) => ({ ...c })); G.sel = null; G.tgt = null; G.hint = ''; wrong(G.q.sol); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.getElementById('tut')) { closeTut(); return; }
  if (!G || G.done || !isPad(G.mode) || document.getElementById('tut')) return;
  if (/^[0-9]$/.test(e.key)) press(e.key);
  else if (e.key === 'Backspace') press('del');
});
document.addEventListener('visibilitychange', () => { if (document.hidden) musicStop(); else if (G && !G.done && AC) musicStart(); });
render();
