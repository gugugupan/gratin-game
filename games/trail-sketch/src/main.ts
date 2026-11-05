import '@tabler/icons-webfont/dist/tabler-icons.min.css';
import './style.css';
import * as THREE from 'three';
import { GameMap, Mark, Pt, SPECIES, WEATHER, dist, generateMap } from './core/map';
import {
  DEFAULT_RULES,
  Gear,
  RouteResult,
  Trip,
  applyRoute,
  atHut,
  canPhotograph,
  drink,
  endDay,
  evaluateRoute,
  newTrip,
  resample,
  tripScore,
} from './core/rules';
import { sfx, isMuted, scratchLevel, setMuted, startScratch, stopScratch } from './game/audio';
import { WeatherFx } from './game/fx';
import { SPECIES_ICON, iconsReady } from './game/icons';
import { TEX_SCALE } from './game/mapTexture';
import { Hiker, Pencil, Token, makeTokens, tentMesh, updateTokens } from './game/props';
import { World, mapToWorld } from './game/scene';
import { runCoach } from './game/tutorial';

const rules = DEFAULT_RULES;
const WX_ICON = { sun: 'ti-sun', cloud: 'ti-cloud', rain: 'ti-cloud-rain', fog: 'ti-mist', storm: 'ti-cloud-storm' } as const;
const GEAR_INFO: Record<Gear, { name: string; icon: string; desc: string }> = {
  kayak: { name: '皮划艇', icon: 'ti-kayak', desc: '沿河画线就能漂流，顺流很便宜；不用桥也能过河。能拍到河上的水獭。' },
  boat: { name: '小船', icon: 'ti-sailboat', desc: '把线画进湖面即可横渡，只算经纬线。能拍到湖心的湖鱼。' },
  bino: { name: '望远镜', icon: 'ti-binoculars', desc: '拍照范围翻倍（雾天无效）。能远拍不让人靠近的黑熊。' },
};
const TUTORIAL_KEY = 'trail-sketch:tutorial-done';

type State = 'gear' | 'plan' | 'travel' | 'night' | 'end';

const canvas = document.getElementById('scene') as HTMLCanvasElement;
const hud = document.getElementById('hud')!;
const world = new World(canvas);
const fx = new WeatherFx(world);
const hiker = new Hiker();
const pencil = new Pencil();
world.scene.add(hiker.root, pencil.root);

let map: GameMap;
let trip: Trip;
let tokens: Token[] = [];
let state: State = 'gear';
let draft: Pt[] = [];
let strokes: number[] = [];
let evalRes: RouteResult | null = null;
let tool: 'pencil' | 'eraser' = 'pencil';
let drawing = false;
let erasing = false;
let panning: { x: number; y: number } | null = null;
let lastPointer: { x: number; y: number } | null = null;
let lastHits = new Set<number>();
const campGroup = new THREE.Group();
world.scene.add(campGroup);
let pickedGear: Gear[] = ['kayak', 'bino'];

hud.innerHTML = `
<div class="top">
  <div class="card day"><div class="l">第</div><div class="n serif" id="dayN">1</div><div class="l" id="dayOf">/ 7 天</div></div>
  <div class="card forecast" id="forecast"></div>
  <div class="spacer"></div>
  <div class="card res">
    <div class="ap" id="apBox"><div class="lbl"><span>行动点</span><span><b id="apLeft">0</b> / <span id="apMax">0</span></span></div><div class="pips" id="pips"></div></div>
    <div class="stock"><div class="row food" id="food"></div><div class="row water" id="water"></div></div>
    <button class="btn small" id="drinkBtn" title="喝 1 份水，今天 +2 行动点"><i class="ti ti-bottle"></i>喝水</button>
  </div>
</div>
<div class="side">
  <div class="card"><h3><i class="ti ti-trophy"></i>得分 <b id="score" style="margin-left:auto;color:var(--ink);font-size:16px">0</b><button class="btn small" id="sideToggle" title="收起/展开" style="padding:2px 4px"><i class="ti ti-layout-sidebar-right-collapse"></i></button></h3><div id="goals"></div></div>
  <div class="card"><h3><i class="ti ti-camera"></i>拍照图鉴</h3><div class="journal" id="journal"></div></div>
  <div class="card"><h3><i class="ti ti-backpack"></i>背包</h3><div class="gearrow" id="gearRow"></div></div>
</div>
<div class="card legend">
  <span><i class="sw" style="border-color:#3a3a3a"></i>步行（铅笔）</span>
  <span><i class="sw" style="border-color:#1f6f8b"></i>划艇</span>
  <span><i class="sw" style="border-color:#16857a"></i>小船</span>
  <span><i class="sw" style="border-color:rgba(46,90,96,.7);border-top-style:dotted"></i>经纬线 = 1 点</span>
</div>
<button class="btn card help" id="helpBtn" title="教程"><i class="ti ti-help"></i></button>
<div class="card tools" id="tools">
  <button class="btn" id="viewBtn" title="切换 全图 / 规划（空格）"><i class="ti ti-map-2"></i><span>全图</span></button>
  <div class="sep"></div>
  <button class="btn on" id="toolPencil" title="铅笔（P）"><i class="ti ti-pencil"></i>铅笔</button>
  <button class="btn" id="toolEraser" title="橡皮（E）"><i class="ti ti-eraser"></i>橡皮</button>
  <button class="btn" id="undoBtn" title="撤销一笔（Z）"><i class="ti ti-arrow-back-up"></i></button>
  <button class="btn" id="clearBtn" title="清除今天的路线"><i class="ti ti-trash"></i></button>
  <div class="sep"></div>
  <div class="costline" id="costLine">从小人脚下开始画</div>
  <div class="sep"></div>
  <button class="btn" id="muteBtn" title="声音"><i class="ti ti-volume"></i></button>
  <button class="btn primary" id="goBtn"><i class="ti ti-walk"></i>出发</button>
</div>
<div class="toast" id="toast"></div>
<div class="flash" id="flash"></div>
<div class="dusk" id="dusk"></div>
<div id="modalHost"></div>
`;

