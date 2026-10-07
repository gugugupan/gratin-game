import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const TAP = `(() => {
  const orig = AudioNode.prototype.connect;
  const taps = new Map();
  window.__taps = taps;
  AudioNode.prototype.connect = function (dest, ...rest) {
    const r = orig.call(this, dest, ...rest);
    if (dest instanceof AudioDestinationNode) {
      let tap = taps.get(dest.context);
      if (!tap) { tap = dest.context.createMediaStreamDestination(); taps.set(dest.context, tap); }
      orig.call(this, tap);
    }
    return r;
  };
  window.__startRec = () => {
    window.__recs = [...taps.values()].map((tap) => {
      const chunks = [];
      const mr = new MediaRecorder(tap.stream, { mimeType: "audio/webm;codecs=opus", audioBitsPerSecond: 192000 });
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.start();
      return { mr, chunks };
    });
    return { t: Date.now(), n: window.__recs.length };
  };
  window.__stopRec = async () => Promise.all(window.__recs.map(({ mr, chunks }) => new Promise((res) => {
    mr.onstop = async () => {
      const buf = await new Blob(chunks, { type: "audio/webm" }).arrayBuffer();
      let s = ""; const u = new Uint8Array(buf);
      for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
      res(btoa(s));
    };
    mr.stop();
  })));
})();`;

export async function open(url, { size = 720, scale = 1.5, headless = true, storage = {} } = {}) {
  const browser = await chromium.launch({
    headless,
    args: ["--autoplay-policy=no-user-gesture-required", "--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=metal"],
  });
  const context = await browser.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: scale });
  await context.addInitScript(TAP);
  await context.addInitScript((st) => { for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); }, storage);
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && console.log("[page]", m.text()));
  await page.goto(url);
  return { browser, page };
}

export async function capture(page, outDir, run) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, "frames"), { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", (f) => {
    frames.push({ ts: f.metadata.timestamp, data: f.data });
    cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  const rec = await page.evaluate(() => window.__startRec());
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1080, maxHeight: 1080, everyNthFrame: 1 });
  await run();
  await cdp.send("Page.stopScreencast");
  const audio = await page.evaluate(() => window.__stopRec());
  frames.forEach((f, i) => fs.writeFileSync(path.join(outDir, "frames", `${String(i).padStart(5, "0")}.jpg`), Buffer.from(f.data, "base64")));
  audio.forEach((b, i) => fs.writeFileSync(path.join(outDir, `audio${i}.webm`), Buffer.from(b, "base64")));
  const meta = { audioStart: rec.t / 1000, frames: frames.map((f) => f.ts) };
  fs.writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta));
  const span = frames.at(-1).ts - frames[0].ts;
  console.log(`frames=${frames.length} span=${span.toFixed(2)}s fps=${(frames.length / span).toFixed(1)} audioTracks=${audio.length} audioLead=${(frames[0].ts - meta.audioStart).toFixed(3)}s`);
  return meta;
}
