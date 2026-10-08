import { availableParallelism } from "node:os";
import { fileURLToPath } from "node:url";
import { isMainThread, parentPort, Worker, workerData } from "node:worker_threads";
import { ROLE_NAMES, ROLES, type RoleId } from "../engine/roles.js";
import { V2_CONFIG, V2State, type V2Config } from "../engine/game.js";
import { V2HeuristicPolicy, V2RandomPolicy } from "./bot.js";

interface Job {
  roles: [RoleId, RoleId];
  games: number;
  seed: number;
  cfg: V2Config;
  policy: "heuristic" | "random";
  beam: number;
}

interface Tally {
  roles: [RoleId, RoleId];
  games: number;
  wins: number;
  reasons: Record<string, number>;
  rounds: number;
  score: number;
  carriers: number;
  inFlight: number;
  intercepted: number;
  blocked: number;
  outbreaks: number;
  firstRiot: number;
  firstRiotGames: number;
  actions: Record<string, number>;
}

function runJob(job: Job): Tally {
  const t: Tally = { roles: job.roles, games: job.games, wins: 0, reasons: {}, rounds: 0, score: 0, carriers: 0, inFlight: 0, intercepted: 0, blocked: 0, outbreaks: 0, firstRiot: 0, firstRiotGames: 0, actions: {} };
  for (let g = 0; g < job.games; g++) {
    const s = new V2State(job.cfg, job.roles, job.seed + g);
    s.setup();
    const p = job.policy === "random" ? new V2RandomPolicy(job.seed + g) : new V2HeuristicPolicy(job.beam);
    while (s.status === "playing") {
      p.playRound(s);
      s.endRound();
    }
    if (s.status === "won") t.wins++;
    else t.reasons[s.lossReason!] = (t.reasons[s.lossReason!] ?? 0) + 1;
    t.rounds += s.round;
    t.score += s.score();
    t.carriers += s.stats.carriers;
    t.inFlight += s.stats.inFlight / s.round;
    t.intercepted += s.stats.intercepted;
    t.blocked += s.stats.blocked;
    t.outbreaks += s.stats.outbreaks;
    if (s.stats.firstRiot !== null) {
      t.firstRiot += s.stats.firstRiot;
      t.firstRiotGames++;
    }
    for (const [k, v] of Object.entries(s.stats.actions)) t.actions[k] = (t.actions[k] ?? 0) + v;
  }
  return t;
}

if (!isMainThread) {
  parentPort!.on("message", (job: Job) => parentPort!.postMessage(runJob(job)));
} else {
  const games = Number(process.env.GAMES ?? 60);
  const beam = Number(process.env.BEAM ?? 10);
  const policy = (process.env.POLICY ?? "heuristic") as Job["policy"];
  const variants: Partial<V2Config>[] = JSON.parse(process.env.CFGS ?? "[{}]");
  const pairs: [RoleId, RoleId][] = ROLES.flatMap((a, i) => ROLES.slice(i + 1).map((b): [RoleId, RoleId] => [a, b]));
  const pct = (a: number, b: number) => `${((a / b) * 100).toFixed(1)}%`;
  for (const variant of variants) {
    const cfg = { ...V2_CONFIG, ...variant, panic: { ...V2_CONFIG.panic, ...(variant.panic ?? {}) } };
    const jobs: Job[] = pairs.map((roles, i) => ({ roles, games, seed: 9_000_000 + i * 10_000, cfg, policy, beam }));
    const workers = Array.from({ length: Math.min(availableParallelism(), jobs.length) }, () => new Worker(fileURLToPath(import.meta.url)));
    const results: Tally[] = [];
    await new Promise<void>((done) => {
      let next = 0;
      const feed = (w: Worker) => {
        if (next < jobs.length) w.postMessage(jobs[next++]);
        else if (results.length === jobs.length) done();
      };
      workers.forEach((w) => {
        w.on("message", (t: Tally) => {
          results.push(t);
          feed(w);
          if (results.length === jobs.length) done();
        });
        feed(w);
      });
    });
    await Promise.all(workers.map((w) => w.terminate()));
    const all = results.reduce((a, t) => {
      a.games += t.games; a.wins += t.wins; a.rounds += t.rounds; a.score += t.score; a.carriers += t.carriers; a.inFlight += t.inFlight;
      a.intercepted += t.intercepted; a.blocked += t.blocked; a.outbreaks += t.outbreaks; a.firstRiot += t.firstRiot; a.firstRiotGames += t.firstRiotGames;
      for (const [k, v] of Object.entries(t.reasons)) a.reasons[k] = (a.reasons[k] ?? 0) + v;
      for (const [k, v] of Object.entries(t.actions)) a.actions[k] = (a.actions[k] ?? 0) + v;
      return a;
    }, { games: 0, wins: 0, rounds: 0, score: 0, carriers: 0, inFlight: 0, intercepted: 0, blocked: 0, outbreaks: 0, firstRiot: 0, firstRiotGames: 0, reasons: {} as Record<string, number>, actions: {} as Record<string, number> });
    results.sort((a, b) => a.wins / a.games - b.wins / b.games);
    const name = (t: Tally) => t.roles.map((r) => ROLE_NAMES[r]).join("+");
    const per = (v: number) => (v / all.games).toFixed(1);
    console.log(`\n== ${JSON.stringify(variant)} · ${policy}${policy === "heuristic" ? ` beam ${beam}` : ""} · ${all.games} games`);
    console.log(`win ${pct(all.wins, all.games)} | worst ${pct(results[0].wins, results[0].games)} ${name(results[0])} | best ${pct(results.at(-1)!.wins, results.at(-1)!.games)} ${name(results.at(-1)!)} | loss ${JSON.stringify(all.reasons)}`);
    console.log(`rounds ${per(all.rounds)} | score(win avg) ${all.wins ? (all.score / all.wins).toFixed(0) : "-"} | first riot round ${all.firstRiotGames ? (all.firstRiot / all.firstRiotGames).toFixed(1) : "-"} (${pct(all.firstRiotGames, all.games)} of games)`);
    console.log(`carriers/game ${per(all.carriers)} | in flight/round ${per(all.inFlight)} | intercepted ${per(all.intercepted)} | blocked ${per(all.blocked)} | outbreaks ${per(all.outbreaks)}`);
    console.log(`actions/game ${Object.entries(all.actions).filter(([, v]) => v).map(([k, v]) => `${k} ${per(v)}`).join(" · ")}`);
  }
}
