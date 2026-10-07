import type { Action, GameEvent, RoleId, State } from "../../../engine/game.js";
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

export interface Step {
  title: string;
  text: string;
  reveal?: Part[];
  focus?: string;
  anchor?: Anchor;
  allow?: (a: Action, s: State) => boolean;
  endTurn?: boolean;
  undo?: boolean;
  button?: string;
  done?: (s: State) => boolean;
  on?: "pan" | "undo" | "round";
  enter?: (h: TutorialHost) => void;
}

export interface Note {
  title: string;
  text: (e: GameEvent) => string;
  match: (e: GameEvent) => boolean;
  reveal?: Part[];
  focus?: string;
  anchor?: (e: GameEvent) => Anchor | undefined;
}

const MEDIC = 0;
const RESEARCHER = 1;
const RED = 0;

const move = (r: number, to?: number) => (a: Action) => a.t === "move" && a.r === r && (to === undefined || a.to === to);

export const STEPS: Step[] = [
  {
    title: "防疫地图",
    text: "这是一张防疫地图。18 座城市分属<b>赤、苍、金</b>三个疫区，连线表示两座城市相邻。先<b>按住地图拖动</b>，看一看全貌。",
    on: "pan",
    button: "跳过",
    enter: (h) => h.follow("medic"),
  },
  {
    title: "移动",
    anchor: { role: "medic" },
    text: "地图上出现了病毒。<b>绛城</b>有 2 个赤株病毒。点<b>急救队员</b>的立牌，选「移动」，先到丹霞，再到绛城。<br>每个行动花 1 个行动点，左上角的打孔卡记着还剩几点。",
    reveal: ["ap", "cube"],
    focus: ".hud .ap",
    allow: (a, s) => move(MEDIC)(a) && a.t === "move" && ((s.pos[MEDIC] === 0 && a.to === 2) || (s.pos[MEDIC] === 2 && a.to === 4)),
    done: (s) => s.pos[MEDIC] === 4,
    enter: (h) => h.follow("medic"),
  },
  {
    title: "治疗和样本",
    anchor: { role: "medic" },
    text: "到了。再点急救队员，选「治疗 · 赤株」。急救队员治疗一次就能清空这座城市的同株病毒，还会得到 1 个<b>样本</b>，记在下方的身份证上。样本是研制解药的材料。",
    reveal: ["team"],
    focus: "#team-cards",
    allow: (a) => a.t === "treat" && a.r === MEDIC && a.s === RED,
    done: (s) => s.sample(MEDIC, RED) >= 1,
  },
  {
    title: "最后 1 点",
    anchor: { role: "medic" },
    text: "还剩 1 个行动点。旁边的<b>赭原</b>已经堆了 3 个病毒，很危险，可惜这一轮走不到了。先移动到<b>朱桥</b>，为下一轮做准备。",
    allow: move(MEDIC, 3),
    done: (s) => s.pos[MEDIC] === 3,
  },
  {
    title: "结束行动",
    anchor: { el: "#end-turn" },
    text: "行动点用完了。按「结束行动」进入<b>感染阶段</b>：会感染 3 座城市，每座放 1 个它颜色的病毒。地图上方的日历记录轮数，一局共 12 轮。",
    reveal: ["end", "drawn", "pin", "calendar"],
    focus: "#end-turn",
    endTurn: true,
    on: "round",
  },
  {
    title: "第二名队员",
    anchor: { role: "researcher" },
    text: "<b>研究员</b>赶到了赤岩，还带着 1 个赤株样本。两名队员<b>共用 4 个行动点</b>，谁先谁后、怎么穿插都可以。研究员研制解药只要 3 个样本，而且在哪都能研制。",
    reveal: ["researcher"],
    focus: "#team-cards",
    button: "知道了",
    enter: (h) => h.follow("researcher"),
  },
  {
    title: "再次治疗",
    anchor: { role: "medic" },
    text: "朱桥被爆发波及，现在有 2 个病毒。让急救队员<b>治疗</b>，手上的赤株样本会变成 2 个。",
    allow: (a) => a.t === "treat" && a.r === MEDIC && a.s === RED,
    done: (s) => s.sample(MEDIC, RED) >= 2,
    enter: (h) => h.follow("medic"),
  },
  {
    title: "汇合",
    anchor: { role: "researcher" },
    text: "交接样本需要两人在同一座城市。点<b>研究员</b>，移动到朱桥。",
    allow: move(RESEARCHER, 3),
    done: (s) => s.pos[RESEARCHER] === 3,
    enter: (h) => h.follow("researcher"),
  },
  {
    title: "撤销",
    anchor: { role: "researcher" },
    text: "先试试<b>撤销</b>：让研究员随便再走一步。",
    allow: move(RESEARCHER),
    done: (s) => s.pos[RESEARCHER] !== 3,
    enter: (h) => h.clearHistory(),
  },
  {
    title: "撤销",
    anchor: { el: "#undo" },
    text: "走错了也不要紧。按「撤销」（或 Cmd/Ctrl+Z），行动点也会退回来。<br>但结束行动之后出现了新的随机结果，就不能再撤销到之前了。",
    reveal: ["undo"],
    focus: "#undo",
    undo: true,
    on: "undo",
  },
  {
    title: "交接",
    anchor: { role: "medic" },
    text: "点急救队员，选「交接 · 赤株」，把 2 个样本交给同城的研究员。",
    allow: (a) => a.t === "give" && a.r === MEDIC && a.s === RED,
    done: (s) => s.sample(RESEARCHER, RED) >= 3,
    enter: (h) => h.follow("medic"),
  },
  {
    title: "研制解药",
    anchor: { role: "researcher" },
    text: "研究员凑齐了 3 个赤株样本。点研究员，选「研制 · 赤株」。顶部的解药栏记录进度，<b>三种解药全部研制出来就获胜</b>。",
    reveal: ["cures"],
    focus: ".hud .cures",
    allow: (a) => a.t === "cure" && a.r === RESEARCHER && a.s === RED,
    done: (s) => !!s.cured[RED],
    enter: (h) => h.follow("researcher"),
  },
  {
    title: "流行病要来了",
    anchor: { el: "#end-turn" },
    text: "赤株解药研制成功！今后治疗赤株一次就能全部清除，急救队员所在的城市也不会再被放赤株。<br>按「结束行动」。这一轮会发生<b>流行病</b>。",
    focus: "#end-turn",
    endTurn: true,
    on: "round",
  },
  {
    title: "研究站和快速转移",
    anchor: { city: 0 },
    text: "枢港有一座<b>研究站</b>。除了研究员，其他人都要在研究站里才能研制。花 3 点可以在所在城市建一座研究站（最多 3 座）；在两座研究站之间，花 1 点就能<b>快速转移</b>。",
    reveal: ["station"],
    button: "下一步",
    enter: (h) => h.focusCity(0),
  },
  {
    title: "更多队员",
    anchor: { el: "#help" },
    text: "除了急救队员和研究员，还有 6 种职业：警察驻守封城，流行病学家预判感染，工程师搭野战实验室……正式游戏开局时，从 8 人中任选 2 人。<br><b>失败条件</b>：爆发满 6 次、某一株病毒用完，或者 12 轮结束还没研制完。忘了规则就点右上角的「?」。",
    reveal: ["help", "track"],
    focus: "#help",
    button: "完成教程",
    enter: (h) => h.follow("medic"),
  },
];

