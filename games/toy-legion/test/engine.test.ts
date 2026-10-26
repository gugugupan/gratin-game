import { describe, expect, it } from 'vitest';
import {
  CASTLE_FIELD, apply, canDraw, connected, legalActions, legalTargets, newGame, tileCount,
  type GameState, type Side, type TroopId,
} from '../src/engine';

let nextUid = 1000;
function scenario(opts: {
  turn?: Side;
  red?: TroopId[];
  blue?: TroopId[];
  stacks?: Record<string, [Side, TroopId][]>;
  medals?: Partial<Record<Side, number>>;
  reserve?: Partial<Record<Side, number>>;
}): GameState {
  const s = newGame({ seed: 1, first: opts.turn ?? 'red' });
  s.turn = opts.turn ?? 'red';
  for (const side of ['red', 'blue'] as Side[]) {
    s.hand[side] = (opts[side] ?? []).map(troop => ({ uid: nextUid++, troop, side }));
    if (opts.reserve?.[side] !== undefined) s.reserve[side] = s.reserve[side].slice(0, opts.reserve[side]);
  }
  for (const [node, tiles] of Object.entries(opts.stacks ?? {})) {
    s.stacks[node] = tiles.map(([side, troop]) => ({ uid: nextUid++, troop, side }));
  }
  Object.assign(s.medals, opts.medals);
  return s;
}
const tileOf = (s: GameState, troop: TroopId, side: Side = s.turn) => s.hand[side].find(t => t.troop === troop)!.uid;
const place = (s: GameState, troop: TroopId, node: string) => apply(s, { type: 'place', tile: tileOf(s, troop), node });

describe('map', () => {
  it('is symmetric and connected', () => {
    const ids = Object.keys(CASTLE_FIELD.nodes);
    expect(ids).toHaveLength(19);
    expect(CASTLE_FIELD.regions.reduce((n, r) => n + r.medals, 0)).toBe(14);
    for (const [a, b] of CASTLE_FIELD.edges) expect(ids).toContain(a), expect(ids).toContain(b);
  });
});

describe('setup', () => {
  it('deals 3 to the first player and 4 to the second', () => {
    const s = newGame({ seed: 42, first: 'blue' });
    expect(s.turn).toBe('blue');
    expect(s.hand.blue).toHaveLength(3);
    expect(s.hand.red).toHaveLength(4);
    expect(s.box).toHaveLength(8);
    expect(s.reserve.blue).toHaveLength(24 - 4 - 3);
    expect(tileCount(s)).toBe(48);
  });
  it('is deterministic for a seed', () => {
    expect(newGame({ seed: 7 })).toEqual(newGame({ seed: 7 }));
  });
});

describe('placement', () => {
  it('starts next to your own HQ only', () => {
    const s = scenario({ red: ['brix'] });
    expect(legalTargets(s, tileOf(s, 'brix')).sort()).toEqual(['A', 'B', 'D']);
  });
  it('extends through bases you occupy', () => {
    const s = scenario({ red: ['brix'], stacks: { B: [['red', 'mira']] } });
    expect(legalTargets(s, tileOf(s, 'brix'))).toEqual(expect.arrayContaining(['C', 'C1', 'C2', 'B']));
  });
  it('needs a strictly stronger troop to cover an enemy', () => {
    const s = scenario({ red: ['brix', 'rexie'], stacks: { A: [['blue', 'clank']] } });
    expect(legalTargets(s, tileOf(s, 'brix'))).not.toContain('A');
    expect(legalTargets(s, tileOf(s, 'rexie'))).toContain('A');
    const tie = scenario({ red: ['clank'], stacks: { A: [['blue', 'clank']] } });
    expect(legalTargets(tie, tileOf(tie, 'clank'))).not.toContain('A');
  });
  it('lets the joker cover anything and be covered by anything', () => {
    const s = scenario({ red: ['pip'], stacks: { A: [['blue', 'rexie']] } });
    expect(legalTargets(s, tileOf(s, 'pip'))).toContain('A');
    const t = scenario({ red: ['mira'], stacks: { A: [['blue', 'pip']] } });
    expect(legalTargets(t, tileOf(t, 'mira'))).toContain('A');
  });
  it('never allows your own HQ', () => {
    const s = scenario({ red: ['rexie'] });
    expect(legalTargets(s, tileOf(s, 'rexie'))).not.toContain('hqR');
  });
  it('lets the frog ignore connection but not reach the enemy HQ', () => {
    const s = scenario({ red: ['hop'] });
    const targets = legalTargets(s, tileOf(s, 'hop'));
    expect(targets).toContain("C'");
    expect(targets).toContain('GB');
    expect(targets).not.toContain('hqB');
  });
  it('wins immediately on the enemy HQ', () => {
    const s = scenario({ red: ['mira'], blue: ['rexie'], stacks: { B: [['red', 'brix']], C2: [['red', 'brix']], "B'": [['red', 'brix']] } });
    expect(legalTargets(s, tileOf(s, 'mira'))).toContain('hqB');
    const after = place(s, 'mira', 'hqB');
    expect(after.winner).toBe('red');
    expect(after.endReason).toBe('hq');
  });
  it('rejects illegal moves without touching the state', () => {
    const s = scenario({ red: ['brix'] });
    expect(() => place(s, 'brix', 'C2')).toThrow();
    expect(s.stacks.C2).toHaveLength(0);
  });
});

