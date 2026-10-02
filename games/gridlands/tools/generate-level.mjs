// 关卡候选生成器：随机切出答案分区 → 摆资源 → 列出对答案成立的条件 → 贪心删条件，
// 只保留「仍唯一解 + 仍可只靠推理解开」的最小条件集。挑中的候选再手工写进 gen-chapterN.mjs。
// 用法：
//   node tools/generate-level.mjs search W H K FROM TO   # 搜种子，按推理轮数排序输出
//   node tools/generate-level.mjs show   W H K SEED       # 打印该种子的地图、答案和条件
import { solve, validate, buildIndex, localCandidates } from '../web/src/core/engine.js';
import { deduce } from './deduce.mjs';

let seed = 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// 随机「切蛋糕」：把 W×H 切成 k 个矩形
function partition(W, H, k) {
  let rects = [{ x: 0, y: 0, w: W, h: H }];
  let guard = 0;
  while (rects.length < k && guard++ < 200) {
    const i = Math.floor(rnd() * rects.length); const r = rects[i];
    const vert = r.w > r.h ? rnd() < 0.75 : rnd() < 0.25;
    if (vert && r.w >= 2) { const c = 1 + Math.floor(rnd() * (r.w - 1)); rects.splice(i, 1, { ...r, w: c }, { ...r, x: r.x + c, w: r.w - c }); }
    else if (!vert && r.h >= 2) { const c = 1 + Math.floor(rnd() * (r.h - 1)); rects.splice(i, 1, { ...r, h: c }, { ...r, y: r.y + c, h: r.h - c }); }
  }
  return rects.every((r) => r.w * r.h >= 2) ? rects : null;
}

const RES = ['gold', 'iron', 'forest', 'farmland', 'building'];

export function generate({ W, H, k, blockedRect = true, res = { gold: 3, iron: 2, forest: 4, farmland: 3, building: 2 }, s }) {
  seed = s;
  const parts = partition(W, H, k + (blockedRect ? 1 : 0));
  if (!parts) return null;
  let blocked = null;
  if (blockedRect) {
    const small = parts.filter((p) => p.w * p.h <= 4 && p.w * p.h >= 2);
    if (!small.length) return null;
    blocked = pick(small);
  }
  const owned = parts.filter((p) => p !== blocked);
  const blockTag = pick(['lake', 'mountain']);
  const grid = Array.from({ length: H }, () => Array(W).fill('plain'));
  if (blocked) for (let y = blocked.y; y < blocked.y + blocked.h; y++) for (let x = blocked.x; x < blocked.x + blocked.w; x++) grid[y][x] = blockTag;
  const free = shuffle([].concat(...owned.map((p) => { const a = []; for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) a.push([x, y]); return a; })));
  for (const [tag, n] of Object.entries(res)) for (let i = 0; i < n && free.length; i++) { const [x, y] = free.pop(); grid[y][x] = tag; }
  const cells = []; let id = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push({ id: id++, x, y, tags: [grid[y][x]], assignable: grid[y][x] !== blockTag || !blocked, fixedRegion: null });
  if (blocked) for (const c of cells) if (c.tags[0] === blockTag) c.assignable = false;
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
export function truths(level, truth) {
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
    add('MUST_ON_EDGE'); add('MUST_NOT_ON_CORNER'); add('AREA_MAX', null, 2); add('AREA_MIN', null, 2);
    for (const o of level.regions) if (o.id !== r.id) { add('MUST_NOT_TOUCH_REGION', { region: o.id }); }
  }
  for (const a of level.regions) for (const b of level.regions) if (a.id < b.id) {
    for (const c of [{ type: 'AREA_LARGER_THAN', params: { a: a.id, b: b.id } }, { type: 'AREA_LARGER_THAN', params: { a: b.id, b: a.id } }, { type: 'AREA_EQUAL_TO', params: { a: a.id, b: b.id } }])
      if (holds(level, truth, null, c)) out.push({ rid: null, c, w: 3 });
  }
  for (const t of RES) { const c = { type: 'ONLY_ONE_CONTAINS', params: { tag: t } }; if (holds(level, truth, null, c)) out.push({ rid: null, c, w: 2 }); }
  return out;
}

