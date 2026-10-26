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

function starCanvas(side: Side, medals: number, goal: number): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = 220; c.height = 132;
  const x = c.getContext('2d')!;
  const { main, dark } = TEAM_CSS[side];
  x.fillStyle = 'rgba(20,25,35,.3)'; x.beginPath(); x.roundRect(10, 16, 204, 112, 30); x.fill();
  x.fillStyle = dark; x.beginPath(); x.roundRect(6, 8, 204, 112, 30); x.fill();
  x.fillStyle = main; x.beginPath(); x.roundRect(6, 4, 204, 106, 30); x.fill();
  x.strokeStyle = '#f0c24a'; x.lineWidth = 7; x.beginPath(); x.roundRect(9, 7, 198, 100, 27); x.stroke();
  x.fillStyle = '#ffd84a'; x.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 17 : 38;
    x.lineTo(56 + Math.cos(a) * r, 60 + Math.sin(a) * r);
  }
  x.closePath(); x.fill();
  x.strokeStyle = '#a87510'; x.lineWidth = 4; x.stroke();
  x.fillStyle = '#ffffff'; x.textBaseline = 'middle'; x.textAlign = 'left';
  x.font = '800 64px "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';
  x.lineWidth = 8; x.strokeStyle = dark; x.strokeText(String(medals), 102, 62); x.fillText(String(medals), 102, 62);
  const w = x.measureText(String(medals)).width;
  x.font = '800 34px "Baloo 2", "Arial Rounded MT Bold", system-ui, sans-serif';
  x.fillStyle = 'rgba(255,255,255,.85)'; x.fillText(`/${goal}`, 108 + w, 70);
  return c;
}

export class BoardView {
  readonly board: BoardScene;
  private stacks: Record<string, Piece[]> = {};
  private badges: Record<string, THREE.Sprite> = {};
  private reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private unhook: () => void;
  private starSprites = {} as Record<Side, THREE.Sprite>;
  private starKey = '';

  constructor(private stage: Stage, state: GameState) {
    this.board = buildBoard(state.map, stage.scene);
    enableShadows(this.board.group);
    for (const id of Object.keys(state.map.nodes)) this.stacks[id] = [];
    this.unhook = stage.onFrame(t => {
      this.board.pulse(t);
      if (this.reduceMotion) return;
      for (const fn of this.board.ticks) fn(t);
      for (const stack of Object.values(this.stacks)) {
        const topPiece = stack.at(-1);
        if (topPiece) for (const fn of figureTicks(topPiece)) fn(t);
      }
    });
    for (const side of ['red', 'blue'] as Side[]) {
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
      const { width: W, height: H } = state.map;
      const p = this.board.nodeW('hqR').clone();
      const corner = side === 'red' ? [.55, H - .5] : [W - .55, .5];
      p.set((corner[0] - W / 2) * 1.6, Y0 + .45, (corner[1] - H / 2) * 1.6);
      sprite.position.copy(p);
      sprite.scale.set(1.25, .75, 1);
      sprite.renderOrder = 9;
      this.board.group.add(sprite);
      this.starSprites[side] = sprite;
    }
    this.sync(state);
    document.fonts?.ready.then(() => { this.starKey = ''; this.updateStars(state); });
  }

  private updateStars(s: GameState) {
    const key = `${s.medals.red}/${s.medals.blue}/${s.map.objective}`;
    if (key === this.starKey) return;
    this.starKey = key;
    for (const side of ['red', 'blue'] as Side[]) {
      const m = this.starSprites[side].material;
      m.map?.dispose();
      const tex = new THREE.CanvasTexture(starCanvas(side, s.medals[side], s.map.objective));
      tex.colorSpace = THREE.SRGBColorSpace;
      m.map = tex;
      m.needsUpdate = true;
    }
  }

  get group() { return this.board.group; }

