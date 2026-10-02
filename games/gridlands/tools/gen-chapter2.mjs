// 生成第 2 章关卡 JSON 到 levels/（solution 由求解器算出）。用法：node tools/gen-chapter2.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { solve } from '../web/src/core/engine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const L = (zh, en) => ({ zh, en });
const C = (type, params) => (params ? { type, params } : { type });

const TAG = { '.': 'plain', A: 'farmland', F: 'forest', L: 'lake', M: 'mountain', G: 'gold', I: 'iron', B: 'building' };
const BG = { plain: '#cdebc0', forest: '#2e7d32', gold: '#ffd54f', iron: '#90a4ae', mountain: '#8d6e63', lake: '#4fc3f7', farmland: '#f4ecd4', building: '#cfd5dd' };

// map：每行用空格分隔的地形字母；blocked：哪些字母是障碍
function board(map, blocked) {
  const rows = map.trim().split('\n').map((r) => r.trim().split(/\s+/));
  const width = rows[0].length;
  const cells = rows.flatMap((row, y) => row.map((ch, x) => {
    const tag = TAG[ch];
    return { id: y * width + x + 1, x, y, tags: [tag], assignable: !blocked.includes(ch), fixedRegion: null, display: { bg: BG[tag], sprite: null } };
  }));
  return { width, height: rows.length, cells };
}

function level({ file, map, blocked, ...rest }) {
  const lv = {
    schemaVersion: 1, shapeRule: 'RECT', adjacency: 4, coverage: 'FULL',
    meta: { author: 'manual', verifiedUnique: true, verifiedHumanSolvable: true, createdAt: '2026-10-03' },
    ...rest, board: board(map, blocked), globalConstraints: rest.globalConstraints || [],
  };
  const sols = solve(lv, { maxSolutions: 2 });
  if (sols.length !== 1) throw new Error(`${lv.id}: ${sols.length} solutions`);
  lv.solution = sols[0];
  writeFileSync(join(root, 'levels', file), JSON.stringify(lv, null, 2) + '\n');
  console.log(`wrote ${file}`);
}

level({
  file: '2-1.json', id: '2-1', chapter: 2, difficulty: 7, theme: 'river',
  name: L('雨季前的河岸', 'Before the Rains'),
  story: L(
    '雨季就要来了，河水一涨，低处的地就会被淹。村长赶在下雨前，把河湾这片地分给四户人家。',
    'The rainy season is coming, and the river will soon swallow the low ground. Before the first storm, the village head divides the river bend among four households.',
  ),
  blocked: 'L',
  map: `
    A A . . . F
    A . . . . F
    L L L . . .
    . . L . F .
    . . . . . .`,
  regions: [
    { id: 'R1', owner: { name: L('农夫', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'farmland', value: 3 }), C('MUST_TOUCH_TAG', { tag: 'lake' })] },
    { id: 'R2', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'forest', value: 3 })] },
    { id: 'R3', owner: { name: L('牧羊人', 'Shepherd'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [
      C('AREA_GE', { value: 6 }), C('MUST_ON_EDGE')] },
    { id: 'R4', owner: { name: L('渔夫', 'Fisher'), color: '#29b6f6', icon: 'fisher', avatar: null }, constraints: [
      C('MUST_TOUCH_TAG', { tag: 'lake' }), C('AREA_LE', { value: 3 })] },
  ],
});

level({
  file: '2-2.json', id: '2-2', chapter: 2, difficulty: 8, theme: 'mine',
  name: L('矿山小镇的地契', 'Deeds of the Mining Town'),
  story: L(
    '山里挖出了两处金矿。镇长连夜召集大家，在发地契之前先定下一条规矩：矿场不能挨着民房。',
    'Two gold veins were struck in the hills. The mayor calls everyone in overnight and sets one rule before the deeds go out: no mine may border a house.',
  ),
  blocked: 'M',
  map: `
    G . . . . B
    . M . . . .
    . M . I . .
    . . . M M M
    B G . . A .`,
  regions: [
    { id: 'R1', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'gold', value: 1 }), C('MUST_NOT_CONTAIN_TAG', { tag: 'building' }), C('MUST_NOT_TOUCH_TAG', { tag: 'building' })] },
    { id: 'R2', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [
      C('MUST_CONTAIN_TAG', { tag: 'iron' })] },
    { id: 'R3', owner: { name: L('镇长', 'Mayor'), color: '#7e57c2', icon: 'crown', avatar: null }, constraints: [
      C('MUST_CONTAIN_TAG', { tag: 'building' }), C('MUST_CONTAIN_TAG', { tag: 'gold' })] },
    { id: 'R4', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [
      C('MUST_CONTAIN_TAG', { tag: 'building' }), C('MUST_NOT_CONTAIN_TAG', { tag: 'gold' })] },
    { id: 'R5', owner: { name: L('农场主', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [
      C('MUST_CONTAIN_TAG', { tag: 'farmland' })] },
  ],
});
