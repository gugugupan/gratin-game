// 第 5 章「铁路通车」：5-1…5-8。用法：node tools/gen-chapter5.mjs
// 候选来自 tools/generate-rail.mjs（先铺铁路再切地块）；区域带 kind: 'station' | 'rail'，铁轨用 SHAPE_LINE 串起来。
// 5-6 起引入「隧道与桥梁」：小写 m / l 是不可通行的山脉 / 河流，可通行的山 / 湖格只能归铁轨（RAIL_ONLY_TAG）。
import { L, level as write } from './level-kit.mjs';

const level = (spec) => write({ createdAt: '2026-10-05', chapter: 5, ...spec });

const role = (zh, en, color, icon) => ({ name: L(zh, en), color, icon, avatar: null });
const STATION = (zh, en, color = '#5c6bc0') => role(zh, en, color, 'station');
const TRACK = (zh, en, color = '#78909c') => role(zh, en, color, 'track');
const YARD = role('货场', 'Freight Yard', '#a1887f', 'freight');
const FARM = role('农场', 'Farm', '#66bb6a', 'farmer');
const WOODS = role('林场', 'Woodland', '#2e7d32', 'forester');
const MINE = role('矿业公司', 'Mining Co.', '#f9a825', 'miner');
const HOMES = role('居民区', 'Homes', '#ef5350', 'house');
const RANCH = role('牧场', 'Pasture', '#a1887f', 'rancher');
const SMITH = role('铁匠铺', 'Smithy', '#6d4c41', 'blacksmith');

level({
  file: '5-1.json', id: '5-1', difficulty: 6, theme: 'railway',
  name: L('第一段铁轨', 'The First Stretch of Track'),
  story: L(
    '铁路公司要在镇上铺第一段铁轨。车站盖成方方正正的，铁轨只有一格宽，把两座车站连起来——镇子也就此被分成了南北两半。',
    'The railway company lays its first stretch of track through town. Stations are perfectly square, the track is one cell wide and links the two stations — splitting the town into north and south.',
  ),
  // rail 6x6, seed 6, rounds 6, --runs=1 --plots=2
  map: `
    F . . . A F
    G . F . G .
    . . . . B .
    . . . . . .
    . . A B . .
    I I . A . .`,
  regions: [
    { id: 'R1', kind: 'station', owner: STATION('西站', 'West Station'), constraints: [{type: 'SHAPE_SQUARE'}] },
    { id: 'R2', kind: 'station', owner: STATION('东站', 'East Station', '#3949ab'), constraints: [{type: 'MUST_TOUCH_TAG', params: {tag: 'building'}}, {type: 'SHAPE_SQUARE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R3', kind: 'rail', owner: TRACK('铁轨', 'Track'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R1'}}] },
    { id: 'R4', owner: MINE, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 2}}] },
    { id: 'R5', owner: HOMES, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}] },
    { id: 'R6', owner: FARM, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 2}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R2', b: 'R5'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R3', b: 'R5'}}],
});

