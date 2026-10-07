// usage: node record-clickton.mjs <tiles> <out-dir> <ms-between-tiles> [theme]
// Needs the Clickton dev server on 5189. Places tiles through real clicks + Enter, then orbits ~5.5s.
// 50 tiles at 90ms ≈ 11s of building. Cells under the bottom tray are skipped (elementFromPoint ≠ canvas).
import fs from "node:fs";
import { open, capture } from "./lib/rec.mjs";
const tiles = Number(process.argv[2] ?? 40);
const out = process.argv[3] ?? "out/raw-clickton";
const step = Number(process.argv[4] ?? 220);
const seed = process.argv[5] ?? "";
const { browser, page } = await open("http://localhost:5189/", {
  storage: { "gratin:lang": "ja", "clickton.tutorial": "done", "clickton.quests": "closed" },
});
await page.waitForFunction(() => window.__clickton);
if (seed) {
  const sd = await page.evaluate(async (theme) => {
    const { Game } = await import("/src/core/game.ts");
    const { saveLocal } = await import("/src/save.ts");
    for (let i = 0; i < 5000; i++) {
      const s = (Math.random() * 2 ** 31) | 0;
      const g = new Game(s);
      if (g.mood?.theme.key === theme) { saveLocal(g); return s; }
    }
  }, seed);
  console.log("seed", sd);
  await page.goto("http://localhost:5189/");
  await page.waitForFunction(() => window.__clickton);
}
await page.waitForTimeout(2500);
await page.mouse.click(5, 700);
await page.waitForTimeout(300);
const log = [];
const meta = await capture(page, out, async () => {
  await page.waitForTimeout(600);
  for (let i = 0; i < tiles; i++) {
    const mv = await page.evaluate(() => {
      const { getGame, world } = window.__clickton;
      const g = getGame();
      if (g.finished) return null;
      const b = g.board.getBounds();
      const cx = b ? (b.minX + b.maxX) / 2 : 0, cy = b ? (b.minY + b.maxY) / 2 : 0;
      let best = null;
      const canvas = document.querySelector("canvas");
      const clickable = (c) => { for (const h of [0.1, 0, 0.2]) { const t = world.toScreen(c.x, c.y, h); const p = world.pickCell(t.x, t.y); if (p && p.x === c.x && p.y === c.y && document.elementFromPoint(t.x, t.y) === canvas) return true; } return false; };
      for (const c of g.board.frontier().filter(clickable)) for (const r of [0, 1, 2, 3]) {
        const p = g.preview(c.x, c.y, r);
        if (!p) continue;
        const s = p.total - 1.5 * Math.hypot(c.x - cx, c.y - cy);
        if (!best || s > best.s) best = { s, x: c.x, y: c.y, r };
      }
      if (!best) return null;
      let sc = world.toScreen(best.x, best.y, 0);
      for (const h of [0, 0.05, 0.1, 0.2, 0.3, 0.4]) { const t = world.toScreen(best.x, best.y, h); const c = world.pickCell(t.x, t.y); if (c && c.x === best.x && c.y === best.y && document.elementFromPoint(t.x, t.y) === canvas) { sc = t; break; } }
      window.__n = g.moves.length;
      return { ...best, sx: sc.x, sy: sc.y };
    });
    if (!mv) break;
    await page.mouse.click(mv.sx, mv.sy);
    await page.waitForTimeout(40);
    for (let k = 0; k < mv.r; k++) await page.keyboard.press("r");
    await page.waitForTimeout(40);
    await page.keyboard.press("Enter");
    const ok = await page.evaluate(() => window.__clickton.getGame().moves.length > window.__n);
    if (!ok) {
      const info = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); return { el: el?.id || el?.className || el?.tagName, open: [...document.querySelectorAll(".open")].map((e) => e.id) }; }, [mv.sx, mv.sy]);
      console.log("miss", i, mv.x, mv.y, JSON.stringify(info));
      await page.screenshot({ path: out + "/miss.png" });
      await page.keyboard.press("Escape");
      break;
    }
    log.push({ t: Date.now() / 1000, ok, ...mv });
    await page.waitForTimeout(step);
  }
  log.push({ t: Date.now() / 1000, done: true });
  await page.evaluate(() => { const c = window.__clickton.world.controls; c.autoRotate = true; c.autoRotateSpeed = 2.5; });
  await page.waitForTimeout(5500);
});
fs.writeFileSync(out + "/log.json", JSON.stringify(log));
console.log("placed", log.length - 1, "done at", (log.at(-1).t - meta.frames[0]).toFixed(2));
await page.screenshot({ path: out + "/last.png" });
await browser.close();
