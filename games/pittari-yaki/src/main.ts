import '@fontsource/dela-gothic-one';
import '@fontsource/zen-maru-gothic/700.css';
import '@fontsource/zcool-qingke-huangyou';
import '@fontsource/noto-sans-sc/700.css';
import './style.css';
import {
  choose,
  draw,
  GOAL,
  legalChoices,
  newGame,
  plateSum,
  previewAdd,
  previewCool,
  TARGET,
  type Card,
  type Choice,
  type GameEvent,
  type Plate,
  type State,
} from './engine';
import { aiChoose } from './ai';
import { heatArt } from './art';
import * as sound from './sound';
import { burst, confetti, flyCard, rectsOf, slideFrom, snapshot, turnTable, type BurstKind } from './fx';
import { applyDocument, LOCALE_LABELS, LOCALES, locale, setLocale, t, type Key } from './i18n';

type SeatMode = 'human' | 'ai' | 'off';
interface SeatCfg {
  mode: SeatMode;
  name: string;
}

const SEATS_KEY = 'pittari:seats';
const BEST_KEY = 'pittari:best';
const app = document.getElementById('app')!;

let seats: SeatCfg[] = loadSeats();
let game: State | null = null;
let view = 0;
let busy = false;
let rulesOpen = false;
let quitAsk = false;
let showResult = false;
let toast: { text: string; id: number } | null = null;
let flashes = new Map<string, { cls: string; text: string }>();
let drawnFresh = false;
let lastCard: Card | null = null;
let stamp: { text: string; target: number } | null = null;
let landed: string | null = null;
let banner: string | null = null;
let shownScores: number[] = [];
let seatOf: number[] = [];
const tint = (pi: number) => `tint-${seatOf[pi] ?? pi}`;
let soloBest: number | null = readBest();
let newRecord = false;
let timer = 0;
let toastTimer = 0;

function loadSeats(): SeatCfg[] {
  try {
    const saved = JSON.parse(localStorage.getItem(SEATS_KEY) ?? 'null');
    if (Array.isArray(saved) && saved.length === 4) return saved;
  } catch {}
  return [
    { mode: 'human', name: '' },
    { mode: 'ai', name: '' },
    { mode: 'off', name: '' },
    { mode: 'off', name: '' },
  ];
}

function saveSeats() {
  try {
    localStorage.setItem(SEATS_KEY, JSON.stringify(seats));
  } catch {}
}

