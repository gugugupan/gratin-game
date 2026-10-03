// 生成第 4 章「蒸汽时代」关卡 JSON 到 levels/。用法：node tools/gen-chapter4.mjs
// 地图和配方条件由 `node tools/generate-level.mjs factoryjs RECIPE W H SEED` 导出（配方见 recipes-ch4.mjs），名字和故事为手写。
import { L, level as write } from './level-kit.mjs';

const level = (spec) => write({ createdAt: '2026-10-04', chapter: 4, ...spec });

level({
  file: '4-1.json', id: '4-1', difficulty: 6, theme: 'scissors',
  name: L('第一把剪刀', 'The First Scissors'),
  story: L(
    '几十年过去，港口的蒸汽船带来了新机器。铁匠铺要用铁矿场运来的矿石打出第一批剪刀，可叮叮当当的锤声不能吵到民房。',
    'Decades later, steamships bring new machines to the harbor. The smithy wants to forge its first scissors from the iron mine’s ore, but all that hammering must stay away from people’s homes.',
  ),
  product: {name: {zh: '剪刀', en: 'Scissors'}, icon: 'scissors', goal: 'R2'},
  map: `
    I . . . . .
    I I F I . B
    . . . A B .
    . . . . . .
    . . . . . .
    . . A F . A`,
  regions: [
    { id: 'R1', facility: 'gather', owner: {name: {zh: '铁矿场', en: 'Iron Mine'}, color: '#78909c', icon: 'miner', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 3}}] },
    { id: 'R2', facility: 'factory', owner: {name: {zh: '铁匠铺', en: 'Smithy'}, color: '#546e7a', icon: 'blacksmith', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'SUPPLIED_BY', params: {region: 'R1', tag: 'iron', value: 3}}, {type: 'NO_TAG_WITHIN', params: {tag: 'building', dist: 1}}] },
    { id: 'R3', owner: {name: {zh: '居民区', en: 'Homes'}, color: '#ef5350', icon: 'house', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}] },
    { id: 'R4', owner: {name: {zh: '农庄', en: 'Farmstead'}, color: '#66bb6a', icon: 'farmer', avatar: null}, constraints: [{type: 'MUST_TOUCH_TAG', params: {tag: 'farmland'}}] },
  ],
  globalConstraints: [{type: 'AREA_LARGER_THAN', params: {a: 'R3', b: 'R1'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R1', b: 'R4'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R2', b: 'R3'}}],
});

level({
  file: '4-2.json', id: '4-2', difficulty: 7, theme: 'pan',
  name: L('铸铁锅', 'Cast-Iron Pans'),
  story: L(
    '铸铁厂要同时用上铁矿和煤矿：没有煤火，铁就化不开。可炉子冒出的黑烟会熏坏庄稼，两格之内不能有耕地。',
    'The foundry needs both iron and coal, since it takes a coal fire to melt iron. But its black smoke ruins crops, so there must be no farmland within two cells.',
  ),
  product: {name: {zh: '铁锅', en: 'Iron Pan'}, icon: 'pan', goal: 'R3'},
  map: `
    A . . B A .
    . . . A . .
    C F . . B .
    . . I . . .
    . . C . I .
    C C . . . I
    . . . . F .`,
  regions: [
    { id: 'R1', facility: 'gather', owner: {name: {zh: '铁矿场', en: 'Iron Mine'}, color: '#78909c', icon: 'miner', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 2}}] },
    { id: 'R2', facility: 'gather', owner: {name: {zh: '煤矿场', en: 'Coal Mine'}, color: '#5d5d5d', icon: 'collier', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'coal', value: 3}}] },
    { id: 'R3', facility: 'factory', owner: {name: {zh: '铸铁厂', en: 'Foundry'}, color: '#8d6e63', icon: 'factory', avatar: null}, constraints: [{type: 'SUPPLIED_BY', params: {region: 'R1', tag: 'iron', value: 2}}, {type: 'SUPPLIED_BY', params: {region: 'R2', tag: 'coal', value: 3}}, {type: 'NO_TAG_WITHIN', params: {tag: 'farmland', dist: 2}}] },
    { id: 'R4', owner: {name: {zh: '居民区', en: 'Homes'}, color: '#ef5350', icon: 'house', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}] },
    { id: 'R5', owner: {name: {zh: '农庄', en: 'Farmstead'}, color: '#66bb6a', icon: 'farmer', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 2}}] },
  ],
  globalConstraints: [{type: 'AREA_LARGER_THAN', params: {a: 'R5', b: 'R1'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R2', b: 'R4'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R2', b: 'R5'}}],
});
