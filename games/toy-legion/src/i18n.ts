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

const zh = {
  title: '玩具军团',
  board: '棋盘',
  loading: '玩具们正在集合…',
  'lobby.start': '开始',
  'lobby.rules': '玩法',
  'lobby.units': '兵种',
  'lobby.settings': '设置',
  'setup.mode': '选择模式',
  'mode.ai': '人机对战',
  'mode.ai.note': '和 AI 对战，你执红方',
  'mode.local': '本地双人',
  'mode.local.note': '一台手机轮流下',
  'setup.diff': 'AI 难度',
  'diff.easy': '简单',
  'diff.normal': '普通',
  'setup.map': '选择地图',
  'setup.back': '返回',
  'setup.go': '开战！',
  'map.goal': '目标 {n} 星',
  'map.castle-field': '城堡草原',
  'map.castle-field.blurb': '路线多、区域大的入门地图。',
  'map.river-banks': '小河两岸',
  'map.river-banks.blurb': '只有两座桥和一个小岛能过河，适合防守。',
  'map.block-town': '积木城镇',
  'map.block-town.blurb': '方格街区，区域小、奖牌多，节奏快。',
  'rules.1.h': '出兵',
  'rules.1': '每回合二选一：抽 2 张牌，或出 1 个兵。兵只能出在连回自己城堡的格子上，路线要经过自己占着的格子。',
  'rules.2.h': '强压弱',
  'rules.2': '力量更大的兵可以盖住敌兵，被盖住的兵变成下面的一层。万能兵能盖住任何兵，也能被任何兵盖住。',
  'rules.3.h': '拿星星',
  'rules.3': '占满一圈格子，就拿走这个区域里的星星。先拿到目标星数的一方获胜。',
  'rules.4.h': '攻城',
  'rules.4': '把兵出到对方城堡上，直接获胜。双方都无法行动时，星星多的一方获胜。',
  'rules.ok': '知道了',
  close: '关闭',
  'settings.lang': '语言',
  'settings.sound': '音效（即将加入）',
  'settings.tips': '新手提示',
  'hud.hand': '手牌 {n}',
  'hud.deck': '牌库 {n}',
  'draw.pre': '抽',
  'draw.post': '张',
  'hand.hidden': '手牌已隐藏',
  'hand.empty': '没有手牌',
  skip: '跳过',
  'side.you': '你',
  'side.ai': 'AI',
  'side.red': '红方',
  'side.blue': '蓝方',
  'first.you': '你先手',
  'first.ai': 'AI 先手',
  'pass.first': '{side}先手。先手起手 3 张牌，后手 4 张。',
  'pass.title': '轮到 {side}',
  'pass.go': '开始',
  'ai.thinking': 'AI 思考中…',
  'pending.remove': '{name}：点选一个相邻的敌兵移除',
  'pending.again': '{name}：再出 1 张兵',
  'troop.noTarget': '{name} 现在没有可以出的格子',
  skipped: '{side}无法行动，跳过回合',
  'sum.handoff': '把手机交给{side}。',
  'sum.draw': '{side}抽了牌。',
  'sum.place': '{side}出了{name}。',
  'sum.troop': '兵',
  'over.draw': '平局',
  'over.win': '{side}获胜',
  'over.youWin': '你赢了！',
  'over.aiWin': 'AI 获胜',
  'over.hq': '攻下了对方的城堡！',
  'over.objective': '率先拿到 {n} 颗星！',
  'over.stalled': '双方都无法行动，比较星星数。',
  'over.again': '再来一局',
  'over.lobby': '回到大厅',
  'tip.ok': '知道了',
  'tip.off': '不再提示',
  'tip.turn': '每回合二选一：点右下角抽 2 张牌，或者把 1 张兵拖到棋盘上。',
  'tip.place': '发光的格子可以出兵。路线要从你的城堡出发，一路经过你占着的格子。',
  'tip.crush': '力量更大的兵可以盖住敌兵！把兵拖到发光的敌兵上试试。',
  'tip.effect': '大多数兵出场时有特殊效果，按住或把鼠标移到卡牌上，卡牌上方就会显示说明。数字越大，力量越强。',
  'tip.region': '路围成的一块区域里，格子全被你占住时，就能拿走里面的星星。只差一格了！',
  'tip.hq': '对方城堡就在你能出兵的范围里！把兵出到城堡上直接获胜。',
  'troop.pip': '发条企鹅',
  'troop.mira': '套娃',
  'troop.boing': '惊奇盒',
  'troop.brix': '积木骑士',
  'troop.hop': '弹簧蛙',
  'troop.clank': '机器人',
  'troop.bruno': '邮差熊',
  'troop.rexie': '霸王龙',
  'effect.pip': '万能：能盖住任何敌兵，也能被任何兵盖住',
  'effect.mira': '出场后抽 2 张',
  'effect.boing': '出场后立刻再出 1 张',
  'effect.brix': '出场后移除 1 个相邻的敌兵',
  'effect.hop': '无视连接，可以出到任何格子',
  'effect.clank': '出场后对手随机弃 1 张手牌',
  'effect.bruno': '出场后抽 1 张',
  'effect.rexie': '没有效果，力量最强',
};

