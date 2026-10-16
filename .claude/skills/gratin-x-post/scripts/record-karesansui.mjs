// usage: node record-karesansui.mjs <out-dir> [level-index] [slow-steps]
// Needs the karesansui dev server on 5270 (DEV hooks window.__ks). Records the hazy menu, the
// torii intro, the panda raking the level's stored solution (first <slow-steps> at walking pace,
// the rest quicker) and the close-up with the result card. The game has no audio.
import fs from "node:fs";
import { open, capture } from "./lib/rec.mjs";
const out = process.argv[2] ?? "out/raw-karesansui";
const levelIndex = Number(process.argv[3] ?? 2);
const slow = Number(process.argv[4] ?? 18);
const { browser, page } = await open("http://localhost:5270/", {
  storage: {
    "gratin:lang": "ja",
    "karesansui:tutorial:puzzle": "1",
    "karesansui:tutorial:random": "1",
    "karesansui:tutorial:free": "1",
  },
});
await page.waitForFunction(() => window.__ks && !document.getElementById("loading"), null, { timeout: 30000 });
await page.evaluate(() => window.__ks.videoMode());
await page.waitForTimeout(1500);
const log = [];
const mark = (what) => log.push({ t: Date.now() / 1000, what });
const meta = await capture(page, out, async () => {
  mark("menu");
  await page.waitForTimeout(2200);
  await page.evaluate((i) => window.__ks.start("puzzle", { level: window.__ks.levels[i] }), levelIndex);
  mark("intro");
  await page.waitForFunction(() => window.__ks.phase === "play", null, { timeout: 15000 });
  mark("play");
  await page.waitForTimeout(400);
  const n = await page.evaluate(() => window.__ks.game.level.solution.length);
  for (let k = 1; k <= n; k++) {
    await page.evaluate((k) => window.__ks.setPath(window.__ks.game.level.solution.slice(0, k)), k);
    await page.waitForTimeout(k <= slow ? 330 : 70);
  }
  await page.evaluate(() => window.__ks.setPath(window.__ks.game.level.solution, true));
  mark("done");
  await page.waitForFunction(() => window.__ks.phase === "result", null, { timeout: 20000 });
  mark("result");
  await page.waitForTimeout(2200);
});
fs.writeFileSync(out + "/log.json", JSON.stringify(log.map((e) => ({ ...e, s: +(e.t - meta.frames[0]).toFixed(2) }))));
console.log(log.map((e) => `${e.what}@${(e.t - meta.frames[0]).toFixed(2)}`).join(" "));
await page.screenshot({ path: out + "/last.png" });
await browser.close();
