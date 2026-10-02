export const LOCALES = ["ja", "zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export type Localized = Record<Locale, string>;

const STORAGE_KEY = "gratin-game:locale";

export const LOCALE_LABELS: Localized = { ja: "日本語", zh: "中文", en: "EN" };

const STRINGS = {
  tagline: {
    ja: "焼きたての HTML ゲーム、そろってます。",
    zh: "刚出炉的网页小游戏，都在这里。",
    en: "Fresh-baked HTML games, all in one dish.",
  },
  all: { ja: "すべて", zh: "全部", en: "All" },
  play: { ja: "あそぶ", zh: "开玩", en: "Play" },
  soon: { ja: "準備中", zh: "即将推出", en: "Coming soon" },
  newBadge: { ja: "NEW", zh: "新", en: "NEW" },
  count: { ja: "{n} 本のゲーム", zh: "共 {n} 款游戏", en: "{n} games" },
  empty: { ja: "このタグのゲームはまだありません。", zh: "这个标签下还没有游戏。", en: "No games with this tag yet." },
  language: { ja: "言語", zh: "语言", en: "Language" },
  filter: { ja: "ジャンル", zh: "类型", en: "Genre" },
  footer: { ja: "すべて手づくり、ブラウザですぐ遊べます。", zh: "全部手工制作，打开浏览器就能玩。", en: "Handmade, and playable right in your browser." },
} satisfies Record<string, Localized>;

export const TAGS: Record<string, Localized> = {
  rhythm: { ja: "リズム", zh: "节奏", en: "Rhythm" },
  roguelike: { ja: "ローグライク", zh: "肉鸽", en: "Roguelike" },
  cozy: { ja: "まったり", zh: "休闲", en: "Cozy" },
  builder: { ja: "街づくり", zh: "建造", en: "Builder" },
  puzzle: { ja: "パズル", zh: "解谜", en: "Puzzle" },
  logic: { ja: "推理", zh: "逻辑", en: "Logic" },
};

export const INPUTS: Record<string, Localized> = {
  keyboard: { ja: "キーボード", zh: "键盘", en: "Keyboard" },
  mouse: { ja: "マウス", zh: "鼠标", en: "Mouse" },
  touch: { ja: "タッチ", zh: "触屏", en: "Touch" },
};

export type StringKey = keyof typeof STRINGS;

export function t(locale: Locale, key: StringKey, vars: Record<string, string | number> = {}): string {
  return STRINGS[key][locale].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function detectLocale(languages: readonly string[]): Locale {
  for (const lang of languages) {
    const base = lang.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return "ja";
}

export function loadLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {}
  return detectLocale(navigator.languages ?? [navigator.language]);
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
}
