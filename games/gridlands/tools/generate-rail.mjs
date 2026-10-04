// 第 5 章铁路关卡候选生成器：先铺铁路，再把剩下的空地切成矩形地块，最后精简条件
// （仍保证唯一解 + 只靠推理可解，见 generate-level.mjs 的 minimize）。
// 用法：
//   node tools/generate-rail.mjs search W H FROM TO [选项]   # 搜种子，逐行输出
//   node tools/generate-rail.mjs show   W H SEED [选项]      # 打印地图、答案和条件
//   node tools/generate-rail.mjs js     W H SEED [选项]      # 输出可粘进 gen-chapter5.mjs 的代码（OWNER 换成角色）
// 选项：--runs=N 主线段数（默认 2）；--spur 加一条支线通往货场；--plots=N 普通地块数（默认 3）；
//       --tunnel 一道不可通行的山脉，只留一格隧道给铁路；--bridge 一条不可通行的河，只留一格桥；
//       --orient 允许「横向 / 纵向」线索；--maxlen=N 每段最长（默认 5）；--edge 起点车站贴着地图边缘
import { solve } from '../web/src/core/engine.js';
import { minimize, setSeed } from './generate-level.mjs';

let seed = 1;
const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const k = (x, y) => `${x},${y}`;

export function generateRail({ W, H, s, runs = 2, spur = false, plots = 3, tunnel = false, bridge = false, maxLen = 5, edge = false }) {
  // 线性同余在小种子下前几次输出几乎一样，先打散再预热
  seed = Math.imul(s, 2654435761) >>> 0;
  for (let i = 0; i < 4; i++) rnd();
  const owner = new Map(); // "x,y" -> region key
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const free = (x, y) => inside(x, y) && !owner.has(k(x, y));
  const rects = []; // { key, kind, x, y, w, h }
  const addRect = (r) => { rects.push(r); for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) owner.set(k(x, y), r.key); };
  const rectFree = (x, y, w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (!free(xx, yy)) return false; return true; };

  // 1) 起点车站（2×2）
  let sx = ri(0, W - 2), sy = ri(0, H - 2);
  if (edge) { const side = ri(0, 3); if (side === 0) sx = 0; else if (side === 1) sx = W - 2; else if (side === 2) sy = 0; else sy = H - 2; }
  if (!rectFree(sx, sy, 2, 2)) return null;
  addRect({ key: 'S1', kind: 'station', x: sx, y: sy, w: 2, h: 2 });

  // 2) 主线：从车站的某条边伸出，逐段直走再转弯；每段一格宽、长度 ≥ 2
  const exits = shuffle([[sx + 2, sy, 0], [sx + 2, sy + 1, 0], [sx, sy + 2, 1], [sx + 1, sy + 2, 1], [sx - 1, sy, 2], [sx - 1, sy + 1, 2], [sx, sy - 1, 3], [sx + 1, sy - 1, 3]]);
  const room = (x, y, d) => { let n = 0; while (free(x + DIRS[d][0] * n, y + DIRS[d][1] * n)) n++; return n; };
  const [ex, ey, ed] = exits.filter(([x, y, d]) => room(x, y, d) >= 3).sort((a, b) => room(b[0], b[1], b[2]) - room(a[0], a[1], a[2]) + (rnd() - 0.5) * 4)[0] || [];
  if (ex == null) return null;
  let x = ex, y = ey, d = ed;
  const segs = [];
  for (let i = 0; i < runs; i++) {
    const [dx, dy] = DIRS[d];
    const want = ri(2, maxLen);
    const cells = [];
    for (let n = 0; n < want; n++) {
      const cx = x + dx * n, cy = y + dy * n;
      if (!free(cx, cy)) break;
      cells.push([cx, cy]);
    }
    if (cells.length < 2) return null;
    const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
    const r = { key: `T${i + 1}`, kind: 'rail', x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1, dir: d };
    addRect(r);
    segs.push({ r, end: cells[cells.length - 1] });
    const [lx, ly] = cells[cells.length - 1];
    if (i === runs - 1) { x = lx + dx; y = ly + dy; break; }
    // 转弯：两个方向里挑前方空间更大的（留 ≥3 格才走得出一段）
    const turns = shuffle([(d + 1) % 4, (d + 3) % 4]).filter((nd) => room(lx + DIRS[nd][0], ly + DIRS[nd][1], nd) >= 3);
    if (!turns.length) return null;
    d = turns[0];
    x = lx + DIRS[d][0]; y = ly + DIRS[d][1];
  }

  // 3) 终点车站（2×2）：贴着最后一段的末端，优先放在延长线方向
  const last = segs[segs.length - 1];
  const [lx, ly] = last.end;
  // 终点格周围所有能放下 2×2 的位置（不能压到铁轨），优先放在延长线方向
  const [ldx, ldy] = DIRS[last.r.dir];
  const cand = [];
  for (let oy = -2; oy <= 1; oy++) for (let ox = -2; ox <= 1; ox++) {
    const cx = lx + ox, cy = ly + oy;
    const touches = [[lx + 1, ly], [lx - 1, ly], [lx, ly + 1], [lx, ly - 1]].some(([tx, ty]) => tx >= cx && tx < cx + 2 && ty >= cy && ty < cy + 2);
    if (touches && rectFree(cx, cy, 2, 2)) cand.push([cx, cy, (cx + 0.5 - lx) * ldx + (cy + 0.5 - ly) * ldy]);
  }
  cand.sort((a, b) => b[2] - a[2] + (rnd() - 0.5));
  const spot = cand[0];
  if (!spot) return null;
  addRect({ key: 'S2', kind: 'station', x: spot[0], y: spot[1], w: 2, h: 2 });

  // 4) 支线：从中间某段伸出一条垂直短线，末端接一个货场
  let spurRect = null, yard = null;
  if (spur) {
    for (const seg of shuffle(segs)) {
      const horiz = seg.r.h === 1;
      const along = horiz ? ri(seg.r.x, seg.r.x + seg.r.w - 1) : ri(seg.r.y, seg.r.y + seg.r.h - 1);
      for (const sgn of shuffle([1, -1])) {
        const len = ri(2, 3);
        const cells = [];
        for (let n = 1; n <= len; n++) cells.push(horiz ? [along, seg.r.y + sgn * n] : [seg.r.x + sgn * n, along]);
        if (!cells.every(([cx, cy]) => free(cx, cy))) continue;
        const xs = cells.map((c) => c[0]), ys = cells.map((c) => c[1]);
        const sr = { key: 'TS', kind: 'rail', x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs) + 1, h: Math.max(...ys) - Math.min(...ys) + 1, from: seg.r.key };
        const [tx, ty] = cells[cells.length - 1];
        const inSpur = (cx, cy) => cells.some(([px, py]) => px === cx && py === cy);
        const spots = [];
        for (let oy = -2; oy <= 1; oy++) for (let ox = -2; ox <= 1; ox++) {
          const yx = tx + ox, yy = ty + oy;
          let okSpot = true;
          for (let a = 0; a < 2 && okSpot; a++) for (let b = 0; b < 2 && okSpot; b++) if (!free(yx + a, yy + b) || inSpur(yx + a, yy + b)) okSpot = false;
          const touch = [[tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]].some(([qx, qy]) => qx >= yx && qx < yx + 2 && qy >= yy && qy < yy + 2);
          if (okSpot && touch) spots.push([yx, yy]);
        }
        if (!spots.length) continue;
        const [yx, yy] = spots[Math.floor(rnd() * spots.length)];
        addRect(sr); spurRect = sr;
        yard = { key: 'Y', kind: 'yard', x: yx, y: yy, w: 2, h: 2 };
        addRect(yard);
        break;
      }
      if (spurRect) break;
    }
    if (!spurRect) return null;
  }

  // 5) 隧道 / 桥梁：在主线某段的中间格设一个可通行的山 / 河格，再沿垂直方向画一道不可通行的山脉 / 河流（只穿过空地）
  const grid = Array.from({ length: H }, () => Array(W).fill('plain'));
  const blocked = new Set();
  const crossings = [];
  for (const [flag, tag] of [[tunnel, 'mountain'], [bridge, 'lake']]) {
    if (!flag) continue;
    let done = false;
    for (const seg of shuffle(segs)) {
      const horiz = seg.r.h === 1;
      const cells = []; for (let yy = seg.r.y; yy < seg.r.y + seg.r.h; yy++) for (let xx = seg.r.x; xx < seg.r.x + seg.r.w; xx++) cells.push([xx, yy]);
      const inner = cells.slice(1, -1).filter(([cx, cy]) => !crossings.some(([px, py]) => Math.abs(px - cx) + Math.abs(py - cy) < 3));
      for (const [cx, cy] of shuffle(inner)) {
        const line = []; let sides = 0;
        for (const sgn of [1, -1]) {
          let n = 1, got = 0;
          for (; ; n++) {
            const bx = horiz ? cx : cx + sgn * n, by = horiz ? cy + sgn * n : cy;
            if (!free(bx, by)) break;
            line.push([bx, by]); got++;
          }
          if (got) sides++;
        }
        if (line.length < 2 || sides < 1) continue;
        grid[cy][cx] = tag; crossings.push([cx, cy]);
        for (const [bx, by] of line) { grid[by][bx] = tag; blocked.add(k(bx, by)); owner.set(k(bx, by), 'X'); }
        done = true; break;
      }
      if (done) break;
    }
    if (!done) return null;
  }

  // 6) 剩下的空地切成矩形地块：从左上角的空格开始，随机长出一块尽量 ≥2×2 的矩形
  let pi = 0;
  const target = W * H;
  while (owner.size < target) {
    let fx = -1, fy = -1;
    outer: for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (free(xx, yy)) { fx = xx; fy = yy; break outer; }
    let maxW = 0; while (free(fx + maxW, fy)) maxW++;
    const w = maxW <= 3 ? maxW : ri(Math.ceil(maxW / 2), maxW);
    let h = 1; const hmax = ri(2, H);
    while (h < hmax && rectFree(fx, fy + h, w, 1)) h++;
    addRect({ key: `P${++pi}`, kind: 'plot', x: fx, y: fy, w, h });
  }
  // 合并：相邻且能拼成矩形的两块地块随机合并，直到数量降到 plots（地块不超过地图的 40%）
  for (let guard = 0; guard < 50; guard++) {
    const ps = rects.filter((r) => r.kind === 'plot');
    if (ps.length <= plots) break;
    const pairs = [];
    for (const a of ps) for (const b of ps) if (a !== b) {
      if (a.y === b.y && a.h === b.h && a.x + a.w === b.x) pairs.push([a, b, { x: a.x, y: a.y, w: a.w + b.w, h: a.h }]);
      if (a.x === b.x && a.w === b.w && a.y + a.h === b.y) pairs.push([a, b, { x: a.x, y: a.y, w: a.w, h: a.h + b.h }]);
    }
    const ok = pairs.filter(([, , m]) => m.w * m.h <= W * H * 0.4);
    if (!ok.length) break;
    const [a, b, m] = ok[Math.floor(rnd() * ok.length)];
    Object.assign(a, m);
    rects.splice(rects.indexOf(b), 1);
    for (let yy = a.y; yy < a.y + a.h; yy++) for (let xx = a.x; xx < a.x + a.w; xx++) owner.set(k(xx, yy), a.key);
  }
  const plotRects = rects.filter((r) => r.kind === 'plot');
  if (plotRects.length < plots || plotRects.length > plots + 2) return null;
  if (plotRects.some((r) => r.w * r.h < 2)) return null;


  // 7) 普通地块里撒资源
  const plotCells = shuffle(plotRects.flatMap((r) => { const a = []; for (let yy = r.y; yy < r.y + r.h; yy++) for (let xx = r.x; xx < r.x + r.w; xx++) a.push([xx, yy]); return a; }));
  const scatter = { farmland: Math.round(W * H / 14), forest: Math.round(W * H / 14), building: Math.round(W * H / 20), gold: Math.round(W * H / 24), iron: Math.round(W * H / 24) };
  for (const [tag, n] of Object.entries(scatter)) for (let i = 0; i < n && plotCells.length; i++) { const [cx, cy] = plotCells.pop(); grid[cy][cx] = tag; }

  // 8) 组装关卡：区域顺序 = 车站、主线各段、支线、货场、地块
  const live = rects;
  const order = [...live.filter((r) => r.kind === 'station'), ...live.filter((r) => r.kind === 'rail'), ...live.filter((r) => r.kind === 'yard'), ...live.filter((r) => r.kind === 'plot')];
  const rid = new Map(order.map((r, i) => [r.key, `R${i + 1}`]));
  const cells = []; let id = 1;
  for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) cells.push({ id: id++, x: xx, y: yy, tags: [grid[yy][xx]], assignable: !blocked.has(k(xx, yy)), fixedRegion: null });
  const regions = order.map((r) => ({ id: rid.get(r.key), rect: r, ...(r.kind === 'rail' ? { kind: 'rail' } : r.kind === 'station' ? { kind: 'station' } : {}), owner: { name: { zh: r.key, en: r.key }, color: '#999', icon: '', avatar: null }, constraints: [] }));
  const level = { schemaVersion: 1, id: 'gen', shapeRule: 'RECT', adjacency: 4, coverage: 'FULL', board: { width: W, height: H, cells }, regions, globalConstraints: [] };
  const truth = new Map(regions.map((r) => { const a = []; for (let yy = r.rect.y; yy < r.rect.y + r.rect.h; yy++) for (let xx = r.rect.x; xx < r.rect.x + r.rect.w; xx++) a.push(yy * W + xx + 1); return [r.id, a]; }));

  // 9) 必留线索：铁轨是一格宽长条、首尾相接；车站是正方形；隧道 / 桥梁规则
  const extra = [];
  const keep = (r, c) => extra.push({ rid: r, c, w: 9, keep: true });
  for (const r of live.filter((x) => x.kind === 'rail')) keep(rid.get(r.key), { type: 'SHAPE_LINE' });
  for (const r of live.filter((x) => x.kind === 'station')) keep(rid.get(r.key), { type: 'SHAPE_SQUARE' });
  keep(rid.get('T1'), { type: 'MUST_TOUCH_REGION', params: { region: rid.get('S1') } });
  for (let i = 1; i < segs.length; i++) keep(rid.get(`T${i + 1}`), { type: 'MUST_TOUCH_REGION', params: { region: rid.get(`T${i}`) } });
  keep(rid.get('S2'), { type: 'MUST_TOUCH_REGION', params: { region: rid.get(`T${segs.length}`) } });
  if (spurRect) {
    keep(rid.get('TS'), { type: 'MUST_TOUCH_REGION', params: { region: rid.get(spurRect.from) } });
    keep(rid.get('Y'), { type: 'MUST_TOUCH_REGION', params: { region: rid.get('TS') } });
  }
  if (tunnel) extra.push({ rid: null, c: { type: 'RAIL_ONLY_TAG', params: { tag: 'mountain' } }, w: 9, keep: true });
  if (bridge) extra.push({ rid: null, c: { type: 'RAIL_ONLY_TAG', params: { tag: 'lake' } }, w: 9, keep: true });
  return { level, truth, extra };
}

