import { describe, expect, it } from 'vitest';
import { choose, draw, fullDeck, GOAL, legalChoices, newGame, plateSum, type Card, type State } from '../src/engine';
import { aiChoose } from '../src/ai';

function rig(players: number, top: Card[]): State {
  const s = newGame(Array.from({ length: players }, (_, i) => ({ name: `P${i}`, ai: false })), 1);
  s.deck = [...fullDeck().slice(0, 10), ...top.slice().reverse()];
  return s;
}

const num = (v: number): Card => ({ kind: 'num', v });

describe('rules', () => {
  it('has 62 cards', () => {
    expect(fullDeck()).toHaveLength(62);
  });

  it('serves a plate at exactly 12 for one point per card', () => {
    const s = rig(1, [num(5), num(0), num(7)]);
    for (const _ of [0, 1, 2]) {
      draw(s);
      choose(s, { kind: 'plate', plate: 0 });
    }
    expect(s.players[0].score).toBe(3);
    expect(s.players[0].plates[0].cards).toEqual([]);
  });

  it('a 12 on an empty plate serves for 1, on a used plate burns', () => {
    const s = rig(1, [num(12), num(3), num(12)]);
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    expect(s.players[0].score).toBe(1);
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    expect(s.players[0].burns).toBe(1);
    expect(plateSum(s.players[0].plates[0])).toBe(0);
  });

  it('cheese doubles the dish and is lost on a burn', () => {
    const s = rig(1, [{ kind: 'cheese' }, num(6), num(6), { kind: 'cheese' }, num(9), num(9)]);
    draw(s); choose(s, { kind: 'plate', plate: 1 });
    draw(s); choose(s, { kind: 'plate', plate: 1 });
    draw(s); choose(s, { kind: 'plate', plate: 1 });
    expect(s.players[0].score).toBe(4);
    draw(s); choose(s, { kind: 'plate', plate: 2 });
    draw(s); choose(s, { kind: 'plate', plate: 2 });
    draw(s); choose(s, { kind: 'plate', plate: 2 });
    expect(s.players[0].plates[2].cheese).toBe(false);
    expect(s.players[0].burns).toBe(1);
  });

  it('fire can hit any player and can serve their plate', () => {
    const s = rig(2, [num(9), { kind: 'fire' }]);
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    draw(s);
    expect(legalChoices(s)).toHaveLength(6);
    choose(s, { kind: 'target', player: 0, plate: 0 });
    expect(s.players[0].score).toBe(1);
  });

  it('cool lowers a plate by 3, not below 0', () => {
    const s = rig(1, [num(2), { kind: 'cool' }, num(8), { kind: 'cool' }]);
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    expect(plateSum(s.players[0].plates[0])).toBe(0);
    draw(s); choose(s, { kind: 'plate', plate: 1 });
    draw(s); choose(s, { kind: 'plate', plate: 1 });
    expect(plateSum(s.players[0].plates[1])).toBe(5);
    expect(s.players[0].plates[1].cards).toEqual([8]);
  });

  it('extra gives the chosen player two draws, then play returns', () => {
    const s = rig(3, [{ kind: 'extra' }, num(1), num(2), num(3)]);
    draw(s); choose(s, { kind: 'player', player: 2 });
    expect(s.actor).toBe(2);
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    expect(s.actor).toBe(2);
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    expect(s.actor).toBe(1);
    expect(s.turn).toBe(1);
  });

  it('reshuffles the discard pile when the deck runs out', () => {
    const s = rig(1, []);
    s.deck = [num(12)];
    s.discard = [num(4), num(5)];
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    const ev = draw(s);
    expect(ev[0].type).toBe('reshuffle');
    expect(s.deck.length + 1).toBe(3);
  });

  it('ends as soon as someone reaches the goal', () => {
    const s = rig(2, [num(12)]);
    s.players[0].score = GOAL - 1;
    draw(s); choose(s, { kind: 'plate', plate: 0 });
    expect(s.phase).toBe('over');
    expect(s.winner).toBe(0);
  });
});

describe('self-play', () => {
  function playOut(n: number, seed: number) {
    const s = newGame(Array.from({ length: n }, (_, i) => ({ name: `AI${i}`, ai: true })), seed);
    let guard = 0;
    while (s.phase !== 'over' && guard++ < 5000) {
      if (s.phase === 'draw') draw(s);
      else choose(s, aiChoose(s));
    }
    return s;
  }

  it('every game finishes and conserves all 62 cards', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const s = playOut(1 + (seed % 4), seed);
      expect(s.phase).toBe('over');
      const onPlates = s.players.flatMap(p => p.plates).reduce((a, p) => a + p.cards.length + (p.cheese ? 1 : 0), 0);
      expect(s.deck.length + s.discard.length + onPlates + (s.drawn ? 1 : 0)).toBe(62);
    }
  });

  it('a solo AI usually reaches 20 in under 60 turns', () => {
    const turns: number[] = [];
    for (let seed = 1; seed <= 300; seed++) turns.push(playOut(1, seed).turns);
    turns.sort((a, b) => a - b);
    expect(turns[150]).toBeLessThan(60);
  });
});
