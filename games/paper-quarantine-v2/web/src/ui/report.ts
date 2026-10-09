import { POPULATION, type V2State } from "../../../engine/game.js";
import type { RoleId } from "../../../engine/roles.js";
import { ROLE_INFO, STRAIN_CSS, STRAIN_NAME } from "../data";
import { el } from "../util";

export type ReportChoice = "again" | "draft" | "menu";

export class Report {
  private root = el("report");
  private resolve: ((c: ReportChoice) => void) | null = null;

  constructor() {
    this.root.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-choice]");
      if (b) this.finish(b.dataset.choice as ReportChoice);
    });
  }

  show(s: V2State, portraits: Record<RoleId, string>): Promise<ReportChoice> {
    const won = s.status === "won";
    const safe = POPULATION.reduce((n, p, c) => n + (s.riot[c] ? 0 : p), 0);
    const team = s.roles.map((r) => `<span class="report-member"><img src="${portraits[r]}" alt="">${ROLE_INFO[r].name}</span>`).join("");
    const cures = [0, 1, 2].map((k) => `<li><span class="dot" style="--c: var(${STRAIN_CSS[k]})"></span>${STRAIN_NAME[k]} · ${s.cured[k] ? "已研制" : "未研制"}</li>`).join("");
    const a = s.stats.actions;
    this.root.querySelector(".report-card")!.innerHTML = `
      <span class="report-stamp ${won ? "win" : "lose"}">${won ? "防疫成功" : "防疫失败"}</span>
      <header>
        <small>纸上防疫 v2 · 行动报告</small>
        <h2>${won ? `第 ${s.round} 轮控制住了疫情 · 得分 ${s.score()}` : s.lossReason === "riot" ? `${s.cfg.riotLimit} 座城市同时失控` : "12 轮内没能研制出全部解药"}</h2>
      </header>
      <div class="report-team">${team}</div>
      <dl class="report-stats">
        <div><dt>进行轮数</dt><dd class="num">${s.round} / ${s.cfg.rounds}</dd></div>
        <div><dt>安全人口</dt><dd class="num">${safe} 万</dd></div>
        <div><dt>最多同时失控</dt><dd class="num">${s.stats.peakRiots}</dd></div>
        <div><dt>爆发</dt><dd class="num">${s.stats.outbreaks}</dd></div>
        <div><dt>派出的携带者</dt><dd class="num">${s.stats.carriers}</dd></div>
        <div><dt>检查站拦截</dt><dd class="num">${s.stats.intercepted}</dd></div>
        <div><dt>封城挡下</dt><dd class="num">${s.stats.blocked}</dd></div>
        <div><dt>封城 / 补给</dt><dd class="num">${a.lock} / ${a.supply}</dd></div>
      </dl>
      <div class="report-lists"><section><h3>解药</h3><ul>${cures}</ul></section></div>
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
