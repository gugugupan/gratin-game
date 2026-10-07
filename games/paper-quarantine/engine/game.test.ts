import assert from "node:assert/strict";
import { test } from "node:test";
import { Action, Chooser, DEFAULT_CONFIG, MUTATIONS, State } from "./game.js";
import { CITIES, EDGES, LINKS, STRAINS } from "./map.js";
import { tutorialState } from "./tutorial.js";

const chooser: Chooser = {
  chooseMutation: () => ({ card: 0, strain: 0 }),
  chooseCancel: () => 0,
};

function blank(roles: State["roles"] = ["medic", "police"]): State {
  const s = new State({ ...DEFAULT_CONFIG, setup: [], epidemics: 0, policeMode: "lockdown", lockdownSample: false }, roles, 1);
  s.setup();
  return s;
}

test("map is connected and symmetric", () => {
  assert.equal(EDGES.length, 30);
  for (let c = 0; c < LINKS.length; c++) {
    for (const { to } of LINKS[c]) assert.ok(LINKS[to].some((l) => l.to === c));
  }
});

test("fourth cube triggers an outbreak into neighbours", () => {
  const s = blank();
  s.infect(1, 0, 3);
  s.infect(1, 0, 1);
  assert.equal(s.outbreaks, 1);
  assert.equal(s.cube(1, 0), 3);
  for (const { to } of LINKS[1]) assert.equal(s.cube(to, 0), 1);
});

test("quarantined edge stops outbreak spread", () => {
  const s = blank();
  const link = LINKS[1].find((l) => l.to === 3)!;
  s.quarantine.push(link.edge);
  s.infect(1, 0, 4);
  assert.equal(s.cube(3, 0), 0);
  assert.equal(s.cube(0, 0), 1);
});

test("breach ignores one quarantine edge per round", () => {
  const s = blank();
  s.mutations[0] |= 1 << MUTATIONS.indexOf("breach");
  for (const { edge } of LINKS[1]) s.quarantine.push(edge);
  s.infect(1, 0, 4);
  const reached = LINKS[1].filter((l) => s.cube(l.to, 0) > 0).length;
  assert.equal(reached, 1);
});

test("chain outbreak hits each city once", () => {
  const s = blank();
  s.infect(1, 0, 3);
  s.infect(2, 0, 3);
  s.infect(1, 0, 1);
  assert.equal(s.outbreaks, 2);
  assert.equal(s.cube(0, 0), 2);
});

test("police quarantine costs 1 AP and is capped FIFO", () => {
  const s = blank(["police", "medic"]);
  s.ap[0] = 10;
  for (const { edge } of LINKS[0]) s.apply({ t: "quarantine", r: 0, edge });
  assert.equal(s.ap[0], 10 - LINKS[0].length);
  assert.equal(s.quarantine.length, DEFAULT_CONFIG.maxQuarantine);
  assert.ok(!s.quarantine.includes(LINKS[0][0].edge));
});

test("treat yields samples; researcher cures with 3 anywhere", () => {
  const s = blank(["researcher", "medic"]);
  s.pos[0] = 4;
  s.infect(4, 0, 3);
  s.ap[0] = 10;
  for (let i = 0; i < 3; i++) s.apply({ t: "treat", r: 0, s: 0 });
  assert.equal(s.sample(0, 0), 3);
  assert.ok(s.legalActions().some((a) => a.t === "cure" && a.s === 0));
  s.apply({ t: "cure", r: 0, s: 0 });
  assert.equal(s.cured[0], 1);
  assert.equal(s.eradicated[0], 1);
});

test("non-researcher needs a station or field lab to cure", () => {
  const s = blank(["engineer", "medic"]);
  s.pos[0] = 4;
  s.samples[0] = 4;
  s.ap[0] = 10;
  assert.ok(!s.legalActions().some((a) => a.t === "cure"));
  s.apply({ t: "lab", r: 0 });
  assert.ok(s.legalActions().some((a) => a.t === "cure"));
});

test("field lab expires after its rounds", () => {
  const s = blank(["engineer", "medic"]);
  s.pos[0] = 4;
  s.apply({ t: "lab", r: 0 });
  s.endRound(chooser);
  assert.equal(s.labCity, 4);
  s.endRound(chooser);
  assert.equal(s.labCity, -1);
});

test("medic full-clears and guards cured strains", () => {
  const s = blank(["medic", "police"]);
  s.infect(0, 0, 3);
  s.apply({ t: "treat", r: 0, s: 0 });
  assert.equal(s.cube(0, 0), 0);
  s.cured[0] = 1;
  s.infect(0, 0, 2);
  assert.equal(s.cube(0, 0), 0);
});