function assemble(level, list) {
  const lv = structuredClone(level);
  lv.regions.forEach((r) => (r.constraints = []));
  lv.globalConstraints = [];
  for (const { rid, c } of list) (rid ? lv.regions.find((r) => r.id === rid).constraints : lv.globalConstraints).push(c);
  return lv;
}

const good = (lv) => { const s = solve(lv, { maxSolutions: 2 }); if (s.length !== 1) return null; const d = deduce(lv); return d.solved ? d : null; };

// 贪心删条件：保持唯一解 + 可推理；优先保留权重高（数量类）的
export function minimize(level, truth) {
  let list = truths(level, truth);
  let lv = assemble(level, list);
  if (!good(lv)) return null;
  const order = shuffle(list).sort((a, b) => a.w - b.w + (rnd() - 0.5) * 1.5);
  for (const item of order) {
    const trial = list.filter((x) => x !== item);
    const tl = assemble(level, trial);
    if (tl.regions.some((r) => r.constraints.length === 0)) continue;
    if (good(tl)) list = trial;
  }
  lv = assemble(level, list);
  const d = good(lv);
  const ix = buildIndex(lv);
  const unarySolved = lv.regions.every((r) => localCandidates(ix, r).length === 1);
  return { lv, d, n: list.length, maxPer: Math.max(...lv.regions.map((r) => r.constraints.length)), unarySolved };
}

const resFor = (W, H) => ({ gold: Math.round(W * H / 14), iron: Math.round(W * H / 18), forest: Math.round(W * H / 10), farmland: Math.round(W * H / 12), building: Math.round(W * H / 18) });
const SYM = { plain: '.', forest: 'F', lake: 'L', mountain: 'M', gold: 'G', iron: 'I', farmland: 'A', building: 'B' };
const fmt = (c) => c.type + (c.params ? ' ' + Object.values(c.params).join(' ') : '');

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd, ...nums] = process.argv.slice(2);
  const [W, H, k, a, b] = nums.map(Number);
  if (cmd === 'search') {
    const found = [];
    for (let s = a; s < b; s++) {
      const g = generate({ W, H, k, res: resFor(W, H), s }); if (!g) continue;
      const m = minimize(g.level, g.truth); if (!m || m.unarySolved || m.maxPer > 3) continue;
      found.push({ seed: s, rounds: m.d.rounds, clues: m.n });
    }
    found.sort((x, y) => y.rounds - x.rounds || x.clues - y.clues);
    console.log(JSON.stringify(found.slice(0, 10)));
  } else if (cmd === 'show') {
    const g = generate({ W, H, k, res: resFor(W, H), s: a }); const m = g && minimize(g.level, g.truth);
    if (!m) { console.log('该种子没有合格关卡'); process.exit(1); }
    const sol = solve(m.lv, { maxSolutions: 1 })[0]; const own = {};
    sol.forEach((r) => r.cells.forEach((c) => (own[c] = r.region.slice(1))));
    console.log(`seed ${a} ${W}x${H} rounds=${m.d.rounds} clues=${m.n}`);
    for (let y = 0; y < H; y++) {
      const row = m.lv.board.cells.filter((c) => c.y === y);
      console.log('  ' + row.map((c) => SYM[c.tags[0]]).join('') + '    ' + row.map((c) => own[c.id] || '-').join(''));
    }
    for (const r of m.lv.regions) console.log(`  ${r.id}: ${r.constraints.map(fmt).join(' | ')}`);
    console.log(`  global: ${m.lv.globalConstraints.map(fmt).join(' | ')}`);
  } else {
    console.log('用法见文件头注释');
  }
}
