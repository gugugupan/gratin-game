import { HAND_LIMIT, TROOPS } from './troops';
import { apply, connected, hqOf, legalActions, other, reachable, top } from './rules';
import type { Action, GameState, Side } from './types';

export type Difficulty = 'easy' | 'normal';

const strengthValue = (s: GameState, node: string) => {
  const t = top(s, node);
  if (!t) return 0;
  const v = TROOPS[t.troop].strength;
  return v === 'joker' ? 3.5 : v;
};

export function evaluate(s: GameState, side: Side): number {
  const enemy = other(side);
  if (s.winner) return s.winner === 'draw' ? 0 : s.winner === side ? 100000 : -100000;
  let score = (s.medals[side] - s.medals[enemy]) * 140;
  const reach = { [side]: reachable(s, side), [enemy]: reachable(s, enemy) } as Record<Side, Set<string>>;
  const net = { [side]: connected(s, side), [enemy]: connected(s, enemy) } as Record<Side, Set<string>>;
  if (reach[enemy].has(hqOf(s.map, side))) score -= s.turn === enemy ? 50000 : 900;
  if (reach[side].has(hqOf(s.map, enemy))) score += s.turn === side ? 50000 : 700;
  for (const id of Object.keys(s.map.nodes)) {
    const t = top(s, id);
    if (!t) continue;
    const sign = t.side === side ? 1 : -1;
    score += sign * (6 + strengthValue(s, id) * 2.5);
    if (net[t.side].has(id)) score += sign * 6;
  }
  s.map.regions.forEach((r, i) => {
    if (s.claimed[i] || !r.medals) return;
    const bases = r.nodes.filter(id => s.map.nodes[id].type !== 'hq');
    for (const who of [side, enemy]) {
      const mine = bases.filter(id => top(s, id)?.side === who).length;
      const blocked = bases.some(id => top(s, id) && top(s, id)!.side !== who);
      const missing = bases.length - mine;
      const value = (mine / bases.length) ** 2 * r.medals * 45 * (blocked ? .5 : 1) + (missing === 1 && !blocked ? r.medals * 40 : 0);
      score += who === side ? value : -value;
    }
  });
  score += Math.min(s.hand[side].length, HAND_LIMIT) * 9 - Math.min(s.hand[enemy].length, HAND_LIMIT) * 6;
  return score;
}

function actionScore(s: GameState, a: Action, side: Side, depth = 0): number {
  if (a.type === 'draw') {
    const gain = Math.min(2, HAND_LIMIT - s.hand[side].length, s.reserve[side].length);
    return evaluate(s, side) + gain * 9 + (s.hand[side].length <= 1 ? 30 : 0) - 12;
  }
  const next = apply(s, a);
  if (!next.winner && next.turn === side && next.pending && depth < 2) {
    const follow = legalActions(next);
    if (follow.length) return Math.max(...follow.map(f => actionScore(next, f, side, depth + 1)));
  }
  return evaluate(next, side);
}

export function chooseAction(s: GameState, difficulty: Difficulty, rand: () => number = Math.random): Action {
  const actions = legalActions(s);
  if (!actions.length) throw new Error('no legal actions');
  if (actions.length === 1) return actions[0];
  const side = s.turn;
  const scored = actions.map(a => ({ a, v: actionScore(s, a, side) }));
  if (difficulty === 'easy') {
    if (rand() < .35) return actions[Math.floor(rand() * actions.length)];
    for (const x of scored) x.v += rand() * 220;
  }
  scored.sort((x, y) => y.v - x.v);
  return scored[0].a;
}
