import { MUTATIONS, type RoleId, type State } from "../../../engine/game.js";
import { STRAINS } from "../../../engine/map.js";
import { iconUrl } from "../art/assets";
import { CITY_NAMES, MUTATION_INFO, STRAIN_CSS, STRAIN_KEY, STRAIN_SHORT } from "../data";
import { el } from "../util";
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
    this.punches.setAttribute("aria-label", `剩余 ${left} / ${max} 点`);
  }

  private renderOutbreaks(state: State): void {
    this.showOutbreaks(state.outbreaks, state.cfg.outbreakLimit);
  }

  showOutbreaks(count: number, limit: number, bump = false): void {
    this.slots.innerHTML = Array.from({ length: limit }, (_, k) => {
      const cls = ["slot", k < count ? "hit" : "", k === limit - 1 ? "end" : "", bump && k === count - 1 ? "bump" : ""].filter(Boolean).join(" ");
      return `<span class="${cls}">${k + 1}</span>`;
    }).join("");
    this.slots.setAttribute("aria-label", `爆发 ${count} / ${limit}`);
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
        ? `<span class="stamp">已根除</span>`
        : cured
          ? `<span class="stamp">已研制</span>`
          : `<span class="num" title="单人最多 ${have} 个样本，研制需要 ${need} 个">${Math.min(have, need)}/${need}</span>`;
      html.push(`<div class="vial${cured ? " done" : ""}" style="--c: var(${STRAIN_CSS[s]})">
        <img class="vial-img" src="${iconUrl(`cure_${STRAIN_KEY[s]}`)}" alt="${STRAIN_SHORT[s]}株解药，${cured ? "已研制" : "未研制"}">
        ${label}
        <span class="muts">${badges}</span>
      </div>`);
    }
    this.cures.innerHTML = html.join("");
  }

  private renderStubs(state: State): void {
    this.showStubs(state.lastDrawn);
  }

  showStubs(cities: number[], label = "上轮感染"): void {
    (this.stubs.previousElementSibling as HTMLElement).textContent = label;
    this.stubs.innerHTML = cities.length
      ? cities.map((c) => `<span class="stub" style="--c: var(${STRAIN_CSS[Math.floor(c / 6)]})">${CITY_NAMES[c]}</span>`).join("")
      : `<span class="stub" style="--c: var(--ink-soft)">尚未感染</span>`;
  }

  private renderTeam(state: State, portraits: Record<RoleId, string>, active: RoleId | null): void {
    this.teamCards.innerHTML = "";
    state.roles.forEach((role, r) => {
      if (this.hiddenRoles.has(role)) return;
      const samples = Array.from({ length: STRAINS }, (_, s) => state.sample(r, s));
      const status = role === "police" ? `● 驻守封城：${CITY_NAMES[state.pos[r]]}` : undefined;
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
