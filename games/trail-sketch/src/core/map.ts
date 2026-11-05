export const W = 800;
export const MH = 560;
export const G = 4;
export const NX = W / G + 1;
export const NY = MH / G + 1;
export const GX = 5;
export const GY = 4;
export const CW = W / GX;
export const CH = MH / GY;

export type Pt = [number, number];

export type SpeciesKey = 'fish' | 'otter' | 'heron' | 'deer' | 'rabbit' | 'bear' | 'butterfly';

export interface Species {
  key: SpeciesKey;
  name: string;
  habitat: string;
  color: string;
  needs?: 'kayak' | 'boat' | 'bino';
  fits: (elev: number, riverDist: number) => boolean;
}

export const SPECIES: Species[] = [
  { key: 'fish', name: '湖鱼', habitat: '湖心', color: '#2E7D8C', needs: 'boat', fits: (e) => e < -12 },
  { key: 'otter', name: '水獭', habitat: '河道', color: '#1F6F8B', needs: 'kayak', fits: (e, d) => d < 9 && e > 0 },
  { key: 'heron', name: '苍鹭', habitat: '湖岸', color: '#4A6FA5', fits: (e, d) => e > 0 && e < 60 && d > 25 },
  { key: 'deer', name: '梅花鹿', habitat: '低林', color: '#8A5A2B', fits: (e, d) => e > 60 && e < 500 && d > 14 },
  { key: 'rabbit', name: '野兔', habitat: '草地', color: '#B86E1F', fits: (e, d) => e > 120 && e < 750 && d > 14 },
  { key: 'bear', name: '黑熊', habitat: '深林', color: '#4B3A2A', needs: 'bino', fits: (e, d) => e > 350 && e < 1100 && d > 40 },
  { key: 'butterfly', name: '凤蝶', habitat: '高草甸', color: '#B8487A', fits: (e) => e > 650 && e < 1500 },
];

export type WeatherKey = 'sun' | 'cloud' | 'rain' | 'fog' | 'storm';

export interface Weather {
  key: WeatherKey;
  name: string;
  ap: number;
  effect?: string;
}

export const WEATHER: Record<WeatherKey, Weather> = {
  sun: { key: 'sun', name: '晴', ap: 10 },
  cloud: { key: 'cloud', name: '多云', ap: 8 },
  rain: { key: 'rain', name: '雨', ap: 6, effect: '顺流免费' },
  fog: { key: 'fog', name: '雾', ap: 6, effect: '望远镜无效' },
  storm: { key: 'storm', name: '雷暴', ap: 4, effect: '不能下水' },
};

export type MarkKind = 'animal' | 'peak' | 'hut';

export interface Mark {
  id: number;
  kind: MarkKind;
  x: number;
  y: number;
  species?: SpeciesKey;
  elev?: number;
}

export interface Bridge {
  x: number;
  y: number;
  angle: number;
}

export interface GameMap {
  seed: number;
  Z: Float32Array;
  DR: Float32Array;
  sea: number;
  river: Pt[];
  bridges: Bridge[];
  marks: Mark[];
  trees: Pt[];
  weather: WeatherKey[];
  lat: number;
  lng: number;
  names: { river: string; lake: string; peak: string };
}

