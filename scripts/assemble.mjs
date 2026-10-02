import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dist = path.join(root, "dist");

const builds = JSON.parse(fs.readFileSync(path.join(root, "games/builds.json"), "utf8"));

if (!fs.existsSync(path.join(dist, "index.html"))) {
  throw new Error("dist/index.html missing — run the site build first");
}

for (const [id, from] of Object.entries(builds)) {
  const src = path.join(root, from);
  if (!fs.existsSync(path.join(src, "index.html"))) throw new Error(`${from}/index.html missing — build ${id} first`);
  const dest = path.join(dist, id);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`${from} -> dist/${id}`);
}
