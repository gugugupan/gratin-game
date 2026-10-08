import { CITIES, CITY_COUNT, DIST, EDGES, HUB, LINKS, STRAINS } from "./map.js";
import { Rng } from "./rng.js";
import { MUTATIONS, ROLES, type MutationId, type RoleId } from "./roles.js";

export { ROLES, type RoleId };

export type EdgeKind = "road" | "rail" | "sea";
const RAIL = new Set(["0-6", "0-12"]);
const SEA = new Set(["5-10", "3-17", "11-16"]);
export const EDGE_KIND: EdgeKind[] = EDGES.map(([a, b]) => {
  const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
  return RAIL.has(key) ? "rail" : SEA.has(key) ? "sea" : "road";
});
export const POPULATION = [9, 5, 6, 4, 5, 3, 6, 5, 4, 5, 3, 4, 6, 5, 4, 4, 5, 3];
export const PORTS = [...new Set(EDGES.flatMap(([a, b], e) => (EDGE_KIND[e] === "sea" ? [a, b] : [])))];

export type NewsId = "calm" | "festival" | "fog" | "rain" | "freighter" | "rumor" | "peak";
export const NEWS_DECK: Record<NewsId, number> = { calm: 4, festival: 1, fog: 1, rain: 1, freighter: 2, rumor: 2, peak: 3 };

export interface V2Config {
  rounds: number;
  ap: number;
  setup: number[];
  cureNeed: number;
  researcherCureNeed: number;
  stationCost: number;
  maxStations: number;
  maxCheckpoints: number;
  engineerMaxCheckpoints: number;
  capacity: Record<EdgeKind, number>;
  travel: Record<EdgeKind, number>;
  spawn: [number, number, number, number];
  panic: {
    infect: number;
    outbreak: number;
    outbreakNeighbour: number;
    locked: number;
    policeLocked: number;
    treat: number;
    intercepted: number;
    clean: number;
    cure: number;
    rumor: number;
  };
  riotAt: number;
  riotRecover: number;
  riotLimit: number;
  supplyRounds: number;
  officerUses: number;
  cureMutations: number[];
  samplePerLevel: boolean;
  lockRange: number;
  news: Record<NewsId, number>;
}

export const V2_CONFIG: V2Config = {
  rounds: 12,
  ap: 4,
  setup: [3, 3, 2, 2, 1, 1],
  cureNeed: 4,
  researcherCureNeed: 3,
  stationCost: 3,
  maxStations: 3,
  maxCheckpoints: 2,
  engineerMaxCheckpoints: 3,
  capacity: { rail: 3, road: 2, sea: 1 },
  travel: { rail: 1, road: 1, sea: 2 },
  spawn: [0, 0, 1, 2],
  panic: { infect: 10, outbreak: 30, outbreakNeighbour: 15, locked: 25, policeLocked: 12, treat: 10, intercepted: 15, clean: 10, cure: 40, rumor: 15 },
  riotAt: 100,
  riotRecover: 60,
  riotLimit: 3,
  supplyRounds: 2,
  officerUses: 2,
  cureMutations: [1, 2],
  samplePerLevel: false,
  lockRange: 0,
  news: NEWS_DECK,
};

export interface Carrier {
  id: number;
  s: number;
  from: number;
  to: number;
  edge: number;
  left: number;
  born: number;
}

export type V2Action =
  | { t: "move"; r: number; to: number }
  | { t: "fly"; r: number; to: number }
  | { t: "treat"; r: number; s: number }
  | { t: "give"; r: number; s: number }
  | { t: "cure"; r: number; s: number }
  | { t: "build"; r: number }
  | { t: "checkpoint"; r: number; edge: number }
  | { t: "lock"; r: number; city: number }
  | { t: "unlock"; city: number }
  | { t: "supply"; r: number }
  | { t: "reroute"; r: number; carrier: number; edge: number }
  | { t: "purge"; r: number; carrier: number }
  | { t: "pass" };

