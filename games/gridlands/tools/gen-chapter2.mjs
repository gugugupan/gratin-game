// 生成第 2 章关卡 JSON 到 levels/（solution 由求解器算出）。用法：node tools/gen-chapter2.mjs
import { C, L, level as write } from './level-kit.mjs';

const level = (spec) => write({ createdAt: '2026-10-03', ...spec });

level({
  file: '2-1.json', id: '2-1', chapter: 2, difficulty: 7, theme: 'river',
  name: L('雨季前的河岸', 'Before the Rains'),
  story: L(
    '开发商要派人来测绘的消息传遍了河湾。雨季也快到了，村长决定赶在测绘队和第一场大雨之前，先把河湾分给四户人家。',
    'Word spreads along the river that a developer is sending surveyors. With the rains also on the way, the village head decides to split the river bend among four households before either arrives.',
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
    '开发商盯上了山里新挖出的两处金矿。镇长连夜召集大家，抢在开发商之前发下地契，并定下一条规矩：矿场不能挨着民房。',
    'The developer has its eye on two newly struck gold veins. The mayor calls everyone in overnight to hand out the deeds before the developer can, with one rule: no mine may border a house.',
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

level({
  file: '2-3.json', id: '2-3', chapter: 2, difficulty: 8, theme: 'contract',
  name: L('开发商的平分提议', 'The Even-Split Offer'),
  story: L(
    '开发商第一次正式出价：他、居民和农场主三家面积一样大。可合同里写得清清楚楚，每家能拿几块资源，一块都不能多。',
    'The developer makes its first formal offer: it, the residents and the farmer get plots of equal size. But the contract is precise about how many resources each may take, and not one more.',
  ),
  blocked: 'L',
  map: `
    . . . G F B
    I B A . F .
    G G . F . .
    . A . I . L
    F . . A . L
    . . . . . L`,
  regions: [
    { id: 'R1', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'building', value: 1 }), C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
    { id: 'R2', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
    { id: 'R3', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'forest', value: 1 })] },
    { id: 'R4', owner: { name: L('农场主', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'iron', value: 1 }), C('TAG_COUNT_EQ', { tag: 'farmland', value: 1 })] },
  ],
  globalConstraints: [
    C('AREA_EQUAL_TO', { a: 'R1', b: 'R2' }),
    C('AREA_EQUAL_TO', { a: 'R2', b: 'R4' }),
  ],
});

level({
  file: '2-4.json', id: '2-4', chapter: 2, difficulty: 8, theme: 'wishlist',
  name: L('开发商的清单', 'The Developer’s List'),
  story: L(
    '开发商列了一张清单：一处金矿、两片森林、两块耕地，一样都不能少。其他人只能在剩下的地里讨价还价。',
    'The developer hands over a list: one gold vein, two forests, two fields, nothing less. Everyone else has to bargain over what is left.',
  ),
  blocked: 'M',
  map: `
    . G B . G F .
    . . . A . I F
    . A . . . . .
    . . M B . . A
    . . M . A F .
    . . M G . F I`,
  regions: [
    { id: 'R1', owner: { name: L('牧羊人', 'Shepherd'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [
      C('MUST_NOT_TOUCH_TAG', { tag: 'mountain' })] },
    { id: 'R2', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
    { id: 'R3', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
    { id: 'R4', owner: { name: L('农夫', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [
      C('MUST_NOT_TOUCH_REGION', { region: 'R2' })] },
    { id: 'R5', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'gold', value: 1 }), C('TAG_COUNT_EQ', { tag: 'forest', value: 2 }), C('TAG_COUNT_EQ', { tag: 'farmland', value: 2 })] },
  ],
  globalConstraints: [
    C('AREA_EQUAL_TO', { a: 'R1', b: 'R3' }),
  ],
});

level({
  file: '2-5.json', id: '2-5', chapter: 2, difficulty: 9, theme: 'debate',
  name: L('谁也不肯让', 'Nobody Backs Down'),
  story: L(
    '谈判桌上谁也不让谁：开发商要比矿业公司大，矿业公司要比伐木工大，伐木工又要比牧羊人大。',
    'At the negotiating table nobody gives an inch: the developer must out-size the miners, the miners the woodcutter, and the woodcutter the shepherd.',
  ),
  blocked: 'L',
  map: `
    . . . . . . .
    . I . . F . .
    F G . A I . .
    . G F A G . .
    . . A A F B .
    . I L L B . .
    . B L L . G F`,
  regions: [
    { id: 'R1', owner: { name: L('牧羊人', 'Shepherd'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [
      C('MUST_TOUCH_TAG', { tag: 'forest' })] },
    { id: 'R2', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'forest', value: 1 })] },
    { id: 'R3', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'iron', value: 2 })] },
    { id: 'R4', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'farmland', value: 4 })] },
    { id: 'R5', owner: { name: L('镇长', 'Mayor'), color: '#7e57c2', icon: 'crown', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
  ],
  globalConstraints: [
    C('AREA_LARGER_THAN', { a: 'R2', b: 'R1' }),
    C('AREA_LARGER_THAN', { a: 'R3', b: 'R2' }),
    C('AREA_LARGER_THAN', { a: 'R4', b: 'R3' }),
  ],
});

