import type { RoleId, V2State } from "../../../engine/game.js";
import { MUTATIONS } from "../../../engine/roles.js";
import { STRAINS } from "../../../engine/map.js";
import { iconUrl } from "../art/assets";
import { MUTATION_INFO, STRAIN_CSS, STRAIN_KEY, STRAIN_NAME } from "../data";
import { NEWS_INFO } from "../text";
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
  private newsPop = el("news-pop");

  constructor() {
    const show = (e: Event) => {
      const chip = (e.target as HTMLElement).closest<HTMLElement>("[data-news]");
      if (!chip) return;
      const r = chip.getBoundingClientRect();
      this.newsPop.innerHTML = `<small>${chip.dataset.when}</small><b>${chip.dataset.name}</b><p>${chip.dataset.text}</p>`;
      this.newsPop.hidden = false;
      const w = this.newsPop.offsetWidth;
      this.newsPop.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.left))}px`;
      this.newsPop.style.top = `${r.bottom + 8}px`;
    };
    this.stubs.addEventListener("mouseover", show);
    this.stubs.addEventListener("click", show);
    this.stubs.addEventListener("mouseleave", () => { this.newsPop.hidden = true; });
    addEventListener("pointerdown", (e) => {
      if (!(e.target as HTMLElement).closest("[data-news]")) this.newsPop.hidden = true;
    });
  }

  render(state: V2State, portraits: Record<RoleId, string>, active: RoleId | null): void {
    this.renderAp(state);
    this.renderRoundsLeft(state);
    this.showRiots(state.riots(), state.cfg.riotLimit);
    this.renderCures(state);
    this.renderNews(state);
    this.renderTeam(state, portraits, active);
  }

  private renderAp(state: V2State): void {
    const max = state.cfg.ap;
    const left = Math.max(0, state.ap);
    this.punches.innerHTML = Array.from({ length: max }, (_, k) => `<span class="punch${k < max - left ? " used" : ""}"></span>`).join("");
    this.punches.setAttribute("aria-label", `剩余 ${left} / ${max} 点`);
  }

  private renderRoundsLeft(state: V2State): void {
    const left = state.cfg.rounds - state.round + 1;
    const box = el("rounds-left");
    box.hidden = left > 3 || state.status !== "playing";
    box.querySelector("b")!.textContent = left <= 1 ? "最后一轮" : `剩 ${left} 轮`;
  }

  showRiots(count: number, limit: number, bump = false): void {
    this.slots.innerHTML = Array.from({ length: limit }, (_, k) => {
      const end = k === limit - 1;
      const cls = ["slot", k < count ? "hit" : "", end ? "end" : "", end && count === limit - 1 ? "danger" : "", bump && k === count - 1 ? "bump" : ""].filter(Boolean).join(" ");
      return `<span class="${cls}"${end ? ` title="第 ${limit} 座城市失控即失败"` : ""}>${end ? "✕" : k + 1}</span>`;
    }).join("");
    this.slots.setAttribute("aria-label", `失控城市 ${count} / ${limit}`);
  }

  private renderCures(state: V2State): void {
    const html: string[] = [];
    for (let s = 0; s < STRAINS; s++) {
      const cured = !!state.cured[s];
      const need = Math.min(state.cureNeed(0, s), state.cureNeed(1, s));
      const have = Math.max(state.sample(0, s), state.sample(1, s));
      const badges = MUTATIONS.filter((m) => state.hasMutation(s, m))
        .map((m) => `<img src="${iconUrl(MUTATION_INFO[m].icon)}" alt="${MUTATION_INFO[m].name}" title="${MUTATION_INFO[m].name}：${MUTATION_INFO[m].text}">`)
        .join("");
      const label = cured ? `<span class="stamp">已研制</span>` : `<span class="num" title="单人最多 ${have} 个样本，研制需要 ${need} 个">${Math.min(have, need)}/${need}</span>`;
      html.push(`<div class="vial${cured ? " done" : ""}" style="--c: var(${STRAIN_CSS[s]})">
        <img class="vial-img" src="${iconUrl(`cure_${STRAIN_KEY[s]}`)}" alt="${STRAIN_NAME[s]}解药，${cured ? "已研制" : "未研制"}">
        ${label}
        <span class="muts">${badges}</span>
      </div>`);
    }
    this.cures.innerHTML = html.join("");
  }

  private renderNews(state: V2State): void {
    const now = NEWS_INFO[state.news], next = NEWS_INFO[state.nextNews];
    const chip = (cls: string, when: string, n: { name: string; text: string }) =>
      `<span class="stub ${cls}" data-news data-when="${when}" data-name="${n.name}" data-text="${n.text}" tabindex="0"><small>${when}</small>${n.name}</span>`;
    this.stubs.innerHTML = chip("news-now", "本轮新闻", now) + chip("news-next", "下轮预告", next);
  }

  private renderTeam(state: V2State, portraits: Record<RoleId, string>, active: RoleId | null): void {
    this.teamCards.innerHTML = "";
    state.roles.forEach((role, r) => {
      const samples = Array.from({ length: STRAINS }, (_, s) => state.sample(r, s));
      const extras: string[] = [];
      if (role === "officer") extras.push(`消除携带者剩 ${state.officerUses} 次`);
      if (role === "epidemiologist") extras.push(state.rerouteUsed ? "本轮已改道" : "本轮可改道 1 次");
      if (state.riot[state.pos[r]]) extras.push(`身处失控城市：行动 +1 点`);
      const card = idCard(role, portraits[role], "team", { samples, status: extras.length ? `● ${extras.join(" · ")}` : undefined });
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
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove("show"), 1800);
  }
}


