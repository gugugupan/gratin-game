import * as THREE from 'three';
import { connected, reachable, type GameState, type Side, type Tile } from '../engine';
import { HEIGHT, LABEL, T, figureTicks, makePiece, place, type Piece } from './figures';
import { PAD_TOP, Y0, buildBoard, type BoardScene } from './board';
import { TEAM_CSS, enableShadows } from './kit';
import type { Stage } from './scene';

export const PIECE_SCALE = .68;
const easeOutBack = (k: number) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);

function badgeCanvas(label: string, side: Side, count: number): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 168; c.height = 132;
  const x = c.getContext('2d')!;
  const { main, dark } = TEAM_CSS[side];
  x.fillStyle = 'rgba(20,25,35,.35)'; x.beginPath(); x.roundRect(28, 14, 112, 112, 28); x.fill();
  x.fillStyle = dark; x.beginPath(); x.roundRect(24, 6, 112, 112, 28); x.fill();
  x.fillStyle = main; x.beginPath(); x.roundRect(24, 2, 112, 106, 28); x.fill();
  x.strokeStyle = '#f0c24a'; x.lineWidth = 7; x.beginPath(); x.roundRect(27, 5, 106, 106, 25); x.stroke();
  x.fillStyle = '#ffffff'; x.font = '800 78px "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 8; x.strokeStyle = dark; x.strokeText(label, 80, 64); x.fillText(label, 80, 64);
  if (count > 1) {
    x.fillStyle = '#1d2433'; x.beginPath(); x.roundRect(100, 72, 66, 56, 18); x.fill();
    x.strokeStyle = '#f7f5ef'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#ffffff'; x.font = '800 38px "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';
    x.fillText('×' + count, 133, 102);
  }
  return c;
}

export class BoardView {
  readonly board: BoardScene;
  private stacks: Record<string, Piece[]> = {};
  private badges: Record<string, THREE.Sprite> = {};
  private reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(private stage: Stage, state: GameState) {
    this.board = buildBoard(state.map, stage.scene);
    enableShadows(this.board.group);
    for (const id of Object.keys(state.map.nodes)) this.stacks[id] = [];
    stage.onFrame(t => {
      this.board.pulse(t);
      if (this.reduceMotion) return;
      for (const fn of this.board.ticks) fn(t);
      for (const stack of Object.values(this.stacks)) {
        const topPiece = stack.at(-1);
        if (topPiece) for (const fn of figureTicks(topPiece)) fn(t);
      }
    });
    this.sync(state);
  }

  get group() { return this.board.group; }

  setViewer(side: Side) { this.board.group.rotation.y = side === 'red' ? 0 : Math.PI; }

  pickNode(clientX: number, clientY: number, candidates: string[]): string | null {
    const hit = this.stage.pickGround(clientX, clientY, Y0 + PAD_TOP);
    if (!hit) return null;
    const local = this.board.group.worldToLocal(hit.clone());
    let best: string | null = null, bestD = Infinity;
    for (const id of candidates) {
      const p = this.board.nodeW(id);
      const d = Math.hypot(p.x - local.x, p.z - local.z);
      const limit = id.startsWith('hq') ? 1.4 : .8;
      if (d < limit && d < bestD) { best = id; bestD = d; }
    }
    return best;
  }

  private levelAt(i: number) { return Y0 + PAD_TOP + i * T * PIECE_SCALE; }

  private newPiece(tile: Tile, node: string, index: number): Piece {
    const piece = makePiece(tile.troop, tile.side, tile.uid);
    piece.scale.setScalar(PIECE_SCALE);
    const p = this.board.nodeW(node);
    piece.position.set(p.x, this.levelAt(index), p.z);
    piece.rotation.y = tile.side === 'red' ? Math.PI : 0;
    enableShadows(piece);
    this.board.group.add(piece);
    return piece;
  }

