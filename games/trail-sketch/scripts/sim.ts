import { GameMap, MH, Pt, SPECIES, W, WeatherKey, dist, generateMap, rng } from '../src/core/map';
import { DEFAULT_RULES, Gear, Rules, canPhotograph, evaluateRoute, photoHits, scoreOf } from '../src/core/rules';

interface Edge {
  to: number;
  base: number;
  rainSave: number;
  water: boolean;
  hitsN: number[];
  hitsB: number[];
}

interface Graph {
  nodes: Pt[];
  adj: Edge[][];
  markNode: Map<number, number>;
}

function buildGraph(m: GameMap, rules: Rules, gear: Gear[], start: Pt): Graph {
  const r = rng(m.seed ^ 0x5eed);
  const nodes: Pt[] = [start];
  const markNode = new Map<number, number>();
  for (const mk of m.marks) {
    markNode.set(mk.id, nodes.length);
    nodes.push([mk.x, mk.y]);
  }
  for (const b of m.bridges) {
    const nx = Math.cos(b.angle + Math.PI / 2) * 12;
    const ny = Math.sin(b.angle + Math.PI / 2) * 12;
    nodes.push([b.x + nx, b.y + ny], [b.x - nx, b.y - ny]);
  }
  for (let i = 0; i < m.river.length; i += 9) {
    const p = m.river[i];
    if (p[0] > 2 && p[0] < W - 2) nodes.push([p[0], p[1]]);
  }
  for (let t = 0, c = 0; t < 4000 && c < 200; t++) {
    const p: Pt = [10 + r() * (W - 20), 10 + r() * (MH - 20)];
    if (nodes.every((q) => dist(p, q) > 30)) {
      nodes.push(p);
      c++;
    }
  }
  const sp = gear.includes('kayak') || gear.includes('boat');
  const set = new Set(gear);
  const adj: Edge[][] = nodes.map(() => []);
  const ctx = { gear: set, weather: 'cloud' as WeatherKey };
  const R = 110;
  for (let a = 0; a < nodes.length; a++)
    for (let b = a + 1; b < nodes.length; b++) {
      if (dist(nodes[a], nodes[b]) > R) continue;
      for (const [s, t] of [
        [a, b],
        [b, a],
      ]) {
        const res = evaluateRoute(m, rules, ctx, [nodes[s], nodes[t]]);
        if (!res.ok) continue;
        const water = res.runs.some((x) => x.mode !== 'walk');
        if (water && !sp) continue;
        const rainSave = res.runs.filter((x) => x.mode === 'kayak' && x.downstream).reduce((s, x) => s + x.cost, 0);
        const animal = (id: number) => m.marks.find((k) => k.id === id)!.kind === 'animal';
        const hitsB = photoHits(m, rules, { gear: set, weather: 'cloud' }, res.samples, res.runs).map((h) => h.id).filter(animal);
        const hitsN = photoHits(m, rules, { gear: set, weather: 'fog' }, res.samples, res.runs).map((h) => h.id).filter(animal);
        adj[s].push({ to: t, base: res.cost, rainSave, water, hitsN, hitsB });
      }
    }
  return { nodes, adj, markNode };
}

function edgeCost(e: Edge, w: WeatherKey) {
  if (e.water && w === 'storm') return Infinity;
  return w === 'rain' ? Math.ceil(e.base - e.rainSave - 1e-9) : e.base;
}

function dijkstra(g: Graph, src: number, w: WeatherKey) {
  const n = g.nodes.length;
  const d = new Float64Array(n).fill(Infinity);
  const prev = new Int32Array(n).fill(-1);
  const pe: (Edge | null)[] = new Array(n).fill(null);
  const done = new Uint8Array(n);
  d[src] = 0;
  for (;;) {
    let u = -1;
    let best = Infinity;
    for (let i = 0; i < n; i++) if (!done[i] && d[i] < best) {
      best = d[i];
      u = i;
    }
    if (u < 0) break;
    done[u] = 1;
    for (const e of g.adj[u]) {
      const c = best + edgeCost(e, w) + 0.01;
      if (c < d[e.to]) {
        d[e.to] = c;
        prev[e.to] = u;
        pe[e.to] = e;
      }
    }
  }
  return { d, prev, pe };
}

function pathTo(prev: Int32Array, pe: (Edge | null)[], t: number) {
  const out: Edge[] = [];
  for (let v = t; prev[v] >= 0; v = prev[v]) out.push(pe[v]!);
  return out.reverse();
}

export interface Outcome {
  species: number;
  success: boolean;
  summit: boolean;
  hutFinish: boolean;
  starved: boolean;
  wastedAp: number;
  missed: string[];
  impossible: boolean;
  score: number;
}