const $ = (id: string) => document.getElementById(id)!;
let toastTimer = 0;
function toast(msg: string, err = false) {
  const t = $('toast');
  t.textContent = msg;
  t.className = 'toast show' + (err ? ' err' : '');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.className = 'toast' + (err ? ' err' : '')), 2200);
}

function floatLabel(worldPos: THREE.Vector3, text: string, color: string) {
  const p = world.project(worldPos);
  const el = document.createElement('div');
  el.className = 'float';
  el.textContent = text;
  el.style.left = p.x + 'px';
  el.style.top = p.y - 18 + 'px';
  el.style.setProperty('--c', color);
  hud.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

const markById = (id: number) => map.marks.find((k) => k.id === id)!;
const tokenOf = (id: number) => tokens.find((t) => t.mark.id === id)!;
const speciesOf = (mk: Mark) => SPECIES.find((s) => s.key === mk.species)!;

function newGame(seed = Math.floor(Math.random() * 1e6)) {
  map = generateMap(seed, rules.days);
  world.buildMap(map, rules.contourInterval);
  for (const t of tokens) world.scene.remove(t.root);
  tokens = makeTokens(map);
  for (const t of tokens) world.scene.add(t.root);
  campGroup.clear();
  state = 'gear';
  showGearModal(true);
}

function startTrip() {
  trip = newTrip(map, rules, pickedGear);
  draft = [];
  strokes = [];
  evalRes = null;
  lastHits = new Set();
  placeHiker(trip.pos);
  hiker.setMode('walk');
  fx.set(map.weather[0]);
  fx.night = 0;
  state = 'plan';
  setView('plan');
  redrawOverlay();
  renderHud();
  if (!localStorage.getItem(TUTORIAL_KEY)) setTimeout(startTutorial, 500);
  else toast(`第 1 天 · ${WEATHER[map.weather[0]].name} · ${rules.ap[map.weather[0]]} 行动点`);
}

function placeHiker(p: Pt) {
  hiker.root.position.copy(mapToWorld(p[0], p[1], map));
}

function routeCtx() {
  return { gear: trip.gear, weather: map.weather[trip.day] };
}

function evaluateDraft() {
  if (draft.length < 2) {
    evalRes = null;
    updateHighlights(new Set());
    return;
  }
  evalRes = evaluateRoute(map, rules, routeCtx(), draft, true);
  const hits = new Set(evalRes.hits.map((h) => h.id));
  updateHighlights(hits);
}

function updateHighlights(hits: Set<number>) {
  for (const t of tokens) t.highlighted = hits.has(t.mark.id);
  for (const id of hits) {
    if (lastHits.has(id)) continue;
    const t = tokenOf(id);
    t.bounce = 1;
    t.pulse = 1;
    const mk = t.mark;
    const pos = t.root.position.clone().add(new THREE.Vector3(0, 0.2, 0));
    if (mk.kind === 'animal') {
      const sp = speciesOf(mk);
      const fresh = !trip.photos.has(sp.key);
      floatLabel(pos, fresh ? `${sp.name} 新物种 +5` : trip.shots.has(mk.id) ? `${sp.name} 已拍过` : `${sp.name} +1`, fresh ? sp.color : '#6f6a5c');
    } else if (mk.kind === 'peak') floatLabel(pos, trip.summited.has(mk.id) ? '已登顶' : `登顶 +4 · ${Math.round(mk.elev ?? 0)}m`, '#7a3e1d');
    else floatLabel(pos, '小屋 · 补满食物和水', '#3f5a36');
    sfx.pop();
  }
  lastHits = hits;
}

function strokePath(ctx: CanvasRenderingContext2D, pts: Pt[], from: number, to: number) {
  const s = TEX_SCALE;
  ctx.beginPath();
  for (let i = from; i <= to; i++) {
    const [x, y] = pts[i];
    if (i === from) ctx.moveTo(x * s, y * s);
    else ctx.lineTo(x * s, y * s);
  }
  ctx.stroke();
}

const MODE_COLOR = { walk: '#3a3a3a', kayak: '#1f6f8b', boat: '#16857a' };

function redrawOverlay() {
  const cv = world.overlayCanvas;
  const ctx = cv.getContext('2d')!;
  const s = TEX_SCALE;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (trip) {
    for (const h of trip.history) {
      for (const r of h.runs) {
        ctx.strokeStyle = MODE_COLOR[r.mode] + '88';
        ctx.lineWidth = 2.4 * s;
        ctx.setLineDash(r.mode === 'walk' ? [6 * s, 4 * s] : [2 * s, 3 * s]);
        strokePath(ctx, h.samples, Math.max(0, r.from - 1), r.to);
      }
      const end = h.samples[h.samples.length - 1];
      ctx.setLineDash([]);
      ctx.fillStyle = '#3f5a36';
      ctx.beginPath();
      ctx.arc(end[0] * s, end[1] * s, 7 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f3eedd';
      ctx.font = `bold ${9 * s}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(h.day + 1), end[0] * s, end[1] * s + 0.5 * s);
    }
  }
  ctx.setLineDash([]);
  if (draft.length > 1) {
    const runs = evalRes?.runs ?? [{ mode: 'walk' as const, from: 0, to: draft.length - 1, cost: 0 }];
    for (const r of runs) {
      const col = MODE_COLOR[r.mode];
      for (let pass = 0; pass < 3; pass++) {
        ctx.strokeStyle = col;
        ctx.globalAlpha = pass === 0 ? 0.9 : 0.25;
        ctx.lineWidth = (pass === 0 ? 3 : 1.2) * s;
        ctx.save();
        ctx.translate((pass - 1) * 0.8 * s, (pass - 1) * -0.6 * s);
        strokePath(ctx, draft, Math.max(0, r.from - 1), r.to);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    if (evalRes) {
      let last = -1;
      ctx.font = `bold ${8 * s}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let i = 1; i < evalRes.costAt.length; i++) {
        const c = evalRes.costAt[i];
        if (c !== last && c > 0) {
          const [x, y] = draft[i];
          ctx.fillStyle = '#c8552b';
          ctx.beginPath();
          ctx.arc(x * s, y * s, 5.5 * s, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillText(String(c), x * s, y * s + 0.5 * s);
        }
        last = c;
      }
    }
  }
  if (trip && state === 'plan') {
    const a = draft.length ? draft[draft.length - 1] : trip.pos;
    ctx.strokeStyle = 'rgba(200,85,43,.8)';
    ctx.lineWidth = 1.5 * s;
    ctx.setLineDash([3 * s, 3 * s]);
    ctx.beginPath();
    ctx.arc(a[0] * s, a[1] * s, 13 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  world.overlayTex.needsUpdate = true;
}

function renderHud() {
  if (!trip) return;
  $('dayN').textContent = String(trip.day + 1);
  $('dayOf').textContent = `/ ${rules.days} 天`;
  $('forecast').innerHTML =
    map.weather
      .map((w, i) => {
        const known = i <= trip.day + 2;
        const cls = i === trip.day ? 'today' : i < trip.day ? 'past' : known ? '' : 'unknown';
        return `<div class="wx ${cls}" title="${known ? WEATHER[w].name + (WEATHER[w].effect ? '：' + WEATHER[w].effect : '') : '还看不到'}"><i class="ti ${known ? WX_ICON[w] : 'ti-question-mark'}"></i><span>${known ? rules.ap[w] : '?'}</span></div>`;
      })
      .join('') + (WEATHER[map.weather[trip.day]].effect ? `<div class="wxfx">今天${WEATHER[map.weather[trip.day]].name}：${WEATHER[map.weather[trip.day]].effect}</div>` : '');
  const plan = evalRes?.ok ? evalRes.cost : 0;
  const maxAp = Math.max(trip.ap, plan);
  const cap = Math.max(rules.ap.sun, trip.ap);
  $('apLeft').textContent = String(Math.max(0, trip.ap - plan));
  $('apMax').textContent = String(trip.ap);
  $('pips').innerHTML = Array.from({ length: Math.max(cap, maxAp) }, (_, i) => {
    let c = 'pip';
    if (i >= trip.ap) c += ' used';
    else if (i >= trip.ap - plan) c += ' plan';
    return `<div class="${c}"></div>`;
  }).join('');
  $('food').innerHTML = Array.from({ length: rules.foodMax }, (_, i) => `<i class="ti ti-${i < trip.food ? 'meat' : 'circle-dashed'} ${i < trip.food ? '' : 'empty'}"></i>`).join('');
  $('water').innerHTML = Array.from({ length: rules.waterMax }, (_, i) => `<i class="ti ti-droplet ${i < trip.water ? '' : 'empty'}"></i>`).join('');
  const sc = tripScore(map, rules, trip);
  $('score').textContent = String(sc.total);
  const peaks = map.marks.filter((k) => k.kind === 'peak').length;
  const g = [
    { ok: trip.photos.size >= 6, tag: '物种', main: true, t: `新物种 ${trip.photos.size} 种（每种 +5）` },
    { ok: trip.summited.size >= peaks, tag: '山顶', main: false, t: `登顶 ${trip.summited.size}/${peaks}（每座 +4）` },
    { ok: trip.day === rules.days - 1 && atHut(map, rules, trip), tag: '终点', main: false, t: `第 ${rules.days} 天停在小屋 +5` },
  ];
  const [s1, s2, s3] = rules.stars;
  $('goals').innerHTML =
    g.map((x) => `<div class="goal ${x.ok ? 'ok' : ''}"><i class="ti ti-${x.ok ? 'circle-check' : 'circle'}"></i><span class="tag ${x.main ? 'main' : ''}">${x.tag}</span>${x.t}</div>`).join('') +
    `<div class="goal" style="color:var(--ink-soft);font-size:12px"><i class="ti ti-star"></i>${s1} · ${s2} · ${s3} 分</div>`;
  $('journal').innerHTML = SPECIES.map((sp, i) => {
    const got = trip.photos.has(sp.key);
    const locked = !canPhotograph(trip.gear, sp.key);
    return `<div class="polaroid ${got ? 'got' : ''}" id="pol-${sp.key}" style="--r:${(i % 3) - 1}deg;--c:${sp.color};${locked ? 'opacity:.4' : ''}" title="${sp.name}（${sp.habitat}）${locked ? ' · 需要' + GEAR_INFO[sp.needs!].name : ''}"><div class="ph"><i class="ti ${locked ? 'ti-lock' : SPECIES_ICON[sp.key]}"></i></div><div class="nm">${sp.name}</div></div>`;
  }).join('');
  $('gearRow').innerHTML = [...trip.gear].map((k) => `<span class="gearchip"><i class="ti ${GEAR_INFO[k].icon}"></i>${GEAR_INFO[k].name}</span>`).join('');
  const cl = $('costLine');
  if (state !== 'plan') cl.innerHTML = state === 'travel' ? '徒步中…' : '';
  else if (!evalRes) cl.innerHTML = '从小人脚下开始画';
  else cl.innerHTML = `本日路线 <b>${evalRes.cost}</b> 点 · 等高线 ${evalRes.contours} · 经纬线 ${evalRes.gridLines}`;
  ($('goBtn') as HTMLButtonElement).innerHTML = draft.length > 1 ? '<i class="ti ti-walk"></i>出发' : '<i class="ti ti-tent"></i>原地扎营';
}

function anchor(): Pt {
  return draft.length ? draft[draft.length - 1] : trip.pos;
}

function extendDraft(p: Pt) {
  const a = anchor();
  if (dist(a, p) < 2.5) return;
  if (!draft.length) draft.push(trip.pos);
  const seg = resample([a, p]).slice(1);
  draft.push(...seg);
  evaluateDraft();
  if (!evalRes) return;
  if (!evalRes.ok) {
    const cut = Math.max(1, (evalRes.errAt ?? 1) - 2);
    const bad = draft[Math.min(draft.length - 1, evalRes.errAt ?? 0)];
    draft = draft.slice(0, cut);
    stopDrawing();
    toast(evalRes.err ?? '这里走不通', true);
    sfx.error();
    floatLabel(mapToWorld(bad[0], bad[1], map, 0.05), '✕', '#b3261e');
    evaluateDraft();
  } else if (evalRes.cost > trip.ap) {
    let k = evalRes.costAt.length - 1;
    while (k > 1 && evalRes.costAt[k] > trip.ap) k--;
    draft = draft.slice(0, k + 1);
    stopDrawing();
    toast(trip.water > 0 ? '行动点用完了 · 喝水可以 +2' : '行动点用完了', true);
    sfx.error();
    $('apBox').classList.remove('shake');
    void $('apBox').offsetWidth;
    $('apBox').classList.add('shake');
    evaluateDraft();
  }
  redrawOverlay();
  renderHud();
}

function stopDrawing() {
  drawing = false;
  pencil.pressing = 0;
  stopScratch();
}

function eraseAt(p: Pt) {
  if (draft.length < 2) return;
  let best = -1;
  for (let i = 1; i < draft.length; i++) if (dist(draft[i], p) < 10) {
    best = i;
    break;
  }
  if (best < 0) return;
  draft = best <= 1 ? [] : draft.slice(0, best);
  strokes = strokes.filter((s) => s < draft.length);
  sfx.erase();
  evaluateDraft();
  redrawOverlay();
  renderHud();
}

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}
  if (world.view === 'map') {
    panning = { x: e.clientX, y: e.clientY };
    canvas.classList.add('grabbing');
    return;
  }
  if (e.button !== 0 || state !== 'plan') return;
  const p = world.pick(e.clientX, e.clientY);
  if (!p) return;
  if (tool === 'eraser') {
    erasing = true;
    eraseAt(p);
    return;
  }
  if (dist(p, anchor()) > 24) {
    toast(draft.length ? '从路线的末端接着画' : '从小人脚下开始画', true);
    const a = anchor();
    floatLabel(mapToWorld(a[0], a[1], map, 0.25), '从这里画', '#c8552b');
    return;
  }
  strokes.push(Math.max(1, draft.length));
  drawing = true;
  pencil.pressing = 1;
  startScratch();
  extendDraft(p);
});
canvas.addEventListener('pointermove', (e) => {
  if (panning) {
    world.panPixels(e.clientX - panning.x, e.clientY - panning.y);
    panning = { x: e.clientX, y: e.clientY };
    return;
  }
  const p = world.pick(e.clientX, e.clientY);
  const target = p ? mapToWorld(p[0], p[1], map) : world.pickPlane(e.clientX, e.clientY, 0.02);
  if (target) pencil.root.position.lerp(target, 0.6);
  if (!p) return;
  lastPointer = { x: e.clientX, y: e.clientY };
  if (drawing || erasing) world.edgePointer = lastPointer;
  if (drawing) {
    scratchLevel(Math.hypot(e.movementX, e.movementY) * 0.004);
    extendDraft(p);
  } else if (erasing) eraseAt(p);
});
const endPointer = () => {
  panning = null;
  canvas.classList.remove('grabbing');
  world.edgePointer = null;
  erasing = false;
  if (drawing) {
    stopDrawing();
    redrawOverlay();
  }
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  world.zoom(Math.exp(e.deltaY * 0.0012));
}, { passive: false });

