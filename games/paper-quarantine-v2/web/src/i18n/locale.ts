export type Locale = "ja" | "zh" | "en";
export type Localized<T = string> = Record<Locale, T>;

// v2 is Chinese-only for now; the tables keep their ja/en entries so they can be revived later.
export const LOCALE: Locale = "zh";
document.documentElement.lang = "zh-CN";

export const tr = <T>(v: Localized<T>): T => v[LOCALE];

export const FONT = {
  display: '"ZCOOL XiaoWei", "Songti SC", serif',
  body: '"Noto Sans SC", "PingFang SC", sans-serif',
  family: "ZCOOL XiaoWei",
};

export async function loadFonts(): Promise<void> {
  await Promise.all([
    import("@fontsource/courier-prime/400.css"),
    import("@fontsource/courier-prime/700.css"),
    import("@fontsource/zcool-xiaowei"),
    import("@fontsource/noto-sans-sc/400.css"),
    import("@fontsource/noto-sans-sc/700.css"),
  ]);
}
