// @rlp/core — 区域划分逻辑引擎（纯 ESM，无依赖）
// 同一份代码供：1) React 前端实时校验  2) node 脚本验证关卡唯一解
// 关卡数据结构见 document/LEVEL_SCHEMA.md

/** 构建索引：按 id / 坐标快速查 cell */
export function buildIndex(level) {
  const byId = new Map();
  const byXY = new Map();
  const assignableIds = [];
  for (const c of level.board.cells) {
    byId.set(c.id, c);
    byXY.set(c.x + ',' + c.y, c);
    if (c.assignable !== false) assignableIds.push(c.id);
  }
  return { byId, byXY, assignableIds, level };
}

const key = (x, y) => x + ',' + y;
const NEI4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function cellsOf(ix, regionId, regionsMap) {
  const ids = regionsMap.get(regionId) || [];
  return ids.map((id) => ix.byId.get(id)).filter(Boolean);
}

function area(regionsMap, regionId) {
  return (regionsMap.get(regionId) || []).length;
}

function centroid(cells) {
  let sx = 0, sy = 0;
  for (const c of cells) { sx += c.x; sy += c.y; }
  return { x: sx / cells.length, y: sy / cells.length };
}

function touchesTag(ix, cells, tag) {
  const set = new Set(cells.map((c) => c.id));
  for (const c of cells) {
    for (const [dx, dy] of NEI4) {
      const n = ix.byXY.get(key(c.x + dx, c.y + dy));
      if (n && !set.has(n.id) && (n.tags || []).includes(tag)) return true;
    }
  }
  return false;
}

function regionsTouch(ix, aCells, bIdsSet) {
  for (const c of aCells) {
    for (const [dx, dy] of NEI4) {
      const n = ix.byXY.get(key(c.x + dx, c.y + dy));
      if (n && bIdsSet.has(n.id)) return true;
    }
  }
  return false;
}

/** 区域是否为「填满的矩形」（shapeRule=RECT 的硬规则）；空区域视为未完成（false） */
export function isFilledRect(ix, cells) {
  if (cells.length === 0) return false;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of cells) {
    minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
    minY = Math.min(minY, c.y); maxY = Math.max(maxY, c.y);
  }
  const w = maxX - minX + 1, h = maxY - minY + 1;
  if (w * h !== cells.length) return false;
  // bbox 内每格都必须存在、可分配、且属于本区域
  const set = new Set(cells.map((c) => c.id));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cell = ix.byXY.get(key(x, y));
      if (!cell || cell.assignable === false || !set.has(cell.id)) return false;
    }
  }
  return true;
}

