import { describe, expect, it } from 'vitest';
import { passesOf, randomGarden, sampleCodes, score, solve, SIZES, type SizeKey } from '../src/engine';
import { LEVELS } from '../src/levels';

describe('solver', () => {
  it('has 20 levels whose stored solutions leave fully clean sand', () => {
    expect(LEVELS).toHaveLength(20);
    for (const lv of LEVELS) {
      const s = score(sampleCodes(lv.map, passesOf(lv.map, lv.solution, true)), null);
      expect(s.clean, lv.id).toBe(1);
    }
  });
  it('solves the hand-made opening level', () => {
    expect(solve(LEVELS[0].map)).not.toBeNull();
  });
  for (const size of Object.keys(SIZES) as SizeKey[]) {
    it(`random ${size} gardens are solvable`, () => {
      for (let seed = 1; seed <= 4; seed++) {
        const g = randomGarden(size, seed);
        const s = score(sampleCodes(g.map, passesOf(g.map, g.solution, true)), null);
        expect(s.clean).toBe(1);
      }
    });
  }
});
