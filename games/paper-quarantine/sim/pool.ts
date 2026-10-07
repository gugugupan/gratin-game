import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort, Worker, workerData } from "node:worker_threads";
import { Config, ROLE_NAMES, ROLES, RoleId } from "../engine/game.js";
import { GameResult, playGame, PolicyName } from "./play.js";

export interface Cell {
  key: string;
  cfg: Config;
  roles: [RoleId, RoleId];
  policy: PolicyName;
  games: number;
  seed: number;
}

export interface Summary {
  key: string;
  roles: [RoleId, RoleId];
  policy: PolicyName;
  games: number;
  wins: number;
  reasons: Record<string, number>;
  rounds: number;
  winRounds: number;
  outbreaks: number;
  cured: number;
  actions: Record<string, number>;
  mutations: Record<string, { picks: number; onCured: number; onEradicated: number }>;
}

function summarize(cell: Cell): Summary {
  const sum: Summary = {
    key: cell.key,
    roles: cell.roles,
    policy: cell.policy,
    games: cell.games,
    wins: 0,
    reasons: {},
    rounds: 0,
    winRounds: 0,
    outbreaks: 0,
    cured: 0,
    actions: {},
    mutations: {},
  };
  for (let i = 0; i < cell.games; i++) {
    const { result } = playGame(cell.cfg, cell.roles, cell.policy, cell.seed + i);
    accumulate(sum, result);
  }
  return sum;
}

function accumulate(sum: Summary, r: GameResult): void {
  if (r.won) {
    sum.wins++;
    sum.winRounds += r.rounds;
  } else sum.reasons[r.reason!] = (sum.reasons[r.reason!] ?? 0) + 1;
  sum.rounds += r.rounds;
  sum.outbreaks += r.outbreaks;
  sum.cured += r.cured;
  for (const [k, v] of Object.entries(r.actions)) sum.actions[k] = (sum.actions[k] ?? 0) + v;
  for (const m of r.mutations) {
    const e = (sum.mutations[m.m] ??= { picks: 0, onCured: 0, onEradicated: 0 });
    e.picks++;
    if (m.cured) e.onCured++;
    if (m.eradicated) e.onEradicated++;
  }
}

export async function runAll(cells: Cell[]): Promise<Summary[]> {
  const threads = Math.max(1, availableParallelism() - 1);
  const chunks: Cell[][] = Array.from({ length: threads }, () => []);
  const split: Cell[] = [];
  for (const c of cells) {
    const parts = Math.max(1, Math.ceil(c.games / 100));
    for (let i = 0; i < parts; i++) {
      const games = Math.min(100, c.games - i * 100);
      split.push({ ...c, games, seed: c.seed + i * 100 });
    }
  }
  split.forEach((c, i) => chunks[i % threads].push(c));
  const self = fileURLToPath(import.meta.url);
  const results = await Promise.all(
    chunks.filter((c) => c.length).map(
      (chunk) =>
        new Promise<Summary[]>((resolve, reject) => {
          const w = new Worker(self, { workerData: chunk });
          w.once("message", resolve);
          w.once("error", reject);
        }),
    ),
  );
  const merged = new Map<string, Summary>();
  for (const s of results.flat()) {
    const m = merged.get(s.key);
    if (!m) {
      merged.set(s.key, s);
      continue;
    }
    m.games += s.games;
    m.wins += s.wins;
    m.rounds += s.rounds;
    m.winRounds += s.winRounds;
    m.outbreaks += s.outbreaks;
    m.cured += s.cured;
    for (const [k, v] of Object.entries(s.reasons)) m.reasons[k] = (m.reasons[k] ?? 0) + v;
    for (const [k, v] of Object.entries(s.actions)) m.actions[k] = (m.actions[k] ?? 0) + v;
    for (const [k, v] of Object.entries(s.mutations)) {
      const e = (m.mutations[k] ??= { picks: 0, onCured: 0, onEradicated: 0 });
      e.picks += v.picks;
      e.onCured += v.onCured;
      e.onEradicated += v.onEradicated;
    }
  }
  return cells.map((c) => merged.get(c.key)!);
}

export const PAIRS: [RoleId, RoleId][] = ROLES.flatMap((a, i) => ROLES.slice(i + 1).map((b): [RoleId, RoleId] => [a, b]));

export const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "-");
export const avg = (a: number, b: number) => (b ? (a / b).toFixed(1) : "-");
export const pairName = (p: [RoleId, RoleId]) => `${ROLE_NAMES[p[0]]}+${ROLE_NAMES[p[1]]}`;

export function total(list: Summary[]): Summary {
  const t: Summary = { ...list[0], key: "total", games: 0, wins: 0, reasons: {}, rounds: 0, winRounds: 0, outbreaks: 0, cured: 0, actions: {}, mutations: {} };
  for (const s of list) {
    t.games += s.games;
    t.wins += s.wins;
    t.rounds += s.rounds;
    t.winRounds += s.winRounds;
    t.outbreaks += s.outbreaks;
    t.cured += s.cured;
    for (const [k, v] of Object.entries(s.reasons)) t.reasons[k] = (t.reasons[k] ?? 0) + v;
    for (const [k, v] of Object.entries(s.actions)) t.actions[k] = (t.actions[k] ?? 0) + v;
    for (const [k, v] of Object.entries(s.mutations)) {
      const e = (t.mutations[k] ??= { picks: 0, onCured: 0, onEradicated: 0 });
      e.picks += v.picks;
      e.onCured += v.onCured;
      e.onEradicated += v.onEradicated;
    }
  }
  return t;
}

export function spread(list: Summary[]): { min: Summary; max: Summary; sd: number } {
  const rates = list.map((s) => s.wins / s.games);
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const sd = Math.sqrt(rates.reduce((a, r) => a + (r - mean) ** 2, 0) / rates.length);
  const sorted = [...list].sort((a, b) => a.wins / a.games - b.wins / b.games);
  return { min: sorted[0], max: sorted[sorted.length - 1], sd };
}

if (!isMainThread) {
  const cells = workerData as Cell[];
  parentPort!.postMessage(cells.map(summarize));
}
