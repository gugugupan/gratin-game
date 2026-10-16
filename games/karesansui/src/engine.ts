export type Side = 'N' | 'E' | 'S' | 'W';
export type Cell = readonly [number, number];

export interface Gate {
  cell: Cell;
  side: Side;
}

export interface GardenMap {
  cols: number;
  rows: number;
  rocks: Cell[];
  entry: Gate | null;
  exit: Gate | null;
}

export const OPP: Record<Side, Side> = { N: 'S', S: 'N', E: 'W', W: 'E' };
export const DELTA: Record<Side, Cell> = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const SIDES: Side[] = ['N', 'E', 'S', 'W'];

export function sideTo(p: Cell, q: Cell): Side {
  const dx = q[0] - p[0];
  const dy = q[1] - p[1];
  return dx === 1 ? 'E' : dx === -1 ? 'W' : dy === 1 ? 'S' : 'N';
}

export const sameCell = (a: Cell | undefined, b: Cell | undefined) =>
  !!a && !!b && a[0] === b[0] && a[1] === b[1];

export function isRock(map: GardenMap, c: Cell) {
  return map.rocks.some((r) => sameCell(r, c));
}

export function inGrid(map: GardenMap, c: Cell) {
  return c[0] >= 0 && c[1] >= 0 && c[0] < map.cols && c[1] < map.rows;
}

export type PassKind = 'half' | 'straight' | 'turn';

/** Pivot corners: 0 = NW, 1 = NE, 2 = SE, 3 = SW (u,v in cell-local 0..1). */
export const PIVOTS: Cell[] = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

export interface Pass {
  c: number;
  r: number;
  a: Side;
  b: Side | null;
  kind: PassKind;
  /** 2 = N-S lines, 3 = E-W lines, 4..7 = arcs around pivot 0..3. */
  code: number;
  pivot: number;
}

export function makePass(c: number, r: number, a: Side, b: Side | null): Pass {
  if (!b) {
    return { c, r, a, b, kind: 'half', code: a === 'N' || a === 'S' ? 2 : 3, pivot: -1 };
  }
  if (OPP[a] === b) {
    return { c, r, a, b, kind: 'straight', code: a === 'N' || a === 'S' ? 2 : 3, pivot: -1 };
  }
  const has = (s: Side) => a === s || b === s;
  const pivot = has('N') ? (has('W') ? 0 : 1) : has('E') ? 2 : 3;
  return { c, r, a, b, kind: 'turn', code: 4 + pivot, pivot };
}

export function covers(p: Pass, u: number, v: number): boolean {
  if (p.kind === 'straight') return true;
  if (p.kind === 'half') {
    return p.a === 'W' ? u <= 0.5 : p.a === 'E' ? u >= 0.5 : p.a === 'N' ? v <= 0.5 : v >= 0.5;
  }
  const [pu, pv] = PIVOTS[p.pivot];
  return Math.hypot(u - pu, v - pv) <= 1;
}

/**
 * Passes for a raked path. `finished` closes the last cell through the exit side;
 * without an entry gate (free mode) the first cell is treated as raked straight through.
 */
export function passesOf(map: GardenMap, path: Cell[], finished: boolean): Pass[] {
  const out: Pass[] = [];
  const n = path.length;
  for (let k = 0; k < n; k++) {
    const p = path[k];
    let b: Side | null = k < n - 1 ? sideTo(p, path[k + 1]) : finished && map.exit ? map.exit.side : null;
    let a: Side | null = k > 0 ? sideTo(p, path[k - 1]) : map.entry ? map.entry.side : b ? OPP[b] : null;
    if (!a) continue;
    if (b === a) b = null;
    out.push(makePass(p[0], p[1], a, b));
  }
  return out;
}

export function openSides(map: GardenMap, c: Cell): Side[] {
  return SIDES.filter((d) => {
    if (map.entry && sameCell(map.entry.cell, c) && map.entry.side === d) return true;
    if (map.exit && sameCell(map.exit.cell, c) && map.exit.side === d) return true;
    const q: Cell = [c[0] + DELTA[d][0], c[1] + DELTA[d][1]];
    return inGrid(map, q) && !isRock(map, q);
  });
}

/**
 * Cells that can only be raked around one corner (two perpendicular open sides) get a
 * rounded moss corner instead of sand outside the rake's sweep; returns the pivot or -1.
 */
export function roundPivots(map: GardenMap): Int8Array {
  const out = new Int8Array(map.cols * map.rows).fill(-1);
  for (let r = 0; r < map.rows; r++)
    for (let c = 0; c < map.cols; c++) {
      if (isRock(map, [c, r])) continue;
      const o = openSides(map, [c, r]);
      if (o.length === 2 && OPP[o[0]] !== o[1]) out[r * map.cols + c] = makePass(c, r, o[0], o[1]).pivot;
    }
  return out;
}

