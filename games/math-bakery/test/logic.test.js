import { test } from 'node:test';
import assert from 'node:assert/strict';
import { F, fop, fstr, genAS, genEasy, genMul, make24Pools, nextLevel, pick24, pilePos, solve, tierOf } from '../src/logic.js';
import { DICT } from '../src/i18n.js';

const evalQ = (t) => Function(`return ${t.replace(/−/g, '-').replace(/×/g, '*')}`)();

test('every generator gives a correct, non-negative answer at every level', () => {
  for (const gen of [genEasy, genAS, genMul]) {
    for (let lvl = 0; lvl <= 9; lvl++) {
      for (let n = 0; n < 300; n++) {
        const q = gen(lvl);
        assert.equal(evalQ(q.t), q.ans, q.t);
        assert.ok(q.ans >= 0, q.t);
      }
    }
  }
});

test('single-digit mode only adds single digits', () => {
  for (let lvl = 0; lvl <= 9; lvl++) {
    for (let n = 0; n < 300; n++) {
      const q = genEasy(lvl);
      assert.doesNotMatch(q.t, /−|×/, q.t);
      for (const d of q.t.split(' + ')) assert.ok(+d >= 1 && +d <= 9, q.t);
    }
  }
  for (let n = 0; n < 200; n++) assert.ok(genEasy(0).ans <= 5);
});

test('difficulty: up on a right answer, same after one miss, down after misses in a row', () => {
  assert.equal(nextLevel(3, true, 0), 4);
  assert.equal(nextLevel(9, true, 0), 9);
  assert.equal(nextLevel(3, false, 1), 3);
  assert.equal(nextLevel(3, false, 2), 2);
  assert.equal(nextLevel(2, false, 3), 1);
  assert.equal(nextLevel(0, false, 5), 0);
});

test('24 puzzles are always solvable and their shown solution is right', () => {
  const pools = make24Pools(), used = new Set();
  for (let lvl = 0; lvl <= 9; lvl++) {
    const q = pick24(pools, lvl, used);
    assert.equal(q.nums.length, 4);
    assert.ok(solve(q.nums).count > 0, q.nums.join());
    assert.ok(Math.abs(evalQ(q.sol.replace(/÷/g, '/')) - 24) < 1e-9, q.sol);
  }
});

test('fractions', () => {
  const r = fop(fop(F(8), F(3), '/'), F(3), '*');
  assert.equal(fstr(r), '8');
  assert.equal(fstr(fop(F(1), F(3), '/')), '1/3');
  assert.equal(fop(F(1), F(0), '/'), null);
});

test('bread pile: 10 breads stack 4-3-2-1 and longer streaks bake fancier bread', () => {
  assert.deepEqual(Array.from({ length: 10 }, (_, k) => pilePos(k, 4, 60).row), [0, 0, 0, 0, 1, 1, 1, 2, 2, 3]);
  assert.equal(tierOf(10), 5);
  assert.equal(tierOf(3), 2);
  assert.ok(tierOf(1) <= 1);
});

test('every language has every string', () => {
  const keys = Object.keys(DICT.ja).sort();
  assert.deepEqual(Object.keys(DICT.zh).sort(), keys);
  assert.deepEqual(Object.keys(DICT.en).sort(), keys);
});
