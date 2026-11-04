export const TARGET = 12;
export const GOAL = 20;
export const PLATES = 3;
export const MAX_PLAYERS = 4;

export type Card =
  | { kind: 'num'; v: number }
  | { kind: 'fire' }
  | { kind: 'cool' }
  | { kind: 'extra' }
  | { kind: 'cheese' };

export interface Plate {
  cards: number[];
  heat: number;
  cheese: boolean;
}

export interface Player {
  name: string;
  ai: boolean;
  score: number;
  burns: number;
  serves: number;
  plates: Plate[];
}

export type Phase = 'draw' | 'place' | 'fire' | 'cool' | 'cheese' | 'extra' | 'over';

export type GameEvent =
  | { type: 'draw'; player: number; card: Card }
  | { type: 'serve'; player: number; plate: number; points: number; cards: number; cheese: boolean }
  | { type: 'burn'; player: number; plate: number; lost: number }
  | { type: 'place'; player: number; plate: number; card: Card }
  | { type: 'fire'; by: number; player: number; plate: number }
  | { type: 'cool'; player: number; plate: number }
  | { type: 'cheese'; player: number; plate: number | null }
  | { type: 'extra'; by: number; player: number }
  | { type: 'reshuffle' }
  | { type: 'turn'; player: number }
  | { type: 'win'; player: number };

export interface State {
  players: Player[];
  deck: Card[];
  discard: Card[];
  turn: number;
  actor: number;
  phase: Phase;
  drawn: Card | null;
  extra: { player: number; left: number }[];
  turns: number;
  winner: number | null;
  rng: number;
}

export interface Seat {
  name: string;
  ai: boolean;
}

export const DECK_SPEC = { copies: 4, fire: 2, cool: 2, extra: 2, cheese: 4 };

