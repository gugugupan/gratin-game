import { CASTLE_FIELD } from './maps/castle-field';
import { COPIES_PER_TROOP, HAND_LIMIT, REMOVED_AT_SETUP, TROOP_IDS, TROOPS, beats } from './troops';
import type { Action, GameState, MapDef, Side, Tile, TroopId } from './types';

export const other = (side: Side): Side => (side === 'red' ? 'blue' : 'red');

export function hqOf(map: MapDef, side: Side): string {
  const hq = Object.values(map.nodes).find(n => n.hqOf === side);
  if (!hq) throw new Error(`map ${map.id} has no HQ for ${side}`);
  return hq.id;
}

const adjacencyCache = new WeakMap<MapDef, Record<string, string[]>>();
export function neighbors(map: MapDef, node: string): string[] {
  let adj = adjacencyCache.get(map);
  if (!adj) {
    adj = {};
    for (const id of Object.keys(map.nodes)) adj[id] = [];
    for (const [a, b] of map.edges) { adj[a].push(b); adj[b].push(a); }
    adjacencyCache.set(map, adj);
  }
  return adj[node] ?? [];
}

export const top = (s: GameState, node: string): Tile | undefined => s.stacks[node]?.at(-1);

function random(s: GameState): number {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffle<T>(s: GameState, list: T[]): void {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

export interface NewGameOptions {
  seed: number;
  first?: Side;
  map?: MapDef;
}

export function newGame({ seed, first, map = CASTLE_FIELD }: NewGameOptions): GameState {
  const s: GameState = {
    map,
    rng: seed | 0,
    turn: 'red',
    stacks: Object.fromEntries(Object.keys(map.nodes).map(id => [id, []])),
    reserve: { red: [], blue: [] },
    hand: { red: [], blue: [] },
    box: [],
    discard: [],
    medals: { red: 0, blue: 0 },
    claimed: map.regions.map(() => false),
    pending: null,
    winner: null,
    skipped: null,
    endReason: null,
    moves: 0,
  };
  let uid = 0;
  for (const side of ['red', 'blue'] as Side[]) {
    for (const troop of TROOP_IDS) for (let i = 0; i < COPIES_PER_TROOP; i++) s.reserve[side].push({ uid: uid++, troop, side });
    shuffle(s, s.reserve[side]);
    s.box.push(...s.reserve[side].splice(0, REMOVED_AT_SETUP));
  }
  s.turn = first ?? (random(s) < .5 ? 'red' : 'blue');
  drawTiles(s, s.turn, 3);
  drawTiles(s, other(s.turn), 4);
  return s;
}

function drawTiles(s: GameState, side: Side, n: number): number {
  const k = Math.max(0, Math.min(n, HAND_LIMIT - s.hand[side].length, s.reserve[side].length));
  for (let i = 0; i < k; i++) s.hand[side].push(s.reserve[side].pop()!);
  return k;
}

export function connected(s: GameState, side: Side): Set<string> {
  const start = hqOf(s.map, side);
  const seen = new Set([start]), result = new Set<string>(), queue = [start];
  while (queue.length) {
    for (const m of neighbors(s.map, queue.shift()!)) {
      if (seen.has(m) || top(s, m)?.side !== side) continue;
      seen.add(m); result.add(m); queue.push(m);
    }
  }
  return result;
}

export function reachable(s: GameState, side: Side): Set<string> {
  const own = hqOf(s.map, side), net = connected(s, side), result = new Set(net);
  for (const n of [own, ...net]) for (const m of neighbors(s.map, n)) if (m !== own) result.add(m);
  return result;
}

function canPlace(s: GameState, side: Side, troop: TroopId, node: string, reach: Set<string>): boolean {
  const n = s.map.nodes[node];
  if (!n) return false;
  if (n.type === 'hq' && n.hqOf === side) return false;
  const t = top(s, node);
  if (t && t.side !== side && !beats(troop, t.troop)) return false;
  if (TROOPS[troop].effect === 'ignoreConnection' && n.type !== 'hq') return true;
  return reach.has(node);
}

export function targetsFor(s: GameState, side: Side, troop: TroopId): string[] {
  const reach = reachable(s, side);
  return Object.keys(s.map.nodes).filter(id => canPlace(s, side, troop, id, reach));
}

export function legalTargets(s: GameState, tileUid: number): string[] {
  if (s.winner || s.pending?.kind === 'removeAdjacent') return [];
  const tile = s.hand[s.turn].find(t => t.uid === tileUid);
  return tile ? targetsFor(s, s.turn, tile.troop) : [];
}

export function canDraw(s: GameState, side: Side = s.turn): boolean {
  return !s.winner && !s.pending && s.hand[side].length < HAND_LIMIT && s.reserve[side].length > 0;
}

function canPlaceAny(s: GameState, side: Side): boolean {
  const reach = reachable(s, side);
  return s.hand[side].some(t => Object.keys(s.map.nodes).some(id => canPlace(s, side, t.troop, id, reach)));
}

export function legalActions(s: GameState): Action[] {
  if (s.winner) return [];
  if (s.pending?.kind === 'removeAdjacent') return s.pending.options.map(node => ({ type: 'remove', node }));
  const actions: Action[] = [];
  if (canDraw(s)) actions.push({ type: 'draw' });
  for (const tile of s.hand[s.turn]) for (const node of targetsFor(s, s.turn, tile.troop)) actions.push({ type: 'place', tile: tile.uid, node });
  if (s.pending?.kind === 'playAgain') actions.push({ type: 'skip' });
  return actions;
}

function claimRegions(s: GameState): void {
  const order: Side[] = [s.turn, other(s.turn)];
  s.map.regions.forEach((r, i) => {
    if (s.claimed[i]) return;
    const bases = r.nodes.filter(id => s.map.nodes[id].type !== 'hq');
    const owner = order.find(side => bases.every(id => top(s, id)?.side === side));
    if (!owner) return;
    s.claimed[i] = true;
    s.medals[owner] += r.medals;
  });
  const winner = order.find(side => s.medals[side] >= s.map.objective);
  if (winner) { s.winner = winner; s.endReason = 'objective'; s.pending = null; }
}

const canAct = (s: GameState, side: Side) => canDraw(s, side) || canPlaceAny(s, side);

function endTurn(s: GameState): void {
  if (s.winner) return;
  s.pending = null;
  s.skipped = null;
  s.turn = other(s.turn);
  if (canAct(s, s.turn)) return;
  if (canAct(s, other(s.turn))) {
    s.skipped = s.turn;
    s.turn = other(s.turn);
    return;
  }
  const { red, blue } = s.medals;
  s.winner = red === blue ? 'draw' : red > blue ? 'red' : 'blue';
  s.endReason = 'stalled';
}

export function apply(prev: GameState, action: Action): GameState {
  if (prev.winner) throw new Error('game is over');
  const s = structuredClone(prev);
  const side = s.turn;
  switch (action.type) {
    case 'draw': {
      if (!canDraw(s)) throw new Error('cannot draw');
      drawTiles(s, side, 2);
      s.moves++;
      endTurn(s);
      return s;
    }
    case 'skip': {
      if (s.pending?.kind !== 'playAgain') throw new Error('nothing to skip');
      endTurn(s);
      return s;
    }
    case 'remove': {
      if (s.pending?.kind !== 'removeAdjacent' || !s.pending.options.includes(action.node)) throw new Error('illegal removal');
      s.discard.push(s.stacks[action.node].pop()!);
      s.pending = null;
      claimRegions(s);
      endTurn(s);
      return s;
    }
    case 'place': {
      if (s.pending?.kind === 'removeAdjacent') throw new Error('resolve the removal first');
      const index = s.hand[side].findIndex(t => t.uid === action.tile);
      if (index < 0) throw new Error('tile not in hand');
      const tile = s.hand[side][index];
      if (!canPlace(s, side, tile.troop, action.node, reachable(s, side))) throw new Error('illegal placement');
      s.hand[side].splice(index, 1);
      s.stacks[action.node].push(tile);
      s.pending = null;
      s.moves++;
      if (s.map.nodes[action.node].type === 'hq') {
        s.winner = side;
        s.endReason = 'hq';
        return s;
      }
      resolveEffect(s, tile, action.node);
      claimRegions(s);
      if (!s.pending) endTurn(s);
      return s;
    }
  }
}

function resolveEffect(s: GameState, tile: Tile, node: string): void {
  const side = tile.side, enemy = other(side);
  switch (TROOPS[tile.troop].effect) {
    case 'draw2': drawTiles(s, side, 2); break;
    case 'draw1': drawTiles(s, side, 1); break;
    case 'discardEnemy': {
      const hand = s.hand[enemy];
      if (hand.length) s.discard.push(...hand.splice(Math.floor(random(s) * hand.length), 1));
      break;
    }
    case 'removeAdjacent': {
      const options = neighbors(s.map, node).filter(id => s.map.nodes[id].type !== 'hq' && top(s, id)?.side === enemy);
      if (options.length) s.pending = { kind: 'removeAdjacent', options };
      break;
    }
    case 'playAgain':
      if (canPlaceAny(s, side)) s.pending = { kind: 'playAgain' };
      break;
    case 'ignoreConnection':
    case 'none':
      break;
  }
}

export function tileCount(s: GameState): number {
  return s.box.length + s.discard.length
    + s.reserve.red.length + s.reserve.blue.length
    + s.hand.red.length + s.hand.blue.length
    + Object.values(s.stacks).reduce((n, st) => n + st.length, 0);
}