level({
  file: '5-2.json', id: '5-2', difficulty: 7, theme: 'town',
  name: L('转个弯', 'Round the Bend'),
  story: L(
    '第二条线路要绕过镇子中央，铁轨得转一个弯。每一段铁轨都是一格宽的直线，一段接一段，从北站一直通到南站。',
    'The second line has to swing around the middle of town, so the track must turn a corner. Each stretch is a straight one-cell-wide line, joined end to end from the north station to the south station.',
  ),
  // rail 7x6, seed 39, rounds 6, --runs=2 --plots=2
  map: `
    . . . G . G B
    A . . . B . .
    . . . . . . .
    . . A I . F .
    . F . . . . .
    A I . F . . .`,
  regions: [
    { id: 'R1', kind: 'station', owner: STATION('北站', 'North Station'), constraints: [{type: 'SHAPE_SQUARE'}] },
    { id: 'R2', kind: 'station', owner: STATION('南站', 'South Station', '#3949ab'), constraints: [{type: 'SHAPE_SQUARE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R4'}}] },
    { id: 'R3', kind: 'rail', owner: TRACK('西段铁轨', 'West Track'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R1'}}] },
    { id: 'R4', kind: 'rail', owner: TRACK('东段铁轨', 'East Track', '#607d8b'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R5', owner: HOMES, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}] },
    { id: 'R6', owner: WOODS, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}] },
    { id: 'R7', owner: FARM, constraints: [{type: 'AREA_EQ', params: {value: 8}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 2}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R1', b: 'R2'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R1', b: 'R4'}}],
});

level({
  file: '5-3.json', id: '5-3', difficulty: 8, theme: 'blueprint',
  name: L('绕镇一周', 'All the Way Round'),
  story: L(
    '老镇中心不许拆，铁路只好沿着它的外圈绕一大圈：先往北，再往东，最后折回南边。三段铁轨首尾相连，把老镇整个围了起来。',
    'The old town centre may not be torn down, so the railway loops right round it: north, then east, then back south. Three stretches of track, joined end to end, wrap the whole old town.',
  ),
  // rail 7x7, seed 7, rounds 7, --runs=3 --plots=3 --maxlen=7
  map: `
    . . . . . . F
    F . . . . . G
    I . . B F . A
    G . B . I . .
    . . . A . . .
    A . . . . . F
    . . . . . . A`,
  regions: [
    { id: 'R1', kind: 'station', owner: STATION('老站', 'Old Station'), constraints: [{type: 'MUST_NOT_TOUCH_TAG', params: {tag: 'forest'}}, {type: 'MUST_TOUCH_TAG', params: {tag: 'farmland'}}, {type: 'SHAPE_SQUARE'}] },
    { id: 'R2', kind: 'station', owner: STATION('新站', 'New Station', '#3949ab'), constraints: [{type: 'SHAPE_SQUARE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R5'}}] },
    { id: 'R3', kind: 'rail', owner: TRACK('西段铁轨', 'West Track'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R1'}}] },
    { id: 'R4', kind: 'rail', owner: TRACK('北段铁轨', 'North Track', '#607d8b'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R5', kind: 'rail', owner: TRACK('东段铁轨', 'East Track', '#90a4ae'), constraints: [{type: 'AREA_EQ', params: {value: 6}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R4'}}] },
    { id: 'R6', owner: FARM, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}] },
    { id: 'R7', owner: WOODS, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 2}}] },
    { id: 'R8', owner: role('老镇', 'Old Town', '#ef5350', 'house'), constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R1', b: 'R4'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R2', b: 'R4'}}],
});

level({
  file: '5-4.json', id: '5-4', difficulty: 9, theme: 'contract',
  name: L('见缝插针', 'Through the Gaps'),
  story: L(
    '地主们抢先把地都划好了，铁路公司来晚一步，只能在地块之间的缝里铺轨。先弄清每块地在哪里，铁轨该走的路自然就露出来了。',
    'The landowners staked out their plots first; the railway company arrived too late and must lay track in the gaps between them. Work out where each plot lies, and the path for the rails reveals itself.',
  ),
  // rail 8x7, seed 7, rounds 9, --runs=3 --plots=3 --maxlen=6
  map: `
    . . . . . . A .
    . . . . . . F A
    F . . . . A . .
    . . B F . . A .
    G . B . . . I .
    B . . I . . . G
    . . . . . . . F`,
  regions: [
    { id: 'R1', kind: 'station', owner: STATION('西站', 'West Station'), constraints: [{type: 'SHAPE_SQUARE'}] },
    { id: 'R2', kind: 'station', owner: STATION('东站', 'East Station', '#3949ab'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_SQUARE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R5'}}] },
    { id: 'R3', kind: 'rail', owner: TRACK('一号铁轨', 'Track No. 1'), constraints: [{type: 'AREA_EQ', params: {value: 5}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R1'}}] },
    { id: 'R4', kind: 'rail', owner: TRACK('二号铁轨', 'Track No. 2', '#607d8b'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R5', kind: 'rail', owner: TRACK('三号铁轨', 'Track No. 3', '#90a4ae'), constraints: [{type: 'AREA_EQ', params: {value: 6}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R4'}}] },
    { id: 'R6', owner: RANCH, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 1}}] },
    { id: 'R7', owner: FARM, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 4}}, {type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}] },
    { id: 'R8', owner: HOMES, constraints: [{type: 'AREA_EQ', params: {value: 8}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 2}}] },
    { id: 'R9', owner: SMITH, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}] },
    { id: 'R10', owner: MINE, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 1}}] },
  ],
  globalConstraints: [{type: 'AREA_LARGER_THAN', params: {a: 'R1', b: 'R10'}}],
});

