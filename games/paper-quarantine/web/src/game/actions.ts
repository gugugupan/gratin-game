import type { Action, State } from "../../../engine/game.js";
import { LINKS, STRAINS } from "../../../engine/map.js";
import { CITY_NAMES, ROLE_INFO, STRAIN_NAME } from "../data";

const ACT = tr({
  zh: {
    noAp: "行动点不足", move: "移动", moveLock: "封城随人走", neighbours: (n: number) => `相邻 ${n} 城`, cantMove: "无法移动",
    fly: "快速转移", flyNote: "研究站之间", notStation: "不在研究站", cantFly: "无法转移",
    treat: "治疗", treatOf: (s: string) => `治疗 · ${s}`, treatNote: (n: number, gain: number) => `清除 ${n} 个${gain ? ` · 样本 +${gain}` : ""}`, noVirus: "这里没有病毒",
    give: "交接", giveOf: (s: string, n: number) => `交接 · ${s} ×${n}`, giveTo: (who: string) => `交给${who}`, notTogether: "不在同一城市", nothingToGive: "没有可交的样本",
    cure: "研制", cureOf: (s: string) => `研制 · ${s}`, cureNote: (n: number) => `消耗 ${n} 个样本`, needStation: "需要在研究站", shortSamples: (best: string) => (best ? `样本不足（${best}）` : "样本不足"),
    build: "建研究站", buildEngineer: "工程师只需 2 点", hasStation: "这里已有研究站", maxStations: (n: number) => `最多 ${n} 座`,
    lab: "野战实验室", labNote: (n: number) => `持续 ${n} 轮`, canCureHere: "这里已能研制",
    forecast: "预判感染", forecastNote: "看接下来 3 座，移走 1 座", usedThisRound: "本轮已用", cantForecast: "无法预判",
    cancel: "取消感染", usesLeft: (n: number) => `本局剩余 ${n} 次`, noUses: "次数已用完",
    did: {
      move: (who: string, city: string, fly: boolean) => `${who}${fly ? "快速转移" : "前往"}${city}`,
      treat: (who: string, s: string) => `${who}治疗${s}`, give: (who: string, s: string) => `${who}交出${s}样本`, cure: (s: string) => `研制出${s}解药！`,
      build: (city: string) => `在${city}建成研究站`, lab: (city: string) => `在${city}部署野战实验室`, cancel: "本轮感染时可以取消 1 座城市", forecast: "已移走 1 座城市",
    },
  },
  ja: {
    noAp: "行動ポイント不足", move: "移動", moveLock: "封鎖も一緒に移動", neighbours: (n: number) => `隣接 ${n} 都市`, cantMove: "移動できない",
    fly: "高速移動", flyNote: "研究所どうし", notStation: "研究所にいない", cantFly: "移動先がない",
    treat: "治療", treatOf: (s: string) => `治療 · ${s}`, treatNote: (n: number, gain: number) => `${n} 個除去${gain ? ` · サンプル +${gain}` : ""}`, noVirus: "ここに病原体はない",
    give: "受け渡し", giveOf: (s: string, n: number) => `受け渡し · ${s} ×${n}`, giveTo: (who: string) => `${who}へ`, notTogether: "同じ都市にいない", nothingToGive: "渡せるサンプルがない",
    cure: "開発", cureOf: (s: string) => `開発 · ${s}`, cureNote: (n: number) => `サンプル ${n} 個を使う`, needStation: "研究所が必要", shortSamples: (best: string) => (best ? `サンプル不足（${best}）` : "サンプル不足"),
    build: "研究所を建設", buildEngineer: "技師は 2 ポイント", hasStation: "研究所がある", maxStations: (n: number) => `最大 ${n} か所`,
    lab: "野外ラボ", labNote: (n: number) => `${n} ラウンド有効`, canCureHere: "ここで開発できる",
    forecast: "感染予測", forecastNote: "次の 3 都市から 1 つ後回し", usedThisRound: "今ラウンド使用済み", cantForecast: "予測できない",
    cancel: "感染取消", usesLeft: (n: number) => `残り ${n} 回`, noUses: "回数切れ",
    did: {
      move: (who: string, city: string, fly: boolean) => `${who}が${city}へ${fly ? "高速移動" : "移動"}`,
      treat: (who: string, s: string) => `${who}が${s}を治療`, give: (who: string, s: string) => `${who}が${s}のサンプルを渡した`, cure: (s: string) => `${s}の治療薬が完成！`,
      build: (city: string) => `${city}に研究所を建設`, lab: (city: string) => `${city}に野外ラボを設置`, cancel: "今ラウンドの感染を 1 つ取り消せる", forecast: "1 都市を後回しにした",
    },
  },
  en: {
    noAp: "Not enough actions", move: "Move", moveLock: "Lockdown moves too", neighbours: (n: number) => `${n} neighbours`, cantMove: "Can't move",
    fly: "Fly", flyNote: "Between stations", notStation: "Not at a station", cantFly: "Nowhere to fly",
    treat: "Treat", treatOf: (s: string) => `Treat · ${s}`, treatNote: (n: number, gain: number) => `Clears ${n}${gain ? ` · sample +${gain}` : ""}`, noVirus: "No virus here",
    give: "Hand over", giveOf: (s: string, n: number) => `Hand over · ${s} ×${n}`, giveTo: (who: string) => `To the ${who}`, notTogether: "Not in the same city", nothingToGive: "No samples to give",
    cure: "Develop cure", cureOf: (s: string) => `Cure · ${s}`, cureNote: (n: number) => `Uses ${n} samples`, needStation: "Needs a station", shortSamples: (best: string) => (best ? `Not enough (${best})` : "Not enough samples"),
    build: "Build station", buildEngineer: "Engineer: 2 AP", hasStation: "Already a station", maxStations: (n: number) => `${n} at most`,
    lab: "Field lab", labNote: (n: number) => `Lasts ${n} rounds`, canCureHere: "Can already cure here",
    forecast: "Forecast", forecastNote: "See the next 3, push 1 back", usedThisRound: "Used this round", cantForecast: "Can't forecast",
    cancel: "Cancel infection", usesLeft: (n: number) => `${n} left this game`, noUses: "No uses left",
    did: {
      move: (who: string, city: string, fly: boolean) => `${who} ${fly ? "flies" : "heads"} to ${city}`,
      treat: (who: string, s: string) => `${who} treats the ${s}`, give: (who: string, s: string) => `${who} hands over ${s} samples`, cure: (s: string) => `${s} cure developed!`,
      build: (city: string) => `Research station built in ${city}`, lab: (city: string) => `Field lab set up in ${city}`, cancel: "One city can be spared this round", forecast: "One city pushed back",
    },
  },
});
import { tr } from "../i18n/locale";