function readBest(): number | null {
  try {
    const v = Number(localStorage.getItem(BEST_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

function defaultName(i: number, mode: SeatMode): string {
  if (mode === 'ai') {
    const aiIndex = seats.slice(0, i + 1).filter(s => s.mode === 'ai').length;
    return t(`name.ai.${aiIndex}` as Key);
  }
  return t('name.human', { n: i + 1 });
}

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

const ICON = {
  flame: '<svg viewBox="0 0 24 24" class="ic"><path d="M12 2c.8 3.6 5.5 5.2 5.5 11a5.5 5.5 0 0 1-11 0c0-2.6 1.4-4.2 2.3-5.4.4 1.6 1.3 2.6 2.4 3.1C11.5 8.3 11 5 12 2z"/></svg>',
  snow: '<svg viewBox="0 0 24 24" class="ic line"><path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/></svg>',
  cards: '<svg viewBox="0 0 24 24" class="ic line"><rect x="3" y="5" width="10" height="14" rx="2" transform="rotate(-12 8 12)"/><rect x="11" y="4" width="10" height="14" rx="2" transform="rotate(10 16 11)"/></svg>',
  cheese: '<svg viewBox="0 0 24 24" class="ic"><path d="M2 20v-8L17 4c3 1.3 5 4 5 7.5V20z"/><circle cx="8" cy="15.5" r="2" class="hole"/><circle cx="15.5" cy="11" r="1.5" class="hole"/><circle cx="17" cy="16.5" r="1.2" class="hole"/></svg>',
  robot: '<svg viewBox="0 0 24 24" class="ic"><rect x="4" y="8" width="16" height="12" rx="3"/><circle cx="9" cy="14" r="1.6" class="hole"/><circle cx="15" cy="14" r="1.6" class="hole"/><rect x="11" y="3" width="2" height="5"/></svg>',
  person: '<svg viewBox="0 0 24 24" class="ic"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z"/></svg>',
};

function toneOf(v: number): string {
  if (v === 0) return 't0';
  if (v <= 4) return 'tlow';
  if (v <= 9) return 'tmid';
  if (v < TARGET) return 'thot';
  return 't12';
}

function cardHTML(c: Card, extra = ''): string {
  if (c.kind === 'num') {
    return `<div class="card num ${toneOf(c.v)} ${extra}"><span class="ix">${c.v}</span><span class="big">${c.v}</span>${heatArt(c.v)}</div>`;
  }
  const spec = {
    fire: { icon: ICON.flame, big: '+3', name: t('card.fire') },
    cool: { icon: ICON.snow, big: '−3', name: t('card.cool') },
    extra: { icon: ICON.cards, big: '+2', name: t('card.extra') },
    cheese: { icon: ICON.cheese, big: '×2', name: t('card.cheese') },
  }[c.kind];
  return `<div class="card act ${c.kind} ${extra}"><span class="top-ic">${spec.icon}</span><span class="big">${spec.big}</span><span class="tag">${spec.name}</span></div>`;
}

function isHumanTurn(): boolean {
  return !!game && game.phase !== 'over' && !game.players[game.actor].ai && !busy;
}

function hintFor(p: Plate, pi: number, idx: number): { cls: string; text: string; legal: boolean } {
  const g = game!;
  const legal = legalChoices(g).some(
    c => (c.kind === 'plate' && pi === g.actor && c.plate === idx) || (c.kind === 'target' && c.player === pi && c.plate === idx),
  );
  const card = g.drawn;
  if (!legal || !card) return { cls: '', text: '', legal: false };
  if (g.phase === 'place' && card.kind === 'num') return outcomeHint(previewAdd(p, card.v, 1));
  if (g.phase === 'fire') return outcomeHint(previewAdd(p, 3, 0));
  if (g.phase === 'cool') return { cls: 'cool', text: `→${previewCool(p)}`, legal: true };
  if (g.phase === 'cheese') return { cls: 'cheese', text: '×2', legal: true };
  return { cls: '', text: '', legal };
}

function outcomeHint(o: ReturnType<typeof previewAdd>): { cls: string; text: string; legal: boolean } {
  if (o.kind === 'serve') return { cls: 'good', text: `${t('card.pittari')} +${o.points}`, legal: true };
  if (o.kind === 'burn') return { cls: 'bad', text: t('hint.burn'), legal: true };
  return { cls: '', text: `→${o.sum}`, legal: true };
}

function cheeseBadge(small = false): string {
  return `<span class="cheese-badge${small ? ' s' : ''}">${ICON.cheese}<b>×2</b></span>`;
}

function plateHTML(p: Plate, pi: number, idx: number): string {
  const g = game!;
  const h = hintFor(p, pi, idx);
  const clickable = h.legal && isHumanTurn();
  const sum = plateSum(p);
  const flash = flashes.get(`${pi}-${idx}`);
  const isLanded = landed === `${pi}-${idx}`;
  const minis = p.cards.map((v, k) => `<span class="mini ${toneOf(v)} ${isLanded && k === p.cards.length - 1 ? 'new' : ''}">${v}</span>`).join('');
  const heat = p.heat > 0 ? `<span class="heat up">${ICON.flame}+${p.heat}</span>` : p.heat < 0 ? `<span class="heat down">${ICON.snow}${p.heat}</span>` : '';
  return `<button class="plate ${h.legal ? `legal ph-${g.phase}` : ''} ${h.cls === 'good' ? 'will-serve' : ''} ${flash ? flash.cls : ''}" data-act="plate" data-p="${pi}" data-i="${idx}" data-plate="${pi}-${idx}" ${clickable ? '' : 'disabled'} aria-label="${idx + 1}: ${sum}/12">
    ${h.text ? `<span class="hint ${h.cls}">${h.text}</span>` : ''}
    ${p.cheese ? cheeseBadge() : ''}
    <span class="sum ${sum === 0 && !p.cards.length ? 'zero' : ''}">${sum}<small>/12</small></span>
    <span class="minis">${minis || `<em>${t('hint.empty')}</em>`}${heat}</span>
    <span class="key">${idx + 1}</span>
    ${flash ? `<span class="float ${flash.cls}">${flash.text}</span>` : ''}
  </button>`;
}

function miniPlateHTML(p: Plate, pi: number, idx: number): string {
  const g = game!;
  const sum = plateSum(p);
  const flash = flashes.get(`${pi}-${idx}`);
  const cls = `mp ${p.cheese ? 'has-cheese' : ''} ${flash ? flash.cls : ''}`;
  const inner = `${p.cards.length || p.heat ? sum : '·'}${p.cheese ? cheeseBadge(true) : ''}${flash ? `<span class="float s ${flash.cls}">${flash.text}</span>` : ''}`;
  if (g.phase === 'fire') {
    const h = hintFor(p, pi, idx);
    const clickable = h.legal && isHumanTurn();
    return `<button class="${cls} target ${h.cls}" data-act="target" data-p="${pi}" data-i="${idx}" data-plate="${pi}-${idx}" ${clickable ? '' : 'disabled'} title="${h.text}">${inner}</button>`;
  }
  return `<span class="${cls}" data-plate="${pi}-${idx}">${inner}</span>`;
}

function ptsHTML(pi: number): string {
  const sc = game!.players[pi].score;
  return `<b class="pts ${sc > (shownScores[pi] ?? 0) ? 'bump' : ''}">${sc}<small>/${GOAL}</small></b>`;
}

const NOTE_IC = '<svg viewBox="0 0 24 24" class="ic"><path d="M9 17.5a3 3 0 1 1-2-2.83V5l12-2.5v12a3 3 0 1 1-2-2.83V6.9L9 8.6z"/></svg>';
const SPEAKER_IC = '<svg viewBox="0 0 24 24" class="ic"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

function soundToggles(): string {
  return `<button class="snd ${sound.musicOn ? '' : 'off'}" data-act="music" aria-pressed="${sound.musicOn}" aria-label="${t('sound.music')}" title="${t('sound.music')}">${NOTE_IC}</button><button class="snd ${sound.sfxOn ? '' : 'off'}" data-act="sfx" aria-pressed="${sound.sfxOn}" aria-label="${t('sound.sfx')}" title="${t('sound.sfx')}">${SPEAKER_IC}</button>`;
}

function avatar(ai: boolean): string {
  return `<span class="who-ic">${ai ? ICON.robot : ICON.person}</span>`;
}

function bar(score: number): string {
  const pct = Math.min(100, (score / GOAL) * 100);
  return `<span class="bar ${score >= GOAL - 4 ? 'near' : ''}"><i style="width:${pct}%"></i></span>`;
}

function oppHTML(pi: number): string {
  const g = game!;
  const pl = g.players[pi];
  const pickable = g.phase === 'extra' && isHumanTurn();
  const done = isDoneThisRound(pi);
  const body = `
    <span class="opp-head">${avatar(pl.ai)}<span class="nm">${esc(pl.name)}</span>${ptsHTML(pi)}</span>
    ${bar(pl.score)}
    <span class="opp-foot"><span class="mps">${pl.plates.map((p, i) => miniPlateHTML(p, pi, i)).join('')}</span><span class="burns">${ICON.flame}×${pl.burns}</span></span>`;
  if (g.phase === 'extra') {
    return `<button class="opp ${tint(pi)} ${pickable ? 'pick' : ''}" data-act="player" data-p="${pi}" data-player="${pi}" ${pickable ? '' : 'disabled'}>${body}</button>`;
  }
  return `<div data-player="${pi}" class="opp ${tint(pi)} ${pi === g.actor ? 'acting' : ''} ${done ? 'done' : ''} ${stamp?.target === pi ? 'got-extra' : ''}">${body}</div>`;
}

function isDoneThisRound(pi: number): boolean {
  const g = game!;
  return pi < g.turn;
}

function promptHTML(): string {
  const g = game!;
  const pl = g.players[g.actor];
  const top = g.extra[g.extra.length - 1];
  const who =
    top && top.player === g.actor
      ? t('turn.extra', { name: esc(pl.name), n: top.left + (g.phase === 'draw' ? 1 : 0) })
      : t('turn', { name: `<b>${esc(pl.name)}</b>` });
  let sub = '';
  if (busy) sub = '';
  else if (pl.ai) sub = t('prompt.ai');
  else if (g.phase === 'draw') sub = t('prompt.draw');
  else if (g.phase === 'fire') sub = t('prompt.fire') + (g.players.length > 1 ? `<small>${t('prompt.fire.sub')}</small>` : '');
  else if (g.phase === 'cool') sub = t('prompt.cool');
  else if (g.phase === 'cheese') sub = t('prompt.cheese');
  else if (g.phase === 'extra') sub = t('prompt.extra');
  return `<div class="prompt"><div class="who">${who}</div><div class="sub">${sub}</div></div>`;
}

function renderPlay(): string {
  const g = game!;
  const me = g.players[view];
  const others: number[] = [];
  for (let k = 1; k < g.players.length; k++) others.push((view + k) % g.players.length);
  const canDraw = g.phase === 'draw' && isHumanTurn();
  const solo = g.players.length === 1;
  const meBtn = g.phase === 'extra' && isHumanTurn() && view === g.actor;
  const footInner = `${avatar(me.ai)}<span class="nm">${esc(me.name)}</span>${ptsHTML(view)}${bar(me.score)}<span class="burns">${ICON.flame}×${me.burns}</span>`;
  return `
  <div class="play ${solo ? 'solo' : ''} n${g.players.length}">
    <header class="topbar">
      <span class="mini-logo">${t('title')}</span>
      <span class="top-right">${soundToggles()}<button class="ghost" data-act="quit">${t('quit')}</button></span>
    </header>
    ${others.length ? `<section class="opps">${others.map(oppHTML).join('')}</section>` : ''}
    <section class="mid">
      <button class="deck ${canDraw ? 'ready' : ''}" data-act="draw" ${canDraw ? '' : 'disabled'} aria-label="${t('prompt.draw')}">
        <span class="back"><span>${t('title')}</span></span>
        <span class="left">${t('deck', { n: g.deck.length })}</span>
      </button>
      <div class="slot">${g.drawn ? cardHTML(g.drawn, drawnFresh ? 'fresh' : '') : busy && lastCard && lastCard.kind !== 'num' ? cardHTML(lastCard, `${drawnFresh ? 'fresh' : ''} used`) : '<div class="card ghost-card"></div>'}</div>
      ${promptHTML()}
    </section>
    <section class="plates">${me.plates.map((p, i) => plateHTML(p, view, i)).join('')}</section>
    ${meBtn ? `<button class="me ${tint(view)} pick" data-act="player" data-p="${view}" data-player="${view}">${footInner}<span class="me-tag">${t('me')}</span></button>` : `<footer data-player="${view}" class="me ${tint(view)} ${stamp?.target === view ? 'got-extra' : ''}">${footInner}</footer>`}
    ${banner ? `<div class="turn-banner"><span class="${tint(view)}">${banner}</span></div>` : ''}
    ${stamp ? `<div class="stamp"><span class="stamp-ic">${ICON.cards}</span>${stamp.text}</div>` : ''}
    ${toast ? `<div class="toast" data-id="${toast.id}">${toast.text}</div>` : ''}
    ${showResult ? resultHTML() : ''}
    ${quitAsk ? `<div class="overlay" data-act="quit-no"><div class="panel quit"><h2>${t('quit.confirm')}</h2><div class="btns"><button class="btn primary" data-act="quit-yes">${t('quit')}</button><button class="btn" data-act="quit-no">${t('quit.cancel')}</button></div></div></div>` : ''}
  </div>`;
}

function resultHTML(): string {
  const g = game!;
  if (g.players.length === 1) {
    return `<div class="overlay"><div class="panel result">
      <h2>${t('result.solo', { n: g.turns })}</h2>
      ${newRecord ? `<p class="record">${t('result.best')}</p>` : soloBest ? `<p>${t('result.prev', { n: soloBest })}</p>` : ''}
      <div class="btns"><button class="btn primary" data-act="again">${t('again')}</button><button class="btn" data-act="menu">${t('menu')}</button></div>
    </div></div>`;
  }
  const order = g.players.map((p, i) => ({ p, i })).sort((a, b) => b.p.score - a.p.score);
  return `<div class="overlay"><div class="panel result">
    <h2>${t('result.win', { name: esc(g.players[g.winner!].name) })}</h2>
    <ol class="rank">${order.map(({ p, i }) => `<li class="${tint(i)} ${i === g.winner ? 'win' : ''}">${avatar(p.ai)}<span class="nm">${esc(p.name)}</span><b>${t('result.pts', { n: p.score })}</b></li>`).join('')}</ol>
    <div class="btns"><button class="btn primary" data-act="again">${t('again')}</button><button class="btn" data-act="menu">${t('menu')}</button></div>
  </div></div>`;
}

function renderSetup(): string {
  const rows = seats
    .map((s, i) => {
      const modes: SeatMode[] = i === 0 ? ['human', 'ai'] : ['human', 'ai', 'off'];
      return `<div class="seat ${s.mode} tint-${i}">
        <span class="no">${i + 1}</span>
        <span class="seg">${modes.map(m => `<button data-act="seat" data-i="${i}" data-mode="${m}" aria-pressed="${s.mode === m}">${t(`seat.${m}` as Key)}</button>`).join('')}</span>
        <input data-act="name" data-i="${i}" maxlength="10" value="${esc(s.name)}" placeholder="${esc(defaultName(i, s.mode))}" aria-label="${t('seat.name')} ${i + 1}" ${s.mode === 'off' ? 'disabled' : ''}>
      </div>`;
    })
    .join('');
  return `
  <div class="setup">
    <div class="deco">${cardHTML({ kind: 'num', v: 12 }, 'd1')}${cardHTML({ kind: 'cheese' }, 'd2')}${cardHTML({ kind: 'num', v: 5 }, 'd3')}${cardHTML({ kind: 'fire' }, 'd4')}</div>
    <h1 class="logo">${t('title')}</h1>
    <p class="tagline">${t('tagline')}</p>
    <div class="seats">${rows}</div>
    <div class="btns"><button class="btn primary big" data-act="start">${t('start')}</button><button class="btn" data-act="rules">${t('rules')}</button></div>
    <div class="langs">${soundToggles()}<span class="sep"></span>${LOCALES.map(l => `<button data-act="lang" data-l="${l}" aria-pressed="${l === locale}">${LOCALE_LABELS[l]}</button>`).join('')}</div>
  </div>`;
}

function rulesHTML(): string {
  const cards: { c: Card; k: Key }[] = [
    { c: { kind: 'fire' }, k: 'card.fire.desc' },
    { c: { kind: 'cool' }, k: 'card.cool.desc' },
    { c: { kind: 'extra' }, k: 'card.extra.desc' },
    { c: { kind: 'cheese' }, k: 'card.cheese.desc' },
  ];
  return `<div class="overlay" data-act="close-rules"><div class="panel rules">
    <h2>${t('rules')}</h2>
    <ol>${(['rule.1', 'rule.2', 'rule.3', 'rule.4'] as Key[]).map(k => `<li>${t(k)}</li>`).join('')}</ol>
    <div class="rule-cards">${cards.map(({ c, k }) => `<div class="rc">${cardHTML(c, 'sm')}<p>${t(k)}</p></div>`).join('')}</div>
    <div class="btns"><button class="btn primary" data-act="close-rules">${t('close')}</button></div>
  </div></div>`;
}

function render() {
  app.innerHTML = (game ? renderPlay() : renderSetup()) + (rulesOpen ? rulesHTML() : '');
  drawnFresh = false;
  banner = null;
  if (game) shownScores = game.players.map(p => p.score);
}

function showToast(text: string) {
  toast = { text, id: Date.now() };
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast = null;
    app.querySelector('.toast')?.remove();
  }, 1600);
}

function absorb(ev: GameEvent[]) {
  const g = game!;
  for (const e of ev) {
    if (e.type === 'draw') sound.play('flip');
    else if (e.type === 'place' && e.card.kind === 'num') sound.play('place', { value: e.card.v, delay: 300 });
    else if (e.type === 'serve') sound.play(e.cheese ? 'serveCheese' : 'serve', { delay: 430 });
    else if (e.type === 'burn') sound.play('burn', { delay: 430 });
    else if (e.type === 'fire') sound.play('fire', { delay: 200 });
    else if (e.type === 'cool') sound.play('cool', { delay: 250 });
    else if (e.type === 'cheese' && e.plate !== null) sound.play('cheese', { delay: 300 });
    else if (e.type === 'extra') sound.play('extra', { delay: 350 });
    else if (e.type === 'reshuffle') sound.play('flip', { delay: 120 });
    if (e.type === 'place') landed = `${e.player}-${e.plate}`;
    else if (e.type === 'serve') flashes.set(`${e.player}-${e.plate}`, { cls: 'served', text: `+${e.points}` });
    else if (e.type === 'burn') flashes.set(`${e.player}-${e.plate}`, { cls: 'burnt', text: t('toast.burn') });
    else if (e.type === 'reshuffle') showToast(t('toast.reshuffle'));
    else if (e.type === 'cheese' && e.plate === null) showToast(t('toast.nocheese'));
    else if (e.type === 'fire' && e.player !== e.by) showToast(t('toast.fire', { by: esc(g.players[e.by].name), name: esc(g.players[e.player].name) }));
    else if (e.type === 'extra') stamp = { text: t('stamp.extra', { name: esc(g.players[e.player].name) }), target: e.player };
  }
}

function afterTurnChange(ev: GameEvent[]) {
  const hold = stamp ? 1800 : flashes.size ? 1000 : 450;
  busy = true;
  render();
  timer = window.setTimeout(() => {
    busy = false;
    flashes = new Map();
    stamp = null;
    lastCard = null;
    landed = null;
    const g = game!;
    const prev = view;
    view = g.actor;
    const humans = g.players.filter(p => !p.ai).length;
    if (g.phase !== 'over' && view !== prev && humans > 1 && !g.players[view].ai) banner = t('turn', { name: esc(g.players[view].name) });
    if (g.phase === 'over') finish();
    const passing = view !== prev && g.phase !== 'over';
    const oldRects = passing ? rectsOf(app, 'data-player') : null;
    const oldPlates = passing ? snapshot(app.querySelector('.plates')) : null;
    render();
    if (passing && oldRects) {
      sound.play('pass');
      slideFrom(app, 'data-player', oldRects);
      const play = app.querySelector('.play')!.getBoundingClientRect();
      turnTable(oldPlates, app.querySelector<HTMLElement>('.plates'), { x: play.left + play.width / 2, y: play.top + play.height * 0.42 });
    }
    if (showResult) {
      sound.duckMusic(true);
      sound.play('win');
      if (g.players[g.winner!] && !g.players[g.winner!].ai) confetti();
    }
    schedule();
  }, ev.some(e => e.type === 'win') ? 1300 : hold);
}

function doDraw() {
  const g = game!;
  const ev = draw(g);
  lastCard = g.drawn ?? ev.flatMap(e => (e.type === 'draw' ? [e.card] : []))[0] ?? null;
  absorb(ev);
  drawnFresh = true;
  if (g.phase === 'draw' || g.phase === 'over') afterTurnChange(ev);
  else {
    render();
    schedule();
  }
}

function doChoose(c: Choice) {
  const g = game!;
  const actor = g.actor;
  const from = snapshot(app.querySelector('.slot .card'));
  const kind = g.drawn?.kind;
  const ev = choose(g, c);
  absorb(ev);
  afterTurnChange(ev);
  const target =
    c.kind === 'player'
      ? app.querySelector(`[data-player="${c.player}"]`)
      : app.querySelector(`[data-plate="${c.kind === 'target' ? c.player : actor}-${c.plate}"]`);
  flyCard(from, target);
  const land = 330;
  if (kind === 'fire' || kind === 'cool' || kind === 'cheese') burst(target, kind as BurstKind, land);
  for (const e of ev) {
    if (e.type === 'serve' || e.type === 'burn') burst(app.querySelector(`[data-plate="${e.player}-${e.plate}"]`), e.type, land + 120);
  }
}

function finish() {
  const g = game!;
  showResult = true;
  if (g.players.length === 1 && !g.players[0].ai) {
    newRecord = soloBest === null || g.turns < soloBest;
    if (newRecord) {
      soloBest = g.turns;
      try {
        localStorage.setItem(BEST_KEY, String(g.turns));
      } catch {}
    }
  }
}

function schedule() {
  clearTimeout(timer);
  const g = game;
  if (!g || g.phase === 'over' || busy) return;
  if (!g.players[g.actor].ai) return;
  timer = window.setTimeout(() => {
    if (g.phase === 'draw') doDraw();
    else doChoose(aiChoose(g));
  }, g.phase === 'draw' ? 550 : 850);
}

function startGame() {
  sound.startMusic();
  const used = seats.map((s, i) => ({ s, i })).filter(({ s }) => s.mode !== 'off');
  seatOf = used.map(({ i }) => i);
  const active = used
    .map(({ s, i }) => ({ name: s.name.trim() || defaultName(i, s.mode), ai: s.mode === 'ai' }));
  game = newGame(active, (Date.now() ^ (Math.random() * 1e9)) | 0);
  view = 0;
  busy = false;
  showResult = false;
  newRecord = false;
  flashes = new Map();
  toast = null;
  render();
  schedule();
}

function toMenu() {
  clearTimeout(timer);
  game = null;
  showResult = false;
  render();
}

function pickPlate(pi: number, idx: number) {
  const g = game;
  if (!g || !isHumanTurn()) return;
  const c: Choice | undefined = legalChoices(g).find(
    c => (c.kind === 'plate' && pi === g.actor && c.plate === idx) || (c.kind === 'target' && c.player === pi && c.plate === idx),
  );
  if (c) doChoose(c);
}

app.addEventListener('click', e => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'music') {
    sound.setMusic(!sound.musicOn);
    render();
    return;
  }
  if (act === 'sfx') {
    sound.setSfx(!sound.sfxOn);
    sound.play('tap');
    render();
    return;
  }
  if (!['plate', 'target', 'draw', 'player'].includes(act ?? '')) sound.play('tap');
  if (act === 'close-rules') {
    if (el.classList.contains('overlay') && e.target !== el) return;
    rulesOpen = false;
    render();
  } else if (act === 'rules') {
    rulesOpen = true;
    render();
  } else if (act === 'lang') {
    setLocale(el.dataset.l as (typeof LOCALES)[number]);
    render();
  } else if (act === 'seat') {
    const i = Number(el.dataset.i);
    seats[i].mode = el.dataset.mode as SeatMode;
    saveSeats();
    render();
  } else if (act === 'start') startGame();
  else if (act === 'again') startGame();
  else if (act === 'menu') toMenu();
  else if (act === 'quit') {
    if (showResult) toMenu();
    else {
      quitAsk = true;
      render();
    }
  } else if (act === 'quit-yes') {
    quitAsk = false;
    toMenu();
  } else if (act === 'quit-no') {
    if (el.classList.contains('overlay') && e.target !== el) return;
    quitAsk = false;
    render();
  } else if (act === 'draw') {
    if (isHumanTurn() && game!.phase === 'draw') doDraw();
  } else if (act === 'plate' || act === 'target') pickPlate(Number(el.dataset.p), Number(el.dataset.i));
  else if (act === 'player') {
    const g = game;
    if (g && isHumanTurn() && g.phase === 'extra') doChoose({ kind: 'player', player: Number(el.dataset.p) });
  }
});

