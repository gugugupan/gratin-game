// usage: node shot-clickton.mjs <out-dir> [tiles=40] [theme=classic] [zoom=1.6] [phase=0.8]
// Needs the Clickton dev server (DEV-only hooks window.__clickton, ?demo=N). phase: 0.3 day, 0.66 dusk, 0.8 night.
// ?demo picks a random seed of the theme, so run 2–3 times and keep the best frame.
import fs from "node:fs";
import { chromium } from "playwright-core";
const [outDir, n = "40", theme = "classic", zoom = "1.6", phase = "0.8"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=metal"] });
const ctx = await b.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1.5 });
await ctx.addInitScript(() => { localStorage.setItem("gratin:lang", "ja"); localStorage.setItem("clickton.tutorial", "done"); localStorage.setItem("clickton.quests", "closed"); });
const p = await ctx.newPage();
await p.goto(`http://localhost:5189/?demo=${n}&theme=${theme}`);
await p.waitForFunction(() => window.__clickton?.dayNight);
await p.waitForTimeout(3000);
await p.addStyleTag({ content: "body > *:not(canvas):not(#app){visibility:hidden!important} #app > *:not(canvas){visibility:hidden!important} canvas{visibility:visible!important}" });
await p.evaluate((z) => { const w = window.__clickton.world; const cam = w.camera ?? w.controls.object; cam.zoom *= z; cam.updateProjectionMatrix(); w.controls.update?.(); }, Number(zoom));
await p.evaluate((ph) => { window.__clickton.dayNight.mode = "auto"; window.__clickton.dayNight.phase = ph; }, Number(phase));
await p.waitForTimeout(4000);
// Frontier glow, hover ghost and the tray's tile-preview canvases would otherwise show in the shot.
await p.evaluate(() => {
  const w = window.__clickton.world;
  w.setFrontier([]);
  w.hideGhost();
  const big = [...document.querySelectorAll("canvas")].sort((a, b) => b.width * b.height - a.width * a.height)[0];
  for (const c of document.querySelectorAll("canvas")) if (c !== big) c.style.setProperty("visibility", "hidden", "important");
});
await p.waitForTimeout(500);
const out = `${outDir}/clickton-${theme}-${phase}-${Date.now()}.png`;
await p.screenshot({ path: out });
console.log(out);
await b.close();