test("draw probabilities follow intensify segments", () => {
  const s = blank();
  s.deck = [5, 6, 7, 8, 9];
  s.deckSeg = [2, 2, 2, 1, 1];
  s.deckKnown = [0, 0, 0, 0, 0];
  const p = s.drawProbabilities();
  for (const c of [5, 6, 7]) assert.equal(p[c], 1);
  assert.equal(p[8], 0);
  s.deckSeg = [2, 2, 2, 2, 1];
  const q = s.drawProbabilities();
  assert.equal(q[5], 0.75);
});

test("round ends in time loss after the last action phase", () => {
  const s = new State({ ...DEFAULT_CONFIG, rounds: 2, setup: [], epidemics: 0 }, ["medic", "police"], 3);
  s.setup();
  s.endRound(chooser);
  s.endRound(chooser);
  assert.equal(s.status, "lost");
  assert.equal(s.lossReason, "time");
  assert.equal(STRAINS, 3);
});

test("sealed outbreak does not count when the variant is on", () => {
  const s = new State({ ...DEFAULT_CONFIG, setup: [], epidemics: 0, sealedOutbreakFree: true, maxQuarantine: 9, policeMode: "edge" }, ["police", "medic"], 1);
  s.setup();
  for (const { edge } of LINKS[1]) s.quarantine.push(edge);
  s.infect(1, 0, 4);
  assert.equal(s.outbreaks, 0);
  s.quarantine.pop();
  s.infect(1, 0, 1);
  assert.equal(s.outbreaks, 1);
});

test("lockdown city neither counts nor spreads its outbreak, and blocks incoming spread", () => {
  const s = blank(["police", "medic"]);
  s.infect(1, 0, 3);
  s.pos[0] = 1;
  s.apply({ t: "lockdown", r: 0 });
  s.infect(1, 0, 2);
  assert.equal(s.outbreaks, 0);
  for (const { to } of LINKS[1]) assert.equal(s.cube(to, 0), 0);
  s.infect(2, 0, 4);
  assert.equal(s.outbreaks, 1);
  assert.equal(s.cube(1, 0), 3);
});

test("lockdown is capped and moves to the newest city", () => {
  const s = blank(["police", "medic"]);
  s.ap[0] = 10;
  s.pos[0] = 1;
  s.apply({ t: "lockdown", r: 0 });
  s.pos[0] = 3;
  s.apply({ t: "lockdown", r: 0 });
  assert.deepEqual(s.locked, [3]);
});

test("breach punches through a lockdown once per round", () => {
  const s = blank(["police", "medic"]);
  s.mutations[0] |= 1 << MUTATIONS.indexOf("breach");
  s.locked.push(1);
  s.infect(2, 0, 4);
  assert.equal(s.cube(1, 0), 1);
  s.infect(3, 0, 4);
  assert.equal(s.cube(1, 0), 1);
});

test("mutations may only target uncured strains", () => {
  const s = blank();
  s.cured[0] = 1;
  assert.deepEqual(s.mutationTargets(), [1, 2]);
});

test("lockdown also voids infection draws on the city", () => {
  const s = blank(["police", "medic"]);
  s.pos[0] = 1;
  s.apply({ t: "lockdown", r: 0 });
  s.infect(1, 0, 2);
  assert.equal(s.cube(1, 0), 0);
});

test("lockdown sample variant pays the police for each caught cube", () => {
  const s = new State({ ...DEFAULT_CONFIG, setup: [], epidemics: 0, policeMode: "lockdown", lockdownSample: true }, ["police", "medic"], 1);
  s.setup();
  s.pos[0] = 1;
  s.apply({ t: "lockdown", r: 0 });
  s.infect(1, 0, 2);
  assert.equal(s.sample(0, 0), 2);
});

test("default police locks the city it stands in and collects samples", () => {
  const s = new State({ ...DEFAULT_CONFIG, setup: [], epidemics: 0 }, ["police", "medic"], 1);
  s.setup();
  s.pos[0] = 4;
  s.infect(4, 0, 2);
  assert.equal(s.cube(4, 0), 0);
  assert.equal(s.sample(0, 0), 2);
  s.pos[0] = 3;
  s.infect(4, 0, 1);
  assert.equal(s.cube(4, 0), 1);
});

test("endRound records the cities named this round", () => {
  const s = blank(["medic", "police"]);
  const top = s.deck.slice(0, 3);
  s.endRound(chooser);
  assert.deepEqual(s.lastDrawn, top);
});

test("police at the hub does not collect samples from setup infections", () => {
  for (let seed = 1; seed < 40; seed++) {
    const s = new State({ ...DEFAULT_CONFIG }, ["police", "medic"], seed);
    s.setup();
    assert.equal(s.sample(0, 0) + s.sample(0, 1) + s.sample(0, 2), 0);
  }
});

test("full clone keeps stats independent for undo", () => {
  const s = blank(["medic", "police"]);
  s.infect(0, 0, 1);
  const snap = s.clone(true);
  s.apply({ t: "treat", r: 0, s: 0 });
  assert.equal(snap.stats.actions.treat, 0);
  assert.equal(s.stats.actions.treat, 1);
  assert.equal(snap.cube(0, 0), 1);
});