export const NOTES: Note[] = [
  {
    title: "感染城市",
    match: (e) => e.t === "named",
    text: (e) => `这一轮要感染 ${e.t === "named" ? e.cities.length : 3} 座城市。它们会一座一座出现在顶部的「本轮感染」里，地图上也会插上图钉，每座放 1 个它颜色的病毒。<br>第一座就是<b>赭原</b>，它已经有 3 个病毒了……`,
  },
  {
    title: "爆发！",
    anchor: (e) => (e.t === "outbreak" ? { city: e.city } : undefined),
    match: (e) => e.t === "outbreak",
    text: () => "一座城市已经有 3 个同株病毒，再放病毒就会<b>爆发</b>：向每座相邻城市各扩散 1 个，还可能连锁。顶部的爆发计数满 6 次就失败。",
    reveal: ["track"],
    focus: ".hud .track",
  },
  {
    title: "流行病",
    anchor: (e) => (e.t === "epidemic" ? { city: e.city } : undefined),
    match: (e) => e.t === "epidemic",
    text: () => "<b>流行病</b>：牌库最底下的城市一次放 3 个病毒。一局会有 4 次流行病，日历上记着已经发生了几次。",
  },
  {
    title: "洗回牌库顶",
    match: (e) => e.t === "intensify",
    text: () => "接着，感染过的城市会被洗回牌库顶，所以<b>最近被感染的城市很快会再被感染</b>。记住它们，是预判风险的关键。",
  },
  {
    title: "急救队员守城",
    anchor: (e) => (e.t === "guarded" ? { city: e.city } : undefined),
    match: (e) => e.t === "guarded",
    text: () => "赤株已经有解药，急救队员所在的朱桥不会再被放赤株。",
  },
];

export const MUTATION_NOTE = {
  title: "变异",
  text: "每次流行病还会翻出 2 张<b>变异卡</b>。选 1 张交给一株病毒，而且只能交给还没研制出解药的株。挑对你影响最小的组合。",
};
