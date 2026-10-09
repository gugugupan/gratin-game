import { el } from "../util";

const BODY = `
  <section><h3>目标</h3><p>12 轮之内研制出赤、苍、金三种解药。<b>3 座城市同时失控</b>，或者 12 轮结束还没研制完，就失败。获胜时按没有失控的城市人口和剩余轮数打分。</p></section>
  <section><h3>每一轮</h3><ol>
    <li><b>新闻</b>本轮的新闻生效（上一轮已经预告），同时预告下一轮的新闻。</li>
    <li><b>行动</b>两名队员共用 4 个行动点。</li>
    <li><b>传播</b>结束行动后：路上的携带者前进一步，到站的让城市感染 +1；感染 3 级的城市派出新的携带者；结算恐慌。</li>
  </ol></section>
  <section><h3>携带者</h3><p>感染满 3 级的城市每轮派出 1 个携带者，按运力随机选一条线路（铁路 3、公路 2、航线 1）。公路和铁路走 1 轮，航线走 2 轮。路线和到达时间全部公开：纸片头上的数字是还要几轮到达，城市旁的红色 <b>+n</b> 是本轮结束时会进城的数量。</p>
  <p>携带者进入一座这一株已经满 3 级的城市时<b>爆发</b>：向所有邻城各派 1 个携带者（下一轮才出发），本城恐慌 +30、邻城 +15。</p></section>
  <section><h3>恐慌和失控</h3><p>城区外圈是恐慌。感染 +1 时 +10，被封城每轮 +25；治疗每降 1 级 −10，拦下驶来的携带者 −15，一整轮零感染 −10，研制出解药时该疫区全部 −40。恐慌满 100 失控：每轮多派 1 个携带者，在城里行动多花 1 点；降到 60 以下恢复。</p></section>
  <section><h3>行动</h3><ul>
    <li><b>移动 / 快速转移 / 治疗 / 交接 / 研制 / 建研究站</b>同 v1。治疗每降 1 级得 1 个样本，研制需要 4 个（研究员 3 个）。</li>
    <li><b>检查站</b>（1 点）在所在城市连出的一条线路上设检查站，拦下第一个经过的携带者，得到 1 个样本。最多同时 2 个。</li>
    <li><b>封城</b>（1 点）对所在或相邻城市下令：不派出、也不放进携带者，城里感染不再上升；但恐慌每轮 +25。解封不花点数。</li>
    <li><b>物资补给</b>（1 点）所在城市和邻城 2 轮内恐慌上涨减半。</li>
  </ul></section>
  <section><h3>新闻</h3><p>风平浪静、纸都花灯节（铁路运力翻倍）、海雾（航线停运）、雨季（公路要走 2 轮）、货轮靠港（港口来 2 个外来携带者）、谣言（一个疫区恐慌 +15）、疫情高峰（已感染城市各 +1）。</p></section>
  <section><h3>变异</h3><p>研制出第 1 种解药后，随机一株发生 1 种变异；第 2 种之后最后一株一次 2 种。突破：每轮无视 1 次检查站或封城；耐药：研制多 1 个样本；烈性：3 级城市多派 1 个；顽固：治疗每次只降 1 级；急性：2 级就满。</p></section>
`;

export class Rules {
  private root = el("rules");

  constructor() {
    this.root.querySelector(".rules-body")!.innerHTML = BODY;
    this.root.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("[data-close]") || e.target === this.root) this.close();
    });
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close();
    });
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    this.root.hidden = false;
  }

  close(): void {
    this.root.hidden = true;
  }
}