export function nextRandom(s: State): number {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shuffle(s: State, cards: Card[]): Card[] {
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom(s) * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function fullDeck(): Card[] {
  const d: Card[] = [];
  for (let v = 0; v <= TARGET; v++) for (let i = 0; i < DECK_SPEC.copies; i++) d.push({ kind: 'num', v });
  for (let i = 0; i < DECK_SPEC.fire; i++) d.push({ kind: 'fire' });
  for (let i = 0; i < DECK_SPEC.cool; i++) d.push({ kind: 'cool' });
  for (let i = 0; i < DECK_SPEC.extra; i++) d.push({ kind: 'extra' });
  for (let i = 0; i < DECK_SPEC.cheese; i++) d.push({ kind: 'cheese' });
  return d;
}

export function emptyPlate(): Plate {
  return { cards: [], heat: 0, cheese: false };
}

export function plateSum(p: Plate): number {
  return p.cards.reduce((a, b) => a + b, 0) + p.heat;
}

export function isEmpty(p: Plate): boolean {
  return p.cards.length === 0 && p.heat === 0 && !p.cheese;
}

export function newGame(seats: Seat[], seed = Date.now()): State {
  if (seats.length < 1 || seats.length > MAX_PLAYERS) throw new Error('bad player count');
  const s: State = {
    players: seats.map(seat => ({
      name: seat.name,
      ai: seat.ai,
      score: 0,
      burns: 0,
      serves: 0,
      plates: Array.from({ length: PLATES }, emptyPlate),
    })),
    deck: [],
    discard: [],
    turn: 0,
    actor: 0,
    phase: 'draw',
    drawn: null,
    extra: [],
    turns: 1,
    winner: null,
    rng: seed | 0,
  };
  s.deck = shuffle(s, fullDeck());
  return s;
}

export type Outcome = { kind: 'serve'; points: number } | { kind: 'burn' } | { kind: 'cook'; sum: number };

export function previewAdd(p: Plate, add: number, cards: number): Outcome {
  const sum = plateSum(p) + add;
  if (sum === TARGET) return { kind: 'serve', points: (p.cards.length + cards) * (p.cheese ? 2 : 1) };
  if (sum > TARGET) return { kind: 'burn' };
  return { kind: 'cook', sum };
}

export function previewCool(p: Plate): number {
  return Math.max(0, plateSum(p) - 3);
}

function clearPlate(s: State, p: Plate) {
  for (const v of p.cards) s.discard.push({ kind: 'num', v });
  if (p.cheese) s.discard.push({ kind: 'cheese' });
  p.cards = [];
  p.heat = 0;
  p.cheese = false;
}

function settle(s: State, pi: number, idx: number, ev: GameEvent[]) {
  const pl = s.players[pi];
  const p = pl.plates[idx];
  const sum = plateSum(p);
  if (sum === TARGET) {
    const points = p.cards.length * (p.cheese ? 2 : 1);
    pl.score += points;
    pl.serves++;
    ev.push({ type: 'serve', player: pi, plate: idx, points, cards: p.cards.length, cheese: p.cheese });
    clearPlate(s, p);
    if (pl.score >= GOAL && s.winner === null) {
      s.winner = pi;
      s.phase = 'over';
      ev.push({ type: 'win', player: pi });
    }
  } else if (sum > TARGET) {
    pl.burns++;
    ev.push({ type: 'burn', player: pi, plate: idx, lost: p.cards.length });
    clearPlate(s, p);
  }
}

export function canCheese(s: State, pi: number): boolean {
  return s.players[pi].plates.some(p => !p.cheese);
}

export function draw(s: State): GameEvent[] {
  if (s.phase !== 'draw') throw new Error(`cannot draw in ${s.phase}`);
  const ev: GameEvent[] = [];
  if (s.deck.length === 0) {
    if (s.discard.length === 0) return endByScore(s, ev);
    s.deck = shuffle(s, s.discard);
    s.discard = [];
    ev.push({ type: 'reshuffle' });
  }
  const card = s.deck.pop()!;
  s.drawn = card;
  ev.push({ type: 'draw', player: s.actor, card });
  switch (card.kind) {
    case 'num': s.phase = 'place'; break;
    case 'fire': s.phase = 'fire'; break;
    case 'cool': s.phase = 'cool'; break;
    case 'cheese':
      if (canCheese(s, s.actor)) s.phase = 'cheese';
      else {
        s.discard.push(card);
        ev.push({ type: 'cheese', player: s.actor, plate: null });
        finishCard(s, ev);
      }
      break;
    case 'extra':
      if (s.players.length === 1) {
        ev.push({ type: 'extra', by: s.actor, player: s.actor });
        s.extra.push({ player: s.actor, left: 2 });
        finishCard(s, ev);
      } else s.phase = 'extra';
      break;
  }
  return ev;
}

function endByScore(s: State, ev: GameEvent[]): GameEvent[] {
  let best = 0;
  s.players.forEach((p, i) => { if (p.score > s.players[best].score) best = i; });
  s.winner = best;
  s.phase = 'over';
  ev.push({ type: 'win', player: best });
  return ev;
}

function finishCard(s: State, ev: GameEvent[]) {
  if (s.drawn && (s.drawn.kind === 'fire' || s.drawn.kind === 'cool' || s.drawn.kind === 'extra')) s.discard.push(s.drawn);
  s.drawn = null;
  if (s.phase === 'over') return;
  while (s.extra.length && s.extra[s.extra.length - 1].left === 0) s.extra.pop();
  const top = s.extra[s.extra.length - 1];
  if (top) {
    top.left--;
    s.actor = top.player;
  } else {
    s.turn = (s.turn + 1) % s.players.length;
    s.actor = s.turn;
    if (s.turn === 0) s.turns++;
    ev.push({ type: 'turn', player: s.turn });
  }
  s.phase = 'draw';
}

export type Choice =
  | { kind: 'plate'; plate: number }
  | { kind: 'target'; player: number; plate: number }
  | { kind: 'player'; player: number };

export function legalChoices(s: State): Choice[] {
  const me = s.players[s.actor];
  const own = (filter: (p: Plate) => boolean = () => true) =>
    me.plates.flatMap((p, i) => (filter(p) ? [{ kind: 'plate', plate: i } as Choice] : []));
  switch (s.phase) {
    case 'place':
    case 'cool':
      return own();
    case 'cheese':
      return own(p => !p.cheese);
    case 'fire':
      return s.players.flatMap((pl, pi) => pl.plates.map((_, i) => ({ kind: 'target', player: pi, plate: i }) as Choice));
    case 'extra':
      return s.players.map((_, pi) => ({ kind: 'player', player: pi }) as Choice);
    default:
      return [];
  }
}

export function choose(s: State, c: Choice): GameEvent[] {
  const ev: GameEvent[] = [];
  const me = s.players[s.actor];
  const card = s.drawn;
  if (!card) throw new Error('nothing drawn');
  switch (s.phase) {
    case 'place': {
      if (c.kind !== 'plate' || card.kind !== 'num') throw new Error('bad choice');
      me.plates[c.plate].cards.push(card.v);
      ev.push({ type: 'place', player: s.actor, plate: c.plate, card });
      settle(s, s.actor, c.plate, ev);
      break;
    }
    case 'cool': {
      if (c.kind !== 'plate') throw new Error('bad choice');
      const p = me.plates[c.plate];
      p.heat -= plateSum(p) - previewCool(p);
      ev.push({ type: 'cool', player: s.actor, plate: c.plate });
      break;
    }
    case 'cheese': {
      if (c.kind !== 'plate' || me.plates[c.plate].cheese) throw new Error('bad choice');
      me.plates[c.plate].cheese = true;
      ev.push({ type: 'cheese', player: s.actor, plate: c.plate });
      break;
    }
    case 'fire': {
      if (c.kind !== 'target') throw new Error('bad choice');
      s.players[c.player].plates[c.plate].heat += 3;
      ev.push({ type: 'fire', by: s.actor, player: c.player, plate: c.plate });
      settle(s, c.player, c.plate, ev);
      break;
    }
    case 'extra': {
      if (c.kind !== 'player') throw new Error('bad choice');
      ev.push({ type: 'extra', by: s.actor, player: c.player });
      s.extra.push({ player: c.player, left: 2 });
      break;
    }
    default:
      throw new Error(`cannot choose in ${s.phase}`);
  }
  finishCard(s, ev);
  return ev;
}

export function cloneState(s: State): State {
  return structuredClone(s);
}