export type V2Event =
  | { t: "news"; id: NewsId }
  | { t: "move"; carrier: number }
  | { t: "intercepted"; carrier: number; edge: number }
  | { t: "blocked"; carrier: number; city: number }
  | { t: "infect"; city: number; s: number }
  | { t: "outbreak"; city: number; s: number }
  | { t: "spawn"; carrier: number }
  | { t: "riot"; city: number }
  | { t: "calm"; city: number }
  | { t: "mutation"; m: MutationId; strain: number }
  | { t: "lose"; reason: V2LossReason };

export type V2LossReason = "riot" | "time";

export interface V2Stats {
  actions: Record<V2Action["t"], number>;
  carriers: number;
  inFlight: number;
  intercepted: number;
  blocked: number;
  outbreaks: number;
  firstRiot: number | null;
  peakRiots: number;
}

export class V2State {
  level = new Int8Array(CITY_COUNT * STRAINS);
  panic = new Int16Array(CITY_COUNT);
  riot = new Uint8Array(CITY_COUNT);
  locked = new Uint8Array(CITY_COUNT);
  supply = new Uint8Array(CITY_COUNT);
  carriers: Carrier[] = [];
  checkpoints: number[] = [];
  pos = new Int8Array(2);
  samples = new Int8Array(2 * STRAINS);
  ap = 0;
  cured = new Uint8Array(STRAINS);
  mutations = new Uint8Array(STRAINS);
  breachUsed = new Uint8Array(STRAINS);
  pendingMutations: number[] = [];
  mutationDeck: MutationId[] = [];
  stations: number[] = [HUB];
  newsDeck: NewsId[] = [];
  news: NewsId = "calm";
  nextNews: NewsId = "calm";
  effects: { festival: number; rain: number } = { festival: 0, rain: 0 };
  rerouteUsed = 0;
  officerUses = 0;
  nextId = 1;
  round = 1;
  status: "playing" | "won" | "lost" = "playing";
  lossReason: V2LossReason | null = null;
  events: V2Event[] | null = null;
  rng: Rng;
  stats: V2Stats = {
    actions: { move: 0, fly: 0, treat: 0, give: 0, cure: 0, build: 0, checkpoint: 0, lock: 0, unlock: 0, supply: 0, reroute: 0, purge: 0, pass: 0 },
    carriers: 0,
    inFlight: 0,
    intercepted: 0,
    blocked: 0,
    outbreaks: 0,
    firstRiot: null,
    peakRiots: 0,
  };

  constructor(public cfg: V2Config, public roles: [RoleId, RoleId], seed: number) {
    this.rng = new Rng(seed);
  }

  clone(): V2State {
    const c = Object.create(V2State.prototype) as V2State;
    Object.assign(c, this);
    c.level = this.level.slice();
    c.panic = this.panic.slice();
    c.riot = this.riot.slice();
    c.locked = this.locked.slice();
    c.supply = this.supply.slice();
    c.carriers = this.carriers.map((k) => ({ ...k }));
    c.checkpoints = this.checkpoints.slice();
    c.pos = this.pos.slice();
    c.samples = this.samples.slice();
    c.cured = this.cured.slice();
    c.mutations = this.mutations.slice();
    c.breachUsed = this.breachUsed.slice();
    c.pendingMutations = this.pendingMutations.slice();
    c.mutationDeck = this.mutationDeck.slice();
    c.stations = this.stations.slice();
    c.newsDeck = this.newsDeck.slice();
    c.effects = { ...this.effects };
    c.rng = new Rng(this.rng.seed);
    c.stats = { ...this.stats, actions: { ...this.stats.actions } };
    c.events = null;
    return c;
  }

  setup(): void {
    const cities = this.rng.shuffle(CITIES.map((c) => c.id)).slice(0, this.cfg.setup.length);
    cities.forEach((city, i) => {
      this.level[city * STRAINS + CITIES[city].strain] = this.cfg.setup[i];
      this.panic[city] = this.cfg.setup[i] * this.cfg.panic.infect;
    });
    this.mutationDeck = this.rng.shuffle([...MUTATIONS]);
    this.newsDeck = this.rng.shuffle((Object.keys(this.cfg.news) as NewsId[]).flatMap((id) => Array<NewsId>(this.cfg.news[id]).fill(id)));
    this.officerUses = this.cfg.officerUses;
    this.nextNews = this.drawNews();
    this.round = 0;
    this.spawnPhase();
    this.round = 1;
    this.startRound();
  }

