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

level({
  file: '4-3.json', id: '4-3', difficulty: 8, theme: 'yarn',
  name: L('彩色毛线', 'Colored Yarn'),
  story: L(
    '镇上的羊越养越多。纺纱厂把羊毛纺成纱，染坊再把纱染成五颜六色的毛线。可染坊的废水会渗进田里，一格之内不能有耕地。',
    'The town\u2019s flocks keep growing. The spinning mill turns wool into yarn and the dye works colors it, but dye runoff seeps into the fields, so there must be no farmland within one cell.',
  ),
  product: {name: {zh: '毛线', en: 'Yarn'}, icon: 'yarn', goal: 'R3'},
  map: `
    . . . . B . .
    . . . . . . .
    P B . F . . .
    . . . . . P .
    . A . . . . .
    F . . A A . P
    . . . . . P .`,
  regions: [
    { id: 'R1', facility: 'gather', owner: {name: {zh: '牧场', en: 'Pasture'}, color: '#a1887f', icon: 'rancher', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'pasture', value: 3}}] },
    { id: 'R2', facility: 'factory', owner: {name: {zh: '纺纱厂', en: 'Spinning Mill'}, color: '#ab47bc', icon: 'spinner', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 2}}, {type: 'SUPPLIED_BY', params: {region: 'R1', tag: 'pasture', value: 3}}] },
    { id: 'R3', facility: 'factory', owner: {name: {zh: '染坊', en: 'Dye Works'}, color: '#26a69a', icon: 'dyer', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}, {type: 'SUPPLIED_BY', params: {region: 'R2'}}, {type: 'NO_TAG_WITHIN', params: {tag: 'farmland', dist: 1}}] },
    { id: 'R4', owner: {name: {zh: '居民区', en: 'Homes'}, color: '#ef5350', icon: 'house', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'pasture', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}] },
    { id: 'R5', owner: {name: {zh: '农庄', en: 'Farmstead'}, color: '#66bb6a', icon: 'farmer', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 2}}] },
  ],
  globalConstraints: [{type: 'AREA_LARGER_THAN', params: {a: 'R4', b: 'R1'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R2', b: 'R3'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R3', b: 'R4'}}],
});

level({
  file: '4-4.json', id: '4-4', difficulty: 9, theme: 'candle',
  name: L('冬夜的蜡烛', 'Candles for Winter'),
  story: L(
    '冬夜漫长，家家户户都要点蜡烛。炼脂坊熬羊油，纺线厂用棉花做烛芯，两路原料一起送进制烛坊。熬油的味道太冲，炼脂坊旁边不能有民房。',
    'Winter nights are long and every home needs candles. The tallow works renders mutton fat, the wick mill spins cotton wicks, and both lines feed the chandlery. The smell is so strong that no house may sit next to the tallow works.',
  ),
  product: {name: {zh: '蜡烛', en: 'Candle'}, icon: 'candle', goal: 'R5'},
  map: `
    . T . . A B .
    . . . . . . .
    . . . T F . .
    . . . T . . B
    . . . F . . A
    T . . . . . P
    . P P . . . .
    . . . . . . .`,
  regions: [
    { id: 'R1', facility: 'gather', owner: {name: {zh: '牧场', en: 'Pasture'}, color: '#a1887f', icon: 'rancher', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'pasture', value: 2}}, {type: 'EXCLUSIVE_TO', params: {region: 'R2'}}] },
    { id: 'R2', facility: 'factory', owner: {name: {zh: '炼脂坊', en: 'Tallow Works'}, color: '#ff8a65', icon: 'tallow', avatar: null}, constraints: [{type: 'SUPPLIED_BY', params: {region: 'R1', tag: 'pasture', value: 2}}, {type: 'NO_TAG_WITHIN', params: {tag: 'building', dist: 1}}] },
    { id: 'R3', facility: 'gather', owner: {name: {zh: '棉田', en: 'Cotton Field'}, color: '#9ccc65', icon: 'farmer', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'cotton', value: 3}}] },
    { id: 'R4', facility: 'factory', owner: {name: {zh: '纺线厂', en: 'Wick Mill'}, color: '#7e57c2', icon: 'threader', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 2}}, {type: 'SUPPLIED_BY', params: {region: 'R3', tag: 'cotton', value: 3}}] },
    { id: 'R5', facility: 'factory', owner: {name: {zh: '制烛坊', en: 'Chandlery'}, color: '#f9a825', icon: 'chandler', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'pasture', value: 1}}, {type: 'SUPPLIED_BY', params: {region: 'R2'}}, {type: 'SUPPLIED_BY', params: {region: 'R4'}}] },
    { id: 'R6', owner: {name: {zh: '居民区', en: 'Homes'}, color: '#ef5350', icon: 'house', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'cotton', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R1', b: 'R2'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R2', b: 'R5'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R6', b: 'R2'}}],
});

