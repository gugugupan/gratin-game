import { CanvasTexture, SRGBColorSpace } from 'three';
import { isRock, PIVOTS, roundPivots, rng, type GardenMap, type Pass } from './engine';

const PX = 128;
const TINES = 12;
const SAND = '#f3f1ea';

type Ctx = CanvasRenderingContext2D;

function polyline(ctx: Ctx, pts: [number, number][]) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.stroke();
}

function groovePoints(p: Pass, x0: number, y0: number): [number, number][][] {
  const S = PX;
  const lines: [number, number][][] = [];
  for (let i = 0; i < TINES; i++) {
    const t = (i + 0.5) / TINES;
    const pts: [number, number][] = [];
    if (p.code === 2) {
      const x = x0 + t * S;
      for (let y = y0 - 4; y <= y0 + S + 4; y += 6) pts.push([x + 0.5 * Math.sin(y * 0.07 + x * 0.4), y]);
    } else if (p.code === 3) {
      const y = y0 + t * S;
      for (let x = x0 - 4; x <= x0 + S + 4; x += 6) pts.push([x, y + 0.5 * Math.sin(x * 0.07 + y * 0.4)]);
    } else {
      const [pu, pv] = PIVOTS[p.pivot];
      const cx = x0 + pu * S;
      const cy = y0 + pv * S;
      const rr = t * S;
      const a0 = [0, Math.PI / 2, Math.PI, Math.PI * 1.5][p.pivot];
      const n = Math.max(8, Math.ceil(rr / 5));
      for (let k = 0; k <= n; k++) {
        const an = a0 - 0.05 + ((Math.PI / 2 + 0.1) * k) / n;
        const r2 = rr + 0.5 * Math.sin(an * rr * 0.12);
        pts.push([cx + Math.cos(an) * r2, cy + Math.sin(an) * r2]);
      }
    }
    lines.push(pts);
  }
  return lines;
}

function clipPass(ctx: Ctx, p: Pass, x0: number, y0: number) {
  const S = PX;
  ctx.beginPath();
  if (p.kind === 'half') {
    const a = p.a;
    ctx.rect(a === 'E' ? x0 + S / 2 : x0, a === 'S' ? y0 + S / 2 : y0, a === 'W' || a === 'E' ? S / 2 : S, a === 'N' || a === 'S' ? S / 2 : S);
  } else ctx.rect(x0, y0, S, S);
  ctx.clip();
  if (p.kind === 'turn') {
    const [pu, pv] = PIVOTS[p.pivot];
    ctx.beginPath();
    ctx.arc(x0 + pu * S, y0 + pv * S, S, 0, Math.PI * 2);
    ctx.clip();
  }
}

/** Paints the sand as a printed tile texture plus a matching bump map. */
export class SandPainter {
  readonly color = document.createElement('canvas');
  readonly bump = document.createElement('canvas');
  readonly colorTex: CanvasTexture;
  readonly bumpTex: CanvasTexture;
  private baseColor = document.createElement('canvas');
  private baseBump = document.createElement('canvas');

  constructor(readonly map: GardenMap, seed: number) {
    const w = map.cols * PX;
    const h = map.rows * PX;
    for (const c of [this.color, this.bump, this.baseColor, this.baseBump]) {
      c.width = w;
      c.height = h;
    }
    this.colorTex = new CanvasTexture(this.color);
    this.colorTex.colorSpace = SRGBColorSpace;
    this.colorTex.anisotropy = 8;
    this.bumpTex = new CanvasTexture(this.bump);
    this.paintBase(seed);
  }

