// 第 5 章（试做）：两种候选机制各一关，玩过再决定方向。用法：node tools/gen-chapter5.mjs
// 5-1 电力：WITHIN_REGION / FAR_FROM_REGION（区域间距离）；5-2 铁路：SHAPE_LINE / SHAPE_SQUARE（形状）+ MUST_TOUCH_REGION（首尾相接）
import { L, level as write } from './level-kit.mjs';

const level = (spec) => write({ createdAt: '2026-10-05', chapter: 5, ...spec });

level({
  file: '5-1.json', id: '5-1', difficulty: 10, theme: 'electric',
  name: L('第一盏电灯', 'The First Light Bulb'),
  story: L(
    '镇上建起了第一座发电站，可电线只能拉到附近。离电站太远的人家，只能靠变电站接力，才能点亮第一盏电灯。',
    'The town builds its first power station, but the wires only reach so far. Homes too far away must rely on a substation to relay the power before their first light bulb can glow.',
  ),
  // 8x8, k=7, seed 14, rounds 7
  map: `
    .  .  .  A  B  .  .  .
    .  .  .  .  G  .  .  B
    .  .  .  .  .  F  .  .
    F  A  .  F  .  .  .  .
    .  F  I  .  G  .  G  G
    I  I  B  G  .  A  .  .
    A  F  .  .  A  F  .  I
    .  .  .  B  .  .  .  .`,
  regions: [
    { id: 'R1', owner: { name: L('发电站', 'Power Station'), color: '#fbc02d', icon: 'power', avatar: null }, constraints: [{type: 'FAR_FROM_REGION', params: {region: 'R3', dist: 1}}] },
    { id: 'R2', owner: { name: L('变电站', 'Substation'), color: '#ffa726', icon: 'substation', avatar: null }, constraints: [{type: 'FAR_FROM_REGION', params: {region: 'R7', dist: 3}}] },
    { id: 'R3', owner: { name: L('居民区', 'Homes'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'WITHIN_REGION', params: {region: 'R1', dist: 2}}] },
    { id: 'R4', owner: { name: L('工厂', 'Factory'), color: '#8d6e63', icon: 'factory', avatar: null }, constraints: [{type: 'AREA_EQ', params: {value: 6}}, {type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 1}}, {type: 'WITHIN_REGION', params: {region: 'R1', dist: 2}}] },
    { id: 'R5', owner: { name: L('农庄', 'Farmstead'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}] },
    { id: 'R6', owner: { name: L('牧场', 'Pasture'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 4}}] },
    { id: 'R7', owner: { name: L('矿业公司', 'Mining Co.'), color: '#78909c', icon: 'miner', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 3}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'WITHIN_REGION', params: {region: 'R2', dist: 4}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R2', b: 'R3'}}],
});

level({
  file: '5-2.json', id: '5-2', difficulty: 10, theme: 'railway',
  name: L('铁路通车', 'The Railway Arrives'),
  story: L(
    '铁路终于修到了镇上。中央车站要盖得方方正正，每段铁轨都只有一格宽，还得一段接一段，最后连到车站。',
    'The railway finally reaches town. The central station must be perfectly square, every stretch of track is one cell wide, and the tracks must join end to end until they reach the station.',
  ),
  // 9x8, k=7, seed 29, rounds 7
  map: `
    I  F  G  .  B  .  .  .  F
    B  .  A  .  .  I  .  G  .
    .  .  .  .  .  .  .  A  .
    .  .  B  .  .  .  .  .  .
    .  G  .  .  .  .  .  F  A
    I  .  G  F  I  F  A  .  F
    .  F  .  .  .  B  .  .  G
    A  .  .  .  .  .  A  .  .`,
  regions: [
    { id: 'R1', owner: { name: L('北线铁轨', 'North Line'), color: '#9e9e9e', icon: 'track', avatar: null }, constraints: [{type: 'SHAPE_LINE'}] },
    { id: 'R2', owner: { name: L('中央车站', 'Central Station'), color: '#5c6bc0', icon: 'station', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'SHAPE_SQUARE'}] },
    { id: 'R3', owner: { name: L('货场', 'Freight Yard'), color: '#a1887f', icon: 'freight', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 4}}] },
    { id: 'R4', owner: { name: L('东支线', 'East Spur'), color: '#78909c', icon: 'track', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'MUST_TOUCH_REGION', params: {region: 'R6'}}, {type: 'SHAPE_LINE'}] },
    { id: 'R5', owner: { name: L('南支线', 'South Spur'), color: '#607d8b', icon: 'track', avatar: null }, constraints: [{type: 'MUST_TOUCH_REGION', params: {region: 'R6'}}, {type: 'SHAPE_LINE'}] },
    { id: 'R6', owner: { name: L('主线铁轨', 'Main Line'), color: '#546e7a', icon: 'track', avatar: null }, constraints: [{type: 'MUST_TOUCH_REGION', params: {region: 'R2'}}, {type: 'SHAPE_LINE'}] },
    { id: 'R7', owner: { name: L('居民区', 'Homes'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'MUST_TOUCH_REGION', params: {region: 'R6'}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R5', b: 'R6'}}],
});
