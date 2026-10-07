import { DEFAULT_CONFIG, State, type RoleId, type Scenario } from "./game.js";

export const TUTORIAL_ROLES: [RoleId, RoleId] = ["medic", "researcher"];
export const TUTORIAL_SEED = 1;

export const TUTORIAL_SCENARIO: Scenario = {
  pos: [0, 1],
  cubes: [
    [3, 0, 1], [4, 0, 2], [5, 0, 3],
    [7, 1, 2], [8, 1, 1],
    [13, 2, 2], [15, 2, 1],
  ],
  samples: [[1, 0, 1]],
  discard: [4, 3, 7, 13],
  deckTop: [5, 8, 15],
  deckBottom: 9,
  mutationDeck: ["resistant", "stubborn", "virulent", "acute", "breach"],
  epidemicRounds: [2],
};

export function tutorialState(seed = TUTORIAL_SEED): State {
  const s = new State(DEFAULT_CONFIG, TUTORIAL_ROLES, seed);
  s.setupScenario(TUTORIAL_SCENARIO);
  return s;
}
