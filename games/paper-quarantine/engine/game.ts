import { CITIES, CITY_COUNT, DIST, HUB, LINKS, STRAINS } from "./map.js";
import { Rng } from "./rng.js";

export const ROLES = [
  "medic",
  "researcher",
  "police",
  "epidemiologist",
  "engineer",
  "logistics",
  "officer",
  "pharmacist",
] as const;
export type RoleId = (typeof ROLES)[number];

export const ROLE_NAMES: Record<RoleId, string> = {
  medic: "急救队员",
  researcher: "研究员",
  police: "警察",
  epidemiologist: "流行病学家",
  engineer: "工程师",
  logistics: "后勤官",
  officer: "卫生官",
  pharmacist: "药剂师",
};

export const MUTATIONS = ["breach", "resistant", "virulent", "stubborn", "acute"] as const;
export type MutationId = (typeof MUTATIONS)[number];

export const MUTATION_NAMES: Record<MutationId, string> = {
  breach: "突破",
  resistant: "耐药",
  virulent: "烈性",
  stubborn: "顽固",
  acute: "急性",
};

export interface ApRule {
  mode: "perRole" | "shared";
  n: number;
}

export interface Config {
  rounds: number;
  infectionRate: number[];
  epidemics: number;
  outbreakLimit: number;
  cubesPerStrain: number;
  setup: number[];
  ap: ApRule;
  cureNeed: number;
  researcherCureNeed: number;
  stationCost: number;
  engineerStationCost: number;
  maxStations: number;
  maxQuarantine: number;
  labRounds: number;
  officerUses: number;
  sealedOutbreakFree: boolean;
  forecastFree: boolean;
  logisticsFreeMove: boolean;
  pharmacistBonus: number;
  policeMode: "edge" | "lockdown" | "passive";
  lockdownMax: number;
  lockdownCost: number;
  lockdownBlocksInfection: boolean;
  lockdownSample: boolean;
  mutationUncuredOnly: boolean;
}

export const DEFAULT_CONFIG: Config = {
  rounds: 12,
  infectionRate: [3],
  epidemics: 4,
  outbreakLimit: 6,
  cubesPerStrain: 16,
  setup: [3, 3, 3, 2, 1, 1],
  ap: { mode: "shared", n: 4 },
  cureNeed: 4,
  researcherCureNeed: 3,
  stationCost: 3,
  engineerStationCost: 2,
  maxStations: 3,
  maxQuarantine: 3,
  labRounds: 2,
  officerUses: 2,
  sealedOutbreakFree: false,
  forecastFree: true,
  logisticsFreeMove: false,
  pharmacistBonus: 1,
  policeMode: "passive",
  lockdownMax: 1,
  lockdownCost: 1,
  lockdownBlocksInfection: true,
  lockdownSample: true,
  mutationUncuredOnly: true,
};

export type Action =
  | { t: "move"; r: number; to: number }
  | { t: "fly"; r: number; to: number }
  | { t: "treat"; r: number; s: number }
  | { t: "give"; r: number; s: number }
  | { t: "cure"; r: number; s: number }
  | { t: "build"; r: number }
  | { t: "lab"; r: number }
  | { t: "quarantine"; r: number; edge: number }
  | { t: "lockdown"; r: number }
  | { t: "forecast"; r: number; bury: number }
  | { t: "cancel"; r: number }
  | { t: "pass" };

export type LossReason = "outbreaks" | "cubes" | "time";

export type GameEvent =
  | { t: "cube"; city: number; s: number }
  | { t: "blocked"; city: number; s: number; sample: boolean }
  | { t: "shielded"; city: number; s: number }
  | { t: "guarded"; city: number; s: number }
  | { t: "outbreak"; city: number; s: number; total: number }
  | { t: "epidemic"; city: number; count: number }
  | { t: "intensify" }
  | { t: "mutation"; m: MutationId; strain: number }
  | { t: "named"; cities: number[] }
  | { t: "infecting"; city: number }
  | { t: "cancelled"; city: number }
  | { t: "labExpired"; city: number }
  | { t: "round"; round: number }
  | { t: "lose"; reason: LossReason };

