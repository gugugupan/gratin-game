// 生成第 1 章新增关卡 1-7、1-8 到 levels/（1-1 手写，1-2…1-6 见 gen-samples.mjs）。用法：node tools/gen-chapter1.mjs
// 地图由 `node tools/generate-level.mjs js ...` 导出，角色与故事为手写。
import { L, level } from './level-kit.mjs';

level({
  file: '1-7.json', id: '1-7', chapter: 1, difficulty: 6, theme: 'neighbors', createdAt: '2026-10-04',
  name: L('隔壁的牛', 'The Neighbor\u2019s Cows'),
  story: L(
    '农场主的庄稼总被隔壁的牛啃掉。这次分地，农场主只提了一个要求：牧场主的地绝不能挨着自己的。',
    'The farmer\u2019s crops keep getting eaten by the neighbor\u2019s cows. This time the farmer has just one demand: the rancher\u2019s land must not touch the farm.',
  ),
  // 5x5, k=3, seed 43, rounds 5
  map: `
    .  .  A  .  F
    G  .  .  .  A
    .  I  F  .  .
    .  .  .  .  B
    F  G  .  .  .`,
  regions: [
    { id: 'R1', owner: { name: L('牧场主', 'Rancher'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [{type: 'MUST_NOT_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R2', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 1}}] },
    { id: 'R3', owner: { name: L('农场主', 'Farmer'), color: '#4caf50', icon: 'farmer', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 2}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R1', b: 'R2'}}],
});

level({
  file: '1-8.json', id: '1-8', chapter: 1, difficulty: 7, theme: 'edge', createdAt: '2026-10-04',
  name: L('地图的边', 'At the Edge'),
  story: L(
    '牧羊人要靠着地图边上的草场放羊；居民嫌角落风大，说什么也不肯住在角上。',
    'The shepherd wants land along the edge of the map for grazing, while the residents find the corners too windy and refuse to live in one.',
  ),
  // 6x5, k=3, seed 11, rounds 6
  blocked: 'L',
  map: `
    L  L  A  G  G  F
    B  .  .  I  F  .
    A  .  I  .  B  .
    .  .  .  .  .  .
    .  .  .  A  F  .`,
  regions: [
    { id: 'R1', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [{type: 'MUST_NOT_ON_CORNER'}] },
    { id: 'R2', owner: { name: L('牧羊人', 'Shepherd'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [{type: 'MUST_ON_EDGE'}] },
    { id: 'R3', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}] },
  ],
  globalConstraints: [{type: 'AREA_LARGER_THAN', params: {a: 'R1', b: 'R2'}}],
});
