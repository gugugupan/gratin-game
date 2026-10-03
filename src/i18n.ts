export const LOCALES = ["ja", "zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export type Localized = Record<Locale, string>;

// Shared by every site on gugugupan.github.io so a choice made on one applies to all.
const SHARED_KEY = "gratin:lang";
const LEGACY_KEY = "gratin-game:locale";

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
  feedbackTitle: { ja: "ご意見・ご感想をお待ちしています", zh: "欢迎留下你的意见和感想", en: "We'd love your feedback" },
  feedbackBody: {
    ja: "バグの報告、遊んでみた感想、こんなゲームがほしいというアイデアなど、気軽に送ってください。",
    zh: "发现 bug、玩后感想、想玩什么样的游戏，都欢迎告诉我们。",
    en: "Found a bug, have thoughts after playing, or an idea for a new game? Tell us anytime.",
  },
  feedbackPlaceholder: { ja: "ご意見・ご感想", zh: "你的意见或感想", en: "Your thoughts" },
  feedbackEmail: { ja: "メールアドレス（任意・返信をご希望の場合）", zh: "邮箱（选填，需要回复时填写）", en: "Email (optional, if you'd like a reply)" },
  feedbackSend: { ja: "送信する", zh: "发送", en: "Send" },
  feedbackSending: { ja: "送信中…", zh: "发送中…", en: "Sending…" },
  feedbackThanks: { ja: "ありがとうございます！送信しました。", zh: "谢谢！已经收到了。", en: "Thank you! Your message was sent." },
  feedbackFailed: { ja: "送信できませんでした。", zh: "暂时没发出去。", en: "Couldn't send it right now." },
  feedbackByMail: { ja: "メールで送る", zh: "改用邮件发送", en: "Send by email instead" },
  feedbackEmpty: { ja: "内容を入力してください。", zh: "先写点内容吧。", en: "Write a few words first." },
  feedbackWait: { ja: "送信したばかりです。1分ほどおいてからどうぞ。", zh: "刚刚发过一条，过一分钟再试吧。", en: "Just sent one — try again in a minute." },
  feedbackOr: { ja: "メールでも受け付けています：", zh: "也可以直接发邮件：", en: "Or email us directly:" },
  feedbackSubject: { ja: "【グラタンゲーム】ご意見・ご感想", zh: "【グラタンゲーム】意见反馈", en: "[Gratin Game] Feedback" },
  backHome: { ja: "ゲーム一覧へもどる", zh: "返回游戏列表", en: "Back to all games" },
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

function chosen(): string | null {
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
}

export function langButtons(locale: Locale): string {
  return LOCALES.map(
    (l) => `<button type="button" data-locale="${l}" aria-pressed="${l === locale}">${LOCALE_LABELS[l]}</button>`,
  ).join("");
}