function setTool(t: 'pencil' | 'eraser') {
  tool = t;
  pencil.setEraser(t === 'eraser');
  $('toolPencil').classList.toggle('on', t === 'pencil');
  $('toolEraser').classList.toggle('on', t === 'eraser');
}
$('toolPencil').onclick = () => {
  setTool('pencil');
  if (state === 'plan') setView('plan');
};
$('toolEraser').onclick = () => {
  setTool('eraser');
  if (state === 'plan') setView('plan');
};
$('viewBtn').onclick = () => setView(world.view === 'map' ? 'plan' : 'map');

function setView(v: 'map' | 'plan') {
  if (v === 'plan' && state !== 'plan' && state !== 'travel') v = 'map';
  if (drawing) stopDrawing();
  erasing = false;
  panning = null;
  const focus = state === 'travel' ? hiker.root.position : mapToWorld(...anchor(), map);
  world.setView(v, focus);
  canvas.classList.toggle('mode-map', v === 'map');
  const b = $('viewBtn');
  b.innerHTML = v === 'map' ? '<i class="ti ti-pencil"></i><span>规划</span>' : '<i class="ti ti-map-2"></i><span>全图</span>';
  b.classList.toggle('on', v === 'map');
  hud.classList.toggle('view-map', v === 'map');
}
$('undoBtn').onclick = undo;
function undo() {
  if (state !== 'plan' || !strokes.length) return;
  const at = strokes.pop()!;
  draft = at <= 1 ? [] : draft.slice(0, at);
  sfx.erase();
  evaluateDraft();
  redrawOverlay();
  renderHud();
}
$('clearBtn').onclick = () => {
  if (state !== 'plan') return;
  draft = [];
  strokes = [];
  sfx.erase();
  evaluateDraft();
  redrawOverlay();
  renderHud();
};
$('drinkBtn').onclick = () => {
  if (state !== 'plan') return;
  if (!drink(trip, rules)) {
    toast('没有水了 · 经过小屋可以补满', true);
    sfx.error();
    return;
  }
  sfx.chime();
  floatLabel(hiker.root.position.clone().add(new THREE.Vector3(0, 0.45, 0)), '+2 行动点', '#2e7d8c');
  evaluateDraft();
  renderHud();
};
$('muteBtn').onclick = () => {
  setMuted(!isMuted());
  $('muteBtn').innerHTML = `<i class="ti ti-volume${isMuted() ? '-off' : ''}"></i>`;
};
$('goBtn').onclick = go;
$('sideToggle').onclick = () => {
  const side = document.querySelector('.side')!;
  side.classList.toggle('collapsed');
  $('goals').style.display = side.classList.contains('collapsed') ? 'none' : '';
  $('sideToggle').innerHTML = `<i class="ti ti-layout-sidebar-right-${side.classList.contains('collapsed') ? 'expand' : 'collapse'}"></i>`;
};
$('helpBtn').onclick = () => state === 'plan' && startTutorial();
window.addEventListener('keydown', (e) => {
  if (e.key === 'p') setTool('pencil');
  if (e.key === 'e') setTool('eraser');
  if (e.key === 'z' && (e.metaKey || e.ctrlKey || !e.shiftKey)) undo();
  if (e.key === 'Enter') go();
  if (e.key === ' ' || e.key === 'm') {
    e.preventDefault();
    $('viewBtn').click();
  }
});

