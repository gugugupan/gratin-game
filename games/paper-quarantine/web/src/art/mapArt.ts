import * as THREE from "three";
import { CITY_COUNT, EDGES } from "../../../engine/map.js";
import { CITY_NAMES, STRAIN_COLORS } from "../data";
import { rand } from "../util";
import { kraftCanvas } from "./paper";

export const MAP_SCALE = 1.8;
export const SHEET_W = 46;
export const SHEET_H = 38;
export const SHEET_SCALE = SHEET_W / 28;
export const DISTRICT_R = 2.0;
const PX = 64;
const CELL = 0.25;
const COAST = 0.42;

const LOCAL: [number, number][] = [[3, 0], [5.6, -0.34], [5.6, 0.34], [8, -0.3], [8, 0.3], [10.2, 0]];
const DIRS = [210, 90, 330].map((d) => (d * Math.PI) / 180);
const CENTER_Y = 2.2 * MAP_SCALE;

export const POS2D: [number, number][] = Array.from({ length: CITY_COUNT }, (_, i) => {
  const [r, phi] = LOCAL[i % 6];
  const a = DIRS[Math.floor(i / 6)] + phi;
  return [r * MAP_SCALE * Math.cos(a), r * MAP_SCALE * Math.sin(a) - CENTER_Y];
});

export function cityWorld(i: number, out = new THREE.Vector3()): THREE.Vector3 {
  return out.set(POS2D[i][0], 0, -POS2D[i][1]);
}

type Pt = [number, number];
type EdgeKind = "road" | "rail" | "sea";
function edgeKind(a: number, b: number): EdgeKind {
  if (Math.floor(a / 6) === Math.floor(b / 6)) return "road";
  return a % 6 === 0 ? "rail" : "sea";
}

function segDist([px, py]: Pt, [ax, ay]: Pt, [bx, by]: Pt): number {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

function valueNoise(seed: number): (x: number, y: number) => number {
  const r = rand(seed);
  const N = 64;
  const grid = Float32Array.from({ length: N * N }, () => r());
  const at = (i: number, j: number) => grid[(((j % N) + N) % N) * N + (((i % N) + N) % N)];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const one = (x: number, y: number) => {
    const i = Math.floor(x), j = Math.floor(y);
    const u = smooth(x - i), v = smooth(y - j);
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * u;
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * u;
    return a + (b - a) * v;
  };
  return (x, y) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let o = 0; o < 4; o++) {
      sum += one(x * f + o * 17.3, y * f - o * 9.1) * amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum / 0.9375;
  };
}

class Field {
  readonly nx = Math.ceil(SHEET_W / CELL) + 1;
  readonly ny = Math.ceil(SHEET_H / CELL) + 1;
  readonly v: Float32Array;

  constructor(f: (p: Pt) => number) {
    this.v = new Float32Array(this.nx * this.ny);
    for (let j = 0; j < this.ny; j++) for (let i = 0; i < this.nx; i++) this.v[j * this.nx + i] = f(this.world(i, j));
  }

  world(i: number, j: number): Pt {
    return [i * CELL - SHEET_W / 2, SHEET_H / 2 - j * CELL];
  }

  sample([x, y]: Pt): number {
    const fi = (x + SHEET_W / 2) / CELL, fj = (SHEET_H / 2 - y) / CELL;
    const i = Math.max(0, Math.min(this.nx - 2, Math.floor(fi))), j = Math.max(0, Math.min(this.ny - 2, Math.floor(fj)));
    const u = fi - i, w = fj - j, at = (a: number, b: number) => this.v[b * this.nx + a];
    const top = at(i, j) + (at(i + 1, j) - at(i, j)) * u;
    const bot = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * u;
    return top + (bot - top) * w;
  }