export type Key = keyof typeof zh;

const ja: Record<Key, string> = {
  title: 'おもちゃ軍団',
  board: 'ボード',
  loading: 'おもちゃたちが集合中…',
  'lobby.start': 'スタート',
  'lobby.rules': 'あそびかた',
  'lobby.units': 'ユニット',
  'lobby.settings': '設定',
  'setup.mode': 'モードをえらぶ',
  'mode.ai': 'CPU 対戦',
  'mode.ai.note': 'CPU と対戦。あなたは赤チーム',
  'mode.local': 'ふたりで対戦',
  'mode.local.note': '1 台のスマホを交代で',
  'setup.diff': 'CPU の強さ',
  'diff.easy': 'やさしい',
  'diff.normal': 'ふつう',
  'setup.map': 'マップをえらぶ',
  'setup.back': '戻る',
  'setup.go': 'いざ出陣！',
  'map.goal': '目標 ★{n}',
  'map.castle-field': 'お城の草原',
  'map.castle-field.blurb': '道が多く、エリアも広い入門マップ。',
  'map.river-banks': '小川の両岸',
  'map.river-banks.blurb': '川を渡れるのは 2 本の橋と小島だけ。守りが強い。',
  'map.block-town': 'つみき町',
  'map.block-town.blurb': '碁盤の目の街。エリアが小さく星が多い、スピード勝負。',
  'rules.1.h': 'ユニットを出す',
  'rules.1': '毎ターン、カードを 2 枚引くか、ユニットを 1 体出すかを選びます。出せるのは自分の城から、自分のマスをたどってつながるマスだけです。',
  'rules.2.h': '強いほうが上',
  'rules.2': '強さが上のユニットは敵ユニットの上に重ねられます。重ねられたユニットは下の段になります。ジョーカーはどのユニットにも重ねられ、どのユニットにも重ねられます。',
  'rules.3.h': '星をとる',
  'rules.3': 'エリアのマスをぜんぶ自分のユニットで埋めると、そこの星がもらえます。先に目標の数だけ星を集めたほうの勝ち。',
  'rules.4.h': '城を攻める',
  'rules.4': '相手の城にユニットを出せば即勝利。両方とも動けなくなったら、星の多いほうの勝ちです。',
  'rules.ok': 'わかった',
  close: '閉じる',
  'settings.lang': '言語',
  'settings.sound': '効果音（準備中）',
  'settings.tips': '初心者ヒント',
  'hud.hand': '手札 {n}',
  'hud.deck': '山札 {n}',
  'draw.pre': 'ドロー',
  'draw.post': '枚',
  'hand.hidden': '手札は伏せています',
  'hand.empty': '手札なし',
  skip: 'スキップ',
  'side.you': 'あなた',
  'side.ai': 'CPU',
  'side.red': '赤チーム',
  'side.blue': '青チーム',
  'first.you': 'あなたの先攻',
  'first.ai': 'CPU の先攻',
  'pass.first': '{side}の先攻。先攻は手札 3 枚、後攻は 4 枚から始めます。',
  'pass.title': '{side}の番',
  'pass.go': 'はじめる',
  'ai.thinking': 'CPU が考え中…',
  'pending.remove': '{name}：となりの敵ユニットを 1 体えらんで取りのぞく',
  'pending.again': '{name}：もう 1 体出せます',
  'troop.noTarget': '{name}を出せるマスがいまはありません',
  skipped: '{side}は動けないのでパスします',
  'sum.handoff': 'スマホを{side}に渡してください。',
  'sum.draw': '{side}はカードを引きました。',
  'sum.place': '{side}は{name}を出しました。',
  'sum.troop': 'ユニット',
  'over.draw': '引き分け',
  'over.win': '{side}の勝ち',
  'over.youWin': 'あなたの勝ち！',
  'over.aiWin': 'CPU の勝ち',
  'over.hq': '相手の城を攻め落とした！',
  'over.objective': '先に星を {n} 個集めた！',
  'over.stalled': '両方とも動けないので、星の数で決着。',
  'over.again': 'もう一回',
  'over.lobby': 'ロビーへ',
  'tip.ok': 'わかった',
  'tip.off': 'ヒントを表示しない',
  'tip.turn': '毎ターンどちらか 1 つ：右下でカードを 2 枚引くか、ユニットを 1 体ボードにドラッグします。',
  'tip.place': '光っているマスに出せます。自分の城から、自分のマスをたどってつながっている必要があります。',
  'tip.crush': '強いユニットは敵の上に重ねられます！光っている敵にドラッグしてみよう。',
  'tip.effect': 'ほとんどのユニットには登場時の効果があります。カードを押すかマウスを乗せると、カードの上に説明が出ます。数字が大きいほど強いユニットです。',
  'tip.region': '道で囲まれたエリアのマスをぜんぶ埋めると、中の星がもらえます。あと 1 マス！',
  'tip.hq': '相手の城に手が届きます！城にユニットを出せば即勝利。',
  'troop.pip': 'ゼンマイペンギン',
  'troop.mira': 'マトリョーシカ',
  'troop.boing': 'びっくり箱',
  'troop.brix': 'つみきナイト',
  'troop.hop': 'バネガエル',
  'troop.clank': 'ロボット',
  'troop.bruno': 'ゆうびんクマ',
  'troop.rexie': 'ティラノ',
  'effect.pip': 'ジョーカー：どの敵にも重ねられ、どのユニットにも重ねられる',
  'effect.mira': '登場時にカードを 2 枚引く',
  'effect.boing': '登場後、すぐにもう 1 体出せる',
  'effect.brix': '登場時、となりの敵ユニットを 1 体取りのぞく',
  'effect.hop': 'つながりを無視してどのマスにも出せる',
  'effect.clank': '登場時、相手の手札をランダムに 1 枚捨てさせる',
  'effect.bruno': '登場時にカードを 1 枚引く',
  'effect.rexie': '効果なし。いちばん強い',
};

