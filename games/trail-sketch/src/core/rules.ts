import { CH, CW, GameMap, Pt, SPECIES, SpeciesKey, WeatherKey, dist, elevAt, riverDistAt } from './map';

export type Gear = 'kayak' | 'boat' | 'bino';
export type Mode = 'walk' | 'kayak' | 'boat';

export interface Rules {
  contourInterval: number;
  downstream: number;
  upstream: number;
  boat: number;
  kayakCross: number;
  photoRadius: number;
  binoRadius: number;
  visitRadius: number;
  drinkAp: number;
  foodMax: number;
  waterMax: number;
  days: number;
  targetSpecies: number;
  ap: Record<WeatherKey, number>;
  stars: [number, number, number];
}

export const DEFAULT_RULES: Rules = {
  contourInterval: 250,
  downstream: 0.5,
  upstream: 2,
  boat: 1,
  kayakCross: 1,
  photoRadius: 16,
  binoRadius: 32,
  visitRadius: 20,
  drinkAp: 2,
  foodMax: 3,
  waterMax: 3,
  days: 7,
  targetSpecies: 6,
  ap: { sun: 8, cloud: 6, rain: 5, fog: 4, storm: 3 },
  stars: [40, 52, 62],
};

export interface Run {
  mode: Mode;
  from: number;
  to: number;
  cost: number;
  downstream?: boolean;
}

export interface RouteResult {
  ok: boolean;
  err?: string;
  errAt?: number;
  cost: number;
  samples: Pt[];
  costAt: number[];
  runs: Run[];
  hits: { id: number; at: number }[];
  contours: number;
  gridLines: number;
}

const STEP = 1.5;
const RIVER_NEAR = 7;
const KAYAK_MIN_RUN = 20;
const BRIDGE_R = 16;

export function resample(pts: Pt[]): Pt[] {
  if (pts.length === 0) return [];
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = out[out.length - 1];
    const b = pts[i];
    const d = dist(a, b);
    if (d < STEP) continue;
    const n = Math.floor(d / STEP);
    for (let s = 1; s <= n; s++) out.push([a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n]);
  }
  return out;
}

function nearestRiverIndex(m: GameMap, p: Pt, hint = -1, window = 30) {
  let bi = 0;
  let bd = Infinity;
  const lo = hint < 0 ? 0 : Math.max(0, hint - window);
  const hi = hint < 0 ? m.river.length : Math.min(m.river.length, hint + window);
  for (let i = lo; i < hi; i++) {
    const d = dist(p, m.river[i]);
    if (d < bd) {
      bd = d;
      bi = i;
    }
  }
  return bi;
}

function segIntersect(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const r0 = b[0] - a[0];
  const r1 = b[1] - a[1];
  const s0 = d[0] - c[0];
  const s1 = d[1] - c[1];
  const den = r0 * s1 - r1 * s0;
  if (!den) return null;
  const t = ((c[0] - a[0]) * s1 - (c[1] - a[1]) * s0) / den;
  const u = ((c[0] - a[0]) * r1 - (c[1] - a[1]) * r0) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + t * r0, a[1] + t * r1] : null;
}

export interface RouteContext {
  gear: Set<Gear>;
  weather: WeatherKey;
}