level({
  file: '4-5.json', id: '4-5', difficulty: 10, theme: 'watch',
  name: L('钟表匠的怀表', 'The Watchmaker'),
  story: L(
    '火车开始准点发车，人人都想要一块怀表。钢厂炼钢、齿轮厂车齿轮，铜件厂打出表壳，最后一起送进钟表坊组装。',
    'Trains now run on schedule and everyone wants a pocket watch. The steelworks makes steel, the gear works cuts gears, the brass works shapes the case, and the watchmaker puts it all together.',
  ),
  product: {name: {zh: '怀表', en: 'Pocket Watch'}, icon: 'watch', goal: 'R7'},
  map: `
    U . . . F . . .
    U . . . . . . .
    . . . . . . F .
    . I I . . . . .
    . . . . . . A .
    . . A . . . B .
    C . . . . . . .
    . C . . . . B .`,
  regions: [
    { id: 'R1', facility: 'gather', owner: {name: {zh: '铁矿场', en: 'Iron Mine'}, color: '#78909c', icon: 'miner', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 2}}] },
    { id: 'R2', facility: 'gather', owner: {name: {zh: '煤矿场', en: 'Coal Mine'}, color: '#5d5d5d', icon: 'collier', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'coal', value: 2}}, {type: 'MUST_NOT_TOUCH_REGION', params: {region: 'R1'}}] },
    { id: 'R3', facility: 'factory', owner: {name: {zh: '钢厂', en: 'Steelworks'}, color: '#8d6e63', icon: 'factory', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'SUPPLIED_BY', params: {region: 'R1', tag: 'iron', value: 2}}, {type: 'SUPPLIED_BY', params: {region: 'R2', tag: 'coal', value: 2}}, {type: 'NO_TAG_WITHIN', params: {tag: 'building', dist: 1}}] },
    { id: 'R4', facility: 'factory', owner: {name: {zh: '齿轮厂', en: 'Gear Works'}, color: '#607d8b', icon: 'gearwright', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 15}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 2}}, {type: 'SUPPLIED_BY', params: {region: 'R3'}}] },
    { id: 'R5', facility: 'gather', owner: {name: {zh: '铜矿场', en: 'Copper Mine'}, color: '#d4834f', icon: 'miner', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'copper', value: 2}}, {type: 'EXCLUSIVE_TO', params: {region: 'R6'}}] },
    { id: 'R6', facility: 'factory', owner: {name: {zh: '铜件厂', en: 'Brass Works'}, color: '#ffb74d', icon: 'brazier', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 12}}, {type: 'SUPPLIED_BY', params: {region: 'R5', tag: 'copper', value: 2}}] },
    { id: 'R7', facility: 'factory', owner: {name: {zh: '钟表坊', en: 'Watchmaker'}, color: '#5c6bc0', icon: 'clockmaker', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'SUPPLIED_BY', params: {region: 'R4'}}, {type: 'SUPPLIED_BY', params: {region: 'R6'}}] },
  ],
  globalConstraints: [{type: 'AREA_LARGER_THAN', params: {a: 'R6', b: 'R1'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R2', b: 'R5'}}, {type: 'AREA_LARGER_THAN', params: {a: 'R5', b: 'R3'}}],
});

level({
  file: '4-6.json', id: '4-6', difficulty: 11, theme: 'umbrella',
  name: L('雨季的雨伞', 'Umbrellas for the Rains'),
  story: L(
    '海岛的雨季又到了。织布厂织伞面，伞骨厂做钢骨，木工坊削伞柄，三路零件一起汇进制伞坊。',
    'The rainy season returns to the islands. The weaving mill makes the canopy, the rib works forges steel ribs, the carpentry carves handles, and all three lines meet at the umbrella maker.',
  ),
  product: {name: {zh: '雨伞', en: 'Umbrella'}, icon: 'umbrella', goal: 'R9'},
  map: `
    . . . . . . . . .
    . . . . . . F . .
    . . . . . . B . .
    T . . . . . . . .
    . . . B . . F . .
    . . . . . . F F .
    . T . . . . C . C
    . . . . . . A I .
    . . . A . . . . I`,
  regions: [
    { id: 'R1', facility: 'gather', owner: {name: {zh: '棉田', en: 'Cotton Field'}, color: '#9ccc65', icon: 'farmer', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 21}}, {type: 'MUST_NOT_TOUCH_REGION', params: {region: 'R10'}}] },
    { id: 'R2', facility: 'factory', owner: {name: {zh: '织布厂', en: 'Weaving Mill'}, color: '#ec407a', icon: 'weaver', avatar: null}, constraints: [{type: 'SUPPLIED_BY', params: {region: 'R1', tag: 'cotton', value: 2}}] },
    { id: 'R3', facility: 'gather', owner: {name: {zh: '铁矿场', en: 'Iron Mine'}, color: '#78909c', icon: 'miner', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 2}}] },
    { id: 'R4', facility: 'gather', owner: {name: {zh: '煤矿场', en: 'Coal Mine'}, color: '#5d5d5d', icon: 'collier', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'coal', value: 2}}] },
    { id: 'R5', facility: 'factory', owner: {name: {zh: '钢厂', en: 'Steelworks'}, color: '#8d6e63', icon: 'factory', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'SUPPLIED_BY', params: {region: 'R3', tag: 'iron', value: 2}}, {type: 'SUPPLIED_BY', params: {region: 'R4', tag: 'coal', value: 2}}, {type: 'NO_TAG_WITHIN', params: {tag: 'building', dist: 1}}] },
    { id: 'R6', facility: 'factory', owner: {name: {zh: '伞骨厂', en: 'Rib Works'}, color: '#607d8b', icon: 'toolmaker', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 21}}, {type: 'SUPPLIED_BY', params: {region: 'R5'}}] },
    { id: 'R7', facility: 'gather', owner: {name: {zh: '伐木场', en: 'Lumber Camp'}, color: '#2e7d32', icon: 'forester', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 3}}] },
    { id: 'R8', facility: 'factory', owner: {name: {zh: '木工坊', en: 'Carpentry'}, color: '#a1887f', icon: 'carpenter', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}, {type: 'SUPPLIED_BY', params: {region: 'R7', tag: 'forest', value: 3}}] },
    { id: 'R9', facility: 'factory', owner: {name: {zh: '制伞坊', en: 'Umbrella Maker'}, color: '#42a5f5', icon: 'umbrella', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 14}}, {type: 'SUPPLIED_BY', params: {region: 'R2'}}, {type: 'SUPPLIED_BY', params: {region: 'R6'}}, {type: 'SUPPLIED_BY', params: {region: 'R8'}}] },
    { id: 'R10', owner: {name: {zh: '居民区', en: 'Homes'}, color: '#ef5350', icon: 'house', avatar: null}, constraints: [{type: 'MUST_NOT_TOUCH_REGION', params: {region: 'R8'}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R2', b: 'R5'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R7', b: 'R8'}}],
});