interface Playback {
  samples: Pt[];
  runs: RouteResult['runs'];
  hits: { id: number; at: number }[];
  costAt: number[];
  t: number;
  idx: number;
  hitPtr: number;
  stepAcc: number;
  apStart: number;
}
let play: Playback | null = null;

function go() {
  if (state !== 'plan') return;
  if (draft.length < 2) {
    nightfall();
    return;
  }
  evaluateDraft();
  if (!evalRes || !evalRes.ok) return;
  const r = evalRes;
  play = { samples: r.samples, runs: r.runs, hits: r.hits, costAt: r.costAt, t: 0, idx: 0, hitPtr: 0, stepAcc: 0, apStart: trip.ap };
  state = 'travel';
  for (const t of tokens) t.highlighted = false;
  world.follow = hiker.root;
  setView('plan');
  redrawOverlay();
  renderHud();
}

function modeAt(i: number) {
  for (const r of play!.runs) if (i >= r.from && i <= r.to) return r.mode;
  return 'walk' as const;
}

function stepPlayback(dt: number) {
  if (!play) return;
  const speed = 95 + play.samples.length * 0.05;
  play.t += dt * speed / 1.5;
  const prevIdx = play.idx;
  play.idx = Math.min(play.samples.length - 1, Math.floor(play.t));
  const p = play.samples[play.idx];
  const q = play.samples[Math.min(play.samples.length - 1, play.idx + 3)];
  const pos = mapToWorld(p[0], p[1], map);
  hiker.root.position.lerp(pos, 0.5);
  if (dist(p, q) > 0.5) {
    const ang = Math.atan2(q[0] - p[0], q[1] - p[1]);
    let d = ang - hiker.root.rotation.y;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    hiker.root.rotation.y += d * 0.2;
  }
  hiker.setMode(modeAt(play.idx));
  play.stepAcc += play.idx - prevIdx;
  if (play.stepAcc > 9 && modeAt(play.idx) === 'walk') {
    play.stepAcc = 0;
    sfx.step();
  }
  const used = play.costAt[play.idx] ?? 0;
  $('apLeft').textContent = String(Math.max(0, play.apStart - used));
  while (play.hitPtr < play.hits.length && play.hits[play.hitPtr].at <= play.idx) {
    onArriveHit(play.hits[play.hitPtr].id);
    play.hitPtr++;
  }
  if (play.idx >= play.samples.length - 1) {
    const res = evaluateRoute(map, rules, routeCtx(), play.samples, true);
    applyRoute(map, rules, trip, res);
    play = null;
    draft = [];
    strokes = [];
    evalRes = null;
    lastHits = new Set();
    hiker.setMode('walk');
    redrawOverlay();
    renderHud();
    setTimeout(nightfall, 500);
  }
}

