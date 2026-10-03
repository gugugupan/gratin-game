import "./style.css";
import { GAMES, isNew, sortGames, type Game } from "./games";
import { INPUTS, LOCALE_LABELS, langButtons, loadLocale, saveLocale, t, type Locale } from "./i18n";
import { FEEDBACK_EMAIL, PRIVACY } from "./privacy";

if (location.hash === "#privacy") location.replace("./privacy/");

const state: { locale: Locale } = { locale: loadLocale() };
const games = sortGames(GAMES);

const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const ICONS: Record<string, string> = {
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  mouse: '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/>',
  touch: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
  play: '<path d="M7 5l12 7-12 7z" fill="currentColor"/>'
};
const icon = (name: string) =>
  `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

function card(g: Game, locale: Locale, now: Date): string {
  const live = g.status === "live";
  const title = esc(g.title[locale]);
  const badge = !live
    ? `<span class="badge soon">${t(locale, "soon")}</span>`
    : isNew(g, now)
      ? `<span class="badge">${t(locale, "newBadge")}</span>`
      : "";
  const cover = `<img src="./${esc(g.cover)}" alt="" loading="lazy" width="900" height="563">`;
  const inputs = g.input
    .map((i) => `<li title="${esc(INPUTS[i][locale])}">${icon(i)}<span>${esc(INPUTS[i][locale])}</span></li>`)
    .join("");
  const langs = g.languages.map((l) => esc(LOCALE_LABELS[l as Locale] ?? l)).join(" · ");
  const play = live
    ? `<a class="play" href="${esc(g.url)}">${icon("play")}${t(locale, "play")}</a>`
    : `<span class="play disabled" aria-disabled="true">${t(locale, "soon")}</span>`;
  return `<li class="card${live ? "" : " is-soon"}">
  <a class="cover" href="${live ? esc(g.url) : "#"}" ${live ? "" : 'tabindex="-1" aria-hidden="true"'}>${cover}${badge}</a>
  <div class="body">
    <h2>${title}</h2>
    <p class="desc">${esc(g.tagline[locale])}</p>
    <div class="meta"><ul class="inputs">${inputs}</ul><span class="langs">${langs}</span></div>
    <div class="actions">${play}</div>
  </div>
</li>`;
}

function render(): void {
  const { locale } = state;
  document.documentElement.lang = locale === "zh" ? "zh-CN" : locale;

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    el.textContent = t(locale, el.dataset.i18n as Parameters<typeof t>[1]);
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-label]").forEach((el) => {
    el.setAttribute("aria-label", t(locale, el.dataset.i18nLabel as Parameters<typeof t>[1]));
  });

  $(".lang").innerHTML = langButtons(locale);

  const now = new Date();
  $(".grid").innerHTML = games.map((g) => card(g, locale, now)).join("");
  $(".count").textContent = t(locale, "count", { n: games.length });
  $<HTMLAnchorElement>(".mail").href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(t(locale, "feedbackSubject"))}`;
  $(".mail-address").textContent = FEEDBACK_EMAIL;
  $(".privacy-link").textContent = PRIVACY[locale].linkLabel;
}

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;
  const langBtn = target.closest<HTMLButtonElement>("[data-locale]");
  if (langBtn) {
    state.locale = langBtn.dataset.locale as Locale;
    saveLocale(state.locale);
    render();
  }
});

render();