  private dispose(piece: Piece) {
    this.board.group.remove(piece);
    piece.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh && !m.userData.outline) m.geometry.dispose(); });
  }

  private refreshNode(node: string) {
    const stack = this.stacks[node];
    stack.forEach((p, i) => { p.userData.fig.visible = i === stack.length - 1; });
    const old = this.badges[node];
    if (old) { this.board.group.remove(old); old.material.map?.dispose(); old.material.dispose(); delete this.badges[node]; }
    const topPiece = stack.at(-1);
    if (!topPiece) return;
    const tex = new THREE.CanvasTexture(badgeCanvas(LABEL[topPiece.userData.troop], topPiece.userData.side, stack.length));
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sprite.scale.set(.7, .55, 1);
    const p = this.board.nodeW(node);
    sprite.position.set(p.x, this.levelAt(stack.length) + HEIGHT[topPiece.userData.troop] * PIECE_SCALE + .38, p.z);
    sprite.renderOrder = 10;
    this.board.group.add(sprite);
    this.badges[node] = sprite;
  }

  sync(s: GameState) {
    for (const [node, tiles] of Object.entries(s.stacks)) {
      const stack = this.stacks[node];
      const same = stack.length === tiles.length && stack.every((p, i) => p.userData.uid === tiles[i].uid);
      if (same) continue;
      for (const p of stack) this.dispose(p);
      this.stacks[node] = tiles.map((t, i) => this.newPiece(t, node, i));
      this.refreshNode(node);
    }
    s.map.regions.forEach((_, i) => { const g = this.board.medalGroups[i]; if (g) g.visible = !s.claimed[i]; });
    this.board.setLinks(
      { red: connected(s, 'red'), blue: connected(s, 'blue') },
      { red: reachable(s, 'red'), blue: reachable(s, 'blue') },
    );
  }

  async animatePlace(tile: Tile, node: string): Promise<void> {
    const stack = this.stacks[node];
    const below = stack.at(-1);
    const piece = this.newPiece(tile, node, stack.length);
    const rest = piece.position.y;
    const fig = piece.userData.fig;
    const old = this.badges[node];
    if (old) old.visible = false;
    if (this.reduceMotion) { stack.push(piece); this.refreshNode(node); return; }
    const dropFrom = rest + 3.2;
    const contact = below ? rest + HEIGHT[below.userData.troop] * PIECE_SCALE : rest;
    await this.stage.tween(360, k => { piece.position.y = contact + (dropFrom - contact) * (1 - k * k); });
    if (below) {
      const bfig = below.userData.fig;
      await this.stage.tween(150, k => {
        const q = 1 - .97 * k;
        place(bfig, T, q);
        piece.position.y = rest + (contact - rest) * q;
      });
      bfig.visible = false;
      place(bfig, T);
    }
    await this.stage.tween(260, k => {
      const b = Math.sin(k * Math.PI);
      piece.position.y = rest + b * .06;
      place(fig, T, 1 - .12 * b);
    });
    piece.position.y = rest;
    place(fig, T);
    stack.push(piece);
    this.refreshNode(node);
  }

  async animateRemove(node: string): Promise<void> {
    const stack = this.stacks[node];
    const piece = stack.pop();
    if (!piece) return;
    const old = this.badges[node];
    if (old) old.visible = false;
    if (!this.reduceMotion) {
      const base = piece.scale.x;
      await this.stage.tween(320, k => {
        piece.scale.setScalar(base * (1 + k * .35));
        piece.position.y += k * .02;
        piece.traverse(o => {
          const m = o as THREE.Mesh;
          if (m.isMesh) m.visible = k < .85 || Math.floor(k * 30) % 2 === 0;
        });
      });
    }
    this.dispose(piece);
    const revealed = stack.at(-1);
    if (revealed && !this.reduceMotion) {
      const fig = revealed.userData.fig;
      fig.visible = true;
      await this.stage.tween(260, k => place(fig, T, Math.max(.05, easeOutBack(k))));
      place(fig, T);
    }
    this.refreshNode(node);
  }
}
