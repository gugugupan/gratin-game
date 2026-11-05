import type { SpeciesKey } from '../core/map';

export const SPECIES_ICON: Record<SpeciesKey, string> = {
  fish: 'ti-fish',
  otter: 'ti-ripple',
  heron: 'ti-feather',
  deer: 'ti-deer',
  rabbit: 'ti-carrot',
  bear: 'ti-paw',
  butterfly: 'ti-butterfly',
};

const cache = new Map<string, string>();

export function iconChar(name: string) {
  const hit = cache.get(name);
  if (hit) return hit;
  const el = document.createElement('i');
  el.className = `ti ${name}`;
  el.style.position = 'absolute';
  el.style.visibility = 'hidden';
  document.body.appendChild(el);
  const raw = getComputedStyle(el, '::before').content;
  el.remove();
  const ch = raw.replace(/^["']|["']$/g, '');
  cache.set(name, ch);
  return ch;
}

export async function iconsReady(names: string[]) {
  const text = names.map(iconChar).join('');
  await document.fonts.load('400 64px "tabler-icons"', text);
  await document.fonts.ready;
}

export function iconCanvas(name: string, fg: string, bg: string, size = 128, ring?: string) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  if (ring) {
    ctx.strokeStyle = ring;
    ctx.lineWidth = size * 0.07;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - size * 0.06, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = fg;
  ctx.font = `400 ${size * 0.64}px "tabler-icons"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(iconChar(name), size / 2, size / 2 + size * 0.02);
  return cv;
}