export type EntryKind = "apply" | "target" | "forecast";

export interface MenuEntry {
  label: string;
  note?: string;
  cost: number;
  kind: EntryKind;
  action?: Action;
  targets?: { city: number; action: Action }[];
  disabled?: string;
}

const same = (a: Action, b: Action) => JSON.stringify(a) === JSON.stringify(b);

export function entriesFor(state: State, r: number): MenuEntry[] {
  const role = state.roles[r];
  const legal = state.legalActions().filter((a) => a.t !== "pass" && a.r === r);
  const has = (a: Action) => legal.some((l) => same(l, a));
  const ap = state.apLeft(r);
  const city = state.pos[r];
  const other = 1 - r;
  const out: MenuEntry[] = [];
  const noAp = (cost: number) => (cost > ap ? ACT.noAp : undefined);

  const moves = legal.filter((a): a is Extract<Action, { t: "move" }> => a.t === "move").map((a) => ({ city: a.to, action: a as Action }));
  const moveCost = state.cost({ t: "move", r, to: LINKS[city][0].to });
  out.push({
    label: ACT.move,
    note: role === "police" ? ACT.moveLock : ACT.neighbours(LINKS[city].length),
    cost: moveCost,
    kind: "target",
    targets: moves,
    disabled: moves.length ? undefined : noAp(moveCost) ?? ACT.cantMove,
  });

  const flights = legal.filter((a): a is Extract<Action, { t: "fly" }> => a.t === "fly").map((a) => ({ city: a.to, action: a as Action }));
  if (state.stations.length + (state.labCity >= 0 ? 1 : 0) > 1) {
    out.push({
      label: ACT.fly,
      note: ACT.flyNote,
      cost: 1,
      kind: "target",
      targets: flights,
      disabled: flights.length ? undefined : !state.isStation(city) ? ACT.notStation : noAp(1) ?? ACT.cantFly,
    });
  }

  let anyCube = false;
  for (let s = 0; s < STRAINS; s++) {
    const n = state.cube(city, s);
    if (!n) continue;
    anyCube = true;
    const a: Action = { t: "treat", r, s };
    const all = (role === "medic" || state.cured[s]) && !state.hasMutation(s, "stubborn");
    const gain = state.cured[s] ? 0 : 1 + (role === "pharmacist" ? state.cfg.pharmacistBonus : 0);
    out.push({
      label: ACT.treatOf(STRAIN_NAME[s]),
      note: ACT.treatNote(all ? n : 1, gain),
      cost: 1,
      kind: "apply",
      action: a,
      disabled: has(a) ? undefined : noAp(1),
    });
  }
  if (!anyCube) out.push({ label: ACT.treat, cost: 1, kind: "apply", disabled: ACT.noVirus });

  let anyGive = false;
  for (let s = 0; s < STRAINS; s++) {
    const n = state.sample(r, s);
    if (!n || state.cured[s]) continue;
    anyGive = true;
    const a: Action = { t: "give", r, s };
    const reach = state.pos[other] === city || state.hasRole("logistics") >= 0;
    out.push({
      label: ACT.giveOf(STRAIN_NAME[s], n),
      note: ACT.giveTo(roleName(state, other)),
      cost: 1,
      kind: "apply",
      action: a,
      disabled: has(a) ? undefined : !reach ? ACT.notTogether : noAp(1),
    });
  }
  if (!anyGive) out.push({ label: ACT.give, cost: 1, kind: "apply", disabled: ACT.nothingToGive });

  let anyCure = false;
  for (let s = 0; s < STRAINS; s++) {
    if (state.cured[s]) continue;
    const need = state.cureNeed(r, s);
    const n = state.sample(r, s);
    if (n < need) continue;
    anyCure = true;
    const a: Action = { t: "cure", r, s };
    const where = role === "researcher" || state.isStation(city);
    out.push({
      label: ACT.cureOf(STRAIN_NAME[s]),
      note: ACT.cureNote(need),
      cost: 1,
      kind: "apply",
      action: a,
      disabled: has(a) ? undefined : !where ? ACT.needStation : noAp(1),
    });
  }
  if (!anyCure) {
    const best = bestProgress(state, r);
    out.push({ label: ACT.cure, cost: 1, kind: "apply", disabled: ACT.shortSamples(best) });
  }

  const build: Action = { t: "build", r };
  const buildCost = state.cost(build);
  out.push({
    label: ACT.build,
    note: role === "engineer" ? ACT.buildEngineer : undefined,
    cost: buildCost,
    kind: "apply",
    action: build,
    disabled: has(build)
      ? undefined
      : state.stations.includes(city)
        ? ACT.hasStation
        : state.stations.length >= state.cfg.maxStations
          ? ACT.maxStations(state.cfg.maxStations)
          : noAp(buildCost),
  });

  if (role === "engineer") {
    const lab: Action = { t: "lab", r };
    out.push({
      label: ACT.lab,
      note: ACT.labNote(state.cfg.labRounds),
      cost: 1,
      kind: "apply",
      action: lab,
      disabled: has(lab) ? undefined : state.isStation(city) ? ACT.canCureHere : noAp(1),
    });
  }
  if (role === "epidemiologist") {
    out.unshift({
      label: ACT.forecast,
      note: ACT.forecastNote,
      cost: state.cost({ t: "forecast", r, bury: 0 }),
      kind: "forecast",
      disabled: legal.some((a) => a.t === "forecast") ? undefined : state.forecastUsed ? ACT.usedThisRound : ACT.cantForecast,
    });
  }
  if (role === "officer") {
    const a: Action = { t: "cancel", r };
    out.push({
      label: ACT.cancel,
      note: ACT.usesLeft(state.officerUses),
      cost: 1,
      kind: "apply",
      action: a,
      disabled: has(a) ? undefined : state.cancelPending || state.cancelUsed ? ACT.usedThisRound : state.officerUses <= 0 ? ACT.noUses : noAp(1),
    });
  }
  return out;
}

