// usage: node record-pittari-yaki.mjs <out-dir> [width] [height] [lang] [seconds] [players]
// Needs the pittari-yaki dev server on 5290 (DEV hook window.__pittari). Starts a game with seat 1 as a
// human played by the engine AI through real clicks (so the card-flight effects run) and AI opponents,
// then records for <seconds>. log.json marks serve / burn / fire / cool / cheese / extra / pass / win.
import fs from "node:fs";
import { open, capture } from "./lib/rec.mjs";
const out = process.argv[2] ?? "out/raw-pittari";
const width = Number(process.argv[3] ?? 720);
const height = Number(process.argv[4] ?? 720);
const lang = process.argv[5] ?? "ja";
const seconds = Number(process.argv[6] ?? 45);
const players = Number(process.argv[7] ?? 3);
const seats = [0, 1, 2, 3].map((i) => ({ mode: i === 0 ? "human" : i < players ? "ai" : "off", name: "" }));
const { browser, page } = await open(`http://localhost:5290/?lang=${lang}`, {
  width, height,
  storage: { "pittari:seats": JSON.stringify(seats) },
});
await page.waitForFunction(() => window.__pittari && document.querySelector("[data-act=start]"), null, { timeout: 30000 });
await page.waitForTimeout(800);
const log = [];
const mark = (what) => log.push({ t: Date.now() / 1000, what });
const meta = await capture(page, out, async () => {
  mark("menu");
  await page.waitForTimeout(1500);
  await page.click("[data-act=start]");
  mark("start");
  const end = Date.now() + seconds * 1000;
  let lastView = null;
  while (Date.now() < end) {
    const r = await page.evaluate(async () => {
      const g = window.__pittari.game;
      const seen = {
        serve: !!document.querySelector(".plate.served, .mp.served"),
        burn: !!document.querySelector(".plate.burnt, .mp.burnt"),
        stamp: !!document.querySelector(".stamp"),
        view: document.querySelector(".me .nm")?.textContent,
        result: !!document.querySelector(".result"),
      };
      if (!g || g.phase === "over") return { ...seen, over: true };
      if (g.players[g.actor].ai) return seen;
      if (g.phase === "draw") {
        const d = document.querySelector("[data-act=draw]:not(:disabled)");
        if (!d) return seen;
        await new Promise((r) => setTimeout(r, 380));
        d.click();
        return seen;
      }
      if (!document.querySelector(".plate:not(:disabled), .mp.target:not(:disabled), .opp.pick, .me.pick")) return seen;
      const { aiChoose } = await import("/src/ai.ts");
      const c = aiChoose(g);
      const kind = g.drawn?.kind;
      await new Promise((r) => setTimeout(r, 650));
      const sel = c.kind === "player" ? `[data-act=player][data-p="${c.player}"]` : `[data-plate="${c.kind === "target" ? c.player : g.actor}-${c.plate}"]`;
      document.querySelector(sel)?.click();
      return { ...seen, acted: kind };
    });
    if (r.acted && r.acted !== "num") mark(r.acted);
    if (r.serve && log.at(-1)?.what !== "serve") mark("serve");
    if (r.burn && log.at(-1)?.what !== "burn") mark("burn");
    if (r.view && r.view !== lastView) { if (lastView) mark("pass"); lastView = r.view; }
    if (r.over) { mark("win"); await page.waitForTimeout(3000); break; }
    await page.waitForTimeout(120);
  }
});
fs.writeFileSync(out + "/log.json", JSON.stringify(log.map((e) => ({ ...e, s: +(e.t - meta.frames[0]).toFixed(2) }))));
console.log(log.map((e) => `${e.what}@${(e.t - meta.frames[0]).toFixed(2)}`).join(" "));
await page.screenshot({ path: out + "/last.png" });
await browser.close();