export function evaluateRoute(m: GameMap, rules: Rules, ctx: RouteContext, input: Pt[], presampled = false): RouteResult {
  const samples = presampled ? input : resample(input);
  const n = samples.length;
  const res: RouteResult = { ok: true, cost: 0, samples, costAt: new Array(n).fill(0), runs: [], hits: [], contours: 0, gridLines: 0 };
  if (n < 2) return res;
  const water = ctx.weather === 'storm';
  const E = samples.map(([x, y]) => elevAt(m, x, y));
  const DRv = samples.map(([x, y]) => riverDistAt(m, x, y));
  const cls: Mode[] = samples.map((_, i) => (E[i] < m.sea ? 'boat' : 'walk'));

  if (ctx.gear.has('kayak')) {
    let i = 0;
    while (i < n) {
      if (cls[i] === 'walk' && DRv[i] < RIVER_NEAR) {
        let j = i;
        while (j < n && cls[j] === 'walk' && DRv[j] < RIVER_NEAR) j++;
        if ((j - i) * STEP >= KAYAK_MIN_RUN) for (let k = i; k < j; k++) cls[k] = 'kayak';
        i = j;
      } else i++;
    }
  }

  const fail = (err: string, at: number) => {
    res.ok = false;
    res.err = err;
    res.errAt = at;
    return res;
  };

  let start = 0;
  for (let i = 1; i <= n; i++) {
    if (i < n && cls[i] === cls[start]) continue;
    const mode = cls[start];
    const run: Run = { mode, from: start, to: i - 1, cost: 0 };
    if (mode !== 'walk' && water) return fail('雷暴天不能下水', start);
    if (mode === 'boat' && !ctx.gear.has('boat')) return fail('湖面需要小船', start);
    if (mode === 'kayak') {
      const a = nearestRiverIndex(m, samples[start]);
      const b = nearestRiverIndex(m, samples[i - 1]);
      run.downstream = b >= a;
    }
    res.runs.push(run);
    start = i;
  }

  let total = 0;
  let riverHint = -1;
  for (const run of res.runs) {
    for (let i = Math.max(1, run.from); i <= run.to; i++) {
      const p = samples[i - 1];
      const q = samples[i];
      const grid = Math.abs(Math.floor(q[0] / CW) - Math.floor(p[0] / CW)) + Math.abs(Math.floor(q[1] / CH) - Math.floor(p[1] / CH));
      let add = 0;
      if (run.mode === 'walk') {
        const ci = rules.contourInterval;
        const bands = Math.abs(Math.floor((E[i] - m.sea) / ci) - Math.floor((E[i - 1] - m.sea) / ci));
        const onWater = E[i] < m.sea;
        add = (onWater ? 0 : bands) + grid;
        res.contours += onWater ? 0 : bands;
        res.gridLines += grid;
        if ((DRv[i] < RIVER_NEAR || DRv[i - 1] < RIVER_NEAR) && cls[i] === 'walk' && cls[i - 1] === 'walk') {
          riverHint = nearestRiverIndex(m, q, riverHint, riverHint < 0 ? 9999 : 40);
          const lo = Math.max(0, riverHint - 6);
          const hi = Math.min(m.river.length - 1, riverHint + 6);
          for (let k = lo; k < hi; k++) {
            const x = segIntersect(p, q, m.river[k], m.river[k + 1]);
            if (!x) continue;
            if (m.bridges.some((b) => dist(x, [b.x, b.y]) < BRIDGE_R)) break;
            if (ctx.gear.has('kayak') && !water) {
              add += rules.kayakCross;
              break;
            }
            return fail('这里过不了河，找桥或带皮划艇', i);
          }
        }
      } else if (run.mode === 'kayak') {
        const rate = run.downstream ? (ctx.weather === 'rain' ? 0 : rules.downstream) : rules.upstream;
        add = grid * rate;
        res.gridLines += grid;
      } else {
        add = grid * rules.boat;
        res.gridLines += grid;
      }
      run.cost += add;
      total += add;
      res.costAt[i] = Math.ceil(total - 1e-9);
    }
  }
  for (let i = 1; i < n; i++) res.costAt[i] = Math.max(res.costAt[i], res.costAt[i - 1]);
  res.cost = Math.ceil(total - 1e-9);

  res.hits = photoHits(m, rules, ctx, samples, res.runs);
  return res;
}

const SPECIES_BY_KEY = new Map(SPECIES.map((s) => [s.key, s]));

export function photoHits(m: GameMap, rules: Rules, ctx: RouteContext, samples: Pt[], runs: Run[]) {
  const n = samples.length;
  const mode: Mode[] = new Array(n).fill('walk');
  for (const r of runs) for (let i = r.from; i <= r.to; i++) mode[i] = r.mode;
  const bino = ctx.gear.has('bino') && ctx.weather !== 'fog';
  const hits: { id: number; at: number }[] = [];
  for (const mk of m.marks) {
    let r = rules.visitRadius;
    let need: Mode | null = null;
    if (mk.kind === 'animal') {
      const sp = SPECIES_BY_KEY.get(mk.species!)!;
      if (sp.needs === 'bino' && !bino) continue;
      if (sp.needs === 'kayak') need = 'kayak';
      if (sp.needs === 'boat') need = 'boat';
      r = bino ? rules.binoRadius : rules.photoRadius;
    }
    const mp: Pt = [mk.x, mk.y];
    if (n && dist(samples[0], mp) < r) continue;
    for (let i = 0; i < n; i += 2)
      if ((!need || mode[i] === need) && dist(samples[i], mp) < r) {
        hits.push({ id: mk.id, at: i });
        break;
      }
  }
  return hits.sort((a, b) => a.at - b.at);
}

export function canPhotograph(gear: Set<Gear>, key: SpeciesKey) {
  const need = SPECIES_BY_KEY.get(key)!.needs;
  return !need || gear.has(need);
}

