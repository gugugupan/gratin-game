import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";
import pngToIco from "png-to-ico";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "brand");
const pub = path.join(root, "public");
const font = opentype.parse(fs.readFileSync(path.join(out, "src/DelaGothicOne-Regular.ttf")).buffer);

export const COLORS = {
  terracotta: "#C9472D",
  cheese: "#F5B935",
  cheeseLight: "#FFE08A",
  crust: "#4A2814",
  cream: "#FFF1D6",
  milk: "#FFF6E6",
};

const STRAND =
  "M0 18 C40 14 70 30 100 24 C130 18 160 16 200 20 L200 34 C186 34 182 40 180 50 C178 58 168 58 167 50 C166 42 160 38 150 38 C130 40 120 44 112 42 C106 41 104 46 103 54 C102 62 92 62 92 54 C92 46 86 42 70 42 C46 42 30 38 0 36 Z";
const STRAND_SHINE = "M10 22 C40 19 70 31 100 27";
const ICON_DRIP =
  "M0 0 H96 V14 C88 14 86 18 85 26 C84 34 74 34 74 26 C74 20 70 16 62 16 C54 16 50 20 49 30 C48 40 36 40 36 30 C36 20 30 16 20 16 C12 16 10 18 9 22 C8 28 0 28 0 22 Z";

const n = (v) => {
  if (!Number.isFinite(v)) throw new Error(`bad coordinate ${v}`);
  return String(Math.round(v * 100) / 100);
};
const pathData = (p) =>
  p.commands
    .map((c) => {
      if (c.type === "M" || c.type === "L") return `${c.type}${n(c.x)} ${n(c.y)}`;
      if (c.type === "Q") return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
      if (c.type === "C") return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
      return "Z";
    })
    .join("");
const glyphs = (text, x, y, size) => pathData(font.getPath(text, x, y, size));
const advance = (text, size) => font.getAdvanceWidth(text, size);

function wordmark({ ink, cheese, shine, subtitle = false }) {
  const size = 160;
  const pad = 24;
  const baseline = pad + size * 0.9;
  const head = "グラタンゲ";
  const headW = advance(head, size);
  const s = 1.6;
  const strandX = pad + headW + 8;
  const strandY = baseline - 0.38 * size - 27 * s;
  const tailX = strandX + 200 * s + 8;
  const width = Math.ceil(tailX + advance("ム", size) + pad);
  let height = Math.ceil(baseline + size * 0.16 + pad);
  let sub = "";
  if (subtitle) {
    const subSize = 40;
    const spacing = 22;
    const label = "GRATIN GAME";
    const labelW = [...label].reduce((w, c) => w + advance(c, subSize) + spacing, -spacing);
    let x = (width - labelW) / 2;
    const y = height + subSize * 0.6;
    const parts = [...label].map((c) => {
      const d = glyphs(c, x, y, subSize);
      x += advance(c, subSize) + spacing;
      return d;
    });
    sub = `<path fill="${cheese === ink ? ink : COLORS.terracotta}" d="${parts.join(" ")}"/>`;
    height = Math.ceil(y + pad);
  }
  const shineEl = shine
    ? `<path d="${STRAND_SHINE}" fill="none" stroke="${shine}" stroke-width="4" stroke-linecap="round"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="グラタンゲーム">
<path fill="${ink}" d="${glyphs(head, pad, baseline, size)}"/>
<g transform="translate(${strandX.toFixed(2)} ${strandY.toFixed(2)}) scale(${s})"><path fill="${cheese}" d="${STRAND}"/>${shineEl}</g>
<path fill="${ink}" d="${glyphs("ム", tailX, baseline, size)}"/>
${sub}
</svg>
`;
}

function icon({ bg = COLORS.terracotta, cheese = COLORS.cheese, ink = COLORS.milk, rounded = true } = {}) {
  const size = 96;
  const glyphSize = 52;
  const p = font.getPath("グ", 0, 0, glyphSize);
  const bb = p.getBoundingBox();
  const gx = (size - (bb.x2 - bb.x1)) / 2 - bb.x1;
  const gy = 60 - (bb.y1 + bb.y2) / 2;
  const clip = rounded ? `<clipPath id="r"><rect width="96" height="96" rx="26"/></clipPath>` : `<clipPath id="r"><rect width="96" height="96"/></clipPath>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="512" height="512" role="img" aria-label="グラタンゲーム">
<defs>${clip}</defs>
<g clip-path="url(#r)">
<rect width="96" height="96" fill="${bg}"/>
<path fill="${cheese}" d="${ICON_DRIP}"/>
<path fill="${ink}" d="${pathData(font.getPath("グ", gx, gy, glyphSize))}"/>
</g>
</svg>
`;
}

function og(wm) {
  const [, w, h] = wm.match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
  const scale = 900 / w;
  const inner = wm.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const ty = (630 - h * scale) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<rect width="1200" height="630" fill="${COLORS.cream}"/>
<path fill="${COLORS.cheese}" d="M0 0 H1200 V40 C1150 40 1140 70 1136 110 C1132 150 1092 150 1090 110 C1088 76 1070 60 1030 60 C990 60 976 80 972 130 C968 180 920 180 918 130 C916 90 900 64 840 64 C700 64 520 50 300 56 C230 58 216 76 212 104 C208 140 170 140 168 104 C166 70 140 56 80 56 C40 56 26 64 22 80 C18 100 0 100 0 80 Z"/>
<g transform="translate(150 ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">${inner}</g>
</svg>
`;
}

const png = (svg, width) => new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
const write = (file, data) => {
  fs.writeFileSync(file, data);
  console.log(path.relative(root, file));
};

const light = wordmark({ ink: COLORS.crust, cheese: COLORS.cheese, shine: COLORS.cheeseLight });
const dark = wordmark({ ink: COLORS.milk, cheese: COLORS.cheese, shine: COLORS.cheeseLight });
const mono = wordmark({ ink: COLORS.crust, cheese: COLORS.crust });
const stacked = wordmark({ ink: COLORS.crust, cheese: COLORS.cheese, shine: COLORS.cheeseLight, subtitle: true });
const iconSvg = icon();
const iconSquare = icon({ rounded: false });
const ogSvg = og(stacked);

write(path.join(out, "wordmark.svg"), light);
write(path.join(out, "wordmark-dark.svg"), dark);
write(path.join(out, "wordmark-mono.svg"), mono);
write(path.join(out, "wordmark-stacked.svg"), stacked);
write(path.join(out, "icon.svg"), iconSvg);
write(path.join(out, "icon-square.svg"), iconSquare);
write(path.join(out, "og-image.svg"), ogSvg);
write(path.join(out, "wordmark@2x.png"), png(light, 1600));
write(path.join(out, "wordmark-dark@2x.png"), png(dark, 1600));
for (const s of [16, 32, 48, 192, 512]) write(path.join(out, `icon-${s}.png`), png(iconSvg, s));
write(path.join(out, "apple-touch-icon.png"), png(iconSquare, 180));
write(path.join(out, "og-image.png"), png(ogSvg, 1200));
write(path.join(out, "favicon.ico"), await pngToIco([16, 32, 48].map((s) => png(iconSvg, s))));

for (const f of ["favicon.ico", "icon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "og-image.png", "wordmark.svg", "wordmark-dark.svg"]) {
  fs.copyFileSync(path.join(out, f), path.join(pub, f));
}
