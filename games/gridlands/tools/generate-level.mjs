// 关卡候选生成器：随机切出答案分区 → 摆资源 → 列出对答案成立的条件 → 贪心删条件，
// 只保留「仍唯一解 + 仍可只靠推理解开」的最小条件集。挑中的候选再手工写进 gen-chapterN.mjs。
// 用法：
//   node tools/generate-level.mjs search W H K FROM TO   # 搜种子，按推理轮数排序输出
//   node tools/generate-level.mjs show   W H K SEED       # 打印该种子的地图、答案和条件
//   node tools/generate-level.mjs js     W H K SEED       # 输出可粘进 gen-chapterN.mjs 的代码（OWNER 替换成角色）
//   选项：--sea=N 切 N 块海做海岸线；--noblock 不放湖/山障碍；--dir 允许方位线索；--flags=N 至少保留 N 面营地旗；--mindir=N 至少保留 N 条方位线索；--maxshare=0.3 单个区域最多占地图的比例；--budget=N 计算量上限放大 N 倍；--keep=TYPE,... 这些条件类型尽量保留；--shapes 形状线索（长条/正方形）；--thin 多切出一格宽的长条；--distance 区域间距离线索；--hub 距离线索只指向最小的两个区域（电站/变电站）
//   第 4 章额外选项：--loose 不强求采集设施只挨着自己的工厂；--nodecoy 不在别处撒配方资源当诱饵
//   （地图里 ~ 是海，* 是营地旗所在格）
//   node tools/generate-level.mjs factory RECIPE W H FROM TO   # 第 4 章：按 recipes-ch4.mjs 的配方树搜种子
//   node tools/generate-level.mjs factoryshow RECIPE W H SEED
//   node tools/generate-level.mjs factoryjs RECIPE W H SEED      # 输出可粘进 gen-chapter4.mjs 的代码
import { solve, validate, buildIndex, localCandidates } from '../web/src/core/engine.js';
import { deduce } from './deduce.mjs';

let seed = 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 随机「切蛋糕」：把 W×H 切成 k 个矩形
// thin：切分时一半概率贴边切出一格宽的长条（铁路关用）
let THIN = false;
function partition(W, H, k) {
  let rects = [{ x: 0, y: 0, w: W, h: H }];
  let guard = 0;
  while (rects.length < k && guard++ < 200) {
    const i = Math.floor(rnd() * rects.length); const r = rects[i];
    const vert = r.w > r.h ? rnd() < 0.75 : rnd() < 0.25;
    const cut = (n) => (THIN && rnd() < 0.5 ? (rnd() < 0.5 ? 1 : n - 1) : 1 + Math.floor(rnd() * (n - 1)));
    if (vert && r.w >= 2) { const c = cut(r.w); rects.splice(i, 1, { ...r, w: c }, { ...r, x: r.x + c, w: r.w - c }); }
    else if (!vert && r.h >= 2) { const c = cut(r.h); rects.splice(i, 1, { ...r, h: c }, { ...r, y: r.y + c, h: r.h - c }); }
  }
  return rects.every((r) => r.w * r.h >= 2) ? rects : null;
}

const RES = ['gold', 'iron', 'forest', 'farmland', 'building', 'coal', 'copper', 'cotton', 'pasture'];

