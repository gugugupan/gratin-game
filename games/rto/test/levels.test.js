import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from '../src/engine.js';
import { LEVELS, CAST, withNeeds } from '../src/levels.js';
import { BEATS, EMAILS, CHATS, TALKS } from '../src/story.js';

test('every week has exactly one solution', () => {
  LEVELS.forEach((L, i) => assert.equal(solve(withNeeds(L), 2).length, 1, `week ${i + 1}`));
});

const SOLS = LEVELS.map(L => solve(withNeeds(L), 1)[0]);
const rowKey = r => r.join('');

test('no member repeats last week\'s schedule', () => {
  for (let w = 1; w < LEVELS.length; w++) {
    LEVELS[w].people.forEach((p, i) => assert.notEqual(rowKey(SOLS[w][i]), rowKey(SOLS[w - 1][i]), `${p.id} in week ${w + 1}`));
  }
});

test('any two weeks share at most 21 of 30 cells', () => {
  for (let a = 0; a < SOLS.length; a++) for (let b = a + 1; b < SOLS.length; b++) {
    let same = 0;
    SOLS[a].forEach((r, p) => r.forEach((v, d) => { if (v === SOLS[b][p][d]) same++; }));
    assert.ok(same <= 21, `weeks ${a + 1} and ${b + 1}: ${same}/30`);
  }
});

test('nobody is solved by their blocked days alone', () => {
  LEVELS.forEach((L, w) => L.people.forEach(p => {
    const blocked = new Set([...(p.locks || []), ...p.rules.filter(r => r.t === 'fixed' && r.v === 0).map(r => r.d)]);
    if (!blocked.size) return;
    assert.ok(5 - blocked.size > (p.quota ?? L.quota), `${p.id} in week ${w + 1}`);
  }));
});

test('one story beat per week plus the prologue', () => {
  assert.equal(BEATS.length, LEVELS.length + 1);
});

test('every story item exists', () => {
  const table = { email: EMAILS, chat: CHATS, talk: TALKS };
  for (const e of BEATS.flat()) {
    const key = typeof e === 'string' ? e : e[0];
    if (key === 'finale' || key.startsWith('chat:mood')) continue;
    const [kind, id] = key.split(':');
    assert.ok(table[kind]?.[id], key);
  }
});

test('the perfect plan meets attendance and gives every wish-ignoring trap a reason', () => {
  LEVELS.forEach((L, i) => {
    const g = SOLS[i];
    const need = L.people.reduce((s, p) => s + (p.quota ?? L.quota), 0);
    assert.ok(g.flat().filter(v => v).length >= need, `week ${i + 1} attendance`);
  });
});

test('every speaker and sender is in the cast', () => {
  for (const e of Object.values(EMAILS)) assert.ok(CAST[e.from], e.from);
  for (const c of Object.values(CHATS)) for (const [who] of c.msgs) assert.ok(CAST[who], who);
  for (const who of Object.keys(TALKS)) assert.ok(CAST[who], who);
});

test('every text has all three languages', () => {
  const walk = (v, path) => {
    if (v && typeof v === 'object' && 'zh' in v && 'en' in v) {
      for (const l of ['zh', 'en', 'ja']) assert.equal(typeof v[l], 'string', `${path}.${l}`);
      return;
    }
    if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk({ LEVELS, CAST, EMAILS, CHATS, TALKS }, 'root');
});