level({
  file: '2-6.json', id: '2-6', chapter: 2, difficulty: 10, theme: 'blueprint',
  name: L('最后的规划图', 'The Final Plan'),
  story: L(
    '开发商和镇长都想要两处金矿。规划图今天必须定稿，每一块地都要有个说法。',
    'The developer and the mayor both want two gold veins. The plan must be signed today, and every plot needs an owner.',
  ),
  blocked: 'M',
  map: `
    . A . . . M F .
    A F . B G M I .
    . . . G . . . F
    . . . B G A . .
    . . . F I F . I
    . . . . . B . .
    F . A . G . . A`,
  regions: [
    { id: 'R1', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'gold', value: 2 })] },
    { id: 'R2', owner: { name: L('镇长', 'Mayor'), color: '#7e57c2', icon: 'crown', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'forest', value: 2 }), C('TAG_COUNT_EQ', { tag: 'gold', value: 2 })] },
    { id: 'R3', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'forest', value: 1 }), C('TAG_COUNT_EQ', { tag: 'building', value: 1 })] },
    { id: 'R4', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'forest', value: 1 }), C('MUST_NOT_TOUCH_REGION', { region: 'R6' })] },
    { id: 'R5', owner: { name: L('矿业公司', 'Mining Co.'), color: '#ffb300', icon: 'miner', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
    { id: 'R6', owner: { name: L('铁匠', 'Blacksmith'), color: '#546e7a', icon: 'blacksmith', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
  ],
  globalConstraints: [
    C('AREA_LARGER_THAN', { a: 'R3', b: 'R5' }),
    C('AREA_LARGER_THAN', { a: 'R6', b: 'R3' }),
    C('AREA_LARGER_THAN', { a: 'R5', b: 'R4' }),
  ],
});

level({
  file: '2-7.json', id: '2-7', chapter: 2, difficulty: 10, theme: 'epilogue',
  name: L('尾声：握手', 'Epilogue: The Handshake'),
  story: L(
    '吵了这么久，开发商终于让步了：不再要最大的地，只要一块和铁匠、伐木工一样大的。大家握了手，签下最后一份协议。',
    'After all the arguing, the developer finally gives ground: no more demands for the biggest plot, just one the same size as the blacksmith’s and the woodcutter’s. Hands are shaken and the last agreement is signed.',
  ),
  blocked: 'L',
  map: `
    . . . A A I B B
    F I F . . . G A
    . . . . . B . F
    . . . . . . G G
    . . . . . . I .
    G . . F I . . A
    F . A . . . . G
    . B F . L L L L`,
  regions: [
    { id: 'R1', owner: { name: L('铁匠', 'Blacksmith'), color: '#546e7a', icon: 'blacksmith', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'iron', value: 1 })] },
    { id: 'R2', owner: { name: L('牧羊人', 'Shepherd'), color: '#a1887f', icon: 'rancher', avatar: null }, constraints: [
      C('MUST_NOT_CONTAIN_TAG', { tag: 'iron' })] },
    { id: 'R3', owner: { name: L('伐木工', 'Woodcutter'), color: '#2e7d32', icon: 'forester', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'forest', value: 3 })] },
    { id: 'R4', owner: { name: L('居民', 'Residents'), color: '#ef5350', icon: 'house', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'farmland', value: 2 }), C('TAG_COUNT_EQ', { tag: 'building', value: 2 })] },
    { id: 'R5', owner: { name: L('开发商', 'Developer'), color: '#8d6e63', icon: 'developer', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'building', value: 1 }), C('TAG_COUNT_EQ', { tag: 'gold', value: 2 })] },
    { id: 'R6', owner: { name: L('农场主', 'Farmer'), color: '#66bb6a', icon: 'farmer', avatar: null }, constraints: [
      C('TAG_COUNT_EQ', { tag: 'farmland', value: 1 })] },
  ],
  globalConstraints: [
    C('AREA_EQUAL_TO', { a: 'R1', b: 'R5' }),
    C('AREA_EQUAL_TO', { a: 'R2', b: 'R4' }),
    C('AREA_EQUAL_TO', { a: 'R3', b: 'R5' }),
  ],
});
