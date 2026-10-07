import * as THREE from "three";
import { CITY_COUNT, EDGES } from "../../../engine/map.js";
import { CITY_NAMES, STRAIN_COLORS } from "../data";
import { rand } from "../util";
import { kraftCanvas } from "./paper";

export const SHEET_W = 28;
export const SHEET_H = 23;
const PX = 80;

const LOCAL: [number, number][] = [[3, 0], [5.6, -0.34], [5.6, 0.34], [8, -0.3], [8, 0.3], [10.2, 0]];
const DIRS = [210, 90, 330].map((d) => (d * Math.PI) / 180);
const CENTER_Y = 2.2;

export const POS2D: [number, number][] = Array.from({ length: CITY_COUNT }, (_, i) => {
  const [r, phi] = LOCAL[i % 6];
  const a = DIRS[Math.floor(i / 6)] + phi;
  return [r * Math.cos(a), r * Math.sin(a) - CENTER_Y];
});

export function cityWorld(i: number, out = new THREE.Vector3()): THREE.Vector3 {
  return out.set(POS2D[i][0], 0, -POS2D[i][1]);
}

type EdgeKind = "region" | "inner" | "outer";
function edgeKind(a: number, b: number): EdgeKind {
  if (Math.floor(a / 6) === Math.floor(b / 6)) return "region";
  return a % 6 === 0 ? "inner" : "outer";
}

export interface MapCanvases {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
  mask: HTMLCanvasElement;
}

