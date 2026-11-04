const K = 'stroke="#1F1A17" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
const TOP = ['#FFF8EC', '#FFF4DA', '#FFEFC6', '#FFE7A8', '#FFDD86', '#FAD06A', '#F5C150', '#EFB241', '#E59F36', '#D6872D', '#8E5124', '#3F2416', '#F5B935'];

type Pt = [number, number];

function steam(x: number): string {
  return `<path d="M${x} 22q-5-5 0-10t0-10" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M${x} 22q-5-5 0-10t0-10" fill="none" stroke="#1F1A17" stroke-width="1" stroke-opacity=".35" stroke-linecap="round"/>`;
}

function sparkle(x: number, y: number, r: number): string {
  const h = r / 2;
  return `<path d="M${x} ${y - r}l${h * 0.5} ${h * 1.5} ${h * 1.5} ${h * 0.5} ${-h * 1.5} ${h * 0.5} ${-h * 0.5} ${h * 1.5} ${-h * 0.5} ${-h * 1.5} ${-h * 1.5} ${-h * 0.5} ${h * 1.5} ${-h * 0.5}Z" fill="#fff" ${K} stroke-width="1.5"/>`;
}

export function heatArt(n: number): string {
  let back = '';
  let top = '';
  let front = '';
  if (n >= 6 && n <= 9) for (let i = 0; i < n - 5; i++) back += steam(24 + i * 10 - (n - 6) * 4);
  if (n === 10) back += `<g fill="#B4B2A9" ${K} stroke-width="1.8"><circle cx="30" cy="14" r="6"/><circle cx="38" cy="10" r="5"/></g>`;
  if (n === 11) back += `<g fill="#5F5E5A" ${K} stroke-width="1.8"><circle cx="22" cy="14" r="8"/><circle cx="34" cy="8" r="9"/><circle cx="47" cy="14" r="7"/></g>`;
  if (n === 12) back += steam(28) + steam(40) + sparkle(10, 18, 6) + sparkle(64, 13, 5);

  const dish = `<ellipse cx="38" cy="44" rx="34" ry="14" fill="#C9472D" ${K}/><path d="M6 44q32 22 64 0" fill="none" stroke="#8E2F1E" stroke-width="2"/>`;
  top += `<ellipse cx="38" cy="39" rx="27" ry="9" fill="${TOP[n]}" ${K}/>`;

  if (n <= 1) {
    const raw: [number, number, string][] = [[24, 38, '#7CC36E'], [34, 36, '#F08B5A'], [44, 40, '#7CC36E'], [52, 37, '#F08B5A'], [30, 42, '#C9472D']];
    for (const [x, y, c] of raw.slice(0, n === 0 ? 5 : 3)) top += `<circle cx="${x}" cy="${y}" r="3.2" fill="${c}" stroke="#1F1A17" stroke-width="1.6"/>`;
  }
  if (n >= 1 && n <= 4) {
    const k = [0, 3, 6, 7, 4][n];
    for (let i = 0; i < k; i++) {
      const x = 20 + i * 5.5;
      const y = 36 + (i % 3) * 2.5;
      const d = `M${x} ${y}l5 ${i % 2 ? -2 : 2}`;
      top += `<path d="${d}" stroke="#E8B73A" stroke-width="2.8" stroke-linecap="round"/><path d="${d}" stroke="#FFE7A0" stroke-width="1.2" stroke-linecap="round"/>`;
    }
  }
  if (n >= 4 && n <= 9) {
    const k = n <= 5 ? 1 : n <= 7 ? 2 : 3;
    const drips: Pt[] = [[26, 47], [40, 49], [52, 47]];
    for (const [x, y] of drips.slice(0, k)) front += `<path d="M${x - 4} ${y - 2}q4 ${6 + n} 8 0" fill="${TOP[n]}" stroke="#1F1A17" stroke-width="1.8"/>`;
  }
  if (n >= 5 && n <= 9) {
    const bubbles: Pt[] = [[24, 38], [36, 36], [48, 39], [30, 41], [44, 42]];
    for (const [x, y] of bubbles.slice(0, n - 4)) top += `<circle cx="${x}" cy="${y}" r="2.6" fill="#FFF3C8" stroke="#1F1A17" stroke-width="1.3"/>`;
  }
  if ((n >= 7 && n <= 10) || n === 12) {
    const spots: Pt[] = [[22, 40], [33, 35], [46, 37], [53, 41], [28, 43], [40, 42]];
    for (const [x, y] of spots.slice(0, n === 12 ? 4 : n - 5)) top += `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.8" fill="${n >= 10 ? '#4A2A18' : '#B5651D'}"/>`;
  }
  if (n === 10) top += `<path d="M12 40q6-4 10 0M54 40q6-4 10 0" fill="none" stroke="#2a1a10" stroke-width="3"/>`;
  if (n === 11) {
    const char: Pt[] = [[20, 38], [34, 36], [48, 40], [30, 42], [56, 37]];
    for (const [x, y] of char) top += `<ellipse cx="${x}" cy="${y}" rx="4" ry="2.2" fill="#0d0a08"/>`;
    front += `<path d="M8 40q-3-8 3-12q0 5 4 6q-1-6 4-9q-2 9 1 15Z" fill="#F79A2A" ${K} stroke-width="1.6"/>`;
  }
  return `<svg class="art" viewBox="0 0 76 62" aria-hidden="true">${back}${dish}${top}${front}</svg>`;
}
