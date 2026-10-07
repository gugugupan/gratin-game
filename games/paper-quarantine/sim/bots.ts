import { Action, Chooser, MutationChoice, MutationId, State } from "../engine/game.js";
import { CITIES, CITY_COUNT, DIST, LINKS, STRAINS } from "../engine/map.js";
import { Rng } from "../engine/rng.js";

export interface Policy extends Chooser {
  name: string;
  playRound(state: State): void;
}

export class RandomPolicy implements Policy {
  name = "random";
  private rng: Rng;

  constructor(seed: number) {
    this.rng = new Rng(seed);
  }

  playRound(state: State): void {
    while (state.status === "playing" && state.totalAp() > 0) {
      const actions = state.legalActions().filter((a) => a.t !== "pass");
      if (actions.length === 0 || this.rng.next() < 0.03) {
        state.apply({ t: "pass" });
        break;
      }
      state.apply(actions[this.rng.int(actions.length)]);
    }
  }

  chooseMutation(state: State, cards: MutationId[]): MutationChoice {
    const targets = state.mutationTargets();
    return { card: this.rng.int(cards.length), strain: targets[this.rng.int(targets.length)] };
  }

  chooseCancel(_state: State, cities: number[]): number {
    return this.rng.int(cities.length);
  }
}

const MUTATION_HARM: Record<MutationId, number> = {
  breach: 2,
  resistant: 4,
  virulent: 5,
  stubborn: 3,
  acute: 6,
};

const MUTATION_HARM_IF_CURED: Record<MutationId, number> = {
  breach: 1,
  resistant: 0,
  virulent: 3,
  stubborn: 3,
  acute: 4,
};

export interface HeuristicOptions {
  beamWidth: number;
}

export class HeuristicPolicy implements Policy {
  name = "heuristic";

  constructor(private opts: HeuristicOptions = { beamWidth: 10 }) {}

  playRound(state: State): void {
    this.useAbilities(state);
    if (state.status !== "playing" || state.totalAp() <= 0) return;
    const p = state.drawProbabilities();
    let beam: { s: State; plan: Action[]; score: number }[] = [{ s: state.clone(), plan: [], score: 0 }];
    let finished: { s: State; plan: Action[]; score: number }[] = [];
    while (beam.length > 0) {
      const next: { s: State; plan: Action[]; score: number }[] = [];
      for (const node of beam) {
        for (const a of node.s.legalActions(false)) {
          const child = node.s.clone();
          child.apply(a);
          const plan = [...node.plan, a];
          const score = evaluate(child, p) + child.totalAp() * 250;
          const entry = { s: child, plan, score };
          if (child.status !== "playing" || child.totalAp() <= 0) finished.push(entry);
          else next.push(entry);
        }
      }
      next.sort((a, b) => b.score - a.score);
      const seen = new Set<string>();
      beam = [];
      for (const n of next) {
        const key = stateKey(n.s);
        if (seen.has(key)) continue;
        seen.add(key);
        beam.push(n);
        if (beam.length >= this.opts.beamWidth) break;
      }
      if (finished.length > this.opts.beamWidth * 40) {
        finished.sort((a, b) => b.score - a.score);
        finished = finished.slice(0, this.opts.beamWidth);
      }
    }
    finished.sort((a, b) => b.score - a.score);
    for (const a of finished[0]?.plan ?? [{ t: "pass" } as Action]) {
      if (state.status !== "playing") break;
      state.apply(a);
    }
    if (state.totalAp() > 0) state.apply({ t: "pass" });
  }

  private useAbilities(state: State): void {
    const epi = state.hasRole("epidemiologist");
    if (epi >= 0 && state.apLeft(epi) > 0 && !state.forecastUsed) {
      const top = state.deck.slice(0, 3);
      let best = -1;
      let bestDanger = 1;
      top.forEach((city, i) => {
        const s = CITIES[city].strain;
        if (state.eradicated[s]) return;
        const danger = state.cube(city, s) + (state.cube(city, s) >= state.maxCubes(s) ? 3 : 0);
        if (danger > bestDanger) {
          bestDanger = danger;
          best = i;
        }
      });
      if (best >= 0) state.apply({ t: "forecast", r: epi, bury: best });
    }
    const officer = state.hasRole("officer");
    if (officer >= 0 && state.apLeft(officer) > 0 && state.officerUses > 0 && !state.cancelUsed) {
      const p = state.drawProbabilities();
      let risk = 0;
      for (let c = 0; c < CITY_COUNT; c++) {
        const s = CITIES[c].strain;
        if (!state.eradicated[s] && state.cube(c, s) >= state.maxCubes(s)) risk += p[c];
      }
      if (risk >= 0.6) state.apply({ t: "cancel", r: officer });
    }
  }

  chooseMutation(state: State, cards: MutationId[]): MutationChoice {
    let best: MutationChoice = { card: 0, strain: 0 };
    let bestHarm = Infinity;
    const targets = state.mutationTargets();
    cards.forEach((m, card) => {
      for (const s of targets) {
        let harm: number;
        if (state.eradicated[s]) harm = 0;
        else if (state.cured[s]) harm = MUTATION_HARM_IF_CURED[m] * (1 + state.cubesOnBoard(s) / 8);
        else harm = MUTATION_HARM[m] * (1 + state.cubesOnBoard(s) / 8);
        if (harm < bestHarm) {
          bestHarm = harm;
          best = { card, strain: s };
        }
      }
    });
    return best;
  }