export type Pending =
  | { kind: "mutation"; cards: MutationId[]; targets: number[] }
  | { kind: "cancel"; cities: number[] };

export interface MutationChoice {
  card: number;
  strain: number;
}

export interface Chooser {
  chooseMutation(state: State, cards: MutationId[]): MutationChoice;
  chooseCancel(state: State, cities: number[]): number;
}

export interface Scenario {
  pos: [number, number];
  cubes: [city: number, strain: number, n: number][];
  samples?: [role: number, strain: number, n: number][];
  stations?: number[];
  discard: number[];
  deckTop: number[];
  deckBottom: number;
  mutationDeck: MutationId[];
  epidemicRounds: number[];
}

export interface Stats {
  cubesRemoved: number;
  actions: Record<Action["t"], number>;
  cureRounds: number[];
  cures: { strain: number; round: number; eradicatedRound: number | null }[];
  samplesCaught: number;
  mutations: { m: MutationId; strain: number; cured: boolean; eradicated: boolean }[];
}

function newStats(): Stats {
  return {
    cubesRemoved: 0,
    actions: { move: 0, fly: 0, treat: 0, give: 0, cure: 0, build: 0, lab: 0, quarantine: 0, lockdown: 0, forecast: 0, cancel: 0, pass: 0 },
    cureRounds: [],
    cures: [],
    samplesCaught: 0,
    mutations: [],
  };
}

const SCRATCH_STATS = newStats();

const SAVE_VERSION = 2;
const SAVED_FIELDS = [
  "cubes", "supply", "cured", "eradicated", "mutations", "breachUsed", "pos", "samples", "ap", "freeMove",
  "stations", "labCity", "labExpires", "quarantine", "locked", "deck", "deckSeg", "deckKnown", "discard", "lastDrawn",
  "segCounter", "epidemicRounds", "epidemicsDone", "mutationDeck", "forecastUsed", "lockdownUsed", "cancelUsed",
  "officerUses", "cancelPending", "outbreaks", "round", "status", "lossReason",
] as const;

export interface SaveData {
  v: number;
  cfg: Config;
  roles: [RoleId, RoleId];
  rngSeed: number;
  stats: Stats;
  [field: string]: unknown;
}

export class State {
  cubes = new Int8Array(CITY_COUNT * STRAINS);
  supply = new Int8Array(STRAINS);
  cured = new Uint8Array(STRAINS);
  eradicated = new Uint8Array(STRAINS);
  mutations = new Uint8Array(STRAINS);
  breachUsed = new Uint8Array(STRAINS);
  pos = new Int8Array(2);
  samples = new Int8Array(2 * STRAINS);
  ap = new Int8Array(2);
  freeMove = new Uint8Array(2);
  stations: number[] = [HUB];
  labCity = -1;
  labExpires = 0;
  quarantine: number[] = [];
  locked: number[] = [];
  deck: number[] = [];
  deckSeg: number[] = [];
  deckKnown: number[] = [];
  discard: number[] = [];
  lastDrawn: number[] = [];
  settingUp = false;
  events: GameEvent[] | null = null;
  private inf: { epidemics: number; offer: MutationId[] | null; drawn: number[] | null; cancelled: number; awaitingCancel: boolean } | null = null;
  segCounter = 0;
  epidemicRounds: number[] = [];
  epidemicsDone = 0;
  mutationDeck: MutationId[] = [];
  forecastUsed = 0;
  lockdownUsed = 0;
  cancelUsed = 0;
  officerUses = 0;
  cancelPending = 0;
  outbreaks = 0;
  round = 1;
  status: "playing" | "won" | "lost" = "playing";
  lossReason: LossReason | null = null;
  rng: Rng;
  stats: Stats;
  log: string[] | null = null;

  constructor(
    public cfg: Config,
    public roles: [RoleId, RoleId],
    seed: number,
  ) {
    this.rng = new Rng(seed);
    this.stats = newStats();
  }

