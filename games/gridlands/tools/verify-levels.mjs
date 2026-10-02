// 验证 levels/ 下每个关卡：唯一解 + 与内置 solution 一致 + 只靠推理可解（tools/deduce.mjs）。
// 用法：node tools/verify-levels.mjs
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { solve } from '../web/src/core/engine.js';
import { deduce } from './deduce.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const levelsDir = join(root, 'levels');

const sortCells = (sol) =>
  sol.map((r) => ({ region: r.region, cells: [...r.cells].sort((a, b) => a - b) }))
    .sort((a, b) => (a.region < b.region ? -1 : 1));

const eq = (a, b) => JSON.stringify(sortCells(a)) === JSON.stringify(sortCells(b));

let pass = 0, fail = 0;
for (const file of readdirSync(levelsDir).filter((f) => f.endsWith('.json')).sort()) {
  const level = JSON.parse(readFileSync(join(levelsDir, file), 'utf8'));
  const sols = solve(level, { maxSolutions: 3 });
  const unique = sols.length === 1;
  const matches = level.solution ? sols.some((s) => eq(s, level.solution)) : true;
  const d = deduce(level);
  const good = unique && matches && d.solved;
  if (good) pass++; else fail++;
  console.log(`${good ? '✓' : '✗'} ${file.padEnd(10)} solutions=${sols.length} matchesStored=${matches} deducible=${d.solved} rounds=${d.rounds}`);
  if (!d.solved) console.log(`    推理卡住时各区域剩余候选：${JSON.stringify(d.remaining)}`);
  if (!unique && sols.length > 1) {
    console.log(`    多解示例：`);
    sols.slice(0, 2).forEach((s, i) => console.log(`      #${i + 1}`, JSON.stringify(sortCells(s))));
  }
}
console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
