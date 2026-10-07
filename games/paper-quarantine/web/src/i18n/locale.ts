export const LOCALES = ["ja", "zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export type Localized<T = string> = Record<Locale, T>;

// Shared with gratin-game.com and its other games through a parent-domain cookie; keep in sync with the portal's src/i18n.ts.
const SHARED_KEY = "gratin:lang";
const LEGACY_KEY = "gratin-game:locale";
const COOKIE = "gratin_lang";
const COOKIE_DOMAIN = "gratin-game.com";

export const LOCALE_LABELS: Localized = { ja: "日本語", zh: "中文", en: "EN" };

function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

function detectLocale(languages: readonly string[]): Locale {
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

function loadLocale(): Locale {
  const saved = new URLSearchParams(location.search).get("lang") ?? chosen();
  if (saved) return isLocale(saved) ? saved : "ja";
  return detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function saveLocale(locale: Locale): void {
  writeCookie(locale);
  try {
    localStorage.setItem(SHARED_KEY, locale);
  } catch {
    // The cookie alone still carries the choice.
  }
}

export const LOCALE: Locale = loadLocale();
document.documentElement.lang = LOCALE === "zh" ? "zh-CN" : LOCALE;

export const tr = <T>(v: Localized<T>): T => v[LOCALE];

export const FONT = tr({
  zh: { display: '"ZCOOL XiaoWei", "Songti SC", serif', body: '"Noto Sans SC", "PingFang SC", sans-serif', family: "ZCOOL XiaoWei" },
  ja: { display: '"Klee One", "Hiragino Mincho ProN", serif', body: '"Noto Sans JP", "Hiragino Sans", sans-serif', family: "Klee One" },
  en: { display: '"Special Elite", "Courier New", serif', body: '"Noto Sans", "Helvetica Neue", sans-serif', family: "Special Elite" },
});

export async function loadFonts(): Promise<void> {
  await import("@fontsource/courier-prime/400.css");
  await import("@fontsource/courier-prime/700.css");
  if (LOCALE === "zh") {
    await Promise.all([import("@fontsource/zcool-xiaowei"), import("@fontsource/noto-sans-sc/400.css"), import("@fontsource/noto-sans-sc/700.css")]);
  } else if (LOCALE === "ja") {
    await Promise.all([import("@fontsource/klee-one/600.css"), import("@fontsource/noto-sans-jp/400.css"), import("@fontsource/noto-sans-jp/700.css")]);
  } else {
    await Promise.all([import("@fontsource/special-elite"), import("@fontsource/noto-sans/400.css"), import("@fontsource/noto-sans/700.css")]);
  }
}
