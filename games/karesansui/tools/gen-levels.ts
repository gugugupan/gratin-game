// Regenerates src/levels.json: teaching levels first, then hand-made and generated ones by solution length, each with
// the solver's raking path stored so targets stay fixed even if the solver changes.
// Usage: npx tsx tools/gen-levels.ts
import fs from 'node:fs';
import path from 'node:path';
import { randomGarden, solve, type Cell, type GardenMap, type Gate, type SizeKey } from '../src/engine';

interface Out {
  id: string;
  map: GardenMap;
  solution: Cell[];
}

const map = (cols: number, rows: number, rocks: Cell[], entry: Gate, exit: Gate): GardenMap => ({ cols, rows, rocks, entry, exit });

/** Teaching levels, in order: straight, U-turn round the moss corners, patching a corner, a stone, a double turn. */
const TUTORIAL: GardenMap[] = [
  map(5, 1, [], { cell: [0, 0], side: 'W' }, { cell: [4, 0], side: 'E' }),
  map(5, 2, [], { cell: [0, 1], side: 'W' }, { cell: [0, 0], side: 'W' }),
  map(3, 3, [], { cell: [0, 2], side: 'W' }, { cell: [2, 0], side: 'E' }),
  map(4, 3, [[1, 1]], { cell: [0, 2], side: 'W' }, { cell: [3, 0], side: 'E' }),
  map(4, 3, [[2, 1]], { cell: [0, 2], side: 'W' }, { cell: [3, 2], side: 'E' }),
];

/** Earlier hand-made levels, kept in the pool. */
const CLASSIC: GardenMap[] = [
  map(4, 3, [], { cell: [0, 2], side: 'W' }, { cell: [3, 0], side: 'E' }),
  map(5, 4, [[2, 1]], { cell: [0, 3], side: 'W' }, { cell: [4, 0], side: 'E' }),
  map(7, 5, [[1, 1], [5, 3]], { cell: [0, 4], side: 'W' }, { cell: [6, 1], side: 'E' }),
];

const POOL: [SizeKey, number][] = [
  ['small', 4],
  ['medium', 4],
  ['large', 4],
];
const TOTAL = 20;

const tutorial = TUTORIAL.map((m) => ({ map: m, solution: solve(m)! }));
const pool = CLASSIC.map((m) => ({ map: m, solution: solve(m)! }));
const seen = new Set([...tutorial, ...pool].map((l) => JSON.stringify(l.map)));
let seed = 1000;
for (const [size, count] of POOL) {
  for (let k = 0; k < count; ) {
    const g = randomGarden(size, seed++);
    const free = g.map.cols * g.map.rows - g.map.rocks.length;
    const ratio = g.solution.length / free;
    const key = JSON.stringify(g.map);
    if (seen.has(key) || ratio < 1.3 || ratio > 2.3) continue;
    seen.add(key);
    pool.push({ map: g.map, solution: g.solution });
    k++;
  }
}
pool.sort((a, b) => a.solution.length - b.solution.length);
const levels: Out[] = [...tutorial, ...pool].slice(0, TOTAL).map((l, i) => ({ id: `l${i + 1}`, ...l }));
for (const l of levels) console.log(l.id, `${l.map.cols}x${l.map.rows}`, 'rocks', l.map.rocks.length, 'steps', l.solution.length);

const out = path.join(import.meta.dirname, '../src/levels.json');
fs.writeFileSync(out, JSON.stringify(levels) + '\n');
console.log('wrote', out, levels.length);
