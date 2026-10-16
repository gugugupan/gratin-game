// Regenerates src/levels.json: the hand-made opening levels plus generated ones, each with
// the solver's raking path stored so targets stay fixed even if the solver changes.
// Usage: npx tsx tools/gen-levels.ts
import fs from 'node:fs';
import path from 'node:path';
import { randomGarden, solve, type Cell, type GardenMap, type SizeKey } from '../src/engine';

interface Out {
  id: string;
  map: GardenMap;
  solution: Cell[];
}

const HANDMADE: { id: string; map: GardenMap }[] = [
  { id: 'g1', map: { cols: 4, rows: 3, rocks: [], entry: { cell: [0, 2], side: 'W' }, exit: { cell: [3, 0], side: 'E' } } },
  { id: 'g2', map: { cols: 5, rows: 4, rocks: [[2, 1]], entry: { cell: [0, 3], side: 'W' }, exit: { cell: [4, 0], side: 'E' } } },
  {
    id: 'g3',
    map: {
      cols: 7,
      rows: 5,
      rocks: [
        [1, 1],
        [5, 3],
      ],
      entry: { cell: [0, 4], side: 'W' },
      exit: { cell: [6, 1], side: 'E' },
    },
  },
];

const PLAN: SizeKey[] = [
  ...Array<SizeKey>(5).fill('small'),
  ...Array<SizeKey>(6).fill('medium'),
  ...Array<SizeKey>(6).fill('large'),
];

const levels: Out[] = HANDMADE.map((h) => ({ ...h, solution: solve(h.map)! }));
const seen = new Set(levels.map((l) => JSON.stringify(l.map)));
let seed = 1000;
for (const size of PLAN) {
  for (;;) {
    const g = randomGarden(size, seed++);
    const free = g.map.cols * g.map.rows - g.map.rocks.length;
    const ratio = g.solution.length / free;
    const key = JSON.stringify(g.map);
    if (seen.has(key) || ratio < 1.3 || ratio > 2.3) continue;
    seen.add(key);
    levels.push({ id: `g${levels.length + 1}`, map: g.map, solution: g.solution });
    console.log(levels.length, size, `${g.map.cols}x${g.map.rows}`, 'rocks', g.map.rocks.length, 'steps', g.solution.length);
    break;
  }
}

const out = path.join(import.meta.dirname, '../src/levels.json');
fs.writeFileSync(out, JSON.stringify(levels) + '\n');
console.log('wrote', out, levels.length);
