export const LOCALES = ['ja', 'zh', 'en'];

// Shared with gratin-game.com and its other games through a parent-domain cookie; keep in sync with the portal's src/i18n.ts.
const SHARED_KEY = 'gratin:lang';
const LEGACY_KEY = 'gratin-game:locale';
const COOKIE = 'gratin_lang';
const COOKIE_DOMAIN = 'gratin-game.com';

const isLocale = v => typeof v === 'string' && LOCALES.includes(v);

export function detectLocale(languages) {
  const bases = languages.map(lang => lang.toLowerCase().split('-')[0]);
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

export function loadLocale() {
  const saved = new URLSearchParams(location.search).get('lang') ?? chosen();
  if (saved) return isLocale(saved) ? saved : 'ja';
  return detectLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
}

export function saveLocale(locale) {
  writeCookie(locale);
  try {
    localStorage.setItem(SHARED_KEY, locale);
  } catch {
    // The cookie alone still carries the choice.
  }
}
