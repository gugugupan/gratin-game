import type { RoleId, State } from "../../../engine/game.js";
import { GAME_NAME, MUTATION_INFO, ROLE_INFO, STRAIN_CSS, STRAIN_NAME } from "../data";
import { tr } from "../i18n/locale";

const REP = tr({
  zh: {
    title: "行动报告", win: "防疫成功", lose: "防疫失败", wonIn: (n: number) => `第 ${n} 轮控制住了疫情`,
    loss: { outbreaks: "爆发达到上限，疫情失控", cubes: "某一株病毒已经布满全图", time: "12 轮内没能研制出全部解药" },
    stat: { rounds: "进行轮数", outbreaks: "爆发", cures: "解药", removed: "清除病毒", moves: "移动", treats: "治疗", caught: "封城拦截样本", epidemics: "流行病" },
    cureLine: (s: string, r: number, e: number | null) => `${s} · 第 ${r} 轮研制${e ? ` · 第 ${e} 轮根除` : ""}`,
    noCure: "没有研制出解药", mutations: "变异", noMutation: "没有发生变异", menu: "回到菜单", draft: "换人再来", again: "同队再来",
  },
  ja: {
    title: "作戦報告", win: "防疫成功", lose: "防疫失敗", wonIn: (n: number) => `第 ${n} ラウンドで感染を抑え込んだ`,
    loss: { outbreaks: "アウトブレイクが上限に達した", cubes: "ある株の病原体が尽きるほど広がった", time: "12 ラウンドで治療薬がそろわなかった" },
    stat: { rounds: "ラウンド", outbreaks: "アウトブレイク", cures: "治療薬", removed: "除去した病原体", moves: "移動", treats: "治療", caught: "封鎖で得たサンプル", epidemics: "エピデミック" },
    cureLine: (s: string, r: number, e: number | null) => `${s} · 第 ${r} ラウンドに開発${e ? ` · 第 ${e} ラウンドに根絶` : ""}`,
    noCure: "治療薬は開発できなかった", mutations: "変異", noMutation: "変異は起きなかった", menu: "メニューへ", draft: "隊員を替えて再挑戦", again: "同じ隊で再挑戦",
  },
  en: {
    title: "Mission report", win: "CONTAINED", lose: "FAILED", wonIn: (n: number) => `Contained in round ${n}`,
    loss: { outbreaks: "Outbreaks hit the limit", cubes: "One strain ran out of viruses to place", time: "Not all cures were ready within 12 rounds" },
    stat: { rounds: "Rounds", outbreaks: "Outbreaks", cures: "Cures", removed: "Viruses cleared", moves: "Moves", treats: "Treats", caught: "Lockdown samples", epidemics: "Epidemics" },
    cureLine: (s: string, r: number, e: number | null) => `${s} · cured in round ${r}${e ? ` · eradicated in round ${e}` : ""}`,
    noCure: "No cures developed", mutations: "Mutations", noMutation: "No mutations", menu: "Menu", draft: "New team", again: "Same team again",
  },
});
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

  show(state: State, portraits: Record<RoleId, string>): Promise<ReportChoice> {
    const won = state.status === "won";
    const st = state.stats;
    const cures = st.cures
      .map((c) => `<li><span class="dot" style="--c: var(${STRAIN_CSS[c.strain]})"></span>${REP.cureLine(STRAIN_NAME[c.strain], c.round, c.eradicatedRound)}</li>`)
      .join("") || `<li>${REP.noCure}</li>`;
    const muts = st.mutations
      .map((m) => `<li><span class="dot" style="--c: var(${STRAIN_CSS[m.strain]})"></span>${STRAIN_NAME[m.strain]} · ${MUTATION_INFO[m.m].name}</li>`)
      .join("") || `<li>${REP.noMutation}</li>`;
    const team = state.roles
      .map((r) => `<span class="report-member"><img src="${portraits[r]}" alt="">${ROLE_INFO[r].name}</span>`)
      .join("");
    const a = st.actions;
    this.root.querySelector(".report-card")!.innerHTML = `
      <span class="report-stamp ${won ? "win" : "lose"}">${won ? REP.win : REP.lose}</span>
      <header>
        <small>${GAME_NAME} · ${REP.title}</small>
        <h2>${won ? REP.wonIn(state.round) : REP.loss[state.lossReason ?? "time"]}</h2>
      </header>
      <div class="report-team">${team}</div>
      <dl class="report-stats">
        <div><dt>${REP.stat.rounds}</dt><dd class="num">${state.round} / ${state.cfg.rounds}</dd></div>
        <div><dt>${REP.stat.outbreaks}</dt><dd class="num">${state.outbreaks} / ${state.cfg.outbreakLimit}</dd></div>
        <div><dt>${REP.stat.cures}</dt><dd class="num">${state.curedCount()} / 3</dd></div>
        <div><dt>${REP.stat.removed}</dt><dd class="num">${st.cubesRemoved}</dd></div>
        <div><dt>${REP.stat.moves}</dt><dd class="num">${a.move + a.fly}</dd></div>
        <div><dt>${REP.stat.treats}</dt><dd class="num">${a.treat}</dd></div>
        <div><dt>${REP.stat.caught}</dt><dd class="num">${st.samplesCaught}</dd></div>
        <div><dt>${REP.stat.epidemics}</dt><dd class="num">${state.epidemicsDone}</dd></div>
      </dl>
      <div class="report-lists">
        <section><h3>${REP.stat.cures}</h3><ul>${cures}</ul></section>
        <section><h3>${REP.mutations}</h3><ul>${muts}</ul></section>
      </div>
      <footer class="report-actions">
        <button class="text-btn dark" type="button" data-choice="menu">${REP.menu}</button>
        <button class="text-btn dark" type="button" data-choice="draft">${REP.draft}</button>
        <button class="stamp-btn" type="button" data-choice="again">${REP.again}</button>
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
