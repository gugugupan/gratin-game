import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { MapDef, Region, Side } from '../engine';
import { numberGeometry } from './figures';
import { addScenery } from './scenery';
import { B, M, TEAM, add, collectTicks, grp, paint, pyramid, setBuildSide, teamMat, tick, type Tick } from './kit';

export const U = 1.6;
export const Y0 = .125;
export const PAD_S = .65;
export const HQ_S = .8;
export const PAD_TOP = .16 * PAD_S;
const HALF = { base: .66 * PAD_S, crate: .66 * PAD_S, garden: .66 * PAD_S, bridge: .66 * PAD_S, hq: 1.05 * HQ_S };

export interface Theme {
  grass: string;
  sky: number;
  dirt: [string, string];
  stones: [number, number];
  river?: number;
  trees: number;
  outside: number;
  paving?: boolean;
}
const THEMES: Record<string, Theme> = {
  'castle-field': { grass: '#78c257', sky: 0xa9d68f, dirt: ['#94703f', '#d3ad72'], stones: [0xe3cfa2, 0xd2ba88], trees: 1, outside: .6 },
  'river-banks': { grass: '#93b955', sky: 0x9fcbe0, dirt: ['#8a6a3c', '#c9a46a'], stones: [0xd8c59c, 0xc2ab80], river: 5, trees: .9, outside: .5 },
  'block-town': { grass: '#cfc8b8', sky: 0xb9c9d6, dirt: ['#7d7a74', '#a9a59c'], stones: [0xe6e1d6, 0xcfc9bc], trees: .45, outside: 0, paving: true },
};
function paveTiles(x: CanvasRenderingContext2D, W: number, H: number, size: number) {
  for (let ty = 0; ty < H; ty += size) for (let tx = 0; tx < W; tx += size) {
    x.fillStyle = rand() > .5 ? 'rgba(255,255,255,.07)' : 'rgba(60,50,30,.06)';
    x.fillRect(tx + 2, ty + 2, size - 4, size - 4);
  }
  x.strokeStyle = 'rgba(90,82,68,.35)'; x.lineWidth = 2;
  for (let ty = 0; ty <= H; ty += size) { x.beginPath(); x.moveTo(0, ty); x.lineTo(W, ty); x.stroke(); }
  for (let tx = 0; tx <= W; tx += size) { x.beginPath(); x.moveTo(tx, 0); x.lineTo(tx, H); x.stroke(); }
}
export const themeFor = (mapId: string): Theme => THEMES[mapId] ?? THEMES['castle-field'];
const RIVER_HALF = .42;

let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

