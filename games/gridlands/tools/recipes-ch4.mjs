// 第 4 章「蒸汽时代」的配方树，供 generate-level.mjs factory 命令使用
const L = (zh, en) => ({ zh, en });

const N = {
  iron: { id: 'iron', name: L('铁矿场', 'Iron Mine'), icon: 'miner', color: '#78909c', facility: 'gather', tag: 'iron', count: [2, 3] },
  coal: { id: 'coal', name: L('煤矿场', 'Coal Mine'), icon: 'collier', color: '#5d5d5d', facility: 'gather', tag: 'coal', count: [2, 3] },
  copper: { id: 'copper', name: L('铜矿场', 'Copper Mine'), icon: 'miner', color: '#d4834f', facility: 'gather', tag: 'copper', count: [1, 3] },
  pasture: { id: 'pasture', name: L('牧场', 'Pasture'), icon: 'rancher', color: '#a1887f', facility: 'gather', tag: 'pasture', count: [2, 3] },
  cotton: { id: 'cotton', name: L('棉田', 'Cotton Field'), icon: 'farmer', color: '#9ccc65', facility: 'gather', tag: 'cotton', count: [2, 3] },
  wood: { id: 'wood', name: L('伐木场', 'Lumber Camp'), icon: 'forester', color: '#2e7d32', facility: 'gather', tag: 'forest', count: [2, 3] },
};
const F = (id, zh, en, icon, color, inputs, goal = false) => ({ id, name: L(zh, en), icon, color, facility: 'factory', inputs, goal });
const X = {
  house: { name: L('居民区', 'Homes'), icon: 'house', color: '#ef5350' },
  farm: { name: L('农庄', 'Farmstead'), icon: 'farmer', color: '#66bb6a' },
  inn: { name: L('客栈', 'Inn'), icon: 'crown', color: '#7e57c2' },
};