  clone(full = false): State {
    const c = Object.create(State.prototype) as State;
    c.cfg = this.cfg;
    c.roles = this.roles;
    c.cubes = this.cubes.slice();
    c.supply = this.supply.slice();
    c.cured = this.cured.slice();
    c.eradicated = this.eradicated.slice();
    c.mutations = this.mutations.slice();
    c.breachUsed = this.breachUsed.slice();
    c.pos = this.pos.slice();
    c.samples = this.samples.slice();
    c.ap = this.ap.slice();
    c.freeMove = this.freeMove.slice();
    c.stations = this.stations.slice();
    c.labCity = this.labCity;
    c.labExpires = this.labExpires;
    c.quarantine = this.quarantine.slice();
    c.locked = this.locked.slice();
    c.deck = this.deck.slice();
    c.deckSeg = this.deckSeg.slice();
    c.deckKnown = this.deckKnown.slice();
    c.discard = this.discard.slice();
    c.lastDrawn = this.lastDrawn.slice();
    c.segCounter = this.segCounter;
    c.epidemicRounds = this.epidemicRounds;
    c.epidemicsDone = this.epidemicsDone;
    c.mutationDeck = this.mutationDeck.slice();
    c.forecastUsed = this.forecastUsed;
    c.lockdownUsed = this.lockdownUsed;
    c.cancelUsed = this.cancelUsed;
    c.officerUses = this.officerUses;
    c.cancelPending = this.cancelPending;
    c.outbreaks = this.outbreaks;
    c.round = this.round;
    c.status = this.status;
    c.lossReason = this.lossReason;
    c.rng = new Rng(this.rng.seed);
    c.stats = full ? structuredClone(this.stats) : SCRATCH_STATS;
    c.log = full && this.log ? this.log.slice() : null;
    c.settingUp = this.settingUp;
    c.events = null;
    c.inf = this.inf ? { ...this.inf, offer: this.inf.offer?.slice() ?? null, drawn: this.inf.drawn?.slice() ?? null } : null;
    return c;
  }

  serialize(): SaveData {
    if (this.inf) throw new Error("cannot save during the infection phase");
    const data: Record<string, unknown> = { v: SAVE_VERSION, cfg: this.cfg, roles: this.roles, rngSeed: this.rng.seed, stats: this.stats };
    for (const k of SAVED_FIELDS) {
      const value = (this as unknown as Record<string, unknown>)[k];
      data[k] = ArrayBuffer.isView(value) ? Array.from(value as Int8Array) : value;
    }
    return structuredClone(data) as SaveData;
  }

  static restore(data: SaveData): State {
    if (data.v !== SAVE_VERSION) throw new Error(`unsupported save version ${data.v}`);
    const s = new State(data.cfg, data.roles, data.rngSeed);
    s.rng.seed = data.rngSeed;
    s.stats = structuredClone(data.stats);
    const target = s as unknown as Record<string, unknown>;
    for (const k of SAVED_FIELDS) {
      const current = target[k];
      const value = (data as unknown as Record<string, unknown>)[k];
      if (value === undefined) continue;
      if (ArrayBuffer.isView(current)) (current as Int8Array).set(value as number[]);
      else target[k] = structuredClone(value);
    }
    return s;
  }

  hasRole(role: RoleId): number {
    return this.roles[0] === role ? 0 : this.roles[1] === role ? 1 : -1;
  }

  cube(city: number, s: number): number {
    return this.cubes[city * STRAINS + s];
  }

  maxCubes(s: number): number {
    return this.hasMutation(s, "acute") ? 2 : 3;
  }

  hasMutation(s: number, m: MutationId): boolean {
    return (this.mutations[s] & (1 << MUTATIONS.indexOf(m))) !== 0;
  }

  sample(r: number, s: number): number {
    return this.samples[r * STRAINS + s];
  }

  cureNeed(r: number, s: number): number {
    const base = this.roles[r] === "researcher" ? this.cfg.researcherCureNeed : this.cfg.cureNeed;
    return base + (this.hasMutation(s, "resistant") ? 1 : 0);
  }