// sea：额外切出几块贴着地图边缘的矩形当作海（这些格子不存在），做出不规则海岸线
export function generate({ W, H, k, blockedRect = true, sea = 0, maxShare = 1, res = { gold: 3, iron: 2, forest: 4, farmland: 3, building: 2 }, s }) {
  seed = s;
  const parts = partition(W, H, k + (blockedRect ? 1 : 0) + sea);
  if (!parts) return null;
  let blocked = null;
  if (blockedRect) {
    const small = parts.filter((p) => p.w * p.h <= 4 && p.w * p.h >= 2);
    if (!small.length) return null;
    blocked = pick(small);
  }
  const onBorder = (p) => p.x === 0 || p.y === 0 || p.x + p.w === W || p.y + p.h === H;
  const seaParts = shuffle(parts.filter((p) => p !== blocked && onBorder(p) && p.w * p.h <= W * H * 0.2)).slice(0, sea);
  if (seaParts.length < sea) return null;
  const owned = parts.filter((p) => p !== blocked && !seaParts.includes(p));
  if (owned.some((p) => p.w * p.h > maxShare * W * H)) return null;
  const blockTag = pick(['lake', 'mountain']);
  const grid = Array.from({ length: H }, () => Array(W).fill('plain'));
  if (blocked) for (let y = blocked.y; y < blocked.y + blocked.h; y++) for (let x = blocked.x; x < blocked.x + blocked.w; x++) grid[y][x] = blockTag;
  const free = shuffle([].concat(...owned.map((p) => { const a = []; for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) a.push([x, y]); return a; })));
  for (const [tag, n] of Object.entries(res)) for (let i = 0; i < n && free.length; i++) { const [x, y] = free.pop(); grid[y][x] = tag; }
  const cells = []; let id = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push({ id: id++, x, y, tags: [grid[y][x]], assignable: grid[y][x] !== blockTag || !blocked, fixedRegion: null });
  if (blocked) for (const c of cells) if (c.tags[0] === blockTag) c.assignable = false;
  const inSea = (x, y) => seaParts.some((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h);
  for (let i = cells.length - 1; i >= 0; i--) if (inSea(cells[i].x, cells[i].y)) cells.splice(i, 1);
  const regions = owned.map((p, i) => ({ id: 'R' + (i + 1), rect: p, constraints: [] }));
  const level = { schemaVersion: 1, id: 'gen', shapeRule: 'RECT', adjacency: 4, coverage: 'FULL', board: { width: W, height: H, cells }, regions, globalConstraints: [] };
  const truth = new Map(regions.map((r) => { const ids = []; for (let y = r.rect.y; y < r.rect.y + r.rect.h; y++) for (let x = r.rect.x; x < r.rect.x + r.rect.w; x++) ids.push(y * W + x + 1); return [r.id, ids]; }));
  return { level, truth, blockTag };
}

const ok = (level, map) => validate(level, map).ok;
const holds = (level, truth, rid, c) => {
  const lv = { ...level, regions: level.regions.map((r) => ({ ...r, constraints: r.id === rid ? [c] : [] })), globalConstraints: rid ? [] : [c] };
  return validate(lv, truth).constraints[0].satisfied;
};