  contour(g: CanvasRenderingContext2D, thr: number, toPx: (p: Pt) => Pt): void {
    const { nx, v } = this;
    g.beginPath();
    for (let j = 0; j < this.ny - 1; j++) {
      for (let i = 0; i < nx - 1; i++) {
        const a = v[j * nx + i], b = v[j * nx + i + 1], c = v[(j + 1) * nx + i + 1], d = v[(j + 1) * nx + i];
        const k = (a > thr ? 8 : 0) | (b > thr ? 4 : 0) | (c > thr ? 2 : 0) | (d > thr ? 1 : 0);
        if (k === 0 || k === 15) continue;
        const lerp = (p: number, q: number) => (thr - p) / (q - p);
        const T: Pt = [i + lerp(a, b), j], R: Pt = [i + 1, j + lerp(b, c)], B: Pt = [i + lerp(d, c), j + 1], L: Pt = [i, j + lerp(a, d)];
        const segs: [Pt, Pt][] = ({
          1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[T, R]], 5: [[L, T], [B, R]], 6: [[T, B]], 7: [[L, T]],
          8: [[L, T]], 9: [[T, B]], 10: [[T, R], [L, B]], 11: [[T, R]], 12: [[L, R]], 13: [[B, R]], 14: [[L, B]],
        } as Record<number, [Pt, Pt][]>)[k];
        for (const [p, q] of segs) {
          const P = toPx(this.world(p[0], p[1])), Q = toPx(this.world(q[0], q[1]));
          g.moveTo(P[0], P[1]);
          g.lineTo(Q[0], Q[1]);
        }
      }
    }
    g.stroke();
  }
}

export interface MapCanvases {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  mask: HTMLCanvasElement;
}

const toPx = ([x, y]: Pt): Pt => [(x + SHEET_W / 2) * PX, (SHEET_H / 2 - y) * PX];

export function drawMap(): MapCanvases {
  const w = SHEET_W * PX, h = SHEET_H * PX;
  const r = rand(99);
  const noise = valueNoise(7);
  const lumps = valueNoise(23);

  const links = EDGES.filter(([a, b]) => edgeKind(a, b) !== "sea").map(([a, b]): [Pt, Pt] => [POS2D[a], POS2D[b]]);
  const land = new Field((p) => {
    let best = 0;
    for (const [a, b] of links) best = Math.max(best, Math.exp(-((segDist(p, a, b) / 4.6) ** 2)));
    for (const c of POS2D) best = Math.max(best, Math.exp(-((Math.hypot(p[0] - c[0], p[1] - c[1]) / 5.2) ** 2)));
    const edge = Math.min(p[0] + SHEET_W / 2, SHEET_W / 2 - p[0], p[1] + SHEET_H / 2, SHEET_H / 2 - p[1]);
    const coarse = noise(p[0] * 0.16 + 40, p[1] * 0.16 + 40) - 0.5;
    const fine = noise(p[0] * 0.55 - 12, p[1] * 0.55 + 7) - 0.5;
    const isles = Math.max(0, lumps(p[0] * 0.3 + 5, p[1] * 0.3 - 3) - 0.68) * 2.6;
    return best + coarse * 0.62 + fine * 0.2 + isles - Math.max(0, 2.5 - edge) * 0.3;
  });

  const outline: Pt[] = [[14, 14]];
  const step = 22;
  for (let x = 14; x <= w - 14; x += step) outline.push([x, 10 + r() * 14]);
  for (let y = 14; y <= h - 14; y += step) outline.push([w - 10 - r() * 14, y]);
  for (let x = w - 14; x >= 14; x -= step) outline.push([x, h - 10 - r() * 14]);
  for (let y = h - 14; y >= 14; y -= step) outline.push([10 + r() * 14, y]);
  const trace = (ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    outline.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };
  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mg = mask.getContext("2d")!;
  mg.fillStyle = "#000";
  mg.fillRect(0, 0, w, h);
  mg.fillStyle = "#fff";
  trace(mg);
  mg.fill();

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  trace(g);
  g.save();
  g.clip();
  const paper = kraftCanvas(w, h, "#c69c6d", 7, 2.6);
  g.drawImage(paper, 0, 0);
  g.fillStyle = "rgba(76, 138, 156, 0.42)";
  g.fillRect(0, 0, w, h);
  drawWaves(g, land, r);

  g.lineCap = "round";
  g.lineJoin = "round";
  [[0.14, 1.4, 0.22], [0.09, 1.8, 0.32], [0.045, 2.4, 0.45]].forEach(([d, lw, a]) => {
    g.strokeStyle = `rgba(30, 62, 74, ${a})`;
    g.lineWidth = lw;
    land.contour(g, COAST - d, toPx);
  });

  g.drawImage(landLayer(paper, land), 0, 0);
  g.strokeStyle = "rgba(52, 34, 20, 0.85)";
  g.lineWidth = 3.2;
  land.contour(g, COAST, toPx);

  const nearRoad = (p: Pt) => Math.min(...links.map(([a, b]) => segDist(p, a, b)));
  const nearCity = (p: Pt) => Math.min(...POS2D.map((q) => Math.hypot(p[0] - q[0], p[1] - q[1])));
  drawBorders(g, land);
  drawRivers(g, land, r, nearCity);
  drawRelief(g, land, lumps, r, nearRoad, nearCity);
  drawRegionNames(g, r);
  drawLinks(g, r);
  drawDistricts(g, r);
  drawFurniture(g, w, h);
  g.restore();

  return { front: c, back: drawMapBack(w, h), mask };
}

