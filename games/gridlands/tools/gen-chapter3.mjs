// 生成第 3 章「海岛拓荒」关卡 JSON 到 levels/。用法：node tools/gen-chapter3.mjs
// 地图由 tools/generate-level.mjs 选出（~ 海，数字 = 开局插旗的区域），角色与故事为手写。
import { C, L, level as write } from './level-kit.mjs';

const level = (spec) => write({ createdAt: '2026-10-03', ...spec });

level({
  file: '3-1.json', id: '3-1', chapter: 3, difficulty: 9, theme: 'landing',
  name: L('登岸', 'Landfall'),
  story: L(
    '协议签完，大家合伙买了一条船，驶向对岸没人住过的群岛。船长第一个跳上岸，插下了营地旗。',
    'With the agreement signed, everyone chips in for a boat and sails to the uninhabited islands across the strait. The captain is first ashore and plants the camp flags.',
  ),
  map: `
    .  .1 .  .  .  .  .  I
    A  F  F  .  I  .4 .  .
    I  .  A  B  G  .  F  A
    B  .  .  F  .  .  .  .
    .  B  .  .  F  .  ~  ~
    G  G  .  I  A  .  ~  ~
    .  G  .  .  B  G  ~  ~
    F  .  .  .  A  .  ~  ~`,
  regions: [
    { id: 'R1', owner: { name: L('船长', 'Captain'), color: '#1e88e5', icon: 'captain', avatar: null }, constraints: [] },
    { id: 'R2', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
    { id: 'R3', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'forest', value: 1 })] },
    { id: 'R4', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 2 }), C('TAG_COUNT_EQ', { tag: 'forest', value: 3 })] },
    { id: 'R5', owner: { name: L('牧羊人', 'Shepherd'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'forest', value: 2 })] },
  ],
  globalConstraints: [
    C('AREA_EQUAL_TO', { a: 'R2', b: 'R3' }),
    C('DIRECTION_OF', { a: 'R3', b: 'R2', dir: 'east' }),
    C('DIRECTION_OF', { a: 'R4', b: 'R3', dir: 'east' }),
  ],
});

level({
  file: '3-2.json', id: '3-2', chapter: 3, difficulty: 9, theme: 'tide',
  name: L('海湾', 'The Cove'),
  story: L(
    '第二座岛有一片平静的海湾。伐木工和铁匠抢先插了旗，其他人只好按能分到多少资源来划剩下的地。',
    'The second island has a quiet cove. The woodcutter and the blacksmith plant their flags first; everyone else divides the rest by how many resources they can claim.',
  ),
  map: `
    I  B  .  F1 .  .  A  ~
    B  .  .  .  .  I  .  ~
    B  .  A  F  F  .  A  ~
    B  F  F  G  .  .  .  ~
    A2 I  G  .  G  F  .  ~
    .  I  .  .  .  .  G  ~
    A  .  .  .  .  A  .  ~
    G  .  .  .  ~  ~  ~  ~
    .  .  F  .  ~  ~  ~  ~`,
  regions: [
    { id: 'R1', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'forest', value: 5 })] },
    { id: 'R2', owner: { name: L('铁匠', 'Blacksmith'), color: '#546e7a', icon: 'blacksmith', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 2 })] },
    { id: 'R3', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [C('AREA_EQ', { value: 6 }), C('TAG_COUNT_EQ', { tag: 'gold', value: 1 })] },
    { id: 'R4', owner: { name: L('农夫', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'farmland', value: 3 })] },
    { id: 'R5', owner: { name: L('渔夫', 'Fisher'), color: '#29b6f6', icon: 'fisher', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'gold', value: 1 })] },
  ],
  globalConstraints: [

  ],
});

level({
  file: '3-3.json', id: '3-3', chapter: 3, difficulty: 10, theme: 'compass',
  name: L('罗盘', 'By the Compass'),
  story: L(
    '岛上没有路，也没有地名，大家只能靠罗盘说话：谁在谁的东边、谁在谁的北边，都写进了地契。',
    'There are no roads or place names on the island, so everyone speaks in compass points: who lies east or north of whom goes straight into the deeds.',
  ),
  map: `
    .  F  .  A  I  .  I4 A  .
    B  G  G  F  .  .  A  G  F
    .  A  F  B  .  .  I  A  .
    A  .  .  .  .  .  F  F  F
    .  .  .  .  .  .  .  .  I
    .3 A  ~  ~  ~  .  B  .  G
    I  B  ~  ~  ~  .  .  .  .
    .  G  ~  ~  ~  .  F  .  .
    G  B  ~  ~  ~  ~  ~  ~  ~`,
  regions: [
    { id: 'R1', owner: { name: L('镇长', 'Mayor'), color: '#7e57c2', icon: 'crown', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 1 }), C('TAG_COUNT_EQ', { tag: 'building', value: 2 })] },
    { id: 'R2', owner: { name: L('农夫', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'farmland', value: 1 })] },
    { id: 'R3', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'gold', value: 2 })] },
    { id: 'R4', owner: { name: L('铁匠', 'Blacksmith'), color: '#546e7a', icon: 'blacksmith', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 2 })] },
    { id: 'R5', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'forest', value: 3 }), C('TAG_COUNT_EQ', { tag: 'gold', value: 1 })] },
    { id: 'R6', owner: { name: L('渔夫', 'Fisher'), color: '#29b6f6', icon: 'fisher', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'forest', value: 1 })] },
  ],
  globalConstraints: [
    C('AREA_EQUAL_TO', { a: 'R4', b: 'R5' }),
    C('AREA_LARGER_THAN', { a: 'R4', b: 'R6' }),
    C('DIRECTION_OF', { a: 'R1', b: 'R3', dir: 'east' }),
    C('DIRECTION_OF', { a: 'R4', b: 'R1', dir: 'east' }),
    C('DIRECTION_OF', { a: 'R4', b: 'R6', dir: 'north' }),
  ],
});

