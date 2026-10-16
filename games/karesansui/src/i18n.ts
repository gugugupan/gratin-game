export type Locale = 'zh' | 'ja';
export const LOCALES: Locale[] = ['ja', 'zh'];

const COOKIE = 'gratin_lang';
const LEGACY_KEY = 'gratin:lang';

const zh = {
  title: '枯山水 Karesansui',
  logo: '枯山水',
  loading: '整理庭院中…',
  'mode.puzzle': '庭题',
  'mode.random': '随庭',
  'mode.free': '自由',
  back: '返回',
  'size.small': '小庭',
  'size.medium': '中庭',
  'size.large': '大庭',
  'level.g1': '其一',
  'level.g2': '其二',
  'level.g3': '其三',
  seal: '成',
  'hud.steps': '耙程',
  'hud.target': '按住在庭院里查看目标纹样',
  'hud.clean': '整齐',
  'hud.match': '吻合',
  'btn.undo': '撤销',
  'btn.undo.title': '撤销（Backspace / Z）',
  'btn.reset': '重来',
  'btn.reset.title': '重新开始',
  'btn.finish': '完成',
  'btn.finish.title': '完成这幅画',
  'btn.menu': '菜单',
  'btn.menu.title': '回到菜单',
  'msg.mismatch': '纹样与目标不同，撤销后再试。',
  'msg.messy': '亮起的地方还是乱砂，撤销后再试。',
  'msg.entry': '从朱色标记的入口格开始。',
  'msg.adjacent': '点相邻的格子，或者用方向键移动。',
  'res.done': '庭成',
  'res.free': '一幅',
  'res.clean': '整齐度',
  'res.match': '吻合度',
  'res.next.puzzle': '下一关',
  'res.next.random': '换一张',
  'res.next.free': '新画布',
  'res.again': '再来一次',
  'res.menu': '菜单',
  'tut.skip': '跳过',
  'tut.next': '下一步',
  'tut.start': '开始',
  'intro.skip': '点击跳过',
  'tut.puzzle.1': '这是目标纹样。按住这张图，庭院里就会显示完整的目标。',
  'tut.puzzle.2': '从朱色标记的入口开始。用方向键、点击相邻的格子或者拖动来移动和尚。',
  'tut.puzzle.3':
    '耙子跟在和尚身后扫出纹路。直着走会耙满一整格；转弯只扫过一个扇形，外侧的角落保持原样。走回上一格就是撤销。',
  'tut.puzzle.4': '最后从另一个朱色标记的出口离开。纹样和目标完全一致，庭院就完成了。',
  'tut.random.1': '从朱色入口开始，用方向键、点击相邻的格子或者拖动来耙砂。',
  'tut.random.2': '转弯扫不到的角落会一直乱着。换个方向再转一次，或者直着耙过去，就能补上。',
  'tut.random.3': '整齐度到 100% 后从出口离开。如果还有乱砂，没扫到的地方会亮起来。',
  'tut.free.1': '点任意一格开始，用方向键、点击或者拖动随意作画，没有任何限制。',
  'tut.free.2': '画好后，点右上角的「完成」。',
};

type Key = keyof typeof zh;