function landLayer(paper: HTMLCanvasElement, land: Field): HTMLCanvasElement {
  const w = paper.width, h = paper.height;
  const lo = document.createElement("canvas");
  lo.width = land.nx;
  lo.height = land.ny;
  const lg = lo.getContext("2d")!;
  const img = lg.createImageData(land.nx, land.ny);
  for (let k = 0; k < land.v.length; k++) {
    img.data[k * 4 + 3] = Math.max(0, Math.min(255, ((land.v[k] - COAST) / 0.03 + 0.5) * 255));
  }
  lg.putImageData(img, 0, 0);
  const layer = document.createElement("canvas");
  layer.width = w;
  layer.height = h;
  const g = layer.getContext("2d")!;
  g.drawImage(paper, 0, 0);
  const r = rand(5);
  DIRS.forEach((d, i) => {
    const [cx, cy] = toPx([Math.cos(d) * 10 * MAP_SCALE * 0.66, Math.sin(d) * 10 * MAP_SCALE * 0.66 - CENTER_Y]);
    for (let k = 0; k < 9; k++) {
      const ox = cx + (r() - 0.5) * PX * 9, oy = cy + (r() - 0.5) * PX * 9, rad = PX * (5 + r() * 4);
      const grad = g.createRadialGradient(ox, oy, 0, ox, oy, rad);
      grad.addColorStop(0, STRAIN_COLORS[i] + "22");
      grad.addColorStop(1, STRAIN_COLORS[i] + "00");
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }
  });
  g.globalCompositeOperation = "destination-in";
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(lo, -PX * CELL * 0.5, -PX * CELL * 0.5, land.nx * CELL * PX, land.ny * CELL * PX);
  return layer;
}

function drawWaves(g: CanvasRenderingContext2D, land: Field, r: () => number): void {
  g.strokeStyle = "rgba(34, 66, 78, 0.35)";
  g.lineWidth = 2;
  for (let k = 0; k < 260; k++) {
    const p: Pt = [(r() - 0.5) * SHEET_W, (r() - 0.5) * SHEET_H];
    if (land.sample(p) > COAST - 0.18) continue;
    const [x, y] = toPx(p);
    const s = PX * (0.18 + r() * 0.12);
    g.beginPath();
    g.moveTo(x - s * 2, y);
    g.quadraticCurveTo(x - s, y - s * 0.8, x, y);
    g.quadraticCurveTo(x + s, y + s * 0.8, x + s * 2, y);
    g.stroke();
  }
}

