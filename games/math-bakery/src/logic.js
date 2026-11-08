// Pure game logic: question generators, the 24 solver, fractions and the bread-pile layout.
// No DOM here so it can be tested with node --test.

export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const MODE_IDS = ['easy', 'as', 'mul', 't24'];
export const MAX_LEVEL = 9;
export const ROUNDS = 10;

/* ---------- question generators: level 0 (easiest) .. 9 ---------- */

// Single-digit addition only.
export function genEasy(i) {
  let a, b;
  if (i < 2) { a = rnd(1, 4); b = rnd(1, 5 - a); }
  else if (i < 4) { a = rnd(1, 9); b = rnd(1, Math.min(9, 10 - a)); }
  else if (i < 7) { a = rnd(2, 9); b = rnd(Math.max(2, 11 - a), 9); }
  else { a = rnd(1, 9); b = rnd(1, 9); const c = rnd(1, 9); return { t: `${a} + ${b} + ${c}`, ans: a + b + c }; }
  return { t: `${a} + ${b}`, ans: a + b };
}

export function genAS(i) {
  let a, b, c;
  const op = Math.random() < 0.5 ? '+' : '-';
  if (i < 2) { a = rnd(1, 9); b = rnd(1, 9); if (op === '-' && a < b) [a, b] = [b, a]; }
  else if (i < 4) {
    if (op === '+') { a = rnd(3, 9); b = rnd(Math.max(2, 11 - a), 9); }
    else { a = rnd(11, 18); b = rnd(a - 9, 9); }
  } else if (i < 6) {
    if (op === '+') { const ta = rnd(1, 7), tb = rnd(1, 8 - ta), ua = rnd(0, 8), ub = rnd(0, 9 - ua); a = ta * 10 + ua; b = tb * 10 + ub; }
    else { const ta = rnd(3, 9), tb = rnd(1, ta - 1), ua = rnd(1, 9), ub = rnd(0, ua); a = ta * 10 + ua; b = tb * 10 + ub; }
  } else if (i < 8) {
    if (op === '+') { const ua = rnd(2, 9), ub = rnd(Math.max(1, 10 - ua), 9), ta = rnd(1, 7), tb = rnd(1, 8 - ta); a = ta * 10 + ua; b = tb * 10 + ub; }
    else { const ua = rnd(0, 8), ub = rnd(ua + 1, 9), ta = rnd(3, 9), tb = rnd(1, ta - 1); a = ta * 10 + ua; b = tb * 10 + ub; }
  } else {
    a = rnd(21, 79); b = rnd(12, 49); c = rnd(12, Math.min(89, a + b - 1));
    if (Math.random() < 0.5) return { t: `${a} + ${b} − ${c}`, ans: a + b - c };
    a = rnd(40, 89); b = rnd(12, a - 5); c = rnd(12, 49);
    return { t: `${a} − ${b} + ${c}`, ans: a - b + c };
  }
  return { t: `${a} ${op === '+' ? '+' : '−'} ${b}`, ans: op === '+' ? a + b : a - b };
}

export function genMul(i) {
  let a, b;
  if (i < 3) { a = pick([2, 3, 5]); b = rnd(1, 9); }
  else if (i < 6) { a = rnd(2, 9); b = rnd(2, 9); }
  else if (i < 8) { a = rnd(6, 9); b = rnd(6, 9); }
  else { a = rnd(12, 25); b = rnd(3, 9); }
  if (Math.random() < 0.5 && i < 8) [a, b] = [b, a];
  return { t: `${a} × ${b}`, ans: a * b };
}

export const GENERATORS = { easy: genEasy, as: genAS, mul: genMul };

export function genUnique(gen, lvl, seen) {
  let q, t = 0;
  do { q = gen(lvl); t++; } while (seen.has(q.t) && t < 30);
  seen.add(q.t);
  return q;
}

// Correct answers raise the level; a single miss keeps it; each miss after the first in a row lowers it.
export function nextLevel(lvl, correct, wrongRun) {
  if (correct) return Math.min(MAX_LEVEL, lvl + 1);
  if (wrongRun >= 2) return Math.max(0, lvl - 1);
  return lvl;
}

