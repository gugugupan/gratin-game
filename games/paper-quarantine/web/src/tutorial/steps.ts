import type { Action, GameEvent, RoleId, State } from "../../../engine/game.js";
import { CITY_NAMES, REGION_NAMES } from "../data";
import { tr } from "../i18n/locale";
import type { Anchor } from "../ui/coach";

export type Part =
  | "ap" | "track" | "cures" | "drawn" | "help" | "team" | "end" | "undo"
  | "cube" | "pin" | "calendar" | "station" | "researcher";

export const PARTS: Part[] = ["ap", "track", "cures", "drawn", "help", "team", "end", "undo", "cube", "pin", "calendar", "station", "researcher"];

export interface TutorialHost {
  readonly state: State | null;
  reveal(part: Part, on: boolean): void;
  follow(role: RoleId): void;
  focusCity(city: number): void;
  clearHistory(): void;
  finish(): void;
}

interface StepLogic {
  reveal?: Part[];
  focus?: string;
  anchor?: Anchor;
  allow?: (a: Action, s: State) => boolean;
  endTurn?: boolean;
  undo?: boolean;
  button?: boolean;
  done?: (s: State) => boolean;
  on?: "pan" | "undo" | "round";
  enter?: (h: TutorialHost) => void;
}

export interface Step extends Omit<StepLogic, "button"> {
  title: string;
  text: string;
  button?: string;
}

export interface Note {
  title: string;
  text: string;
  match: (e: GameEvent) => boolean;
  reveal?: Part[];
  focus?: string;
  anchor?: (e: GameEvent) => Anchor | undefined;
}

const MEDIC = 0;
const RESEARCHER = 1;
const RED = 0;
const CAPITAL = 0, CINNABAR = 1, SEALWELL = 2, ROUGE = 3, REDLEAF = 4, GOLDGRAIN = 17;
const c = (i: number) => `<b>${CITY_NAMES[i]}</b>`;

const move = (r: number, to?: number) => (a: Action) => a.t === "move" && a.r === r && (to === undefined || a.to === to);

const LOGIC: StepLogic[] = [
  { on: "pan", button: true, enter: (h) => h.follow("medic") },
  {
    reveal: ["ap", "cube"], focus: ".hud .ap", anchor: { role: "medic" },
    allow: (a, s) => a.t === "move" && a.r === MEDIC && ((s.pos[MEDIC] === CAPITAL && a.to === CINNABAR) || (s.pos[MEDIC] === CINNABAR && a.to === REDLEAF)),
    done: (s) => s.pos[MEDIC] === REDLEAF,
    enter: (h) => h.follow("medic"),
  },
  {
    reveal: ["team"], focus: "#team-cards", anchor: { role: "medic" },
    allow: (a) => a.t === "treat" && a.r === MEDIC && a.s === RED,
    done: (s) => s.sample(MEDIC, RED) >= 1,
  },
  { anchor: { role: "medic" }, allow: move(MEDIC, ROUGE), done: (s) => s.pos[MEDIC] === ROUGE },
  { reveal: ["end", "drawn", "pin", "calendar"], focus: "#end-turn", anchor: { el: "#end-turn" }, endTurn: true, on: "round" },
  { reveal: ["researcher"], focus: "#team-cards", anchor: { role: "researcher" }, button: true, enter: (h) => h.follow("researcher") },
  {
    anchor: { role: "medic" },
    allow: (a) => a.t === "treat" && a.r === MEDIC && a.s === RED,
    done: (s) => s.sample(MEDIC, RED) >= 2,
    enter: (h) => h.follow("medic"),
  },
  { anchor: { role: "researcher" }, allow: move(RESEARCHER, ROUGE), done: (s) => s.pos[RESEARCHER] === ROUGE, enter: (h) => h.follow("researcher") },
  { anchor: { role: "researcher" }, allow: move(RESEARCHER), done: (s) => s.pos[RESEARCHER] !== ROUGE, enter: (h) => h.clearHistory() },
  { reveal: ["undo"], focus: "#undo", anchor: { el: "#undo" }, undo: true, on: "undo" },
  {
    anchor: { role: "medic" },
    allow: (a) => a.t === "give" && a.r === MEDIC && a.s === RED,
    done: (s) => s.sample(RESEARCHER, RED) >= 3,
    enter: (h) => h.follow("medic"),
  },
  {
    reveal: ["cures"], focus: ".hud .cures", anchor: { role: "researcher" },
    allow: (a) => a.t === "cure" && a.r === RESEARCHER && a.s === RED,
    done: (s) => !!s.cured[RED],
    enter: (h) => h.follow("researcher"),
  },
  { focus: "#end-turn", anchor: { el: "#end-turn" }, endTurn: true, on: "round" },
  { reveal: ["station"], anchor: { city: CAPITAL }, button: true, enter: (h) => h.focusCity(CAPITAL) },
  { reveal: ["help", "track"], focus: "#help", anchor: { el: "#help" }, button: true, enter: (h) => h.follow("medic") },
];

