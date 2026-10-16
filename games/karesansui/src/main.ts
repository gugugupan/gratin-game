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
  placeMonkIdle();
  monk.rake.visible = true;
  setupHud();
  refresh();
  beginIntro();
}

const rakePos = new Vector3();
const rakeTarget = new Vector3();
let monkAngle = 0;
let monkAngleTarget = 0;
const MONK_OFFSET = 0.72;
let walkSpeed = 0;
let hold: Vector3 | null = null;

function dirVec(s: keyof typeof DELTA) {
  return new Vector3(DELTA[s][0], 0, DELTA[s][1]);
}

function placeMonkIdle() {
  const g = game!;
  const gate = g.map.entry;
  if (gate) {
    const c = g.garden.cellCenter(gate.cell[0], gate.cell[1]);
    const out = dirVec(gate.side);
    rakeTarget.copy(c).addScaledVector(out, 0.9);
    monkAngleTarget = Math.atan2(-out.x, -out.z);
  } else {
    rakeTarget.copy(g.garden.cellCenter(0, g.map.rows - 1)).add(new Vector3(-0.9, 0, 0));
    monkAngleTarget = Math.PI / 2;
  }
  rakePos.copy(rakeTarget);
  monkAngle = monkAngleTarget;
  hold = null;
}

function updateMonkTarget() {
  const g = game!;
  const n = g.path.length;
  if (!n) {
    placeMonkIdle();
    return;
  }
  const head = g.path[n - 1];
  const c = g.garden.cellCenter(head[0], head[1]);
  let travel: Vector3;
  if (g.done && g.map.exit) travel = dirVec(g.map.exit.side);
  else if (n > 1) travel = dirVec(sideTo(g.path[n - 2], head));
  else if (g.map.entry) travel = dirVec(OPP[g.map.entry.side]);
  else travel = new Vector3(1, 0, 0);
  rakeTarget.copy(c);
  if (g.done && g.map.exit) rakeTarget.addScaledVector(travel, 0.95);
  monkAngleTarget = Math.atan2(-travel.x, -travel.z);
}

function animateMonk(dt: number) {
  const before = rakePos.clone();
  const k = 1 - Math.exp(-dt * 9);
  rakePos.lerp(rakeTarget, k);
  let da = monkAngleTarget - monkAngle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  monkAngle += da * (1 - Math.exp(-dt * 10));
  const facing = new Vector3(Math.sin(monkAngle), 0, Math.cos(monkAngle));
  if (hold) monk.root.position.copy(hold);
  else monk.root.position.copy(rakePos).addScaledVector(facing, -MONK_OFFSET);
  monk.root.rotation.y = monkAngle;
  monk.rake.position.copy(rakePos);
  monk.rake.position.y = 0;
  monk.rake.rotation.y = monkAngle;
  const v = before.distanceTo(rakePos) / Math.max(dt, 1e-3);
  walkSpeed += (v - walkSpeed) * Math.min(1, dt * 8);
  monk.update(dt, walkSpeed > 0.15 ? Math.min(1.2, walkSpeed) : 0);
}

function setupHud() {
  const g = game!;
  $('hud-name').textContent =
    g.mode === 'puzzle' ? g.level!.name : g.mode === 'random' ? `随庭　${{ small: '小庭', medium: '中庭', large: '大庭' }[g.size!]}` : '自由　画一幅';
  $('hud-hint').textContent =
    g.mode === 'puzzle'
      ? g.level!.hint
      : g.mode === 'random'
        ? '从朱色入口按住拖动，耙到整齐度 100% 后从出口离开。'
        : '在任意砂格按住拖动开始，画好后点「完成」。';
  $('hud-match-wrap').classList.toggle('hidden', g.mode !== 'puzzle');
  $('btn-peek').classList.toggle('hidden', g.mode !== 'puzzle');
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
  const CH = Math.round(th + 86);
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
  c.fillText(`${g.par} 步可成 · 上限 ${g.limit}`, CW / 2, 46 + th + 18);
}