  // ---- queries ----

  hasRole(role: RoleId): number {
    return this.roles[0] === role ? 0 : this.roles[1] === role ? 1 : -1;
  }

  lv(city: number, s: number): number {
    return this.level[city * STRAINS + s];
  }

  sample(r: number, s: number): number {
    return this.samples[r * STRAINS + s];
  }

  hasMutation(s: number, m: MutationId): boolean {
    return (this.mutations[s] & (1 << MUTATIONS.indexOf(m))) !== 0;
  }

  maxLevel(s: number): number {
    return this.hasMutation(s, "acute") ? 2 : 3;
  }

  cureNeed(r: number, s: number): number {
    return (this.roles[r] === "researcher" ? this.cfg.researcherCureNeed : this.cfg.cureNeed) + (this.hasMutation(s, "resistant") ? 1 : 0);
  }

  curedCount(): number {
    return this.cured[0] + this.cured[1] + this.cured[2];
  }

  riots(): number {
    return this.riot.reduce((n, v) => n + v, 0);
  }

  travelTime(edge: number): number {
    const kind = EDGE_KIND[edge];
    return this.cfg.travel[kind] + (kind === "road" && this.effects.rain > 0 ? 1 : 0);
  }

  capacity(edge: number): number {
    const kind = EDGE_KIND[edge];
    if (kind === "sea" && this.news === "fog") return 0;
    return this.cfg.capacity[kind] * (kind === "rail" && this.effects.festival > 0 ? 2 : 1);
  }

  maxCheckpoints(): number {
    return this.hasRole("engineer") >= 0 ? this.cfg.engineerMaxCheckpoints : this.cfg.maxCheckpoints;
  }

  surcharge(r: number): number {
    return this.riot[this.pos[r]] ? 1 : 0;
  }

  cost(a: V2Action): number {
    switch (a.t) {
      case "pass":
      case "unlock":
        return 0;
      case "reroute":
        return 0;
      case "build":
        return this.cfg.stationCost + this.surcharge(a.r);
      case "checkpoint":
        return (this.roles[a.r] === "engineer" ? 0 : 1) + this.surcharge(a.r);
      default:
        return 1 + this.surcharge(a.r);
    }
  }

  incoming(city: number): Carrier[] {
    return this.carriers.filter((k) => k.to === city);
  }

  legalActions(): V2Action[] {
    const out: V2Action[] = [{ t: "pass" }];
    if (this.status !== "playing") return out;
    for (let c = 0; c < CITY_COUNT; c++) if (this.locked[c]) out.push({ t: "unlock", city: c });
    for (let r = 0; r < 2; r++) {
      const role = this.roles[r];
      const city = this.pos[r];
      const can = (a: V2Action) => this.cost(a) <= this.ap && out.push(a);
      for (const { to } of LINKS[city]) can({ t: "move", r, to });
      if (this.stations.includes(city)) for (const to of this.stations) if (to !== city) can({ t: "fly", r, to });
      for (let s = 0; s < STRAINS; s++) {
        if (this.lv(city, s) > 0) can({ t: "treat", r, s });
        if (this.sample(r, s) > 0 && !this.cured[s] && (this.pos[1 - r] === city || this.hasRole("logistics") >= 0)) can({ t: "give", r, s });
        if (!this.cured[s] && this.sample(r, s) >= this.cureNeed(r, s) && (role === "researcher" || this.stations.includes(city))) can({ t: "cure", r, s });
      }
      if (!this.stations.includes(city) && this.stations.length < this.cfg.maxStations) can({ t: "build", r });
      if (this.checkpoints.length < this.maxCheckpoints()) {
        for (const { edge } of LINKS[city]) if (!this.checkpoints.includes(edge)) can({ t: "checkpoint", r, edge });
      }
      for (let c = 0; c < CITY_COUNT; c++) {
        if (DIST[city][c] <= this.cfg.lockRange && !this.locked[c] && !this.riot[c]) can({ t: "lock", r, city: c });
      }
      can({ t: "supply", r });
      if (role === "epidemiologist" && !this.rerouteUsed) {
        for (const k of this.carriers) {
          if (k.born !== this.round - 1 || k.left !== this.travelTimeAt(k)) continue;
          for (const { edge, to } of LINKS[k.from]) if (edge !== k.edge && !this.locked[to]) out.push({ t: "reroute", r, carrier: k.id, edge });
        }
      }
      if (role === "officer" && this.officerUses > 0) for (const k of this.carriers) can({ t: "purge", r, carrier: k.id });
    }
    return out;
  }