  chooseCancel(state: State, cities: number[]): number {
    let best = 0;
    let bestDanger = -1;
    cities.forEach((city, i) => {
      const s = CITIES[city].strain;
      if (state.eradicated[s]) return;
      const k = state.cube(city, s);
      const danger = k >= state.maxCubes(s) ? 10 + outbreakFanout(state, city, s) : k;
      if (danger > bestDanger) {
        bestDanger = danger;
        best = i;
      }
    });
    return best;
  }
}

function stateKey(s: State): string {
  return `${s.pos[0]},${s.pos[1]}|${s.samples.join("")}|${s.cubes.join("")}|${s.quarantine.join(",")}|${s.stations.join(",")}|${s.labCity}|${s.cured.join("")}|${s.ap.join("")}`;
}

function outbreakFanout(s: State, city: number, strain: number): number {
  let n = 0;
  let open = 0;
  let breach = s.hasMutation(strain, "breach") && !s.breachUsed[strain];
  if (s.isLocked(city)) {
    if (!breach) return -1;
    breach = false;
  }
  for (const { to, edge } of LINKS[city]) {
    if (s.quarantine.includes(edge) || s.isLocked(to)) {
      if (!breach) continue;
      breach = false;
    }
    open++;
    n += s.cube(to, strain) >= s.maxCubes(strain) ? 3 : 1;
  }
  return open === 0 && s.cfg.sealedOutbreakFree ? -1 : n;
}

function outbreakCost(s: State, city: number, strain: number, pressure: number): number {
  const fanout = outbreakFanout(s, city, strain);
  return fanout < 0 ? 0 : (2200 + 450 * fanout) * pressure;
}

function nearestCureSite(s: State, r: number): number {
  if (s.roles[r] === "researcher") return 0;
  const c = s.pos[r];
  let d = Infinity;
  for (const st of s.stations) d = Math.min(d, DIST[c][st]);
  if (s.labCity >= 0) d = Math.min(d, DIST[c][s.labCity]);
  return d;
}

export function evaluate(s: State, p: Float64Array): number {
  if (s.status === "lost") return -1e9;
  if (s.status === "won") return 1e9;
  let v = s.curedCount() * 20000;
  for (let st = 0; st < STRAINS; st++) if (s.eradicated[st]) v += 3000;

  const logistics = s.hasRole("logistics") >= 0;
  for (let st = 0; st < STRAINS; st++) {
    if (s.cured[st]) continue;
    const total = s.sample(0, st) + s.sample(1, st);
    const need = Math.min(s.cureNeed(0, st), s.cureNeed(1, st));
    v += Math.min(total, need) * 700;
    let ready = 0;
    for (let r = 0; r < 2; r++) {
      if (s.sample(r, st) >= s.cureNeed(r, st)) ready = Math.max(ready, 3000 - 450 * nearestCureSite(s, r));
    }
    if (ready === 0 && total >= need) {
      const gap = logistics ? 0 : DIST[s.pos[0]][s.pos[1]];
      ready = 1500 - 300 * gap;
    }
    v += ready;
  }

  const pressure = 1 + s.outbreaks / s.cfg.outbreakLimit;
  const hot: number[] = [];
  for (let c = 0; c < CITY_COUNT; c++) {
    for (let st = 0; st < STRAINS; st++) {
      const k = s.cube(c, st);
      if (k === 0 || s.eradicated[st]) continue;
      const max = s.maxCubes(st);
      const home = CITIES[c].strain === st;
      v -= k * 70;
      if (k >= max - 1) v -= 90;
      const cost = outbreakCost(s, c, st, pressure);
      if (home && p[c] > 0 && !(s.cfg.lockdownBlocksInfection && s.isLocked(c))) v -= p[c] * 120;
      if (home && s.cfg.lockdownSample && !s.cured[st] && s.isLocked(c)) v += (0.3 + p[c]) * 500;
      if (k >= max) v -= (home ? 0.5 + p[c] : 0.12) * cost;
      else if (k === max - 1 && home) v -= 0.15 * cost;
      if (k >= 2) hot.push(c);
    }
  }
  for (let st = 0; st < STRAINS; st++) if (s.supply[st] < 4) v -= (4 - s.supply[st]) * 400;

  if (hot.length > 0) {
    for (let r = 0; r < 2; r++) {
      let d = Infinity;
      for (const c of hot) d = Math.min(d, DIST[s.pos[r]][c]);
      v -= d * (s.roles[r] === "medic" ? 90 : 40);
    }
  }

  for (let i = 1; i < s.stations.length; i++) {
    let d = Infinity;
    for (let j = 0; j < i; j++) d = Math.min(d, DIST[s.stations[i]][s.stations[j]]);
    v += d >= 2 ? 500 : 100;
  }
  return v;
}

