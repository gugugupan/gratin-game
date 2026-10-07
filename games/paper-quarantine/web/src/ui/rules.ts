import { ROLE_ORDER, MUTATION_INFO, ROLE_INFO } from "../data";
import { MUTATIONS } from "../../../engine/game.js";
import { el } from "../util";

export class Rules {
  private root = el("rules");

  constructor() {
    const roles = ROLE_ORDER.map((r) => `<li><b>${ROLE_INFO[r].name}</b>${ROLE_INFO[r].ability}</li>`).join("");
    const muts = MUTATIONS.map((m) => `<li><b>${MUTATION_INFO[m].name}</b>${MUTATION_INFO[m].text}</li>`).join("");
    this.root.querySelector(".rules-body")!.innerHTML = `
      <section>
        <h3>目标</h3>
        <p>在 12 轮之内研制出赤、苍、金三种解药。爆发达到 6 次、某一株病毒用完（布满全图），或者 12 轮结束还没研制完，都算失败。</p>
      </section>
      <section>
        <h3>每一轮</h3>
        <ol>
          <li><b>行动</b>两名队员共用 4 个行动点，可以任意穿插使用。点队员（地图上的立牌或底部的身份证）选择行动。</li>
          <li><b>感染</b>按"结束行动"后进入感染阶段：如果这一轮有流行病，先结算流行病；然后点名 3 座城市，每座放 1 个它颜色的病毒。</li>
        </ol>
      </section>
      <section>
        <h3>行动（多数花 1 点）</h3>
        <ul>
          <li><b>移动</b>走到相邻城市。</li>
          <li><b>快速转移</b>在研究站或野战实验室之间直接转移。</li>
          <li><b>治疗</b>移除所在城市 1 个病毒，并获得 1 个该株样本。已经研制出解药的病毒株一次全部清除，但不再给样本。</li>
          <li><b>交接</b>把一株样本全部交给同城的队友。</li>
          <li><b>研制</b>在研究站用 4 个同株样本研制解药。</li>
          <li><b>建研究站</b>花 3 点，在所在城市建一座研究站，最多 3 座。</li>
        </ul>
      </section>
      <section>
        <h3>爆发</h3>
        <p>城市里已经有 3 个同株病毒时，再放一个就会爆发：爆发次数 +1，向每座相邻城市各放 1 个同株病毒，可能引发连锁。一次连锁里每座城市只会爆发一次。</p>
      </section>
      <section>
        <h3>流行病与变异</h3>
        <p>流行病会让牌库最底下的城市一次放 3 个病毒，然后把已经点过名的城市洗回牌库顶，它们很快会再被点名。接着翻出 2 张变异卡，选 1 张交给一株还没研制出解药的病毒。</p>
        <ul class="defs">${muts}</ul>
      </section>
      <section>
        <h3>根除</h3>
        <p>研制出解药后，如果地图上这一株的病毒全部清空，就算根除：之后再也不会出现。</p>
      </section>
      <section>
        <h3>队员</h3>
        <ul class="defs">${roles}</ul>
      </section>
      <section>
        <h3>小提示</h3>
        <ul>
          <li>行动阶段可以撤销（Cmd/Ctrl+Z），但预判翻牌或结束行动之后就不能撤回了。</li>
          <li>刚被点名过的城市在流行病之后最危险。</li>
          <li>游戏每一步都会自动存档，下次从菜单的"继续上局"接着玩。</li>
        </ul>
      </section>
      <footer class="rules-foot">
        <a href="../">更多游戏 · Gratin Game</a>
        <a href="../privacy/">隐私政策</a>
      </footer>`;
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
    this.root.querySelector<HTMLElement>("[data-close]")?.focus({ preventScroll: true });
  }

  close(): void {
    this.root.hidden = true;
  }
}