  private travelTimeAt(k: Carrier): number {
    return this.travelTime(k.edge);
  }

  // ---- actions ----

  apply(a: V2Action): void {
    this.stats.actions[a.t]++;
    if (a.t === "pass") {
      this.ap = 0;
      return;
    }
    if (a.t === "unlock") {
      this.locked[a.city] = 0;
      return;
    }
    this.ap -= this.cost(a);
    const r = a.r;
    const role = this.roles[r];
    const city = this.pos[r];
    switch (a.t) {
      case "move":
      case "fly":
        this.pos[r] = a.to;
        break;
      case "treat": {
        const idx = city * STRAINS + a.s;
        const all = (role === "medic" || this.cured[a.s]) && !this.hasMutation(a.s, "stubborn");
        const removed = all ? this.level[idx] : 1;
        this.level[idx] -= removed;
        this.addPanic(city, -this.cfg.panic.treat * removed);
        if (!this.cured[a.s]) this.samples[r * STRAINS + a.s] += (this.cfg.samplePerLevel ? removed : 1) + (role === "pharmacist" ? 1 : 0);
        break;
      }
      case "give":
        this.samples[(1 - r) * STRAINS + a.s] += this.samples[r * STRAINS + a.s];
        this.samples[r * STRAINS + a.s] = 0;
        break;
      case "cure":
        this.samples[r * STRAINS + a.s] -= this.cureNeed(r, a.s);
        this.cured[a.s] = 1;
        for (let c = 0; c < CITY_COUNT; c++) if (CITIES[c].strain === a.s) this.addPanic(c, -this.cfg.panic.cure);
        if (this.curedCount() === STRAINS) this.status = "won";
        else if (this.cfg.cureMutations[this.curedCount() - 1]) this.pendingMutations.push(this.cfg.cureMutations[this.curedCount() - 1]);
        break;
      case "build":
        this.stations.push(city);
        break;
      case "checkpoint":
        this.checkpoints.push(a.edge);
        break;
      case "lock":
        this.locked[a.city] = role === "police" ? 2 : 1;
        break;
      case "supply":
        for (let c = 0; c < CITY_COUNT; c++) {
          if (DIST[city][c] <= (role === "logistics" ? 2 : 1)) this.supply[c] = Math.max(this.supply[c], this.cfg.supplyRounds);
        }
        break;
      case "reroute": {
        const k = this.carriers.find((x) => x.id === a.carrier);
        const link = k && LINKS[k.from].find((l) => l.edge === a.edge);
        if (k && link) {
          k.edge = a.edge;
          k.to = link.to;
          k.left = this.travelTime(a.edge);
        }
        this.rerouteUsed = 1;
        break;
      }
      case "purge":
        this.carriers = this.carriers.filter((x) => x.id !== a.carrier);
        this.officerUses--;
        break;
    }
  }

  addPanic(city: number, amount: number): void {
    const v = amount > 0 && this.supply[city] > 0 ? Math.ceil(amount / 2) : amount;
    this.panic[city] = Math.max(0, Math.min(this.cfg.riotAt, this.panic[city] + v));
  }

  // ---- spread phase ----