export function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bilinear(A: Float32Array, x: number, y: number) {
  const fx = Math.max(0, Math.min(W - 0.01, x)) / G;
  const fy = Math.max(0, Math.min(MH - 0.01, y)) / G;
  const i = fx | 0;
  const j = fy | 0;
  const u = fx - i;
  const v = fy - j;
  const a = A[j * NX + i];
  const b = A[j * NX + i + 1];
  const c = A[(j + 1) * NX + i];
  const d = A[(j + 1) * NX + i + 1];
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export const elevAt = (m: GameMap, x: number, y: number) => bilinear(m.Z, x, y);
export const riverDistAt = (m: GameMap, x: number, y: number) => bilinear(m.DR, x, y);
export const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

const RIVER_NAMES = ['白溪河', '鹿角川', '青石溪', '松涛河'];
const LAKE_NAMES = ['苍鹭湖', '镜月湖', '雾池', '星见湖'];
const PEAK_NAMES = ['雾隐岭', '云岩台', '鹰嘴峰', '白桦岳'];
const WEATHER_BAG: WeatherKey[] = ['sun', 'sun', 'sun', 'cloud', 'cloud', 'cloud', 'rain', 'rain', 'fog', 'storm'];

export function generateMap(seed: number, days = 7): GameMap {
  const r = rng(seed);
  const perm: number[] = [];
  for (let i = 0; i < 512; i++) perm[i] = r();
  const hash = (x: number, y: number) => perm[((x * 73856093) ^ (y * 19349663)) & 511];
  const vn = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = xf * xf * (3 - 2 * xf);
    const v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };

  const ox = r() * 100;
  const oy = r() * 100;
  const Z = new Float32Array(NX * NY);
  const DR = new Float32Array(NX * NY);
  let mn = Infinity;
  let mx = -Infinity;
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const x = i / 50 + ox;
      const y = j / 50 + oy;
      let s = 0;
      let a = 1;
      let f = 1;
      for (let o = 0; o < 5; o++) {
        s += a * vn(x * f, y * f);
        a *= 0.5;
        f *= 2;
      }
      s = s * 0.7 + (1 - Math.abs(vn(x * 0.7 + 9, y * 0.7 + 9) * 2 - 1)) * 0.5;
      Z[j * NX + i] = s;
      mn = Math.min(mn, s);
      mx = Math.max(mx, s);
    }
  for (let k = 0; k < Z.length; k++) Z[k] = 200 + Math.pow(Math.max(0, (Z[k] - mn) / (mx - mn)), 1.4) * 2600;

  const river: Pt[] = [];
  {
    let x = -8;
    let y = MH * (0.3 + r() * 0.4);
    let ang = (r() - 0.5) * 0.5;
    let da = 0;
    while (x < W + 8 && river.length < 900) {
      da += (r() - 0.5) * 0.09;
      da *= 0.92;
      ang += da;
      ang *= 0.985;
      if (y < 90) ang += 0.1;
      if (y > MH - 90) ang -= 0.1;
      ang = Math.max(-1.1, Math.min(1.1, ang));
      x += Math.cos(ang) * 4;
      y += Math.sin(ang) * 4;
      y = Math.max(20, Math.min(MH - 20, y));
      river.push([x, y]);
    }
  }
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      let m = Infinity;
      const px = i * G;
      const py = j * G;
      for (let k = 0; k < river.length; k += 2) {
        const d = (river[k][0] - px) ** 2 + (river[k][1] - py) ** 2;
        if (d < m) m = d;
      }
      m = Math.sqrt(m);
      DR[j * NX + i] = m;
      Z[j * NX + i] = Math.max(200, Z[j * NX + i] - 380 * Math.exp(-((m / 60) ** 2)));
    }
  const sorted = Array.from(Z)
    .filter((_, k) => DR[k] > 40)
    .sort((a, b) => a - b);
  const sea = sorted[Math.floor(sorted.length * 0.07)];

  const map: GameMap = {
    seed,
    Z,
    DR,
    sea,
    river,
    bridges: [],
    marks: [],
    trees: [],
    weather: [],
    lat: 35.2 + r() * 1.5,
    lng: 137.4 + r() * 1.2,
    names: {
      river: RIVER_NAMES[Math.floor(r() * RIVER_NAMES.length)],
      lake: LAKE_NAMES[Math.floor(r() * LAKE_NAMES.length)],
      peak: PEAK_NAMES[Math.floor(r() * PEAK_NAMES.length)],
    },
  };
  const E = (x: number, y: number) => elevAt(map, x, y);
  const D = (x: number, y: number) => riverDistAt(map, x, y);
  const marks = map.marks;
  const far = (x: number, y: number, d: number) => marks.every((m) => Math.hypot(m.x - x, m.y - y) > d);
  let id = 0;

  const peaks: Mark[] = [];
  for (let j = 5; j < NY - 5; j += 2)
    for (let i = 5; i < NX - 5; i += 2) {
      const e = Z[j * NX + i];
      if (e < 1400) continue;
      let top = true;
      for (let dj = -10; dj <= 10 && top; dj++)
        for (let di = -10; di <= 10; di++) {
          const ii = i + di;
          const jj = j + dj;
          if (ii >= 0 && jj >= 0 && ii < NX && jj < NY && Z[jj * NX + ii] > e) {
            top = false;
            break;
          }
        }
      if (top) peaks.push({ id: 0, kind: 'peak', x: i * G, y: j * G, elev: e });
    }
  peaks
    .sort((a, b) => (b.elev ?? 0) - (a.elev ?? 0))
    .slice(0, 3)
    .forEach((p) => marks.push({ ...p, id: id++ }));

  for (const f of [0.14, 0.38, 0.62, 0.86]) {
    let k = Math.max(2, Math.floor(river.length * f));
    for (let t = 0; t < 40 && E(...river[k]) < sea + 8; t++) k = Math.min(river.length - 3, k + 3);
    const a = river[k - 2];
    const b = river[k + 2];
    const [x, y] = river[k];
    if (x > 15 && x < W - 15 && E(x, y) >= sea) map.bridges.push({ x, y, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) });
  }

  for (const [c0, c1] of [
    [0, 1],
    [2, 2],
    [3, 4],
  ]) {
    for (let t = 0; t < 800; t++) {
      const x = (c0 + r() * (c1 - c0 + 1)) * CW;
      const y = 25 + r() * (MH - 50);
      const e = E(x, y) - sea;
      if (x > 20 && x < W - 20 && e > 30 && e < 450 && D(x, y) > 28 && far(x, y, 50)) {
        marks.push({ id: id++, kind: 'hut', x, y });
        break;
      }
    }
  }

  const count: Record<string, number> = {};
  SPECIES.forEach((s) => (count[s.key] = 0));
  for (let cy = 0; cy < GY; cy++)
    for (let cx = 0; cx < GX; cx++) {
      const want = 1 + (r() < 0.6 ? 1 : 0);
      let placed = 0;
      for (let t = 0; t < 260 && placed < want; t++) {
        let x = cx * CW + 14 + r() * (CW - 28);
        let y = cy * CH + 14 + r() * (CH - 28);
        if (r() < 0.35 && D(x, y) < 60) {
          let best = river[0];
          let bd = Infinity;
          for (const p of river) {
            const d = Math.hypot(p[0] - x, p[1] - y);
            if (d < bd) {
              bd = d;
              best = p;
            }
          }
          [x, y] = best;
        }
        if (x < 14 || x > W - 14 || y < 14 || y > MH - 14) continue;
        if (!far(x, y, 40)) continue;
        const e = E(x, y) - sea;
        const d = D(x, y);
        const fits = SPECIES.filter((s) => s.fits(e, d));
        if (!fits.length) continue;
        fits.sort((a, b) => count[a.key] - count[b.key] || r() - 0.5);
        count[fits[0].key]++;
        marks.push({ id: id++, kind: 'animal', x, y, species: fits[0].key });
        placed++;
      }
    }

  for (const sp of SPECIES) {
    for (let t = 0; t < 4000 && count[sp.key] < 2; t++) {
      const x = 16 + r() * (W - 32);
      const y = 16 + r() * (MH - 32);
      if (!far(x, y, 34) || !sp.fits(elevAt(map, x, y) - sea, D(x, y))) continue;
      count[sp.key]++;
      marks.push({ id: id++, kind: 'animal', x, y, species: sp.key });
    }
  }

  for (let t = 0; t < 3600; t++) {
    const x = r() * W;
    const y = r() * MH;
    const e = E(x, y) - sea;
    if (e > 60 && e < 1100 && D(x, y) > 12 && vn(x / 40 + 50, y / 40 + 50) > 0.56) map.trees.push([x, y]);
  }
  for (let d = 0; d < days; d++) map.weather.push(WEATHER_BAG[Math.floor(r() * WEATHER_BAG.length)]);
  return map;
}

export const huts = (m: GameMap) => m.marks.filter((k) => k.kind === 'hut');
