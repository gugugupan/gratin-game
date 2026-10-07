import { MUTATIONS, type RoleId, type State } from "../../../engine/game.js";
import { STRAINS } from "../../../engine/map.js";
import { iconUrl } from "../art/assets";
import { CITY_NAMES, MUTATION_INFO, STRAIN_CSS, STRAIN_KEY, STRAIN_NAME } from "../data";
import { el } from "../util";
import { tr } from "../i18n/locale";

const HUD = tr({
  zh: {
    apLeft: (n: number, of: number) => `剩余 ${n} / ${of} 点`, outbreaks: (n: number, of: number) => `爆发 ${n} / ${of}`,
    eradicated: "已根除", cured: "已研制", progress: (have: number, need: number) => `单人最多 ${have} 个样本，研制需要 ${need} 个`,
    vial: (s: string, done: boolean) => `${s}解药，${done ? "已研制" : "未研制"}`, last: "上轮感染", none: "尚未感染", lockdown: (c: string) => `● 驻守封城：${c}`,
  },
  ja: {
    apLeft: (n: number, of: number) => `残り ${n} / ${of} ポイント`, outbreaks: (n: number, of: number) => `アウトブレイク ${n} / ${of}`,
    eradicated: "根絶", cured: "開発済み", progress: (have: number, need: number) => `1 人の最多サンプル ${have} 個、開発には ${need} 個必要`,
    vial: (s: string, done: boolean) => `${s}の治療薬、${done ? "開発済み" : "未開発"}`, last: "前回の感染", none: "まだ感染なし", lockdown: (c: string) => `● 駐在封鎖：${c}`,
  },
  en: {
    apLeft: (n: number, of: number) => `${n} of ${of} actions left`, outbreaks: (n: number, of: number) => `Outbreaks ${n} / ${of}`,
    eradicated: "ERADICATED", cured: "CURED", progress: (have: number, need: number) => `Best hand: ${have} samples; a cure needs ${need}`,
    vial: (s: string, done: boolean) => `${s} cure, ${done ? "developed" : "not yet developed"}`, last: "Last infected", none: "None yet", lockdown: (c: string) => `● Lockdown: ${c}`,
  },
});
import { idCard } from "./idcard";

export class Hud {
  private punches = el("ap-punches");
  private slots = el("outbreak-slots");
  private cures = el("cures");
  private stubs = el("stubs");
  readonly teamCards = el("team-cards");
  private toastEl = el("toast");
  private toastTimer = 0;
  hiddenRoles = new Set<RoleId>();

  render(state: State, portraits: Record<RoleId, string>, active: RoleId | null): void {
    this.renderAp(state);
    this.renderOutbreaks(state);
    this.renderCures(state);
    this.renderStubs(state);
    this.renderTeam(state, portraits, active);
  }

  private renderAp(state: State): void {
    const max = state.cfg.ap.n;
    const left = state.apLeft(0);
    this.punches.innerHTML = Array.from({ length: max }, (_, k) => `<span class="punch${k < max - left ? " used" : ""}"></span>`).join("");
    this.punches.setAttribute("aria-label", HUD.apLeft(left, max));
  }

  private renderOutbreaks(state: State): void {
    this.showOutbreaks(state.outbreaks, state.cfg.outbreakLimit);
  }

  showOutbreaks(count: number, limit: number, bump = false): void {
    this.slots.innerHTML = Array.from({ length: limit }, (_, k) => {
      const cls = ["slot", k < count ? "hit" : "", k === limit - 1 ? "end" : "", bump && k === count - 1 ? "bump" : ""].filter(Boolean).join(" ");
      return `<span class="${cls}">${k + 1}</span>`;
    }).join("");
    this.slots.setAttribute("aria-label", HUD.outbreaks(count, limit));
  }

  private renderCures(state: State): void {
    const html: string[] = [];
    for (let s = 0; s < STRAINS; s++) {
      const cured = !!state.cured[s];
      const need = Math.min(state.cureNeed(0, s), state.cureNeed(1, s));
      const have = Math.max(state.sample(0, s), state.sample(1, s));
      const badges = MUTATIONS.filter((m) => state.hasMutation(s, m))
        .map((m) => `<img src="${iconUrl(MUTATION_INFO[m].icon)}" alt="${MUTATION_INFO[m].name}" title="${MUTATION_INFO[m].name}：${MUTATION_INFO[m].text}">`)
        .join("");
      const label = state.eradicated[s]
        ? `<span class="stamp">${HUD.eradicated}</span>`
        : cured
          ? `<span class="stamp">${HUD.cured}</span>`
          : `<span class="num" title="${HUD.progress(have, need)}">${Math.min(have, need)}/${need}</span>`;
      html.push(`<div class="vial${cured ? " done" : ""}" style="--c: var(${STRAIN_CSS[s]})">
        <img class="vial-img" src="${iconUrl(`cure_${STRAIN_KEY[s]}`)}" alt="${HUD.vial(STRAIN_NAME[s], cured)}">
        ${label}
        <span class="muts">${badges}</span>
      </div>`);
    }
    this.cures.innerHTML = html.join("");
  }

  private renderStubs(state: State): void {
    this.showStubs(state.lastDrawn);
  }

  showStubs(cities: number[], label = HUD.last): void {
    (this.stubs.previousElementSibling as HTMLElement).textContent = label;
    this.stubs.innerHTML = cities.length
      ? cities.map((c) => `<span class="stub" style="--c: var(${STRAIN_CSS[Math.floor(c / 6)]})">${CITY_NAMES[c]}</span>`).join("")
      : `<span class="stub" style="--c: var(--ink-soft)">${HUD.none}</span>`;
  }

  private renderTeam(state: State, portraits: Record<RoleId, string>, active: RoleId | null): void {
    this.teamCards.innerHTML = "";
    state.roles.forEach((role, r) => {
      if (this.hiddenRoles.has(role)) return;
      const samples = Array.from({ length: STRAINS }, (_, s) => state.sample(r, s));
      const status = role === "police" ? HUD.lockdown(CITY_NAMES[state.pos[r]]) : undefined;
      const card = idCard(role, portraits[role], "team", { samples, status });
      card.setAttribute("aria-pressed", String(role === active));
      this.teamCards.append(card);
    });
  }

  setActive(active: RoleId | null): void {
    this.teamCards.querySelectorAll<HTMLElement>(".idcard").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.role === active)));
  }

  toast(text: string): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove("show"), 1600);
  }
}
