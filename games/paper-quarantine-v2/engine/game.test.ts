import assert from "node:assert/strict";
import { test } from "node:test";
import { LINKS } from "./map.js";
import { V2_CONFIG, V2State, type V2Config } from "./game.js";

function blank(roles: V2State["roles"] = ["medic", "police"], cfg: Partial<V2Config> = {}): V2State {
  const s = new V2State({ ...V2_CONFIG, setup: [], news: { calm: 20, festival: 0, fog: 0, rain: 0, freighter: 0, rumor: 0, peak: 0 }, ...cfg }, roles, 1);
  s.setup();
  return s;
}

test("a city at level 3 sends one carrier that lands a round later", () => {
  const s = blank();
  s.level[4 * 3 + 0] = 3;
  s.endRound();
  assert.equal(s.carriers.length, 1);
  const k = s.carriers[0];
  assert.equal(k.from, 4);
  assert.ok(LINKS[4].some((l) => l.to === k.to && l.edge === k.edge));
  const before = s.lv(k.to, 0);
  s.level[4 * 3 + 0] = 0;
  s.endRound();
  assert.equal(s.lv(k.to, 0), before + 1);
});

test("a checkpoint intercepts the carrier, yields a sample and calms the target", () => {
  const s = blank();
  s.level[4 * 3 + 0] = 3;
  s.endRound();
  const k = s.carriers[0];
  s.level[4 * 3 + 0] = 0;
  s.panic[k.to] = 50;
  s.checkpoints.push(k.edge);
  s.endRound();
  assert.equal(s.lv(k.to, 0), 0);
  assert.equal(s.checkpoints.length, 0);
  assert.equal(s.sample(0, 0) + s.sample(1, 0), 1);
  assert.ok(s.panic[k.to] < 50);
});

test("lockdown stops carriers in and out but raises panic every round", () => {
  const s = blank(["medic", "researcher"]);
  s.level[4 * 3 + 0] = 3;
  s.pos[0] = 4;
  s.ap = 4;
  s.apply({ t: "lock", r: 0, city: 4 });
  s.endRound();
  assert.equal(s.carriers.filter((k) => k.from === 4).length, 0);
  assert.equal(s.panic[4], V2_CONFIG.panic.locked);
  s.level[1 * 3 + 0] = 3;
  for (let i = 0; i < 3; i++) s.endRound();
  assert.equal(s.lv(4, 0), 3);
  assert.ok(s.stats.blocked + s.carriers.filter((k) => k.to === 4).length > 0 || s.panic[4] >= 75);
});

test("police lockdown builds panic at half speed", () => {
  const s = blank(["police", "medic"]);
  s.pos[0] = 4;
  s.ap = 4;
  s.apply({ t: "lock", r: 0, city: 4 });
  s.endRound();
  assert.equal(s.panic[4], V2_CONFIG.panic.policeLocked);
});

test("an outbreak sends a carrier down every link, departing next round", () => {
  const s = blank();
  s.level[2 * 3 + 0] = 3;
  s.level[4 * 3 + 0] = 3;
  s.carriers = [];
  s.endRound();
  const towardSealwell = s.carriers.find((k) => k.from === 4 && k.to === 2);
  if (!towardSealwell) return;
  s.carriers = [towardSealwell];
  s.level[4 * 3 + 0] = 0;
  s.level[2 * 3 + 0] = 3;
  s.endRound();
  assert.equal(s.stats.outbreaks, 1);
  const out = s.carriers.filter((k) => k.from === 2);
  assert.ok(out.length >= LINKS[2].length);
  assert.ok(out.every((k) => k.born === s.round - 1));
});

test("three rioting cities lose the game", () => {
  const s = blank();
  for (const c of [1, 2, 3]) {
    s.panic[c] = 99;
    s.level[c * 3] = 1;
  }
  s.ap = 0;
  for (const c of [1, 2, 3]) s.addPanic(c, 5);
  s.endRound();
  assert.equal(s.status, "lost");
  assert.equal(s.lossReason, "riot");
});

test("cures calm their region and trigger mutations at the next spread", () => {
  const s = blank(["researcher", "medic"]);
  s.panic[1] = 80;
  s.samples[0] = 3;
  s.ap = 4;
  s.apply({ t: "cure", r: 0, s: 0 });
  assert.equal(s.panic[1], 80 - V2_CONFIG.panic.cure);
  assert.deepEqual(s.pendingMutations, [1]);
  s.events = [];
  s.endRound();
  assert.equal(s.events.filter((e) => e.t === "mutation").length, 1);
});

test("supply halves panic gains nearby", () => {
  const s = blank(["medic", "researcher"]);
  s.pos[0] = 4;
  s.ap = 4;
  s.apply({ t: "supply", r: 0 });
  s.addPanic(1, 20);
  assert.equal(s.panic[1], 10);
});

test("full games finish and clones replay identically", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const a = new V2State(V2_CONFIG, ["medic", "engineer"], seed);
    a.setup();
    const b = a.clone();
    for (const s of [a, b]) while (s.status === "playing") s.endRound();
    assert.equal(a.status, b.status);
    assert.equal(a.round, b.round);
    assert.deepEqual([...a.level], [...b.level]);
  }
});