function onArriveHit(id: number) {
  const mk = markById(id);
  const t = tokenOf(id);
  t.bounce = 1;
  t.pulse = 1;
  const pos = t.root.position.clone().add(new THREE.Vector3(0, 0.22, 0));
  if (mk.kind === 'animal') {
    const sp = speciesOf(mk);
    const fresh = !trip.photos.has(sp.key);
    const repeat = trip.shots.has(mk.id);
    trip.photos.add(sp.key);
    trip.shots.add(mk.id);
    t.setDone(true);
    $('flash').className = 'flash';
    void $('flash').offsetWidth;
    $('flash').className = 'flash go';
    sfx.shutter();
    floatLabel(pos, fresh ? `咔嚓！${sp.name} +5` : repeat ? `${sp.name}` : `${sp.name} +1`, sp.color);
    renderHud();
    if (fresh) $('pol-' + sp.key)?.classList.add('pop');
  } else if (mk.kind === 'peak') {
    if (!trip.summited.has(mk.id)) {
      trip.summited.add(mk.id);
      sfx.win();
      floatLabel(pos, `登顶 ${Math.round(mk.elev ?? 0)}m +4`, '#7a3e1d');
    }
    renderHud();
  } else {
    trip.food = rules.foodMax;
    trip.water = rules.waterMax;
    sfx.chime();
    floatLabel(pos, '补给已满', '#3f5a36');
    renderHud();
  }
}

