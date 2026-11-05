import { CH, CW, G, GX, GY, GameMap, MH, NX, W, elevAt } from '../core/map';

export const TEX_SCALE = 2;

const BANDS: [number, number, number][] = [
  [221, 231, 188],
  [202, 221, 166],
  [183, 208, 148],
  [203, 200, 160],
  [223, 215, 197],
  [242, 238, 228],
  [250, 248, 244],
];

const MS: Record<number, number[]> = {
  1: [3, 0], 2: [0, 1], 3: [3, 1], 4: [1, 2], 5: [3, 0, 1, 2], 6: [0, 2], 7: [3, 2],
  8: [2, 3], 9: [2, 0], 10: [0, 1, 2, 3], 11: [2, 1], 12: [1, 3], 13: [1, 0], 14: [0, 3],
};

function isoPath(m: GameMap, lv: number, s: number) {
  const p = new Path2D();
  const Z = m.Z;
  const rows = MH / G;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < NX - 1; i++) {
      const a = Z[j * NX + i];
      const b = Z[j * NX + i + 1];
      const c = Z[(j + 1) * NX + i + 1];
      const d = Z[(j + 1) * NX + i];
      const idx = (+(a > lv)) | (+(b > lv) << 1) | (+(c > lv) << 2) | (+(d > lv) << 3);
      if (!idx || idx === 15) continue;
      const X = i * G;
      const Y = j * G;
      const L = (p0: number, q0: number) => ((lv - p0) / (q0 - p0)) * G;
      const e: [number, number][] = [
        [X + L(a, b), Y],
        [X + G, Y + L(b, c)],
        [X + L(d, c), Y + G],
        [X, Y + L(a, d)],
      ];
      const seg = MS[idx];
      for (let k = 0; k < seg.length; k += 2) {
        p.moveTo(e[seg[k]][0] * s, e[seg[k]][1] * s);
        p.lineTo(e[seg[k + 1]][0] * s, e[seg[k + 1]][1] * s);
      }
    }
  return p;
}