const SYM = { plain: '.', forest: 'F', lake: 'L', mountain: 'M', gold: 'G', iron: 'I', farmland: 'A', building: 'B' };
const fmt = (c) => c.type + (c.params ? ' ' + Object.values(c.params).join(' ') : '');

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const nums = args.slice(1).filter((x) => !x.startsWith('--')).map(Number);
  const flag = (name, dflt) => { const f = args.find((x) => x.startsWith(`--${name}`)); return f ? (f.includes('=') ? Number(f.split('=')[1]) : true) : dflt; };
  const gopts = { runs: flag('runs', 2), spur: !!flag('spur', false), plots: flag('plots', 3), tunnel: !!flag('tunnel', false), bridge: !!flag('bridge', false), maxLen: flag('maxlen', 5), edge: !!flag('edge', false) };
  const orient = !!flag('orient', false);
  const make = (W, H, s) => {
    const g = generateRail({ W, H, s, ...gopts });
    if (!g) return null;
    setSeed(s);
    const extra = [...g.extra];
    if (orient) for (const r of g.level.regions.filter((x) => x.kind === 'rail')) extra.push({ rid: r.id, c: { type: r.rect.h === 1 ? 'SHAPE_HLINE' : 'SHAPE_VLINE' }, w: 4 });
    const m = minimize(g.level, g.truth, { extra });
    return m && { ...m, level: g.level };
  };
  if (cmd === 'search') {
    const [W, H, a, b] = nums;
    for (let s = a; s < b; s++) {
      const m = make(W, H, s); if (!m || m.unarySolved || m.maxPer > 3) continue;
      console.log(JSON.stringify({ seed: s, rounds: m.d.rounds, clues: m.n, regions: m.lv.regions.length }));
    }
  } else if (cmd === 'show' || cmd === 'js') {
    const [W, H, s] = nums;
    const m = make(W, H, s);
    if (!m) { console.log('该种子没有合格关卡'); process.exit(1); }
    const byXY = new Map(m.lv.board.cells.map((c) => [k(c.x, c.y), c]));
    if (cmd === 'show') {
      const sol = solve(m.lv, { maxSolutions: 1 })[0]; const own = {};
      sol.forEach((r) => r.cells.forEach((c) => (own[c] = r.region.slice(1))));
      console.log(`seed ${s} ${W}x${H} rounds=${m.d.rounds} clues=${m.n}`);
      for (let y = 0; y < H; y++) {
        let map = '', ans = '';
        for (let x = 0; x < W; x++) { const c = byXY.get(k(x, y)); map += c.assignable === false ? SYM[c.tags[0]].toLowerCase() : SYM[c.tags[0]]; ans += (own[c.id] ?? '#').toString(36).slice(-1); }
        console.log('  ' + map + '    ' + ans);
      }
      for (const r of m.lv.regions) console.log(`  ${r.id}${r.kind ? '[' + r.kind + ']' : ''} (${r.owner.name.zh}): ${r.constraints.map(fmt).join(' | ')}`);
      console.log(`  global: ${m.lv.globalConstraints.map(fmt).join(' | ')}`);
    } else {
      const js = (v) => JSON.stringify(v).replace(/"([a-zA-Z_]+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ');
      const rows = [];
      for (let y = 0; y < H; y++) { const row = []; for (let x = 0; x < W; x++) { const c = byXY.get(k(x, y)); row.push(c.assignable === false ? SYM[c.tags[0]].toLowerCase() : SYM[c.tags[0]]); } rows.push('    ' + row.join(' ')); }
      console.log(`  // rail ${W}x${H}, seed ${s}, rounds ${m.d.rounds}, ${args.filter((x) => x.startsWith('--')).join(' ')}`);
      console.log('  map: `\n' + rows.join('\n') + '`,');
      console.log('  regions: [');
      for (const r of m.lv.regions) console.log(`    { id: '${r.id}', ${r.kind ? `kind: '${r.kind}', ` : ''}owner: OWNER_${r.owner.name.zh}, constraints: ${js(r.constraints)} },`);
      console.log('  ],');
      console.log(`  globalConstraints: ${js(m.lv.globalConstraints)},`);
    }
  }
}
