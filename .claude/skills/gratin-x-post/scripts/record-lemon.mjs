// usage: node record-lemon.mjs <seconds> <out-dir> <fight-number>
// Needs the cc-lemon-web dev server on 5188 (DEV-only window.app). The bot reads battle.enemyChoice
// (decided on beat 0) and answers on beat 3, so every press is PERFECT; log.json gives per-round
// timestamps so you can pick a window that ends just after the KO.
import fs from "node:fs";
import { open, capture } from "./lib/rec.mjs";
const secs = Number(process.argv[2] ?? 20);
const out = process.argv[3] ?? "out/raw-lemon";
const round = Number(process.argv[4] ?? 1);
const { browser, page } = await open("http://localhost:5188/", { storage: { "gratin:lang": "ja" } });
await page.waitForFunction(() => window.app);
await page.waitForTimeout(2500);
await page.evaluate(async (round) => {
  const app = window.app;
  await app.clock.unlock();
  app.startRun();
  while (app.run.round < round) app.run.finishBattle(true, 5);
  app.beginBattle();
  window.__log = [];
  const pick = (b) => {
    const e = b.enemyChoice, en = b.player.energy;
    if (e === "attack" || e === "special") return "guard";
    if (en >= 3) return "special";
    return "charge";
  };
  const orig = app.clock.onBeat;
  window.__bot = (b) => {
    const battle = app.battle;
    if (!battle || battle.finished) return;
    if (b % 4 === 3 && !battle.isRestBar(Math.floor(b / 4))) {
      const a = pick(battle), e = battle.enemyChoice;
      app.act(a, { timeStamp: performance.now() });
      window.__log.push({ t: Date.now() / 1000, a, e, php: battle.player.hp, ehp: battle.enemy.hp, fin: battle.finished });
    }
  };
  const wrap = () => {
    const cur = app.clock.onBeat;
    if (cur.__wrapped) return;
    const w = (b) => { cur(b); window.__bot(b); };
    w.__wrapped = true;
    app.clock.onBeat = w;
  };
  setInterval(wrap, 50);
  wrap();
  const iv = setInterval(() => { if (app.battle?.finished) { window.__log.push({ t: Date.now() / 1000, end: true, php: app.battle.player.hp, ehp: app.battle.enemy.hp }); clearInterval(iv); } }, 20);
}, round);
const meta = await capture(page, out, () => page.waitForTimeout(secs * 1000));
const log = await page.evaluate(() => window.__log);
fs.writeFileSync(out + "/log.json", JSON.stringify(log, null, 1));
for (const l of log) console.log((l.t - meta.frames[0]).toFixed(2), JSON.stringify({ ...l, t: undefined }));
await page.screenshot({ path: out + "/last.png" });
await browser.close();