export function centroid(map: MapDef, r: Region): [number, number] {
  const pts = r.nodes.map(id => map.nodes[id].pos);
  return [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
}

function flower(x: CanvasRenderingContext2D, px: number, py: number, r: number, color: string) {
  x.fillStyle = color;
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    x.beginPath(); x.arc(px + Math.cos(a) * r, py + Math.sin(a) * r, r * .8, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = '#f2a900'; x.beginPath(); x.arc(px, py, r * .6, 0, Math.PI * 2); x.fill();
}
function tuft(x: CanvasRenderingContext2D, px: number, py: number, color: string) {
  x.strokeStyle = color; x.lineWidth = 2.2;
  for (const a of [-.55, 0, .55]) {
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.sin(a) * 8, py - 9 + Math.abs(a) * 3); x.stroke();
  }
}

function drawBoard(map: MapDef, theme: Theme): HTMLCanvasElement {
  seed = 7;
  const BW = map.width, BH = map.height;
  const W = 1200, H = Math.round(W * BH / BW), k = W / BW;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  const P = ([px, py]: [number, number]): [number, number] => [px * k, py * k];
  const nodes = Object.values(map.nodes);
  x.fillStyle = theme.grass; x.fillRect(0, 0, W, H);
  if (theme.paving) paveTiles(x, W, H, 64);
  else for (let i = 0; i < 1400; i++) {
    x.fillStyle = rand() > .5 ? 'rgba(255,255,220,.06)' : 'rgba(20,70,10,.07)';
    x.beginPath(); x.ellipse(rand() * W, rand() * H, 12 + rand() * 46, 6 + rand() * 22, rand() * 3, 0, Math.PI * 2); x.fill();
  }
  for (const r of map.regions) {
    const pts = r.nodes.map(id => P(map.nodes[id].pos));
    x.save();
    x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath();
    x.fillStyle = theme.paving ? (r.medals ? 'rgba(130,200,90,.55)' : 'rgba(120,190,85,.35)') : r.medals ? 'rgba(205,240,120,.32)' : 'rgba(30,100,25,.09)';
    x.fill();
    if (r.medals) {
      x.clip();
      const [cx, cy] = P(centroid(map, r));
      const g = x.createRadialGradient(cx, cy, 10, cx, cy, 180);
      g.addColorStop(0, 'rgba(255,236,150,.55)'); g.addColorStop(1, 'rgba(255,236,150,0)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++) {
        const a = rand() * Math.PI * 2, d = 70 + rand() * 170;
        flower(x, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2.6 + rand() * 2, ['#fff7e0', '#ffd84a', '#ff9fb6', '#c3b2ff'][rand() * 4 | 0]);
      }
    }
    x.restore();
  }
  for (let i = 0; i < (theme.paving ? 0 : 9000); i++) {
    const bx = rand() * W, by = rand() * H, l = 5 + rand() * 8, a = -Math.PI / 2 + (rand() - .5) * .9;
    x.strokeStyle = rand() > .5 ? 'rgba(40,100,25,.32)' : 'rgba(200,245,150,.28)';
    x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a) * l, by + Math.sin(a) * l); x.stroke();
  }
  x.lineCap = 'round'; x.lineJoin = 'round';
  const strokeEdges = (w: number, style: string, dy = 0) => {
    x.lineWidth = w * k; x.strokeStyle = style;
    for (const [a, b] of map.edges) {
      const [ax, ay] = P(map.nodes[a].pos), [bx, by] = P(map.nodes[b].pos);
      x.beginPath(); x.moveTo(ax, ay + dy); x.lineTo(bx, by + dy); x.stroke();
    }
  };
  strokeEdges(.33, 'rgba(25,60,10,.2)', 6);
  strokeEdges(.28, theme.dirt[0]);
  strokeEdges(.23, theme.dirt[1]);
  strokeEdges(.11, 'rgba(255,240,205,.22)');
  for (const [a, b] of map.edges) {
    const A = P(map.nodes[a].pos), Bp = P(map.nodes[b].pos);
    const len = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
    const nx = -(Bp[1] - A[1]) / len, ny = (Bp[0] - A[0]) / len;
    for (let t = 0; t < len; t += 12) {
      const u = t / len, px = A[0] + (Bp[0] - A[0]) * u, py = A[1] + (Bp[1] - A[1]) * u;
      if (rand() < .55) {
        const o = (rand() - .5) * .2 * k;
        x.fillStyle = rand() > .5 ? '#b08a55' : '#efd6a2';
        x.beginPath(); x.ellipse(px + nx * o, py + ny * o, 2 + rand() * 3, 1.5 + rand() * 2, rand() * 3, 0, Math.PI * 2); x.fill();
      }
      if (rand() < .4) {
        const side = rand() > .5 ? 1 : -1, o = side * (.12 * k + rand() * 6);
        tuft(x, px + nx * o, py + ny * o, rand() > .5 ? 'rgba(45,115,30,.85)' : 'rgba(120,190,70,.85)');
      }
    }
  }
  for (const n of nodes) {
    const [px, py] = P(n.pos);
    if (n.type === 'hq') {
      const s = 1.55 * HQ_S * k;
      x.fillStyle = 'rgba(25,60,10,.25)'; x.beginPath(); x.roundRect(px - s / 2 + 6, py - s / 2 + 10, s, s, 26); x.fill();
      x.fillStyle = '#a49e91'; x.beginPath(); x.roundRect(px - s / 2, py - s / 2, s, s, 26); x.fill();
      const wg = x.createLinearGradient(px - s / 2, py - s / 2, px + s / 2, py + s / 2);
      wg.addColorStop(0, '#46aebb'); wg.addColorStop(1, '#7fd5dc');
      x.fillStyle = wg; x.beginPath(); x.roundRect(px - s / 2 + 14, py - s / 2 + 14, s - 28, s - 28, 18); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.35)'; x.lineWidth = 3;
      for (let i = 0; i < 14; i++) {
        const rx = px + (rand() - .5) * (s - 50), ry = py + (rand() - .5) * (s - 50);
        x.beginPath(); x.arc(rx, ry, 8 + rand() * 8, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
      }
    } else {
      const s = .7 * k;
      x.fillStyle = 'rgba(25,60,10,.22)'; x.beginPath(); x.roundRect(px - s / 2 + 4, py - s / 2 + 7, s, s, 16); x.fill();
      x.fillStyle = '#94703f'; x.beginPath(); x.roundRect(px - s / 2, py - s / 2, s, s, 16); x.fill();
      x.fillStyle = '#c9a36a'; x.beginPath(); x.roundRect(px - s / 2 + 6, py - s / 2 + 6, s - 12, s - 12, 12); x.fill();
    }
  }
  for (let i = 0; i < 380; i++) {
    const bx = .3 + rand() * (BW - .6), by = .3 + rand() * (BH - .6);
    if (nodes.some(n => Math.hypot(n.pos[0] - bx, n.pos[1] - by) < .6)) continue;
    const [px, py] = P([bx, by]);
    if (rand() < .55) flower(x, px, py, 2.2 + rand() * 1.6, ['#ffffff', '#ffe26a', '#ffb3c4'][rand() * 3 | 0]);
    else tuft(x, px, py, 'rgba(45,115,30,.7)');
  }
  return c;
}

