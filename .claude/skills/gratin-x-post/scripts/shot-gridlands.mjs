// usage: node shot-gridlands.mjs <level-id e.g. 5-3> <out-dir>
// Shoots the live site in Japanese: <id>.png (unsolved) and <id>-solved.png (?answer=1, banner removed).
// Post the unsolved one first and keep the answer image for a self-reply — never spoil in the main post.
import fs from "node:fs";
import { chromium } from "playwright-core";
const [level, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
await ctx.addInitScript(() => localStorage.setItem("rlp-locale", "ja"));
const p = await ctx.newPage();
for (const [q, name] of [["unlock=all", `gridlands-${level}.png`], ["answer=1", `gridlands-${level}-solved.png`]]) {
  await p.goto(`https://gratin-game.com/gridlands/?${q}#/levels/${level}`);
  await p.waitForTimeout(3500);
  await p.evaluate(() => { for (const el of document.querySelectorAll("div,p,section")) if (el.children.length < 3 && el.textContent.startsWith("答えモード")) { el.remove(); break; } });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${outDir}/${name}` });
  console.log(`${outDir}/${name}`);
}
await b.close();