type Copy = [title: string, text: string, button?: string];
type NoteKey = "named" | "outbreak" | "epidemic" | "intensify" | "guarded";

interface CoachCopy {
  steps: Copy[];
  notes: Record<NoteKey, [string, string]>;
  mutation: [string, string];
  ui: { step: (n: number, of: number) => string; infection: string; next: string; choose: string };
}

const COPY = tr<CoachCopy>({
  zh: {
    steps: [
      ["防疫地图", `这是纸乡的防疫地图。18 座城市分属${REGION_NAMES.join("、")}三个疫区，公路、铁路和航线把它们连在一起。先<b>按住地图拖动</b>，看一看全貌。`, "跳过"],
      ["移动", `地图上出现了病毒。${c(REDLEAF)}有 2 个赤株病毒。点<b>急救队员</b>的立牌，选「移动」，先到${c(CINNABAR)}，再到${c(REDLEAF)}。<br>每个行动花 1 个行动点，左上角的打孔卡记着还剩几点。`],
      ["治疗和样本", "到了。再点急救队员，选「治疗 · 赤株」。急救队员治疗一次就能清空这座城市的同株病毒，还会得到 1 个<b>样本</b>，记在下方的身份证上。样本是研制解药的材料。"],
      ["最后 1 点", `还剩 1 个行动点。旁边的${c(SEALWELL)}已经堆了 3 个病毒，很危险，可是走过去也来不及治疗了。先移动到${c(ROUGE)}，为下一轮做准备。`],
      ["结束行动", "行动点用完了。按「结束行动」进入<b>感染阶段</b>：会感染 3 座城市，每座放 1 个它颜色的病毒。地图上方的日历记录轮数，一局共 12 轮。"],
      ["第二名队员", `<b>研究员</b>从${c(GOLDGRAIN)}赶来，还带着 1 个赤株样本。两名队员<b>共用 4 个行动点</b>，谁先谁后、怎么穿插都可以。研究员研制解药只要 3 个样本，而且在哪都能研制。`, "知道了"],
      ["再次治疗", `${c(ROUGE)}被爆发波及，现在有 2 个病毒。让急救队员<b>治疗</b>，手上的赤株样本会变成 2 个。`],
      ["汇合", `交接样本需要两人在同一座城市。点<b>研究员</b>，移动到${c(ROUGE)}。`],
      ["撤销", "先试试<b>撤销</b>：让研究员随便再走一步。"],
      ["撤销", "走错了也不要紧。按「撤销」（或 Cmd/Ctrl+Z），行动点也会退回来。<br>但结束行动之后出现了新的随机结果，就不能再撤销到之前了。"],
      ["交接", "点急救队员，选「交接 · 赤株」，把 2 个样本交给同城的研究员。"],
      ["研制解药", "研究员凑齐了 3 个赤株样本。点研究员，选「研制 · 赤株」。顶部的解药栏记录进度，<b>三种解药全部研制出来就获胜</b>。"],
      ["流行病要来了", "赤株解药研制成功！今后治疗赤株一次就能全部清除，急救队员所在的城市也不会再被放赤株。<br>按「结束行动」。这一轮会发生<b>流行病</b>。"],
      ["研究站和快速转移", `${c(CAPITAL)}有一座<b>研究站</b>。除了研究员，其他人都要在研究站里才能研制。花 3 点可以在所在城市建一座研究站（最多 3 座）；在两座研究站之间，花 1 点就能<b>快速转移</b>。`, "下一步"],
      ["更多队员", "除了急救队员和研究员，还有 6 种职业：警察驻守封城，流行病学家预判感染，工程师搭野战实验室……正式游戏开局时，从 8 人中任选 2 人。<br><b>失败条件</b>：爆发满 6 次、某一株病毒用完，或者 12 轮结束还没研制完。忘了规则就点右上角的「?」。", "完成教程"],
    ],
    notes: {
      named: ["感染城市", `这一轮要感染 3 座城市。它们会一座一座出现在顶部的「本轮感染」里，地图上也会插上图钉，每座放 1 个它颜色的病毒。<br>第一座就是${c(SEALWELL)}，它已经有 3 个病毒了……`],
      outbreak: ["爆发！", "一座城市已经有 3 个同株病毒，再放病毒就会<b>爆发</b>：向每座相邻城市各扩散 1 个，还可能连锁。顶部的爆发计数满 6 次就失败。"],
      epidemic: ["流行病", "<b>流行病</b>：牌库最底下的城市一次放 3 个病毒。一局会有 4 次流行病，日历上记着已经发生了几次。"],
      intensify: ["洗回牌库顶", "接着，感染过的城市会被洗回牌库顶，所以<b>最近被感染的城市很快会再被感染</b>。记住它们，是预判风险的关键。"],
      guarded: ["急救队员守城", `赤株已经有解药，急救队员所在的${c(ROUGE)}不会再被放赤株。`],
    },
    mutation: ["变异", "每次流行病还会翻出 2 张<b>变异卡</b>。选 1 张交给一株病毒，而且只能交给还没研制出解药的株。挑对你影响最小的组合。"],
    ui: { step: (n, of) => `教程 ${n} / ${of}`, infection: "感染阶段", next: "继续", choose: "去选择" },
  },
  ja: {
    steps: [
      ["防疫地図", `紙の郷の防疫地図です。18 の都市が${REGION_NAMES.join("・")}の 3 地域に分かれ、街道・鉄道・航路でつながっています。まず<b>地図をドラッグ</b>して全体を見てみましょう。`, "スキップ"],
      ["移動", `地図に病原体が現れました。${c(REDLEAF)}に赤株が 2 個あります。<b>救急隊員</b>の立て札をタップし、「移動」で${c(CINNABAR)}、つづけて${c(REDLEAF)}へ向かいましょう。<br>行動 1 回につき行動ポイントを 1 使います。残りは左上のパンチカードで確認できます。`],
      ["治療とサンプル", "着きました。もう一度救急隊員をタップし、「治療 · 赤株」を選びます。救急隊員は 1 回の治療でこの都市の同じ株をすべて取り除き、<b>サンプル</b>を 1 個得ます。サンプルは下の隊員証に記録され、治療薬の材料になります。"],
      ["残り 1 ポイント", `行動ポイントはあと 1。隣の${c(SEALWELL)}にはもう 3 個たまっていて危険ですが、今から行っても治療は間に合いません。次のラウンドに備えて${c(ROUGE)}へ移動しましょう。`],
      ["行動終了", "行動ポイントを使い切りました。「行動終了」で<b>感染フェイズ</b>へ。3 都市が感染し、それぞれその色の病原体が 1 個置かれます。地図の上のカレンダーはラウンド数で、1 ゲームは 12 ラウンドです。"],
      ["2 人目の隊員", `<b>研究員</b>が${c(GOLDGRAIN)}から駆けつけました。赤株のサンプルを 1 個持っています。2 人は<b>行動ポイント 4 を共有</b>し、どちらがどの順で使ってもかまいません。研究員はサンプル 3 個で、どこでも治療薬を開発できます。`, "わかった"],
      ["もう一度治療", `${c(ROUGE)}にもアウトブレイクの影響が及び、病原体が 2 個になりました。救急隊員で<b>治療</b>すると、赤株のサンプルが 2 個になります。`],
      ["合流", `サンプルを渡すには、2 人が同じ都市にいる必要があります。<b>研究員</b>をタップして${c(ROUGE)}へ移動しましょう。`],
      ["取り消し", "<b>取り消し</b>を試してみましょう。研究員をどこかへもう 1 歩動かしてください。"],
      ["取り消し", "間違えても大丈夫。「戻す」（または Cmd/Ctrl+Z）で行動ポイントも戻ります。<br>ただし行動終了のあとは新しい偶然が起きるので、そこより前には戻せません。"],
      ["受け渡し", "救急隊員をタップし、「受け渡し · 赤株」で 2 個のサンプルを同じ都市の研究員に渡しましょう。"],
      ["治療薬の開発", "研究員の赤株サンプルが 3 個そろいました。研究員をタップして「開発 · 赤株」を選びます。上の治療薬欄で進み具合がわかり、<b>3 つそろえば勝利</b>です。"],
      ["エピデミックが来る", "赤株の治療薬が完成！これからは赤株を 1 回の治療ですべて除去でき、救急隊員のいる都市には赤株が置かれなくなります。<br>「行動終了」を押しましょう。このラウンドは<b>エピデミック</b>が起きます。"],
      ["研究所と高速移動", `${c(CAPITAL)}には<b>研究所</b>があります。研究員以外は研究所にいないと開発できません。3 ポイントでいる都市に研究所を建てられ（最大 3 か所）、研究所どうしは 1 ポイントで<b>高速移動</b>できます。`, "次へ"],
      ["ほかの隊員", "救急隊員と研究員のほかに 6 つの職業があります。警察官は駐在封鎖、疫学者は感染予測、技師は野外ラボ……本番では 8 人から 2 人を選びます。<br><b>失敗条件</b>：アウトブレイク 6 回、ある株の病原体が尽きる、12 ラウンドで治療薬がそろわない。ルールは右上の「?」でいつでも見られます。", "チュートリアル完了"],
    ],
    notes: {
      named: ["感染都市", `このラウンドは 3 都市が感染します。上の「今回の感染」に 1 つずつ表示され、地図にもピンが立ち、それぞれの色の病原体が 1 個置かれます。<br>最初は${c(SEALWELL)}。すでに 3 個たまっています……`],
      outbreak: ["アウトブレイク！", "同じ株が 3 個ある都市にさらに置かれると<b>アウトブレイク</b>。隣のすべての都市に 1 個ずつ広がり、連鎖することもあります。上のカウンターが 6 回に達すると失敗です。"],
      epidemic: ["エピデミック", "<b>エピデミック</b>：山札の一番下の都市に病原体を 3 個置きます。1 ゲームに 4 回起き、カレンダーに回数が記録されます。"],
      intensify: ["山札の上へ", "続いて、感染した都市が山札の上に戻されます。つまり<b>最近感染した都市ほど、すぐまた感染する</b>。覚えておくとリスクが読めます。"],
      guarded: ["救急隊員の守り", `赤株にはもう治療薬があるので、救急隊員のいる${c(ROUGE)}には赤株が置かれません。`],
    },
    mutation: ["変異", "エピデミックのたびに<b>変異カード</b>が 2 枚めくられます。1 枚をまだ治療薬のない株に与えます。いちばん影響の小さい組み合わせを選びましょう。"],
    ui: { step: (n, of) => `チュートリアル ${n} / ${of}`, infection: "感染フェイズ", next: "つづける", choose: "選びに行く" },
  },
  en: {
    steps: [
      ["The map", `This is the containment map of Papermark. Its 18 cities belong to three regions (${REGION_NAMES.join(", ")}) linked by roads, railways and sea routes. First, <b>drag the map</b> to look around.`, "Skip"],
      ["Move", `Viruses have appeared. ${c(REDLEAF)} has 2 Red viruses. Tap the <b>Medic</b> standee, choose Move, and go to ${c(CINNABAR)}, then on to ${c(REDLEAF)}.<br>Each action costs 1 AP; the punch card at the top left shows what's left.`],
      ["Treat and samples", "You're there. Tap the Medic again and choose Treat · Red strain. One treat from the Medic clears every virus of that strain here and earns 1 <b>sample</b>, shown on the ID card below. Samples are what cures are made from."],
      ["One action left", `1 AP left. Next door, ${c(SEALWELL)} already holds 3 viruses, which is dangerous, but you couldn't treat it this turn anyway. Move to ${c(ROUGE)} to set up the next round.`],
      ["End turn", "You're out of actions. Press End turn to start the <b>infection phase</b>: 3 cities are infected, each gaining 1 virus of its colour. The calendar above the map counts rounds; a game lasts 12."],
      ["Second agent", `The <b>Researcher</b> has arrived from ${c(GOLDGRAIN)} carrying 1 Red sample. Both agents <b>share 4 actions</b>, in any order. The Researcher needs only 3 samples for a cure and can develop it anywhere.`, "Got it"],
      ["Treat again", `The outbreak reached ${c(ROUGE)}, which now has 2 viruses. Have the Medic <b>treat</b> it; the Red samples go up to 2.`],
      ["Meet up", `Handing over samples needs both agents in the same city. Tap the <b>Researcher</b> and move to ${c(ROUGE)}.`],
      ["Undo", "Let's try <b>undo</b>. Move the Researcher one more step, anywhere."],
      ["Undo", "Mistakes are fine. Press Undo (or Cmd/Ctrl+Z) and the action comes back too.<br>Once you end your turn, though, new random results appear and you can't undo past them."],
      ["Hand over", "Tap the Medic and choose Hand over · Red strain to give both samples to the Researcher."],
      ["Develop a cure", "The Researcher now has 3 Red samples. Tap the Researcher and choose Cure · Red strain. The Cures panel at the top tracks progress; <b>all three cures wins the game</b>."],
      ["An epidemic is coming", "Red cure developed! From now on a single treat clears all Red viruses, and none can land where the Medic stands.<br>Press End turn. This round brings an <b>epidemic</b>."],
      ["Stations and flights", `${c(CAPITAL)} has a <b>research station</b>. Everyone except the Researcher must be at one to develop a cure. Build a station in your city for 3 AP (up to 3), and <b>fly</b> between stations for 1 AP.`, "Next"],
      ["More agents", "Besides the Medic and Researcher there are 6 more roles: Police lock down cities, the Epidemiologist forecasts infections, the Engineer sets up field labs… In a real game you pick 2 of the 8.<br><b>You lose</b> at 6 outbreaks, if a strain runs out, or if round 12 ends without all cures. Tap the ? at the top right for the rules any time.", "Finish tutorial"],
    ],
    notes: {
      named: ["Infected cities", `3 cities will be infected this round. They appear one at a time under This round at the top, get a pin on the map, and gain 1 virus of their colour.<br>First up is ${c(SEALWELL)}, which already has 3…`],
      outbreak: ["Outbreak!", "A city with 3 viruses of a strain that gets another one <b>breaks out</b>: every neighbour gains 1, and chains can follow. Lose at 6 outbreaks on the counter at the top."],
      epidemic: ["Epidemic", "<b>Epidemic</b>: the city at the bottom of the deck takes 3 viruses at once. There are 4 epidemics a game; the calendar tracks how many have happened."],
      intensify: ["Back on top", "Then the infected cities are shuffled back on top of the deck, so <b>recently infected cities get hit again soon</b>. Keeping track of them is how you read the risk."],
      guarded: ["The medic holds", `Red now has a cure, so no Red virus can land on ${c(ROUGE)} while the Medic is there.`],
    },
    mutation: ["Mutation", "Every epidemic also reveals 2 <b>mutation cards</b>. Give one to a strain that has no cure yet. Pick the combination that hurts you least."],
    ui: { step: (n, of) => `Tutorial ${n} / ${of}`, infection: "Infection phase", next: "Continue", choose: "Choose" },
  },
});

export const STEPS: Step[] = LOGIC.map((logic, i) => {
  const [title, text, button] = COPY.steps[i];
  return { ...logic, title, text, button: logic.button ? button : undefined };
});

function note(key: NoteKey): { title: string; text: string } {
  const [title, text] = COPY.notes[key];
  return { title, text };
}

export const NOTES: Note[] = [
  { match: (e) => e.t === "named", ...note("named") },
  { match: (e) => e.t === "outbreak", reveal: ["track"], focus: ".hud .track", anchor: (e) => (e.t === "outbreak" ? { city: e.city } : undefined), ...note("outbreak") },
  { match: (e) => e.t === "epidemic", anchor: (e) => (e.t === "epidemic" ? { city: e.city } : undefined), ...note("epidemic") },
  { match: (e) => e.t === "intensify", ...note("intensify") },
  { match: (e) => e.t === "guarded", anchor: (e) => (e.t === "guarded" ? { city: e.city } : undefined), ...note("guarded") },
];

export const MUTATION_NOTE = { title: COPY.mutation[0], text: COPY.mutation[1] };
export const COACH_UI = COPY.ui;
