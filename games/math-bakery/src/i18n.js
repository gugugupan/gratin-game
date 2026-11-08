export const LOCALES = ['ja', 'zh', 'en'];

// Shared with gratin-game.com and its other games through a parent-domain cookie; keep in sync with the portal's src/i18n.ts.
const SHARED_KEY = 'gratin:lang';
const LEGACY_KEY = 'gratin-game:locale';
const COOKIE = 'gratin_lang';
const COOKIE_DOMAIN = 'gratin-game.com';

export const LOCALE_LABELS = { ja: '日本語', zh: '中文', en: 'EN' };

const isLocale = (v) => typeof v === 'string' && LOCALES.includes(v);

export function detectLocale(languages) {
  const bases = languages.map((lang) => lang.toLowerCase().split('-')[0]);
  if (bases.includes('ja')) return 'ja';
  return bases.find(isLocale) ?? 'ja';
}

function readCookie() {
  try {
    return document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`))?.[1] ?? null;
  } catch {
    return null;
  }
}

function writeCookie(value) {
  const host = location.hostname;
  const domain = host === COOKIE_DOMAIN || host.endsWith(`.${COOKIE_DOMAIN}`) ? `; domain=${COOKIE_DOMAIN}` : '';
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${COOKIE}=${value}; path=/; max-age=31536000; samesite=lax${domain}${secure}`;
}

function chosen() {
  const cookie = readCookie();
  if (cookie) return cookie;
  try {
    return localStorage.getItem(SHARED_KEY) ?? localStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
}

function loadLocale() {
  const saved = new URLSearchParams(location.search).get('lang') ?? chosen();
  if (saved) return isLocale(saved) ? saved : 'ja';
  return detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

const ja = {
  title: 'けいさんベーカリー',
  'mode.easy': 'ひとけたのたし算',
  'mode.easy.d': '5までのたし算から、少しずつむずかしく',
  'mode.as': 'たし算・ひき算',
  'mode.as.d': '2けた、くり上がり・くり下がり、3つの数',
  'mode.mul': 'かけ算',
  'mode.mul.d': '九九から、2けた×1けたまで',
  'mode.t24': '24をつくろう',
  'mode.t24.d': '4つの数を＋−×÷で 24 に',
  best: 'ベスト<br>{n} 点',
  shelf: 'わたしのパン棚',
  'shelf.total': 'ぜんぶで {n} 個',
  'shelf.empty': 'まだからっぽ',
  'sound.on': 'サウンド：オン',
  'sound.off': 'サウンド：オフ',
  'aria.home': 'メニューにもどる',
  'aria.soundOn': 'サウンドをオフにする',
  'aria.soundOff': 'サウンドをオンにする',
  'aria.help': 'あそびかた',
  'aria.del': '1文字けす',
  qno: '第 {n} 問 / 10',
  level: 'レベル',
  streak: '{n} 連続',
  'streak.zero': '0 連続',
  'chip.breads': 'このゲームで焼けたパン',
  answer: '答えは {n}',
  clear: 'けす',
  undo: 'ひとつ戻す',
  reset: 'やり直す',
  skip: '答えを見る',
  div0: '0 では割れません',
  not24: '{eq}　24 じゃない',
  'praise.1': '焼けた！|いいにおい！|ちょうどいい！',
  'praise.4': '火力全開！|こんがり！',
  'praise.7': 'パン職人！|止まらない！',
  'praise.10': '満点で焼けた！|パン職人！',
  'praise.fast': '電光石火！',
  'praise.streak': '{n} 連続',
  'praise.perfect': '全問正解！',
  'praise.perfect.c': '10個ぜんぶ焼き上がり',
  newBread: '{bread}が焼けた！{n} 連続',
  easier: '次はちょっとやさしく',
  'bread.0': '丸パン',
  'bread.1': '食パン',
  'bread.2': 'クロワッサン',
  'bread.3': 'バゲット',
  'bread.4': 'メロンパン',
  'bread.5': 'グラタン',
  'end.10': 'ひと窯まるごと！',
  'end.7': 'いいにおいの日',
  'end.4': 'パン棚が埋まってきた',
  'end.1': '最初のパンが焼けた',
  'end.0': 'まだ焼けてない',
  'end.count': 'このゲームで {n} 個焼けました',
  'end.record': '新記録！',
  'end.best': 'ベスト {n} 点',
  'stat.correct': '正解',
  'stat.streak': '最長連続',
  'stat.time': 'タイム',
  seconds: '{n} 秒',
  again: 'もうひと窯',
  menu: 'モードをえらぶ',
  'tut.title': 'あそびかた',
  'tut.1': '数を別の数の上へドラッグ',
  'tut.2': '記号をえらぶと、2つが1つになる',
  'tut.3': '最後に 24 が残ればクリア',
  'tut.ok': 'わかった',
};

const zh = {
  title: '口算面包房',
  'mode.easy': '个位加法',
  'mode.easy.d': '个位数加法，从 5 以内慢慢变难',
  'mode.as': '进阶加减',
  'mode.as.d': '两位数、进位退位、三个数连算',
  'mode.mul': '乘法',
  'mode.mul.d': '从九九表到两位数乘一位数',
  'mode.t24': '凑 24 点',
  'mode.t24.d': '四个数加减乘除凑出 24',
  best: '最高<br>{n} 分',
  shelf: '我的面包架',
  'shelf.total': '一共烤了 {n} 个',
  'shelf.empty': '还是空的',
  'sound.on': '声音：开',
  'sound.off': '声音：关',
  'aria.home': '返回首页',
  'aria.soundOn': '关闭声音',
  'aria.soundOff': '打开声音',
  'aria.help': '怎么玩',
  'aria.del': '删除',
  qno: '第 {n} / 10 题',
  level: '难度',
  streak: '连对 ×{n}',
  'streak.zero': '连对 0',
  'chip.breads': '本局烤好的面包',
  answer: '正确答案是 {n}',
  clear: '清空',
  undo: '撤销一步',
  reset: '重来',
  skip: '看答案',
  div0: '不能除以 0',
  not24: '{eq}，不是 24',
  'praise.1': '出炉！|香喷喷！|烤得正好！',
  'praise.4': '火力全开！|金黄酥脆！',
  'praise.7': '面包大师！|停不下来！',
  'praise.10': '满分出炉！|面包大师！',
  'praise.fast': '闪电出炉！',
  'praise.streak': '连对 ×{n}',
  'praise.perfect': '全对！',
  'praise.perfect.c': '十个面包全部出炉',
  newBread: '{bread}出炉！连对 {n} 题',
  easier: '下一题简单一点，慢慢来',
  'bread.0': '圆面包',
  'bread.1': '吐司',
  'bread.2': '牛角包',
  'bread.3': '法棍',
  'bread.4': '菠萝包',
  'bread.5': '焗烤盘',
  'end.10': '一炉全满！',
  'end.7': '今天的面包很香',
  'end.4': '面包架慢慢满了',
  'end.1': '烤出了第一批',
  'end.0': '这炉还没出面包',
  'end.count': '这一局烤了 {n} 个面包',
  'end.record': '新纪录！',
  'end.best': '最高纪录 {n} 分',
  'stat.correct': '答对',
  'stat.streak': '最长连对',
  'stat.time': '用时',
  seconds: '{n} 秒',
  again: '再烤一炉',
  menu: '换个模式',
  'tut.title': '怎么玩',
  'tut.1': '把一个数拖到另一个数上',
  'tut.2': '选一个符号，两个数合成一个',
  'tut.3': '最后剩下 24 就成功',
  'tut.ok': '知道了',
};

const en = {
  title: 'Math Bakery',
  'mode.easy': 'Single-digit adding',
  'mode.easy.d': 'Sums up to 5 first, then a little harder',
  'mode.as': 'Adding & subtracting',
  'mode.as.d': 'Two digits, carrying, three numbers',
  'mode.mul': 'Times tables',
  'mode.mul.d': 'Up to two digits × one digit',
  'mode.t24': 'Make 24',
  'mode.t24.d': 'Combine four numbers with + − × ÷',
  best: 'Best<br>{n}',
  shelf: 'My bread shelf',
  'shelf.total': '{n} baked so far',
  'shelf.empty': 'Still empty',
  'sound.on': 'Sound: on',
  'sound.off': 'Sound: off',
  'aria.home': 'Back to menu',
  'aria.soundOn': 'Turn sound off',
  'aria.soundOff': 'Turn sound on',
  'aria.help': 'How to play',
  'aria.del': 'Delete',
  qno: 'Q {n} / 10',
  level: 'Level',
  streak: 'Streak ×{n}',
  'streak.zero': 'Streak 0',
  'chip.breads': 'Bread baked this game',
  answer: 'Answer: {n}',
  clear: 'Clear',
  undo: 'Undo',
  reset: 'Reset',
  skip: 'Show answer',
  div0: 'Can’t divide by 0',
  not24: '{eq} — not 24',
  'praise.1': 'Baked!|Smells good!|Just right!',
  'praise.4': 'Full heat!|Golden!',
  'praise.7': 'Master baker!|Unstoppable!',
  'praise.10': 'Perfect batch!|Master baker!',
  'praise.fast': 'Lightning bake!',
  'praise.streak': 'Streak ×{n}',
  'praise.perfect': 'All correct!',
  'praise.perfect.c': 'All 10 loaves baked',
  newBread: '{bread} is out! {n} in a row',
  easier: 'Next one is a bit easier',
  'bread.0': 'Bun',
  'bread.1': 'Toast',
  'bread.2': 'Croissant',
  'bread.3': 'Baguette',
  'bread.4': 'Melon bun',
  'bread.5': 'Gratin',
  'end.10': 'A full oven!',
  'end.7': 'Smells great today',
  'end.4': 'The shelf is filling up',
  'end.1': 'First loaves out',
  'end.0': 'Nothing baked yet',
  'end.count': '{n} baked this game',
  'end.record': 'New record!',
  'end.best': 'Best: {n}',
  'stat.correct': 'Correct',
  'stat.streak': 'Best streak',
  'stat.time': 'Time',
  seconds: '{n}s',
  again: 'Bake again',
  menu: 'Change mode',
  'tut.title': 'How to play',
  'tut.1': 'Drag one number onto another',
  'tut.2': 'Pick a sign to merge them into one',
  'tut.3': 'End with 24 to win',
  'tut.ok': 'Got it',
};

export const DICT = { ja, zh, en };

export let locale = typeof location === 'undefined' ? 'ja' : loadLocale();

export function t(key, vars = {}) {
  const s = DICT[locale][key] ?? DICT.ja[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

export function setLocale(next) {
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
