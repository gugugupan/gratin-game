// 「无猜测」检查：只用排除推理（不试错、不回溯）能否把每个区域缩到唯一矩形。
// 推理规则（玩家可以凭肉眼做到的三类）：
//   1. 单区域：违反本区域局部条件的矩形排除
//   2. 两两相容：某矩形与另一区域的所有剩余矩形都冲突（重叠，或违反两区域之间的条件）→ 排除
//   3. 覆盖：某格只有一个区域还能盖到 → 该区域必须含它；某区域所有剩余矩形都含某格 → 其他区域不能含它
import { buildIndex, evalConstraint, localCandidates, validate } from '../web/src/core/engine.js';

const PAIR_REGION = new Set(['MUST_TOUCH_REGION', 'MUST_NOT_TOUCH_REGION']);
const PAIR_GLOBAL = new Set(['AREA_LARGER_THAN', 'AREA_EQUAL_TO', 'DIRECTION_OF']);
const ONLY_ONE = new Set(['ONLY_ONE_CONTAINS', 'ONLY_ONE_TOUCHES']);

export function deduce(level) {
  const ix = buildIndex(level);
  const cand = new Map(level.regions.map((r) => [r.id, localCandidates(ix, r)]));
  const overlap = (a, b) => a.some((x) => b.includes(x));

  const pairOk = (ra, a, rb, b) => {
    if (overlap(a, b)) return false;
    const map = new Map([[ra, a], [rb, b]]);
    for (const [rid, other] of [[ra, rb], [rb, ra]]) {
      const reg = level.regions.find((r) => r.id === rid);
      for (const c of reg.constraints || []) {
        if (PAIR_REGION.has(c.type) && c.params.region === other && !evalConstraint(ix, map, rid, c)) return false;
        // 面积最大/最小 = 与每个其他区域两两比较
        if (c.type === 'AREA_MAX' && !(map.get(rid).length > map.get(other).length)) return false;
        if (c.type === 'AREA_MIN' && !(map.get(rid).length < map.get(other).length)) return false;
      }
    }
    for (const c of level.globalConstraints || []) {
      const pair = [c.params?.a, c.params?.b];
      if (PAIR_GLOBAL.has(c.type) && pair.includes(ra) && pair.includes(rb) && !evalConstraint(ix, map, null, c)) return false;
      if (ONLY_ONE.has(c.type)) {
        // 「只有一家」：任意两家不能同时满足；只有两家时还必须恰好一家满足
        const has = (rid) => c.type === 'ONLY_ONE_CONTAINS'
          ? map.get(rid).some((id) => (ix.byId.get(id).tags || []).includes(c.params.tag))
          : evalConstraint(ix, map, rid, { type: 'MUST_TOUCH_TAG', params: { tag: c.params.tag } });
        const n = [ra, rb].filter(has).length;
        if (n > 1 || (level.regions.length === 2 && n !== 1)) return false;
      }
    }
    return true;
  };

  let rounds = 0;
  for (let changed = true; changed && rounds < 100; rounds++) {
    changed = false;
    const prune = (rid, keep) => {
      if (keep.length < cand.get(rid).length) { cand.set(rid, keep); changed = true; }
    };
    for (const [ra, ca] of cand) {
      prune(ra, ca.filter((a) => [...cand].every(([rb, cb]) => rb === ra || cb.some((b) => pairOk(ra, a, rb, b)))));
    }
    for (const cid of ix.assignableIds) {
      const owners = [...cand].filter(([, cs]) => cs.some((ids) => ids.includes(cid)));
      if (owners.length === 1 && level.coverage !== 'PARTIAL') {
        const [rid, cs] = owners[0];
        prune(rid, cs.filter((ids) => ids.includes(cid)));
      }
      for (const [rid, cs] of cand) {
        if (!cs.length || !cs.every((ids) => ids.includes(cid))) continue;
        for (const [other, cs2] of cand) if (other !== rid) prune(other, cs2.filter((ids) => !ids.includes(cid)));
      }
    }
  }

  const unique = [...cand.values()].every((cs) => cs.length === 1);
  const solution = unique ? level.regions.map((r) => ({ region: r.id, cells: [...cand.get(r.id)[0]].sort((a, b) => a - b) })) : null;
  const solved = !!solution && validate(level, new Map(solution.map((s) => [s.region, s.cells]))).ok;
  return { solved, rounds, solution, remaining: Object.fromEntries([...cand].map(([k, v]) => [k, v.length])) };
}
