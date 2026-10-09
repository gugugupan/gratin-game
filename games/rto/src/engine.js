const ND = 5;

function cnt(row, v) { let n = 0; for (const c of row) if (c === v) n++; return n; }

export function evalC(c, g) {
  if (c.days) {
    const rs = c.days.map(d => evalC({ ...c, days: undefined, d }, g));
    return rs.includes('bad') ? 'bad' : rs.every(r => r === 'ok') ? 'ok' : 'pending';
  }
  switch (c.t) {
    case 'quota': {
      const r = g[c.p], on = cnt(r, 1), unk = cnt(r, null);
      if (on > c.n || on + unk < c.n) return 'bad';
      return unk === 0 ? 'ok' : 'pending';
    }
    case 'lock': return evalC({ t: 'fixed', p: c.p, d: c.d, v: 0 }, g);
    case 'fixed': {
      const v = g[c.p][c.d];
      if (v === null) return 'pending';
      return v === c.v ? 'ok' : 'bad';
    }
    case 'cap': case 'min': case 'exact': {
      let on = 0, unk = 0;
      for (const r of g) { if (r[c.d] === 1) on++; else if (r[c.d] === null) unk++; }
      const lo = c.t === 'cap' ? 0 : c.n, hi = c.t === 'min' ? Infinity : c.n;
      if (on > hi || on + unk < lo) return 'bad';
      return on >= lo && on + unk <= hi ? 'ok' : 'pending';
    }
    case 'with': {
      let sure = true;
      for (let d = 0; d < ND; d++) {
        const a = g[c.a][d], b = g[c.b][d];
        if (a === 1 && b === 0) return 'bad';
        if (!(a === 0 || b === 1)) sure = false;
      }
      return sure ? 'ok' : 'pending';
    }
    case 'apart': {
      let sure = true;
      for (let d = 0; d < ND; d++) {
        const a = g[c.a][d], b = g[c.b][d];
        if (a === 1 && b === 1) return 'bad';
        if (!(a === 0 || b === 0)) sure = false;
      }
      return sure ? 'ok' : 'pending';
    }
    case 'overlap': {
      let sure = 0, poss = 0;
      for (let d = 0; d < ND; d++) {
        const a = g[c.a][d], b = g[c.b][d];
        if (a === 1 && b === 1) sure++;
        if (a !== 0 && b !== 0) poss++;
      }
      if (sure > c.n || poss < c.n) return 'bad';
      return sure === c.n && poss === c.n ? 'ok' : 'pending';
    }
    case 'consec': {
      const r = g[c.p];
      let first = -1, last = -1;
      for (let d = 0; d < ND; d++) if (r[d] === 1) { if (first < 0) first = d; last = d; }
      for (let d = first + 1; d < last; d++) if (r[d] === 0) return 'bad';
      return cnt(r, null) === 0 ? 'ok' : 'pending';
    }
    case 'maxrun': {
      const r = g[c.p];
      let run = 0;
      for (let d = 0; d < ND; d++) { run = r[d] === 1 ? run + 1 : 0; if (run > c.n) return 'bad'; }
      return cnt(r, null) === 0 ? 'ok' : 'pending';
    }
    case 'noconsec': {
      const r = g[c.p];
      let sure = true;
      for (let d = 0; d < ND - 1; d++) {
        if (r[d] === 1 && r[d + 1] === 1) return 'bad';
        if (!(r[d] === 0 || r[d + 1] === 0)) sure = false;
      }
      return sure ? 'ok' : 'pending';
    }
  }
  throw new Error('unknown ' + c.t);
}

export function resolve(L, c) {
  const ix = id => typeof id === 'number' ? id : L.people.findIndex(p => p.id === id);
  const o = { ...c };
  for (const k of ['p', 'a', 'b']) if (k in o) o[k] = ix(o[k]);
  return o;
}

export function allConstraints(L) {
  const qs = L.people.map((p, i) => ({ t: 'quota', p: i, n: p.quota ?? L.quota }));
  const own = L.people.flatMap(p => [
    ...(p.locks?.length ? [{ t: 'lock', p: p.id, days: p.locks }] : []),
    ...(p.rules || []).map(c => ({ ...(c.b !== undefined ? { a: p.id } : { p: p.id }), ...c })),
  ]);
  return qs.concat(L.rules, own).map(c => resolve(L, c));
}

function combos(n) {
  const out = [];
  for (let m = 0; m < 32; m++) {
    let k = 0; for (let d = 0; d < 5; d++) if (m >> d & 1) k++;
    if (k === n) out.push(Array.from({ length: 5 }, (_, d) => (m >> d & 1) ? 1 : 0));
  }
  return out;
}

export function solve(L, limit = 3) {
  const cs = allConstraints(L);
  const P = L.people.length, sols = [];
  const g = Array.from({ length: P }, () => Array(ND).fill(null));
  const opts = L.people.map(p => combos(p.quota ?? L.quota));
  (function rec(i) {
    if (sols.length >= limit) return;
    if (i === P) { sols.push(g.map(r => r.slice())); return; }
    for (const r of opts[i]) {
      g[i] = r.slice();
      if (cs.every(c => evalC(c, g) !== 'bad')) rec(i + 1);
    }
    g[i] = Array(ND).fill(null);
  })(0);
  return sols;
}