let peeking = false;
function refresh() {
  const g = game!;
  const passes = passesOf(g.map, g.path, g.done);
  g.painter.paint(passes);
  const s = score(sampleCodes(g.map, passes), g.target);
  $('hud-steps').textContent = g.limit === Infinity ? String(g.path.length) : `${g.path.length} / ${g.limit}`;
  $('hud-clean').textContent = `${Math.floor(s.clean * 100)}%`;
  $('hud-match').textContent = `${Math.floor(s.match * 100)}%`;
  let msg = '';
  if (g.done) {
    if (g.mode === 'puzzle' && s.match < 1) msg = '纹样与目标不同，撤销后再试。';
    if (g.mode === 'random' && s.clean < 1) msg = '还留着乱砂，撤销后再试。';
  } else if (g.path.length >= g.limit) msg = '耙程已用尽。';
  $('hud-msg').textContent = msg;
  updateMonkTarget();
  const sandM = g.garden.sand.material as MeshStandardMaterial;
  const src = peeking && g.targetPainter ? g.targetPainter : g.painter;
  if (sandM.map !== src.colorTex) {
    sandM.map = src.colorTex;
    sandM.bumpMap = src.bumpTex;
    sandM.needsUpdate = true;
  }
  if (g.done && phase === 'play') {
    const ok = g.mode === 'puzzle' ? s.match >= 1 : s.clean >= 1;
    if (ok) setTimeout(() => game === g && g.done && beginOutro(s.clean, s.match), 650);
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
function stepToward(cell: Cell) {
  const g = game!;
  for (let guard = 0; guard < 12; guard++) {
    const last = g.path[g.path.length - 1];
    if (sameCell(last, cell)) return;
    const dx = cell[0] - last[0];
    const dy = cell[1] - last[1];
    if (dx !== 0 && dy !== 0 && Math.abs(dx) + Math.abs(dy) > 1) {
      if (Math.abs(dx) + Math.abs(dy) > 2) return;
    }
    const step: Cell = Math.abs(dx) >= Math.abs(dy) ? [last[0] + Math.sign(dx), last[1]] : [last[0], last[1] + Math.sign(dy)];
    if (g.done) {
      if (inGrid(g.map, step) || !g.map.exit) return;
      return;
    }
    if (!inGrid(g.map, step)) {
      const ex = g.map.exit;
      if (ex && sameCell(last, ex.cell) && sameCell(step, [last[0] + DELTA[ex.side][0], last[1] + DELTA[ex.side][1]])) {
        g.done = true;
        refresh();
      }
      return;
    }
    if (g.path.length > 1 && sameCell(step, g.path[g.path.length - 2])) {
      g.path.pop();
    } else {
      if (isRock(g.map, step) || g.path.length >= g.limit) return;
      g.path.push(step);
    }
    refresh();
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (phase === 'intro') {
    skipIntro();
    return;
  }
  if (phase !== 'play' || !game) return;
  const c = pointerCell(e);
  if (!c) return;
  const g = game;
  if (g.done) {
    if (sameCell(c, g.path[g.path.length - 1])) {
      g.done = false;
      refresh();
    }
    return;
  }
  const last = g.path[g.path.length - 1];
  if (!g.path.length || (g.path.length === 1 && !sameCell(c, last))) {
    const startOk = g.map.entry ? sameCell(c, g.map.entry.cell) : inGrid(g.map, c) && !isRock(g.map, c);
    if (!startOk) {
      $('hud-msg').textContent = g.map.entry ? '从朱色标记的入口格开始。' : '';
      return;
    }
    g.path = [c];
    refresh();
  } else if (!sameCell(c, last)) {
    $('hud-msg').textContent = '从耙子所在的格子继续拖动。';
    return;
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
const peek = $('btn-peek');
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
  const s = score(sampleCodes(g.map, passesOf(g.map, g.path, false)), null);
  beginOutro(s.clean, 0);
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
}

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

function renderLevelList() {
  const st = loadStars();
  const list = $('level-list');
  list.innerHTML = '';
  for (const lv of LEVELS) {
    const b = document.createElement('button');
    b.innerHTML = `${lv.name.split('　')[0]}<span class="star">${'★'.repeat(st[lv.id] || 0)}</span>`;
    b.onclick = () => startGame('puzzle', { level: lv });
    list.appendChild(b);
  }
}

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
  renderLevelList();
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
  placeMonkIdle();
}

document.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) => {
  b.onclick = () => startGame('random', { size: b.dataset.size as SizeKey });
});
$('free-start').onclick = () => startGame('free', {});

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  if (phase === 'play' && game) setCamera(playView(game.map));
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
  if (game) animateMonk(dt);
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