function nightfall() {
  state = 'night';
  world.follow = null;
  setView('map');
  const tent = tentMesh();
  tent.position.copy(mapToWorld(trip.pos[0] + 10, trip.pos[1] + 6, map));
  tent.scale.setScalar(0.01);
  campGroup.add(tent);
  tent.userData.grow = 0;
  fx.night = 1;
  $('dusk').classList.add('on');
  sfx.night();
  const lastDay = trip.day >= rules.days - 1;
  const hungry = trip.food <= 0;
  setTimeout(() => {
    endDay(map, rules, trip);
    if (trip.over) {
      showEnd();
      return;
    }
    const w = map.weather[trip.day];
    showModal(`
      <h2 class="serif">第 ${trip.day} 夜</h2>
      <p>吃掉 1 份食物，剩 <b>${trip.food}</b> 份。${trip.food === 0 ? '<b style="color:var(--danger)">明天必须到达小屋，否则旅程结束。</b>' : ''}</p>
      <div style="display:flex;gap:14px;align-items:center;margin:14px 0;padding:12px;background:var(--paper-2);border-radius:10px">
        <i class="ti ${WX_ICON[w]}" style="font-size:42px;color:var(--forest)"></i>
        <div><div style="font-size:18px;font-weight:600">第 ${trip.day + 1} 天 · ${WEATHER[w].name}</div><div style="color:var(--ink-soft);font-size:14px">${rules.ap[w]} 行动点${WEATHER[w].effect ? ' · ' + WEATHER[w].effect : ''}</div></div>
      </div>
      ${atHut(map, rules, trip) ? '<p>你在小屋过夜，可以换装备。</p>' : ''}
      <div class="actions">${atHut(map, rules, trip) ? '<button class="btn" data-a="swap"><i class="ti ti-backpack"></i>换装备</button>' : ''}<button class="btn primary" data-a="morning"><i class="ti ti-sun"></i>天亮了</button></div>
    `, (a) => {
      if (a === 'swap') {
        showGearModal(false);
        return true;
      }
      morning();
      return false;
    });
    void lastDay;
    void hungry;
  }, 1500);
}