level({
  file: '4-7.json', id: '4-7', difficulty: 12, theme: 'coat',
  name: L('尾声：大衣', 'Epilogue: The Overcoat'),
  story: L(
    '冬天来了。机器织的布、机器纺的毛线，再加上钢厂打出的钢针，一起送进裁缝铺。镇上的人第一次穿上了机器做的大衣。',
    'Winter arrives. Machine-woven cloth, machine-spun yarn and steel needles from the works all reach the tailor, and for the first time the townsfolk wear coats made by machines.',
  ),
  product: {name: {zh: '大衣', en: 'Overcoat'}, icon: 'coat', goal: 'R9'},
  map: `
    A . . . . . . . C .
    . . F . . T . . . .
    . . . . . T C . . .
    F B . . . T . . . C
    . A . . . . . . . .
    . . . . . . . . . .
    P . P . . . . . . .
    . . . . . . . I I I
    . . . B . . . . B .
    . . . . . . . . . .`,
  regions: [
    { id: 'R1', facility: 'gather', owner: {name: {zh: '棉田', en: 'Cotton Field'}, color: '#9ccc65', icon: 'farmer', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 4}}, {type: 'TAG_COUNT_EQ', params: {tag: 'cotton', value: 3}}] },
    { id: 'R2', facility: 'factory', owner: {name: {zh: '织布厂', en: 'Weaving Mill'}, color: '#ec407a', icon: 'weaver', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 12}}, {type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'SUPPLIED_BY', params: {region: 'R1', tag: 'cotton', value: 3}}, {type: 'NO_TAG_WITHIN', params: {tag: 'coal', dist: 1}}] },
    { id: 'R3', facility: 'gather', owner: {name: {zh: '牧场', en: 'Pasture'}, color: '#a1887f', icon: 'rancher', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'pasture', value: 2}}] },
    { id: 'R4', facility: 'factory', owner: {name: {zh: '纺纱厂', en: 'Spinning Mill'}, color: '#ab47bc', icon: 'spinner', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 20}}, {type: 'SUPPLIED_BY', params: {region: 'R3', tag: 'pasture', value: 2}}] },
    { id: 'R5', facility: 'gather', owner: {name: {zh: '铁矿场', en: 'Iron Mine'}, color: '#78909c', icon: 'miner', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'iron', value: 3}}] },
    { id: 'R6', facility: 'gather', owner: {name: {zh: '煤矿场', en: 'Coal Mine'}, color: '#5d5d5d', icon: 'collier', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 24}}, {type: 'TAG_COUNT_EQ', params: {tag: 'coal', value: 3}}] },
    { id: 'R7', facility: 'factory', owner: {name: {zh: '钢厂', en: 'Steelworks'}, color: '#8d6e63', icon: 'factory', avatar: null}, constraints: [{type: 'SUPPLIED_BY', params: {region: 'R5', tag: 'iron', value: 3}}, {type: 'SUPPLIED_BY', params: {region: 'R6', tag: 'coal', value: 3}}, {type: 'NO_TAG_WITHIN', params: {tag: 'building', dist: 1}}] },
    { id: 'R8', facility: 'factory', owner: {name: {zh: '制针厂', en: 'Needle Works'}, color: '#607d8b', icon: 'toolmaker', avatar: null}, constraints: [{type: 'SUPPLIED_BY', params: {region: 'R7'}}] },
    { id: 'R9', facility: 'factory', owner: {name: {zh: '裁缝铺', en: 'Tailor'}, color: '#8e24aa', icon: 'tailor', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 2}}, {type: 'SUPPLIED_BY', params: {region: 'R2'}}, {type: 'SUPPLIED_BY', params: {region: 'R4'}}, {type: 'SUPPLIED_BY', params: {region: 'R8'}}] },
    { id: 'R10', owner: {name: {zh: '居民区', en: 'Homes'}, color: '#ef5350', icon: 'house', avatar: null}, constraints: [{type: 'TAG_COUNT_EQ', params: {tag: 'farmland', value: 1}}, {type: 'TAG_COUNT_EQ', params: {tag: 'forest', value: 1}}] },
    { id: 'R11', owner: {name: {zh: '客栈', en: 'Inn'}, color: '#7e57c2', icon: 'crown', avatar: null}, constraints: [{type: 'AREA_EQ', params: {value: 16}}, {type: 'TAG_COUNT_EQ', params: {tag: 'building', value: 1}}] },
  ],
  globalConstraints: [{type: 'AREA_EQUAL_TO', params: {a: 'R5', b: 'R8'}}, {type: 'AREA_EQUAL_TO', params: {a: 'R10', b: 'R7'}}],
});
