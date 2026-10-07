import { Config, LossReason, MutationId, RoleId, State } from "../engine/game.js";
import { HeuristicPolicy, Policy, RandomPolicy } from "./bots.js";

export type PolicyName = "heuristic" | "random";

export interface GameResult {
  won: boolean;
  reason: LossReason | null;
  rounds: number;
  outbreaks: number;
  cured: number;
  cureRounds: number[];
  mutations: { m: MutationId; strain: number; cured: boolean; eradicated: boolean }[];
  actions: Record<string, number>;
}

export function makePolicy(name: PolicyName, seed: number): Policy {
  return name === "random" ? new RandomPolicy(seed ^ 0x5bd1e995) : new HeuristicPolicy({ beamWidth: Number(process.env.BEAM ?? 16) });
}

export function playGame(cfg: Config, roles: [RoleId, RoleId], policyName: PolicyName, seed: number, log = false): { result: GameResult; state: State } {
  const state = new State(cfg, roles, seed);
  if (log) state.log = [];
  const policy = makePolicy(policyName, seed);
  state.setup();
  while (state.status === "playing") {
    policy.playRound(state);
    state.endRound(policy);
  }
  return {
    state,
    result: {
      won: state.status === "won",
      reason: state.lossReason,
      rounds: state.round,
      outbreaks: state.outbreaks,
      cured: state.curedCount(),
      cureRounds: state.stats.cureRounds,
      mutations: state.stats.mutations,
      actions: state.stats.actions,
    },
  };
}
