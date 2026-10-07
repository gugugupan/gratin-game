import * as THREE from "three";
import { rand } from "../util";

export function kraftCanvas(w: number, h: number, base: string, seed: number, fibers = 1): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  const r = rand(seed);
  for (let i = 0; i < 26; i++) {
    const x = r() * w, y = r() * h, rad = (0.1 + r() * 0.35) * w;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, r() < 0.5 ? "rgba(90,55,20,0.10)" : "rgba(255,235,200,0.10)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }
  const img = g.getImageData(0, 0, w, h);
  for (let p = 0; p < img.data.length; p += 4) {
    const n = (r() - 0.5) * 22;
    img.data[p] += n;
    img.data[p + 1] += n;
    img.data[p + 2] += n * 0.8;
  }
  g.putImageData(img, 0, 0);
  g.lineCap = "round";
  for (let i = 0; i < 2600 * fibers; i++) {
    const x = r() * w, y = r() * h, len = 4 + r() * 18, a = r() * Math.PI;
    g.strokeStyle = r() < 0.5 ? "rgba(255,240,210,0.22)" : "rgba(70,40,15,0.18)";
    g.lineWidth = 0.6 + r() * 0.9;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + (r() - 0.5) * 4, y + Math.sin(a) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
    g.stroke();
  }
  return c;
}

export function texture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, ready?: Promise<unknown>): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const t = texture(c);
  const paint = () => {
    draw(c.getContext("2d")!, w, h);
    t.needsUpdate = true;
  };
  paint();
  ready?.then(paint);
  return t;
}

export interface PaperArt {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
}

export function paperCutout(draw: (g: CanvasRenderingContext2D) => void, W: number, H: number, border: number): PaperArt {
  const fig = document.createElement("canvas");
  fig.width = W;
  fig.height = H;
  draw(fig.getContext("2d")!);

  const sil = document.createElement("canvas");
  sil.width = W;
  sil.height = H;
  const s = sil.getContext("2d")!;
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2;
    s.drawImage(fig, Math.cos(a) * border, Math.sin(a) * border);
  }
  s.globalCompositeOperation = "source-in";
  s.fillStyle = "#fbf7ee";
  s.fillRect(0, 0, W, H);

  const front = document.createElement("canvas");
  front.width = W;
  front.height = H;
  const f = front.getContext("2d")!;
  f.drawImage(sil, 0, 0);
  f.drawImage(fig, 0, 0);

  const back = document.createElement("canvas");
  back.width = W;
  back.height = H;
  const b = back.getContext("2d")!;
  b.translate(W, 0);
  b.scale(-1, 1);
  b.drawImage(sil, 0, 0);
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalCompositeOperation = "source-in";
  b.drawImage(kraftCanvas(W, H, "#b89a74", 3, 0.4), 0, 0);
  return { front, back };
}

export function cutoutFromImage(img: HTMLImageElement, width: number, pad: number, border: number): PaperArt {
  const scale = (width - pad * 2) / img.width;
  const height = Math.round(img.height * scale + pad * 2);
  return paperCutout((g) => g.drawImage(img, pad, pad, width - pad * 2, img.height * scale), width, height, border);
}