function drawGrassTile(grass: string, paving = false): HTMLCanvasElement {
  const S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d')!;
  x.fillStyle = grass; x.fillRect(0, 0, S, S);
  if (paving) { paveTiles(x, S, S, 64); return c; }
  const wrap = (draw: (ox: number, oy: number) => void) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) draw(ox, oy); };
  for (let i = 0; i < 260; i++) {
    const px = rand() * S, py = rand() * S, rx = 12 + rand() * 46, ry = 6 + rand() * 22, rot = rand() * 3;
    x.fillStyle = rand() > .5 ? 'rgba(255,255,220,.06)' : 'rgba(20,70,10,.07)';
    wrap((ox, oy) => { x.beginPath(); x.ellipse(px + ox, py + oy, rx, ry, rot, 0, Math.PI * 2); x.fill(); });
  }
  for (let i = 0; i < 2200; i++) {
    const bx = rand() * S, by = rand() * S, l = 5 + rand() * 8, a = -Math.PI / 2 + (rand() - .5) * .9;
    x.strokeStyle = rand() > .5 ? 'rgba(40,100,25,.32)' : 'rgba(200,245,150,.28)';
    x.lineWidth = 1.6;
    wrap((ox, oy) => { x.beginPath(); x.moveTo(bx + ox, by + oy); x.lineTo(bx + ox + Math.cos(a) * l, by + oy + Math.sin(a) * l); x.stroke(); });
  }
  for (let i = 0; i < 70; i++) {
    const px = rand() * S, py = rand() * S;
    if (rand() < .55) flower(x, px, py, 2.2 + rand() * 1.6, ['#ffffff', '#ffe26a', '#ffb3c4'][rand() * 3 | 0]);
    else tuft(x, px, py, 'rgba(45,115,30,.7)');
  }
  return c;
}

const starGeo = () => numberGeometry('★');

