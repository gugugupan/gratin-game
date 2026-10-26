import {
  MAPS, TROOPS, TROOP_IDS, apply, canDraw, chooseAction, legalActions, legalTargets, newGame, other,
  type Action, type Difficulty, type GameState, type MapDef, type MapInfo, type Side, type Tile, type TroopId,
} from './engine';
import { themeFor } from './render/board';
import { Stage } from './render/scene';
import { BoardView } from './render/view';

type Mode = 'ai' | 'local';

const NAMES: Record<TroopId, string> = {
  pip: '发条企鹅', mira: '套娃', boing: '惊奇盒', brix: '积木骑士', hop: '弹簧蛙', clank: '机器人', bruno: '邮差熊', rexie: '霸王龙',
};
const EFFECT_TEXT: Record<TroopId, string> = {
  pip: '万能：能盖住任何敌兵，也能被任何兵盖住',
  mira: '出场后抽 2 张',
  boing: '出场后立刻再出 1 张',
  brix: '出场后移除 1 个相邻的敌兵',
  hop: '无视连接，可以出到任何格子',
  clank: '出场后对手随机弃 1 张手牌',
  bruno: '出场后抽 1 张',
  rexie: '没有效果，力量最强',
};
const CARD_ART = import.meta.glob<string>('./assets/cards/*.webp', { eager: true, import: 'default' });
const cardArt = (troop: TroopId, side: Side) => CARD_ART[`./assets/cards/${troop}-${side}.webp`];
const label = (t: TroopId) => (TROOPS[t].strength === 'joker' ? '★' : String(TROOPS[t].strength));
const order = (t: Tile) => (TROOPS[t.troop].strength === 'joker' ? 8 : (TROOPS[t.troop].strength as number));
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const seed = () => (Math.random() * 2 ** 31) | 0;
const cardHtml = (troop: TroopId, side: Side) =>
  `<img src="${cardArt(troop, side)}" alt="" draggable="false"><b>${label(troop)}</b><span>${NAMES[troop]}</span>`;

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

  constructor() {
    this.state = demoState(this.mapInfo.map);
    this.stage = new Stage($<HTMLCanvasElement>('gl'), this.mapInfo.map, () => ({
      top: $('hud-top').offsetHeight,
      bottom: $('hud-bot').offsetHeight,
    }));
    this.view = new BoardView(this.stage, this.state);
    this.bind();
    this.buildUnitList();
    this.enterLobby();
    new ResizeObserver(() => this.stage.refit()).observe($('hud-bot'));
  }

  private sideName(side: Side): string {
    if (this.mode === 'ai') return side === 'red' ? '你' : 'AI';
    return side === 'red' ? '红方' : '蓝方';
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
    $('setup-back').addEventListener('click', () => { $('setup').hidden = true; });
    $('setup-go').addEventListener('click', () => this.startGame());
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
    $('unit-list').innerHTML = TROOP_IDS.map(t => `
      <div class="unit"><div class="card red">${cardHtml(t, 'red')}</div>
      <div><b>${label(t)} · ${NAMES[t]}</b><p>${EFFECT_TEXT[t]}</p></div></div>`).join('');
  }

  private enterLobby() {
    this.scene = 'lobby';
    $('app').dataset.scene = 'lobby';
    for (const id of ['over', 'pass', 'setup']) $(id).hidden = true;
    this.clearSelection();
    this.state = demoState(this.mapInfo.map);
    this.view.sync(this.state);
    this.view.setViewer('red');
    this.stage.setOrbit(true);
  }

  private openSetup() {
    this.renderSetup();
    $('setup').hidden = false;
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
      card.insertAdjacentHTML('beforeend', `<b>${info.name}</b><span class="meta">${'★'.repeat(info.stars)}${'☆'.repeat(3 - info.stars)} · 目标 ${info.map.objective} 星</span><small>${info.blurb}</small>`);
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
      this.toast(this.state.turn === 'red' ? '你先手' : 'AI 先手');
      if (this.state.turn === 'blue') this.aiTurn();
    } else {
      this.showPass(this.state.turn, `${this.sideName(this.state.turn)}先手。先手起手 3 张牌，后手 4 张。`);
    }
  }

  private showPass(side: Side, note: string) {
    this.viewer = side;
    this.view.setViewer(side);
    $('pass-title').textContent = `轮到 ${this.sideName(side)}`;
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
    $('opp-name').textContent = this.sideName(opp);
    $('opp-backs').innerHTML = '<i></i>'.repeat(s.hand[opp].length);
    $('opp-medals').textContent = String(s.medals[opp]);
    $('opp-goal').textContent = ` / ${s.map.objective}`;
    $('deck').textContent = `牌库 ${s.reserve[me].length}`;

    const hand = $('hand');
    hand.innerHTML = '';
    if (hidden) hand.innerHTML = '<span class="empty">手牌已隐藏</span>';
    else if (!s.hand[me].length) hand.innerHTML = '<span class="empty">没有手牌</span>';
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
      if (this.mode === 'ai') { banner.hidden = false; $('banner-text').textContent = 'AI 思考中…'; }
      return;
    }
    if (s.pending?.kind === 'removeAdjacent') {
      banner.hidden = false;
      $('banner-text').textContent = '积木骑士：点选一个相邻的敌兵移除';
      this.view.board.setTargets(s.pending.options, 'remove');
    } else if (this.selected !== null) {
      const tile = s.hand[me].find(t => t.uid === this.selected);
      if (tile) { banner.hidden = false; $('banner-text').textContent = `${NAMES[tile.troop]}：${EFFECT_TEXT[tile.troop]}`; }
    } else if (s.pending?.kind === 'playAgain') {
      banner.hidden = false;
      skip.hidden = false;
      $('banner-text').textContent = '惊奇盒：再出 1 张兵';
    }
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
      this.toast(`${NAMES[tile.troop]} 现在没有可以出的格子`);
      return;
    }
    this.select(tile.uid);
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

  private async act(action: Action) {
    const prev = this.state;
    let next: GameState;
    try { next = apply(prev, action); } catch { return; }
    this.busy = true;
    this.clearSelection();
    const side = prev.turn, opp = other(side), who = this.sideName(side);
    const messages: string[] = [];
    if (action.type === 'place') {
      const tile = prev.hand[side].find(t => t.uid === action.tile)!;
      if (side !== this.viewer || this.mode === 'local') messages.push(`${who}出了${NAMES[tile.troop]}`);
      this.state = { ...prev, hand: { ...prev.hand, [side]: prev.hand[side].filter(t => t.uid !== tile.uid) } };
      this.render();
      await this.view.animatePlace(tile, action.node);
      const drew = next.hand[side].length - (prev.hand[side].length - 1);
      if (drew > 0) messages.push(`${who}抽了 ${drew} 张牌`);
      if (next.hand[opp].length < prev.hand[opp].length) messages.push(`${this.sideName(opp)}弃掉了 1 张手牌`);
    } else if (action.type === 'remove') {
      await this.view.animateRemove(action.node);
      messages.push(`${who}移除了 1 个兵`);
    } else if (action.type === 'draw') {
      messages.push(`${who}抽了 ${next.hand[side].length - prev.hand[side].length} 张牌`);
    } else if (action.type === 'skip' && side !== this.viewer) {
      messages.push(`${who}没有再出兵`);
    }
    const gained = next.medals[side] - prev.medals[side];
    if (gained > 0) messages.push(`${who}占领区域，获得 ${gained} 颗星`);
    if (this.scene !== 'game') return;
    this.state = next;
    this.view.sync(next);
    this.render();
    for (const m of messages) { this.toast(m); await sleep(900); }
    if (this.scene !== 'game') return;
    this.busy = false;
    if (next.winner) { this.showOver(); return; }
    if (next.skipped) { this.toast(`${this.sideName(next.skipped)}无法行动，跳过回合`); await sleep(1100); }
    if (this.mode === 'ai') {
      this.render();
      if (next.turn === 'blue') await this.aiTurn();
    } else if (next.turn !== this.viewer) this.showPass(next.turn, this.summary(action, prev, side));
    else this.render();
  }

  private summary(action: Action, prev: GameState, side: Side): string {
    const hand = `把手机交给${this.sideName(other(side))}。`;
    if (action.type === 'draw') return `${this.sideName(side)}抽了牌。${hand}`;
    if (action.type === 'place') {
      const tile = prev.hand[side].find(t => t.uid === action.tile);
      return `${this.sideName(side)}出了${tile ? NAMES[tile.troop] : '兵'}。${hand}`;
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
    let title = s.winner === 'draw' ? '平局' : `${this.sideName(s.winner as Side)}获胜`;
    if (this.mode === 'ai' && s.winner === 'red') title = '你赢了！';
    if (this.mode === 'ai' && s.winner === 'blue') title = 'AI 获胜';
    const reason = s.endReason === 'hq' ? '攻下了对方的城堡！' : s.endReason === 'objective' ? `率先拿到 ${s.map.objective} 颗星！` : '双方都无法行动，比较星星数。';
    $('over-title').textContent = title;
    $('over-note').textContent = reason;
    $('over-red').textContent = String(s.medals.red);
    $('over-blue').textContent = String(s.medals.blue);
    $('over').querySelector('.panel')!.classList.toggle('blue', s.winner === 'blue');
    $('over').hidden = false;
  }
}