/** 求值单条条件。regionId 为 null 表示全局条件 */
export function evalConstraint(ix, regionsMap, regionId, c) {
  const all = ix.level.regions.map((r) => r.id);
  const myCells = regionId ? cellsOf(ix, regionId, regionsMap) : [];
  const p = c.params || {};
  switch (c.type) {
    case 'AREA_EQ': return area(regionsMap, regionId) === p.value;
    case 'AREA_GE': return area(regionsMap, regionId) >= p.value;
    case 'AREA_LE': return area(regionsMap, regionId) <= p.value;
    case 'AREA_MAX': {
      const a = area(regionsMap, regionId);
      return all.every((r) => r === regionId || area(regionsMap, r) < a);
    }
    case 'AREA_MIN': {
      const a = area(regionsMap, regionId);
      return all.every((r) => r === regionId || area(regionsMap, r) > a);
    }
    case 'MUST_CONTAIN_CELL': return (regionsMap.get(regionId) || []).includes(p.cellId);
    case 'MUST_NOT_CONTAIN_CELL': return !(regionsMap.get(regionId) || []).includes(p.cellId);
    case 'MUST_CONTAIN_TAG': return myCells.some((c2) => (c2.tags || []).includes(p.tag));
    case 'MUST_NOT_CONTAIN_TAG': return !myCells.some((c2) => (c2.tags || []).includes(p.tag));
    case 'TAG_COUNT_EQ': return myCells.filter((c2) => (c2.tags || []).includes(p.tag)).length === p.value;
    case 'TAG_COUNT_GE': return myCells.filter((c2) => (c2.tags || []).includes(p.tag)).length >= p.value;
    case 'TAG_COUNT_LE': return myCells.filter((c2) => (c2.tags || []).includes(p.tag)).length <= p.value;
    case 'MUST_TOUCH_TAG': return touchesTag(ix, myCells, p.tag);
    case 'MUST_NOT_TOUCH_TAG': return !touchesTag(ix, myCells, p.tag);
    case 'MUST_TOUCH_REGION': return regionsTouch(ix, myCells, new Set(regionsMap.get(p.region) || []));
    case 'MUST_NOT_TOUCH_REGION': return !regionsTouch(ix, myCells, new Set(regionsMap.get(p.region) || []));
    case 'MUST_ON_EDGE': {
      const w = ix.level.board.width, h = ix.level.board.height;
      return myCells.some((c2) => c2.x === 0 || c2.y === 0 || c2.x === w - 1 || c2.y === h - 1);
    }
    case 'MUST_NOT_ON_CORNER': {
      const w = ix.level.board.width, h = ix.level.board.height;
      const corners = new Set([key(0, 0), key(w - 1, 0), key(0, h - 1), key(w - 1, h - 1)]);
      return !myCells.some((c2) => corners.has(key(c2.x, c2.y)));
    }
    case 'AREA_LARGER_THAN': return area(regionsMap, p.a) > area(regionsMap, p.b);
    case 'AREA_EQUAL_TO': return area(regionsMap, p.a) === area(regionsMap, p.b);
    case 'DIRECTION_OF': {
      const ca = centroid(cellsOf(ix, p.a, regionsMap));
      const cb = centroid(cellsOf(ix, p.b, regionsMap));
      if (p.dir === 'north') return ca.y < cb.y;
      if (p.dir === 'south') return ca.y > cb.y;
      if (p.dir === 'west') return ca.x < cb.x;
      if (p.dir === 'east') return ca.x > cb.x;
      return false;
    }
    case 'SUPPLIED_BY': {
      // 流水线：本设施必须挨着供料设施；给了 tag/value 时，供料设施里该资源的格数必须正好等于 value
      const supplier = cellsOf(ix, p.region, regionsMap);
      if (!regionsTouch(ix, myCells, new Set(regionsMap.get(p.region) || []))) return false;
      if (!p.tag) return true;
      const n = supplier.filter((c2) => (c2.tags || []).includes(p.tag)).length;
      return p.value == null ? n > 0 : n === p.value;
    }
    case 'EXCLUSIVE_TO': {
      // 独占供料：挨着指定的设施，且不挨着其他任何制造设施
      if (!regionsTouch(ix, myCells, new Set(regionsMap.get(p.region) || []))) return false;
      return ix.level.regions.every((r) => r.id === regionId || r.id === p.region || r.facility !== 'factory'
        || !regionsTouch(ix, myCells, new Set(regionsMap.get(r.id) || [])));
    }
    case 'NO_TAG_WITHIN': {
      // 污染范围：本区域任一格的曼哈顿距离 dist 以内（含自身）不能有该地形
      const targets = ix.level.board.cells.filter((c2) => (c2.tags || []).includes(p.tag));
      return !myCells.some((m) => targets.some((t) => Math.abs(t.x - m.x) + Math.abs(t.y - m.y) <= p.dist));
    }
    case 'WITHIN_REGION': case 'FAR_FROM_REGION': {
      // 区域间距离 = 两区域格子之间最小的曼哈顿距离（挨着 = 1）
      const other = cellsOf(ix, p.region, regionsMap);
      if (!myCells.length || !other.length) return c.type === 'FAR_FROM_REGION';
      let d = Infinity;
      for (const m of myCells) for (const o of other) d = Math.min(d, Math.abs(m.x - o.x) + Math.abs(m.y - o.y));
      return c.type === 'WITHIN_REGION' ? d <= p.dist : d > p.dist;
    }
    case 'SHAPE_LINE': case 'SHAPE_SQUARE': {
      if (!myCells.length) return false;
      const xs = myCells.map((m) => m.x), ys = myCells.map((m) => m.y);
      const w = Math.max(...xs) - Math.min(...xs) + 1, h = Math.max(...ys) - Math.min(...ys) + 1;
      return c.type === 'SHAPE_SQUARE' ? w === h : (w === 1 || h === 1) && myCells.length >= 2;
    }
    case 'ONLY_ONE_CONTAINS':
      return all.filter((r) => cellsOf(ix, r, regionsMap).some((c2) => (c2.tags || []).includes(p.tag))).length === 1;
    case 'ONLY_ONE_TOUCHES':
      return all.filter((r) => touchesTag(ix, cellsOf(ix, r, regionsMap), p.tag)).length === 1;
    default: return true; // 未知条件不阻断
  }
}