export function drawMapCanvas(m: GameMap, contourInterval: number): HTMLCanvasElement {
  const s = TEX_SCALE;
  const cv = document.createElement('canvas');
  cv.width = W * s;
  cv.height = MH * s;
  const ctx = cv.getContext('2d')!;
  const img = ctx.createImageData(cv.width, cv.height);
  const D = img.data;
  let seedN = m.seed >>> 0;
  const grain = () => {
    seedN = (seedN * 1664525 + 1013904223) >>> 0;
    return (seedN / 4294967296 - 0.5) * 10;
  };
  for (let y = 0; y < cv.height; y++)
    for (let x = 0; x < cv.width; x++) {
      const e = elevAt(m, x / s, y / s);
      const p = (y * cv.width + x) * 4;
      let c: [number, number, number];
      if (e < m.sea) c = (x + y) % 14 < 2 ? [120, 182, 184] : [152, 204, 201];
      else {
        c = BANDS[Math.min(BANDS.length - 1, Math.floor((e - m.sea) / contourInterval))];
        if (e - m.sea < 18) c = [236, 225, 188];
      }
      const g = grain();
      D[p] = c[0] + g;
      D[p + 1] = c[1] + g;
      D[p + 2] = c[2] + g;
      D[p + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  ctx.lineCap = 'round';
  for (let lv = m.sea + contourInterval; lv < 2800; lv += contourInterval) {
    const major = Math.round((lv - m.sea) / contourInterval) % 4 === 0;
    ctx.strokeStyle = major ? 'rgba(63,90,54,.85)' : 'rgba(63,90,54,.45)';
    ctx.lineWidth = (major ? 1.4 : 0.9) * s;
    ctx.stroke(isoPath(m, lv, s));
  }
  ctx.strokeStyle = 'rgba(46,90,96,.8)';
  ctx.lineWidth = 0.9 * s;
  ctx.stroke(isoPath(m, m.sea, s));

  for (const [x, y] of m.trees) {
    ctx.fillStyle = 'rgba(63,110,60,.55)';
    ctx.beginPath();
    ctx.moveTo(x * s, (y - 5) * s);
    ctx.lineTo((x - 3.5) * s, (y + 2) * s);
    ctx.lineTo((x + 3.5) * s, (y + 2) * s);
    ctx.fill();
  }

  ctx.lineJoin = 'round';
  const rp = new Path2D();
  let pen = false;
  for (const p of m.river) {
    if (elevAt(m, p[0], p[1]) < m.sea - 2) {
      pen = false;
      continue;
    }
    if (pen) rp.lineTo(p[0] * s, p[1] * s);
    else rp.moveTo(p[0] * s, p[1] * s);
    pen = true;
  }
  ctx.strokeStyle = '#4FAFC2';
  ctx.lineWidth = 8 * s;
  ctx.stroke(rp);
  ctx.strokeStyle = '#8ED3DF';
  ctx.lineWidth = 2.5 * s;
  ctx.stroke(rp);

  for (const b of m.bridges) {
    ctx.save();
    ctx.translate(b.x * s, b.y * s);
    ctx.rotate(b.angle + Math.PI / 2);
    ctx.scale(s, s);
    ctx.fillStyle = '#B88A5A';
    ctx.fillRect(-12, -5, 24, 10);
    ctx.strokeStyle = '#6E4B2A';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-12, -5, 24, 10);
    ctx.beginPath();
    for (let k = -8; k <= 8; k += 4) {
      ctx.moveTo(k, -5);
      ctx.lineTo(k, 5);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(46,90,96,.65)';
  ctx.lineWidth = 1 * s;
  ctx.setLineDash([2 * s, 4 * s]);
  ctx.beginPath();
  for (let k = 1; k < GX; k++) {
    ctx.moveTo(k * CW * s, 0);
    ctx.lineTo(k * CW * s, MH * s);
  }
  for (let k = 1; k < GY; k++) {
    ctx.moveTo(0, k * CH * s);
    ctx.lineTo(W * s, k * CH * s);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `${11 * s}px sans-serif`;
  ctx.fillStyle = 'rgba(46,70,60,.85)';
  for (let k = 0; k < GX; k++) ctx.fillText((m.lng + k * 0.02).toFixed(2) + '°E', (k * CW + 4) * s, 13 * s);
  for (let k = 1; k < GY; k++) ctx.fillText((m.lat - k * 0.018).toFixed(3) + '°N', 4 * s, (k * CH - 5) * s);
  ctx.fillStyle = 'rgba(46,70,60,.4)';
  for (let cy = 0; cy < GY; cy++)
    for (let cx = 0; cx < GX; cx++) ctx.fillText('ABCDE'[cx] + (cy + 1), (cx * CW + CW - 22) * s, (cy * CH + CH - 6) * s);

  ctx.font = `${15 * s}px "Songti SC", "Noto Serif SC", serif`;
  (ctx as unknown as { letterSpacing: string }).letterSpacing = `${7 * s}px`;
  let rm: [number, number] | null = null;
  for (let k = Math.floor(m.river.length * 0.2); k < m.river.length * 0.8 && !rm; k += 4) {
    const p = m.river[k];
    if (p[0] > 60 && p[0] < W - 120 && elevAt(m, p[0], p[1] - 16) > m.sea + 30 && elevAt(m, p[0] + 70, p[1] - 16) > m.sea + 30) rm = p;
  }
  ctx.fillStyle = 'rgba(31,111,139,.9)';
  if (rm) ctx.fillText(m.names.river, (rm[0] - 10) * s, (rm[1] - 14) * s);
  let lw: [number, number] | null = null;
  for (let y = 30; y < MH - 30 && !lw; y += 6)
    for (let x = 40; x < W - 120 && !lw; x += 6)
      if (elevAt(m, x, y) < m.sea - 50 && elevAt(m, x + 60, y) < m.sea - 50 && (!rm || Math.hypot(rm[0] - x, rm[1] - y) > 120)) lw = [x, y];
  if (lw) ctx.fillText(m.names.lake, lw[0] * s, (lw[1] + 6) * s);
  const pk = m.marks.find((k) => k.kind === 'peak');
  ctx.fillStyle = 'rgba(63,90,54,.8)';
  if (pk) ctx.fillText(m.names.peak, (pk.x - 30) * s, (pk.y + 38) * s);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px';
  ctx.font = `${11 * s}px sans-serif`;
  ctx.fillStyle = 'rgba(63,70,50,.9)';
  for (const p of m.marks) if (p.kind === 'peak') ctx.fillText(Math.round(p.elev ?? 0) + 'm', (p.x + 14) * s, (p.y + 4) * s);
  return cv;
}

export function drawPaperMargin(m: GameMap, w: number, h: number, inset: { x: number; y: number; w: number; h: number }) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#F2ECDB';
  ctx.fillRect(0, 0, w, h);
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const g = (Math.random() - 0.5) * 12;
    img.data[i] += g;
    img.data[i + 1] += g;
    img.data[i + 2] += g;
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = '#3F5A36';
  ctx.lineWidth = 6;
  ctx.strokeRect(inset.x - 8, inset.y - 8, inset.w + 16, inset.h + 16);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(inset.x - 16, inset.y - 16, inset.w + 32, inset.h + 32);
  const by = inset.y + inset.h + 22;
  ctx.fillStyle = '#3F5A36';
  ctx.fillRect(inset.x - 8, by, inset.w + 16, 54);
  ctx.fillStyle = '#F3EEDD';
  ctx.font = '26px "Songti SC", "Noto Serif SC", serif';
  (ctx as unknown as { letterSpacing: string }).letterSpacing = '14px';
  ctx.textAlign = 'center';
  ctx.fillText(`${m.names.river}河谷 · 林野踏查图`, inset.x + inset.w / 2, by + 36);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = '4px';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`No.${String(m.seed % 1000).padStart(3, '0')}`, inset.x + 12, by + 34);
  ctx.textAlign = 'right';
  ctx.fillText('0 ━━━━ 2 km', inset.x + inset.w - 12, by + 34);
  const cx = inset.x + inset.w - 40;
  const cy = inset.y - 48;
  ctx.strokeStyle = '#3F5A36';
  ctx.fillStyle = '#3F5A36';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 20);
  ctx.lineTo(cx + 7, cy);
  ctx.lineTo(cx, cy + 20);
  ctx.lineTo(cx - 7, cy);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 20);
  ctx.lineTo(cx + 7, cy);
  ctx.lineTo(cx - 7, cy);
  ctx.fill();
  ctx.font = '15px serif';
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - 28);
  return cv;
}