// 列出对答案成立的条件（偏重「数量」类，贴合争资源的故事）
export function truths(level, truth, opts = {}) {
  const ix = buildIndex(level);
  const out = [];
  const tagsIn = (rid) => truth.get(rid).map((id) => ix.byId.get(id).tags[0]);
  const present = [...new Set(level.board.cells.map((c) => c.tags[0]))];
  for (const r of level.regions) {
    const ts = tagsIn(r.id); const a = ts.length;
    const add = (type, params, w = 1) => { const c = params ? { type, params } : { type }; if (holds(level, truth, r.id, c)) out.push({ rid: r.id, c, w }); };
    add('AREA_EQ', { value: a }, 2); add('AREA_GE', { value: a - 1 }); add('AREA_LE', { value: a + 1 });
    for (const t of present) {
      const n = ts.filter((x) => x === t).length;
      if (t === 'plain' || !RES.includes(t)) { add('MUST_TOUCH_TAG', { tag: t }); add('MUST_NOT_TOUCH_TAG', { tag: t }); continue; }
      if (n) { add('TAG_COUNT_EQ', { tag: t, value: n }, 3); add('TAG_COUNT_GE', { tag: t, value: n }, 2); add('MUST_CONTAIN_TAG', { tag: t }); }
      else add('MUST_NOT_CONTAIN_TAG', { tag: t }, 2);
      add('MUST_TOUCH_TAG', { tag: t }); add('MUST_NOT_TOUCH_TAG', { tag: t });
    }
    if (level.board.cells.length === level.board.width * level.board.height) { add('MUST_ON_EDGE'); add('MUST_NOT_ON_CORNER'); }
    add('AREA_MAX', null, 2); add('AREA_MIN', null, 2);
    for (const o of level.regions) if (o.id !== r.id) { add('MUST_NOT_TOUCH_REGION', { region: o.id }); if (opts.touchRegion) add('MUST_TOUCH_REGION', { region: o.id }); }
  }
  for (const a of level.regions) for (const b of level.regions) if (a.id < b.id) {
    for (const c of [{ type: 'AREA_LARGER_THAN', params: { a: a.id, b: b.id } }, { type: 'AREA_LARGER_THAN', params: { a: b.id, b: a.id } }, { type: 'AREA_EQUAL_TO', params: { a: a.id, b: b.id } }])
      if (holds(level, truth, null, c)) out.push({ rid: null, c, w: 3 });
  }
  for (const t of RES) { const c = { type: 'ONLY_ONE_CONTAINS', params: { tag: t } }; if (holds(level, truth, null, c)) out.push({ rid: null, c, w: 2 }); }
  if (opts.direction) {
    // 方位：重心在该方向上至少差 1 格才算，避免玩家看不出来
    const ix2 = buildIndex(level);
    const cen = (rid) => { const cs = truth.get(rid).map((id) => ix2.byId.get(id)); return { x: cs.reduce((m, c) => m + c.x, 0) / cs.length, y: cs.reduce((m, c) => m + c.y, 0) / cs.length }; };
    for (const a of level.regions) for (const b of level.regions) if (a.id !== b.id) {
      const ca = cen(a.id), cb = cen(b.id);
      if (cb.y - ca.y >= 1) out.push({ rid: null, c: { type: 'DIRECTION_OF', params: { a: a.id, b: b.id, dir: 'north' } }, w: 3 });
      if (ca.x - cb.x >= 1) out.push({ rid: null, c: { type: 'DIRECTION_OF', params: { a: a.id, b: b.id, dir: 'east' } }, w: 3 });
    }
  }
  if (opts.flags) {
    // 预置营地旗：每个区域随机一格作为候选线索
    for (const r of level.regions) { const ids = truth.get(r.id); out.push({ rid: r.id, fix: ids[Math.floor(rnd() * ids.length)], w: 0 }); }
  }
  if (opts.shapes) for (const r of level.regions) for (const type of ['SHAPE_LINE', 'SHAPE_SQUARE']) {
    const c = { type }; if (holds(level, truth, r.id, c)) out.push({ rid: r.id, c, w: 3 });
  }
  if (opts.distance) {
    // 距离：两区域最小曼哈顿距离 d，给出「不超过 d 格」和（d≥2 时）「超过 d-1 格」
    const ix3 = buildIndex(level);
    const cellsOf = (rid) => truth.get(rid).map((id) => ix3.byId.get(id));
    // opts.hub：「不超过 N 格」只指向两个最小的区域（发电站、变电站），做出供电网的结构
    const hubs = opts.hub ? [...level.regions].sort((x, y) => truth.get(x.id).length - truth.get(y.id).length).slice(0, 2).map((r) => r.id) : null;
    for (const a of level.regions) for (const b of level.regions) if (a.id !== b.id) {
      let d = Infinity;
      for (const m of cellsOf(a.id)) for (const o of cellsOf(b.id)) d = Math.min(d, Math.abs(m.x - o.x) + Math.abs(m.y - o.y));
      if (d >= 2 && d <= 4 && (!hubs || hubs.includes(b.id))) out.push({ rid: a.id, c: { type: 'WITHIN_REGION', params: { region: b.id, dist: d } }, w: hubs ? 9 : 3 });
      if (d >= 2) out.push({ rid: a.id, c: { type: 'FAR_FROM_REGION', params: { region: b.id, dist: d - 1 } }, w: 3 });
    }
  }
  // opts.keepTypes：这些条件类型最后才删（想让某关突出某种规则时用）
  if (opts.keepTypes) for (const x of out) if (opts.keepTypes.includes(x.c?.type)) x.w = 9;
  return out;
}

function assemble(level, list) {
  const lv = structuredClone(level);
  lv.regions.forEach((r) => (r.constraints = []));
  lv.globalConstraints = [];
  for (const { rid, c, fix } of list) {
    if (fix) { lv.board.cells.find((cell) => cell.id === fix).fixedRegion = rid; continue; }
    (rid ? lv.regions.find((r) => r.id === rid).constraints : lv.globalConstraints).push(c);
  }
  return lv;
}

// --budget=N：计算量上限放大 N 倍（大地图删线索时更不容易因超时而保留多余线索）
const BUDGET = Number((process.argv.find((x) => x.startsWith('--budget=')) || '--budget=1').split('=')[1]);
const good = (lv) => { const s = solve(lv, { maxSolutions: 2, maxNodes: 200000 * BUDGET }); if (s.aborted || s.length !== 1) return null; const d = deduce(lv, { maxWork: 3e6 * BUDGET }); return d.solved ? d : null; };