  private paintBase(seed: number) {
    const map = this.map;
    const r = rng(seed * 31 + 7);
    const cc = this.baseColor.getContext('2d')!;
    const bc = this.baseBump.getContext('2d')!;
    cc.fillStyle = '#ebe8df';
    cc.fillRect(0, 0, this.color.width, this.color.height);
    bc.fillStyle = '#808080';
    bc.fillRect(0, 0, this.bump.width, this.bump.height);
    const S = PX;
    for (let row = 0; row < map.rows; row++)
      for (let col = 0; col < map.cols; col++) {
        const x0 = col * S;
        const y0 = row * S;
        for (const ctx of [cc, bc]) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x0, y0, S, S);
          ctx.clip();
        }
        for (let k = 0; k < 5; k++) {
          const gx = x0 + r() * S;
          const gy = y0 + r() * S;
          const g = cc.createRadialGradient(gx, gy, 0, gx, gy, 30 + r() * 50);
          g.addColorStop(0, 'rgba(150,140,120,.10)');
          g.addColorStop(1, 'rgba(150,140,120,0)');
          cc.fillStyle = g;
          cc.fillRect(x0, y0, S, S);
        }
        if (isRock(map, [col, row])) {
          cc.fillStyle = SAND;
          cc.fillRect(x0, y0, S, S);
          for (let i = 1; i <= 6; i++) {
            const rad = 24 + (i * S) / 13;
            cc.strokeStyle = 'rgba(88,86,80,.45)';
            cc.lineWidth = 1.3;
            cc.beginPath();
            cc.arc(x0 + S / 2, y0 + S / 2, rad, 0, Math.PI * 2);
            cc.stroke();
            bc.strokeStyle = '#5a5a5a';
            bc.lineWidth = 4;
            bc.beginPath();
            bc.arc(x0 + S / 2, y0 + S / 2, rad, 0, Math.PI * 2);
            bc.stroke();
          }
        } else {
          for (let g = 0; g < 4; g++) {
            const cx = x0 + r() * S;
            const cy = y0 + r() * S;
            const rad = 18 + r() * 70;
            const a0 = r() * 6.3;
            const al = 0.6 + r() * 1.8;
            for (let l = 0; l < 4; l++) {
              const pts: [number, number][] = [];
              const r2 = rad + l * 6;
              for (let s = 0; s <= 16; s++) {
                const an = a0 + (al * s) / 16;
                const wob = Math.sin(s * 0.9 + g) * 3.5;
                pts.push([cx + Math.cos(an) * (r2 + wob), cy + Math.sin(an) * (r2 + wob)]);
              }
              cc.strokeStyle = 'rgba(120,115,104,.40)';
              cc.lineWidth = 1.3;
              polyline(cc, pts);
              bc.strokeStyle = 'rgba(70,70,70,.8)';
              bc.lineWidth = 3.5;
              polyline(bc, pts);
            }
          }
          for (let k = 0; k < 7; k++) {
            const x = x0 + r() * S;
            const y = y0 + r() * S;
            const a = r() * 6.3;
            const l = 10 + r() * 24;
            cc.strokeStyle = 'rgba(120,115,104,.32)';
            cc.lineWidth = 1.2;
            cc.beginPath();
            cc.moveTo(x, y);
            cc.quadraticCurveTo(x + Math.cos(a) * l, y + Math.sin(a + 1) * l, x + Math.cos(a + 0.6) * l * 1.6, y + Math.sin(a + 0.6) * l * 1.6);
            cc.stroke();
          }
          for (let k = 0; k < 40; k++) {
            const v = Math.floor(100 + r() * 60);
            bc.fillStyle = `rgb(${v},${v},${v})`;
            bc.beginPath();
            bc.arc(x0 + r() * S, y0 + r() * S, 3 + r() * 9, 0, Math.PI * 2);
            bc.fill();
          }
        }
        for (let k = 0; k < 280; k++) {
          cc.fillStyle = `rgba(110,105,95,${0.12 + r() * 0.15})`;
          cc.fillRect(x0 + r() * S, y0 + r() * S, 1.4, 1.4);
        }
        cc.restore();
        bc.restore();
      }
  }

  paint(passes: Pass[]) {
    const cc = this.color.getContext('2d')!;
    const bc = this.bump.getContext('2d')!;
    cc.drawImage(this.baseColor, 0, 0);
    bc.drawImage(this.baseBump, 0, 0);
    const S = PX;
    for (const p of passes) {
      const x0 = p.c * S;
      const y0 = p.r * S;
      const lines = groovePoints(p, x0, y0);
      cc.save();
      clipPass(cc, p, x0, y0);
      cc.fillStyle = SAND;
      cc.fillRect(x0 - 1, y0 - 1, S + 2, S + 2);
      cc.lineCap = 'round';
      for (const pts of lines) {
        cc.save();
        cc.translate(0.8, 0.9);
        cc.strokeStyle = 'rgba(88,86,80,.62)';
        cc.lineWidth = 1.5;
        polyline(cc, pts);
        cc.restore();
        cc.save();
        cc.translate(-0.6, -0.7);
        cc.strokeStyle = 'rgba(255,255,255,.95)';
        cc.lineWidth = 1.2;
        polyline(cc, pts);
        cc.restore();
      }
      cc.restore();
      bc.save();
      clipPass(bc, p, x0, y0);
      bc.fillStyle = '#b4b4b4';
      bc.fillRect(x0 - 1, y0 - 1, S + 2, S + 2);
      bc.lineCap = 'round';
      bc.strokeStyle = '#4a4a4a';
      bc.lineWidth = (S / TINES) * 0.42;
      bc.filter = 'blur(1.6px)';
      for (const pts of lines) polyline(bc, pts);
      bc.restore();
    }
    this.paintRoundCorners(cc, bc);
    cc.strokeStyle = 'rgba(90,80,60,.16)';
    cc.lineWidth = 1.6;
    for (let i = 1; i < this.map.cols; i++) {
      cc.beginPath();
      cc.moveTo(i * S, 0);
      cc.lineTo(i * S, this.map.rows * S);
      cc.stroke();
    }
    for (let j = 1; j < this.map.rows; j++) {
      cc.beginPath();
      cc.moveTo(0, j * S);
      cc.lineTo(this.map.cols * S, j * S);
      cc.stroke();
    }
    this.colorTex.needsUpdate = true;
    this.bumpTex.needsUpdate = true;
  }

  private paintRoundCorners(cc: Ctx, bc: Ctx) {
    const S = PX;
    const round = roundPivots(this.map);
    const r = rng(99);
    round.forEach((pv, idx) => {
      if (pv < 0) return;
      const x0 = (idx % this.map.cols) * S;
      const y0 = Math.floor(idx / this.map.cols) * S;
      const [pu, pw] = PIVOTS[pv];
      for (const ctx of [cc, bc]) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, y0, S, S);
        ctx.clip();
        ctx.beginPath();
        ctx.rect(x0, y0, S, S);
        ctx.arc(x0 + pu * S, y0 + pw * S, S - 1, 0, Math.PI * 2, true);
        ctx.clip('evenodd');
      }
      cc.fillStyle = '#a9c043';
      cc.fillRect(x0, y0, S, S);
      for (let k = 0; k < 40; k++) {
        const gx = x0 + r() * S;
        const gy = y0 + r() * S;
        const g = cc.createRadialGradient(gx, gy, 0, gx, gy, 6 + r() * 14);
        const c = r() < 0.5 ? 'rgba(130,160,40,' : 'rgba(200,218,98,';
        g.addColorStop(0, c + '.7)');
        g.addColorStop(1, c + '0)');
        cc.fillStyle = g;
        cc.fillRect(x0, y0, S, S);
      }
      bc.fillStyle = '#d8d8d8';
      bc.fillRect(x0, y0, S, S);
      cc.restore();
      bc.restore();
      cc.save();
      cc.strokeStyle = 'rgba(60,70,30,.45)';
      cc.lineWidth = 2;
      cc.beginPath();
      const a0 = [0, Math.PI / 2, Math.PI, Math.PI * 1.5][pv];
      cc.arc(x0 + pu * S, y0 + pw * S, S - 1, a0, a0 + Math.PI / 2);
      cc.stroke();
      cc.restore();
    });
  }

  dispose() {
    this.colorTex.dispose();
    this.bumpTex.dispose();
  }
}

export const SAND_PX = PX;
