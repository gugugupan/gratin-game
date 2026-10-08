import { MUTATIONS } from "../../../engine/game.js";
import { MUTATION_INFO, REGION_NAMES, ROLE_INFO, ROLE_ORDER, STRAIN_NAME } from "../data";
import { tr } from "../i18n/locale";
import { el } from "../util";

interface RulesText {
  sections: [string, string][];
  roles: string;
  mutations: string;
  more: string;
  privacy: string;
}

const regions = REGION_NAMES.map((r, k) => `${r}（${STRAIN_NAME[k]}）`).join("、");

const TEXT: RulesText = tr({
  zh: {
    sections: [
      ["目标", "<p>在 12 轮之内研制出赤、苍、金三种解药。爆发达到 6 次、某一株病毒用完（布满全图），或者 12 轮结束还没研制完，都算失败。</p>"],
      ["纸乡", `<p>纸乡分为三个疫区：${regions}。每座城市只会被放上它所在疫区颜色的病毒，但爆发会把病毒带到相邻的其他疫区。</p>`],
      ["每一轮", '<ol><li><b>行动</b>两名队员共用 4 个行动点，可以任意穿插使用。点队员（地图上的立牌或底部的身份证）选择行动。</li><li><b>感染</b>按"结束行动"后进入感染阶段：如果这一轮有流行病，先结算流行病；然后一座一座感染 3 座城市，每座放 1 个它颜色的病毒。</li></ol>'],
      ["行动（多数花 1 点）", "<ul><li><b>移动</b>沿公路、铁路或航线走到相邻城市。</li><li><b>快速转移</b>在研究站或野战实验室之间直接转移。</li><li><b>治疗</b>移除所在城市 1 个病毒，并获得 1 个该株样本。已经研制出解药的病毒株一次全部清除，但不再给样本。</li><li><b>交接</b>把一株样本全部交给同城的队友。</li><li><b>研制</b>在研究站用 4 个同株样本研制解药。</li><li><b>建研究站</b>花 3 点，在所在城市建一座研究站，最多 3 座。</li></ul>"],
      ["爆发", "<p>城市里已经有 3 个同株病毒时，再放一个就会爆发：爆发次数 +1，向每座相邻城市各放 1 个同株病毒，可能引发连锁。一次连锁里每座城市只会爆发一次。</p>"],
      ["流行病与变异", "<p>一局有 3 次流行病：牌库最底下的城市一次放 3 个病毒，然后把已经感染过的城市洗回牌库顶，它们很快会再被感染。</p><p>每研制出一种解药，剩下的病毒就会产生抗性：下一次感染阶段开头，随机一株还没有解药的病毒发生 1 种变异；研制出第二种解药后，最后一株一次获得 2 种变异。</p>"],
      ["根除", "<p>研制出解药后，如果地图上这一株的病毒全部清空，就算根除：之后再也不会出现。</p>"],
      ["小提示", '<ul><li>行动阶段可以撤销（Cmd/Ctrl+Z），但预判感染或结束行动之后就不能撤回了。</li><li>刚被感染过的城市在流行病之后最危险。点城市可以看它下一轮被感染的概率。</li><li>游戏每一步都会自动存档，下次从菜单的"继续上局"接着玩。</li></ul>'],
    ],
    roles: "队员",
    mutations: "变异",
    more: "更多游戏 · Gratin Game",
    privacy: "隐私政策",
  },
  ja: {
    sections: [
      ["目標", "<p>12 ラウンド以内に赤・蒼・金の 3 つの治療薬を開発します。アウトブレイクが 6 回に達する、ある株の病原体が尽きる（地図中に広がる）、または 12 ラウンドが終わっても開発しきれないと失敗です。</p>"],
      ["紙の郷", `<p>紙の郷は 3 つの地域に分かれています：${regions}。都市にはその地域の色の病原体だけが置かれますが、アウトブレイクは隣の別の地域にも病原体を運びます。</p>`],
      ["1 ラウンドの流れ", "<ol><li><b>行動</b>2 人の隊員で行動ポイント 4 を共有し、好きな順番で使えます。地図の立て札か下の隊員証をタップして行動を選びます。</li><li><b>感染</b>「行動終了」で感染フェイズへ。エピデミックがあれば先に処理し、そのあと 3 都市を 1 つずつ感染させ、それぞれの色の病原体を 1 個置きます。</li></ol>"],
      ["行動（ほとんど 1 ポイント）", "<ul><li><b>移動</b>街道・鉄道・航路で隣の都市へ。</li><li><b>高速移動</b>研究所や野外ラボのあいだを直接移動。</li><li><b>治療</b>いる都市の病原体を 1 個除去し、その株のサンプルを 1 個得る。治療薬がある株は一度に全部除去できるが、サンプルは得られない。</li><li><b>受け渡し</b>同じ都市にいる仲間に、ある株のサンプルを全部渡す。</li><li><b>開発</b>研究所で同じ株のサンプル 4 個を使い治療薬を作る。</li><li><b>研究所を建設</b>3 ポイントでいる都市に研究所を建てる（最大 3 か所）。</li></ul>"],
      ["アウトブレイク", "<p>同じ株が 3 個ある都市にさらに置かれると、アウトブレイクします。回数が 1 増え、隣のすべての都市に同じ株を 1 個ずつ置きます。連鎖することもありますが、1 回の連鎖で同じ都市が 2 度アウトブレイクすることはありません。</p>"],
      ["エピデミックと変異", "<p>エピデミックは 1 ゲームに 3 回。山札の一番下の都市に病原体を 3 個置き、それまでに感染した都市を山札の上に戻します。それらの都市はすぐまた感染します。</p><p>治療薬を 1 つ開発するたびに、残りの病原体が耐性をつけます。次の感染フェイズの最初に、治療薬のない株のどれかがランダムに 1 つ変異し、2 つ目の治療薬のあとは最後の株が一度に 2 つ変異します。</p>"],
      ["根絶", "<p>治療薬を開発したあと、その株の病原体が地図からすべて消えると根絶です。以後その株は現れません。</p>"],
      ["ヒント", "<ul><li>行動フェイズ中は取り消せます（Cmd/Ctrl+Z）。ただし感染予測や行動終了のあとは戻せません。</li><li>エピデミックの直後は、最近感染した都市がいちばん危険です。都市をタップすると次のラウンドの感染確率が見られます。</li><li>1 手ごとに自動で保存されます。続きはメニューの「つづきから」で。</li></ul>"],
    ],
    roles: "隊員",
    mutations: "変異",
    more: "ほかのゲーム · グラタンゲーム",
    privacy: "プライバシーポリシー",
  },
  en: {
    sections: [
      ["Goal", "<p>Develop all three cures (Red, Blue and Gold) within 12 rounds. You lose if outbreaks reach 6, if one strain runs out of viruses to place, or if round 12 ends without all three cures.</p>"],
      ["Papermark", `<p>Papermark has three regions: ${REGION_NAMES.map((r, k) => `${r} (${STRAIN_NAME[k]})`).join(", ")}. A city only ever receives viruses of its own region's colour, but outbreaks carry them into neighbouring regions.</p>`],
      ["Each round", "<ol><li><b>Act</b> Your two agents share 4 actions and can take them in any order. Tap an agent (the standee on the map or the ID card below) to choose.</li><li><b>Infect</b> After End turn comes the infection phase. Any epidemic resolves first; then 3 cities are infected one by one, each gaining 1 virus of its colour.</li></ol>"],
      ["Actions (most cost 1)", "<ul><li><b>Move</b> along a road, railway or sea route to a neighbouring city.</li><li><b>Fly</b> straight between research stations and field labs.</li><li><b>Treat</b> removes 1 virus here and gives 1 sample of that strain. Once a strain is cured, a treat clears all of it but gives no sample.</li><li><b>Hand over</b> all samples of one strain to a teammate in the same city.</li><li><b>Develop cure</b> at a research station using 4 samples of one strain.</li><li><b>Build station</b> for 3 AP in your city, up to 3 in total.</li></ul>"],
      ["Outbreaks", "<p>A city that already holds 3 viruses of a strain breaks out when another arrives: outbreaks +1, and each neighbouring city gets 1 of that strain. Chains can follow, but a city breaks out at most once per chain.</p>"],
      ["Epidemics and mutations", "<p>There are 3 epidemics a game. Each puts 3 viruses on the city at the bottom of the deck, then shuffles every infected city back on top, so they will be hit again soon.</p><p>Every cure makes the remaining viruses fight back: at the start of the next infection phase, a random uncured strain gains 1 mutation. After the second cure, the last strain gains 2 at once.</p>"],
      ["Eradication", "<p>If a cured strain has no viruses left anywhere on the map, it is eradicated and never returns.</p>"],
      ["Tips", "<ul><li>You can undo during the action phase (Cmd/Ctrl+Z), but not past a forecast reveal or the end of your turn.</li><li>Right after an epidemic, recently infected cities are the most dangerous. Tap a city to see its chance of infection next round.</li><li>Every step is saved automatically. Pick up again from Continue on the menu.</li></ul>"],
    ],
    roles: "Agents",
    mutations: "Mutations",
    more: "More games · Gratin Game",
    privacy: "Privacy policy",
  },
});

export class Rules {
  private root = el("rules");

  constructor() {
    const roles = ROLE_ORDER.map((r) => `<li><b>${ROLE_INFO[r].name}</b>${ROLE_INFO[r].ability}</li>`).join("");
    const muts = MUTATIONS.map((m) => `<li><b>${MUTATION_INFO[m].name}</b>${MUTATION_INFO[m].text}</li>`).join("");
    const section = ([title, body]: [string, string]) => `<section><h3>${title}</h3>${body}</section>`;
    const s = TEXT.sections;
    this.root.querySelector(".rules-body")!.innerHTML = `
      ${s.slice(0, 6).map(section).join("")}
      <section><h3>${TEXT.mutations}</h3><ul class="defs">${muts}</ul></section>
      ${section(s[6])}
      <section><h3>${TEXT.roles}</h3><ul class="defs">${roles}</ul></section>
      ${section(s[7])}
      <footer class="rules-foot">
        <a href="../">${TEXT.more}</a>
        <a href="../privacy/">${TEXT.privacy}</a>
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
