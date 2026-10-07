import { DEFAULT_CONFIG, RoleId } from "../engine/game.js";
import { playGame } from "./play.js";

const [a = "medic", b = "researcher", seed = "1"] = process.argv.slice(2);
const { state, result } = playGame(DEFAULT_CONFIG, [a as RoleId, b as RoleId], "heuristic", Number(seed), true);
console.log(state.log!.join("\n"));
console.log(result);
