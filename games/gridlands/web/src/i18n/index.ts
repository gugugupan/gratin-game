// 轻量 i18n（无第三方依赖）。新增语言只需在各表里补一列。
export type Locale = 'zh' | 'en';
export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
];
export const DEFAULT_LOCALE: Locale = 'zh';

type Dict = Record<string, string>;

const MESSAGES: Record<Locale, Dict> = {
  zh: {
    appTitle: '阡陌',
    undo: '撤销', reset: '重置', clear: '清空',
    prevLevel: '上一关', nextLevel: '下一关',
    language: '语言',
    hint: '选区域 → 拖拽圈选矩形',
    rules: '玩法：点选一个区域，在地图上拖拽圈出一个矩形把格子划给它。每个区域必须是一个矩形；满足全部条件即通关。',
    win: '🎉 通关！全部条件满足',
    tagline: '按规则划分土地的逻辑推理游戏',
    start: '开始游戏',
    backToLevels: '关卡列表',
    howToTitle: '怎么玩',
    step1: '阅读每个区域的条件（面积、必须包含、不能接触…）',
    step2: '点选区域，在地图上拖拽圈出一个矩形',
    step3: '每个区域是一个矩形；满足全部条件即通关',
    legendTitle: '地形与角色',
    levelsTitle: '选择关卡',
    locked: '未解锁',
    cleared: '已通关',
    lockedHint: '通关上一关后解锁',
    cells: '{n} 格',
    globalConditions: '全局条件',
    story: '关卡背景',
    chapter_1: '第一章 · 初来乍到', chapter_2: '第二章 · 开发商来了', chapter_3: '第三章 · 海岛拓荒', chapter_4: '第四章 · 蒸汽时代',
    // 条件描述
    AREA_EQ: '面积 = {value}', AREA_GE: '面积 ≥ {value}', AREA_LE: '面积 ≤ {value}',
    AREA_MAX: '面积最大', AREA_MIN: '面积最小',
    MUST_CONTAIN_CELL: '必须包含格子 #{cellId}', MUST_NOT_CONTAIN_CELL: '不能包含格子 #{cellId}',
    MUST_CONTAIN_TAG: '必须包含「{tag}」', MUST_NOT_CONTAIN_TAG: '不能包含「{tag}」',
    TAG_COUNT_EQ: '包含 {value} 个「{tag}」', TAG_COUNT_GE: '至少包含 {value} 个「{tag}」', TAG_COUNT_LE: '最多包含 {value} 个「{tag}」',
    MUST_TOUCH_TAG: '必须接触「{tag}」', MUST_NOT_TOUCH_TAG: '不能接触「{tag}」',
    MUST_TOUCH_REGION: '必须与 {region} 相邻', MUST_NOT_TOUCH_REGION: '不能与 {region} 相邻',
    MUST_ON_EDGE: '必须位于地图边缘', MUST_NOT_ON_CORNER: '不能位于角落',
    AREA_LARGER_THAN: '{a} 比 {b} 大', AREA_EQUAL_TO: '{a} 与 {b} 面积相同',
    DIRECTION_OF: '{a} 在 {b} 的{dir}侧',
    ONLY_ONE_CONTAINS: '唯一拥有「{tag}」的区域', ONLY_ONE_TOUCHES: '唯一接触「{tag}」的区域',
    SUPPLIED_BY: '由 {region} 供应 {value} 份「{tag}」', SUPPLIED_BY_ANY: '由 {region} 供料',
    EXCLUSIVE_TO: '只供应 {region}', NO_TAG_WITHIN: '{dist} 格内不能有「{tag}」',
    recipe: '配方', product: '成品',
    legendToggle: '图例说明',
    legendFacility: '设施：采集设施把地里的资源挖出来，制造设施把原料加工成新东西。点一下就能选中它。',
    legendLinked: '已接通：两家设施的地挨在一起，供料数量也对了，物资可以沿这条线送过去。',
    legendUnlinked: '还没接通：两家还没挨在一起，或者供料设施里的资源数量不对。',
    legendAmount: '供料数量：供料设施里必须正好有这么多格该资源。',
    legendProduct: '成品：所有流水线都接通、全部条件满足后亮起。',
    legendPollution: '污染范围：选中会污染的工厂时，棋盘上画斜线的格子是它不能伸进去的地方。',
    legendExample: '例：{from} → {to} 线上标着「{tag} {value}」，意思是 {from} 要挨着 {to}，而且 {from} 里正好有 {value} 块{tag}。',
    dir_north: '北', dir_south: '南', dir_east: '东', dir_west: '西',
  },
  en: {
    appTitle: 'Gridlands',
    undo: 'Undo', reset: 'Reset', clear: 'Clear',
    prevLevel: 'Prev', nextLevel: 'Next',
    language: 'Language',
    hint: 'Pick a region → drag to select a rectangle',
    rules: 'How to play: tap a region, then drag a rectangle on the map to assign cells to it. Each region must be a single rectangle — meet every condition to win.',
    win: '🎉 Solved! All conditions met',
    tagline: 'A logic puzzle of dividing land by the rules',
    start: 'Start',
    backToLevels: 'Levels',
    howToTitle: 'How to play',
    step1: "Read each region's conditions (area, must contain, must not touch…)",
    step2: 'Pick a region, then drag a rectangle on the map',
    step3: 'Each region is one rectangle — meet every condition to win',
    legendTitle: 'Terrain & roles',
    levelsTitle: 'Choose a level',
    locked: 'Locked',
    cleared: 'Cleared',
    lockedHint: 'Clear the previous level to unlock',
    cells: '{n} cells',
    globalConditions: 'Global conditions',
    story: 'Story',
    chapter_1: 'Chapter 1 · First Plots', chapter_2: 'Chapter 2 · The Developer Arrives', chapter_3: 'Chapter 3 · New Shores', chapter_4: 'Chapter 4 · The Age of Steam',
    AREA_EQ: 'Area = {value}', AREA_GE: 'Area ≥ {value}', AREA_LE: 'Area ≤ {value}',
    AREA_MAX: 'Largest area', AREA_MIN: 'Smallest area',
    MUST_CONTAIN_CELL: 'Must contain cell #{cellId}', MUST_NOT_CONTAIN_CELL: 'Must not contain cell #{cellId}',
    MUST_CONTAIN_TAG: 'Must contain {tag}', MUST_NOT_CONTAIN_TAG: 'Must not contain {tag}',
    TAG_COUNT_EQ: 'Contains exactly {value} {tag}', TAG_COUNT_GE: 'Contains at least {value} {tag}', TAG_COUNT_LE: 'Contains at most {value} {tag}',
    MUST_TOUCH_TAG: 'Must touch {tag}', MUST_NOT_TOUCH_TAG: 'Must not touch {tag}',
    MUST_TOUCH_REGION: 'Must be adjacent to {region}', MUST_NOT_TOUCH_REGION: 'Must not be adjacent to {region}',
    MUST_ON_EDGE: 'Must be on the map edge', MUST_NOT_ON_CORNER: 'Must not be on a corner',
    AREA_LARGER_THAN: '{a} is larger than {b}', AREA_EQUAL_TO: '{a} equals {b} in area',
    DIRECTION_OF: '{a} is to the {dir} of {b}',
    ONLY_ONE_CONTAINS: 'The only region containing {tag}', ONLY_ONE_TOUCHES: 'The only region touching {tag}',
    SUPPLIED_BY: 'Supplied {value} {tag} by {region}', SUPPLIED_BY_ANY: 'Supplied by {region}',
    EXCLUSIVE_TO: 'Supplies only {region}', NO_TAG_WITHIN: 'No {tag} within {dist} cells',
    recipe: 'Recipe', product: 'Product',
    legendToggle: 'What the symbols mean',
    legendFacility: 'Facilities: gatherers dig resources out of the land; factories turn materials into something new. Tap one to select it.',
    legendLinked: 'Linked: the two plots touch and the supplied amount is right, so goods can travel along this line.',
    legendUnlinked: 'Not linked yet: the plots don’t touch, or the supplier holds the wrong amount of the resource.',
    legendAmount: 'Amount: the supplier must hold exactly this many cells of that resource.',
    legendProduct: 'Product: lights up once every line is linked and all conditions are met.',
    legendPollution: 'Pollution: when a polluting factory is selected, hatched cells show where it may not reach.',
    legendExample: 'Example: the {from} → {to} line says “{tag} {value}”, so {from} must touch {to} and contain exactly {value} {tag}.',
    dir_north: 'north', dir_south: 'south', dir_east: 'east', dir_west: 'west',
  },
};

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let s = MESSAGES[locale]?.[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

// 地形/资源：name 用于条件描述，label 用于格子内短标
type TagMeta = { name: Record<Locale, string>; label: Record<Locale, string> };
export const TAGS: Record<string, TagMeta> = {
  plain: { name: { zh: '平原', en: 'Plain' }, label: { zh: '', en: '' } },
  forest: { name: { zh: '森林', en: 'Forest' }, label: { zh: '林', en: 'F' } },
  lake: { name: { zh: '湖泊', en: 'Lake' }, label: { zh: '湖', en: 'L' } },
  mountain: { name: { zh: '山脉', en: 'Mountain' }, label: { zh: '山', en: 'M' } },
  gold: { name: { zh: '金矿', en: 'Gold' }, label: { zh: '金', en: 'Au' } },
  iron: { name: { zh: '铁矿', en: 'Iron' }, label: { zh: '铁', en: 'Fe' } },
  farmland: { name: { zh: '耕地', en: 'Farmland' }, label: { zh: '田', en: 'Fm' } },
  building: { name: { zh: '建筑', en: 'Building' }, label: { zh: '城', en: 'Bd' } },
  coal: { name: { zh: '煤矿', en: 'Coal' }, label: { zh: '煤', en: 'C' } },
  copper: { name: { zh: '铜矿', en: 'Copper' }, label: { zh: '铜', en: 'Cu' } },
  cotton: { name: { zh: '棉花', en: 'Cotton' }, label: { zh: '棉', en: 'Ct' } },
  pasture: { name: { zh: '牧草', en: 'Pasture' }, label: { zh: '草', en: 'P' } },
};
export const tagName = (tag: string, locale: Locale) => TAGS[tag]?.name[locale] ?? tag;
export const tagLabel = (tag: string, locale: Locale) => TAGS[tag]?.label[locale] ?? '';

// 关卡数据里的可本地化字段：字符串（旧）或 {zh,en}（新）皆可
export type LocalizedString = string | Partial<Record<Locale, string>>;
export function localized(v: LocalizedString | undefined, locale: Locale): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v[locale] ?? v[DEFAULT_LOCALE] ?? Object.values(v)[0] ?? '';
}