function basePad(g: THREE.Object3D) {
  B(g, [1.32, .12, 1.32], M.stone, [0, .06, 0], .04);
  B(g, [1.2, .04, 1.2], M.stoneTop, [0, .14, 0], .02);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, [.16, .05, .16], M.stoneDark, [sx * .58, .125, sz * .58], .02);
}
function cratePad(g: THREE.Object3D) {
  B(g, [1.32, .13, 1.32], M.woodDark, [0, .065, 0], .03);
  for (let i = 0; i < 4; i++) B(g, [1.2, .03, .27], M.woodLight, [0, .145, -.44 + i * .293], .01);
  for (const s of [-1, 1]) {
    B(g, [1.36, .05, .08], M.woodDark, [0, .14, s * .64], .015);
    B(g, [.08, .05, 1.36], M.woodDark, [s * .64, .14, 0], .015);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, [.12, .06, .12], M.gold, [sx * .63, .15, sz * .63], .02);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    const plate = grp(g, [Math.sin(a) * .67, .07, Math.cos(a) * .67], [0, a, 0]);
    B(plate, [.2, .1, .012], M.goldDark, [0, 0, 0], .006);
    add(plate, starGeo(), M.yellow, [0, 0, .012]);
  }
}
function gardenPad(g: THREE.Object3D) {
  B(g, [1.32, .13, 1.32], M.stone, [0, .065, 0], .04);
  B(g, [1.18, .03, 1.18], M.lawn, [0, .145, 0], .01);
  for (const s of [-1, 1]) {
    B(g, [1.38, .14, .1], M.hedge, [0, .2, s * .64], .03);
    B(g, [.1, .14, 1.18], M.hedge, [s * .64, .2, 0], .03);
  }
  for (let i = 0; i < 10; i++) {
    const a = rand() * Math.PI * 2, side = rand() * 4 | 0, t = (rand() - .5) * 1.2;
    const px = side < 2 ? t : (side === 2 ? -.64 : .64), pz = side < 2 ? (side === 0 ? -.64 : .64) : t;
    B(g, [.05, .04, .05], rand() > .5 ? M.pink : M.white, [px, .29, pz], .015, [0, a, 0]);
  }
}
function bridgePad(g: THREE.Object3D) {
  for (let i = 0; i < 5; i++) B(g, [1.32, .06, .24], i % 2 ? M.woodLight : M.wood, [0, .13, -.52 + i * .26], .02, [0, (rand() - .5) * .06, 0]);
  for (const s of [-1, 1]) {
    B(g, [.12, .12, 1.4], M.woodDark, [s * .6, .08, 0], .03);
    for (const z of [-.6, .6]) B(g, [.12, .34, .12], M.woodDark, [s * .66, .2, z], .03);
  }
}
function waterTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#3fa6cf'); g.addColorStop(.5, '#5cc0e0'); g.addColorStop(1, '#3fa6cf');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 3; x.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const px = rand() * 256, py = 30 + rand() * 196, w = 14 + rand() * 22;
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + w / 2, py - 5, px + w, py); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function castle(g: THREE.Object3D, side: Side) {
  setBuildSide(side);
  const face = side === 'red' ? 1 : -1;
  g.rotation.y = face > 0 ? Math.PI / 2 : -Math.PI / 2;
  B(g, [2.1, .18, 2.1], M.stone, [0, .09, 0], .05);
  for (const s of [-1, 1]) {
    B(g, [1.5, .55, .22], M.stoneTop, [0, .455, s * .75], .04);
    B(g, [.22, .55, 1.5], M.stoneTop, [s * .75, .455, 0], .04);
    for (const k of [-.5, -.17, .17, .5]) {
      B(g, [.16, .14, .24], M.stoneTop, [k, .8, s * .75], .03);
      B(g, [.24, .14, .16], M.stoneTop, [s * .75, .8, k], .03);
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    B(g, [.46, .95, .46], M.stone, [sx * .78, .655, sz * .78], .06);
    add(g, pyramid(.38, .5), teamMat(), [sx * .78, 1.38, sz * .78], [0, Math.PI / 4, 0]);
    B(g, [.1, .16, .02], M.dark, [sx * .78, .85, sz * (.78 + .235)], .02);
  }
  B(g, [.8, 1.15, .8], M.stoneTop, [0, .755, 0], .06);
  add(g, pyramid(.62, .6), teamMat(), [0, 1.63, 0], [0, Math.PI / 4, 0]);
  B(g, [.06, .44, .44], M.wood, [.87, .4, 0], .03);
  B(g, [.04, .34, .32], M.dark, [.9, .37, 0], .03);
  B(g, [.03, .4, .28], teamMat(), [.415, .95, 0], .01);
  B(g, [.02, .12, .12], M.gold, [.432, .98, 0], .01, [Math.PI / 4, 0, 0]);
  for (const s of [-1, 1]) {
    B(g, [.07, .55, .07], M.gun, [1.2, .45, s * .5], .02);
    B(g, [.14, .16, .14], M.lamp, [1.2, .8, s * .5], .03);
    B(g, [.18, .05, .18], M.gun, [1.2, .9, s * .5], .02);
  }
  B(g, [.03, .5, .03], M.gun, [0, 2.18, 0], .01);
  const flag = grp(g, [0, 2.33, 0]);
  B(flag, [.38, .22, .02], teamMat(), [.19, 0, 0], .01);
  tick(t => { flag.rotation.y = Math.sin(t * 3 + face) * .35; });
}

export interface BoardScene {
  group: THREE.Group;
  ticks: Tick[];
  nodeW: (id: string) => THREE.Vector3;
  medalGroups: (THREE.Group | null)[];
  setLinks: (connected: Record<Side, Set<string>>, reach: Record<Side, Set<string>>) => void;
  setTargets: (ids: string[], tone: 'place' | 'remove') => void;
  setHover: (id: string | null) => void;
  pulse: (t: number) => void;
}

export function buildBoard(map: MapDef, scene: THREE.Scene): BoardScene {
  const theme = themeFor(map.id);
  const BW = map.width, BH = map.height;
  const toW = ([x, y]: [number, number]) => new THREE.Vector3((x - BW / 2) * U, 0, (y - BH / 2) * U);
  const nodeW = (id: string) => toW(map.nodes[id].pos);
  const board = new THREE.Group();
  scene.add(board);

  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.Fog(theme.sky, 40, 90);
  const groundTex = new THREE.CanvasTexture(drawGrassTile(theme.grass, theme.paving));
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(63, 63);
  groundTex.anisotropy = 8;
  const ground = add(board, new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ map: groundTex, roughness: .9 }), [0, Y0 - .004, 0], [-Math.PI / 2, 0, 0]);
  ground.receiveShadow = true;
  const boardTex = new THREE.CanvasTexture(drawBoard(map, theme));
  boardTex.colorSpace = THREE.SRGBColorSpace;
  boardTex.anisotropy = 8;
  add(board, new THREE.PlaneGeometry(BW * U, BH * U), new THREE.MeshStandardMaterial({ map: boardTex, roughness: .9 }), [0, Y0 + .002, 0], [-Math.PI / 2, 0, 0]);
  document.fonts?.ready.then(() => { boardTex.image = drawBoard(map, theme); boardTex.needsUpdate = true; });
  let water: THREE.CanvasTexture | null = null;
  if (theme.river !== undefined) {
    const z = (theme.river - BH / 2) * U, w = RIVER_HALF * 2 * U;
    water = waterTexture();
    water.repeat.set(60, 1);
    add(board, new THREE.PlaneGeometry(260, w), new THREE.MeshStandardMaterial({ map: water, roughness: .25, metalness: .1 }), [0, Y0 + .004, z], [-Math.PI / 2, 0, 0]);
    for (const s of [-1, 1]) B(board, [260, .03, .16], M.path2, [0, Y0 + .01, z + s * (w / 2 + .04)], .01);
  }

  const stoneA = paint(theme.stones[0], { roughness: .8, clearcoat: 0 }), stoneB = paint(theme.stones[1], { roughness: .8, clearcoat: 0 });
  for (const [a, b] of map.edges) {
    const pa = nodeW(a), pb = nodeW(b);
    const d = pb.clone().sub(pa);
    const len = d.length();
    d.normalize();
    const reach = (id: string) => HALF[map.nodes[id].type] / Math.max(Math.abs(d.x), Math.abs(d.z));
    const s = reach(a), e = reach(b);
    const span = len - s - e;
    if (span < .2) continue;
    const n = Math.max(1, Math.round(span / .32));
    const step = span / n;
    const ang = Math.atan2(-d.z, d.x);
    for (let i = 0; i < n; i++) {
      const p = pa.clone().addScaledVector(d, s + step * (i + .5));
      B(board, [step * .78, .06, .34], rand() > .5 ? stoneA : stoneB, [p.x, Y0 + .03, p.z], .02, [0, ang + (rand() - .5) * .14, 0]);
    }
  }

  const ticks = collectTicks(() => {
    for (const n of Object.values(map.nodes)) {
      const p = toW(n.pos);
      const g = grp(board, [p.x, Y0, p.z]);
      g.scale.setScalar(n.type === 'hq' ? HQ_S : PAD_S);
      if (n.type === 'base') basePad(g);
      else if (n.type === 'crate') cratePad(g);
      else if (n.type === 'garden') gardenPad(g);
      else if (n.type === 'bridge') bridgePad(g);
      else castle(g, n.hqOf!);
    }
  });

  const CLUSTER: Record<number, [number, number][]> = { 1: [[0, 0]], 2: [[-.2, 0], [.2, 0]], 3: [[-.2, .13], [.2, .13], [0, -.22]] };
  const DAIS: Record<number, [number, number]> = { 1: [.5, .5], 2: [.82, .48], 3: [.82, .78] };
  const medalGroups = map.regions.map(r => {
    if (!r.medals) return null;
    const c = toW(centroid(map, r));
    const [dw, dd] = DAIS[r.medals] ?? [.82, .78];
    B(board, [dw + .06, .03, dd + .06], M.stone, [c.x, Y0 + .015, c.z], .015);
    B(board, [dw, .05, dd], M.stoneTop, [c.x, Y0 + .025, c.z], .02);
    const cluster = grp(board, [c.x, Y0 + .05, c.z]);
    for (const [dx, dz] of CLUSTER[r.medals] ?? CLUSTER[3]) {
      const g = grp(cluster, [dx, 0, dz], [0, (rand() - .5) * .5, 0]);
      g.scale.setScalar(.8);
      B(g, [.4, .07, .4], M.gold, [0, .035, 0], .03);
      B(g, [.3, .012, .3], M.goldDark, [0, .072, 0], .006);
      add(g, starGeo(), M.yellow, [0, .084, 0], [-Math.PI / 2, 0, 0]).scale.setScalar(2);
    }
    return cluster;
  });

  scatterDecor(map, board, toW, nodeW, theme);
  addScenery(map, board, Y0, U, theme.river).catch(e => console.warn('scenery', e));

  const linkGroup = grp(board);
  const flat = (parent: THREE.Object3D, sx: number, sz: number, x: number, y: number, z: number, mat: THREE.Material) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    parent.add(m);
  };
  const frameBars = (o: number, w: number): [number, number, number, number][] =>
    [[0, o - w / 2, 2 * o, w], [-(o - w / 2), 0, w, 2 * o - 2 * w], [0, -(o - w / 2), 2 * o, w], [o - w / 2, 0, w, 2 * o - 2 * w]];
  const linkMats = new Map<string, THREE.MeshBasicMaterial>();
  const linkMat = (side: Side, opacity: number) => {
    const key = side + opacity;
    let m = linkMats.get(key);
    if (!m) { m = new THREE.MeshBasicMaterial({ color: TEAM[side].main, transparent: true, opacity, depthWrite: false }); linkMats.set(key, m); }
    return m;
  };
  function setLinks(connected: Record<Side, Set<string>>, reach: Record<Side, Set<string>>) {
    for (const child of [...linkGroup.children]) { linkGroup.remove(child); (child as THREE.Mesh).geometry.dispose(); }
    const level = (side: Side, id: string) => connected[side].has(id) ? .62 : reach[side].has(id) ? .32 : 0;
    for (const id of Object.keys(map.nodes)) {
      if (map.nodes[id].type === 'hq') continue;
      const r = level('red', id), b = level('blue', id);
      if (!r && !b) continue;
      const sides: [Side, number][] = r && b ? [['red', r], ['red', r], ['blue', b], ['blue', b]] : Array(4).fill(r ? ['red', r] : ['blue', b]);
      const p = nodeW(id);
      frameBars(.56, .1).forEach(([dx, dz, sx, sz], i) => flat(linkGroup, sx, sz, p.x + dx, Y0 + .07, p.z + dz, linkMat(sides[i][0], sides[i][1])));
      const top = Y0 + PAD_TOP + .003, half = .59 * PAD_S;
      if (sides[0][0] === sides[2][0]) flat(linkGroup, half * 2, half * 2, p.x, top, p.z, linkMat(sides[0][0], +(sides[0][1] * .35).toFixed(3)));
      else {
        flat(linkGroup, half * 2, half, p.x, top, p.z + half / 2, linkMat('red', +(r * .35).toFixed(3)));
        flat(linkGroup, half * 2, half, p.x, top, p.z - half / 2, linkMat('blue', +(b * .35).toFixed(3)));
      }
    }
  }

  const targetGroup = grp(board);
  const placeMat = new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: .6, depthWrite: false });
  const removeMat = new THREE.MeshBasicMaterial({ color: 0xff6b5e, transparent: true, opacity: .6, depthWrite: false });
  const hoverMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .85, depthWrite: false });
  const hoverGroup = grp(board);
  let pulseMat = placeMat;
  function ring(parent: THREE.Object3D, id: string, mat: THREE.Material, o: number, w: number, y: number) {
    const p = nodeW(id);
    const size = map.nodes[id].type === 'hq' ? o * 1.9 : o;
    for (const [dx, dz, sx, sz] of frameBars(size, w)) flat(parent, sx, sz, p.x + dx, y, p.z + dz, mat);
  }
  function setTargets(ids: string[], tone: 'place' | 'remove') {
    for (const child of [...targetGroup.children]) { targetGroup.remove(child); (child as THREE.Mesh).geometry.dispose(); }
    pulseMat = tone === 'place' ? placeMat : removeMat;
    for (const id of ids) ring(targetGroup, id, pulseMat, .62, .07, Y0 + .075);
  }
  function setHover(id: string | null) {
    for (const child of [...hoverGroup.children]) { hoverGroup.remove(child); (child as THREE.Mesh).geometry.dispose(); }
    if (id) ring(hoverGroup, id, hoverMat, .68, .1, Y0 + .08);
  }
  const pulse = (t: number) => {
    pulseMat.opacity = .3 + .45 * (Math.sin(t * 4) * .5 + .5);
    if (water) water.offset.x = t * .02;
  };

  return { group: board, ticks, nodeW, medalGroups, setLinks, setTargets, setHover, pulse };
}

