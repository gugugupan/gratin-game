export const LOCALES = ["ja", "zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export type Localized = Record<Locale, string>;

// Shared by gratin-game.com and its subdomains through a parent-domain cookie; localStorage still holds choices made before the cookie existed.
const SHARED_KEY = "gratin:lang";
const LEGACY_KEY = "gratin-game:locale";
const COOKIE = "gratin_lang";
const COOKIE_DOMAIN = "gratin-game.com";

export const LOCALE_LABELS: Localized = { ja: "日本語", zh: "中文", en: "EN" };

const STRINGS = {
  tagline: {
    ja: "焼きたての HTML ゲーム、そろってます。",
    zh: "刚出炉的网页小游戏，都在这里。",
    en: "Fresh-baked HTML games, all in one dish.",
  },
  play: { ja: "あそぶ", zh: "开玩", en: "Play" },
  soon: { ja: "準備中", zh: "即将推出", en: "Coming soon" },
  newBadge: { ja: "NEW", zh: "新", en: "NEW" },
  count: { ja: "{n} 本のゲーム", zh: "共 {n} 款游戏", en: "{n} games" },
  language: { ja: "言語", zh: "语言", en: "Language" },
  feedbackSubject: { ja: "【グラタンゲーム】ご意見・ご感想", zh: "【グラタンゲーム】意见反馈", en: "[Gratin Game] Feedback" },
  backHome: { ja: "ゲーム一覧へもどる", zh: "返回游戏列表", en: "Back to all games" },
  ideaTitle: { ja: "ゲームのアイデア、募集中！", zh: "征集游戏点子！", en: "Got a game idea?" },
  ideaBody: {
    ja: "「こんなゲームがあったらいいな」というアイデアはありませんか？ゲームにしてみたい企画があれば、お気軽にご連絡ください！",
    zh: "你有没有「要是有这样的游戏就好了」的想法？如果有想做成游戏的点子，欢迎随时联系我们！",
    en: "Ever thought \"I wish there were a game like this\"? If you have an idea you'd love to see turned into a game, feel free to get in touch!",
  },
  ideaButton: { ja: "アイデアを送る", zh: "发送点子", en: "Send us your idea" },
  ideaSubject: { ja: "【グラタンゲーム】ゲームのアイデア", zh: "【グラタンゲーム】游戏点子", en: "[Gratin Game] Game idea" },
  contact: { ja: "お問い合わせ：", zh: "联系我们：", en: "Contact: " },
  footer: { ja: "すべて手づくり、ブラウザですぐ遊べます。", zh: "全部手工制作，打开浏览器就能玩。", en: "Handmade, and playable right in your browser." },
} satisfies Record<string, Localized>;

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
  const bases = languages.map((lang) => lang.toLowerCase().split("-")[0]);
  if (bases.includes("ja")) return "ja";
  return bases.find(isLocale) ?? "ja";
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
  const domain = host === COOKIE_DOMAIN || host.endsWith(`.${COOKIE_DOMAIN}`) ? `; domain=${COOKIE_DOMAIN}` : "";
  const secure = location.protocol === "https:" ? "; secure" : "";
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

export function loadLocale(): Locale {
  const saved = chosen();
  if (saved) return isLocale(saved) ? saved : "ja";
  return detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function saveLocale(locale: Locale): void {
  writeCookie(locale);
  try {
    localStorage.setItem(SHARED_KEY, locale);
  } catch {}
}

export function watchLocale(current: () => Locale, onChange: (locale: Locale) => void): void {
  const update = () => {
    const next = loadLocale();
    if (next !== current()) onChange(next);
  };
  window.addEventListener("storage", (e) => {
    if (e.key === SHARED_KEY || e.key === null) update();
  });
  window.addEventListener("languagechange", () => {
    if (!chosen()) update();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) update();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) update();
  });
}

export function langButtons(locale: Locale): string {
  return LOCALES.map(
    (l) => `<button type="button" data-locale="${l}" aria-pressed="${l === locale}">${LOCALE_LABELS[l]}</button>`,
  ).join("");
}