function roleName(state: State, r: number): string {
  return ROLE_INFO[state.roles[r]].name;
}

function bestProgress(state: State, r: number): string {
  let best = "";
  let bestRatio = -1;
  for (let s = 0; s < STRAINS; s++) {
    if (state.cured[s]) continue;
    const ratio = state.sample(r, s) / state.cureNeed(r, s);
    if (ratio > bestRatio && state.sample(r, s) > 0) {
      bestRatio = ratio;
      best = `${STRAIN_NAME[s]} ${state.sample(r, s)}/${state.cureNeed(r, s)}`;
    }
  }
  return best;
}

export function describe(state: State, a: Action): string {
  switch (a.t) {
    case "move":
    case "fly":
      return ACT.did.move(roleName(state, a.r), CITY_NAMES[a.to], a.t === "fly");
    case "treat":
      return ACT.did.treat(roleName(state, a.r), STRAIN_NAME[a.s]);
    case "give":
      return ACT.did.give(roleName(state, a.r), STRAIN_NAME[a.s]);
    case "cure":
      return ACT.did.cure(STRAIN_NAME[a.s]);
    case "build":
      return ACT.did.build(CITY_NAMES[state.pos[a.r]]);
    case "lab":
      return ACT.did.lab(CITY_NAMES[state.pos[a.r]]);
    case "cancel":
      return ACT.did.cancel;
    case "forecast":
      return ACT.did.forecast;
    default:
      return "";
  }
}
