import "./style.css";
import { langButtons, loadLocale, saveLocale, t, type Locale } from "./i18n";
import { PRIVACY, renderPolicy } from "./privacy";

let locale: Locale = loadLocale();

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;

function render(): void {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;
  document.title = `${PRIVACY[locale].title} · グラタンゲーム`;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    el.textContent = t(locale, el.dataset.i18n as Parameters<typeof t>[1]);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-label]").forEach((el) => {
    el.setAttribute("aria-label", t(locale, el.dataset.i18nLabel as Parameters<typeof t>[1]));
  });

  $(".lang").innerHTML = langButtons(locale);
  $(".policy h1").textContent = PRIVACY[locale].title;
  $(".privacy-body").innerHTML = renderPolicy(locale);
}

document.addEventListener("click", (e) => {
  const langBtn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-locale]");
  if (langBtn) {
    locale = langBtn.dataset.locale as Locale;
    saveLocale(locale);
    render();
  }
});

render();
