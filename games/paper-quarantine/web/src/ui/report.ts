import type { RoleId, State } from "../../../engine/game.js";
import { MUTATION_INFO, ROLE_INFO, STRAIN_CSS, STRAIN_SHORT } from "../data";
import { el } from "../util";

export type ReportChoice = "again" | "draft" | "menu";

const LOSS_TEXT = {
  outbreaks: "爆发达到上限，疫情失控",
  cubes: "某一株病毒已经布满全图",
  time: "12 轮内没能研制出全部解药",
} as const;

export class Report {
  private root = el("report");
  private resolve: ((c: ReportChoice) => void) | null = null;

  constructor() {
    this.root.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-choice]");
      if (b) this.finish(b.dataset.choice as ReportChoice);
    });
  }

  show(state: State, portraits: Record<RoleId, string>): Promise<ReportChoice> {
    const won = state.status === "won";
    const st = state.stats;
    const cures = st.cures
      .map((c) => `<li><span class="dot" style="--c: var(${STRAIN_CSS[c.strain]})"></span>${STRAIN_SHORT[c.strain]}株 · 第 ${c.round} 轮研制${c.eradicatedRound ? ` · 第 ${c.eradicatedRound} 轮根除` : ""}</li>`)
      .join("") || "<li>没有研制出解药</li>";
    const muts = st.mutations
      .map((m) => `<li><span class="dot" style="--c: var(${STRAIN_CSS[m.strain]})"></span>${STRAIN_SHORT[m.strain]}株 · ${MUTATION_INFO[m.m].name}</li>`)
      .join("") || "<li>没有发生变异</li>";
    const team = state.roles
      .map((r) => `<span class="report-member"><img src="${portraits[r]}" alt="">${ROLE_INFO[r].name}</span>`)
      .join("");
    const a = st.actions;
    this.root.querySelector(".report-card")!.innerHTML = `
      <span class="report-stamp ${won ? "win" : "lose"}">${won ? "防疫成功" : "防疫失败"}</span>
      <header>
        <small>纸上防疫 · 行动报告</small>
        <h2>${won ? `第 ${state.round} 轮控制住了疫情` : LOSS_TEXT[state.lossReason ?? "time"]}</h2>
      </header>
      <div class="report-team">${team}</div>
      <dl class="report-stats">
        <div><dt>进行到</dt><dd class="num">${state.round} / ${state.cfg.rounds} 轮</dd></div>
        <div><dt>爆发</dt><dd class="num">${state.outbreaks} / ${state.cfg.outbreakLimit} 次</dd></div>
        <div><dt>解药</dt><dd class="num">${state.curedCount()} / 3 种</dd></div>
        <div><dt>清除病毒</dt><dd class="num">${st.cubesRemoved} 个</dd></div>
        <div><dt>移动</dt><dd class="num">${a.move + a.fly} 次</dd></div>
        <div><dt>治疗</dt><dd class="num">${a.treat} 次</dd></div>
        <div><dt>封城拦截样本</dt><dd class="num">${st.samplesCaught} 个</dd></div>
        <div><dt>流行病</dt><dd class="num">${state.epidemicsDone} 次</dd></div>
      </dl>
      <div class="report-lists">
        <section><h3>解药</h3><ul>${cures}</ul></section>
        <section><h3>变异</h3><ul>${muts}</ul></section>
      </div>
      <footer class="report-actions">
        <button class="text-btn dark" type="button" data-choice="menu">回到菜单</button>
        <button class="text-btn dark" type="button" data-choice="draft">换人再来</button>
        <button class="stamp-btn" type="button" data-choice="again">同队再来</button>
      </footer>`;
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.querySelector<HTMLElement>(".stamp-btn")?.focus({ preventScroll: true }));
    return new Promise((res) => { this.resolve = res; });
  }

  private finish(choice: ReportChoice): void {
    this.root.hidden = true;
    const r = this.resolve;
    this.resolve = null;
    r?.(choice);
  }
}
