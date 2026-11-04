export type BurstKind = 'serve' | 'burn' | 'fire' | 'cool' | 'cheese';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function layer(): HTMLElement {
  let el = document.getElementById('fx');
  if (!el) {
    el = document.createElement('div');
    el.id = 'fx';
    document.body.append(el);
  }
  return el;
}

export interface Snapshot {
  html: string;
  rect: DOMRect;
}

export function snapshot(el: Element | null): Snapshot | null {
  if (!el) return null;
  const clone = el.cloneNode(true) as HTMLElement;
  clone.classList.remove('fresh');
  return { html: clone.outerHTML, rect: el.getBoundingClientRect() };
}

export function flyCard(from: Snapshot | null, to: Element | null, ms = 360) {
  if (!from || !to || reduced()) return;
  const host = document.createElement('div');
  host.className = 'fly';
  host.innerHTML = from.html;
  const r = from.rect;
  Object.assign(host.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
  host.style.setProperty('--cw', `${r.width}px`);
  host.style.setProperty('--ch', `${r.height}px`);
  layer().append(host);
  const t = to.getBoundingClientRect();
  const dx = t.left + t.width / 2 - (r.left + r.width / 2);
  const dy = t.top + t.height / 2 - (r.top + r.height / 2);
  const scale = Math.max(0.15, Math.min(0.5, (t.height * 0.5) / r.height));
  host
    .animate(
      [
        { transform: 'translate(0, 0) rotate(-4deg) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 40}px) rotate(8deg) scale(${(1 + scale) / 2})`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px, ${dy}px) rotate(0deg) scale(${scale})`, opacity: 0.2 },
      ],
      { duration: ms, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' },
    )
    .finished.then(() => host.remove(), () => host.remove());
}

const SPEC: Record<BurstKind, { n: number; cls: string[]; up: number; spread: number; life: number }> = {
  serve: { n: 26, cls: ['c-red', 'c-green', 'c-blue', 'c-cheese', 'c-purple'], up: 90, spread: 150, life: 950 },
  burn: { n: 12, cls: ['smoke'], up: 120, spread: 50, life: 1200 },
  fire: { n: 16, cls: ['flame', 'flame2'], up: 90, spread: 45, life: 750 },
  cool: { n: 14, cls: ['snow'], up: -50, spread: 90, life: 1000 },
  cheese: { n: 12, cls: ['crumb'], up: 40, spread: 70, life: 800 },
};

export function burst(el: Element | null, kind: BurstKind, delay = 0) {
  if (!el || reduced()) return;
  const spec = SPEC[kind];
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  for (let i = 0; i < spec.n; i++) {
    const p = document.createElement('span');
    p.className = `pt ${spec.cls[i % spec.cls.length]}`;
    if (kind === 'cool') p.textContent = '✻';
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;
    layer().append(p);
    const ang = Math.random() * Math.PI * 2;
    const dist = spec.spread * (0.4 + Math.random() * 0.6);
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist * 0.6 - spec.up * (0.5 + Math.random() * 0.5);
    const rot = (Math.random() - 0.5) * 720;
    const grow = kind === 'burn' ? 2.4 : kind === 'fire' ? 0.3 : 1;
    p.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
        { transform: `translate(calc(-50% + ${dx * 0.3}px), calc(-50% + ${dy * 0.3}px)) scale(1) rotate(${rot * 0.3}deg)`, opacity: 1, offset: 0.15 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + (kind === 'serve' ? 60 : 0)}px)) scale(${grow}) rotate(${rot}deg)`, opacity: 0 },
      ],
      { duration: spec.life * (0.7 + Math.random() * 0.5), delay: delay + Math.random() * 80, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)', fill: 'backwards' },
    ).finished.then(() => p.remove(), () => p.remove());
  }
}

export function confetti() {
  if (reduced()) return;
  const colors = ['c-red', 'c-green', 'c-blue', 'c-cheese', 'c-purple'];
  const w = window.innerWidth;
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('span');
    p.className = `pt big ${colors[i % colors.length]}`;
    p.style.left = `${Math.random() * w}px`;
    p.style.top = '-20px';
    layer().append(p);
    const fall = window.innerHeight + 60;
    const drift = (Math.random() - 0.5) * 160;
    p.animate(
      [
        { transform: 'translate(0, 0) rotate(0deg)' },
        { transform: `translate(${drift}px, ${fall}px) rotate(${(Math.random() - 0.5) * 1080}deg)` },
      ],
      { duration: 1800 + Math.random() * 1400, delay: Math.random() * 700, easing: 'cubic-bezier(0.3, 0.2, 0.6, 1)', fill: 'backwards' },
    ).finished.then(() => p.remove(), () => p.remove());
  }
}

export function rectsOf(root: ParentNode, attr: string): Map<string, DOMRect> {
  const m = new Map<string, DOMRect>();
  root.querySelectorAll<HTMLElement>(`[${attr}]`).forEach(el => m.set(el.getAttribute(attr)!, el.getBoundingClientRect()));
  return m;
}

export function slideFrom(root: ParentNode, attr: string, before: Map<string, DOMRect>, ms = 560) {
  if (reduced()) return;
  root.querySelectorAll<HTMLElement>(`[${attr}]`).forEach(el => {
    const r0 = before.get(el.getAttribute(attr)!);
    if (!r0) return;
    const r1 = el.getBoundingClientRect();
    if (!r1.width || !r1.height) return;
    const dx = r0.left - r1.left;
    const dy = r0.top - r1.top;
    const sx = r0.width / r1.width;
    const sy = r0.height / r1.height;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    el.animate(
      [
        { transformOrigin: 'top left', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transformOrigin: 'top left', transform: 'none' },
      ],
      { duration: ms, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' },
    );
  });
}

export function turnTable(old: Snapshot | null, next: HTMLElement | null, pivot: { x: number; y: number }, ms = 560) {
  if (reduced() || !next) return;
  const angle = 38;
  if (old) {
    const host = document.createElement('div');
    host.className = 'fly table-out';
    host.innerHTML = old.html;
    const r = old.rect;
    Object.assign(host.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    layer().append(host);
    host
      .animate(
        [
          { transformOrigin: `${pivot.x - r.left}px ${pivot.y - r.top}px`, transform: 'rotate(0deg)', opacity: 1 },
          { transformOrigin: `${pivot.x - r.left}px ${pivot.y - r.top}px`, transform: `rotate(${-angle}deg)`, opacity: 0 },
        ],
        { duration: ms, easing: 'cubic-bezier(0.5, 0, 0.2, 1)', fill: 'forwards' },
      )
      .finished.then(() => host.remove(), () => host.remove());
  }
  const r = next.getBoundingClientRect();
  next.animate(
    [
      { transformOrigin: `${pivot.x - r.left}px ${pivot.y - r.top}px`, transform: `rotate(${angle}deg)`, opacity: 0 },
      { transformOrigin: `${pivot.x - r.left}px ${pivot.y - r.top}px`, transform: 'rotate(0deg)', opacity: 1 },
    ],
    { duration: ms, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' },
  );
}