export function playBot(m: GameMap, rules: Rules, gear: Gear[]): Outcome {
  const hut0 = m.marks.find((k) => k.kind === 'hut');
  const start: Pt = hut0 ? [hut0.x + 14, hut0.y + 10] : [400, 280];
  const g = buildGraph(m, rules, gear, start);
  const bino = gear.includes('bino');
  const photos = new Set<string>();
  const shot = new Set<number>();
  const peaksDone = new Set<number>();
  let cur = 0;
  let food = rules.foodMax;
  let water = rules.waterMax - 1;
  let wasted = 0;
  let starved = false;
  const hutNodes = m.marks.filter((k) => k.kind === 'hut').map((k) => g.markNode.get(k.id)!);
  const markById = new Map(m.marks.map((k) => [k.id, k]));

  const reach0 = dijkstra(g, 0, 'cloud');
  const gs = new Set(gear);
  const reachable = new Set(m.marks.filter((k) => k.kind === 'animal' && canPhotograph(gs, k.species!) && reach0.d[g.markNode.get(k.id)!] < Infinity).map((k) => k.species));
  const impossible = reachable.size < rules.targetSpecies;

  const visit = (node: number, e: Edge | null, w: WeatherKey) => {
    if (e) for (const id of bino && w !== 'fog' ? e.hitsB : e.hitsN) {
      const mk = markById.get(id)!;
      shot.add(id);
      photos.add(mk.species!);
    }
    for (const mk of m.marks)
      if (g.markNode.get(mk.id) === node) {
        if (mk.kind === 'peak') peaksDone.add(mk.id);
        if (mk.kind === 'hut') {
          food = rules.foodMax;
          water = rules.waterMax;
        }
      }
  };

  for (let day = 0; day < rules.days; day++) {
    const w = m.weather[day];
    let ap = rules.ap[w];
    const last = day === rules.days - 1;
    let hutVisitedToday = false;
    for (let guard = 0; guard < 30; guard++) {
      const { d, prev, pe } = dijkstra(g, cur, w);
      const budget = ap + water * rules.drinkAp;
      const nearestHut = hutNodes.reduce((b, h) => (d[h] < d[b] ? h : b), hutNodes[0]);
      const mustHut = (food <= 0 && !hutVisitedToday) || (last && d[nearestHut] > 0.5);
      const hitKey = bino && w !== 'fog' ? 'hitsB' : 'hitsN';
      const via = new Map<number, { cost: number; u: number; e: Edge }>();
      for (let u = 0; u < g.nodes.length; u++) {
        if (d[u] === Infinity) continue;
        for (const e of g.adj[u]) {
          const c = d[u] + edgeCost(e, w);
          if (c === Infinity) continue;
          for (const id of e[hitKey]) {
            const mk = markById.get(id)!;
            if (shot.has(id)) continue;
            const v = via.get(id);
            if (!v || c < v.cost) via.set(id, { cost: c, u, e });
          }
        }
      }
      const cands: { node: number; value: number; cost: number; u?: number; e?: Edge }[] = [];
      if (!mustHut || d[nearestHut] === Infinity) {
        for (const [id, v] of via) cands.push({ node: v.e.to, value: photos.has(markById.get(id)!.species!) ? 1 : 6, cost: v.cost, u: v.u, e: v.e });
        for (const mk of m.marks) {
          const node = g.markNode.get(mk.id)!;
          if (node === cur) continue;
          if (mk.kind === 'peak' && !peaksDone.has(mk.id)) cands.push({ node, value: 5, cost: d[node] });
        }
        if (food <= 1) for (const h of hutNodes) if (h !== cur) cands.push({ node: h, value: 12, cost: d[h] });
      }
      let pick: (typeof cands)[number] | null = null;
      let bestScore = 0;
      for (const c of cands) {
        if (c.cost === Infinity) continue;
        if (last) {
          const back = dijkstra(g, c.node, w).d;
          const hb = Math.min(...hutNodes.map((h) => back[h]));
          if (c.cost + hb > budget) continue;
        }
        const sc = c.value / (c.cost + 1);
        if (sc > bestScore) {
          bestScore = sc;
          pick = c;
        }
      }
      if (!pick && (mustHut || last) && d[nearestHut] < Infinity && nearestHut !== cur) pick = { node: nearestHut, value: 0, cost: d[nearestHut] };
      if (!pick) break;
      const path = pick.e ? [...pathTo(prev, pe, pick.u!), pick.e] : pathTo(prev, pe, pick.node);
      let moved = false;
      for (const e of path) {
        const c = edgeCost(e, w);
        while (c > ap && water > 0 && c <= ap + water * rules.drinkAp) {
          water--;
          ap += rules.drinkAp;
        }
        if (c > ap) break;
        ap -= c;
        cur = e.to;
        visit(cur, e, w);
        if (hutNodes.includes(cur)) hutVisitedToday = true;
        moved = true;
      }
      if (!moved) break;
    }
    wasted += ap;
    if (last) break;
    if (food <= 0) {
      starved = true;
      break;
    }
    food--;
  }
  const hutFinish = !starved && hutNodes.includes(cur);
  const score = scoreOf(m, rules, { photos: photos.size, shots: shot.size, peaks: peaksDone.size, hutFinish, starved }).total;
  return {
    score,
    species: photos.size,
    success: photos.size >= rules.targetSpecies && !starved,
    summit: peaksDone.size > 0,
    hutFinish,
    starved,
    wastedAp: wasted / rules.days,
    missed: SPECIES.filter((s) => !photos.has(s.key)).map((s) => s.key),
    impossible,
  };
}

