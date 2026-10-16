import fs from 'node:fs';
// Outlines the title in Yuji Syuku (SIL OFL 1.1) so the page needs no web font.
// Usage: npm i --no-save @fontsource/yuji-syuku && node tools/build-title.mjs yuji-syuku public/title.svg
import * as opentype from 'opentype.js';

const fam = process.argv[2];
const out = process.argv[3];
const files = { 枯: 73, 山: 114, 水: 115, 庭: 101 };
const font = (ch) => {
    const b = fs.readFileSync(`node_modules/@fontsource/${fam}/files/${fam}-${files[ch]}-400-normal.woff`);
    return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  };
const n = (v) => {
  if (!Number.isFinite(v)) throw new Error('bad ' + v);
  return String(Math.round(v * 10) / 10);
};
const pd = (p) =>
  p.commands
    .map((c) =>
      c.type === 'M' || c.type === 'L'
        ? `${c.type}${n(c.x)} ${n(c.y)}`
        : c.type === 'Q'
          ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
          : c.type === 'C'
            ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
            : 'Z',
    )
    .join('');

const W = 900;
const H = 340;
const size = 210;
const gap = 18;
const chars = ['枯', '山', '水'];
const adv = chars.map((c) => font(c).charToGlyph(c).advanceWidth * (size / font(c).unitsPerEm));
const total = adv.reduce((a, b) => a + b, 0) + gap * 2;
let x = (W - total) / 2 - 40;
const baseline = 232;
const glyphs = chars.map((c, i) => {
  const d = pd(font(c).getPath(c, x, baseline, size));
  x += adv[i] + gap;
  return d;
});
const sealX = x + 2;
const sealY = 58;
const sealS = 58;
const seal = pd(font('庭').getPath('庭', sealX + 6, sealY + sealS - 11, 46));

const cx = 790;
const cy = 278;
const ripples = Array.from({ length: 6 }, (_, i) => {
  const r = 34 + i * 17;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.5}" ry="${r * 0.5}"/>`;
}).join('');
const rakes = Array.from({ length: 5 }, (_, i) => {
  const y = 262 + i * 11;
  return `<path d="M30 ${y} C220 ${y - 2} 420 ${y + 2} ${cx - 70 - i * 18} ${y}"/>`;
}).join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<filter id="ink" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter>
<filter id="halo" x="-10%" y="-20%" width="120%" height="140%"><feGaussianBlur stdDeviation="14"/></filter>
<linearGradient id="fade" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="#fff" stop-opacity="1"/></linearGradient>
<mask id="fadeMask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
</defs>
<g fill="none" stroke="#7d705b" stroke-width="2.2" stroke-opacity=".38" stroke-linecap="round">
<g mask="url(#fadeMask)">${rakes}</g>${ripples}</g>
<g transform="translate(${cx} ${cy}) scale(.72)"><path d="M-40 6 C-44 -16 -20 -34 4 -32 C30 -30 46 -12 42 6 C38 22 14 28 -6 27 C-26 26 -38 20 -40 6Z" fill="#5f6466"/><path d="M-22 -14 C-14 -26 6 -27 18 -20 C4 -18 -10 -12 -22 -14Z" fill="#8c9193"/></g>
<g fill="#fbf6ea" opacity=".9" filter="url(#halo)">${glyphs.map((d) => `<path d="${d}"/>`).join('')}</g>
<g fill="#1f160e" filter="url(#ink)">${glyphs.map((d) => `<path d="${d}"/>`).join('')}</g>
<g transform="rotate(-5 ${sealX + sealS / 2} ${sealY + sealS / 2})"><rect x="${sealX}" y="${sealY}" width="${sealS}" height="${sealS}" rx="7" fill="#b23a26"/><path d="${seal}" fill="#fbf1e6"/></g>
</svg>`;
fs.writeFileSync(out, svg);
console.log(out, svg.length);
