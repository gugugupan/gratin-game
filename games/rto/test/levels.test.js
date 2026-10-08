import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solve } from '../src/engine.js';
import { LEVELS, CAST } from '../src/levels.js';
import { BEATS, EMAILS, CHATS, TALKS } from '../src/story.js';

test('every week has exactly one solution', () => {
  LEVELS.forEach((L, i) => assert.equal(solve(L, 2).length, 1, `week ${i + 1}`));
});

test('one story beat per week plus the prologue', () => {
  assert.equal(BEATS.length, LEVELS.length + 1);
});

test('every story item exists', () => {
  const table = { email: EMAILS, chat: CHATS, talk: TALKS };
  for (const key of BEATS.flat()) {
    if (key === 'finale') continue;
    const [kind, id] = key.split(':');
    assert.ok(table[kind]?.[id], key);
  }
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
