import type { TroopDef, TroopId } from './types';

export const TROOPS: Record<TroopId, TroopDef> = {
  pip: { id: 'pip', strength: 'joker', effect: 'none' },
  mira: { id: 'mira', strength: 1, effect: 'draw2' },
  boing: { id: 'boing', strength: 2, effect: 'playAgain' },
  brix: { id: 'brix', strength: 3, effect: 'removeAdjacent' },
  hop: { id: 'hop', strength: 4, effect: 'ignoreConnection' },
  clank: { id: 'clank', strength: 5, effect: 'discardEnemy' },
  bruno: { id: 'bruno', strength: 6, effect: 'draw1' },
  rexie: { id: 'rexie', strength: 7, effect: 'none' },
};

export const TROOP_IDS = Object.keys(TROOPS) as TroopId[];
export const COPIES_PER_TROOP = 3;
export const REMOVED_AT_SETUP = 4;
export const HAND_LIMIT = 8;

export function beats(attacker: TroopId, defender: TroopId): boolean {
  const a = TROOPS[attacker].strength, d = TROOPS[defender].strength;
  if (a === 'joker' || d === 'joker') return true;
  return a > d;
}