export function isDeadEnd(map: GardenMap) {
  for (let r = 0; r < map.rows; r++)
    for (let c = 0; c < map.cols; c++) if (!isRock(map, [c, r]) && openSides(map, [c, r]).length < 2) return true;
  return false;
}

export const NS = 12;

/** Per-sample code of the last pass covering it (0 = untouched messy sand), rocks = -1. */
export function sampleCodes(map: GardenMap, passes: Pass[]): Int8Array {
  const m = new Int8Array(map.cols * map.rows * NS * NS);
  for (const rk of map.rocks) m.fill(-1, (rk[1] * map.cols + rk[0]) * NS * NS, (rk[1] * map.cols + rk[0] + 1) * NS * NS);
  const round = roundPivots(map);
  round.forEach((pv, idx) => {
    if (pv < 0) return;
    const [pu, pw] = PIVOTS[pv];
    for (let j = 0; j < NS; j++)
      for (let i = 0; i < NS; i++)
        if (Math.hypot((i + 0.5) / NS - pu, (j + 0.5) / NS - pw) > 1) m[idx * NS * NS + j * NS + i] = -1;
  });
  for (const p of passes) {
    const base = (p.r * map.cols + p.c) * NS * NS;
    for (let j = 0; j < NS; j++)
      for (let i = 0; i < NS; i++) if (covers(p, (i + 0.5) / NS, (j + 0.5) / NS)) m[base + j * NS + i] = p.code;
  }
  return m;
}

export interface Score {
  clean: number;
  match: number;
}

export function score(cur: Int8Array, target: Int8Array | null): Score {
  let tot = 0;
  let clean = 0;
  let match = 0;
  for (let i = 0; i < cur.length; i++) {
    if (cur[i] < 0) continue;
    tot++;
    if (cur[i] > 0) clean++;
    if (target && cur[i] === target[i]) match++;
  }
  return { clean: tot ? clean / tot : 0, match: tot && target ? match / tot : 0 };
}

const cellClean = (bits: number, round = false) =>
  (bits & 1) !== 0 || (round ? bits > 1 : ((bits & 2) && (bits & 8)) || ((bits & 4) && (bits & 16))) ? true : false;
const passBit = (a: Side, b: Side) => {
  const p = makePass(0, 0, a, b);
  return p.kind === 'straight' ? 1 : 2 << p.pivot;
};

/**
 * Beam search for a short raking walk from the entry gate to the exit gate that leaves
 * no messy sand. A cell is clean once it was raked straight through, or turned in around
 * two opposite corners (each turn misses the far side of the cell from its pivot).
 */
export function solve(map: GardenMap, beam = 2500): Cell[] | null {
  if (!map.entry || !map.exit) return null;
  const { cols, rows } = map;
  const nCells = cols * rows;
  const rock = new Uint8Array(nCells);
  for (const r of map.rocks) rock[r[1] * cols + r[0]] = 1;
  const need = nCells - map.rocks.length;
  const round = roundPivots(map);
  const ok = (i: number, bits: number) => cellClean(bits, round[i] >= 0);
  const exitIdx = map.exit.cell[1] * cols + map.exit.cell[0];
  const exitSide = map.exit.side;
  interface St {
    pos: number;
    a: Side;
    cells: Uint8Array;
    clean: number;
    path: number[];
  }
  const start = map.entry.cell[1] * cols + map.entry.cell[0];
  let layer: St[] = [{ pos: start, a: map.entry.side, cells: new Uint8Array(nCells), clean: 0, path: [start] }];
  const maxSteps = need * 3;
  for (let step = 1; step <= maxSteps && layer.length; step++) {
    let best: St | null = null;
    for (const s of layer) {
      if (s.pos !== exitIdx) continue;
      const bits = s.cells[s.pos] | passBit(s.a, exitSide);
      const clean = s.clean + (ok(s.pos, bits) && !ok(s.pos, s.cells[s.pos]) ? 1 : 0);
      if (clean === need) {
        best = s;
        break;
      }
    }
    if (best) return best.path.map((i) => [i % cols, Math.floor(i / cols)] as Cell);
    const next = new Map<string, St>();
    for (const s of layer) {
      const x = s.pos % cols;
      const y = Math.floor(s.pos / cols);
      for (const d of SIDES) {
        if (d === s.a) continue;
        const nx = x + DELTA[d][0];
        const ny = y + DELTA[d][1];
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const ni = ny * cols + nx;
        if (rock[ni]) continue;
        const before = s.cells[s.pos];
        const after = before | passBit(s.a, d);
        let cells = s.cells;
        let clean = s.clean;
        if (after !== before) {
          cells = s.cells.slice();
          cells[s.pos] = after;
          if (ok(s.pos, after) && !ok(s.pos, before)) clean++;
        }
        const a = OPP[d];
        const key = ni + a + cells.join('');
        if (next.has(key)) continue;
        next.set(key, { pos: ni, a, cells, clean, path: [...s.path, ni] });
      }
    }
    const all = [...next.values()];
    const ex = map.exit.cell;
    const rank = (s: St) => {
      let partial = 0;
      for (let i = 0; i < nCells; i++) if (s.cells[i] && !ok(i, s.cells[i])) partial++;
      const dist = Math.abs((s.pos % cols) - ex[0]) + Math.abs(Math.floor(s.pos / cols) - ex[1]);
      return s.clean * 10 + partial * 3 - (s.clean === need ? dist * 4 : dist * 0.3);
    };
    const scored = all.map((s) => ({ s, k: rank(s) }));
    scored.sort((p, q) => q.k - p.k);
    layer = scored.slice(0, beam).map((o) => o.s);
  }
  return null;
}

