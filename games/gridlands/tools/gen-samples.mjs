// 生成样例关卡 JSON 到 levels/。用法：node tools/gen-samples.mjs
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (name, obj) => writeFileSync(join(root, 'levels', name), JSON.stringify(obj, null, 2) + '\n');
const L = (zh, en) => ({ zh, en }); // 可本地化字符串

const BG = { plain: '#cdebc0', forest: '#2e7d32', gold: '#ffd54f', iron: '#90a4ae', mountain: '#8d6e63', lake: '#4fc3f7', farmland: '#f4ecd4', building: '#cfd5dd' };

// 按 (x,y)->tags / blocked / fixed 的描述生成 board（label 不再写入，由前端按语言派生）
function board(width, height, spec = {}) {
  const tagsAt = spec.tags || {};
  const blocked = new Set(spec.blocked || []);
  const fixed = spec.fixed || {};
  const cells = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const k = `${x},${y}`;
      const tags = tagsAt[k] || ['plain'];
      const main = tags.find((t) => t !== 'plain') || 'plain';
      cells.push({
        id: y * width + x + 1, x, y, tags,
        assignable: !blocked.has(k),
        fixedRegion: fixed[k] || null,
        display: { bg: BG[main] || BG.plain, sprite: null },
      });
    }
  return { width, height, cells };
}

const base = (extra) => ({ schemaVersion: 1, shapeRule: 'RECT', adjacency: 4, coverage: 'FULL',
  meta: { author: 'manual', verifiedUnique: true, verifiedHumanSolvable: true, createdAt: '2026-06-13' }, ...extra });