function drawBorders(g: CanvasRenderingContext2D, land: Field): void {
  const region = (p: Pt) => {
    let best = 0, bd = Infinity;
    POS2D.forEach((q, i) => {
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d < bd) { bd = d; best = Math.floor(i / 6); }
    });
    return best;
  };
  g.fillStyle = "rgba(52, 34, 20, 0.55)";
  const step = 0.3;
  for (let y = -SHEET_H / 2; y < SHEET_H / 2; y += step) {
    for (let x = -SHEET_W / 2; x < SHEET_W / 2; x += step) {
      const p: Pt = [x, y];
      if (land.sample(p) < COAST + 0.02) continue;
      const here = region(p);
      if (region([x + step, y]) !== here || region([x, y + step]) !== here) {
        const [px, py] = toPx(p);
        g.beginPath();
        g.arc(px, py, 2.6, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
}

function drawRivers(g: CanvasRenderingContext2D, land: Field, r: () => number, nearCity: (p: Pt) => number): void {
  let made = 0;
  for (let tries = 0; tries < 400 && made < 7; tries++) {
    let p: Pt = [(r() - 0.5) * SHEET_W, (r() - 0.5) * SHEET_H];
    if (land.sample(p) < COAST + 0.32 || nearCity(p) < DISTRICT_R + 0.6) continue;
    const pts: Pt[] = [p];
    let heading = r() * Math.PI * 2;
    for (let k = 0; k < 160 && land.sample(p) > COAST - 0.02; k++) {
      const e = 0.2;
      const gx = land.sample([p[0] + e, p[1]]) - land.sample([p[0] - e, p[1]]);
      const gy = land.sample([p[0], p[1] + e]) - land.sample([p[0], p[1] - e]);
      const down = Math.atan2(-gy, -gx);
      let diff = down - heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      heading += diff * 0.35 + (r() - 0.5) * 0.5;
      p = [p[0] + Math.cos(heading) * 0.22, p[1] + Math.sin(heading) * 0.22];
      if (nearCity(p) < DISTRICT_R) heading += Math.PI * 0.5;
      pts.push(p);
    }
    if (pts.length < 18 || land.sample(p) > COAST) continue;
    made++;
    for (let k = 1; k < pts.length; k++) {
      const [ax, ay] = toPx(pts[k - 1]), [bx, by] = toPx(pts[k]);
      g.strokeStyle = "rgba(40, 84, 104, 0.8)";
      g.lineWidth = 1.5 + (k / pts.length) * 4.5;
      g.beginPath();
      g.moveTo(ax, ay);
      g.lineTo(bx, by);
      g.stroke();
    }
  }
}

function drawRelief(g: CanvasRenderingContext2D, land: Field, lumps: (x: number, y: number) => number, r: () => number, nearRoad: (p: Pt) => number, nearCity: (p: Pt) => number): void {
  const spots: { p: Pt; kind: "peak" | "tree"; s: number }[] = [];
  for (let k = 0; k < 1500; k++) {
    const p: Pt = [(r() - 0.5) * SHEET_W, (r() - 0.5) * SHEET_H];
    if (land.sample(p) < COAST + 0.08 || nearCity(p) < DISTRICT_R + 0.4 || nearRoad(p) < 0.7) continue;
    const l = lumps(p[0] * 0.2, p[1] * 0.2);
    if (l > 0.64) spots.push({ p, kind: "peak", s: 0.26 + (l - 0.64) * 1.4 + r() * 0.12 });
    else if (l < 0.34 && r() < 0.45) spots.push({ p, kind: "tree", s: 0.16 + r() * 0.07 });
  }
  spots.sort((a, b) => b.p[1] - a.p[1]);
  for (const { p, kind, s } of spots) {
    const [x, y] = toPx(p);
    const S = s * PX;
    if (kind === "peak") {
      const tip: Pt = [x - S * 0.15, y - S * 1.15];
      g.fillStyle = "rgba(120, 82, 48, 0.28)";
      g.beginPath();
      g.moveTo(tip[0], tip[1]);
      g.lineTo(x + S, y);
      g.lineTo(x + S * 0.05, y);
      g.closePath();
      g.fill();
      g.strokeStyle = "rgba(52, 34, 20, 0.8)";
      g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(x - S, y);
      g.quadraticCurveTo(x - S * 0.55, y - S * 0.5, tip[0], tip[1]);
      g.quadraticCurveTo(x + S * 0.45, y - S * 0.55, x + S, y);
      g.stroke();
      g.lineWidth = 1.2;
      for (let k = 1; k <= 3; k++) {
        const t = k / 4;
        g.beginPath();
        g.moveTo(tip[0] + (x + S - tip[0]) * t * 0.85, tip[1] + (y - tip[1]) * t * 0.85);
        g.lineTo(tip[0] + (x + S - tip[0]) * t * 0.5, y - S * 0.08);
        g.stroke();
      }
    } else {
      g.fillStyle = "rgba(78, 96, 52, 0.55)";
      g.strokeStyle = "rgba(46, 52, 26, 0.6)";
      g.lineWidth = 1.4;
      g.beginPath();
      g.arc(x, y - S, S, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y - S * 0.2);
      g.stroke();
    }
  }
}

function drawRegionNames(g: CanvasRenderingContext2D, r: () => number): void {
  DIRS.forEach((d, i) => {
    const [cx, cy] = toPx([Math.cos(d) * 7.4 * MAP_SCALE, Math.sin(d) * 7.4 * MAP_SCALE - CENTER_Y]);
    g.save();
    g.translate(cx + Math.sin(d) * PX * 2.6, cy + Math.cos(d) * PX * 2.6);
    g.rotate((r() - 0.5) * 0.2);
    g.font = `${PX * 2.6}px "ZCOOL XiaoWei", serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = STRAIN_COLORS[i] + "38";
    g.fillText(["赤域", "苍域", "金域"][i], 0, 0);
    g.restore();
  });
}

function drawLinks(g: CanvasRenderingContext2D, r: () => number): void {
  const bowed = (a: number, b: number, bow: number, n = 24): Pt[] => {
    const [ax, ay] = toPx(POS2D[a]), [bx, by] = toPx(POS2D[b]);
    const len = Math.hypot(bx - ax, by - ay) || 1;
    return Array.from({ length: n + 1 }, (_, i): Pt => {
      const t = i / n;
      const off = Math.sin(t * Math.PI) * bow;
      return [ax + (bx - ax) * t + ((ay - by) / len) * off, ay + (by - ay) * t + ((bx - ax) / len) * off];
    });
  };
  const path = (pts: Pt[], jitter: number) => {
    g.beginPath();
    pts.forEach(([x, y], i) => {
      const jx = x + (r() - 0.5) * jitter, jy = y + (r() - 0.5) * jitter;
      if (i) g.lineTo(jx, jy);
      else g.moveTo(jx, jy);
    });
  };
  const seaRoute = (a: number, b: number) => {
    const A = POS2D[a], B = POS2D[b];
    const mid = Math.atan2(A[1] + B[1] + 2 * CENTER_Y, A[0] + B[0]);
    const ctrl: Pt = [Math.cos(mid) * 13 * MAP_SCALE, Math.sin(mid) * 13 * MAP_SCALE - CENTER_Y];
    return Array.from({ length: 49 }, (_, i): Pt => {
      const t = i / 48;
      return toPx([(1 - t) ** 2 * A[0] + 2 * (1 - t) * t * ctrl[0] + t * t * B[0], (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * ctrl[1] + t * t * B[1]]);
    });
  };
  g.lineCap = "round";
  EDGES.forEach(([a, b], k) => {
    const kind = edgeKind(a, b);
    if (kind === "sea") {
      const pts = seaRoute(a, b);
      g.strokeStyle = "rgba(24, 44, 70, 0.8)";
      g.lineWidth = 4;
      g.setLineDash([2, 13]);
      path(pts, 0);
      g.stroke();
      g.setLineDash([]);
      const [sx, sy] = pts[24];
      drawShip(g, sx, sy);
      return;
    }
    const pts = bowed(a, b, (k % 2 ? 1 : -1) * PX * 0.35);
    if (kind === "road") {
      g.strokeStyle = "rgba(52, 34, 20, 0.85)";
      g.lineWidth = 10;
      path(pts, 2);
      g.stroke();
      g.strokeStyle = "rgba(236, 214, 170, 0.95)";
      g.lineWidth = 5;
      path(pts, 0);
      g.stroke();
    } else {
      g.strokeStyle = "rgba(40, 28, 18, 0.9)";
      g.lineWidth = 4;
      path(pts, 0);
      g.stroke();
      g.lineWidth = 2.5;
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const nx = ((ay - by) / len) * 8, ny = ((bx - ax) / len) * 8;
        for (let t = 0; t < 1; t += 0.5) {
          const x = ax + (bx - ax) * t, y = ay + (by - ay) * t;
          g.beginPath();
          g.moveTo(x - nx, y - ny);
          g.lineTo(x + nx, y + ny);
          g.stroke();
        }
      }
    }
  });
}

function drawShip(g: CanvasRenderingContext2D, x: number, y: number): void {
  g.save();
  g.translate(x, y);
  g.fillStyle = "rgba(248, 240, 222, 0.95)";
  g.strokeStyle = "rgba(24, 44, 70, 0.9)";
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(-26, -2); g.lineTo(26, -2); g.lineTo(16, 12); g.lineTo(-16, 12); g.closePath();
  g.fill(); g.stroke();
  g.beginPath(); g.moveTo(0, -2); g.lineTo(0, -34); g.stroke();
  g.beginPath(); g.moveTo(2, -32); g.lineTo(20, -8); g.lineTo(2, -8); g.closePath();
  g.fill(); g.stroke();
  g.restore();
}

function drawDistricts(g: CanvasRenderingContext2D, r: () => number): void {
  CITY_NAMES.forEach((name, i) => {
    const [x, y] = toPx(POS2D[i]);
    const R = DISTRICT_R * PX;
    const color = STRAIN_COLORS[Math.floor(i / 6)];
    g.save();
    g.beginPath();
    g.arc(x, y, R, 0, Math.PI * 2);
    g.fillStyle = "rgba(246, 234, 208, 0.42)";
    g.fill();
    g.clip();
    g.strokeStyle = "rgba(90, 62, 36, 0.14)";
    g.lineWidth = 2;
    const tilt = r() * Math.PI;
    for (let k = -6; k <= 6; k++) {
      for (const a of [tilt, tilt + Math.PI / 2]) {
        const ox = Math.cos(a + Math.PI / 2) * k * R * 0.17, oy = Math.sin(a + Math.PI / 2) * k * R * 0.17;
        g.beginPath();
        g.moveTo(x + ox - Math.cos(a) * R, y + oy - Math.sin(a) * R);
        g.lineTo(x + ox + Math.cos(a) * R, y + oy + Math.sin(a) * R);
        g.stroke();
      }
    }
    g.restore();
    g.strokeStyle = color + "cc";
    g.lineWidth = 5;
    g.setLineDash([14, 9]);
    g.beginPath();
    g.arc(x, y, R, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.strokeStyle = color + "88";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(x, y, PX * 0.86, 0, Math.PI * 2);
    g.stroke();

    g.save();
    g.translate(x, y + PX * 2.0);
    g.rotate((r() - 0.5) * 0.1);
    const fs = PX * (i === 0 ? 0.66 : 0.56);
    g.font = `${fs}px "ZCOOL XiaoWei", serif`;
    const tw = g.measureText(name).width;
    g.fillStyle = "rgba(248,240,222,0.95)";
    g.shadowColor = "rgba(40,25,10,0.35)";
    g.shadowBlur = 6;
    g.shadowOffsetY = 3;
    g.fillRect(-tw / 2 - 14, -fs * 0.72, tw + 28, fs * 1.44);
    g.shadowColor = "transparent";
    g.fillStyle = color;
    g.fillRect(-tw / 2 - 14, -fs * 0.72, 6, fs * 1.44);
    g.fillStyle = "#2e2116";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(name, 0, 2);
    g.restore();
  });
}

function drawFurniture(g: CanvasRenderingContext2D, w: number, h: number): void {
  const K = SHEET_SCALE;
  g.save();
  g.translate(w - PX * 3.0 * K, h * 0.42);
  g.strokeStyle = "rgba(46,33,22,0.7)";
  g.fillStyle = "rgba(46,33,22,0.7)";
  g.lineWidth = 3;
  g.beginPath(); g.arc(0, 0, PX * 1.3 * K, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(0, 0, PX * 1.05 * K, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 4; k++) {
    g.save();
    g.rotate((k * Math.PI) / 2);
    g.beginPath(); g.moveTo(0, -PX * 1.25 * K); g.lineTo(PX * 0.2 * K, 0); g.lineTo(-PX * 0.2 * K, 0); g.closePath();
    if (k === 0) g.fill();
    else g.stroke();
    g.restore();
  }
  g.font = `${PX * 0.5 * K}px "ZCOOL XiaoWei", serif`;
  g.textAlign = "center";
  g.fillText("北", 0, -PX * 1.55 * K);
  g.restore();

  g.save();
  g.translate(PX * 1.4 * K, PX * 1.9 * K);
  g.fillStyle = "rgba(46,33,22,0.82)";
  g.font = `${PX * 0.62 * K}px "ZCOOL XiaoWei", serif`;
  g.fillText("三域防疫图", 0, 0);
  g.font = `${PX * 0.3 * K}px "Courier Prime", monospace`;
  g.fillText("SHEET 07 · 1 : 400 000", 0, PX * 0.55 * K);
  g.fillRect(0, PX * 0.85 * K, PX * 4 * K, 4);
  for (let k = 0; k <= 4; k++) g.fillRect(k * PX * K, PX * 0.72 * K, 3, PX * 0.3 * K);
  g.restore();

  const items: [string, (x: number, y: number) => void][] = [
    ["公路", (x, y) => {
      g.strokeStyle = "rgba(52,34,20,0.85)"; g.lineWidth = 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60, y); g.stroke();
      g.strokeStyle = "rgba(236,214,170,0.95)"; g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60, y); g.stroke();
    }],
    ["铁路", (x, y) => {
      g.strokeStyle = "rgba(40,28,18,0.9)"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60, y); g.stroke();
      g.lineWidth = 2.5; for (let k = 0; k <= 60; k += 10) { g.beginPath(); g.moveTo(x + k, y - 8); g.lineTo(x + k, y + 8); g.stroke(); }
    }],
    ["航线", (x, y) => {
      g.strokeStyle = "rgba(24,44,70,0.8)"; g.lineWidth = 4; g.setLineDash([2, 13]); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60, y); g.stroke(); g.setLineDash([]);
    }],
  ];
  g.save();
  const lx = w - PX * 1.4 * K - 180, ly = PX * 1.6 * K;
  g.fillStyle = "rgba(248,240,222,0.8)";
  g.fillRect(lx - 20, ly - 44, 220, items.length * 40 + 56);
  g.strokeStyle = "rgba(46,33,22,0.6)";
  g.lineWidth = 2;
  g.strokeRect(lx - 20, ly - 44, 220, items.length * 40 + 56);
  g.fillStyle = "rgba(46,33,22,0.85)";
  g.font = `28px "ZCOOL XiaoWei", serif`;
  g.fillText("图例", lx, ly - 12);
  items.forEach(([label, draw], k) => {
    const y = ly + 20 + k * 40;
    g.lineCap = "round";
    draw(lx, y);
    g.fillStyle = "rgba(46,33,22,0.85)";
    g.font = `26px "ZCOOL XiaoWei", serif`;
    g.textBaseline = "middle";
    g.fillText(label, lx + 84, y);
  });
  g.restore();

  g.strokeStyle = "rgba(255,240,215,0.35)";
  g.lineWidth = 3;
  [w / 3, (2 * w) / 3].forEach((x) => { g.beginPath(); g.moveTo(x + 2, 0); g.lineTo(x + 2, h); g.stroke(); });
  g.beginPath(); g.moveTo(0, h / 2 + 2); g.lineTo(w, h / 2 + 2); g.stroke();
  g.strokeStyle = "rgba(60,35,15,0.22)";
  g.lineWidth = 2;
  [w / 3, (2 * w) / 3].forEach((x) => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); });
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
}

function drawMapBack(w: number, h: number): HTMLCanvasElement {
  const K = SHEET_SCALE;
  const c = kraftCanvas(w, h, "#a9845a", 31, 1.8);
  const g = c.getContext("2d")!;
  g.save();
  g.translate(w * (5 / 6), h * 0.75);
  g.scale(-1, 1);
  g.fillStyle = "rgba(46,33,22,0.85)";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `${PX * 1.55 * K}px "ZCOOL XiaoWei", serif`;
  g.fillText("纸上防疫", 0, -PX * 1.3 * K);
  g.font = `${PX * 0.36 * K}px "Courier Prime", monospace`;
  g.fillText("PAPER  QUARANTINE", 0, PX * 0.05 * K);
  g.fillRect(-PX * 3 * K, PX * 0.6 * K, PX * 6 * K, 3 * K);
  g.font = `${PX * 0.42 * K}px "ZCOOL XiaoWei", serif`;
  g.fillText("三域防疫图 · 第 07 号", 0, PX * 1.15 * K);
  g.fillStyle = "rgba(196,71,47,0.9)";
  g.font = `${PX * 0.34 * K}px "ZCOOL XiaoWei", serif`;
  g.fillText("一人两角 · 十二轮内研制三种解药", 0, PX * 1.8 * K);
  g.strokeStyle = "rgba(46,33,22,0.6)";
  g.lineWidth = 4 * K;
  g.strokeRect(-PX * 4.1 * K, -PX * 2.6 * K, PX * 8.2 * K, PX * 4.9 * K);
  g.restore();
  return c;
}
