import {
  ACESFilmicToneMapping,
  Clock,
  Color,
  DirectionalLight,
  Fog,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type MeshStandardMaterial,
} from 'three';
import {
  DELTA,
  OPP,
  PIVOTS,
  inGrid,
  isRock,
  passesOf,
  randomGarden,
  sameCell,
  sampleCodes,
  score,
  sideTo,
  solve,
  stars,
  type Cell,
  type GardenMap,
  type Pass,
  type Side,
  type SizeKey,
} from './engine';
import { LEVELS, type Level } from './levels';
import { buildGarden, buildMonk, type GardenScene } from './models';
import { SandPainter } from './sand';

type Mode = 'puzzle' | 'random' | 'free';
type Phase = 'menu' | 'intro' | 'play' | 'outro' | 'result';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
$('stage').appendChild(renderer.domElement);

const scene = new Scene();
scene.background = new Color('#d8e0dc');
scene.fog = new Fog('#d8e0dc', 18, 40);
const camera = new PerspectiveCamera(32, 1, 0.05, 100);
scene.add(new HemisphereLight('#fff6e5', '#6b7a4a', 1.1));
const sun = new DirectionalLight('#fff1d8', 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -9;
sun.shadow.camera.right = 9;
sun.shadow.camera.top = 9;
sun.shadow.camera.bottom = -9;
sun.shadow.camera.far = 40;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const fill = new DirectionalLight('#e8eef5', 0.7);
fill.position.set(3, 4, 12);
scene.add(fill);

const monk = buildMonk();
scene.add(monk.root, monk.rake);

interface Game {
  mode: Mode;
  map: GardenMap;
  level?: Level;
  size?: SizeKey;
  seed: number;
  par: number;
  limit: number;
  painter: SandPainter;
  targetPainter?: SandPainter;
  target: Int8Array | null;
  garden: GardenScene;
  path: Cell[];
  done: boolean;
}

let game: Game | null = null;
let phase: Phase = 'menu';
let menuT = 0;

const STAR_KEY = 'karesansui:stars';
function loadStars(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STAR_KEY) || '{}');
  } catch {
    return {};
  }
}
function saveStar(id: string, n: number) {
  try {
    const s = loadStars();
    s[id] = Math.max(s[id] || 0, n);
    localStorage.setItem(STAR_KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable */
  }
}

function playView(map: GardenMap) {
  const aspect = window.innerWidth / window.innerHeight;
  const w = map.cols + 3.4;
  const d = map.rows + 2.6;
  const fov = (camera.fov * Math.PI) / 180;
  const hFit = d / 2 / Math.tan(fov / 2);
  const wFit = w / 2 / Math.tan(fov / 2) / aspect;
  const h = Math.max(hFit, wFit) * 1.08;
  const tilt = (14 * Math.PI) / 180;
  const center = new Vector3(-0.7, 0, 0.05);
  return { pos: center.clone().add(new Vector3(0, Math.cos(tilt) * h, Math.sin(tilt) * h)), look: center };
}

function startGame(mode: Mode, opts: { level?: Level; size?: SizeKey; seed?: number }) {
  if (game) {
    scene.remove(game.garden.root);
    game.painter.dispose();
    game.targetPainter?.dispose();
  }
  const seed = opts.seed ?? Math.floor(Math.random() * 1e9);
  let map: GardenMap;
  let par = 0;
  let solution: Cell[] | null = null;
  if (mode === 'puzzle') {
    map = opts.level!.map;
    solution = solve(map);
    par = solution!.length;
  } else if (mode === 'random') {
    const g = randomGarden(opts.size!, seed);
    map = g.map;
    solution = g.solution;
    par = solution.length;
  } else {
    const g = randomGarden('large', seed);
    map = { ...g.map, entry: null, exit: null };
  }
  const painter = new SandPainter(map, seed);
  painter.paint([]);
  let targetPainter: SandPainter | undefined;
  let target: Int8Array | null = null;
  if (mode === 'puzzle' && solution) {
    targetPainter = new SandPainter(map, seed);
    const tp = passesOf(map, solution, true);
    targetPainter.paint(tp);
    target = sampleCodes(map, tp);
  }
  const garden = buildGarden(map, painter, seed);
  scene.add(garden.root);
  const center = new Vector3(-0.7, 0, 0);
  sun.position.copy(center).add(new Vector3(-5, 10, -4));
  sun.target.position.copy(center);
  game = {
    mode,
    map,
    level: opts.level,
    size: opts.size,
    seed,
    par,
    limit: mode === 'puzzle' ? par + 6 : mode === 'random' ? par + 4 : Infinity,
    painter,
    targetPainter,
    target,
    garden,
    path: [],
    done: false,
  };
  setupHud();
  refresh();
  resetVisual();
  beginIntro();
}

let monkAngle = 0;
let monkAngleTarget = 0;
let walkSpeed = 0;
let hold: Vector3 | null = null;
const rakeShown = new Vector3();
const monkShown = new Vector3();
let drawnKeys: string[] = [];
let sweep = 0;
let paintDirty = true;
let finishTimer = -1;
let lastClean = 0;
let maskDirty = true;
let pulse = 0;

const RAKE_LEAD = 0.55;
const SWEEP_SPEED = 3;

interface Seg {
  len: number;
  at(s: number): Vector3;
}

const lineSeg = (p0: Vector3, p1: Vector3): Seg => ({
  len: p0.distanceTo(p1),
  at: (s) => p0.clone().lerp(p1, p0.distanceTo(p1) ? s / p0.distanceTo(p1) : 0),
});

const arcSeg = (c: Vector3, r: number, a0: number, a1: number): Seg => ({
  len: Math.abs(a1 - a0) * r,
  at: (s) => {
    const a = a0 + (a1 - a0) * (s / (Math.abs(a1 - a0) * r));
    return new Vector3(c.x + Math.cos(a) * r, 0, c.z + Math.sin(a) * r);
  },
});

const EDGE: Record<Side, [number, number]> = { N: [0.5, 0], S: [0.5, 1], W: [0, 0.5], E: [1, 0.5] };

function cellPoint(map: GardenMap, c: number, r: number, u: number, v: number) {
  return new Vector3(c - map.cols / 2 + u, 0, r - map.rows / 2 + v);
}

function passSeg(map: GardenMap, p: Pass): Seg {
  const [au, av] = EDGE[p.a];
  const from = cellPoint(map, p.c, p.r, au, av);
  if (p.kind === 'half') return lineSeg(from, cellPoint(map, p.c, p.r, 0.5, 0.5));
  const [bu, bv] = EDGE[p.b!];
  if (p.kind === 'straight') return lineSeg(from, cellPoint(map, p.c, p.r, bu, bv));
  const [pu, pv] = PIVOTS[p.pivot];
  const a0 = Math.atan2(av - pv, au - pu);
  let a1 = Math.atan2(bv - pv, bu - pu);
  while (a1 - a0 > Math.PI) a1 -= Math.PI * 2;
  while (a0 - a1 > Math.PI) a1 += Math.PI * 2;
  return arcSeg(cellPoint(map, p.c, p.r, pu, pv), 0.5, a0, a1);
}

/** The rake's track: walk-in from the entry gate, one segment per raked cell, then the head cell. */
function track(g: Game, passes: Pass[]) {
  const segs: Seg[] = [];
  const { map, path } = g;
  if (map.entry) {
    const [u, v] = EDGE[map.entry.side];
    const mid = cellPoint(map, map.entry.cell[0], map.entry.cell[1], u, v);
    segs.push(lineSeg(mid.clone().addScaledVector(dirVec(map.entry.side), 1.2), mid));
  }
  const first = segs.length;
  for (const p of passes) segs.push(passSeg(map, p));
  const n = path.length;
  if (n && !g.done) {
    const head = path[n - 1];
    const a: Side = n > 1 ? sideTo(head, path[n - 2]) : map.entry ? map.entry.side : 'W';
    const [u, v] = EDGE[a];
    segs.push(lineSeg(cellPoint(map, head[0], head[1], u, v), cellPoint(map, head[0], head[1], 0.5, 0.5)));
  } else if (g.done && map.exit) {
    const [u, v] = EDGE[map.exit.side];
    const mid = cellPoint(map, map.exit.cell[0], map.exit.cell[1], u, v);
    segs.push(lineSeg(mid, mid.clone().addScaledVector(dirVec(map.exit.side), 1.3)));
  }
  return { segs, first };
}

function pointAt(segs: Seg[], s: number) {
  let rest = Math.max(0, s);
  for (const sg of segs) {
    if (rest <= sg.len || sg === segs[segs.length - 1]) return sg.at(Math.min(rest, sg.len));
    rest -= sg.len;
  }
  return new Vector3();
}

function dirVec(s: Side) {
  return new Vector3(DELTA[s][0], 0, DELTA[s][1]);
}

function resetVisual() {
  drawnKeys = [];
  sweep = 0;
  paintDirty = true;
  hold = null;
  finishTimer = -1;
  maskDirty = true;
  game!.garden.highlight.material.opacity = 0;
  monk.rake.visible = true;
  updateVisual(0, true);
}

const keyOf = (p: Pass) => `${p.c},${p.r},${p.a},${p.b}`;

function updateVisual(dt: number, snap = false) {
  const g = game!;
  const passes = passesOf(g.map, g.path, g.done);
  const keys = passes.map(keyOf);
  let common = 0;
  while (common < drawnKeys.length && common < keys.length && drawnKeys[common] === keys[common]) common++;
  if (common < drawnKeys.length) {
    drawnKeys = drawnKeys.slice(0, common);
    sweep = 0;
    paintDirty = true;
  }
  const backlog = passes.length - drawnKeys.length;
  const { segs, first } = track(g, passes);
  if (backlog > 0) {
    const len = segs[first + drawnKeys.length].len || 0.5;
    sweep += (dt * SWEEP_SPEED * (1 + 0.7 * (backlog - 1))) / len;
    if (snap) sweep = 1;
    if (sweep >= 1) {
      drawnKeys.push(keys[drawnKeys.length]);
      sweep = drawnKeys.length < passes.length && snap ? 1 : 0;
      if (snap) return updateVisual(0, true);
    }
    paintDirty = true;
  }
  if (paintDirty) {
    const n = drawnKeys.length;
    g.painter.paint(passes.slice(0, n), n < passes.length ? { pass: passes[n], t: sweep } : undefined);
    paintDirty = false;
  }
  let rakeS = 0;
  for (let i = 0; i < first + drawnKeys.length; i++) rakeS += segs[i].len;
  if (drawnKeys.length < passes.length) rakeS += sweep * segs[first + drawnKeys.length].len;
  const total = segs.reduce((t, sg) => t + sg.len, 0);
  let rakeAt: Vector3;
  let monkAt: Vector3;
  if (!segs.length) {
    rakeAt = cellPoint(g.map, 0, g.map.rows - 1, -0.9, 0.5);
    monkAt = rakeAt.clone().add(new Vector3(-0.55, 0, 0));
  } else {
    rakeAt = pointAt(segs, rakeS);
    monkAt = pointAt(segs, Math.min(total, rakeS + RAKE_LEAD));
  }
  const tangent = pointAt(segs, rakeS + 0.03).sub(pointAt(segs, rakeS - 0.03));
  if (hold) monkAt = hold;
  const k = snap ? 1 : 1 - Math.exp(-dt * 18);
  const before = monkShown.clone();
  rakeShown.lerp(rakeAt, k);
  monkShown.lerp(monkAt, k);
  if (!hold) {
    const look = rakeShown.clone().sub(monkShown);
    if (look.lengthSq() > 0.01) monkAngleTarget = Math.atan2(look.x, look.z);
  }
  let da = monkAngleTarget - monkAngle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  monkAngle = snap ? monkAngleTarget : monkAngle + da * (1 - Math.exp(-dt * 12));
  monk.root.position.copy(monkShown);
  monk.root.rotation.y = monkAngle;
  monk.rake.position.copy(rakeShown);
  if (tangent.lengthSq() > 1e-6) monk.rake.rotation.y = Math.atan2(tangent.x, tangent.z);
  const v = before.distanceTo(monkShown) / Math.max(dt, 1e-3);
  walkSpeed += (v - walkSpeed) * Math.min(1, dt * 8);
  monk.update(dt, walkSpeed > 0.15 ? Math.min(1.2, walkSpeed) : 0);

  const caughtUp = drawnKeys.length === passes.length;
  const showMessy = phase === 'play' && caughtUp && g.mode !== 'free' && lastClean < 1 && (g.done || g.path.length >= g.limit);
  const hl = g.garden.highlight;
  if (showMessy && maskDirty) {
    g.painter.paintMask(passes);
    hl.material.alphaMap = g.painter.maskTex;
    hl.material.needsUpdate = true;
    maskDirty = false;
  }
  pulse += dt;
  const want = showMessy ? 0.5 + 0.25 * Math.sin(pulse * 4.5) : 0;
  hl.material.opacity += (want - hl.material.opacity) * Math.min(1, dt * 10);
  hl.visible = hl.material.opacity > 0.01;

  if (phase === 'play' && g.done && caughtUp) {
    if (finishTimer < 0) finishTimer = 0;
    finishTimer += dt;
    if (finishTimer > 0.35) {
      finishTimer = -1;
      const s = score(sampleCodes(g.map, passes), g.target);
      const ok = g.mode === 'puzzle' ? s.match >= 1 : s.clean >= 1 || g.mode === 'free';
      if (ok) beginOutro(s.clean, s.match);
    }
  } else finishTimer = -1;
}

function setupHud() {
  const g = game!;
  $('hud-name').textContent =
    g.mode === 'puzzle' ? g.level!.name : g.mode === 'random' ? `随庭　${{ small: '小庭', medium: '中庭', large: '大庭' }[g.size!]}` : '自由　画一幅';
  $('hud-match-wrap').classList.toggle('hidden', g.mode !== 'puzzle');
  $('btn-finish').classList.toggle('hidden', g.mode !== 'free');
  $('target-card').classList.toggle('hidden', g.mode !== 'puzzle');
  if (g.mode === 'puzzle') drawTargetCard();
}

function drawTargetCard() {
  const g = game!;
  const card = $<HTMLCanvasElement>('target-card');
  const dpr = Math.min(2, window.devicePixelRatio);
  const CW = 150;
  const tw = CW - 22;
  const th = (tw * g.map.rows) / g.map.cols;
  const CH = Math.round(th + 100);
  card.width = CW * dpr;
  card.height = CH * dpr;
  card.style.height = `${CH}px`;
  const c = card.getContext('2d')!;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  const rr = (x: number, y: number, w: number, h: number, r: number) => {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };
  c.fillStyle = '#efe6d2';
  rr(0, 0, CW, CH, 8);
  c.fill();
  c.strokeStyle = '#c8a98a';
  c.lineWidth = 5;
  rr(3, 3, CW - 6, CH - 6, 6);
  c.stroke();
  c.fillStyle = '#f6efdf';
  c.fillRect(11, 11, CW - 22, 26);
  c.fillStyle = '#b23a26';
  c.fillRect(CW - 40, 11, 29, 26);
  c.fillStyle = '#fff';
  c.font = '500 16px serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(g.par), CW - 25.5, 24.5);
  c.fillStyle = '#3a2f24';
  c.font = '14px "Songti SC","Noto Serif SC",serif';
  c.fillText('目标纹样', (CW - 40) / 2 + 6, 24.5);
  c.drawImage(g.targetPainter!.color, 11, 46, tw, th);
  c.strokeStyle = 'rgba(60,40,20,.3)';
  c.lineWidth = 1;
  c.strokeRect(11, 46, tw, th);
  c.fillStyle = '#6d5c49';
  c.font = '11px sans-serif';
  c.fillText(`${g.par} 步可成 · 上限 ${g.limit}`, CW / 2, 46 + th + 17);
  c.fillStyle = '#9a8670';
  c.fillText('按住卡片在庭院中对照', CW / 2, 46 + th + 33);
}

let peeking = false;
function refresh() {
  const g = game!;
  const passes = passesOf(g.map, g.path, g.done);
  const s = score(sampleCodes(g.map, passes), g.target);
  lastClean = s.clean;
  maskDirty = true;
  $('hud-steps').textContent = g.limit === Infinity ? String(g.path.length) : `${g.path.length} / ${g.limit}`;
  $('hud-clean').textContent = `${Math.floor(s.clean * 100)}%`;
  $('hud-match').textContent = `${Math.floor(s.match * 100)}%`;
  let msg = '';
  if (g.done) {
    if (g.mode === 'puzzle' && s.match < 1) msg = '纹样与目标不同，撤销后再试。';
    if (g.mode === 'random' && s.clean < 1) msg = '亮起的地方还是乱砂，撤销后再试。';
  } else if (g.path.length >= g.limit) msg = s.clean < 1 ? '耙程已用尽，亮起的地方还是乱砂。' : '耙程已用尽。';
  $('hud-msg').textContent = msg;
  const sandM = g.garden.sand.material as MeshStandardMaterial;
  const src = peeking && g.targetPainter ? g.targetPainter : g.painter;
  if (sandM.map !== src.colorTex) {
    sandM.map = src.colorTex;
    sandM.bumpMap = src.bumpTex;
    sandM.needsUpdate = true;
  }
}

const raycaster = new Raycaster();
const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
function pointerCell(e: PointerEvent): Cell | null {
  const ndc = new Vector2((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const p = new Vector3();
  if (!raycaster.ray.intersectPlane(groundPlane, p)) return null;
  const g = game!;
  return [Math.floor(p.x + g.map.cols / 2), Math.floor(p.z + g.map.rows / 2)];
}

let dragging = false;

function startAt(c: Cell | null) {
  const g = game!;
  const cell = c ?? (g.map.entry ? g.map.entry.cell : firstFree(g.map));
  const ok = g.map.entry ? sameCell(cell, g.map.entry.cell) : inGrid(g.map, cell) && !isRock(g.map, cell);
  if (!ok) {
    $('hud-msg').textContent = g.map.entry ? '从朱色标记的入口格开始。' : '';
    return false;
  }
  g.path = [cell];
  refresh();
  return true;
}

function firstFree(map: GardenMap): Cell {
  for (let r = map.rows - 1; r >= 0; r--) for (let c = 0; c < map.cols; c++) if (!isRock(map, [c, r])) return [c, r];
  return [0, 0];
}

/** One step from the monk's cell; stepping back onto the previous cell undoes it. */
function tryMove(d: Side) {
  const g = game;
  if (!g || phase !== 'play' || tutorial) return false;
  if (!g.path.length) return startAt(null);
  const ex = g.map.exit;
  if (g.done) {
    if (ex && d === OPP[ex.side]) {
      g.done = false;
      refresh();
      return true;
    }
    return false;
  }
  const last = g.path[g.path.length - 1];
  const step: Cell = [last[0] + DELTA[d][0], last[1] + DELTA[d][1]];
  if (!inGrid(g.map, step)) {
    if (ex && sameCell(last, ex.cell) && d === ex.side) {
      g.done = true;
      refresh();
      return true;
    }
    return false;
  }
  if (g.path.length > 1 && sameCell(step, g.path[g.path.length - 2])) g.path.pop();
  else if (isRock(g.map, step)) return false;
  else if (g.path.length >= g.limit) {
    $('hud-msg').textContent = '耙程已用尽。';
    return false;
  } else g.path.push(step);
  refresh();
  return true;
}

function dirToward(from: Cell, to: Cell): Side | null {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (!dx && !dy) return null;
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N';
}

function stepToward(cell: Cell) {
  const g = game!;
  for (let guard = 0; guard < 12; guard++) {
    const last = g.path[g.path.length - 1];
    if (!last) return;
    const dx = Math.abs(cell[0] - last[0]);
    const dy = Math.abs(cell[1] - last[1]);
    if (dx && dy && dx + dy > 2) return;
    const d = dirToward(last, cell);
    if (!d || !tryMove(d) || g.done) return;
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (phase === 'intro') {
    skipIntro();
    return;
  }
  if (phase !== 'play' || !game || tutorial) return;
  const c = pointerCell(e);
  if (!c) return;
  const g = game;
  const last = g.path[g.path.length - 1];
  if (!last) {
    if (!startAt(c)) return;
  } else if (!sameCell(c, last)) {
    const dist = Math.abs(c[0] - last[0]) + Math.abs(c[1] - last[1]);
    if (dist !== 1 || g.done) {
      if (g.done) tryMove(OPP[g.map.exit!.side]);
      else $('hud-msg').textContent = '点相邻的格子，或者用方向键移动。';
      return;
    }
    tryMove(dirToward(last, c)!);
  }
  dragging = true;
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!dragging || !game) return;
  const c = pointerCell(e);
  if (c) stepToward(c);
});
const endDrag = () => (dragging = false);
renderer.domElement.addEventListener('pointerup', endDrag);
renderer.domElement.addEventListener('pointercancel', endDrag);

const KEY_DIR: Record<string, Side> = {
  ArrowUp: 'N',
  ArrowDown: 'S',
  ArrowLeft: 'W',
  ArrowRight: 'E',
  w: 'N',
  s: 'S',
  a: 'W',
  d: 'E',
};
window.addEventListener('keydown', (e) => {
  if (phase === 'intro' && (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape')) {
    skipIntro();
    return;
  }
  if (phase !== 'play' || !game || tutorial || e.metaKey || e.altKey) return;
  const d = KEY_DIR[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (d) {
    e.preventDefault();
    tryMove(d);
  } else if (e.key === 'Backspace' || (e.key.toLowerCase() === 'z' && !e.shiftKey)) {
    e.preventDefault();
    $('btn-undo').click();
  }
});

$('btn-undo').onclick = () => {
  const g = game;
  if (!g || phase !== 'play') return;
  if (g.done) g.done = false;
  else g.path.pop();
  refresh();
};
$('btn-reset').onclick = () => {
  const g = game;
  if (!g || phase !== 'play') return;
  g.path = [];
  g.done = false;
  refresh();
};
const peek = $('target-card');
peek.addEventListener('contextmenu', (e) => e.preventDefault());
peek.addEventListener('pointerdown', () => {
  peeking = true;
  game && refresh();
});
for (const ev of ['pointerup', 'pointerleave', 'pointercancel'])
  peek.addEventListener(ev, () => {
    if (!peeking) return;
    peeking = false;
    game && refresh();
  });
$('btn-finish').onclick = () => {
  const g = game;
  if (!g || phase !== 'play' || g.path.length < 2) return;
  g.done = true;
  refresh();
};
$('btn-menu').onclick = showMenu;

interface Shot {
  pos: Vector3;
  look: Vector3;
}
let shotFrom: Shot | null = null;
let shotTo: Shot | null = null;
let shotT = 0;
let shotDur = 1;
let shotDone: (() => void) | null = null;
const camLook = new Vector3();
const queue: { shot: Shot; dur: number }[] = [];

function moveCamera(shots: { shot: Shot; dur: number }[], done: () => void) {
  queue.length = 0;
  queue.push(...shots);
  shotDone = done;
  nextShot();
}
function nextShot() {
  const q = queue.shift();
  if (!q) {
    shotTo = null;
    const d = shotDone;
    shotDone = null;
    d?.();
    return;
  }
  shotFrom = { pos: camera.position.clone(), look: camLook.clone() };
  shotTo = q.shot;
  shotT = 0;
  shotDur = q.dur;
}
function setCamera(s: Shot) {
  camera.position.copy(s.pos);
  camLook.copy(s.look);
  camera.lookAt(camLook);
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function gateShots() {
  const gp = game!.garden.gatePos;
  return {
    far: { pos: gp.clone().add(new Vector3(0.8, 1.1, 7.5)), look: gp.clone().add(new Vector3(0, 1.4, 0)) },
    near: { pos: gp.clone().add(new Vector3(0.15, 1.2, 3.2)), look: gp.clone().add(new Vector3(0, 1.15, 0)) },
    through: { pos: gp.clone().add(new Vector3(0, 1.3, -0.6)), look: new Vector3(-0.6, 0.2, 0) },
  };
}

function beginIntro() {
  phase = 'intro';
  $('menu').classList.add('hidden');
  $('result').classList.add('hidden');
  $('hud').classList.add('hidden');
  $('skip').classList.remove('hidden');
  const s = gateShots();
  setCamera(s.far);
  moveCamera(
    [
      { shot: s.near, dur: 1.8 },
      { shot: s.through, dur: 1.5 },
      { shot: playView(game!.map), dur: 1.9 },
    ],
    enterPlay,
  );
}
function skipIntro() {
  queue.length = 0;
  shotTo = null;
  shotDone = null;
  setCamera(playView(game!.map));
  enterPlay();
}
function enterPlay() {
  phase = 'play';
  $('skip').classList.add('hidden');
  $('hud').classList.remove('hidden');
  maybeTutorial();
}

type Spot = string | { cell: 'entry' | 'exit' | 'center' };
const TUTORIALS: Record<Mode, { text: string; spot?: Spot }[]> = {
  puzzle: [
    { text: '这是目标纹样。按住卡片，庭院里就会显示完整的目标。', spot: '#target-card' },
    { text: '从朱色标记的入口开始。用方向键、点击相邻的格子或者拖动来移动和尚。', spot: { cell: 'entry' } },
    { text: '耙子跟在和尚身后扫出纹路。直着走会耙满一整格；转弯只扫过一个扇形，外侧的角落保持原样。走回上一格就是撤销。', spot: { cell: 'center' } },
    { text: '最后从另一个朱色标记的出口离开。纹样和目标完全一致，庭院就完成了。', spot: { cell: 'exit' } },
  ],
  random: [
    { text: '从朱色入口开始，用方向键、点击相邻的格子或者拖动来耙砂。', spot: { cell: 'entry' } },
    { text: '转弯扫不到的角落会一直乱着。换个方向再转一次，或者直着耙过去，就能补上。', spot: { cell: 'center' } },
    { text: '整齐度到 100% 后从出口离开。如果还有乱砂，没扫到的地方会亮起来。', spot: { cell: 'exit' } },
  ],
  free: [
    { text: '点任意一格开始，用方向键、点击或者拖动随意作画，没有任何限制。', spot: { cell: 'center' } },
    { text: '画好后，点下面的「完成」木牌。', spot: '#btn-finish' },
  ],
};
const TUT_KEY = (m: Mode) => `karesansui:tutorial:${m}`;
let tutorial: { mode: Mode; step: number } | null = null;

function maybeTutorial() {
  const g = game!;
  try {
    if (localStorage.getItem(TUT_KEY(g.mode))) return;
  } catch {
    return;
  }
  tutorial = { mode: g.mode, step: 0 };
  $('tutorial').classList.remove('hidden');
  showTutorialStep();
}

function showTutorialStep() {
  if (!tutorial || !game) return;
  const steps = TUTORIALS[tutorial.mode];
  const st = steps[tutorial.step];
  $('tut-text').textContent = st.text;
  $('tut-dots').innerHTML = steps.map((_, i) => `<span class="${i === tutorial!.step ? 'on' : ''}">●</span>`).join('');
  $('tut-next').textContent = tutorial.step === steps.length - 1 ? '开始' : '下一步';
  placeSpotlight(st.spot);
}

function placeSpotlight(spot?: Spot) {
  const el = $('spotlight');
  if (!spot) {
    el.classList.add('hidden');
    $('tutorial').classList.remove('top');
    return;
  }
  let r: { x: number; y: number; w: number; h: number };
  if (typeof spot === 'string') {
    const b = document.querySelector(spot)!.getBoundingClientRect();
    r = { x: b.left - 6, y: b.top - 6, w: b.width + 12, h: b.height + 12 };
  } else {
    const g = game!;
    camera.updateMatrixWorld();
    const gate = spot.cell === 'entry' ? g.map.entry : spot.cell === 'exit' ? g.map.exit : null;
    const c: Cell = gate ? gate.cell : [Math.floor(g.map.cols / 2), Math.floor(g.map.rows / 2)];
    const span = gate ? 0.75 : 1.5;
    const p0 = g.garden.cellCenter(c[0], c[1]).add(new Vector3(-span, 0, -span)).project(camera);
    const p1 = g.garden.cellCenter(c[0], c[1]).add(new Vector3(span, 0, span)).project(camera);
    const sx = (v: number) => ((v + 1) / 2) * window.innerWidth;
    const sy = (v: number) => ((1 - v) / 2) * window.innerHeight;
    const x0 = Math.min(sx(p0.x), sx(p1.x));
    const x1 = Math.max(sx(p0.x), sx(p1.x));
    const y0 = Math.min(sy(p0.y), sy(p1.y));
    const y1 = Math.max(sy(p0.y), sy(p1.y));
    r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  el.classList.remove('hidden');
  $('tutorial').classList.toggle('top', r.y + r.h / 2 > window.innerHeight * 0.5);
}

function closeTutorial(remember: boolean) {
  if (tutorial && remember) {
    try {
      localStorage.setItem(TUT_KEY(tutorial.mode), '1');
    } catch {
      /* storage unavailable */
    }
  }
  tutorial = null;
  $('tutorial').classList.add('hidden');
  $('spotlight').classList.add('hidden');
}

$('tut-next').onclick = () => {
  if (!tutorial) return;
  if (tutorial.step < TUTORIALS[tutorial.mode].length - 1) {
    tutorial.step++;
    showTutorialStep();
  } else closeTutorial(true);
};
$('tut-skip').onclick = () => closeTutorial(true);

function beginOutro(clean: number, match: number) {
  const g = game!;
  phase = 'outro';
  dragging = false;
  $('hud').classList.add('hidden');
  const head = g.path[g.path.length - 1];
  const center = g.garden.cellCenter(head[0], head[1]);
  const awayFromBoard = new Vector3(center.x + 0.7, 0, center.z).normalize();
  if (awayFromBoard.lengthSq() < 0.01) awayFromBoard.set(0, 0, 1);
  const faceDir = awayFromBoard.clone();
  if (faceDir.z < 0.3) faceDir.z = 0.5;
  faceDir.normalize();
  const faceAngle = Math.atan2(faceDir.x, faceDir.z);
  setTimeout(() => {
    hold = monk.root.position.clone();
    monkAngleTarget = faceAngle;
    monk.rake.visible = false;
  }, 350);
  setTimeout(() => {
    const m = hold ?? monk.root.position.clone();
    const f = faceDir;
    const side = new Vector3(f.z, 0, -f.x);
    const headY = 0.71;
    const close: Shot = {
      pos: m.clone().addScaledVector(f, 1.3).addScaledVector(side, 0.32).add(new Vector3(0, headY + 0.02, 0)),
      look: m.clone().addScaledVector(side, 0.36).add(new Vector3(0, headY - 0.08, 0)),
    };
    const mid: Shot = {
      pos: m.clone().addScaledVector(f, 2.6).add(new Vector3(0, 1.9, 0)),
      look: m.clone().add(new Vector3(0, 0.5, 0)),
    };
    moveCamera(
      [
        { shot: mid, dur: 1.3 },
        { shot: close, dur: 1.4 },
      ],
      () => showResult(clean, match),
    );
  }, 900);
}

function showResult(clean: number, match: number) {
  const g = game!;
  phase = 'result';
  const steps = g.path.length;
  let n = 0;
  if (g.mode !== 'free') {
    n = stars(steps, g.par);
    if (g.mode === 'puzzle') saveStar(g.level!.id, n);
  }
  $('res-title').textContent = g.mode === 'free' ? '一幅' : '庭成';
  $('res-stars').innerHTML =
    g.mode === 'free' ? '' : [0, 1, 2].map((i) => `<span class="${i < n ? '' : 'off'}">★</span>`).join('');
  const lines = [`耙程　<b>${steps}</b>${g.mode !== 'free' ? `　（参考 ${g.par}）` : ''}`, `整齐度　<b>${Math.floor(clean * 100)}%</b>`];
  if (g.mode === 'puzzle') lines.push(`吻合度　<b>${Math.floor(match * 100)}%</b>`);
  if (g.mode !== 'free' && steps < g.par) lines.push('比参考解更短，妙手。');
  $('res-lines').innerHTML = lines.join('<br>');
  const idx = g.level ? LEVELS.indexOf(g.level) : -1;
  const next = $('res-next');
  next.classList.toggle('hidden', g.mode === 'puzzle' && idx === LEVELS.length - 1);
  next.textContent = g.mode === 'puzzle' ? '下一关' : g.mode === 'random' ? '换一张' : '新画布';
  $('result').classList.remove('hidden');
}

$('res-next').onclick = () => {
  const g = game!;
  if (g.mode === 'puzzle') startGame('puzzle', { level: LEVELS[LEVELS.indexOf(g.level!) + 1] });
  else if (g.mode === 'random') startGame('random', { size: g.size });
  else startGame('free', {});
};
$('res-again').onclick = () => {
  const g = game!;
  startGame(g.mode, { level: g.level, size: g.size, seed: g.seed });
};
$('res-menu').onclick = showMenu;

function showModes() {
  $('menu-modes').classList.remove('hidden');
  $('menu-sub').classList.add('hidden');
  $('menu-back').classList.add('hidden');
}

function showSub(items: { label: string; stars?: number; go: () => void }[]) {
  const sub = $('menu-sub');
  sub.innerHTML = '';
  for (const it of items) {
    const b = document.createElement('button');
    b.className = 'plaque' + (it.stars !== undefined ? ' has-stars' : '');
    b.innerHTML =
      `<span>${it.label}</span>` +
      (it.stars !== undefined
        ? `<div class="stars-row">${[0, 1, 2].map((i) => `<i class="${i < it.stars! ? '' : 'off'}">★</i>`).join('')}</div>`
        : '');
    b.onclick = it.go;
    sub.appendChild(b);
  }
  $('menu-modes').classList.add('hidden');
  sub.classList.remove('hidden');
  $('menu-back').classList.remove('hidden');
}

document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => {
  b.onclick = () => {
    const mode = b.dataset.mode as Mode;
    if (mode === 'puzzle') {
      const st = loadStars();
      showSub(LEVELS.map((lv) => ({ label: lv.name.split('　')[0], stars: st[lv.id] || 0, go: () => startGame('puzzle', { level: lv }) })));
    } else if (mode === 'random') {
      showSub(
        (['small', 'medium', 'large'] as SizeKey[]).map((size) => ({
          label: { small: '小庭', medium: '中庭', large: '大庭' }[size],
          go: () => startGame('random', { size }),
        })),
      );
    } else startGame('free', {});
  };
});
$('menu-back').onclick = showModes;

function showMenu() {
  phase = 'menu';
  dragging = false;
  queue.length = 0;
  shotTo = null;
  shotDone = null;
  $('hud').classList.add('hidden');
  $('result').classList.add('hidden');
  $('skip').classList.add('hidden');
  $('menu').classList.remove('hidden');
  closeTutorial(false);
  showModes();
  if (!game) startBackdrop();
}

function startBackdrop() {
  const seed = 20261016;
  const g = randomGarden('large', seed);
  const map = g.map;
  const painter = new SandPainter(map, seed);
  painter.paint(passesOf(map, g.solution, true));
  const garden = buildGarden(map, painter, seed);
  scene.add(garden.root);
  sun.position.set(-5.7, 10, -4);
  sun.target.position.set(-0.7, 0, 0);
  game = { mode: 'free', map, seed, par: 0, limit: Infinity, painter, target: null, garden, path: [], done: false };
  resetVisual();
  painter.paint(passesOf(map, g.solution, true));
}

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  if (phase === 'play' && game) setCamera(playView(game.map));
  if (tutorial) showTutorialStep();
}
window.addEventListener('resize', resize);
resize();

const clock = new Clock();
function step(dt: number) {
  if (phase === 'menu' && game) {
    menuT += dt * 0.12;
    const r = 12;
    setCamera({
      pos: new Vector3(-0.7 + Math.sin(menuT) * r, 8, 0.8 + Math.cos(menuT) * r),
      look: new Vector3(-0.7, 0, 0.4),
    });
  }
  if (shotTo && shotFrom) {
    shotT += dt / shotDur;
    const t = ease(Math.min(1, shotT));
    camera.position.lerpVectors(shotFrom.pos, shotTo.pos, t);
    camLook.lerpVectors(shotFrom.look, shotTo.look, t);
    camera.lookAt(camLook);
    if (shotT >= 1) nextShot();
  }
  if (game) {
    updateVisual(dt);
    game.garden.gate.visible = phase === 'intro' || phase === 'outro' || phase === 'result';
  }
  const d = camera.position.length();
  const fog = scene.fog as Fog;
  fog.near = d + 6;
  fog.far = d * 1.6 + 24;
  renderer.render(scene, camera);
}
function frame() {
  step(Math.min(0.05, clock.getDelta()));
  requestAnimationFrame(frame);
}
showMenu();
frame();

if (import.meta.env.DEV) {
  Object.assign(window, {
    __ks: {
      get game() {
        return game;
      },
      get phase() {
        return phase;
      },
      start: startGame,
      screenOf(c: number, r: number) {
        const v = game!.garden.cellCenter(c, r).project(camera);
        return [((v.x + 1) / 2) * window.innerWidth, ((1 - v.y) / 2) * window.innerHeight];
      },
      levels: LEVELS,
      skipIntro,
      setPath(path: Cell[], done = false) {
        game!.path = path.slice();
        game!.done = done;
        refresh();
      },
      advance(seconds: number, fps = 30) {
        for (let i = 0; i < seconds * fps; i++) step(1 / fps);
        return phase;
      },
      async autoplay(ms = 120) {
        const g = game!;
        const sol = solve(g.map);
        if (!sol) return false;
        g.path = [];
        for (const c of sol) {
          g.path.push(c);
          refresh();
          await new Promise((r) => setTimeout(r, ms));
        }
        g.done = true;
        refresh();
        return true;
      },
    },
  });
}