  isLocked(city: number): boolean {
    if (this.cfg.policeMode === "passive") {
      const p = this.hasRole("police");
      return p >= 0 && this.pos[p] === city;
    }
    return this.locked.includes(city);
  }

  mutationTargets(): number[] {
    const all = [0, 1, 2].filter((s) => !this.eradicated[s]);
    if (!this.cfg.mutationUncuredOnly) return [0, 1, 2];
    const uncured = all.filter((s) => !this.cured[s]);
    return uncured.length > 0 ? uncured : [0, 1, 2];
  }

  isStation(city: number): boolean {
    return this.stations.includes(city) || this.labCity === city;
  }

  infectionRate(): number {
    const track = this.cfg.infectionRate;
    return track[Math.min(this.epidemicsDone, track.length - 1)];
  }

  curedCount(): number {
    return this.cured[0] + this.cured[1] + this.cured[2];
  }

  cubesOnBoard(s: number): number {
    return this.cfg.cubesPerStrain - this.supply[s];
  }

  apLeft(r: number): number {
    return this.cfg.ap.mode === "shared" ? this.ap[0] : this.ap[r];
  }

  totalAp(): number {
    return this.cfg.ap.mode === "shared" ? this.ap[0] : this.ap[0] + this.ap[1];
  }

  private pay(r: number, cost: number): void {
    if (this.cfg.ap.mode === "shared") this.ap[0] -= cost;
    else this.ap[r] -= cost;
  }

  private note(text: string): void {
    this.log?.push(text);
  }

  private emit(e: GameEvent): void {
    this.events?.push(e);
  }

  private lose(reason: LossReason): void {
    if (this.status !== "playing") return;
    this.status = "lost";
    this.lossReason = reason;
    this.note(`失败：${reason}`);
    this.emit({ t: "lose", reason });
  }

  cost(a: Action): number {
    switch (a.t) {
      case "pass":
        return 0;
      case "move":
        return this.roles[a.r] === "logistics" && this.freeMove[a.r] ? 0 : 1;
      case "build":
        return this.roles[a.r] === "engineer" ? this.cfg.engineerStationCost : this.cfg.stationCost;
      case "forecast":
        return this.cfg.forecastFree ? 0 : 1;
      case "lockdown":
        return this.cfg.lockdownCost;
      default:
        return 1;
    }
  }

  legalActions(includeAbilities = true): Action[] {
    const out: Action[] = [{ t: "pass" }];
    if (this.status !== "playing") return out;
    for (let r = 0; r < 2; r++) {
      const ap = this.apLeft(r);
      if (ap <= 0) continue;
      const role = this.roles[r];
      const c = this.pos[r];
      const other = 1 - r;
      for (const { to } of LINKS[c]) {
        const a: Action = { t: "move", r, to };
        if (this.cost(a) <= ap) out.push(a);
      }
      if (this.isStation(c)) {
        for (const to of [...this.stations, this.labCity]) {
          if (to >= 0 && to !== c && !(to === this.labCity && this.stations.includes(to))) out.push({ t: "fly", r, to });
        }
      }
      for (let s = 0; s < STRAINS; s++) {
        if (this.cube(c, s) > 0) out.push({ t: "treat", r, s });
        if (this.sample(r, s) > 0 && !this.cured[s] && (this.pos[other] === c || this.hasRole("logistics") >= 0)) {
          out.push({ t: "give", r, s });
        }
        if (!this.cured[s] && this.sample(r, s) >= this.cureNeed(r, s) && (role === "researcher" || this.isStation(c))) {
          out.push({ t: "cure", r, s });
        }
      }
      if (!this.stations.includes(c) && this.stations.length < this.cfg.maxStations) {
        const a: Action = { t: "build", r };
        if (this.cost(a) <= ap) out.push(a);
      }
      if (role === "engineer" && !this.isStation(c)) out.push({ t: "lab", r });
      if (role === "police" && this.cfg.policeMode === "edge") {
        for (const { edge } of LINKS[c]) if (!this.quarantine.includes(edge)) out.push({ t: "quarantine", r, edge });
      }
      if (role === "police" && this.cfg.policeMode === "lockdown" && !this.locked.includes(c) && this.cfg.lockdownCost <= ap && !(this.cfg.lockdownCost === 0 && this.lockdownUsed)) {
        out.push({ t: "lockdown", r });
      }
      if (includeAbilities) {
        if (role === "epidemiologist" && !this.forecastUsed && this.deck.length > 0) {
          for (let i = 0; i < Math.min(3, this.deck.length); i++) out.push({ t: "forecast", r, bury: i });
        }
        if (role === "officer" && !this.cancelUsed && this.officerUses > 0) out.push({ t: "cancel", r });
      }
    }
    return out;
  }