level({
  file: '5-5.json', id: '5-5', difficulty: 10, theme: 'railway',
  name: L('横平竖直', 'Across and Down'),
  story: L(
    '工程师的图纸上写明了：哪段铁轨南北走向，哪段东西走向。主线旁边还要岔出一条支线，把货物送进货场。',
    'The engineer\'s plans spell it out: which stretch of track runs north–south and which runs east–west. A spur must also branch off the main line to carry goods into the freight yard.',
  ),
  // rail 8x8, seed 18, rounds 7, --runs=2 --plots=5 --spur --orient --maxlen=7 --edge
  map: `
    . F . . . B . I
    . . A . . F . .
    . . . . . A . .
    . . . . . . . .
    A G F . B A . .
    . . . . . A G .
    F . . . . . . .
    I . F B I . . G`,
  regions: [
    { id: 'R1', kind: 'station', owner: STATION('北站', 'North Station'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_SQUARE'}] },
    { id: 'R2', kind: 'station', owner: STATION('东站', 'East Station', '#3949ab'), constraints: [{type: 'SHAPE_SQUARE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R4'}}] },
    { id: 'R3', kind: 'rail', owner: TRACK('主线', 'Main Line'), constraints: [{type: 'MUST_TOUCH_REGION', params: {region: 'R1'}}, {type: 'SHAPE_VLINE'}] },
    { id: 'R4', kind: 'rail', owner: TRACK('东段铁轨', 'East Track', '#90a4ae'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R5', kind: 'rail', owner: TRACK('货运支线', 'Freight Spur', '#607d8b'), constraints: [{type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}, {type: 'SHAPE_HLINE'}] },
    { id: 'R6', owner: YARD, constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'MUST_TOUCH_REGION', params: {region: 'R5'}}] },
    { id: 'R7', owner: FARM, constraints: [{type: 'AREA_EQ', params: {value: 6}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}] },
    { id: 'R8', owner: SMITH, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}] },
    { id: 'R9', owner: role('菜园', 'Vegetable Patch', '#9ccc65', 'farmer'), constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}] },
    { id: 'R10', owner: WOODS, constraints: [{type: 'AREA_EQ', params: {value: 10}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 2}}] },
    { id: 'R11', owner: MINE, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 1}}] },
    { id: 'R12', owner: HOMES, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 2}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R1', b: 'R2'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R1', b: 'R8'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R3', b: 'R5'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R8', b: 'R9'}}],
});

