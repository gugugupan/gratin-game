import {
  MAPS, TROOPS, TROOP_IDS, apply, canDraw, chooseAction, hqOf, legalActions, legalTargets, newGame, other,
  type Action, type Difficulty, type GameState, type MapDef, type MapInfo, type Side, type Tile, type TroopId,
} from './engine';
import * as THREE from 'three';
import lobbyArt from './assets/lobby.webp';
import { LOCALES, LOCALE_LABELS, applyStatic, locale, setLocale, t, type Key, type Locale } from './i18n';
import { themeFor } from './render/board';
import { Stage } from './render/scene';
import { BoardView } from './render/view';

type Mode = 'ai' | 'local';
type TipId = 'turn' | 'place' | 'crush' | 'effect' | 'region' | 'hq';

const TIPS_KEY = 'toy-legion:tips';
const nameOf = (troop: TroopId) => t(`troop.${troop}` as Key);
const effectOf = (troop: TroopId) => t(`effect.${troop}` as Key);
const CARD_ART = import.meta.glob<string>('./assets/cards/*.webp', { eager: true, import: 'default' });
const cardArt = (troop: TroopId, side: Side) => CARD_ART[`./assets/cards/${troop}-${side}.webp`];
const label = (t: TroopId) => (TROOPS[t].strength === 'joker' ? '★' : String(TROOPS[t].strength));
const order = (t: Tile) => (TROOPS[t.troop].strength === 'joker' ? 8 : (TROOPS[t.troop].strength as number));
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const seed = () => (Math.random() * 2 ** 31) | 0;
const center = (el: Element): [number, number] => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fly(from: [number, number], to: [number, number], cls: string, html = '', delay = 0, ms = 560): Promise<void> {
  if (reduceMotion) return Promise.resolve();
  const el = document.createElement('div');
  el.className = `fly ${cls}`;
  el.innerHTML = html;
  $('app').append(el);
  const [x0, y0] = from, [x1, y1] = to;
  const midX = (x0 + x1) / 2, midY = Math.min(y0, y1) - 70;
  const anim = el.animate([
    { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(.4) rotate(-12deg)`, opacity: 0 },
    { transform: `translate(${midX}px, ${midY}px) translate(-50%, -50%) scale(1.1) rotate(6deg)`, opacity: 1, offset: .5 },
    { transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%) scale(.8) rotate(0deg)`, opacity: 1 },
  ], { duration: ms, delay, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' });
  return anim.finished.then(() => { el.remove(); });
}

const cardHtml = (troop: TroopId, side: Side) =>
  `<img src="${cardArt(troop, side)}" alt="" draggable="false"><b>${label(troop)}</b><span>${nameOf(troop)}</span>`;

function demoState(map: MapDef): GameState {
  let s = newGame({ seed: seed(), map });
  for (let i = 0; i < 10; i++) {
    const next = apply(s, chooseAction(s, 'easy'));
    if (next.winner) break;
    s = next;
  }
  return s;
}

function drawMapThumb(canvas: HTMLCanvasElement, map: MapDef) {
  const W = 180, H = 240, k = W / map.width;
  canvas.width = W; canvas.height = H;
  const x = canvas.getContext('2d')!;
  const theme = themeFor(map.id);
  x.fillStyle = theme.grass; x.fillRect(0, 0, W, H);
  if (theme.river !== undefined) { x.fillStyle = '#4fb6d8'; x.fillRect(0, theme.river * k * H / (map.height * k) - 9, W, 18); }
  const P = ([px, py]: [number, number]): [number, number] => [px * k, py * H / map.height];
  x.lineCap = 'round';
  x.strokeStyle = theme.dirt[1]; x.lineWidth = 5;
  for (const [a, b] of map.edges) { x.beginPath(); x.moveTo(...P(map.nodes[a].pos)); x.lineTo(...P(map.nodes[b].pos)); x.stroke(); }
  for (const n of Object.values(map.nodes)) {
    const [px, py] = P(n.pos);
    const s = n.type === 'hq' ? 22 : 12;
    x.fillStyle = n.hqOf === 'red' ? '#d9362b' : n.hqOf === 'blue' ? '#2a68d6' : n.type === 'crate' ? '#b97a3e' : n.type === 'garden' ? '#4f9c40' : n.type === 'bridge' ? '#8f5a2e' : '#e6e0d2';
    x.beginPath(); x.roundRect(px - s / 2, py - s / 2, s, s, 4); x.fill();
  }
}

function loadTips(): { off: boolean; seen: TipId[] } {
  try {
    const v = JSON.parse(localStorage.getItem(TIPS_KEY) ?? 'null');
    if (v && Array.isArray(v.seen)) return { off: !!v.off, seen: v.seen };
  } catch {}
  return { off: false, seen: [] };
}

function saveTips(tips: { off: boolean; seen: TipId[] }) {
  try { localStorage.setItem(TIPS_KEY, JSON.stringify(tips)); } catch {}
}

export class Game {
  private state: GameState;
  private stage: Stage;
  private view: BoardView;
  private viewer: Side = 'red';
  private mode: Mode = 'ai';
  private difficulty: Difficulty = 'normal';
  private mapInfo: MapInfo = MAPS[0];
  private scene: 'lobby' | 'game' = 'lobby';
  private busy = false;
  private selected: number | null = null;
  private targets: string[] = [];
  private drag: { uid: number; x: number; y: number; moved: boolean; hover: string | null } | null = null;
  private tips = loadTips();
  private tipShown: TipId | null = null;

  constructor() {
    applyStatic();
    const loading = this.startLoader();
    this.state = demoState(this.mapInfo.map);
    this.stage = new Stage($<HTMLCanvasElement>('gl'), this.mapInfo.map, () => ({
      top: $('hud-top').offsetHeight,
      bottom: $('hud-bot').offsetHeight,
    }));
    this.view = new BoardView(this.stage, this.state);
    this.bind();
    for (const id of ['lobby-art-blur', 'lobby-art-main']) $<HTMLImageElement>(id).src = lobbyArt;
    this.buildUnitList();
    this.buildSettings();
    this.enterLobby();
    new ResizeObserver(() => this.stage.refit()).observe($('hud-bot'));
    void loading(this.view.board.ready);
  }

  private startLoader() {
    $<HTMLImageElement>('loader-art').src = lobbyArt;
    $('loader-troops').innerHTML = TROOP_IDS.map((troop, i) =>
      `<div class="card ${i % 2 ? 'blue' : 'red'}" style="--i:${i}">${cardHtml(troop, i % 2 ? 'blue' : 'red')}</div>`).join('');
    const images = [lobbyArt, ...Object.values(CARD_ART)];
    let imagesDone = 0, modelsDone = 0, modelsTotal = 0;
    const fill = $('loader-fill');
    const update = () => {
      const total = images.length + Math.max(modelsTotal, 1);
      fill.style.width = `${Math.round((imagesDone + modelsDone) / total * 100)}%`;
    };
    THREE.DefaultLoadingManager.onProgress = (_url, loaded, total) => { modelsDone = loaded; modelsTotal = total; update(); };
    const imageLoads = images.map(src => new Promise<void>(resolve => {
      const img = new Image();
      img.onload = img.onerror = () => { imagesDone++; update(); resolve(); };
      img.src = src;
    }));
    const shown = sleep(reduceMotion ? 0 : 1400);
    return async (scenery: Promise<void>) => {
      await Promise.race([Promise.all([...imageLoads, scenery, shown]), sleep(10000)]);
      modelsDone = modelsTotal = Math.max(modelsTotal, 1);
      update();
      THREE.DefaultLoadingManager.onProgress = () => {};
      const el = $('loader');
      el.classList.add('done');
      await sleep(reduceMotion ? 0 : 450);
      el.remove();
    };
  }

  private buildSettings() {
    const langs = $('langs');
    langs.innerHTML = LOCALES.map(l => `<button type="button" data-locale="${l}">${LOCALE_LABELS[l]}</button>`).join('');
    for (const el of langs.querySelectorAll<HTMLButtonElement>('[data-locale]')) {
      el.addEventListener('click', () => this.switchLocale(el.dataset.locale as Locale));
    }
    applyStatic();
    const opt = $<HTMLInputElement>('opt-tips');
    opt.checked = !this.tips.off;
    opt.addEventListener('change', () => {
      this.tips = opt.checked ? { off: false, seen: [] } : { ...this.tips, off: true };
      saveTips(this.tips);
    });
  }

  private switchLocale(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    this.buildUnitList();
    this.renderSetup();
    if (this.scene === 'game') this.render();
  }

  private sideName(side: Side): string {
    if (this.mode === 'ai') return t(side === 'red' ? 'side.you' : 'side.ai');
    return t(side === 'red' ? 'side.red' : 'side.blue');
  }

  private bind() {
    $('draw').addEventListener('click', () => { if (this.canAct() && canDraw(this.state)) this.act({ type: 'draw' }); });
    $('banner-skip').addEventListener('click', () => { if (this.canAct() && this.state.pending?.kind === 'playAgain') this.act({ type: 'skip' }); });
    $('pass-go').addEventListener('click', () => { $('pass').hidden = true; this.render(); });
    $('over-again').addEventListener('click', () => this.startGame());
    $('over-lobby').addEventListener('click', () => this.enterLobby());
    $('lobby-start').addEventListener('click', () => this.openSetup());
    $('lobby-rules').addEventListener('click', () => { $('rules').hidden = false; });
    $('lobby-units').addEventListener('click', () => { $('units').hidden = false; });
    $('lobby-settings').addEventListener('click', () => { $('settings').hidden = false; });
    $('setup-back').addEventListener('click', () => { $('setup').hidden = true; $('lobby-art').classList.remove('peek'); });
    $('setup-go').addEventListener('click', () => this.startGame());
    $('tip-ok').addEventListener('click', () => this.hideTip());
    $('tip-off').addEventListener('click', () => {
      this.tips = { ...this.tips, off: true };
      saveTips(this.tips);
      $<HTMLInputElement>('opt-tips').checked = false;
      this.hideTip();
    });
    for (const el of document.querySelectorAll<HTMLElement>('[data-close]')) {
      el.addEventListener('click', () => { el.closest<HTMLElement>('.sheet')!.hidden = true; });
    }
    for (const el of document.querySelectorAll<HTMLElement>('.sheet')) {
      el.addEventListener('click', e => { if (e.target === el && el.id !== 'setup') el.hidden = true; });
    }
    for (const el of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      el.addEventListener('click', () => { this.mode = el.dataset.mode as Mode; this.renderSetup(); });
    }
    for (const el of document.querySelectorAll<HTMLButtonElement>('[data-diff]')) {
      el.addEventListener('click', () => { this.difficulty = el.dataset.diff as Difficulty; this.renderSetup(); });
    }
    const canvas = $('gl');
    canvas.addEventListener('pointerup', e => this.onBoardTap(e));
    window.addEventListener('pointermove', e => this.onDragMove(e));
    window.addEventListener('pointerup', e => this.onDragEnd(e));
    window.addEventListener('pointercancel', () => this.cancelDrag());
  }

  private canAct() {
    return this.scene === 'game' && !this.busy && $('pass').hidden && !this.state.winner && this.state.turn === this.viewer;
  }

  private buildUnitList() {
    $('unit-list').innerHTML = TROOP_IDS.map(troop => `
      <div class="unit"><div class="card red">${cardHtml(troop, 'red')}</div>
      <div><b>${label(troop)} · ${nameOf(troop)}</b><p>${effectOf(troop)}</p></div></div>`).join('');
  }

  private enterLobby() {
    this.scene = 'lobby';
    $('app').dataset.scene = 'lobby';
    for (const id of ['over', 'pass', 'setup']) $(id).hidden = true;
    this.hideTip();
    $('lobby-art').classList.remove('peek');
    this.clearSelection();
    this.state = demoState(this.mapInfo.map);
    this.view.sync(this.state);
    this.view.setViewer('red');
    this.stage.setOrbit(true);
  }

  private openSetup() {
    this.renderSetup();
    $('setup').hidden = false;
    $('lobby-art').classList.add('peek');
  }

  private renderSetup() {
    for (const el of document.querySelectorAll<HTMLButtonElement>('[data-mode]')) el.setAttribute('aria-pressed', String(el.dataset.mode === this.mode));
    for (const el of document.querySelectorAll<HTMLButtonElement>('[data-diff]')) el.setAttribute('aria-pressed', String(el.dataset.diff === this.difficulty));
    $('diff').hidden = this.mode !== 'ai';
    const list = $('maps');
    list.innerHTML = '';
    for (const info of MAPS) {
      const card = document.createElement('button');
      card.className = 'map-card';
      card.setAttribute('aria-pressed', String(info === this.mapInfo));
      const thumb = document.createElement('canvas');
      drawMapThumb(thumb, info.map);
      card.append(thumb);
      card.insertAdjacentHTML('beforeend', `<b>${t(`map.${info.map.id}` as Key)}</b><span class="meta">${'★'.repeat(info.stars)}${'☆'.repeat(3 - info.stars)} · ${t('map.goal', { n: info.map.objective })}</span><small>${t(`map.${info.map.id}.blurb` as Key)}</small>`);
      card.addEventListener('click', () => this.selectMap(info));
      list.append(card);
    }
  }

  private selectMap(info: MapInfo) {
    if (info !== this.mapInfo) {
      this.mapInfo = info;
      this.view.destroy();
      this.stage.setMap(info.map);
      this.state = demoState(info.map);
      this.view = new BoardView(this.stage, this.state);
    }
    this.renderSetup();
  }

  private startGame() {
    for (const id of ['over', 'pass', 'setup']) $(id).hidden = true;
    this.scene = 'game';
    $('app').dataset.scene = 'game';
    this.clearSelection();
    this.busy = false;
    this.state = newGame({ seed: seed(), map: this.mapInfo.map });
    this.view.sync(this.state);
    this.stage.setOrbit(false);
    if (this.mode === 'ai') {
      this.viewer = 'red';
      this.view.setViewer('red');
      this.render();
      this.toast(t(this.state.turn === 'red' ? 'first.you' : 'first.ai'));
      if (this.state.turn === 'blue') this.aiTurn();
    } else {
      this.showPass(this.state.turn, t('pass.first', { side: this.sideName(this.state.turn) }));
    }
  }

  private showPass(side: Side, note: string) {
    this.viewer = side;
    this.view.setViewer(side);
    $('pass-title').textContent = t('pass.title', { side: this.sideName(side) });
    $('pass-note').textContent = note;
    $('pass').querySelector('.panel')!.classList.toggle('blue', side === 'blue');
    $('pass').hidden = false;
    this.render();
  }

  private toast(text: string) {
    const el = $('toast');
    el.textContent = text;
    el.hidden = false;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    clearTimeout((el as unknown as { timer: number }).timer);
    (el as unknown as { timer: number }).timer = window.setTimeout(() => { el.hidden = true; }, 1300);
  }

  private render() {
    const s = this.state, me = this.viewer, opp = other(me);
    const hidden = !$('pass').hidden;
    $('opp-sq').style.background = `var(--${opp})`;
    $('opp-backs').innerHTML = '<i></i>'.repeat(s.hand[opp].length);
    $('opp-count').textContent = t('hud.hand', { n: s.hand[opp].length });
    $('opp-medals').textContent = String(s.medals[opp]);
    $('opp-goal').textContent = ` / ${s.map.objective}`;
    $('deck').textContent = t('hud.deck', { n: s.reserve[me].length });

    const hand = $('hand');
    hand.innerHTML = '';
    if (hidden) hand.innerHTML = `<span class="empty">${t('hand.hidden')}</span>`;
    else if (!s.hand[me].length) hand.innerHTML = `<span class="empty">${t('hand.empty')}</span>`;
    else {
      const blocked = s.turn !== me || !!s.winner || s.pending?.kind === 'removeAdjacent';
      for (const tile of [...s.hand[me]].sort((a, b) => order(a) - order(b))) {
        const el = document.createElement('div');
        el.className = `card ${tile.side}`;
        el.dataset.uid = String(tile.uid);
        el.innerHTML = cardHtml(tile.troop, tile.side);
        if (tile.uid === this.selected) el.classList.add('sel');
        if (blocked || !legalTargets(s, tile.uid).length) el.classList.add('dim');
        el.addEventListener('pointerdown', e => this.onCardDown(e, tile));
        hand.appendChild(el);
      }
    }
    const drawBtn = $<HTMLButtonElement>('draw');
    drawBtn.disabled = hidden || s.turn !== me || !canDraw(s);
    const n = Math.min(2, 8 - s.hand[me].length, s.reserve[me].length);
    drawBtn.querySelector('b')!.textContent = String(Math.max(n, 0));

    const banner = $('banner'), skip = $('banner-skip');
    skip.hidden = true;
    banner.hidden = true;
    if (hidden || s.winner) return;
    if (s.turn !== me) {
      if (this.mode === 'ai') { banner.hidden = false; $('banner-text').textContent = t('ai.thinking'); }
      return;
    }
    if (s.pending?.kind === 'removeAdjacent') {
      banner.hidden = false;
      $('banner-text').textContent = t('pending.remove', { name: nameOf('brix') });
      this.view.board.setTargets(s.pending.options, 'remove');
    } else if (this.selected !== null) {
      const tile = s.hand[me].find(t => t.uid === this.selected);
      if (tile) { banner.hidden = false; $('banner-text').textContent = t('troop.effect', { name: nameOf(tile.troop), effect: effectOf(tile.troop) }); }
    } else if (s.pending?.kind === 'playAgain') {
      banner.hidden = false;
      skip.hidden = false;
      $('banner-text').textContent = t('pending.again', { name: nameOf('boing') });
    }
    if (this.mode === 'ai' && !this.busy && !s.pending) this.checkTurnTips();
  }

  private checkTurnTips() {
    const s = this.state, me = this.viewer, opp = other(me);
    const targets = new Set(s.hand[me].flatMap(tile => legalTargets(s, tile.uid)));
    const enemyHq = hqOf(s.map, opp);
    const regionAlmost = s.map.regions.some((r, i) => {
      if (s.claimed[i] || !r.medals) return false;
      const open = r.nodes.filter(id => s.map.nodes[id].type !== 'hq' && s.stacks[id].at(-1)?.side !== me);
      return open.length === 1 && targets.has(open[0]);
    });
    if (this.showTip('turn')) return;
    if (targets.has(enemyHq) && this.showTip('hq')) return;
    if (regionAlmost && this.showTip('region')) return;
    if ([...targets].some(id => s.stacks[id].at(-1)?.side === opp)) this.showTip('crush');
  }

  private showTip(id: TipId): boolean {
    if (this.tips.off || this.tips.seen.includes(id) || this.tipShown || this.mode !== 'ai' || this.scene !== 'game') return false;
    this.tips = { ...this.tips, seen: [...this.tips.seen, id] };
    saveTips(this.tips);
    this.tipShown = id;
    $('tip-text').textContent = t(`tip.${id}` as Key);
    const tip = $('tip');
    tip.style.bottom = `${$('hud-bot').offsetHeight + 10}px`;
    tip.hidden = false;
    return true;
  }

  private hideTip() {
    this.tipShown = null;
    $('tip').hidden = true;
  }

  private clearSelection() {
    this.selected = null;
    this.targets = [];
    this.view.board.setTargets([], 'place');
    this.view.board.setHover(null);
  }

  private select(uid: number) {
    this.selected = uid;
    this.targets = legalTargets(this.state, uid);
    this.view.board.setTargets(this.targets, 'place');
    this.render();
  }

  private onCardDown(e: PointerEvent, tile: Tile) {
    if (!this.canAct() || this.state.pending?.kind === 'removeAdjacent') return;
    e.preventDefault();
    if (!legalTargets(this.state, tile.uid).length) {
      this.toast(t('troop.noTarget', { name: nameOf(tile.troop) }));
      return;
    }
    this.select(tile.uid);
    if (this.tipShown === 'turn') this.hideTip();
    if (!this.showTip('place') && TROOPS[tile.troop].effect !== 'none') this.showTip('effect');
    this.drag = { uid: tile.uid, x: e.clientX, y: e.clientY, moved: false, hover: null };
  }

  private onDragMove(e: PointerEvent) {
    const d = this.drag;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
    const ghost = $('ghost');
    if (!d.moved) {
      d.moved = true;
      const card = $('hand').querySelector<HTMLElement>(`[data-uid="${d.uid}"]`);
      ghost.innerHTML = card ? card.outerHTML : '';
      ghost.querySelector('.card')?.classList.remove('sel', 'dim');
      card?.classList.add('lift');
      ghost.hidden = false;
    }
    ghost.style.left = `${e.clientX}px`;
    ghost.style.top = `${e.clientY}px`;
    d.hover = this.view.pickNode(e.clientX, e.clientY, this.targets);
    ghost.classList.toggle('over', !!d.hover);
    this.view.board.setHover(d.hover);
  }

  private onDragEnd(e: PointerEvent) {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    $('ghost').hidden = true;
    $('ghost').classList.remove('over');
    if (!d.moved) return;
    e.stopPropagation();
    this.view.board.setHover(null);
    if (d.hover) this.act({ type: 'place', tile: d.uid, node: d.hover });
    else { this.clearSelection(); this.render(); }
  }

  private cancelDrag() {
    if (!this.drag) return;
    this.drag = null;
    $('ghost').hidden = true;
    this.clearSelection();
    this.render();
  }

  private onBoardTap(e: PointerEvent) {
    if (this.drag || !this.canAct()) return;
    const s = this.state;
    if (s.pending?.kind === 'removeAdjacent') {
      const node = this.view.pickNode(e.clientX, e.clientY, s.pending.options);
      if (node) this.act({ type: 'remove', node });
      return;
    }
    if (this.selected === null) return;
    const node = this.view.pickNode(e.clientX, e.clientY, this.targets);
    if (node) this.act({ type: 'place', tile: this.selected, node });
    else { this.clearSelection(); this.render(); }
  }

  private async aiTurn() {
    if (this.scene !== 'game' || this.state.winner || this.state.turn !== 'blue' || !legalActions(this.state).length) return;
    this.busy = true;
    this.render();
    await sleep(700);
    if (this.scene !== 'game') return;
    await this.act(chooseAction(this.state, this.difficulty));
  }

  private handTarget(side: Side): [number, number] {
    return side === this.viewer ? center($('hand')) : center($('opp-backs'));
  }

  private async flyCards(from: [number, number], side: Side, n: number) {
    const flights = [];
    for (let i = 0; i < n; i++) flights.push(fly(from, this.handTarget(side), `back ${side}`, '', i * 130));
    await Promise.all(flights);
  }

  private async discardFx(prev: GameState, next: GameState, victim: Side, node: string) {
    const lost = next.discard.at(-1);
    if (!lost) return;
    const toRobot = this.view.screenOf(node, .6);
    if (victim === this.viewer && $('pass').hidden) {
      const el = $('hand').querySelector<HTMLElement>(`[data-uid="${lost.uid}"]`);
      if (el && !reduceMotion) {
        el.classList.add('zapped');
        await sleep(380);
        const from = center(el);
        el.style.visibility = 'hidden';
        await fly(from, toRobot, `face ${victim} burn`, cardHtml(lost.troop, victim), 0, 520);
        return;
      }
    }
    await fly(center($('opp-backs')), toRobot, `back ${victim} burn`, '', 0, 520);
  }

  private async act(action: Action) {
    const prev = this.state;
    let next: GameState;
    try { next = apply(prev, action); } catch { return; }
    this.busy = true;
    if (this.tipShown) this.hideTip();
    this.clearSelection();
    const side = prev.turn, opp = other(side);
    if (action.type === 'place') {
      const tile = prev.hand[side].find(t => t.uid === action.tile)!;
      this.state = { ...prev, hand: { ...prev.hand, [side]: prev.hand[side].filter(t => t.uid !== tile.uid) } };
      this.render();
      await this.view.animatePlace(tile, action.node, hqOf(prev.map, side));
      const drew = next.hand[side].length - (prev.hand[side].length - 1);
      if (drew > 0) await this.flyCards(this.view.screenOf(action.node, .8), side, drew);
      if (next.hand[opp].length < prev.hand[opp].length) await this.discardFx(prev, next, opp, action.node);
    } else if (action.type === 'remove') {
      void this.view.ring(action.node, 0xff6b5e, 2.2, 420);
      this.stage.shake(.08, 220);
      await this.view.animateRemove(action.node);
    } else if (action.type === 'draw') {
      const n = next.hand[side].length - prev.hand[side].length;
      const from: [number, number] = side === this.viewer ? center($('draw')) : center($('opp-backs'));
      if (side === this.viewer) await this.flyCards(from, side, n);
      else await this.flyCards([from[0], from[1] - 60], side, n);
    }
    if (this.scene !== 'game') return;
    for (let i = 0; i < next.claimed.length; i++) {
      if (prev.claimed[i] || !next.claimed[i] || !next.map.regions[i].medals) continue;
      const owner: Side = next.medals[side] > prev.medals[side] ? side : opp;
      await this.view.animateClaim(i, owner);
    }
    if (this.scene !== 'game') return;
    this.state = next;
    this.view.sync(next);
    this.render();
    this.busy = false;
    if (next.winner) { await sleep(400); this.showOver(); return; }
    if (next.skipped) { this.toast(t('skipped', { side: this.sideName(next.skipped) })); await sleep(1100); }
    if (this.mode === 'ai') {
      this.render();
      if (next.turn === 'blue') await this.aiTurn();
    } else if (next.turn !== this.viewer) this.showPass(next.turn, this.summary(action, prev, side));
    else this.render();
  }

  private summary(action: Action, prev: GameState, side: Side): string {
    const hand = t('sum.handoff', { side: this.sideName(other(side)) });
    const who = this.sideName(side);
    if (action.type === 'draw') return `${t('sum.draw', { side: who })} ${hand}`;
    if (action.type === 'place') {
      const tile = prev.hand[side].find(x => x.uid === action.tile);
      return `${t('sum.place', { side: who, name: tile ? nameOf(tile.troop) : t('sum.troop') })} ${hand}`;
    }
    return hand;
  }

  debugNodeScreen(id: string): [number, number] {
    const p = this.view.board.nodeW(id).clone();
    p.y = .2;
    this.view.group.localToWorld(p);
    p.project(this.stage.camera);
    const r = $('gl').getBoundingClientRect();
    return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height];
  }

  debugState() { return this.state; }

  private showOver() {
    const s = this.state;
    let title = s.winner === 'draw' ? t('over.draw') : t('over.win', { side: this.sideName(s.winner as Side) });
    if (this.mode === 'ai' && s.winner === 'red') title = t('over.youWin');
    if (this.mode === 'ai' && s.winner === 'blue') title = t('over.aiWin');
    const reason = s.endReason === 'hq' ? t('over.hq') : s.endReason === 'objective' ? t('over.objective', { n: s.map.objective }) : t('over.stalled');
    $('over-title').textContent = title;
    $('over-note').textContent = reason;
    $('over-red').textContent = String(s.medals.red);
    $('over-blue').textContent = String(s.medals.blue);
    $('over').querySelector('.panel')!.classList.toggle('blue', s.winner === 'blue');
    $('over').hidden = false;
  }
}