// ── 1-2 4×4 面积 MAX / MIN ───────────────────────────────
out('1-2.json', base({
  id: '1-2', name: L('大地主与小地主', 'Big & Small Landlords'), chapter: 1, difficulty: 2,
  theme: 'town', story: L('两位地主都想买下镇边这片地。大地主要最大、而且带房子的一块；小地主只要最小的那块。', 'Two landlords both want the land at the edge of town. The big landlord wants the largest plot, with a building on it; the small landlord only wants the smallest.'),
  board: board(4, 4, { tags: { '0,0': ['building'], '3,0': ['building'] } }),
  regions: [
    { id: 'R1', owner: { name: L('大地主', 'Big Landlord'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [
      { type: 'AREA_MAX' },
      { type: 'MUST_CONTAIN_TAG', params: { tag: 'building' } },
    ] },
    { id: 'R2', owner: { name: L('小地主', 'Small Landlord'), color: '#42a5f5', icon: 'house', avatar: null }, constraints: [
      { type: 'AREA_MIN' },
      { type: 'MUST_NOT_CONTAIN_TAG', params: { tag: 'building' } },
    ] },
  ],
  globalConstraints: [],
  solution: [ { region: 'R1', cells: [1,2,3,4,5,6,7,8,9,10,11,12] }, { region: 'R2', cells: [13,14,15,16] } ],
}));

// ── 1-3 4×4 资源 包含 / 排除 ─────────────────────────────
out('1-3.json', base({
  id: '1-3', name: L('金矿与铁矿', 'Gold and Iron'), chapter: 1, difficulty: 3,
  theme: 'quarry', story: L('矿业公司盯上了金矿，却不想要铁矿；剩下的地交给农业公司。', 'The mining company has its eye on the gold but wants nothing to do with the iron. The rest goes to the farming company.'),
  board: board(4, 4, { tags: { '0,0': ['plain', 'gold'], '0,3': ['plain', 'iron'] } }),
  regions: [
    { id: 'R1', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [
      { type: 'AREA_EQ', params: { value: 8 } },
      { type: 'MUST_CONTAIN_TAG', params: { tag: 'gold' } },
      { type: 'MUST_NOT_CONTAIN_TAG', params: { tag: 'iron' } },
    ] },
    { id: 'R2', owner: { name: L('农业公司', 'Farming Co.'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [
      { type: 'AREA_EQ', params: { value: 8 } },
    ] },
  ],
  globalConstraints: [],
  solution: [ { region: 'R1', cells: [1,2,3,4,5,6,7,8] }, { region: 'R2', cells: [9,10,11,12,13,14,15,16] } ],
}));

// ── 1-4 6×4 数量 TAG_COUNT ──────────────────────────────
out('1-4.json', base({
  id: '1-4', name: L('三片森林', 'Three Forests'), chapter: 1, difficulty: 4,
  theme: 'forest', story: L('林业局要把三片森林圈在一起保护起来，开发商拿走其余的地。', 'The forestry bureau wants all three forests protected in one reserve. The developer takes everything else.'),
  board: board(6, 4, { tags: { '0,0': ['forest'], '1,1': ['forest'], '2,3': ['forest'] } }),
  regions: [
    { id: 'R1', owner: { name: L('林业局', 'Forestry Bureau'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [
      { type: 'AREA_EQ', params: { value: 12 } },
      { type: 'TAG_COUNT_GE', params: { tag: 'forest', value: 3 } },
    ] },
    { id: 'R2', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [
      { type: 'AREA_EQ', params: { value: 12 } },
    ] },
  ],
  globalConstraints: [],
  solution: [ { region: 'R1', cells: [1,2,3,7,8,9,13,14,15,19,20,21] }, { region: 'R2', cells: [4,5,6,10,11,12,16,17,18,22,23,24] } ],
}));

// ── 1-5 5×5 邻接 MUST_TOUCH_TAG（col0 为山脉障碍）─────────
out('1-5.json', base({
  id: '1-5', name: L('靠山吃山', 'Live off the Mountain'), chapter: 1, difficulty: 5,
  theme: 'mountain', story: L('山脚下，矿业公司想紧挨着山；农业公司怕落石，离山越远越好。', 'At the foot of the mountain, the miners want to be right against the slope, while the farmers want to stay clear of falling rocks.'),
  board: board(5, 5, { blocked: ['0,0','0,1','0,2','0,3','0,4'],
    tags: { '0,0': ['mountain'], '0,1': ['mountain'], '0,2': ['mountain'], '0,3': ['mountain'], '0,4': ['mountain'] } }),
  regions: [
    { id: 'R1', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [
      { type: 'AREA_EQ', params: { value: 10 } },
      { type: 'MUST_TOUCH_TAG', params: { tag: 'mountain' } },
    ] },
    { id: 'R2', owner: { name: L('农业公司', 'Farming Co.'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [
      { type: 'AREA_EQ', params: { value: 10 } },
      { type: 'MUST_NOT_TOUCH_TAG', params: { tag: 'mountain' } },
    ] },
  ],
  globalConstraints: [],
  solution: [ { region: 'R1', cells: [2,3,7,8,12,13,17,18,22,23] }, { region: 'R2', cells: [4,5,9,10,14,15,19,20,24,25] } ],
}));

// ── 1-6 5×5 全局：A比B大 + 唯一拥有金矿 ───────────────────
out('1-6.json', base({
  id: '1-6', name: L('黄金封地', 'Golden Fief'), chapter: 1, difficulty: 6,
  theme: 'royal', story: L('国王把这片土地分封给两个家族。黄金家族要金矿，白银家族要更大的封地。', 'The king grants this land to two noble houses. House Gold wants the gold; House Silver wants the bigger fief.'),
  board: board(5, 5, { tags: { '0,0': ['plain', 'gold'], '0,4': ['plain', 'gold'] } }),
  regions: [
    { id: 'R1', owner: { name: L('黄金家族', 'House Gold'), color: '#ffd54f', icon: 'crown', avatar: null }, constraints: [
      { type: 'AREA_EQ', params: { value: 10 } },
      { type: 'MUST_CONTAIN_TAG', params: { tag: 'gold' } },
    ] },
    { id: 'R2', owner: { name: L('白银家族', 'House Silver'), color: '#b0bec5', icon: 'crown', avatar: null }, constraints: [
      { type: 'AREA_EQ', params: { value: 15 } },
    ] },
  ],
  globalConstraints: [
    { type: 'ONLY_ONE_CONTAINS', params: { tag: 'gold' } },
    { type: 'AREA_LARGER_THAN', params: { a: 'R2', b: 'R1' } },
  ],
  solution: [ { region: 'R1', cells: [1,2,6,7,11,12,16,17,21,22] }, { region: 'R2', cells: [3,4,5,8,9,10,13,14,15,18,19,20,23,24,25] } ],
}));

console.log('已生成 1-2 … 1-6');
