import { legalChoices, plateSum, previewAdd, previewCool, type Choice, type Plate, type Player, type State } from './engine';

// Chance that a plate at this sum is eventually served, measured by self-play simulation.
const SERVE_CHANCE = [0.71, 0.71, 0.71, 0.6, 0.66, 0.64, 0.52, 0.47, 0.33, 0.3, 0.17, 0.14, 0];

function value(p: Plate): number {
  if (p.cards.length === 0 && plateSum(p) === 0 && !p.cheese) return 0;
  return (p.cheese ? 2 : 1) * (p.cards.length + 1.5) * SERVE_CHANCE[Math.min(12, plateSum(p))];
}

function deltaAdd(pl: Player, idx: number, add: number, cards: number): number {
  const p = pl.plates[idx];
  const out = previewAdd(p, add, cards);
  const after =
    out.kind === 'serve' ? out.points : out.kind === 'burn' ? 0 : value({ ...p, cards: [...p.cards, ...(cards ? [add] : [])], heat: cards ? p.heat : p.heat + add });
  return after - value(p);
}

function risk(pl: Player): number {
  return pl.plates.reduce((a, p) => a + plateSum(p) + (plateSum(p) >= 9 ? 4 : 0), 0);
}

export function aiChoose(s: State): Choice {
  const me = s.players[s.actor];
  const choices = legalChoices(s);
  const card = s.drawn!;
  let best = choices[0];
  let bestScore = -Infinity;
  const consider = (c: Choice, score: number) => {
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  };
  for (const c of choices) {
    if (s.phase === 'place' && c.kind === 'plate' && card.kind === 'num') consider(c, deltaAdd(me, c.plate, card.v, 1));
    else if (s.phase === 'cool' && c.kind === 'plate') {
      const p = me.plates[c.plate];
      consider(c, value({ ...p, heat: p.heat - (plateSum(p) - previewCool(p)) }) - value(p));
    } else if (s.phase === 'cheese' && c.kind === 'plate') {
      const p = me.plates[c.plate];
      consider(c, (p.cards.length + 1.5) * SERVE_CHANCE[plateSum(p)]);
    } else if (s.phase === 'fire' && c.kind === 'target') {
      const d = deltaAdd(s.players[c.player], c.plate, 3, 0);
      consider(c, c.player === s.actor ? d : -d);
    } else if (s.phase === 'extra' && c.kind === 'player') {
      if (c.player === s.actor) consider(c, 0);
      else consider(c, risk(s.players[c.player]) - risk(me) - 6 + s.players[c.player].score * 0.3);
    }
  }
  return best;
}