function scatterDecor(map: MapDef, board: THREE.Group, toW: (p: [number, number]) => THREE.Vector3, nodeW: (id: string) => THREE.Vector3, theme: Theme) {
  const riverZ = theme.river === undefined ? null : (theme.river - map.height / 2) * U;
  const wet = (pz: number, pad: number) => riverZ !== null && Math.abs(pz - riverZ) < RIVER_HALF * U + pad;
  const BW = map.width, BH = map.height;
  const instReg = new Map<string, { geo: THREE.BufferGeometry; mat: THREE.Material; list: THREE.Matrix4[] }>();
  const q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  const RBG = (w: number, h: number, d: number, rad: number) => () => new RoundedBoxGeometry(w, h, d, 3, Math.min(rad, w / 2, h / 2, d / 2) * .98);
  const put = (key: string, geoFn: () => THREE.BufferGeometry, mat: THREE.Material, px: number, py: number, pz: number, ry = 0, s = 1) => {
    if (!instReg.has(key)) instReg.set(key, { geo: geoFn(), mat, list: [] });
    q.setFromEuler(e.set(0, ry, 0));
    instReg.get(key)!.list.push(new THREE.Matrix4().compose(pv.set(px, py, pz), q, sv.set(s, s, s)));
  };
  const tree = (px: number, pz: number, s: number, kind: number) => {
    const ry = rand() * Math.PI;
    put('trunk', RBG(.14, .36, .14, .03), M.trunk, px, Y0 + .18 * s, pz, ry, s);
    if (kind === 0) {
      put('t1', RBG(.72, .28, .72, .06), M.leafDark, px, Y0 + .5 * s, pz, ry, s);
      put('t2', RBG(.52, .26, .52, .06), M.leafMid, px, Y0 + .77 * s, pz, ry + .785, s);
      put('t3', RBG(.32, .22, .32, .05), M.leafLight, px, Y0 + 1.01 * s, pz, ry, s);
    } else {
      put('r1', RBG(.68, .5, .68, .1), M.leafMid, px, Y0 + .6 * s, pz, ry, s);
      put('r2', RBG(.44, .26, .44, .07), M.leafLight, px, Y0 + .95 * s, pz, ry + .4, s);
    }
  };
  const bush = (px: number, pz: number, s: number) => {
    const ry = rand() * Math.PI;
    put('b1', RBG(.36, .22, .34, .06), rand() > .5 ? M.leafDark : M.leafMid, px, Y0 + .11 * s, pz, ry, s);
    put('b2', RBG(.22, .16, .22, .05), M.leafLight, px + .16 * s, Y0 + .08 * s, pz + .08 * s, ry + .6, s);
  };
  const rock = (px: number, pz: number, s: number) => {
    const ry = rand() * Math.PI;
    put('k1', RBG(.3, .17, .24, .04), M.rock, px, Y0 + .08 * s, pz, ry, s);
    put('k2', RBG(.14, .1, .14, .03), M.rockLight, px + .18 * s, Y0 + .05 * s, pz - .06 * s, ry + 1, s);
  };
  const flowers = (px: number, pz: number) => {
    const mat = [M.flowerPink, M.flowerYellow, M.flowerWhite][rand() * 3 | 0];
    for (let i = 0; i < 5; i++) {
      const a = rand() * Math.PI * 2, d = rand() * .16;
      put('st', RBG(.015, .08, .015, .005), M.leafDark, px + Math.cos(a) * d, Y0 + .04, pz + Math.sin(a) * d);
      put('fl' + mat.uuid, RBG(.06, .04, .06, .012), mat, px + Math.cos(a) * d, Y0 + .09, pz + Math.sin(a) * d, a);
    }
  };
  const halfW = BW * U / 2, halfH = BH * U / 2;
  const segDist = (px: number, pz: number, a: THREE.Vector3, b: THREE.Vector3) => {
    const dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (pz - a.z) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(px - (a.x + dx * t), pz - (a.z + dz * t));
  };
  const medalSpots = map.regions.filter(r => r.medals).map(r => toW(centroid(map, r)));
  const badgeSpots = [toW([.45, BH - .45]), toW([BW - .45, .45])];
  const placed: [number, number, number][] = [];
  const free = (px: number, pz: number, clear: number) => {
    if (Math.abs(px) > halfW - .2 || Math.abs(pz) > halfH - .2 || wet(pz, .2 + clear)) return false;
    for (const n of Object.values(map.nodes)) {
      const p = toW(n.pos);
      if (Math.hypot(p.x - px, p.z - pz) < (n.type === 'hq' ? 1.5 : .62) + clear) return false;
    }
    for (const [a, b] of map.edges) if (segDist(px, pz, nodeW(a), nodeW(b)) < .26 + clear) return false;
    for (const m of medalSpots) if (Math.hypot(m.x - px, m.z - pz) < .7 + clear) return false;
    for (const b of badgeSpots) if (Math.hypot(b.x - px, b.z - pz) < 1.2) return false;
    for (const o of placed) if (Math.hypot(o[0] - px, o[1] - pz) < o[2] + clear) return false;
    return true;
  };
  const scatter = (count: number, clear: number, edgeBias: number, fn: (px: number, pz: number, s: number) => boolean | void) => {
    let n = 0, tries = 0;
    while (n < count && tries++ < count * 80) {
      let px: number, pz: number;
      if (rand() < edgeBias) {
        const side = rand() * 4 | 0, t = rand() * 2 - 1, m = rand() * 1.4;
        px = side < 2 ? t * halfW : (side === 2 ? -halfW + m : halfW - m);
        pz = side < 2 ? (side === 0 ? -halfH + m : halfH - m) : t * halfH;
      } else {
        px = (rand() * 2 - 1) * halfW; pz = (rand() * 2 - 1) * halfH;
      }
      const s = .8 + rand() * .45;
      if (!free(px, pz, clear * s)) continue;
      if (fn(px, pz, s) === false) continue;
      placed.push([px, pz, clear * s]);
      n++;
    }
  };
  scatter(Math.round(34 * theme.trees), .26, .85, (px, pz, s) => {
    if (Math.abs(pz) > halfH - 1.6) return false;
    tree(px, pz, s * .62, rand() > .45 ? 0 : 1);
  });
  scatter(36, .15, .5, (px, pz, s) => bush(px, pz, s * .7));
  scatter(24, .12, .4, (px, pz, s) => rock(px, pz, s * .7));
  scatter(70, .1, .2, (px, pz) => flowers(px, pz));
  const outside = (count: number, reach: number, fn: (px: number, pz: number, s: number) => void) => {
    let n = 0, tries = 0;
    while (n < count && tries++ < count * 40) {
      const px = (rand() * 2 - 1) * (halfW + reach), pz = (rand() * 2 - 1) * (halfH + reach);
      if ((Math.abs(px) < halfW + .3 && Math.abs(pz) < halfH + .3) || wet(pz, .5)) continue;
      const s = .8 + rand() * .5;
      if (placed.some(o => Math.hypot(o[0] - px, o[1] - pz) < o[2] + .3 * s)) continue;
      fn(px, pz, s);
      placed.push([px, pz, .3 * s]);
      n++;
    }
  };
  outside(Math.round(160 * theme.outside), 14, (px, pz, s) => bush(px, pz, s * .8));
  outside(Math.round(90 * theme.outside), 14, (px, pz, s) => rock(px, pz, s * .8));
  for (const r of instReg.values()) {
    const im = new THREE.InstancedMesh(r.geo, r.mat, r.list.length);
    r.list.forEach((m, i) => im.setMatrixAt(i, m));
    board.add(im);
  }
}
