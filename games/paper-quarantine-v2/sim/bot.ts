import { CITY_COUNT, DIST, LINKS, STRAINS } from "../engine/map.js";
import { Rng } from "../engine/rng.js";
import { V2State, type V2Action } from "../engine/game.js";

export interface V2Policy {
  playRound(s: V2State): void;
}

export class V2RandomPolicy implements V2Policy {
  private rng: Rng;
  constructor(seed: number) {
    this.rng = new Rng(seed);
  }

  playRound(s: V2State): void {
    for (let guard = 0; guard < 20 && s.ap > 0 && s.status === "playing"; guard++) {
      const acts = s.legalActions().filter((a) => a.t !== "pass" && a.t !== "unlock" && s.cost(a) > 0);
      if (!acts.length) break;
      s.apply(acts[this.rng.int(acts.length)]);
    }
    for (let c = 0; c < CITY_COUNT; c++) if (s.locked[c] && s.panic[c] >= 70) s.apply({ t: "unlock", city: c });
  }
}

export class V2HeuristicPolicy implements V2Policy {
  constructor(private beamWidth = 10, private unlockAt = 70) {}

  playRound(s: V2State): void {
    for (let c = 0; c < CITY_COUNT; c++) if (s.locked[c] && s.panic[c] >= this.unlockAt) s.apply({ t: "unlock", city: c });
    this.reroute(s);
    let beam: { state: V2State; first: V2Action[]; score: number }[] = [{ state: s.clone(), first: [], score: evaluate(s) }];
    let best = beam[0];
    for (let depth = 0; depth < 6; depth++) {
      const next: typeof beam = [];
      for (const node of beam) {
        if (node.state.ap <= 0 || node.state.status !== "playing") continue;
        for (const a of candidates(node.state)) {
          const t = node.state.clone();
          t.apply(a);
          next.push({ state: t, first: [...node.first, a], score: evaluate(t) });
        }
      }
      if (!next.length) break;
      next.sort((a, b) => b.score - a.score);
      beam = next.slice(0, this.beamWidth);
      if (beam[0].score > best.score) best = beam[0];
    }
    for (const a of best.first) {
      if (s.status !== "playing") break;
      s.apply(a);
    }
  }

  private reroute(s: V2State): void {
    const opts = s.legalActions().filter((a): a is Extract<V2Action, { t: "reroute" }> => a.t === "reroute");
    let best: V2Action | null = null;
    let gain = 5;
    const base = evaluate(s);
    for (const a of opts) {
      const t = s.clone();
      t.apply(a);
      const g = evaluate(t) - base;
      if (g > gain) {
        gain = g;
        best = a;
      }
    }
    if (best) s.apply(best);
  }
}

function candidates(s: V2State): V2Action[] {
  return s.legalActions().filter((a) => {
    if (a.t === "pass" || a.t === "unlock" || a.t === "reroute") return false;
    if (a.t === "checkpoint") return s.carriers.some((k) => k.edge === a.edge);
    if (a.t === "purge") return threatOf(s, s.carriers.find((k) => k.id === a.carrier)!.to) > 10;
    if (a.t === "build") return s.stations.length < 2;
    return true;
  });
}

function threatOf(s: V2State, city: number): number {
  let t = 0;
  for (let k = 0; k < STRAINS; k++) t += s.lv(city, k) * 4;
  return t + s.panic[city] / 10;
}

export function evaluate(s: V2State): number {
  if (s.status === "won") return 1e6;
  if (s.status === "lost") return -1e6;
  let score = 0;
  for (let k = 0; k < STRAINS; k++) {
    if (s.cured[k]) {
      score += 600;
      continue;
    }
    const best = Math.max(s.sample(0, k), s.sample(1, k));
    const need = Math.min(s.cureNeed(0, k), s.cureNeed(1, k));
    score += Math.min(best, need) * 45 + (s.sample(0, k) + s.sample(1, k)) * 6;
  }
  const incoming = new Int8Array(CITY_COUNT * STRAINS);
  for (const c of s.carriers) {
    if (s.checkpoints.includes(c.edge) || s.locked[c.to] || s.cured[c.s]) continue;
    incoming[c.to * STRAINS + c.s] += c.left <= 1 ? 1 : 0;
  }
  let riots = 0;
  const rise = new Float32Array(CITY_COUNT);
  for (let c = 0; c < CITY_COUNT; c++) {
    if (s.locked[c]) rise[c] += s.locked[c] === 2 ? s.cfg.panic.policeLocked : s.cfg.panic.locked;
    for (let k = 0; k < STRAINS; k++) {
      if (s.cured[k]) continue;
      const lv = s.lv(c, k);
      const inc = incoming[c * STRAINS + k];
      if (!inc) continue;
      const room = Math.max(0, s.maxLevel(k) - lv);
      rise[c] += Math.min(inc, room) * s.cfg.panic.infect;
      if (inc > room) {
        rise[c] += s.cfg.panic.outbreak;
        for (const { to } of LINKS[c]) rise[to] += s.cfg.panic.outbreakNeighbour;
      }
    }
  }
  for (let c = 0; c < CITY_COUNT; c++) {
    const gain = s.supply[c] > 0 ? rise[c] / 2 : rise[c];
    const p = Math.min(100, s.panic[c] + gain);
    score -= (p / 100) ** 2 * 90;
    if (s.riot[c]) riots++;
    else if (p >= s.cfg.riotAt) score -= 220;
    for (let k = 0; k < STRAINS; k++) {
      if (s.cured[k]) continue;
      const lv = s.lv(c, k);
      const after = lv + incoming[c * STRAINS + k];
      if (after > s.maxLevel(k)) score -= 70 + LINKS[c].length * 12;
      score -= after * after * 5;
      if (!s.locked[c]) score -= (s.cfg.spawn[Math.min(3, after)] ?? 0) * 9;
    }
  }
  score -= riots * 260 + (riots >= s.cfg.riotLimit - 1 ? 400 : 0);
  let near = 0;
  for (let r = 0; r < 2; r++) {
    let d = 9;
    for (let c = 0; c < CITY_COUNT; c++) if (threatOf(s, c) > 8) d = Math.min(d, DIST[s.pos[r]][c]);
    near += d;
  }
  score -= near * 3;
  for (let k = 0; k < STRAINS; k++) {
    if (s.cured[k]) continue;
    for (let r = 0; r < 2; r++) {
      if (s.sample(r, k) < s.cureNeed(r, k) || s.roles[r] === "researcher") continue;
      score -= Math.min(...s.stations.map((st) => DIST[s.pos[r]][st])) * 25;
    }
    const pooled = s.sample(0, k) + s.sample(1, k);
    if (pooled >= Math.min(s.cureNeed(0, k), s.cureNeed(1, k)) && Math.max(s.sample(0, k), s.sample(1, k)) < Math.min(s.cureNeed(0, k), s.cureNeed(1, k))) {
      score -= (s.hasRole("logistics") >= 0 ? 0 : DIST[s.pos[0]][s.pos[1]]) * 12;
    }
  }
  score += s.ap * 0.5;
  return score;
}