  endRound(): void {
    if (this.status !== "playing") return;
    while (this.pendingMutations.length) this.mutate(this.pendingMutations.shift()!);
    this.breachUsed.fill(0);
    this.movePhase();
    if (this.status !== "playing") return;
    this.spawnPhase();
    this.panicPhase();
    if (this.status !== "playing") return;
    for (let c = 0; c < CITY_COUNT; c++) if (this.supply[c]) this.supply[c]--;
    if (this.effects.festival) this.effects.festival--;
    if (this.effects.rain) this.effects.rain--;
    if (this.round >= this.cfg.rounds) return this.lose("time");
    this.round++;
    this.startRound();
  }

  private startRound(): void {
    this.ap = this.cfg.ap;
    this.rerouteUsed = 0;
    this.news = this.nextNews;
    this.nextNews = this.drawNews();
    this.emit({ t: "news", id: this.news });
    switch (this.news) {
      case "festival":
        this.effects.festival = 2;
        break;
      case "rain":
        this.effects.rain = 2;
        break;
      case "rumor": {
        const region = this.rng.int(STRAINS);
        for (let c = 0; c < CITY_COUNT; c++) if (CITIES[c].strain === region) this.addPanic(c, this.cfg.panic.rumor);
        this.checkRiots();
        break;
      }
      case "freighter": {
        const port = PORTS[this.rng.int(PORTS.length)];
        const sea = LINKS[port].filter((l) => EDGE_KIND[l.edge] === "sea");
        for (let i = 0; i < 2; i++) {
          const l = sea[this.rng.int(sea.length)];
          this.addCarrier(CITIES[l.to].strain, l.to, port, l.edge, 1, this.round - 1);
        }
        break;
      }
      case "peak":
        for (let c = 0; c < CITY_COUNT; c++) {
          if (this.locked[c]) continue;
          for (let s = 0; s < STRAINS; s++) if (this.lv(c, s) > 0 && !this.cured[s]) this.infect(c, s);
        }
        this.checkRiots();
        break;
    }
  }

  private drawNews(): NewsId {
    if (this.newsDeck.length === 0) return "calm";
    return this.newsDeck.shift()!;
  }

  private movePhase(): void {
    const arriving: Carrier[] = [];
    for (const k of [...this.carriers]) {
      if (k.born >= this.round) continue;
      if (EDGE_KIND[k.edge] === "sea" && this.news === "fog") continue;
      const at = this.checkpoints.indexOf(k.edge);
      if (at >= 0 && !this.useBreach(k.s)) {
        this.checkpoints.splice(at, 1);
        this.removeCarrier(k);
        this.stats.intercepted++;
        this.addPanic(k.to, -this.cfg.panic.intercepted);
        if (!this.cured[k.s]) {
          const r = DIST[this.pos[0]][k.to] <= DIST[this.pos[1]][k.to] ? 0 : 1;
          this.samples[r * STRAINS + k.s]++;
        }
        this.emit({ t: "intercepted", carrier: k.id, edge: k.edge });
        continue;
      }
      k.left--;
      this.emit({ t: "move", carrier: k.id });
      if (k.left <= 0) arriving.push(k);
    }
    for (const k of arriving) {
      this.removeCarrier(k);
      if (this.locked[k.to] && !this.useBreach(k.s)) {
        this.stats.blocked++;
        this.emit({ t: "blocked", carrier: k.id, city: k.to });
        continue;
      }
      if (this.cured[k.s]) continue;
      this.infect(k.to, k.s);
      if (this.status !== "playing") return;
    }
  }

  private infect(city: number, s: number): void {
    const idx = city * STRAINS + s;
    if (this.level[idx] < this.maxLevel(s)) {
      this.level[idx]++;
      this.addPanic(city, this.cfg.panic.infect);
      this.emit({ t: "infect", city, s });
      return;
    }
    this.stats.outbreaks++;
    this.addPanic(city, this.cfg.panic.outbreak);
    this.emit({ t: "outbreak", city, s });
    for (const { to, edge } of LINKS[city]) {
      this.addPanic(to, this.cfg.panic.outbreakNeighbour);
      this.addCarrier(s, city, to, edge, this.travelTime(edge), this.round);
    }
  }