function run(label: string, rules: Rules, gear: Gear[], seeds: number[]) {
  const outs = seeds.map((s) => playBot(generateMap(s, rules.days), rules, gear));
  const pct = (f: (o: Outcome) => boolean) => ((outs.filter(f).length / outs.length) * 100).toFixed(0) + '%';
  const missed: Record<string, number> = {};
  outs.forEach((o) => o.missed.forEach((k) => (missed[k] = (missed[k] ?? 0) + 1)));
  const topMissed = Object.entries(missed)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k, v]) => `${k} ${((v / outs.length) * 100).toFixed(0)}%`)
    .join(', ');
  const avg = (outs.reduce((s, o) => s + o.species, 0) / outs.length).toFixed(2);
  const waste = (outs.reduce((s, o) => s + o.wastedAp, 0) / outs.length).toFixed(1);
  const sc = outs.map((o) => o.score).sort((a, b) => a - b);
  const q = (f: number) => sc[Math.min(sc.length - 1, Math.floor(sc.length * f))];
  const st = rules.stars;
  const starPct = (k: number) => pct((o) => o.score >= st[k]);
  console.log(`| ${label} | ${q(0.25)}/${q(0.5)}/${q(0.9)} | ${starPct(0)}/${starPct(1)}/${starPct(2)} | ${pct((o) => o.success)} | ${avg} | ${pct((o) => o.summit)} | ${pct((o) => o.hutFinish)} | ${pct((o) => o.starved)} | ${waste} | ${pct((o) => o.impossible)} | ${topMissed} |`);
}

const N = +(process.argv[2] ?? 120);
const seeds = Array.from({ length: N }, (_, i) => 1000 + i * 7919);
const which = process.argv[3] ?? 'all';
console.log('| config | 分数 p25/p50/p90 | 1★/2★/3★ | 6种 | 平均种类 | 登顶 | 终点小屋 | 饿死 | 日均浪费AP | 无解图 | 最常缺 |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
const R = DEFAULT_RULES;
const LOW = { sun: 8, cloud: 6, rain: 5, fog: 4, storm: 3 };
const MID = { sun: 9, cloud: 7, rain: 5, fog: 5, storm: 3 };
const KB: Gear[] = ['kayak', 'bino'];
if (which === 'r2') {
  run('A 目标7 默认AP 7天', { ...R, targetSpecies: 7 }, KB, seeds);
  run('B 目标6 低AP 6天', { ...R, ap: LOW, days: 6 }, KB, seeds);
  run('C 目标7 低AP 7天', { ...R, ap: LOW, targetSpecies: 7 }, KB, seeds);
  run('D 目标7 中AP 7天 等高200', { ...R, ap: MID, targetSpecies: 7, contourInterval: 200 }, KB, seeds);
  run('E 目标6 低AP 7天 等高200', { ...R, ap: LOW, contourInterval: 200 }, KB, seeds);
}
if (which === 'r3') {
  const base: Rules = JSON.parse(process.argv[4]);
  const rules = { ...R, ...base };
  for (const g of [['kayak', 'bino'], ['boat', 'bino'], ['kayak', 'boat'], ['bino']] as Gear[][]) run(g.join('+'), rules, g, seeds);
  for (const [d, u] of [[0, 2], [1, 2]]) run(`kayak+bino 顺${d} 逆${u}`, { ...rules, downstream: d, upstream: u }, KB, seeds);
  for (const days of [5, 6, 7, 8]) run(`kayak+bino ${days}天`, { ...rules, days }, KB, seeds);
}
