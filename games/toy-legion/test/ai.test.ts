import { describe, expect, it } from 'vitest';
import { apply, chooseAction, legalActions, newGame, type Difficulty, type GameState, type Side } from '../src/engine';

type Player = Difficulty | 'random';

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function play(seed: number, red: Player, blue: Player): GameState {
  let s = newGame({ seed });
  const r = rng(seed * 31 + 7);
  for (let i = 0; i < 400 && !s.winner; i++) {
    const who = s.turn === 'red' ? red : blue;
    const actions = legalActions(s);
    const a = who === 'random' ? actions[Math.floor(r() * actions.length)] : chooseAction(s, who, r);
    s = apply(s, a);
  }
  return s;
}

function winRate(a: Player, b: Player, games: number): number {
  let wins = 0;
  for (let g = 0; g < games; g++) {
    const aSide: Side = g % 2 ? 'red' : 'blue';
    const s = play(100 + g, aSide === 'red' ? a : b, aSide === 'red' ? b : a);
    expect(s.winner).not.toBeNull();
    if (s.winner === aSide) wins++;
    else if (s.winner === 'draw') wins += .5;
  }
  return wins / games;
}

describe('ai', () => {
  it('takes an open enemy HQ', () => {
    const s = newGame({ seed: 3, first: 'red' });
    for (const node of ['B', 'C2', "B'"]) s.stacks[node] = [{ uid: 900 + node.length, troop: 'mira', side: 'red' }];
    const a = chooseAction(s, 'normal');
    expect(a).toMatchObject({ type: 'place', node: 'hqB' });
  });
  it('normal beats random play', () => {
    expect(winRate('normal', 'random', 30)).toBeGreaterThan(.8);
  }, 60000);
  it('normal beats easy', () => {
    expect(winRate('normal', 'easy', 30)).toBeGreaterThan(.6);
  }, 60000);
  it('easy beats random play', () => {
    expect(winRate('easy', 'random', 30)).toBeGreaterThan(.6);
  }, 60000);
});