app.addEventListener('input', e => {
  const el = e.target as HTMLInputElement;
  if (el.dataset.act === 'name') {
    seats[Number(el.dataset.i)].name = el.value;
    saveSeats();
  }
});

window.addEventListener('keydown', e => {
  if (!game || quitAsk || (e.target as HTMLElement).tagName === 'INPUT') return;
  if ((e.key === ' ' || e.key === 'Enter') && isHumanTurn() && game.phase === 'draw') {
    e.preventDefault();
    doDraw();
  } else if (['1', '2', '3'].includes(e.key)) pickPlate(game.actor, Number(e.key) - 1);
});

applyDocument();
render();

window.addEventListener(
  'pointerdown',
  () => {
    sound.unlock();
    sound.startMusic();
  },
  { once: true },
);
window.addEventListener('keydown', () => sound.unlock(), { once: true });

app.addEventListener('mouseover', e => {
  const el = (e.target as HTMLElement).closest('.plate:not(:disabled), .mp.target:not(:disabled), .deck:not(:disabled), .opp.pick, .me.pick');
  if (el && !el.contains(e.relatedTarget as Node | null) && matchMedia('(hover: hover)').matches) sound.play('hover');
});
const stop = (e: Event) => e.preventDefault();
for (const type of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(type, stop, { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
window.addEventListener('wheel', e => { if (e.ctrlKey || e.metaKey) e.preventDefault(); }, { passive: false });
window.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['+', '=', '-', '_', '0'].includes(e.key)) e.preventDefault();
});

if (import.meta.env.DEV) Object.assign(window, { __pittari: { get game() { return game; } } });