test("stepwise infection pauses for the officer's cancel and skips that city", () => {
  const s = blank(["officer", "medic"]);
  s.ap[0] = 4;
  s.apply({ t: "cancel", r: 0 });
  const top = s.deck.slice(0, 3);
  s.events = [];
  s.beginInfection();
  const p = s.continueInfection();
  assert.equal(p?.kind, "cancel");
  assert.deepEqual(p?.kind === "cancel" ? p.cities : [], top);
  s.resolveCancel(1);
  assert.equal(s.continueInfection(), null);
  assert.equal(s.cube(top[1], CITIES[top[1]].strain), 0);
  assert.equal(s.round, 2);
  const kinds = s.events.map((e) => e.t);
  assert.deepEqual(kinds.filter((k) => k === "named" || k === "cancelled" || k === "round"), ["named", "cancelled", "round"]);
});

test("epidemic offers a mutation choice limited to uncured strains", () => {
  const s = new State({ ...DEFAULT_CONFIG, setup: [], epidemics: 1, rounds: 3 }, ["medic", "police"], 5);
  s.setup();
  s.epidemicRounds = [1];
  s.cured[0] = 1;
  s.events = [];
  s.beginInfection();
  const p = s.continueInfection();
  assert.equal(p?.kind, "mutation");
  if (p?.kind !== "mutation") return;
  assert.deepEqual(p.targets, [1, 2]);
  assert.throws(() => s.resolveMutation({ card: 0, strain: 0 }));
  s.resolveMutation({ card: 0, strain: 2 });
  assert.equal(s.continueInfection(), null);
  const kinds = s.events.map((e) => e.t);
  assert.ok(kinds.indexOf("epidemic") < kinds.indexOf("intensify"));
  assert.ok(kinds.includes("mutation"));
  assert.equal(s.epidemicsDone, 1);
});

test("outbreak and lockdown events are emitted in order", () => {
  const s = new State({ ...DEFAULT_CONFIG, setup: [], epidemics: 0 }, ["police", "medic"], 1);
  s.setup();
  s.pos[0] = 2;
  s.events = [];
  s.infect(1, 0, 4);
  const types = s.events.map((e) => e.t);
  assert.ok(types.includes("outbreak"));
  assert.ok(types.includes("shielded"));
  s.events = [];
  s.infect(2, 0, 1);
  assert.deepEqual(s.events, [{ t: "blocked", city: 2, s: 0, sample: true }]);
});

test("save and restore round-trips the whole game deterministically", () => {
  const a = new State({ ...DEFAULT_CONFIG }, ["medic", "police"], 99);
  a.setup();
  a.apply({ t: "move", r: 0, to: LINKS[0][0].to });
  const b = State.restore(JSON.parse(JSON.stringify(a.serialize())));
  assert.deepEqual(b.serialize(), a.serialize());
  a.endRound(chooser);
  b.endRound(chooser);
  assert.deepEqual(b.serialize(), a.serialize());
  assert.equal(b.round, 2);
});

test("tutorial script plays out as the coach describes", () => {
  const s = tutorialState();
  const play = (actions: Action[]) => actions.forEach((a) => {
    assert.ok(s.legalActions().some((l) => JSON.stringify(l) === JSON.stringify(a)), JSON.stringify(a));
    s.apply(a);
  });
  play([{ t: "move", r: 0, to: 2 }, { t: "move", r: 0, to: 4 }, { t: "treat", r: 0, s: 0 }, { t: "move", r: 0, to: 3 }]);
  assert.equal(s.sample(0, 0), 1);
  assert.equal(s.apLeft(0), 0);
  s.events = [];
  s.endRound(chooser);
  assert.deepEqual(s.lastDrawn, [5, 8, 15]);
  assert.equal(s.outbreaks, 1);
  assert.deepEqual(s.events.filter((e) => e.t === "outbreak"), [{ t: "outbreak", city: 5, s: 0, total: 1 }]);
  assert.equal(s.cube(3, 0), 2);

  play([{ t: "treat", r: 0, s: 0 }, { t: "move", r: 1, to: 3 }, { t: "give", r: 0, s: 0 }, { t: "cure", r: 1, s: 0 }]);
  assert.equal(s.cured[0], 1);
  s.events = [];
  s.beginInfection();
  const pending = s.continueInfection();
  assert.equal(pending?.kind, "mutation");
  assert.deepEqual(pending.kind === "mutation" && pending.targets, [1, 2]);
  for (const strain of [1, 2]) {
    for (const card of [0, 1]) {
      const t = s.clone(true);
      t.resolveMutation({ card, strain });
      while (t.continueInfection());
      assert.equal(t.outbreaks, 1);
      assert.equal(t.round, 3);
    }
  }
  const types = s.events.map((e) => e.t);
  assert.deepEqual(types.slice(0, 2), ["epidemic", "cube"]);
  assert.ok(types.includes("intensify"));
});