const en: Record<Key, string> = {
  title: 'Toy Legion',
  board: 'Board',
  loading: 'Gathering the toys…',
  'lobby.start': 'Play',
  'lobby.rules': 'How to play',
  'lobby.units': 'Troops',
  'lobby.settings': 'Settings',
  'setup.mode': 'Choose a mode',
  'mode.ai': 'vs AI',
  'mode.ai.note': 'Play the AI. You are red.',
  'mode.local': 'Local 2P',
  'mode.local.note': 'Take turns on one phone',
  'setup.diff': 'AI level',
  'diff.easy': 'Easy',
  'diff.normal': 'Normal',
  'setup.map': 'Choose a map',
  'setup.back': 'Back',
  'setup.go': 'Battle!',
  'map.goal': 'Goal ★{n}',
  'map.castle-field': 'Castle Meadow',
  'map.castle-field.blurb': 'A starter map with many routes and big regions.',
  'map.river-banks': 'River Banks',
  'map.river-banks.blurb': 'Only two bridges and an island cross the river. Good for defense.',
  'map.block-town': 'Block Town',
  'map.block-town.blurb': 'A grid of small blocks packed with stars. Fast games.',
  'rules.1.h': 'Deploy',
  'rules.1': 'Each turn, either draw 2 cards or play 1 troop. A troop can only go on a space that links back to your castle through spaces you hold.',
  'rules.2.h': 'Stronger wins',
  'rules.2': 'A stronger troop can be stacked on top of an enemy troop, which becomes the layer below. The joker can cover any troop and be covered by any troop.',
  'rules.3.h': 'Take stars',
  'rules.3': 'Fill every space of a region with your troops to take its stars. First to reach the star goal wins.',
  'rules.4.h': 'Storm the castle',
  'rules.4': 'Land a troop on the enemy castle to win at once. If neither side can move, the one with more stars wins.',
  'rules.ok': 'Got it',
  close: 'Close',
  'settings.lang': 'Language',
  'settings.sound': 'Sound (coming soon)',
  'settings.tips': 'Beginner tips',
  'hud.hand': 'Hand {n}',
  'hud.deck': 'Deck {n}',
  'draw.pre': 'Draw',
  'draw.post': '',
  'hand.hidden': 'Hand hidden',
  'hand.empty': 'No cards',
  skip: 'Skip',
  'side.you': 'You',
  'side.ai': 'AI',
  'side.red': 'Red',
  'side.blue': 'Blue',
  'first.you': 'You go first',
  'first.ai': 'AI goes first',
  'pass.first': '{side} goes first. First player starts with 3 cards, second with 4.',
  'pass.title': "{side}'s turn",
  'pass.go': 'Start',
  'ai.thinking': 'AI is thinking…',
  'pending.remove': '{name}: tap an adjacent enemy to remove it',
  'pending.again': '{name}: play 1 more troop',
  'troop.noTarget': '{name} has nowhere to go right now',
  skipped: "{side} can't move and passes",
  'sum.handoff': 'Hand the phone to {side}.',
  'sum.draw': '{side} drew cards.',
  'sum.place': '{side} played {name}.',
  'sum.troop': 'a troop',
  'over.draw': 'Draw',
  'over.win': '{side} wins',
  'over.youWin': 'You win!',
  'over.aiWin': 'AI wins',
  'over.hq': 'Stormed the enemy castle!',
  'over.objective': 'First to {n} stars!',
  'over.stalled': 'Neither side can move, so stars decide.',
  'over.again': 'Play again',
  'over.lobby': 'Back to lobby',
  'tip.ok': 'Got it',
  'tip.off': "Don't show tips",
  'tip.turn': 'Each turn, do one: tap the button at bottom right to draw 2 cards, or drag 1 troop onto the board.',
  'tip.place': 'You can play on the glowing spaces. The route must start at your castle and pass only through spaces you hold.',
  'tip.crush': 'A stronger troop can cover an enemy! Try dragging onto a glowing enemy.',
  'tip.effect': 'Most troops have an effect when they enter; press or hover a card to read it just above the card. Higher numbers are stronger.',
  'tip.region': 'Hold every space in a region boxed in by paths to take its stars. Just one space to go!',
  'tip.hq': 'The enemy castle is in reach! Play a troop on it to win at once.',
  'troop.pip': 'Wind-up',
  'troop.mira': 'Doll',
  'troop.boing': 'Jack Box',
  'troop.brix': 'Knight',
  'troop.hop': 'Frog',
  'troop.clank': 'Robot',
  'troop.bruno': 'Mail Bear',
  'troop.rexie': 'T-Rex',
  'effect.pip': 'Joker: covers any enemy and can be covered by anything',
  'effect.mira': 'On entry, draw 2',
  'effect.boing': 'On entry, play 1 more troop right away',
  'effect.brix': 'On entry, remove 1 adjacent enemy',
  'effect.hop': 'Ignores links; can go on any space',
  'effect.clank': 'On entry, the opponent discards 1 random card',
  'effect.bruno': 'On entry, draw 1',
  'effect.rexie': 'No effect, but the strongest',
};

const DICT: Record<Locale, Record<Key, string>> = { zh, ja, en };

export let locale: Locale = loadLocale();

export function t(key: Key, vars: Record<string, string | number> = {}): string {
  return DICT[locale][key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}

export function applyStatic() {
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : locale;
  document.title = t('title');
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n as Key); });
  document.querySelectorAll<HTMLElement>('[data-i18n-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nLabel as Key)));
  document.querySelectorAll<HTMLElement>('[data-locale]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.locale === locale)));
}

export function setLocale(next: Locale) {
  locale = next;
  writeCookie(next);
  try {
    localStorage.setItem(SHARED_KEY, next);
  } catch {}
  applyStatic();
}
