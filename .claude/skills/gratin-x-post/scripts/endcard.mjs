// usage: node endcard.mjs <cover.jpg under public/covers> <title> <subtitle> <url-text> <out.png>
// Dela Gothic One has no ▶ or most symbols — text() throws on a missing glyph instead of rendering tofu.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const repo = path.resolve(import.meta.dirname, "../../../..");
const require = createRequire(path.join(repo, "package.json"));
const { Resvg } = require("@resvg/resvg-js");
const opentype = require("opentype.js");
const font = opentype.parse(fs.readFileSync(path.join(repo, "brand/src/DelaGothicOne-Regular.ttf")).buffer);
const C = { terracotta: "#C9472D", cheese: "#F5B935", crust: "#4A2814", cream: "#FFF1D6", milk: "#FFF6E6" };
const r2 = (v) => Math.round(v * 100) / 100;
// opentype.js toPathData() emits NaN; serialize commands ourselves.
const pd = (p) => p.commands.map((c) => c.type === "Z" ? "Z" : c.type === "C" ? `C${r2(c.x1)} ${r2(c.y1)} ${r2(c.x2)} ${r2(c.y2)} ${r2(c.x)} ${r2(c.y)}` : c.type === "Q" ? `Q${r2(c.x1)} ${r2(c.y1)} ${r2(c.x)} ${r2(c.y)}` : `${c.type}${r2(c.x)} ${r2(c.y)}`).join("");
const text = (s, y, size, fill) => {
  for (const ch of s) if (font.charToGlyph(ch).index === 0) throw new Error("missing glyph " + ch);
  const w = font.getAdvanceWidth(s, size);
  return `<path fill="${fill}" d="${pd(font.getPath(s, (1080 - w) / 2, y, size))}"/>`;
};
const wm = fs.readFileSync(path.join(repo, "brand/wordmark.svg"), "utf8");
const [, ww] = wm.match(/viewBox="0 0 (\d+) (\d+)"/).map(Number);
const wmInner = wm.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const drip = "M0 0 H1080 V40 C1040 40 1030 64 1027 96 C1024 128 990 128 988 96 C986 70 970 56 930 56 C880 56 868 74 865 108 C862 142 826 142 824 108 C822 80 808 62 760 62 C620 62 450 52 300 58 C236 60 224 74 221 96 C218 124 186 124 184 96 C182 70 160 58 110 58 C70 58 56 64 53 78 C50 94 34 94 32 78 C30 64 20 56 0 56 Z";

const [cover, title, sub, url, out] = process.argv.slice(2);
const img = "data:image/jpeg;base64," + fs.readFileSync(path.join(repo, "public/covers", cover)).toString("base64");
const cw = 700, ch = cw * 562 / 900, cx = (1080 - cw) / 2, cy = 120;
const pillW = 520, pillY = 790;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
<defs><filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="${C.crust}" flood-opacity="0.25"/></filter>
<clipPath id="c"><rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="22"/></clipPath></defs>
<rect width="1080" height="1080" fill="${C.cream}"/>
<path fill="${C.cheese}" d="${drip}"/>
<rect x="${cx - 12}" y="${cy - 12}" width="${cw + 24}" height="${ch + 24}" rx="32" fill="${C.milk}" filter="url(#sh)"/>
<image href="${img}" x="${cx}" y="${cy}" width="${cw}" height="${ch}" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/>
${text(title, 655, 86, C.crust)}
${text(sub, 732, 38, C.terracotta)}
<rect x="${(1080 - pillW) / 2}" y="${pillY}" width="${pillW}" height="78" rx="39" fill="${C.terracotta}"/>
${text("ブラウザで無料プレイ", pillY + 52, 34, C.milk)}
${text(url, 928, 30, C.crust)}
<g transform="translate(${(1080 - 280) / 2} 965) scale(${(280 / ww).toFixed(4)})">${wmInner}</g>
</svg>`;
fs.writeFileSync(out, new Resvg(svg, { fitTo: { mode: "width", value: 1080 } }).render().asPng());
console.log(out);