export function drawMap(): MapCanvases {
  const w = SHEET_W * PX, h = SHEET_H * PX;
  const paper = kraftCanvas(w, h, "#c69c6d", 7, 2.2);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const r = rand(99);
  const step = 22;
  const outline: [number, number][] = [[14, 14]];
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

  trace(g);
  g.save();
  g.clip();
  g.drawImage(paper, 0, 0);

  const toPx = ([x, y]: [number, number]): [number, number] => [(x + SHEET_W / 2) * PX, (SHEET_H / 2 - y) * PX];

  DIRS.forEach((d, i) => {
    const [cx, cy] = toPx([Math.cos(d) * 6.6, Math.sin(d) * 6.6 - CENTER_Y]);
    for (let k = 0; k < 7; k++) {
      const ox = cx + (r() - 0.5) * 220, oy = cy + (r() - 0.5) * 220, rad = 220 + r() * 200;
      const grad = g.createRadialGradient(ox, oy, 0, ox, oy, rad);
      grad.addColorStop(0, STRAIN_COLORS[i] + "26");
      grad.addColorStop(1, STRAIN_COLORS[i] + "00");
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }
    g.save();
    g.translate(cx + Math.cos(d) * 30, cy - Math.sin(d) * 30);
    g.rotate((r() - 0.5) * 0.3);
    g.font = `${PX * 2.1}px "ZCOOL XiaoWei", serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = STRAIN_COLORS[i] + "30";
    g.fillText(["赤域", "苍域", "金域"][i], 0, 0);
    g.restore();
  });

  g.strokeStyle = "rgba(255,240,215,0.35)";
  g.lineWidth = 3;
  [w / 3, (2 * w) / 3].forEach((x) => { g.beginPath(); g.moveTo(x + 2, 0); g.lineTo(x + 2, h); g.stroke(); });
  g.beginPath(); g.moveTo(0, h / 2 + 2); g.lineTo(w, h / 2 + 2); g.stroke();
  g.strokeStyle = "rgba(60,35,15,0.22)";
  g.lineWidth = 2;
  [w / 3, (2 * w) / 3].forEach((x) => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); });
  g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();

  const sketch = (points: [number, number][], dash: number[], width: number, alpha: number) => {
    for (let pass = 0; pass < 2; pass++) {
      g.strokeStyle = `rgba(52,34,20,${alpha - pass * 0.25})`;
      g.lineWidth = width - pass * 1.5;
      g.setLineDash(dash);
      g.beginPath();
      points.forEach(([x, y], i) => {
        const jx = x + (r() - 0.5) * 3.5, jy = y + (r() - 0.5) * 3.5;
        if (i) g.lineTo(jx, jy);
        else g.moveTo(jx, jy);
      });
      g.stroke();
    }
    g.setLineDash([]);
  };
  const straight = (a: number, b: number, dash: number[], width: number, alpha: number) => {
    const [ax, ay] = toPx(POS2D[a]), [bx, by] = toPx(POS2D[b]);
    const pts: [number, number][] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const bow = Math.sin(t * Math.PI) * 6;
      pts.push([ax + (bx - ax) * t + ((ay - by) / 400) * bow, ay + (by - ay) * t + ((bx - ax) / 400) * bow]);
    }
    sketch(pts, dash, width, alpha);
  };
  const curved = (a: number, b: number) => {
    const A = POS2D[a], B = POS2D[b];
    const mid = Math.atan2(A[1] + B[1] + 2 * CENTER_Y, A[0] + B[0]);
    const ctrl: [number, number] = [Math.cos(mid) * 13, Math.sin(mid) * 13 - CENTER_Y];
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = (1 - t) ** 2 * A[0] + 2 * (1 - t) * t * ctrl[0] + t * t * B[0];
      const y = (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * ctrl[1] + t * t * B[1];
      pts.push(toPx([x, y]));
    }
    sketch(pts, [3, 12], 6, 0.75);
  };
  EDGES.forEach(([a, b]) => {
    const kind = edgeKind(a, b);
    if (kind === "region") straight(a, b, [18, 12], 5, 0.85);
    else if (kind === "inner") straight(a, b, [4, 10], 6, 0.9);
    else curved(a, b);
  });

  CITY_NAMES.forEach((name, i) => {
    const [x, y] = toPx(POS2D[i]);
    g.strokeStyle = STRAIN_COLORS[Math.floor(i / 6)] + "aa";
    g.lineWidth = 4;
    g.setLineDash([6, 5]);
    g.beginPath();
    g.arc(x, y, PX * 0.86, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.save();
    g.translate(x, y + PX * 1.42);
    g.rotate((r() - 0.5) * 0.12);
    const fs = PX * (i === 0 ? 0.62 : 0.5);
    g.font = `${fs}px "ZCOOL XiaoWei", serif`;
    const tw = g.measureText(name).width;
    g.fillStyle = "rgba(248,240,222,0.92)";
    g.shadowColor = "rgba(40,25,10,0.35)";
    g.shadowBlur = 6;
    g.shadowOffsetY = 3;
    g.fillRect(-tw / 2 - 14, -fs * 0.72, tw + 28, fs * 1.44);
    g.shadowColor = "transparent";
    g.fillStyle = "#2e2116";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(name, 0, 2);
    g.restore();
  });

  g.save();
  g.translate(w - PX * 3.4, h - PX * 3.2);
  g.strokeStyle = "rgba(46,33,22,0.7)";
  g.fillStyle = "rgba(46,33,22,0.7)";
  g.lineWidth = 3;
  g.beginPath(); g.arc(0, 0, PX * 1.3, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(0, 0, PX * 1.05, 0, Math.PI * 2); g.stroke();
  for (let k = 0; k < 4; k++) {
    g.save();
    g.rotate((k * Math.PI) / 2);
    g.beginPath(); g.moveTo(0, -PX * 1.25); g.lineTo(PX * 0.2, 0); g.lineTo(-PX * 0.2, 0); g.closePath();
    if (k === 0) g.fill();
    else g.stroke();
    g.restore();
  }
  g.font = `${PX * 0.5}px "ZCOOL XiaoWei", serif`;
  g.textAlign = "center";
  g.fillText("北", 0, -PX * 1.55);
  g.restore();

  g.save();
  g.translate(PX * 1.4, PX * 1.9);
  g.font = `${PX * 0.62}px "ZCOOL XiaoWei", serif`;
  g.fillStyle = "rgba(46,33,22,0.82)";
  g.fillText("三域防疫图", 0, 0);
  g.font = `${PX * 0.3}px "Courier Prime", monospace`;
  g.fillText("SHEET 07 · 1 : 250 000", 0, PX * 0.55);
  g.fillRect(0, PX * 0.85, PX * 4, 4);
  for (let k = 0; k <= 4; k++) g.fillRect(k * PX, PX * 0.72, 3, PX * 0.3);
  g.restore();
  g.restore();

  return { front: c, back: drawMapBack(w, h), mask };
}

function drawMapBack(w: number, h: number): HTMLCanvasElement {
  const c = kraftCanvas(w, h, "#a9845a", 31, 1.4);
  const g = c.getContext("2d")!;
  g.save();
  g.translate(w * (5 / 6), h * 0.75);
  g.scale(-1, 1);
  g.fillStyle = "rgba(46,33,22,0.85)";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `${PX * 1.55}px "ZCOOL XiaoWei", serif`;
  g.fillText("纸上防疫", 0, -PX * 1.3);
  g.font = `${PX * 0.36}px "Courier Prime", monospace`;
  g.fillText("PAPER  QUARANTINE", 0, PX * 0.05);
  g.fillRect(-PX * 3, PX * 0.6, PX * 6, 3);
  g.font = `${PX * 0.42}px "ZCOOL XiaoWei", serif`;
  g.fillText("三域防疫图 · 第 07 号", 0, PX * 1.15);
  g.fillStyle = "rgba(196,71,47,0.9)";
  g.font = `${PX * 0.34}px "ZCOOL XiaoWei", serif`;
  g.fillText("一人两角 · 十二轮内研制三种解药", 0, PX * 1.8);
  g.strokeStyle = "rgba(46,33,22,0.6)";
  g.lineWidth = 4;
  g.strokeRect(-PX * 4.1, -PX * 2.6, PX * 8.2, PX * 4.9);
  g.restore();
  return c;
}