  private spawnPhase(): void {
    for (let c = 0; c < CITY_COUNT; c++) {
      if (this.locked[c]) continue;
      let extra = this.riot[c] ? 1 : 0;
      if (c === HUB && this.effects.festival > 0) extra++;
      for (let s = 0; s < STRAINS; s++) {
        if (this.cured[s]) continue;
        const lv = this.lv(c, s);
        let n = this.cfg.spawn[lv] ?? 0;
        if (n > 0 && this.hasMutation(s, "virulent")) n++;
        if (lv > 0 && extra > 0) {
          n += extra;
          extra = 0;
        }
        for (let i = 0; i < n; i++) this.spawnFrom(c, s);
      }
    }
  }

  private spawnFrom(city: number, s: number): void {
    let links = LINKS[city].filter((l) => !this.locked[l.to] && this.capacity(l.edge) > 0);
    if (links.length === 0) links = LINKS[city];
    const total = links.reduce((n, l) => n + Math.max(1, this.capacity(l.edge)), 0);
    let pick = this.rng.next() * total;
    let link = links[0];
    for (const l of links) {
      pick -= Math.max(1, this.capacity(l.edge));
      if (pick <= 0) {
        link = l;
        break;
      }
    }
    this.addCarrier(s, city, link.to, link.edge, this.travelTime(link.edge), this.round);
  }

  private addCarrier(s: number, from: number, to: number, edge: number, left: number, born: number): void {
    const k: Carrier = { id: this.nextId++, s, from, to, edge, left, born };
    this.carriers.push(k);
    this.stats.carriers++;
    this.emit({ t: "spawn", carrier: k.id });
  }

  private removeCarrier(k: Carrier): void {
    this.carriers = this.carriers.filter((x) => x !== k);
  }

  private panicPhase(): void {
    for (let c = 0; c < CITY_COUNT; c++) {
      if (this.locked[c]) this.addPanic(c, this.locked[c] === 2 ? this.cfg.panic.policeLocked : this.cfg.panic.locked);
      else if (!this.riot[c] && this.level.slice(c * STRAINS, c * STRAINS + STRAINS).every((v) => v === 0)) this.addPanic(c, -this.cfg.panic.clean);
    }
    this.checkRiots();
    this.stats.inFlight += this.carriers.length;
  }

  private checkRiots(): void {
    for (let c = 0; c < CITY_COUNT; c++) {
      if (!this.riot[c] && this.panic[c] >= this.cfg.riotAt) {
        this.riot[c] = 1;
        this.locked[c] = 0;
        this.stats.firstRiot ??= this.round;
        this.emit({ t: "riot", city: c });
      } else if (this.riot[c] && this.panic[c] < this.cfg.riotRecover) {
        this.riot[c] = 0;
        this.emit({ t: "calm", city: c });
      }
    }
    this.stats.peakRiots = Math.max(this.stats.peakRiots, this.riots());
    if (this.riots() >= this.cfg.riotLimit) this.lose("riot");
  }

  private useBreach(s: number): boolean {
    if (!this.hasMutation(s, "breach") || this.breachUsed[s]) return false;
    this.breachUsed[s] = 1;
    return true;
  }

  private mutate(count: number): void {
    const targets = [0, 1, 2].filter((k) => !this.cured[k]);
    if (targets.length === 0) return;
    const strain = targets[this.rng.int(targets.length)];
    for (let n = 0; n < count; n++) {
      const at = this.mutationDeck.findIndex((m) => !this.hasMutation(strain, m));
      if (at < 0) return;
      const [m] = this.mutationDeck.splice(at, 1);
      this.mutations[strain] |= 1 << MUTATIONS.indexOf(m);
      this.emit({ t: "mutation", m, strain });
    }
  }

  private lose(reason: V2LossReason): void {
    if (this.status !== "playing") return;
    this.status = "lost";
    this.lossReason = reason;
    this.emit({ t: "lose", reason });
  }

  private emit(e: V2Event): void {
    this.events?.push(e);
  }

  score(): number {
    if (this.status !== "won") return 0;
    const safe = POPULATION.reduce((n, p, c) => n + (this.riot[c] ? 0 : p), 0);
    return safe * 10 + (this.cfg.rounds - this.round) * 20;
  }
}