function morning() {
  closeModal();
  fx.night = 0;
  fx.set(map.weather[trip.day]);
  $('dusk').classList.remove('on');
  state = 'plan';
  setView('plan');
  sfx.chime();
  redrawOverlay();
  renderHud();
  toast(`第 ${trip.day + 1} 天 · ${WEATHER[map.weather[trip.day]].name} · ${trip.ap} 行动点`);
}

function showEnd() {
  state = 'end';
  const sc = tripScore(map, rules, trip);
  const stars = rules.stars.filter((s) => sc.total >= s).length;
  sfx.win();
  showModal(`
    <h2 class="serif">${trip.result === 'starved' ? '食物耗尽，提前下山' : '旅程结束'}</h2>
    <div class="stars">${[0, 1, 2].map((i) => `<i class="ti ti-star${i < stars ? ' on' : ''}" style="animation-delay:${i * 0.2}s"></i>`).join('')}</div>
    <p style="font-size:30px;color:var(--ink);margin:0"><b>${sc.total}</b> 分</p>
    <p>新物种 ${trip.photos.size} 种 +${sc.species} · 其他个体 +${sc.extra} · 山顶 +${sc.peaks}${sc.allPeaks ? ' · 全部登顶 +' + sc.allPeaks : ''}${sc.hut ? ' · 小屋终点 +' + sc.hut : ''}${sc.starvedHalf ? ' · <b style="color:var(--danger)">饿死减半</b>' : ''}</p>
    <p style="font-size:12px">星级：${rules.stars.join(' · ')} 分 · 地图 No.${map.seed}</p>
    <div class="actions"><button class="btn" data-a="same"><i class="ti ti-repeat"></i>同一张图再来</button><button class="btn primary" data-a="new"><i class="ti ti-map-2"></i>新地图</button></div>
  `, (a) => {
    $('dusk').classList.remove('on');
    fx.night = 0;
    if (a === 'same') newGame(map.seed);
    else newGame();
    return true;
  });
}

let modalCb: ((a: string) => boolean) | null = null;
function showModal(html: string, cb: (a: string) => boolean) {
  $('modalHost').innerHTML = `<div class="modal-wrap"><div class="modal card">${html}</div></div>`;
  modalCb = cb;
}
function closeModal() {
  $('modalHost').innerHTML = '';
  modalCb = null;
}
$('modalHost').addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest('[data-a]');
  if (!el || !modalCb) return;
  const keep = modalCb(el.getAttribute('data-a')!);
  if (!keep) closeModal();
});

function showGearModal(start: boolean) {
  let sel: Gear[] = start ? [...pickedGear] : [...trip.gear];
  const draw = () => {
    $('modalHost').innerHTML = `<div class="modal-wrap"><div class="modal card">
      <h2 class="serif">${start ? map.names.river + '河谷 · 7 日徒步' : '小屋 · 换装备'}</h2>
      <p>${start ? '背包只有 2 格。每件装备都能解锁一种动物，选择会决定你的路线。' : '选 2 件带走。'}</p>
      <div class="gearpick">${(Object.keys(GEAR_INFO) as Gear[]).map((g) => `<div class="gearcard ${sel.includes(g) ? 'sel' : ''}" data-g="${g}"><i class="ti ${GEAR_INFO[g].icon}"></i><div class="t">${GEAR_INFO[g].name}</div><div class="d">${GEAR_INFO[g].desc}</div></div>`).join('')}</div>
      <p style="font-size:12px">已选 ${sel.length}/2</p>
      <div class="actions">${start ? '<button class="btn" data-x="reroll"><i class="ti ti-dice-5"></i>换张地图</button>' : ''}<button class="btn primary" data-x="ok">${start ? '<i class="ti ti-backpack"></i>出发去起点' : '<i class="ti ti-check"></i>就这样'}</button></div>
    </div></div>`;
  };
  draw();
  modalCb = null;
  const host = $('modalHost');
  const onClick = (e: Event) => {
    const t = e.target as HTMLElement;
    const g = t.closest('[data-g]')?.getAttribute('data-g') as Gear | null;
    const x = t.closest('[data-x]')?.getAttribute('data-x');
    if (g) {
      if (sel.includes(g)) sel = sel.filter((k) => k !== g);
      else if (sel.length < 2) sel.push(g);
      else sel = [sel[1], g];
      sfx.tick();
      draw();
    }
    if (x === 'reroll') {
      host.removeEventListener('click', onClick);
      newGame();
    }
    if (x === 'ok') {
      if (sel.length !== 2) {
        toast('选满 2 件装备', true);
        return;
      }
      host.removeEventListener('click', onClick);
      host.innerHTML = '';
      if (start) {
        pickedGear = sel;
        startTrip();
      } else {
        trip.gear = new Set(sel);
        renderHud();
        morning();
      }
    }
  };
  host.addEventListener('click', onClick);
}