// 贪心删条件：保持唯一解 + 可推理；优先保留权重高（数量类）的
// opts.direction / opts.flags：加入方位、预置旗线索；opts.minFlags：至少保留几面旗
// opts.extra：额外的候选线索（第 4 章的配方条件）；带 keep: true 的永远不删
export function minimize(level, truth, opts = {}) {
  let list = [...truths(level, truth, opts), ...(opts.extra || [])];
  let lv = assemble(level, list);
  if (!good(lv)) return null;
  const order = shuffle(list).sort((a, b) => a.w - b.w + (rnd() - 0.5) * 1.5);
  for (const item of order) {
    if (item.keep) continue;
    const trial = list.filter((x) => x !== item);
    const tl = assemble(level, trial);
    const flagged = new Set(trial.filter((x) => x.fix).map((x) => x.rid));
    if (tl.regions.some((r) => r.constraints.length === 0 && !flagged.has(r.id))) continue;
    if (item.fix && trial.filter((x) => x.fix).length < (opts.minFlags ?? 0)) continue;
    const isDir = (x) => x.c?.type === 'DIRECTION_OF';
    if (isDir(item) && trial.filter(isDir).length < (opts.minDir ?? 0)) continue;
    if (good(tl)) list = trial;
  }
  lv = assemble(level, list);
  const d = good(lv);
  const ix = buildIndex(lv);
  const unarySolved = lv.regions.every((r) => localCandidates(ix, r).length === 1);
  return { lv, d, n: list.length, flags: list.filter((x) => x.fix).length, maxPer: Math.max(...lv.regions.map((r) => r.constraints.length)), unarySolved };
}

const resFor = (W, H) => ({ gold: Math.round(W * H / 14), iron: Math.round(W * H / 18), forest: Math.round(W * H / 10), farmland: Math.round(W * H / 12), building: Math.round(W * H / 18) });
const SYM = { plain: '.', forest: 'F', lake: 'L', mountain: 'M', gold: 'G', iron: 'I', farmland: 'A', building: 'B', coal: 'C', copper: 'U', cotton: 'T', pasture: 'P' };
const fmt = (c) => c.type + (c.params ? ' ' + Object.values(c.params).join(' ') : '');

