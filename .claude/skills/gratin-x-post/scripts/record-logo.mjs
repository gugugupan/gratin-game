// usage: node record-logo.mjs <out.mp4> [seconds=5.4]
// Wordmark + brand/loader.svg (cheese strand dripping into a gratin dish) on cream, 1080² silent mp4.
// The loader loops every 1.8 s, so keep the length a multiple of 1.8 for a seamless X autoplay loop.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";
const repo = path.resolve(import.meta.dirname, "../../../..");
const [out, secs = "5.4"] = process.argv.slice(2);
const work = fs.mkdtempSync(path.join(os.tmpdir(), "gratin-logo-"));
fs.mkdirSync(path.join(work, "frames"));
fs.writeFileSync(path.join(work, "index.html"), `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;width:720px;height:720px;background:#FFF1D6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px}</style>
<img src="file://${repo}/brand/wordmark.svg" width="560"><img src="file://${repo}/brand/loader.svg" width="420">`);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 720, height: 720 }, deviceScaleFactor: 1.5 });
const p = await ctx.newPage();
await p.goto("file://" + path.join(work, "index.html"));
await p.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(p);
const frames = [];
cdp.on("Page.screencastFrame", (f) => {
  frames.push(f);
  cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send("Page.startScreencast", { format: "png", maxWidth: 1080, maxHeight: 1080 });
await p.waitForTimeout((Number(secs) + 2.5) * 1000);
await cdp.send("Page.stopScreencast");
await b.close();
frames.sort((a, c) => a.metadata.timestamp - c.metadata.timestamp);
const lines = ["ffconcat version 1.0"];
frames.forEach((f, i) => {
  const name = `frames/${String(i).padStart(5, "0")}.png`;
  fs.writeFileSync(path.join(work, name), Buffer.from(f.data, "base64"));
  const next = frames[i + 1]?.metadata.timestamp ?? f.metadata.timestamp + 0.03;
  lines.push(`file '${name}'`, `duration ${(next - f.metadata.timestamp).toFixed(4)}`);
});
fs.writeFileSync(path.join(work, "list.txt"), lines.join("\n") + "\n");
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(work, "list.txt"),
  "-vf", `trim=start=1:duration=${secs},setpts=PTS-STARTPTS,fps=30,scale=1080:1080:flags=lanczos,format=yuv420p`,
  "-c:v", "libx264", "-crf", "18", "-preset", "slow", "-movflags", "+faststart", path.resolve(out)]);
fs.rmSync(work, { recursive: true, force: true });
console.log(out);