export interface Trip {
  day: number;
  ap: number;
  food: number;
  water: number;
  pos: Pt;
  gear: Set<Gear>;
  photos: Set<SpeciesKey>;
  shots: Set<number>;
  summited: Set<number>;
  history: { day: number; samples: Pt[]; runs: Run[] }[];
  over: boolean;
  result?: 'done' | 'starved';
}

export function newTrip(m: GameMap, rules: Rules, gear: Gear[]): Trip {
  const hut = m.marks.find((k) => k.kind === 'hut');
  const pos: Pt = hut ? [hut.x + 14, hut.y + 10] : [400, 280];
  return {
    day: 0,
    ap: rules.ap[m.weather[0]],
    food: rules.foodMax,
    water: rules.waterMax - 1,
    pos,
    gear: new Set(gear),
    photos: new Set(),
    shots: new Set(),
    summited: new Set(),
    history: [],
    over: false,
  };
}

export function drink(trip: Trip, rules: Rules) {
  if (trip.water < 1) return false;
  trip.water--;
  trip.ap += rules.drinkAp;
  return true;
}

export function applyRoute(m: GameMap, rules: Rules, trip: Trip, r: RouteResult) {
  if (!r.ok || r.cost > trip.ap || r.samples.length < 2) return false;
  trip.ap -= r.cost;
  trip.pos = r.samples[r.samples.length - 1];
  for (const h of r.hits) {
    const mk = m.marks[m.marks.findIndex((k) => k.id === h.id)];
    if (mk.kind === 'animal' && mk.species) {
      trip.photos.add(mk.species);
      trip.shots.add(mk.id);
    }
    if (mk.kind === 'peak') trip.summited.add(mk.id);
    if (mk.kind === 'hut') {
      trip.food = rules.foodMax;
      trip.water = rules.waterMax;
    }
  }
  trip.history.push({ day: trip.day, samples: r.samples, runs: r.runs });
  return true;
}

export function endDay(m: GameMap, rules: Rules, trip: Trip) {
  if (trip.day >= rules.days - 1) {
    trip.over = true;
    trip.result = 'done';
    return;
  }
  if (trip.food <= 0) {
    trip.over = true;
    trip.result = 'starved';
    return;
  }
  trip.food--;
  trip.day++;
  trip.ap = rules.ap[m.weather[trip.day]];
}

export function atHut(m: GameMap, rules: Rules, trip: Trip) {
  return m.marks.some((k) => k.kind === 'hut' && dist([k.x, k.y], trip.pos) < rules.visitRadius + 8);
}

export const SCORE = { species: 5, extraShot: 1, peak: 4, allPeaks: 3, hutFinish: 5 };

export interface Score {
  species: number;
  extra: number;
  peaks: number;
  allPeaks: number;
  hut: number;
  starvedHalf: boolean;
  total: number;
}

export function scoreOf(m: GameMap, rules: Rules, s: { photos: number; shots: number; peaks: number; hutFinish: boolean; starved: boolean }): Score {
  const peakCount = m.marks.filter((k) => k.kind === 'peak').length;
  const r: Score = {
    species: s.photos * SCORE.species,
    extra: Math.max(0, s.shots - s.photos) * SCORE.extraShot,
    peaks: s.peaks * SCORE.peak,
    allPeaks: peakCount > 0 && s.peaks >= peakCount ? SCORE.allPeaks : 0,
    hut: s.hutFinish ? SCORE.hutFinish : 0,
    starvedHalf: s.starved,
    total: 0,
  };
  const sum = r.species + r.extra + r.peaks + r.allPeaks + r.hut;
  r.total = s.starved ? Math.floor(sum / 2) : sum;
  return r;
}

export function tripScore(m: GameMap, rules: Rules, trip: Trip) {
  return scoreOf(m, rules, {
    photos: trip.photos.size,
    shots: trip.shots.size,
    peaks: trip.summited.size,
    hutFinish: trip.over && trip.result === 'done' && atHut(m, rules, trip),
    starved: trip.result === 'starved',
  });
}

export function starThresholds(rules: Rules): [number, number, number] {
  return rules.stars;
}

export interface Goals {
  species: { have: number; need: number; ok: boolean };
  summit: boolean;
  hutFinish: boolean;
}

export function goals(m: GameMap, rules: Rules, trip: Trip): Goals {
  return {
    species: { have: trip.photos.size, need: rules.targetSpecies, ok: trip.photos.size >= rules.targetSpecies },
    summit: trip.summited.size > 0,
    hutFinish: trip.over && trip.result === 'done' && atHut(m, rules, trip),
  };
}
