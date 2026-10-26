import {
  TROOPS, apply, canDraw, legalTargets, newGame, other,
  type Action, type GameState, type Side, type Tile, type TroopId,
} from './engine';
import { renderPortraits, type Portraits } from './render/portraits';
import { Stage } from './render/scene';
import { BoardView } from './render/view';

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
const SIDE_NAME: Record<Side, string> = { red: '红方', blue: '蓝方' };
const label = (t: TroopId) => (TROOPS[t].strength === 'joker' ? '★' : String(TROOPS[t].strength));
const order = (t: Tile) => (TROOPS[t.troop].strength === 'joker' ? 8 : (TROOPS[t.troop].strength as number));
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export class Game {
  private state: GameState;
  private stage: Stage;
  private view: BoardView;
  private viewer: Side;
  private busy = false;
  private selected: number | null = null;
  private targets: string[] = [];
  private drag: { uid: number; x: number; y: number; moved: boolean; hover: string | null } | null = null;
  private portraits: Portraits = renderPortraits();

  constructor() {
    this.state = newGame({ seed: (Math.random() * 2 ** 31) | 0 });
    this.viewer = this.state.turn;
    this.stage = new Stage($<HTMLCanvasElement>('gl'), this.state.map, () => ({
      top: $('hud-top').offsetHeight,
      bottom: $('hud-bot').offsetHeight,
    }));
    this.view = new BoardView(this.stage, this.state);
    this.view.setViewer(this.viewer);
    this.bind();
    this.render();
    this.showPass(this.state.turn, `${SIDE_NAME[this.state.turn]}先手。先手起手 3 张牌，后手 4 张。`);
    new ResizeObserver(() => this.stage.refit()).observe($('hud-bot'));
  }

  private bind() {
    $('draw').addEventListener('click', () => { if (!this.busy && canDraw(this.state)) this.act({ type: 'draw' }); });
    $('banner-skip').addEventListener('click', () => { if (!this.busy && this.state.pending?.kind === 'playAgain') this.act({ type: 'skip' }); });
    $('pass-go').addEventListener('click', () => { $('pass').hidden = true; this.render(); });
    $('over-again').addEventListener('click', () => this.restart());
    const canvas = $('gl');
    canvas.addEventListener('pointerup', e => this.onBoardTap(e));
    window.addEventListener('pointermove', e => this.onDragMove(e));
    window.addEventListener('pointerup', e => this.onDragEnd(e));
    window.addEventListener('pointercancel', () => this.cancelDrag());
  }

  private restart() {
    this.state = newGame({ seed: (Math.random() * 2 ** 31) | 0 });
    this.view.sync(this.state);
    this.viewer = this.state.turn;
    this.view.setViewer(this.viewer);
    $('over').hidden = true;
    this.clearSelection();
    this.render();
    this.showPass(this.state.turn, `${SIDE_NAME[this.state.turn]}先手。`);
  }

  private showPass(side: Side, note: string) {
    this.viewer = side;
    this.view.setViewer(side);
    $('pass-title').textContent = `轮到 ${SIDE_NAME[side]}`;
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
    $('opp-name').textContent = SIDE_NAME[opp];
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
        el.innerHTML = `<img src="${this.portraits[tile.side][tile.troop]}" alt="" draggable="false"><b>${label(tile.troop)}</b><span>${NAMES[tile.troop]}</span>`;
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
    if (this.busy || this.state.turn !== this.viewer || this.state.winner || this.state.pending?.kind === 'removeAdjacent') return;
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
    if (this.busy || this.drag || !$('pass').hidden || this.state.winner || this.state.turn !== this.viewer) return;
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

  private async act(action: Action) {
    const prev = this.state;
    let next: GameState;
    try { next = apply(prev, action); } catch { return; }
    this.busy = true;
    this.clearSelection();
    const side = prev.turn, opp = other(side);
    const messages: string[] = [];
    if (action.type === 'place') {
      const tile = prev.hand[side].find(t => t.uid === action.tile)!;
      this.state = { ...prev, hand: { ...prev.hand, [side]: prev.hand[side].filter(t => t.uid !== tile.uid) } };
      this.render();
      await this.view.animatePlace(tile, action.node);
      const drew = next.hand[side].length - (prev.hand[side].length - 1);
      if (drew > 0) messages.push(`抽了 ${drew} 张牌`);
      if (next.hand[opp].length < prev.hand[opp].length) messages.push(`${SIDE_NAME[opp]}弃掉了 1 张手牌`);
    } else if (action.type === 'remove') {
      await this.view.animateRemove(action.node);
      messages.push('移除了 1 个敌兵');
    } else if (action.type === 'draw') {
      messages.push(`抽了 ${next.hand[side].length - prev.hand[side].length} 张牌`);
    }
    const gained = next.medals[side] - prev.medals[side];
    if (gained > 0) messages.push(`占领区域，获得 ${gained} 颗星`);
    this.state = next;
    this.view.sync(next);
    this.render();
    for (const m of messages) { this.toast(m); await sleep(900); }
    this.busy = false;
    if (next.winner) { this.showOver(); return; }
    if (next.skipped) { this.toast(`${SIDE_NAME[next.skipped]}无法行动，跳过回合`); await sleep(1100); }
    if (next.turn !== this.viewer) this.showPass(next.turn, this.summary(action, prev, side));
    else this.render();
  }

  private summary(action: Action, prev: GameState, side: Side): string {
    if (action.type === 'draw') return `${SIDE_NAME[side]}抽了牌。把手机交给${SIDE_NAME[other(side)]}。`;
    if (action.type === 'place') {
      const tile = prev.hand[side].find(t => t.uid === action.tile);
      return `${SIDE_NAME[side]}出了${tile ? NAMES[tile.troop] : '兵'}。把手机交给${SIDE_NAME[other(side)]}。`;
    }
    return `把手机交给${SIDE_NAME[other(side)]}。`;
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
    const title = s.winner === 'draw' ? '平局' : `${SIDE_NAME[s.winner as Side]}获胜`;
    const reason = s.endReason === 'hq' ? '攻下了对方的城堡！' : s.endReason === 'objective' ? `率先拿到 ${s.map.objective} 颗星！` : '双方都无法行动，比较星星数。';
    $('over-title').textContent = title;
    $('over-note').textContent = reason;
    $('over-red').textContent = String(s.medals.red);
    $('over-blue').textContent = String(s.medals.blue);
    $('over').querySelector('.panel')!.classList.toggle('blue', s.winner === 'blue');
    $('over').hidden = false;
  }
}
