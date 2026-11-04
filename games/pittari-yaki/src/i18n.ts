export const LOCALES = ['ja', 'zh', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

// Shared with gratin-game.com and its other games through a parent-domain cookie; keep in sync with the portal's src/i18n.ts.
const SHARED_KEY = 'gratin:lang';
const LEGACY_KEY = 'gratin-game:locale';
const COOKIE = 'gratin_lang';
const COOKIE_DOMAIN = 'gratin-game.com';

export const LOCALE_LABELS: Record<Locale, string> = { ja: '日本語', zh: '中文', en: 'EN' };

function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

function detectLocale(languages: readonly string[]): Locale {
  const bases = languages.map(lang => lang.toLowerCase().split('-')[0]);
  if (bases.includes('ja')) return 'ja';
  return bases.find(isLocale) ?? 'ja';
}

function readCookie(): string | null {
  try {
    return document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`))?.[1] ?? null;
  } catch {
    return null;
  }
}

function writeCookie(value: string): void {
  const host = location.hostname;
  const domain = host === COOKIE_DOMAIN || host.endsWith(`.${COOKIE_DOMAIN}`) ? `; domain=${COOKIE_DOMAIN}` : '';
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${COOKIE}=${value}; path=/; max-age=31536000; samesite=lax${domain}${secure}`;
}

function chosen(): string | null {
  const cookie = readCookie();
  if (cookie) return cookie;
  try {
    return localStorage.getItem(SHARED_KEY) ?? localStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
}

function loadLocale(): Locale {
  const saved = new URLSearchParams(location.search).get('lang') ?? chosen();
  if (saved) return isLocale(saved) ? saved : 'ja';
  return detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

const ja = {
  title: 'ぴったり焼き',
  tagline: '3つの皿で、ぴったり12に焼き上げろ',
  'seat.human': 'ひと',
  'seat.ai': 'AI',
  'seat.off': 'なし',
  'seat.name': '名前',
  'name.human': 'プレイヤー{n}',
  'name.ai.1': 'シェフ',
  'name.ai.2': 'コック',
  'name.ai.3': 'パティシエ',
  'name.ai.4': 'ソムリエ',
  start: 'スタート',
  rules: 'あそびかた',
  close: '閉じる',
  quit: 'やめる',
  'sound.music': '音楽',
  'sound.sfx': '効果音',
  'quit.confirm': 'このゲームをやめますか？',
  'quit.cancel': 'つづける',
  'rule.1': '自分の番に山札を1枚めくり、3つの皿のどれかに入れる。',
  'rule.2': '皿の合計がぴったり12で完成！ 皿のカード枚数がそのまま得点。',
  'rule.3': '12を超えたら焦げて、その皿は空っぽに。',
  'rule.4': '先に20点とった人の勝ち。山札がなくなったら捨て札を混ぜて戻す。',
  'card.fire': '大火',
  'card.fire.desc': 'だれかの皿に +3（自分の皿も可）',
  'card.cool': '冷却',
  'card.cool.desc': '自分の皿を −3',
  'card.extra': '追加注文',
  'card.extra.desc': 'えらんだ人がすぐ2枚めくる',
  'card.cheese': 'チーズ',
  'card.cheese.desc': '皿にのせると得点 ×2。焦げたらなくなる',
  'card.pittari': 'ぴったり!',
  turn: '{name} のばん',
  'turn.extra': '{name} の追加注文（あと {n} 枚）',
  'prompt.draw': '山札をタップしてめくる',
  'prompt.ai': '考え中…',
  'prompt.fire': '大火！ どの皿に +3？',
  'prompt.fire.sub': '上の皿をタップすると相手の皿へ',
  'prompt.cool': '冷却！ どの皿を −3？',
  'prompt.cheese': 'チーズ！ どの皿にのせる？',
  'prompt.extra': '追加注文！ だれに2枚めくらせる？',
  'hint.burn': 'こげる',
  'hint.empty': 'からっぽ',
  cards: '{n}枚',
  deck: 'のこり {n}',
  me: 'じぶん',
  'toast.serve': 'ぴったり! +{n}',
  'toast.burn': 'こげた…',
  'toast.reshuffle': '捨て札を混ぜて山札に戻した',
  'toast.nocheese': 'チーズをのせる皿がない',
  'toast.fire': '{by} → {name} に大火',
  'stamp.extra': '追加注文！ {name} があと2枚',
  'result.win': '{name} の勝ち！',
  'result.solo': '{n} ターンで20点！',
  'result.best': '新記録！',
  'result.prev': 'ベスト {n} ターン',
  'result.pts': '{n} 点',
  again: 'もう一回',
  menu: 'メニューへ',
};

export type Key = keyof typeof ja;

const zh: Record<Key, string> = {
  title: '刚好烤',
  tagline: '用三个烤盘，刚好烤到 12',
  'seat.human': '玩家',
  'seat.ai': 'AI',
  'seat.off': '空',
  'seat.name': '名字',
  'name.human': '玩家{n}',
  'name.ai.1': '主厨',
  'name.ai.2': '大厨',
  'name.ai.3': '甜点师',
  'name.ai.4': '侍酒师',
  start: '开始',
  rules: '玩法',
  close: '关闭',
  quit: '退出',
  'sound.music': '音乐',
  'sound.sfx': '音效',
  'quit.confirm': '要退出这局游戏吗？',
  'quit.cancel': '继续玩',
  'rule.1': '轮到你时翻开 1 张牌，放进自己 3 个烤盘中的一个。',
  'rule.2': '盘子总和刚好 12 就出菜！盘里有几张牌就得几分。',
  'rule.3': '超过 12 就烤焦，整盘清空。',
  'rule.4': '先到 20 分的人获胜。牌堆用完就把弃牌洗回去。',
  'card.fire': '大火',
  'card.fire.desc': '任何人的一个盘 +3（也可以选自己的）',
  'card.cool': '冷却',
  'card.cool.desc': '自己的一个盘 −3',
  'card.extra': '加单',
  'card.extra.desc': '指定一个人马上再翻 2 张',
  'card.cheese': '芝士',
  'card.cheese.desc': '放进盘里，出菜时得分 ×2；烤焦就没了',
  'card.pittari': '刚好!',
  turn: '轮到 {name}',
  'turn.extra': '{name} 的加单（还剩 {n} 张）',
  'prompt.draw': '点牌堆翻牌',
  'prompt.ai': '思考中…',
  'prompt.fire': '大火！给哪个盘 +3？',
  'prompt.fire.sub': '点上方的小盘可以烧别人',
  'prompt.cool': '冷却！哪个盘 −3？',
  'prompt.cheese': '芝士！放进哪个盘？',
  'prompt.extra': '加单！让谁再翻 2 张？',
  'hint.burn': '会焦',
  'hint.empty': '空盘',
  cards: '{n} 张',
  deck: '剩 {n}',
  me: '自己',
  'toast.serve': '刚好! +{n}',
  'toast.burn': '烤焦了…',
  'toast.reshuffle': '弃牌洗回了牌堆',
  'toast.nocheese': '没有能放芝士的盘',
  'toast.fire': '{by} → 给 {name} 加大火',
  'stamp.extra': '加单！{name} 再翻 2 张',
  'result.win': '{name} 获胜！',
  'result.solo': '{n} 回合拿到 20 分！',
  'result.best': '新纪录！',
  'result.prev': '最佳 {n} 回合',
  'result.pts': '{n} 分',
  again: '再来一局',
  menu: '回到菜单',
};

const en: Record<Key, string> = {
  title: 'Just Baked',
  tagline: 'Three dishes. Bake each one to exactly 12.',
  'seat.human': 'Human',
  'seat.ai': 'AI',
  'seat.off': 'Off',
  'seat.name': 'Name',
  'name.human': 'Player {n}',
  'name.ai.1': 'Chef',
  'name.ai.2': 'Cook',
  'name.ai.3': 'Baker',
  'name.ai.4': 'Sommelier',
  start: 'Start',
  rules: 'How to play',
  close: 'Close',
  quit: 'Quit',
  'sound.music': 'Music',
  'sound.sfx': 'Sound effects',
  'quit.confirm': 'Quit this game?',
  'quit.cancel': 'Keep playing',
  'rule.1': 'On your turn, flip 1 card and put it in one of your 3 dishes.',
  'rule.2': 'A dish that adds up to exactly 12 is served: 1 point per card in it.',
  'rule.3': 'Go over 12 and it burns. The dish is emptied.',
  'rule.4': 'First to 20 points wins. When the deck runs out, the discards are shuffled back in.',
  'card.fire': 'High heat',
  'card.fire.desc': '+3 to anyone’s dish, yours included',
  'card.cool': 'Cool down',
  'card.cool.desc': '−3 to one of your dishes',
  'card.extra': 'Extra order',
  'card.extra.desc': 'Pick someone to flip 2 more cards now',
  'card.cheese': 'Cheese',
  'card.cheese.desc': 'Doubles the dish when served; lost if it burns',
  'card.pittari': 'just right!',
  turn: '{name}’s turn',
  'turn.extra': 'Extra order for {name} ({n} left)',
  'prompt.draw': 'Tap the deck to flip',
  'prompt.ai': 'Thinking…',
  'prompt.fire': 'High heat! +3 to which dish?',
  'prompt.fire.sub': 'Tap a small dish above to hit a rival',
  'prompt.cool': 'Cool down! −3 to which dish?',
  'prompt.cheese': 'Cheese! Which dish?',
  'prompt.extra': 'Extra order! Who flips 2 more?',
  'hint.burn': 'burns',
  'hint.empty': 'empty',
  cards: '{n} cards',
  deck: '{n} left',
  me: 'you',
  'toast.serve': 'Just right! +{n}',
  'toast.burn': 'Burnt…',
  'toast.reshuffle': 'Discards shuffled back into the deck',
  'toast.nocheese': 'No dish can take the cheese',
  'toast.fire': '{by} → high heat on {name}',
  'stamp.extra': 'Extra order! {name} flips 2 more',
  'result.win': '{name} wins!',
  'result.solo': '20 points in {n} turns!',
  'result.best': 'New record!',
  'result.prev': 'Best: {n} turns',
  'result.pts': '{n} pts',
  again: 'Play again',
  menu: 'Menu',
};

const DICT: Record<Locale, Record<Key, string>> = { ja, zh, en };

export let locale: Locale = loadLocale();

export function t(key: Key, vars: Record<string, string | number> = {}): string {
  return DICT[locale][key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export function setLocale(next: Locale) {
  locale = next;
  writeCookie(next);
  try {
    localStorage.setItem(SHARED_KEY, next);
  } catch {}
  applyDocument();
}

export function applyDocument() {
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;
  document.title = `${t('title')} | グラタンゲーム`;
}
