// usage: node record-toy-legion.mjs <out-dir> [width] [height] [lang] [orbit]
// Needs the toy-legion dev server on 5286 (DEV hook window.__game). Records the lobby, then a
// full vs-AI match on 城堡草原 where red is played by the engine AI too, until the result panel.
// With `orbit` the HUD is hidden and the camera circles the board like the lobby (home-page preview).
// log.json marks lobby/start, every crush (piece placed on an enemy), star claims and the end.
import fs from "node:fs";
import { open, capture } from "./lib/rec.mjs";
const out = process.argv[2] ?? "out/raw-toy-legion";
const width = Number(process.argv[3] ?? 720);
const height = Number(process.argv[4] ?? 720);
const lang = process.argv[5] ?? "ja";
const orbit = process.argv[6] === "orbit";
const { browser, page } = await open(`http://localhost:5286/?lang=${lang}`, {
  width, height,
  storage: { "toy-legion:tips": JSON.stringify({ off: true, seen: [] }) },
});
await page.waitForFunction(() => window.__game && !document.getElementById("loader"), null, { timeout: 30000 });
await page.waitForTimeout(1200);
const log = [];
const mark = (what) => log.push({ t: Date.now() / 1000, what });
const meta = await capture(page, out, async () => {
  mark("lobby");
  await page.waitForTimeout(2000);
  await page.click("#lobby-start");
  await page.waitForTimeout(900);
  await page.click('[data-mode="ai"]');
  await page.waitForTimeout(500);
  await page.click("#setup-go");
  if (orbit) await page.evaluate(() => window.__game.videoMode(true));
  mark("start");
  for (let i = 0; i < 400; i++) {
    const r = await page.evaluate(async () => {
      const g = window.__game, s = g.debugState();
      if (s.winner) return { end: true };
      if (s.turn !== "red" || g.busy) { await new Promise((r) => setTimeout(r, 150)); return {}; }
      const E = await import("/src/engine/index.ts");
      const a = E.chooseAction(s, "normal");
      const crush = a.type === "place" && s.stacks[a.node].at(-1)?.side === "blue";
      await new Promise((r) => setTimeout(r, 450));
      const before = s.medals.red;
      await g.act(a);
      return { crush, stars: g.debugState().medals.red > before };
    });
    if (r.end) break;
    if (r.crush) mark("crush");
    if (r.stars) mark("stars");
  }
  mark(`end:${await page.evaluate(() => `${window.__game.debugState().winner}-${window.__game.debugState().endReason}`)}`);
  await page.waitForSelector("#over:not([hidden])", { timeout: 20000 });
  mark("result");
  await page.waitForTimeout(2200);
});
fs.writeFileSync(out + "/log.json", JSON.stringify(log.map((e) => ({ ...e, s: +(e.t - meta.frames[0]).toFixed(2) }))));
console.log(log.map((e) => `${e.what}@${(e.t - meta.frames[0]).toFixed(2)}`).join(" "));
await page.screenshot({ path: out + "/last.png" });
await browser.close();