const ja: Record<Key, string> = {
  title: '枯山水 Karesansui',
  logo: '枯山水',
  loading: '庭を整えています…',
  'mode.puzzle': 'お題',
  'mode.random': 'おまかせ',
  'mode.free': '自由',
  back: '戻る',
  'size.small': '小庭',
  'size.medium': '中庭',
  'size.large': '大庭',
  'level.g1': '其の一',
  'level.g2': '其の二',
  'level.g3': '其の三',
  seal: '済',
  'hud.steps': '手数',
  'hud.target': '長押しで庭にお手本を映します',
  'hud.clean': '整い',
  'hud.match': '一致',
  'btn.undo': '戻す',
  'btn.undo.title': '一手戻す（Backspace / Z）',
  'btn.reset': 'やり直し',
  'btn.reset.title': '最初からやり直す',
  'btn.finish': '完成',
  'btn.finish.title': 'この絵を仕上げる',
  'btn.menu': 'メニュー',
  'btn.menu.title': 'メニューに戻る',
  'msg.mismatch': '模様がお手本と違います。戻してやり直しましょう。',
  'msg.messy': '光っているところはまだ砂が乱れています。戻してやり直しましょう。',
  'msg.entry': '朱色の印がある入口のマスから始めましょう。',
  'msg.adjacent': '隣のマスをタップするか、矢印キーで動かしましょう。',
  'res.done': '完成',
  'res.free': '一幅',
  'res.clean': '整い',
  'res.match': '一致',
  'res.next.puzzle': '次の庭へ',
  'res.next.random': '別の庭',
  'res.next.free': '新しく描く',
  'res.again': 'もう一度',
  'res.menu': 'メニュー',
  'tut.skip': 'スキップ',
  'tut.next': '次へ',
  'tut.start': 'はじめる',
  'intro.skip': 'タップでスキップ',
  'tut.puzzle.1': 'これがお手本の模様です。この図を長押しすると、庭にお手本全体が映ります。',
  'tut.puzzle.2': '朱色の印がある入口から始めます。矢印キー、隣のマスのタップ、ドラッグでお坊さんを動かしましょう。',
  'tut.puzzle.3':
    '熊手はお坊さんの後ろで砂紋を引きます。まっすぐ進むとマス全体が整い、曲がると扇形だけが掃かれて外側の角は元のまま残ります。ひとつ前のマスに戻ると取り消しです。',
  'tut.puzzle.4': '最後にもう一つの朱色の印から庭を出ます。模様がお手本とぴったり同じなら完成です。',
  'tut.random.1': '朱色の入口から始めて、矢印キー、隣のマスのタップ、ドラッグで砂を整えましょう。',
  'tut.random.2': '曲がり角で掃けなかった角は乱れたまま残ります。別の向きでもう一度曲がるか、まっすぐ掃き直せば整います。',
  'tut.random.3': '整いが 100% になったら出口から出ましょう。乱れた砂が残っていると、その場所が光ります。',
  'tut.free.1': '好きなマスをタップして始め、矢印キー・タップ・ドラッグで自由に描きましょう。制限はありません。',
  'tut.free.2': '描き終えたら、右上の「完成」を押しましょう。',
};

const DICT: Record<Locale, Record<Key, string>> = { zh, ja };

function readCookie(): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Shared gratin-game rule: an explicit choice wins, otherwise Japanese if the browser lists it anywhere. */
function detect(): Locale {
  let saved: string | null = readCookie();
  if (!saved) {
    try {
      saved = localStorage.getItem(LEGACY_KEY);
    } catch {
      saved = null;
    }
  }
  if (saved === 'ja' || saved === 'zh') return saved;
  if (saved) return 'ja';
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  if (langs.some((l) => l.toLowerCase().startsWith('ja'))) return 'ja';
  if (langs.some((l) => l.toLowerCase().startsWith('zh'))) return 'zh';
  return 'ja';
}

export let locale: Locale = detect();

export const t = (key: Key) => DICT[locale][key];

export function setLocale(next: Locale) {
  locale = next;
  const domain = location.hostname.endsWith('gratin-game.com') ? '; domain=gratin-game.com' : '';
  document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax${domain}`;
  applyStatic();
}

/** Fills elements marked with data-i18n (text) and data-i18n-title (tooltip). */
export function applyStatic() {
  document.documentElement.lang = locale;
  document.title = t('title');
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n as Key)));
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((el) => (el.title = t(el.dataset.i18nTitle as Key)));
  document.querySelectorAll<HTMLElement>('[data-lang]').forEach((el) => el.classList.toggle('on', el.dataset.lang === locale));
}