/* ---------- 24 ---------- */

export function solve(nums) {
  let count = 0, sol = null;
  (function rec(it) {
    if (it.length === 1) {
      if (Math.abs(it[0].v - 24) < 1e-6) { count++; if (!sol) sol = it[0].e.replace(/^\((.*)\)$/, '$1'); }
      return;
    }
    for (let i = 0; i < it.length; i++) for (let j = i + 1; j < it.length; j++) {
      const a = it[i], b = it[j], rest = it.filter((_, k) => k !== i && k !== j);
      const cand = [[a.v + b.v, `(${a.e} + ${b.e})`], [a.v * b.v, `(${a.e} × ${b.e})`], [a.v - b.v, `(${a.e} − ${b.e})`], [b.v - a.v, `(${b.e} − ${a.e})`]];
      if (b.v) cand.push([a.v / b.v, `(${a.e} ÷ ${b.e})`]);
      if (a.v) cand.push([b.v / a.v, `(${b.e} ÷ ${a.e})`]);
      for (const [v, e] of cand) rec(rest.concat([{ v, e }]));
    }
  })(nums.map((n) => ({ v: n, e: String(n) })));
  return { count, sol };
}

export function make24Pools() {
  function pool(max, n) {
    const res = [], seen = new Set();
    for (let t = 0; t < n; t++) {
      const s = [rnd(1, max), rnd(1, max), rnd(1, max), rnd(1, max)].sort((a, b) => a - b), k = s.join(',');
      if (seen.has(k)) continue;
      seen.add(k);
      const r = solve(s);
      if (r.count) res.push({ nums: s, count: r.count, sol: r.sol });
    }
    // More solutions = easier, so the easy end comes first.
    return res.sort((a, b) => b.count - a.count);
  }
  return { easy: pool(9, 260), hard: pool(13, 200) };
}

export function pick24(pools, i, used) {
  const src = i < 8 ? pools.easy : pools.hard;
  let idx = i < 8 ? Math.floor((i / 7) * (src.length - 1) * 0.8) : Math.floor(src.length * (0.7 + Math.random() * 0.29));
  idx = Math.min(src.length - 1, Math.max(0, idx + rnd(-3, 3)));
  let n = 0;
  while (used.has(src[idx].nums.join()) && n++ < src.length) idx = (idx + 1) % src.length;
  used.add(src[idx].nums.join());
  const q = src[idx];
  return { nums: q.nums.slice().sort(() => Math.random() - 0.5), sol: q.sol };
}

/* ---------- fractions (24 intermediate results) ---------- */

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
export function F(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
}
export function fop(a, b, o) {
  if (o === '+') return F(a.n * b.d + b.n * a.d, a.d * b.d);
  if (o === '-') return F(a.n * b.d - b.n * a.d, a.d * b.d);
  if (o === '*') return F(a.n * b.n, a.d * b.d);
  if (b.n === 0) return null;
  return F(a.n * b.d, a.d * b.n);
}
export const fstr = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);

/* ---------- breads ---------- */

// Longer streaks bake fancier bread: 0 bun, 1 toast, 2 croissant, 3 baguette, 4 melon bun, 5 gratin.
export function tierOf(combo) {
  return combo >= 10 ? 5 : combo >= 7 ? 4 : combo >= 5 ? 3 : combo >= 3 ? 2 : rnd(0, 1);
}

// Pyramid layout: `base` breads on the bottom row, one fewer on each row above.
export function pilePos(k, base, w) {
  const h = (w * 40) / 60;
  let r = 0, j = k;
  while (r < base && j >= base - r) { j -= base - r; r++; }
  if (r >= base) { r = base - 1; j = 0; }
  const cap = Math.max(1, base - r);
  return { x: (j - (cap - 1) / 2) * w * 0.9, y: r * h * 0.6, row: r };
}

export function score(combo, fast) {
  return Math.round(100 * (1 + 0.2 * (combo - 1))) + (fast ? 50 : 0);
}