function startTutorial() {
  const hikerScreen = () => {
    const p = world.project(hiker.root.position.clone().add(new THREE.Vector3(0, 0.15, 0)));
    return { x: p.x, y: p.y, r: 60 };
  };
  const rect = (id: string) => () => $(id).getBoundingClientRect();
  const bridge = map.bridges[0];
  runCoach(
    [
      { title: '这是你', text: '每天用<b>铅笔</b>从小人脚下拖出一条线，就是今天要走的路。', target: hikerScreen },
      { title: '只数穿过的线', text: '每穿过一条<b>等高线</b>或<b>经纬线</b>（蓝色虚线）花 1 点。沿着等高线绕山腰几乎免费，直接翻山很贵。线上的橙色数字是累计花费。', target: rect('costLine') },
      { title: '行动点 = 天气', text: '晴 8、多云 6、雨 5、雾 4、雷暴 3。只能看到 3 天的预报。行动点不够时线会停住。', target: rect('forecast') },
      { title: '拍照得分', text: '路线经过动物附近就能拍到，它会跳起来提示你。每个新物种 +5，同种的其他个体 +1，登顶每座 +4。', target: rect('journal') },
      {
        title: '河、桥和湖',
        text: '河只能从<b>桥</b>上走过去。带<b>皮划艇</b>可以沿河画线漂流，带<b>小船</b>可以把线画进湖面。雷暴天不能下水。',
        target: () => {
          if (!bridge) return null;
          const p = world.project(mapToWorld(bridge.x, bridge.y, map));
          return { x: p.x, y: p.y, r: 46 };
        },
      },
      { title: '食物和水', text: '每晚吃 1 份食物，吃完后再过夜旅程就结束。路线经过<b>小屋</b>会补满食物和水。喝水当天 +2 行动点。', target: rect('food') },
      { title: '画错了没关系', text: '<b>橡皮</b>擦掉一段，<b>撤销</b>退回上一笔。画好后点<b>出发</b>，小人会沿着铅笔线走。', target: rect('tools') },
      { title: '全图 / 规划', text: '画线时镜头贴着小人，铅笔靠近屏幕边缘会自动往前移。想看整张地图就点<b>全图</b>（或按空格），在全图里拖动平移、滚轮缩放；再点<b>规划</b>回来接着画。', target: rect('viewBtn') },
    ],
    () => {
      localStorage.setItem(TUTORIAL_KEY, '1');
      toast(`第 ${trip.day + 1} 天 · ${WEATHER[map.weather[trip.day]].name} · ${trip.ap} 行动点`);
    },
  );
}

const clock = new THREE.Clock();
let simTime = 0;
function frame() {
  tick(Math.min(0.05, clock.getDelta()));
  requestAnimationFrame(frame);
}
function tick(dt: number) {
  simTime += dt;
  const t = simTime;
  stepPlayback(dt);
  hiker.animate(dt, !!play && modeAt(play.idx) === 'walk', t);
  if (!play && trip && state !== 'travel') hiker.root.position.lerp(mapToWorld(trip.pos[0], trip.pos[1], map), 0.2);
  pencil.root.visible = state === 'plan' && world.view === 'plan';
  pencil.update(dt);
  updateTokens(tokens, dt, t);
  for (const c of campGroup.children) {
    c.userData.grow = Math.min(1, (c.userData.grow ?? 1) + dt * 2.5);
    const g = c.userData.grow;
    c.scale.setScalar(Math.max(0.01, g < 1 ? 1 + Math.sin(g * Math.PI) * 0.3 - (1 - g) : 1));
    const fire = c.userData.fire as THREE.PointLight;
    const flame = c.userData.flame as THREE.Mesh;
    const on = fx.night > 0.5 && c === campGroup.children[campGroup.children.length - 1];
    fire.intensity = on ? 1.2 + Math.sin(t * 17) * 0.3 + Math.sin(t * 7) * 0.2 : 0;
    flame.visible = on;
    flame.scale.y = 1 + Math.sin(t * 20) * 0.2;
  }
  fx.update(dt);
  if (world.update(dt) && lastPointer && (drawing || erasing)) {
    const p = world.pick(lastPointer.x, lastPointer.y);
    if (p) {
      pencil.root.position.copy(mapToWorld(p[0], p[1], map));
      if (drawing) extendDraft(p);
      else eraseAt(p);
    }
  }
}

fx.onBolt = () => {
  sfx.thunder();
  $('flash').className = 'flash';
  void $('flash').offsetWidth;
  $('flash').className = 'flash go';
};

iconsReady(Object.values(SPECIES_ICON)).then(() => {
  const qs = new URLSearchParams(location.search);
  newGame(qs.has('seed') ? +qs.get('seed')! : undefined);
  frame();
});

Object.assign(window as unknown as Record<string, unknown>, {
  __game: {
    get map() {
      return map;
    },
    get trip() {
      return trip;
    },
    get state() {
      return state;
    },
    draw: (pts: Pt[]) => {
      draft = [trip.pos];
      for (const p of pts) extendDraft(p);
      redrawOverlay();
      renderHud();
      return evalRes;
    },
    go,
    world,
    advance: (sec: number) => {
      for (let i = 0; i < sec * 30; i++) tick(1 / 30);
    },
  },
});
