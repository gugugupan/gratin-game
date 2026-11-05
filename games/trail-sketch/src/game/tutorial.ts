export interface CoachStep {
  title: string;
  text: string;
  target: () => DOMRect | { x: number; y: number; r: number } | null;
}

export function runCoach(steps: CoachStep[], onDone: () => void) {
  const root = document.createElement('div');
  root.className = 'coach';
  const hole = document.createElement('div');
  hole.className = 'hole';
  const tip = document.createElement('div');
  tip.className = 'tip card';
  root.append(hole, tip);
  document.getElementById('hud')!.appendChild(root);
  let i = 0;
  const close = () => {
    root.remove();
    window.removeEventListener('resize', place);
    onDone();
  };
  function place() {
    const s = steps[i];
    const t = s.target();
    let rect = { x: window.innerWidth / 2 - 60, y: window.innerHeight / 2 - 60, w: 120, h: 120 };
    if (t && 'r' in t) rect = { x: t.x - t.r, y: t.y - t.r, w: t.r * 2, h: t.r * 2 };
    else if (t) rect = { x: t.left - 6, y: t.top - 6, w: t.width + 12, h: t.height + 12 };
    Object.assign(hole.style, { left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', height: rect.h + 'px', borderRadius: t && 'r' in t ? '50%' : '12px' });
    tip.innerHTML = `<div class="k">${i + 1} / ${steps.length} · ${s.title}</div><div class="x">${s.text}</div><div class="row"><div class="dots">${steps.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</div><div style="display:flex;gap:6px"><button class="btn small" data-a="skip">跳过</button><button class="btn small primary" data-a="next">${i === steps.length - 1 ? '开始徒步' : '下一步'}</button></div></div>`;
    const tw = 290;
    const th = tip.offsetHeight || 150;
    let tx = rect.x + rect.w + 16;
    let ty = rect.y + rect.h / 2 - th / 2;
    if (tx + tw > window.innerWidth - 12) tx = rect.x - tw - 16;
    if (tx < 12) {
      tx = Math.max(12, Math.min(window.innerWidth - tw - 12, rect.x + rect.w / 2 - tw / 2));
      ty = rect.y + rect.h + 16;
      if (ty + th > window.innerHeight - 12) ty = rect.y - th - 16;
    }
    ty = Math.max(12, Math.min(window.innerHeight - th - 12, ty));
    Object.assign(tip.style, { left: tx + 'px', top: ty + 'px' });
  }
  tip.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('[data-a]')?.getAttribute('data-a');
    if (a === 'skip') close();
    if (a === 'next') {
      i++;
      if (i >= steps.length) close();
      else place();
    }
  });
  window.addEventListener('resize', place);
  place();
  requestAnimationFrame(place);
}