export function rng(seed: number) {
  let s = (seed >>> 0) % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function connected(map: GardenMap) {
  const seen = new Set<string>();
  const free: Cell[] = [];
  for (let r = 0; r < map.rows; r++) for (let c = 0; c < map.cols; c++) if (!isRock(map, [c, r])) free.push([c, r]);
  const stack: Cell[] = [free[0]];
  seen.add(free[0] + '');
  while (stack.length) {
    const p = stack.pop()!;
    for (const d of SIDES) {
      const q: Cell = [p[0] + DELTA[d][0], p[1] + DELTA[d][1]];
      if (inGrid(map, q) && !isRock(map, q) && !seen.has(q + '')) {
        seen.add(q + '');
        stack.push(q);
      }
    }
  }
  return seen.size === free.length;
}

function edgeGates(map: GardenMap): Gate[] {
  const g: Gate[] = [];
  for (let c = 0; c < map.cols; c++) {
    g.push({ cell: [c, 0], side: 'N' });
    g.push({ cell: [c, map.rows - 1], side: 'S' });
  }
  for (let r = 0; r < map.rows; r++) {
    g.push({ cell: [0, r], side: 'W' });
    g.push({ cell: [map.cols - 1, r], side: 'E' });
  }
  return g.filter((x) => !isRock(map, x.cell) && x.side !== 'N');
}

export interface RandomGarden {
  map: GardenMap;
  solution: Cell[];
  seed: number;
}

export const SIZES = {
  small: { cols: 5, rows: 4, rocks: [1, 2] },
  medium: { cols: 6, rows: 5, rocks: [2, 3] },
  large: { cols: 7, rows: 5, rocks: [2, 4] },
} as const;
export type SizeKey = keyof typeof SIZES;

export function randomGarden(size: SizeKey, seed: number): RandomGarden {
  const spec = SIZES[size];
  for (let attempt = 0; attempt < 40; attempt++) {
    const r = rng(seed * 7919 + attempt * 104729 + 17);
    const map: GardenMap = { cols: spec.cols, rows: spec.rows, rocks: [], entry: null, exit: null };
    const nRocks = spec.rocks[0] + Math.floor(r() * (spec.rocks[1] - spec.rocks[0] + 1));
    let guard = 0;
    while (map.rocks.length < nRocks && guard++ < 200) {
      const c: Cell = [1 + Math.floor(r() * (spec.cols - 2)), Math.floor(r() * spec.rows)];
      const near = map.rocks.some((k) => Math.abs(k[0] - c[0]) <= 1 && Math.abs(k[1] - c[1]) <= 1);
      if (!near) map.rocks.push(c);
    }
    if (!connected(map)) continue;
    const gates = edgeGates(map);
    const west = gates.filter((g) => g.side === 'W' || g.side === 'S');
    const entry = west[Math.floor(r() * west.length)];
    const far = gates.filter(
      (g) => Math.abs(g.cell[0] - entry.cell[0]) + Math.abs(g.cell[1] - entry.cell[1]) >= Math.floor((spec.cols + spec.rows) / 2),
    );
    if (!far.length) continue;
    const exit = far[Math.floor(r() * far.length)];
    map.entry = entry;
    map.exit = exit;
    if (isDeadEnd(map)) continue;
    const solution = solve(map, 1500);
    if (solution) return { map, solution, seed };
  }
  throw new Error('no solvable garden for seed ' + seed);
}

export function stars(steps: number, par: number) {
  return steps <= par ? 3 : steps <= par + 2 ? 2 : 1;
}