  apply(a: Action): void {
    if (a.t === "pass") {
      this.ap.fill(0);
      this.stats.actions.pass++;
      return;
    }
    const r = a.r;
    const cost = this.cost(a);
    this.pay(r, cost);
    this.stats.actions[a.t]++;
    const role = this.roles[r];
    switch (a.t) {
      case "move":
      case "fly":
        if (a.t === "move" && role === "logistics") this.freeMove[r] = 0;
        this.pos[r] = a.to;
        if (role === "medic") this.medicSweep(r);
        this.note(`${ROLE_NAMES[role]} → ${CITIES[a.to].name}`);
        break;
      case "treat": {
        const c = this.pos[r];
        const idx = c * STRAINS + a.s;
        const fullClear = (role === "medic" || this.cured[a.s]) && !this.hasMutation(a.s, "stubborn");
        const removed = fullClear ? this.cubes[idx] : 1;
        this.cubes[idx] -= removed;
        this.supply[a.s] += removed;
        this.stats.cubesRemoved += removed;
        if (!this.cured[a.s]) this.samples[r * STRAINS + a.s] += 1 + (role === "pharmacist" ? this.cfg.pharmacistBonus : 0);
        this.checkEradication(a.s);
        this.note(`${ROLE_NAMES[role]} 在${CITIES[c].name}治疗 ${removed}`);
        break;
      }
      case "give": {
        const other = 1 - r;
        this.samples[other * STRAINS + a.s] += this.samples[r * STRAINS + a.s];
        this.samples[r * STRAINS + a.s] = 0;
        break;
      }
      case "cure":
        this.samples[r * STRAINS + a.s] -= this.cureNeed(r, a.s);
        this.cured[a.s] = 1;
        this.stats.cureRounds.push(this.round);
        this.stats.cures.push({ strain: a.s, round: this.round, eradicatedRound: null });
        this.note(`研制出解药：${a.s}`);
        for (let m = 0; m < 2; m++) if (this.roles[m] === "medic") this.medicSweep(m);
        this.checkEradication(a.s);
        if (this.curedCount() === STRAINS) this.status = "won";
        break;
      case "build":
        this.stations.push(this.pos[r]);
        break;
      case "lab":
        this.labCity = this.pos[r];
        this.labExpires = this.round + this.cfg.labRounds - 1;
        break;
      case "quarantine":
        this.quarantine.push(a.edge);
        if (this.quarantine.length > this.cfg.maxQuarantine) this.quarantine.shift();
        break;
      case "lockdown":
        this.lockdownUsed = 1;
        this.locked.push(this.pos[r]);
        if (this.locked.length > this.cfg.lockdownMax) this.locked.shift();
        this.note(`封城：${CITIES[this.pos[r]].name}`);
        break;
      case "forecast": {
        this.forecastUsed = 1;
        const n = Math.min(3, this.deck.length);
        for (let i = 0; i < n; i++) this.deckKnown[i] = 1;
        const [city] = this.deck.splice(a.bury, 1);
        this.deckSeg.splice(a.bury, 1);
        this.deckKnown.splice(a.bury, 1);
        const at = Math.max(0, this.deck.length - 1);
        this.deck.splice(at, 0, city);
        this.deckSeg.splice(at, 0, -1);
        this.deckKnown.splice(at, 0, 1);
        break;
      }
      case "cancel":
        this.cancelUsed = 1;
        this.officerUses--;
        this.cancelPending = 1;
        break;
    }
  }

