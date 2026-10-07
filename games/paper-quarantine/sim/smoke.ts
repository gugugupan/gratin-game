import { DEFAULT_CONFIG, RoleId } from "../engine/game.js";
import { playGame, PolicyName } from "./play.js";

const policy = (process.argv[2] ?? "heuristic") as PolicyName;
const n = Number(process.argv[3] ?? 50);
const roles: [RoleId, RoleId] = ["medic", "researcher"];
const t0 = Date.now();
let wins = 0;
const reasons: Record<string, number> = {};
for (let i = 0; i < n; i++) {
  const { result } = playGame(DEFAULT_CONFIG, roles, policy, 1000 + i);
  if (result.won) wins++;
  else reasons[result.reason!] = (reasons[result.reason!] ?? 0) + 1;
}
console.log(policy, `win ${wins}/${n}`, reasons, `${((Date.now() - t0) / n).toFixed(1)}ms/game`);
