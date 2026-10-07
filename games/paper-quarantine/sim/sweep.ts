import { ApRule, Config, DEFAULT_CONFIG, ROLES, RoleId } from "../engine/game.js";
import { playGame } from "./play.js";

const n = Number(process.env.GAMES ?? 60);
const pairs: [RoleId, RoleId][] = ROLES.flatMap((a, i) => ROLES.slice(i + 1).map((b): [RoleId, RoleId] => [a, b]));
const perRole3: ApRule = { mode: "perRole", n: 3 };
const shared4: ApRule = { mode: "shared", n: 4 };
const fixes: Partial<Config> = { forecastFree: true, logisticsFreeMove: false };
const configs: [string, Partial<Config>][] = [
  ["每人3点 + 流行病5 + 10轮", { ap: perRole3, epidemics: 5, rounds: 10 }],
  ["每人3点 + 流行病5 + 开局9城", { ap: perRole3, epidemics: 5, setup: [3, 3, 3, 2, 2, 2, 1, 1, 1] }],
  ["每人3点 + 流行病5 + 10轮 + 职业修正", { ap: perRole3, epidemics: 5, rounds: 10, ...fixes }],
  ["共享4点 + 职业修正", { ap: shared4, ...fixes }],
  ["共享4点 + 职业修正 + 流行病3", { ap: shared4, epidemics: 3, ...fixes }],
];
for (const [label, patch] of configs) {
  const rates = pairs.map((roles, pi) => {
    let w = 0;
    for (let i = 0; i < n; i++) if (playGame({ ...DEFAULT_CONFIG, ...patch }, roles, "heuristic", 20_000_000 + pi * 1000 + i).result.won) w++;
    return w / n;
  });
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const sd = Math.sqrt(rates.reduce((a, r) => a + (r - mean) ** 2, 0) / rates.length);
  console.log(`${label}: ${(mean * 100).toFixed(1)}% sd ${(sd * 100).toFixed(1)} min ${(Math.min(...rates) * 100).toFixed(0)}% max ${(Math.max(...rates) * 100).toFixed(0)}%`);
}
