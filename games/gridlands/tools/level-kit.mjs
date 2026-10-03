// 手写关卡用的小工具：ASCII 地图 → 关卡 JSON（solution 由求解器算出，不唯一就报错）
// 地图记号：. 平原  A 耕地  F 森林  L 湖  M 山  G 金矿  I 铁矿  B 建筑  ~ 海（该格不存在）
// 记号后跟数字表示开局插旗、锁定给第 N 个区域，例如 .2 = 属于 R2 的平原营地
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { solve } from '../web/src/core/engine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const L = (zh, en) => ({ zh, en });
export const C = (type, params) => (params ? { type, params } : { type });

const TAG = { '.': 'plain', A: 'farmland', F: 'forest', L: 'lake', M: 'mountain', G: 'gold', I: 'iron', B: 'building' };
const BG = { plain: '#cdebc0', forest: '#2e7d32', gold: '#ffd54f', iron: '#90a4ae', mountain: '#8d6e63', lake: '#4fc3f7', farmland: '#f4ecd4', building: '#cfd5dd' };

function board(map, blocked) {
  const rows = map.trim().split('\n').map((r) => r.trim().split(/\s+/));
  const width = rows[0].length;
  const cells = rows.flatMap((row, y) => row.flatMap((tok, x) => {
    if (tok === '~') return [];
    const tag = TAG[tok[0]];
    if (!tag) throw new Error(`unknown map token ${tok}`);
    const flag = tok.slice(1);
    return [{ id: y * width + x + 1, x, y, tags: [tag], assignable: !blocked.includes(tok[0]), fixedRegion: flag ? `R${flag}` : null, display: { bg: BG[tag], sprite: null } }];
  }));
  return { width, height: rows.length, cells };
}

export function level({ file, map, blocked = '', createdAt, ...rest }) {
  const lv = {
    schemaVersion: 1, shapeRule: 'RECT', adjacency: 4, coverage: 'FULL',
    meta: { author: 'manual', verifiedUnique: true, verifiedHumanSolvable: true, createdAt },
    ...rest, board: board(map, blocked), globalConstraints: rest.globalConstraints || [],
  };
  const sols = solve(lv, { maxSolutions: 2 });
  if (sols.length !== 1) throw new Error(`${lv.id}: ${sols.length} solutions`);
  lv.solution = sols[0];
  writeFileSync(join(root, 'levels', file), JSON.stringify(lv, null, 2) + '\n');
  console.log(`wrote ${file}`);
}