level({
  file: '3-4.json', id: '3-4', chapter: 3, difficulty: 10, theme: 'wind',
  name: L('北风', 'The North Wind'),
  story: L(
    '北风一连刮了三天。谁住北边、谁住南边，大家吵了整整一个晚上。',
    'The north wind blows for three days straight, and the argument over who lives north and who lives south lasts all night.',
  ),
  map: `
    ~  ~  ~  ~  .  A  .  I  .  .
    ~  B  .  .  .  B  .  .  .  .5
    ~  .  .  .  I  .  F  .  .  G
    ~  .  B  A  I  .  .  G  F  F
    ~  .  F  A  I  G  .  G  .  .
    ~  F  .  .  .  A  .  .  .  .
    .  .  A  .  .  .  F  A  .  .
    .  .  A  .  F  G  F  .  B  .
    A  B  .  .  .  .  I  G  F  .`,
  regions: [
    { id: 'R1', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
    { id: 'R2', owner: { name: L('农夫', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'farmland', value: 2 })] },
    { id: 'R3', owner: { name: L('牧羊人', 'Shepherd'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'farmland', value: 3 })] },
    { id: 'R4', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'farmland', value: 1 }), C('TAG_COUNT_EQ', { tag: 'gold', value: 3 })] },
    { id: 'R5', owner: { name: L('船长', 'Captain'), color: '#1e88e5', icon: 'captain', avatar: null }, constraints: [] },
    { id: 'R6', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'farmland', value: 2 }), C('TAG_COUNT_EQ', { tag: 'iron', value: 1 }), C('TAG_COUNT_EQ', { tag: 'forest', value: 4 })] },
  ],
  globalConstraints: [
    C('AREA_LARGER_THAN', { a: 'R5', b: 'R2' }),
    C('DIRECTION_OF', { a: 'R1', b: 'R6', dir: 'north' }),
    C('DIRECTION_OF', { a: 'R5', b: 'R2', dir: 'north' }),
    C('DIRECTION_OF', { a: 'R6', b: 'R4', dir: 'east' }),
  ],
});

level({
  file: '3-5.json', id: '3-5', chapter: 3, difficulty: 11, theme: 'island',
  name: L('双子岛', 'Twin Islands'),
  story: L(
    '一道海峡几乎把这里隔成了两座岛，只在南边留下一条窄窄的沙洲。谁守着沙洲，谁就能两边都看得到。',
    'A strait almost splits this place into twin islands, leaving only a narrow sandbar in the south. Whoever holds the sandbar can see both shores.',
  ),
  map: `
    .  .  .  .  I  B  ~  G  A  F
    .  .  A  .  .  I  ~  B  A  .
    I  .  I  .  .  .  ~  F  F  A
    .  .  .  I  .  .  ~  F  B  A
    G  .  .  .  A  .  ~  .  .  .
    G  .  F2 F  .4 .  ~  A  B  B
    I  .  .  .  .  .  ~  G  G  F
    F  .  .  .  .  .  .  B  ~  ~
    .  F  .  .  G  ~  ~  ~  ~  ~
    .  G  F  .  A  ~  ~  ~  ~  ~`,
  regions: [
    { id: 'R1', owner: { name: L('铁匠', 'Blacksmith'), color: '#546e7a', icon: 'blacksmith', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 5 })] },
    { id: 'R2', owner: { name: L('船长', 'Captain'), color: '#1e88e5', icon: 'captain', avatar: null }, constraints: [] },
    { id: 'R3', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
    { id: 'R4', owner: { name: L('渔夫', 'Fisher'), color: '#29b6f6', icon: 'fisher', avatar: null }, constraints: [] },
    { id: 'R5', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'gold', value: 3 }), C('TAG_COUNT_EQ', { tag: 'farmland', value: 3 })] },
    { id: 'R6', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'forest', value: 2 })] },
    { id: 'R7', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'gold', value: 2 }), C('TAG_COUNT_EQ', { tag: 'farmland', value: 1 })] },
    { id: 'R8', owner: { name: L('镇长', 'Mayor'), color: '#7e57c2', icon: 'crown', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
  ],
  globalConstraints: [
    C('AREA_LARGER_THAN', { a: 'R2', b: 'R3' }),
    C('AREA_LARGER_THAN', { a: 'R4', b: 'R3' }),
    C('AREA_LARGER_THAN', { a: 'R3', b: 'R8' }),
    C('AREA_LARGER_THAN', { a: 'R7', b: 'R5' }),
  ],
});

