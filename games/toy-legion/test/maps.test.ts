import { describe, expect, it } from 'vitest';
import { MAPS, apply, chooseAction, legalActions, neighbors, newGame } from '../src/engine';

describe.each(MAPS.map(m => [m.map.id, m.map] as const))('map %s', (_, map) => {
  const ids = Object.keys(map.nodes);
  it('has one HQ per side and valid edges', () => {
    expect(ids.filter(id => map.nodes[id].hqOf === 'red')).toEqual(['hqR']);
    expect(ids.filter(id => map.nodes[id].hqOf === 'blue')).toEqual(['hqB']);
    for (const [a, b] of map.edges) { expect(ids).toContain(a); expect(ids).toContain(b); }
  });
  it('has closed regions made of real paths', () => {
    for (const r of map.regions) {
      r.nodes.forEach((a, i) => {
        const b = r.nodes[(i + 1) % r.nodes.length];
        expect(neighbors(map, a), `${a}-${b} in ${r.nodes.join(',')}`).toContain(b);
      });
    }
    expect(map.regions.reduce((n, r) => n + r.medals, 0)).toBeGreaterThanOrEqual(map.objective);
  });
  it('connects every node', () => {
    const seen = new Set(['hqR']), queue = ['hqR'];
    while (queue.length) for (const m of neighbors(map, queue.shift()!)) if (!seen.has(m)) { seen.add(m); queue.push(m); }
    expect(seen.size).toBe(ids.length);
  });
  it('is 180° symmetric', () => {
    const key = (p: [number, number]) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
    const spots = new Set(ids.map(id => key(map.nodes[id].pos)));
    for (const id of ids) expect(spots).toContain(key([map.width - map.nodes[id].pos[0], map.height - map.nodes[id].pos[1]]));
  });
  it('plays to the end with the AI', () => {
    for (let seed = 1; seed <= 6; seed++) {
      let s = newGame({ seed, map });
      for (let i = 0; i < 400 && !s.winner; i++) s = apply(s, seed % 2 ? chooseAction(s, 'normal') : legalActions(s)[0]);
      expect(s.winner).not.toBeNull();
    }
  });
});