/**
 * 实时校验：返回每条条件的满足情况 + 硬规则 + 是否通关。
 * regionsMap: Map<regionId, number[]>（当前各区域已分配的 cellId）
 */
export function validate(level, regionsMap) {
  const ix = buildIndex(level);
  const constraints = [];

  for (const r of level.regions) {
    for (const c of r.constraints || []) {
      constraints.push({ scope: 'region', regionId: r.id, type: c.type, params: c.params,
        satisfied: evalConstraint(ix, regionsMap, r.id, c) });
    }
  }
  for (const c of level.globalConstraints || []) {
    constraints.push({ scope: 'global', regionId: null, type: c.type, params: c.params,
      satisfied: evalConstraint(ix, regionsMap, null, c) });
  }

  // 硬规则：每个非空区域须为填满矩形（RECT）
  const hard = [];
  if (level.shapeRule === 'RECT' || !level.shapeRule) {
    for (const r of level.regions) {
      const cells = cellsOf(ix, r.id, regionsMap);
      if (cells.length > 0) {
        hard.push({ type: 'RECT', regionId: r.id, ok: isFilledRect(ix, cells) });
      }
    }
  }

  // 覆盖完成度
  const assigned = new Set();
  for (const ids of regionsMap.values()) for (const id of ids) assigned.add(id);
  const complete = level.coverage === 'PARTIAL'
    ? true
    : ix.assignableIds.every((id) => assigned.has(id));

  const allConstraintsOk = constraints.every((c) => c.satisfied);
  const allHardOk = hard.every((h) => h.ok);
  const ok = allConstraintsOk && allHardOk && complete;
  return { ok, complete, constraints, hard };
}

/** 给定一个完整划分，是否满足全部条件 + 硬规则 + 覆盖（求解器内部用） */
function checkSolution(ix, regionsMap) {
  for (const r of ix.level.regions) {
    const cells = cellsOf(ix, r.id, regionsMap);
    if (cells.length === 0) return false;
    if ((ix.level.shapeRule === 'RECT' || !ix.level.shapeRule) && !isFilledRect(ix, cells)) return false;
    for (const c of r.constraints || []) if (!evalConstraint(ix, regionsMap, r.id, c)) return false;
  }
  for (const c of ix.level.globalConstraints || []) if (!evalConstraint(ix, regionsMap, null, c)) return false;
  return true;
}

/** 枚举一个区域所有合法矩形候选（满足 fixedRegion 约束、全为可分配格） */
function rectCandidates(ix, region) {
  const { width: w, height: h } = ix.level.board;
  const fixedMine = [], fixedOthers = [];
  for (const c of ix.level.board.cells) {
    if (c.fixedRegion === region.id) fixedMine.push(c.id);
    else if (c.fixedRegion) fixedOthers.push(c.id);
  }
  const out = [];
  for (let y1 = 0; y1 < h; y1++)
    for (let y2 = y1; y2 < h; y2++)
      for (let x1 = 0; x1 < w; x1++)
        for (let x2 = x1; x2 < w; x2++) {
          const ids = [];
          let valid = true;
          for (let y = y1; y <= y2 && valid; y++)
            for (let x = x1; x <= x2 && valid; x++) {
              const cell = ix.byXY.get(key(x, y));
              if (!cell || cell.assignable === false) valid = false;
              else ids.push(cell.id);
            }
          if (!valid) continue;
          const set = new Set(ids);
          if (!fixedMine.every((id) => set.has(id))) continue;
          if (fixedOthers.some((id) => set.has(id))) continue;
          out.push(ids);
        }
  return out;
}

