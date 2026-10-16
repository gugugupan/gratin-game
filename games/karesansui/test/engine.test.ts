import { describe, expect, it } from 'vitest';
import { passesOf, randomGarden, sampleCodes, score, solve, SIZES, type SizeKey } from '../src/engine';
import { LEVELS } from '../src/levels';

describe('solver', () => {
  for (const lv of LEVELS) {
    it(`solves ${lv.id} with fully clean sand`, () => {
      const sol = solve(lv.map);
      expect(sol).not.toBeNull();
      const s = score(sampleCodes(lv.map, passesOf(lv.map, sol!, true)), null);
      expect(s.clean).toBe(1);
      console.log(lv.id, sol!.length);
    });
  }
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