// ── 第 4 章：先定配方树，再找能装下它的切法 ─────────────────────────
// recipe.nodes：{ id, name, icon, facility: 'gather'|'factory', tag?, count?: [min,max], inputs?: [nodeId] }
// recipe.extras：普通区域（居民、农场…）；recipe.pollution：[{ node, tag, dist }]
// strictExclusive=false 时不强求采集设施只挨着自己的工厂；独占供料只在碰巧成立时作为线索
export function generateFactory({ W, H, recipe, s, scatter = {}, maxShare = 1, strictExclusive = true }) {
  seed = s;
  const nodes = recipe.nodes, extras = recipe.extras || [];
  const parts = partition(W, H, nodes.length + extras.length);
  if (!parts || parts.some((p) => p.w * p.h > maxShare * W * H)) return null;
  const touch = (a, b) => (a.x + a.w === b.x || b.x + b.w === a.x) && a.y < b.y + b.h && b.y < a.y + a.h
    || (a.y + a.h === b.y || b.y + b.h === a.y) && a.x < b.x + b.w && b.x < a.x + a.w;
  const edges = nodes.flatMap((n) => (n.inputs || []).map((i) => [i, n.id]));
  const factories = nodes.filter((n) => n.facility === 'factory').map((n) => n.id);
  // 回溯：给每个配方节点挑一块矩形，配方连线必须相邻；采集设施不挨着别的工厂（这样独占供料成立）
  const order = shuffle(parts.map((_, i) => i));
  const pick = new Map();
  const used = new Set();
  const okSoFar = () => edges.every(([a, b]) => !pick.has(a) || !pick.has(b) || touch(parts[pick.get(a)], parts[pick.get(b)]))
    && (!strictExclusive || nodes.filter((n) => n.facility === 'gather' && pick.has(n.id)).every((n) => {
      const mine = parts[pick.get(n.id)];
      const consumers = edges.filter(([a]) => a === n.id).map(([, b]) => b);
      return factories.every((f) => consumers.includes(f) || !pick.has(f) || !touch(mine, parts[pick.get(f)]));
    }));
  const bt = (i) => {
    if (i === nodes.length) return true;
    for (const pi of order) {
      if (used.has(pi)) continue;
      const n = nodes[i];
      if (n.facility === 'gather' && parts[pi].w * parts[pi].h < (n.count?.[0] ?? 1) + 1) continue;
      pick.set(n.id, pi); used.add(pi);
      if (okSoFar() && bt(i + 1)) return true;
      pick.delete(n.id); used.delete(pi);
    }
    return false;
  };
  if (!bt(0)) return null;
  const extraParts = parts.map((_, i) => i).filter((i) => !used.has(i));
  const grid = Array.from({ length: H }, () => Array(W).fill('plain'));
  const cellsIn = (p) => { const a = []; for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) a.push([x, y]); return a; };
  const counts = {};
  // 采集设施里放对应资源
  for (const n of nodes.filter((n) => n.facility === 'gather')) {
    const free = shuffle(cellsIn(parts[pick.get(n.id)]));
    const [lo, hi] = n.count || [1, 1];
    const k = Math.min(free.length - 1, lo + Math.floor(rnd() * (hi - lo + 1)));
    counts[n.id] = k;
    for (let i = 0; i < k; i++) { const [x, y] = free.pop(); grid[y][x] = n.tag; }
  }
  // 其他资源随机撒在普通区域和工厂里（包括诱饵矿点）
  const otherCells = shuffle([...extraParts.flatMap((i) => cellsIn(parts[i])), ...factories.flatMap((f) => cellsIn(parts[pick.get(f)]))]);
  for (const [tag, k] of Object.entries(scatter)) for (let i = 0; i < k && otherCells.length; i++) { const [x, y] = otherCells.pop(); grid[y][x] = tag; }
  const cells = []; let id = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push({ id: id++, x, y, tags: [grid[y][x]], assignable: true, fixedRegion: null });
  const nodeRid = new Map(nodes.map((n, i) => [n.id, 'R' + (i + 1)]));
  const regions = [
    ...nodes.map((n) => ({ id: nodeRid.get(n.id), rect: parts[pick.get(n.id)], facility: n.facility, owner: { name: n.name, color: n.color, icon: n.icon, avatar: null }, constraints: [] })),
    ...extras.map((e, i) => ({ id: 'R' + (nodes.length + i + 1), rect: parts[extraParts[i]], owner: { name: e.name, color: e.color, icon: e.icon, avatar: null }, constraints: [] })),
  ];
  const level = { schemaVersion: 1, id: 'gen', shapeRule: 'RECT', adjacency: 4, coverage: 'FULL', board: { width: W, height: H, cells }, regions, globalConstraints: [] };
  const truth = new Map(regions.map((r) => [r.id, cellsIn(r.rect).map(([x, y]) => y * W + x + 1)]));
  // 配方条件：供料（含产量）必留；独占供料可删；污染范围必留（不成立就换种子）
  const extra = [];
  for (const [a, b] of edges) {
    const from = nodes.find((n) => n.id === a);
    const c = from.facility === 'gather'
      ? { type: 'SUPPLIED_BY', params: { region: nodeRid.get(a), tag: from.tag, value: counts[a] } }
      : { type: 'SUPPLIED_BY', params: { region: nodeRid.get(a) } };
    extra.push({ rid: nodeRid.get(b), c, w: 9, keep: true });
  }
  for (const n of nodes.filter((n) => n.facility === 'gather')) {
    const consumers = edges.filter(([x]) => x === n.id).map(([, y]) => y);
    if (consumers.length !== 1) continue;
    const mine = parts[pick.get(n.id)];
    const exclusive = factories.every((f) => f === consumers[0] || !touch(mine, parts[pick.get(f)]));
    if (exclusive) extra.push({ rid: nodeRid.get(n.id), c: { type: 'EXCLUSIVE_TO', params: { region: nodeRid.get(consumers[0]) } }, w: 2 });
  }
  for (const pol of recipe.pollution || []) extra.push({ rid: nodeRid.get(pol.node), c: { type: 'NO_TAG_WITHIN', params: { tag: pol.tag, dist: pol.dist } }, w: 9, keep: true });
  const lvCheck = structuredClone(level);
  for (const e of extra) lvCheck.regions.find((r) => r.id === e.rid).constraints.push(e.c);
  if (!validate(lvCheck, truth).constraints.every((c) => c.satisfied)) return null;
  return { level, truth, extra, product: { ...recipe.product, goal: nodeRid.get(nodes.find((n) => n.goal).id) } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const [W, H, k, a, b] = args.slice(1).filter((x) => !x.startsWith('--')).map(Number);
  const flag = (name, dflt) => { const f = args.find((x) => x.startsWith(`--${name}`)); return f ? (f.includes('=') ? Number(f.split('=')[1]) : true) : dflt; };
  const gopts = { sea: flag('sea', 0), blockedRect: !flag('noblock', false), maxShare: flag('maxshare', 1) };
  THIN = !!flag('thin', false);
  const keepArg = args.find((x) => x.startsWith('--keep='));
  const keepTypes = keepArg ? keepArg.split('=')[1].split(',') : undefined;
  const mopts = { direction: flag('dir', false) || flag('mindir', 0) > 0, flags: flag('flags', 0) > 0, minFlags: flag('flags', 0), minDir: flag('mindir', 0), keepTypes, touchRegion: !!keepTypes?.includes('MUST_TOUCH_REGION'), shapes: flag('shapes', false), distance: flag('distance', false) || flag('hub', false), hub: flag('hub', false) };
  const make = (s) => { const g = generate({ W, H, k, res: resFor(W, H), s, ...gopts }); return g && minimize(g.level, g.truth, mopts); };
  if (cmd === 'factory' || cmd === 'factoryshow' || cmd === 'factoryjs') {
    const { RECIPES } = await import('./recipes-ch4.mjs');
    const recipe = RECIPES[args[1]];
    const [FW, FH, fa, fb] = args.slice(2).filter((x) => !x.startsWith('--')).map(Number);
    const makeF = (s) => { const g = generateFactory({ W: FW, H: FH, recipe, s, scatter: flag('nodecoy', false) ? Object.fromEntries(Object.entries(recipe.scatter || {}).filter(([t]) => ['building', 'farmland', 'forest'].includes(t))) : recipe.scatter, maxShare: flag('maxshare', 1), strictExclusive: !flag('loose', false) }); if (!g) return null; const m = minimize(g.level, g.truth, { extra: g.extra }); return m && { ...m, product: g.product }; };
    if (cmd === 'factory') {
      for (let s = fa; s < fb; s++) {
        const m = makeF(s); if (!m || m.unarySolved) continue;
        console.log(JSON.stringify({ seed: s, rounds: m.d.rounds, clues: m.n, maxPer: m.maxPer }));
      }
    } else if (cmd === 'factoryjs') {
      // 输出 gen-chapter4.mjs 用的 level({...}) 代码块（id/名字/故事留给手写）
      const m = makeF(fa);
      if (!m) { console.log('该种子没有合格关卡'); process.exit(1); }
      const js = (v) => JSON.stringify(v).replace(/"([a-zA-Z_]+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ').replace(/:  /g, ': ');
      const byXY = new Map(m.lv.board.cells.map((c) => [`${c.x},${c.y}`, c]));
      const rows = [];
      for (let y = 0; y < FH; y++) { const row = []; for (let x = 0; x < FW; x++) { const c = byXY.get(`${x},${y}`); row.push(c ? SYM[c.tags[0]] : '~'); } rows.push('    ' + row.join(' ')); }
      console.log(`  // recipe ${args[1]}, ${FW}x${FH}, seed ${fa}, rounds ${m.d.rounds}`);
      console.log(`  product: ${js(m.product)},`);
      console.log('  map: `\n' + rows.join('\n') + '`,');
      console.log('  regions: [');
      for (const r of m.lv.regions) console.log(`    { id: '${r.id}', ${r.facility ? `facility: '${r.facility}', ` : ''}owner: ${js(r.owner)}, constraints: ${js(r.constraints)} },`);
      console.log('  ],');
      console.log(`  globalConstraints: ${js(m.lv.globalConstraints)},`);
    } else {
      const m = makeF(fa);
      if (!m) { console.log('该种子没有合格关卡'); process.exit(1); }
      const sol = solve(m.lv, { maxSolutions: 1 })[0]; const own = {};
      sol.forEach((r) => r.cells.forEach((c) => (own[c] = r.region.slice(1))));
      console.log(`seed ${fa} ${FW}x${FH} rounds=${m.d.rounds} clues=${m.n}`);
      for (let y = 0; y < FH; y++) {
        const row = m.lv.board.cells.filter((c) => c.y === y);
        console.log('  ' + row.map((c) => SYM[c.tags[0]] ?? c.tags[0][0].toUpperCase()).join('') + '    ' + row.map((c) => own[c.id] || '-').join(''));
      }
      for (const r of m.lv.regions) console.log(`  ${r.id} ${r.owner.name.zh}${r.facility ? '[' + r.facility + ']' : ''}: ${r.constraints.map(fmt).join(' | ')}`);
      console.log(`  global: ${m.lv.globalConstraints.map(fmt).join(' | ')}`);
    }
  } else if (cmd === 'search') {
    const found = [];
    for (let s = a; s < b; s++) {
      const m = make(s); if (!m || m.unarySolved || m.maxPer > 3) continue;
      const row = { seed: s, rounds: m.d.rounds, clues: m.n, flags: m.flags };
      console.log(JSON.stringify(row));
      found.push(row);
    }
    found.sort((x, y) => y.rounds - x.rounds || x.clues - y.clues);
    console.log('best ' + JSON.stringify(found.slice(0, 10)));
  } else if (cmd === 'js') {
    // 输出 gen-chapterN.mjs 用的代码块：地图（~ 海、记号后的数字 = 营地旗）+ 区域条件（角色名字留给手写）
    const m = make(a);
    if (!m) { console.log('该种子没有合格关卡'); process.exit(1); }
    const js = (v) => JSON.stringify(v).replace(/"([a-zA-Z_]+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ');
    const byXY = new Map(m.lv.board.cells.map((c) => [`${c.x},${c.y}`, c]));
    const blockedTags = [...new Set(m.lv.board.cells.filter((c) => c.assignable === false).map((c) => SYM[c.tags[0]]))].join('');
    const rows = [];
    for (let y = 0; y < H; y++) { const row = []; for (let x = 0; x < W; x++) { const c = byXY.get(`${x},${y}`); row.push(c ? SYM[c.tags[0]] + (c.fixedRegion ? c.fixedRegion.slice(1) : '') : '~'); } rows.push('    ' + row.map((t) => t.padEnd(2)).join(' ').trimEnd()); }
    console.log(`  // ${W}x${H}, k=${k}, seed ${a}, rounds ${m.d.rounds}`);
    if (blockedTags) console.log(`  blocked: '${blockedTags}',`);
    console.log('  map: `\n' + rows.join('\n') + '`,');
    console.log('  regions: [');
    for (const r of m.lv.regions) console.log(`    { id: '${r.id}', owner: OWNER, constraints: ${js(r.constraints)} },`);
    console.log('  ],');
    console.log(`  globalConstraints: ${js(m.lv.globalConstraints)},`);
  } else if (cmd === 'show') {
    const m = make(a);
    if (!m) { console.log('该种子没有合格关卡'); process.exit(1); }
    const sol = solve(m.lv, { maxSolutions: 1 })[0]; const own = {};
    sol.forEach((r) => r.cells.forEach((c) => (own[c] = r.region.slice(1))));
    const byXY = new Map(m.lv.board.cells.map((c) => [`${c.x},${c.y}`, c]));
    console.log(`seed ${a} ${W}x${H} rounds=${m.d.rounds} clues=${m.n} flags=${m.flags}`);
    for (let y = 0; y < H; y++) {
      let map = '', ans = '';
      for (let x = 0; x < W; x++) {
        const c = byXY.get(`${x},${y}`);
        map += c ? (c.fixedRegion ? c.fixedRegion.slice(1) === own[c.id] ? '*' : '?' : SYM[c.tags[0]]) : '~';
        ans += c ? own[c.id] || '-' : '~';
      }
      console.log('  ' + map + '    ' + ans);
    }
    for (const r of m.lv.regions) console.log(`  ${r.id}: ${r.constraints.map(fmt).join(' | ')}`);
    console.log(`  global: ${m.lv.globalConstraints.map(fmt).join(' | ')}`);
    console.log(`  flags: ${m.lv.board.cells.filter((c) => c.fixedRegion).map((c) => `${c.fixedRegion}@(${c.x},${c.y})${SYM[c.tags[0]]}`).join(' ')}`);
  } else {
    console.log('用法见文件头注释；选项 --sea=N 海块数、--noblock 不放障碍、--dir 方位线索、--flags=N 至少 N 面营地旗');
  }
}