level({
  file: '3-6.json', id: '3-6', chapter: 3, difficulty: 12, theme: 'harbor',
  name: L('港口', 'The Harbor'),
  story: L(
    '来往的船越来越多，岛上需要一座港口。船长守着西边的码头，开发商则看中了南边最大的那块地。',
    'More and more ships call here, and the islands need a harbor. The captain holds the western pier, while the developer eyes the largest plot in the south.',
  ),
  map: `
    ~  ~  ~  ~  ~  ~  .  .  B  B
    ~  ~  ~  ~  ~  ~  A  .  .  A
    ~  ~  ~  ~  ~  ~  A  .  .  .
    ~  ~  ~  ~  ~  ~  .  F  G  .
    ~  ~  .  I  G  F  I  A  .  .
    ~  ~  G  .  .  A  .  .  I5 F
    ~  ~  .  F  G  G  G  .  .  F
    A1 .  F  .  F  F  .  A  B  F
    ~  ~  B  .  G  .  .  .  .  F
    ~  ~  .  I  I  A  B  .  I  B`,
  regions: [
    { id: 'R1', owner: { name: L('船长', 'Captain'), color: '#1e88e5', icon: 'captain', avatar: null }, constraints: [] },
    { id: 'R2', owner: { name: L('铁匠', 'Blacksmith'), color: '#546e7a', icon: 'blacksmith', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
    { id: 'R3', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'gold', value: 1 })] },
    { id: 'R4', owner: { name: L('农夫', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'farmland', value: 4 })] },
    { id: 'R5', owner: { name: L('渔夫', 'Fisher'), color: '#29b6f6', icon: 'fisher', avatar: null }, constraints: [] },
    { id: 'R6', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'forest', value: 2 })] },
    { id: 'R7', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
    { id: 'R8', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'building', value: 3 }), C('TAG_COUNT_EQ', { tag: 'forest', value: 4 }), C('TAG_COUNT_EQ', { tag: 'iron', value: 3 })] },
  ],
  globalConstraints: [
    C('AREA_LARGER_THAN', { a: 'R7', b: 'R1' }),
    C('AREA_EQUAL_TO', { a: 'R2', b: 'R5' }),
    C('AREA_LARGER_THAN', { a: 'R3', b: 'R7' }),
    C('DIRECTION_OF', { a: 'R2', b: 'R3', dir: 'north' }),
    C('DIRECTION_OF', { a: 'R2', b: 'R7', dir: 'east' }),
  ],
});

level({
  file: '3-7.json', id: '3-7', chapter: 3, difficulty: 12, theme: 'bonfire',
  name: L('尾声：篝火', 'Epilogue: The Bonfire'),
  story: L(
    '第一次丰收的夜晚，大家在海边点起篝火。从河湾到海岛，每一块地终于都有了主人。',
    'On the night of the first harvest, everyone lights a bonfire on the beach. From the river bend to the islands, every plot finally has an owner.',
  ),
  map: `
    B  .  .  .  .  I  .  .  G  F  .
    A  F  B  .  .  .  A  .  .  .  .
    F  .  .  .  A  .  G  .  .  I  G
    A  F  I  .  .  .  .  .  .  B  B
    .  I  .  .  .  F  .  .  .  .  F
    ~  ~  A  .  G  G  A  .  B  G  ~
    ~  ~  ~  ~  .  F  .  F  G  .  ~
    .  I  .  .  F  .  .  .  F  .  ~
    .6 .  F  .  G  .  .  I  .  .8 ~
    .  .  A  .  B  .  A  .  A  .  ~`,
  regions: [
    { id: 'R1', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
    { id: 'R2', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'forest', value: 3 })] },
    { id: 'R3', owner: { name: L('铁匠', 'Blacksmith'), color: '#546e7a', icon: 'blacksmith', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 2 })] },
    { id: 'R4', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 1 }), C('TAG_COUNT_EQ', { tag: 'gold', value: 3 })] },
    { id: 'R5', owner: { name: L('农夫', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'farmland', value: 1 })] },
    { id: 'R6', owner: { name: L('渔夫', 'Fisher'), color: '#29b6f6', icon: 'fisher', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
    { id: 'R7', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'gold', value: 3 }), C('TAG_COUNT_EQ', { tag: 'forest', value: 3 }), C('TAG_COUNT_EQ', { tag: 'farmland', value: 2 })] },
    { id: 'R8', owner: { name: L('镇长', 'Mayor'), color: '#7e57c2', icon: 'crown', avatar: null }, constraints: [C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
  ],
  globalConstraints: [
    C('DIRECTION_OF', { a: 'R1', b: 'R3', dir: 'north' }),
    C('DIRECTION_OF', { a: 'R5', b: 'R2', dir: 'east' }),
  ],
});