describe('drawing', () => {
  it('draws two and passes the turn', () => {
    const s = scenario({ red: ['brix'] });
    const after = apply(s, { type: 'draw' });
    expect(after.hand.red).toHaveLength(3);
    expect(after.turn).toBe('blue');
  });
  it('respects the hand limit of 8', () => {
    const seven = scenario({ red: Array(7).fill('mira') });
    expect(apply(seven, { type: 'draw' }).hand.red).toHaveLength(8);
    const eight = scenario({ red: Array(8).fill('mira') });
    expect(canDraw(eight)).toBe(false);
  });
});

describe('effects', () => {
  it('1 draws two cards', () => {
    const s = scenario({ red: ['mira'], blue: ['rexie'] });
    const after = place(s, 'mira', 'A');
    expect(after.hand.red).toHaveLength(2);
    expect(after.turn).toBe('blue');
  });
  it('2 plays another troop right away, or skips', () => {
    const s = scenario({ red: ['boing', 'rexie'], blue: ['rexie'] });
    const mid = place(s, 'boing', 'A');
    expect(mid.turn).toBe('red');
    expect(mid.pending).toEqual({ kind: 'playAgain' });
    expect(legalActions(mid)).toContainEqual({ type: 'skip' });
    const done = place(mid, 'rexie', 'B');
    expect(done.turn).toBe('blue');
    expect(apply(mid, { type: 'skip' }).turn).toBe('blue');
  });
  it('2 does not wait when nothing else can be played', () => {
    const s = scenario({ red: ['boing'], blue: ['rexie'] });
    const after = place(s, 'boing', 'A');
    expect(after.pending).toBeNull();
    expect(after.turn).toBe('blue');
  });
  it('3 removes the top enemy tile next to it, revealing what is under', () => {
    const s = scenario({ red: ['brix'], blue: ['rexie'], stacks: { C: [['red', 'mira'], ['blue', 'rexie']] } });
    const mid = place(s, 'brix', 'B');
    expect(mid.pending).toEqual({ kind: 'removeAdjacent', options: ['C'] });
    expect(legalActions(mid)).toEqual([{ type: 'remove', node: 'C' }]);
    const after = apply(mid, { type: 'remove', node: 'C' });
    expect(after.stacks.C.map(t => t.troop)).toEqual(['mira']);
    expect(after.discard.at(-1)?.troop).toBe('rexie');
    expect(after.turn).toBe('blue');
  });
  it('5 discards a random enemy hand tile', () => {
    const s = scenario({ red: ['clank'], blue: ['rexie', 'mira', 'pip'] });
    const after = place(s, 'clank', 'A');
    expect(after.hand.blue).toHaveLength(2);
    expect(after.discard).toHaveLength(1);
  });
  it('6 draws one card', () => {
    const s = scenario({ red: ['bruno'], blue: ['rexie'] });
    expect(place(s, 'bruno', 'A').hand.red).toHaveLength(1);
  });
});

describe('regions and medals', () => {
  it('claims medals once a region is enclosed, and keeps them', () => {
    const s = scenario({ red: ['rexie'], blue: ['pip'], stacks: { B: [['red', 'mira']], C2: [['red', 'mira']], "B'": [['blue', 'mira']], C3: [['blue', 'mira']] } });
    const after = place(s, 'rexie', 'C');
    expect(after.medals.red).toBe(3);
    const covered = apply(after, { type: 'place', tile: tileOf(after, 'pip', 'blue'), node: 'C' });
    expect(covered.medals.red).toBe(3);
  });
  it('wins on reaching the objective', () => {
    const s = scenario({ red: ['rexie'], blue: ['pip'], medals: { red: 5 }, stacks: { A: [['red', 'mira']], S1: [['red', 'mira']], C1: [['red', 'mira']] } });
    const after = place(s, 'rexie', 'B');
    expect(after.winner).toBe('red');
    expect(after.endReason).toBe('objective');
  });
});

describe('end of game', () => {
  it('ends when the next player cannot act, and a tie goes against them', () => {
    const s = scenario({ red: ['rexie', 'mira'], blue: [], reserve: { blue: 0 } });
    const after = place(s, 'rexie', 'A');
    expect(after.winner).toBe('red');
    expect(after.endReason).toBe('stalled');
  });
  it('random games always finish and never lose a tile', () => {
    for (let seed = 1; seed <= 200; seed++) {
      let s = newGame({ seed });
      let rng = seed * 9301;
      for (let i = 0; i < 1000 && !s.winner; i++) {
        const actions = legalActions(s);
        rng = (rng * 16807) % 2147483647;
        s = apply(s, actions[rng % actions.length]);
        expect(tileCount(s)).toBe(48);
        for (const side of ['red', 'blue'] as Side[]) expect(s.hand[side].length).toBeLessThanOrEqual(8);
      }
      expect(s.winner).not.toBeNull();
      expect(connected(s, 'red')).toBeInstanceOf(Set);
    }
  });
});