level({
  file: '5-6.json', id: '5-6', difficulty: 11, theme: 'mountain',
  name: L('穿山隧道', 'The Mountain Tunnel'),
  story: L(
    '一道山脉挡在镇子东边，深色的山岭谁也过不去。好在最北头有个山口能打隧道——浅色的山地只许铁路占用，别的人家碰都不能碰。',
    'A mountain ridge blocks the east side of town, and nobody can cross its dark peaks. Luckily there is a pass at the far north where a tunnel can be dug — the light mountain cells may only be taken by railway track.',
  ),
  // rail 9x8, seed 52, rounds 8, --runs=3 --plots=3 --tunnel
  map: `
    B . . . B . . M .
    F . G . . . . m .
    . . . . . . . m .
    A . B A . . I m .
    A B . . . . F . .
    . . F I . . F . .
    . . A . G . G A .
    . I . . . . F . .`,
  regions: [
    { id: 'R1', kind: 'station', owner: STATION('镇站', 'Town Station'), constraints: [{type: 'SHAPE_SQUARE'}] },
    { id: 'R2', kind: 'station', owner: STATION('山后站', 'Hillside Station', '#3949ab'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_SQUARE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R5'}}] },
    { id: 'R3', kind: 'rail', owner: TRACK('北上铁轨', 'Northbound Track'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R1'}}] },
    { id: 'R4', kind: 'rail', owner: TRACK('隧道', 'Tunnel', '#5d4037'), constraints: [{type: 'MUST_NOT_TOUCH_REGION', params: {region: 'R7'}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R5', kind: 'rail', owner: TRACK('南下铁轨', 'Southbound Track', '#90a4ae'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R4'}}] },
    { id: 'R6', owner: HOMES, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 3}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}] },
    { id: 'R7', owner: SMITH, constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}] },
    { id: 'R8', owner: WOODS, constraints: [{type: 'AREA_EQ', params: {value: 5}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 2}}] },
    { id: 'R9', owner: FARM, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 2}}] },
  ],
  globalConstraints: [{type: 'AREA_LARGER_THAN', params: {a: 'R2', b: 'R5'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R8', b: 'R4'}}, {type: 'RAIL_ONLY_TAG', params: {tag: 'mountain'}}],
});

level({
  file: '5-7.json', id: '5-7', difficulty: 12, theme: 'mine',
  name: L('货运支线', 'The Freight Spur'),
  story: L(
    '隧道打通后，矿石和粮食越来越多，铁路公司决定修一个货场。一条短短的支线从主线上岔出去，尽头就是货场。山地依旧只许铁路通过。',
    'Once the tunnel is through, ore and grain pile up, and the railway company decides to build a freight yard. A short spur branches off the main line, with the yard at its end. Mountain cells are still for railway track only.',
  ),
  // rail 9x9, seed 5, rounds 9, --runs=3 --plots=5 --tunnel --spur --maxlen=7 --edge
  map: `
    . . . . . M . . .
    . A F . B m A . .
    . . . . . m G F .
    . . . . . m . . .
    . . . . . . I . F
    . . F . . . B . .
    F G . . . . B A B
    A I A . . . G . .
    F . . A . . . I .`,
  regions: [
    { id: 'R1', kind: 'station', owner: STATION('山口站', 'Pass Station'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_SQUARE'}] },
    { id: 'R2', kind: 'station', owner: STATION('平原站', 'Plains Station', '#3949ab'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_SQUARE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R5'}}] },
    { id: 'R3', kind: 'rail', owner: TRACK('隧道线', 'Tunnel Line', '#5d4037'), constraints: [{type: 'AREA_EQ', params: {value: 7}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R1'}}] },
    { id: 'R4', kind: 'rail', owner: TRACK('西段铁轨', 'West Track'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R5', kind: 'rail', owner: TRACK('中段铁轨', 'Middle Track', '#90a4ae'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R4'}}] },
    { id: 'R6', kind: 'rail', owner: TRACK('货运支线', 'Freight Spur', '#607d8b'), constraints: [{type: 'AREA_EQ', params: {value: 3}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R7', owner: YARD, constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'MUST_TOUCH_REGION', params: {region: 'R6'}}] },
    { id: 'R8', owner: role('果园', 'Orchard', '#9ccc65', 'farmer'), constraints: [{type: 'AREA_EQ', params: {value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}] },
    { id: 'R9', owner: SMITH, constraints: [{type: 'AREA_EQ', params: {value: 3}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}] },
    { id: 'R10', owner: MINE, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 2}}] },
    { id: 'R11', owner: HOMES, constraints: [{type: 'AREA_EQ', params: {value: 12}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}] },
    { id: 'R12', owner: FARM, constraints: [{type: 'AREA_EQ', params: {value: 16}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 3}}] },
    { id: 'R13', owner: RANCH, constraints: [{type: 'AREA_EQ', params: {value: 6}}] },
    { id: 'R14', owner: role('铁矿场', 'Iron Mine', '#8d6e63', 'miner'), constraints: [{type: 'AREA_EQ', params: {value: 3}}, {type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}] },
  ],
  globalConstraints: [{type: 'AREA_LARGER_THAN', params: {a: 'R4', b: 'R6'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R5', b: 'R6'}}, {type: 'RAIL_ONLY_TAG', params: {tag: 'mountain'}}],
});

level({
  file: '5-8.json', id: '5-8', difficulty: 13, theme: 'epilogue',
  name: L('全线通车', 'The Whole Line Opens'),
  story: L(
    '通车典礼这天，整条铁路要从始发站一路开到终点站：先过大桥跨过西边的河，再钻隧道穿过山脉，最后还要分出一条支线通往货场。浅色的湖面和山地都只许铁路占用。',
    'On opening day the whole line runs from the origin station to the terminal: over the bridge across the western river, through the tunnel under the ridge, with a spur branching off to the freight yard. Light lake and mountain cells may only be taken by railway track.',
  ),
  // rail 10x10, seed 1, rounds 6, --runs=3 --plots=6 --tunnel --bridge --spur --maxlen=8 --edge
  map: `
    . . . . m I . B . .
    . . G G m B . F A A
    . . . B m . . . . G
    I . . . m . F . . .
    . . . . m . . . . A
    l L l l m . . . . I
    F . G . m . . . . B
    F . A . m . . . . .
    A . B F m . . F . .
    F . . . M . . I A A`,
  regions: [
    { id: 'R1', kind: 'station', owner: STATION('始发站', 'Origin Station'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_SQUARE'}] },
    { id: 'R2', kind: 'station', owner: STATION('终点站', 'Terminal Station', '#3949ab'), constraints: [{type: 'SHAPE_SQUARE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R5'}}] },
    { id: 'R3', kind: 'rail', owner: TRACK('大桥线', 'Bridge Line', '#0277bd'), constraints: [{type: 'AREA_EQ', params: {value: 8}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R1'}}] },
    { id: 'R4', kind: 'rail', owner: TRACK('隧道线', 'Tunnel Line', '#5d4037'), constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R3'}}] },
    { id: 'R5', kind: 'rail', owner: TRACK('东段铁轨', 'East Track', '#90a4ae'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R4'}}] },
    { id: 'R6', kind: 'rail', owner: TRACK('货运支线', 'Freight Spur', '#607d8b'), constraints: [{type: 'SHAPE_LINE'}, {type: 'MUST_TOUCH_REGION', params: {region: 'R5'}}] },
    { id: 'R7', owner: YARD, constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'MUST_TOUCH_REGION', params: {region: 'R6'}}] },
    { id: 'R8', owner: RANCH, constraints: [{type: 'AREA_EQ', params: {value: 10}}] },
    { id: 'R9', owner: FARM, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 2}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 2}}] },
    { id: 'R10', owner: SMITH, constraints: [{type: 'AREA_EQ', params: {value: 3}}, {type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 1}}] },
    { id: 'R11', owner: role('农庄', 'Farmstead', '#aed581', 'farmer'), constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 2}}] },
    { id: 'R12', owner: WOODS, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 3}}] },
    { id: 'R13', owner: MINE, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'gold', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}] },
    { id: 'R14', owner: HOMES, constraints: [{type: 'AREA_EQ', params: {value: 9}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R12', b: 'R2'}}, {type: 'RAIL_ONLY_TAG', params: {tag: 'mountain'}}, {type: 'RAIL_ONLY_TAG', params: {tag: 'lake'}}],
});