  private medicSweep(r: number): void {
    const c = this.pos[r];
    for (let s = 0; s < STRAINS; s++) {
      if (!this.cured[s] || this.hasMutation(s, "stubborn")) continue;
      const idx = c * STRAINS + s;
      if (this.cubes[idx] > 0) {
        this.supply[s] += this.cubes[idx];
        this.stats.cubesRemoved += this.cubes[idx];
        this.cubes[idx] = 0;
        this.checkEradication(s);
      }
    }
  }

  private checkEradication(s: number): void {
    if (this.cured[s] && !this.eradicated[s] && this.cubesOnBoard(s) === 0) {
      this.eradicated[s] = 1;
      const entry = this.stats.cures.find((c) => c.strain === s);
      if (entry) entry.eradicatedRound = this.round;
    }
  }

  private medicGuards(city: number, s: number): boolean {
    if (!this.cured[s] || this.hasMutation(s, "stubborn")) return false;
    const m = this.hasRole("medic");
    return m >= 0 && this.pos[m] === city;
  }

  infect(city: number, s: number, n: number): void {
    for (let i = 0; i < n && this.status === "playing"; i++) this.placeOne(city, s, null);
  }

  private placeOne(city: number, s: number, chain: Set<number> | null): void {
    if (this.status !== "playing" || this.eradicated[s]) return;
    if (this.medicGuards(city, s)) return this.emit({ t: "guarded", city, s });
    if (chain?.has(city)) return;
    if (!chain && this.cfg.lockdownBlocksInfection && this.isLocked(city) && !this.useBreach(s)) return this.lockdownCatch(city, s);
    const idx = city * STRAINS + s;
    if (this.cubes[idx] < this.maxCubes(s)) {
      if (this.supply[s] <= 0) return this.lose("cubes");
      this.cubes[idx]++;
      this.supply[s]--;
      this.emit({ t: "cube", city, s });
      return;
    }
    this.outbreak(city, s, chain ?? new Set());
  }

  private outbreak(city: number, s: number, chain: Set<number>): void {
    chain.add(city);
    if (this.isLocked(city) && !this.useBreach(s)) {
      this.note(`封城控制住爆发：${CITIES[city].name}`);
      return this.lockdownCatch(city, s);
    }
    const targets: number[] = [];
    const shielded: number[] = [];
    for (const { to, edge } of LINKS[city]) {
      if (this.quarantine.includes(edge) && !this.useBreach(s)) continue;
      if (this.isLocked(to) && !this.useBreach(s)) {
        shielded.push(to);
        continue;
      }
      targets.push(to);
    }
    if (targets.length === 0 && this.cfg.sealedOutbreakFree) {
      this.note(`封锁住的爆发：${CITIES[city].name}`);
      return;
    }
    this.outbreaks++;
    this.note(`爆发：${CITIES[city].name}`);
    this.emit({ t: "outbreak", city, s, total: this.outbreaks });
    if (this.outbreaks >= this.cfg.outbreakLimit) return this.lose("outbreaks");
    shielded.forEach((to) => this.emit({ t: "shielded", city: to, s }));
    for (const to of targets) {
      this.placeOne(to, s, chain);
      if (this.status !== "playing") return;
    }
  }

  private lockdownCatch(city: number, s: number): void {
    const p = this.hasRole("police");
    const sample = this.cfg.lockdownSample && !this.settingUp && p >= 0 && !this.cured[s];
    if (sample) {
      this.samples[p * STRAINS + s]++;
      this.stats.samplesCaught++;
    }
    this.emit({ t: "blocked", city, s, sample });
  }

  private useBreach(s: number): boolean {
    if (!this.hasMutation(s, "breach") || this.breachUsed[s]) return false;
    this.breachUsed[s] = 1;
    return true;
  }

  private drawTop(): number {
    if (this.deck.length === 0) this.intensify();
    this.deckSeg.shift();
    this.deckKnown.shift();
    return this.deck.shift()!;
  }