  destroy() {
    this.unhook();
    this.stage.scene.remove(this.board.group);
    this.board.group.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh && !m.userData.outline) m.geometry.dispose(); });
  }

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
    if (this.starSprites.red) this.updateStars(s);
    this.board.setLinks(
      { red: connected(s, 'red'), blue: connected(s, 'blue') },
      { red: reachable(s, 'red'), blue: reachable(s, 'blue') },
    );
  }

  screenOf(node: string, lift = .3): [number, number] {
    const p = this.board.nodeW(node).clone();
    p.y = Y0 + lift;
    return this.stage.toScreen(this.board.group.localToWorld(p));
  }

  starScreen(side: Side): [number, number] {
    return this.stage.toScreen(this.starSprites[side].getWorldPosition(new THREE.Vector3()));
  }

  ring(node: string, color: number, size: number, ms: number) {
    if (this.reduceMotion) return Promise.resolve();
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.RingGeometry(.42, .52, 40), mat);
    const p = this.board.nodeW(node);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(p.x, Y0 + .12, p.z);
    this.board.group.add(mesh);
    return this.stage.tween(ms, k => {
      mesh.scale.setScalar(.4 + k * size);
      mat.opacity = (1 - k) * .9;
    }).then(() => { this.board.group.remove(mesh); mesh.geometry.dispose(); mat.dispose(); });
  }

  async animatePlace(tile: Tile, node: string, hqId?: string): Promise<void> {
    const stack = this.stacks[node];
    const below = stack.at(-1);
    const piece = this.newPiece(tile, node, stack.length);
    const rest = piece.position.y;
    const fig = piece.userData.fig;
    const old = this.badges[node];
    if (old) old.visible = false;
    if (this.reduceMotion) { stack.push(piece); this.refreshNode(node); return; }
    const contact = below ? rest + HEIGHT[below.userData.troop] * PIECE_SCALE : rest;
    if (tile.troop === 'hop' && hqId) {
      const from = this.board.nodeW(hqId), to = piece.position.clone();
      await this.stage.tween(620, k => {
        piece.position.set(from.x + (to.x - from.x) * k, contact + Math.sin(k * Math.PI) * 3.4 + (1 - k) * .4, from.z + (to.z - from.z) * k);
        piece.rotation.x = Math.sin(k * Math.PI) * -.4;
      });
      piece.rotation.x = 0;
    } else {
      const dropFrom = rest + 3.2;
      await this.stage.tween(360, k => { piece.position.y = contact + (dropFrom - contact) * (1 - k * k); });
    }
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
    void this.ring(node, 0xfff4d6, 1.6, 420);
    await this.stage.tween(260, k => {
      const b = Math.sin(k * Math.PI);
      piece.position.y = rest + b * .06;
      place(fig, T, 1 - .12 * b);
    });
    piece.position.y = rest;
    place(fig, T);
    stack.push(piece);
    await this.flourish(piece, node);
    this.refreshNode(node);
  }

  private async flourish(piece: Piece, node: string) {
    const fig = piece.userData.fig, baseRot = piece.rotation.y;
    switch (piece.userData.troop) {
      case 'pip':
        await this.stage.tween(480, k => { piece.rotation.y = baseRot + k * Math.PI * 2; });
        piece.rotation.y = baseRot;
        break;
      case 'boing':
        await this.stage.tween(420, k => place(fig, T, 1 + Math.sin(k * Math.PI) * .45));
        place(fig, T);
        break;
      case 'brix':
        await this.stage.tween(200, k => { piece.rotation.x = -k * .45; });
        void this.ring(node, 0xffd27a, 2.4, 380);
        this.stage.shake(.06, 180);
        await this.stage.tween(220, k => { piece.rotation.x = -.45 * (1 - k); });
        piece.rotation.x = 0;
        break;
      case 'rexie':
        this.stage.shake(.16, 520);
        void this.ring(node, 0xffffff, 3.2, 600);
        await this.stage.tween(520, k => place(fig, T, 1 + Math.sin(k * Math.PI * 3) * .08 * (1 - k)));
        place(fig, T);
        break;
      case 'clank':
        void this.ring(node, 0x5ff2ff, 2, 380);
        await this.ring(node, 0x5ff2ff, 1.2, 300);
        break;
      case 'mira':
      case 'bruno':
        await this.stage.tween(320, k => { piece.position.y += Math.sin(k * Math.PI) * .012; });
        break;
    }
  }

  async animateClaim(region: number, side: Side): Promise<void> {
    const cluster = this.board.medalGroups[region];
    if (!cluster || !cluster.visible) return;
    const target = this.starSprites[side].position.clone();
    const medals = [...cluster.children];
    cluster.visible = false;
    if (this.reduceMotion) return;
    const flights = medals.map((m, i) => {
      const copy = m.clone(true);
      const start = cluster.localToWorld(m.position.clone());
      this.board.group.worldToLocal(start);
      copy.position.copy(start);
      copy.scale.copy(m.scale);
      this.board.group.add(copy);
      const base = copy.scale.x;
      return new Promise<void>(done => setTimeout(done, i * 110)).then(() => this.stage.tween(640, k => {
        const e = k * k * (3 - 2 * k);
        copy.position.set(start.x + (target.x - start.x) * e, start.y + (target.y - start.y) * e + Math.sin(k * Math.PI) * 2.2, start.z + (target.z - start.z) * e);
        copy.rotation.y = k * Math.PI * 3;
        copy.scale.setScalar(base * (1 + Math.sin(k * Math.PI) * .6 - k * .5));
      })).then(() => { this.board.group.remove(copy); });
    });
    await Promise.all(flights);
    const sprite = this.starSprites[side], sx = sprite.scale.x, sy = sprite.scale.y;
    await this.stage.tween(300, k => { const b = 1 + Math.sin(k * Math.PI) * .35; sprite.scale.set(sx * b, sy * b, 1); });
    sprite.scale.set(sx, sy, 1);
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