export const RECIPES = {
  scissors: {
    product: { name: L('剪刀', 'Scissors'), icon: 'scissors' },
    nodes: [N.iron, F('smithy', '铁匠铺', 'Smithy', 'blacksmith', '#546e7a', ['iron'], true)],
    extras: [X.house, X.farm],
    pollution: [{ node: 'smithy', tag: 'building', dist: 1 }],
    scatter: { farmland: 3, building: 2, forest: 2, iron: 1 },
  },
  pan: {
    product: { name: L('铁锅', 'Iron Pan'), icon: 'pan' },
    nodes: [N.iron, N.coal, F('foundry', '铸铁厂', 'Foundry', 'factory', '#8d6e63', ['iron', 'coal'], true)],
    extras: [X.house, X.farm],
    pollution: [{ node: 'foundry', tag: 'farmland', dist: 2 }],
    scatter: { farmland: 3, building: 2, forest: 2, iron: 1, coal: 1 },
  },
  yarn: {
    product: { name: L('毛线', 'Yarn'), icon: 'yarn' },
    nodes: [N.pasture, F('spinner', '纺纱厂', 'Spinning Mill', 'spinner', '#ab47bc', ['pasture']), F('dyer', '染坊', 'Dye Works', 'dyer', '#26a69a', ['spinner'], true)],
    extras: [X.house, X.farm],
    pollution: [{ node: 'dyer', tag: 'farmland', dist: 1 }],
    scatter: { farmland: 3, building: 2, forest: 2, pasture: 1 },
  },
  candle: {
    product: { name: L('蜡烛', 'Candle'), icon: 'candle' },
    nodes: [N.pasture, F('tallow', '炼脂坊', 'Tallow Works', 'tallow', '#ff8a65', ['pasture']), N.cotton,
      F('threader', '纺线厂', 'Wick Mill', 'threader', '#7e57c2', ['cotton']), F('chandler', '制烛坊', 'Chandlery', 'chandler', '#f9a825', ['tallow', 'threader'], true)],
    extras: [X.house],
    pollution: [{ node: 'tallow', tag: 'building', dist: 1 }],
    scatter: { building: 2, farmland: 2, forest: 2, pasture: 1, cotton: 1 },
  },
  watch: {
    product: { name: L('怀表', 'Pocket Watch'), icon: 'watch' },
    nodes: [N.iron, N.coal, F('steel', '钢厂', 'Steelworks', 'factory', '#8d6e63', ['iron', 'coal']), F('gear', '齿轮厂', 'Gear Works', 'gearwright', '#607d8b', ['steel']),
      N.copper, F('brass', '铜件厂', 'Brass Works', 'brazier', '#ffb74d', ['copper']), F('clock', '钟表坊', 'Watchmaker', 'clockmaker', '#5c6bc0', ['gear', 'brass'], true)],
    extras: [X.house],
    pollution: [{ node: 'steel', tag: 'building', dist: 1 }],
    scatter: { building: 2, farmland: 2, forest: 2, iron: 1, coal: 1, copper: 1 },
  },
  umbrella: {
    product: { name: L('雨伞', 'Umbrella'), icon: 'umbrella' },
    nodes: [N.cotton, F('weaver', '织布厂', 'Weaving Mill', 'weaver', '#ec407a', ['cotton']), N.iron, N.coal, F('steel', '钢厂', 'Steelworks', 'factory', '#8d6e63', ['iron', 'coal']),
      F('ribs', '伞骨厂', 'Rib Works', 'toolmaker', '#607d8b', ['steel']), N.wood, F('carpenter', '木工坊', 'Carpentry', 'carpenter', '#a1887f', ['wood']),
      F('umbrella', '制伞坊', 'Umbrella Maker', 'umbrella', '#42a5f5', ['weaver', 'ribs', 'carpenter'], true)],
    extras: [X.house],
    pollution: [{ node: 'steel', tag: 'building', dist: 1 }],
    scatter: { building: 2, farmland: 2, forest: 1, cotton: 1, iron: 1, coal: 1 },
  },
  clock: {
    product: { name: L('座钟', 'Mantel Clock'), icon: 'clock' },
    nodes: [N.wood, F('carpenter', '木工坊', 'Carpentry', 'carpenter', '#a1887f', ['wood']), N.iron, N.coal,
      F('steel', '钢厂', 'Steelworks', 'factory', '#8d6e63', ['iron', 'coal']), F('gear', '齿轮厂', 'Gear Works', 'gearwright', '#607d8b', ['steel']),
      N.copper, F('brass', '铜件厂', 'Brass Works', 'brazier', '#ffb74d', ['copper']),
      F('clock', '钟表坊', 'Clockmaker', 'clockmaker', '#5c6bc0', ['carpenter', 'gear', 'brass'], true)],
    extras: [X.house],
    pollution: [{ node: 'steel', tag: 'building', dist: 1 }],
    scatter: { building: 2, farmland: 2, forest: 1, iron: 1, coal: 1, copper: 1 },
  },
  coat: {
    product: { name: L('大衣', 'Overcoat'), icon: 'coat' },
    nodes: [N.cotton, F('weaver', '织布厂', 'Weaving Mill', 'weaver', '#ec407a', ['cotton']), N.pasture, F('spinner', '纺纱厂', 'Spinning Mill', 'spinner', '#ab47bc', ['pasture']),
      N.iron, N.coal, F('steel', '钢厂', 'Steelworks', 'factory', '#8d6e63', ['iron', 'coal']), F('needle', '制针厂', 'Needle Works', 'toolmaker', '#607d8b', ['steel']),
      F('tailor', '裁缝铺', 'Tailor', 'tailor', '#8e24aa', ['weaver', 'spinner', 'needle'], true)],
    extras: [X.house, X.inn],
    pollution: [{ node: 'steel', tag: 'building', dist: 1 }, { node: 'weaver', tag: 'coal', dist: 1 }],
    scatter: { building: 3, farmland: 2, forest: 2, cotton: 1, pasture: 1, iron: 1, coal: 1 },
  },
};

// 设施多的大配方去掉普通区域，减少区域数量（线索更少、更好读）
for (const key of ['watch', 'umbrella', 'clock', 'coat']) RECIPES[`${key}-lean`] = { ...RECIPES[key], extras: [] };