  private intensify(): void {
    const seg = ++this.segCounter;
    const cards = this.rng.shuffle(this.discard.splice(0));
    this.deck.unshift(...cards);
    this.deckSeg.unshift(...cards.map(() => seg));
    this.deckKnown.unshift(...cards.map(() => 0));
  }

  private epidemicDraw(): void {
    this.epidemicsDone++;
    if (this.deck.length === 0) this.intensify();
    const city = this.deck.pop()!;
    this.deckSeg.pop();
    this.deckKnown.pop();
    this.note(`流行病：${CITIES[city].name}`);
    this.emit({ t: "epidemic", city, count: this.epidemicsDone });
    this.infect(city, CITIES[city].strain, 3);
    this.discard.push(city);
    if (this.status !== "playing") return;
    this.intensify();
    this.emit({ t: "intensify" });
    const cards = this.mutationDeck.splice(0, 2);
    if (cards.length && this.inf) this.inf.offer = cards;
  }

  resolveMutation(choice: MutationChoice): void {
    const cards = this.inf?.offer;
    if (!cards) throw new Error("no mutation offer pending");
    if (!this.mutationTargets().includes(choice.strain)) throw new Error(`illegal mutation target ${choice.strain}`);
    const m = cards[choice.card];
    this.mutations[choice.strain] |= 1 << MUTATIONS.indexOf(m);
    this.stats.mutations.push({ m, strain: choice.strain, cured: !!this.cured[choice.strain], eradicated: !!this.eradicated[choice.strain] });
    const rest = cards.filter((_, i) => i !== choice.card);
    this.mutationDeck.push(...rest);
    this.inf!.offer = null;
    this.note(`变异：${MUTATION_NAMES[m]} → ${choice.strain}`);
    this.emit({ t: "mutation", m, strain: choice.strain });
  }

  resolveCancel(index: number): void {
    const inf = this.inf;
    if (!inf?.awaitingCancel || !inf.drawn) throw new Error("no cancel choice pending");
    inf.cancelled = index;
    inf.awaitingCancel = false;
    this.cancelPending = 0;
    this.emit({ t: "cancelled", city: inf.drawn[index] });
  }

  get inInfection(): boolean {
    return this.inf !== null;
  }

  beginInfection(): void {
    if (this.status !== "playing" || this.inf) return;
    if (this.round >= this.cfg.rounds) return this.lose("time");
    this.inf = {
      epidemics: this.epidemicRounds.filter((r) => r === this.round).length,
      offer: null,
      drawn: null,
      cancelled: -1,
      awaitingCancel: false,
    };
  }

  continueInfection(): Pending | null {
    const inf = this.inf;
    while (inf && this.status === "playing") {
      if (inf.offer) return { kind: "mutation", cards: inf.offer.slice(), targets: this.mutationTargets() };
      if (inf.awaitingCancel && inf.drawn) return { kind: "cancel", cities: inf.drawn.slice() };
      if (inf.epidemics > 0) {
        inf.epidemics--;
        this.epidemicDraw();
        continue;
      }
      if (!inf.drawn) {
        inf.drawn = [];
        for (let i = 0; i < this.infectionRate(); i++) inf.drawn.push(this.drawTop());
        this.emit({ t: "named", cities: inf.drawn.slice() });
        if (this.cancelPending) {
          inf.awaitingCancel = true;
          continue;
        }
      }
      const drawn = inf.drawn;
      drawn.forEach((city, i) => {
        if (i === inf.cancelled || this.status !== "playing") return;
        this.emit({ t: "infecting", city });
        const s = CITIES[city].strain;
        const n = this.hasMutation(s, "virulent") && this.cube(city, s) > 0 ? 2 : 1;
        this.infect(city, s, n);
      });
      this.discard.push(...drawn);
      this.lastDrawn = drawn;
      this.inf = null;
      if (this.status !== "playing") return null;
      if (this.labCity >= 0 && this.labExpires <= this.round) {
        this.emit({ t: "labExpired", city: this.labCity });
        this.labCity = -1;
      }
      this.round++;
      this.startRound();
      this.emit({ t: "round", round: this.round });
      return null;
    }
    this.inf = null;
    return null;
  }