/**
 * 求解：枚举矩形划分，返回满足全部条件的方案（最多 maxSolutions 个）。
 * 仅支持 shapeRule=RECT（MVP）。
 */
// 只依赖本区域自身格子的条件：可在搜索前逐个候选矩形单独判定
const LOCAL_TYPES = new Set([
  'AREA_EQ', 'AREA_GE', 'AREA_LE', 'MUST_CONTAIN_CELL', 'MUST_NOT_CONTAIN_CELL',
  'MUST_CONTAIN_TAG', 'MUST_NOT_CONTAIN_TAG', 'TAG_COUNT_EQ', 'TAG_COUNT_GE', 'TAG_COUNT_LE',
  'MUST_TOUCH_TAG', 'MUST_NOT_TOUCH_TAG', 'MUST_ON_EDGE', 'MUST_NOT_ON_CORNER', 'NO_TAG_WITHIN', 'SHAPE_LINE', 'SHAPE_SQUARE',
]);

/** 区域的候选矩形，已剔除违反本区域局部条件的（不改变解集，只缩小搜索） */
export function localCandidates(ix, region) {
  const local = (region.constraints || []).filter((c) => LOCAL_TYPES.has(c.type));
  return rectCandidates(ix, region).filter((ids) => {
    const map = new Map([[region.id, ids]]);
    return local.every((c) => evalConstraint(ix, map, region.id, c));
  });
}

export function solve(level, opts = {}) {
  const maxSolutions = opts.maxSolutions ?? 2;
  // maxNodes：搜索步数上限（生成器用来跳过太慢的候选）；超出时返回值带 aborted=true
  const maxNodes = opts.maxNodes ?? Infinity;
  let nodes = 0;
  const ix = buildIndex(level);
  // 候选少的区域先搜，剪枝更早生效
  const regions = level.regions
    .map((r) => ({ r, cands: localCandidates(ix, r) }))
    .sort((a, b) => a.cands.length - b.cands.length);
  const candidates = regions.map((x) => x.cands);
  const maxArea = candidates.map((cs) => cs.reduce((m, ids) => Math.max(m, ids.length), 0));
  const totalAssignable = ix.assignableIds.length;
  const solutions = [];

  const covered = new Set();
  const chosen = new Map();

  function backtrack(i) {
    if (solutions.length >= maxSolutions) return;
    if (++nodes > maxNodes) { solutions.aborted = true; return; }
    if (i === regions.length) {
      if (level.coverage !== 'PARTIAL' && covered.size !== totalAssignable) return;
      if (checkSolution(ix, chosen)) {
        solutions.push(level.regions.map((r) => ({ region: r.id, cells: [...(chosen.get(r.id) || [])].sort((a, b) => a - b) })));
      }
      return;
    }
    // 覆盖剪枝：剩余区域即使都取最大候选也铺不满 → 回退
    if (level.coverage !== 'PARTIAL') {
      let rest = 0;
      for (let j = i; j < regions.length; j++) rest += maxArea[j];
      if (covered.size + rest < totalAssignable) return;
    }
    for (const ids of candidates[i]) {
      if (ids.some((id) => covered.has(id))) continue; // 重叠剪枝
      for (const id of ids) covered.add(id);
      chosen.set(regions[i].r.id, ids);
      backtrack(i + 1);
      chosen.delete(regions[i].r.id);
      for (const id of ids) covered.delete(id);
      if (solutions.length >= maxSolutions) return;
    }
  }
  backtrack(0);
  return solutions;
}

export function isUniqueSolution(level) {
  return solve(level, { maxSolutions: 2 }).length === 1;
}