  setup(): void {
    this.supply.fill(this.cfg.cubesPerStrain);
    this.deck = this.rng.shuffle(CITIES.map((c) => c.id));
    this.deckSeg = this.deck.map(() => 0);
    this.deckKnown = this.deck.map(() => 0);
    this.settingUp = true;
    for (const n of this.cfg.setup) {
      const city = this.drawTop();
      this.infect(city, CITIES[city].strain, n);
      this.discard.push(city);
    }
    this.settingUp = false;
    this.mutationDeck = this.rng.shuffle([...MUTATIONS]);
    const span = (this.cfg.rounds - 1) / Math.max(1, this.cfg.epidemics);
    for (let i = 0; i < this.cfg.epidemics; i++) {
      const lo = 2 + Math.floor(i * span);
      const hi = 2 + Math.floor((i + 1) * span) - 1;
      this.epidemicRounds.push(lo + this.rng.int(Math.max(1, hi - lo + 1)));
    }
    this.officerUses = this.cfg.officerUses;
    this.startRound();
  }

  setupScenario(sc: Scenario): void {
    this.supply.fill(this.cfg.cubesPerStrain);
    for (const [city, s, n] of sc.cubes) {
      this.cubes[city * STRAINS + s] += n;
      this.supply[s] -= n;
    }
    for (const [r, s, n] of sc.samples ?? []) this.samples[r * STRAINS + s] = n;
    this.pos.set(sc.pos);
    this.stations = sc.stations?.slice() ?? [HUB];
    this.discard = sc.discard.slice();
    const placed = new Set([...sc.deckTop, sc.deckBottom, ...sc.discard]);
    this.deck = [...sc.deckTop, ...CITIES.map((c) => c.id).filter((c) => !placed.has(c)), sc.deckBottom];
    this.deckSeg = this.deck.map(() => 0);
    this.deckKnown = this.deck.map(() => 0);
    this.mutationDeck = sc.mutationDeck.slice();
    this.epidemicRounds = sc.epidemicRounds.slice();
    this.officerUses = this.cfg.officerUses;
    this.startRound();
  }

  private startRound(): void {
    if (this.cfg.ap.mode === "shared") {
      this.ap[0] = this.cfg.ap.n;
      this.ap[1] = 0;
    } else {
      this.ap.fill(this.cfg.ap.n);
    }
    for (let r = 0; r < 2; r++) this.freeMove[r] = this.roles[r] === "logistics" && this.cfg.logisticsFreeMove ? 1 : 0;
    this.forecastUsed = 0;
    this.lockdownUsed = 0;
    this.cancelUsed = 0;
    this.breachUsed.fill(0);
  }

  endRound(chooser: Chooser): void {
    this.beginInfection();
    for (let p = this.continueInfection(); p; p = this.continueInfection()) {
      if (p.kind === "mutation") this.resolveMutation(chooser.chooseMutation(this, p.cards));
      else this.resolveCancel(chooser.chooseCancel(this, p.cities));
    }
  }

  drawProbabilities(): Float64Array {
    const p = new Float64Array(CITY_COUNT);
    const draws = this.infectionRate();
    let start = 0;
    while (start < this.deck.length && start < draws) {
      let end = start;
      while (end < this.deck.length && this.deckSeg[end] === this.deckSeg[start]) end++;
      let slots = 0;
      let unknown = 0;
      for (let i = start; i < end; i++) {
        if (this.deckKnown[i]) {
          if (i < draws) p[this.deck[i]] = 1;
        } else {
          unknown++;
          if (i < draws) slots++;
        }
      }
      if (unknown > 0) {
        for (let i = start; i < end; i++) if (!this.deckKnown[i]) p[this.deck[i]] = slots / unknown;
      }
      start = end;
    }
    return p;
  }
}

export function distance(a: number, b: number): number {
  return DIST[a][b];
}
