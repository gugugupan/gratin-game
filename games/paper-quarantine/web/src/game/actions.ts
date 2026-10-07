import type { Action, State } from "../../../engine/game.js";
import { LINKS, STRAINS } from "../../../engine/map.js";
import { CITY_NAMES, ROLE_INFO, STRAIN_SHORT } from "../data";

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
  const noAp = (cost: number) => (cost > ap ? "行动点不足" : undefined);

  const moves = legal.filter((a): a is Extract<Action, { t: "move" }> => a.t === "move").map((a) => ({ city: a.to, action: a as Action }));
  const moveCost = state.cost({ t: "move", r, to: LINKS[city][0].to });
  out.push({
    label: "移动",
    note: role === "police" ? "封城随人走" : `相邻 ${LINKS[city].length} 城`,
    cost: moveCost,
    kind: "target",
    targets: moves,
    disabled: moves.length ? undefined : noAp(moveCost) ?? "无法移动",
  });

  const flights = legal.filter((a): a is Extract<Action, { t: "fly" }> => a.t === "fly").map((a) => ({ city: a.to, action: a as Action }));
  if (state.stations.length + (state.labCity >= 0 ? 1 : 0) > 1) {
    out.push({
      label: "快速转移",
      note: "研究站之间",
      cost: 1,
      kind: "target",
      targets: flights,
      disabled: flights.length ? undefined : !state.isStation(city) ? "不在研究站" : noAp(1) ?? "无法转移",
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
      label: `治疗 · ${STRAIN_SHORT[s]}株`,
      note: `${all ? `清除 ${n} 个` : "清除 1 个"}${gain ? ` · 样本 +${gain}` : ""}`,
      cost: 1,
      kind: "apply",
      action: a,
      disabled: has(a) ? undefined : noAp(1),
    });
  }
  if (!anyCube) out.push({ label: "治疗", cost: 1, kind: "apply", disabled: "这里没有病毒" });

  let anyGive = false;
  for (let s = 0; s < STRAINS; s++) {
    const n = state.sample(r, s);
    if (!n || state.cured[s]) continue;
    anyGive = true;
    const a: Action = { t: "give", r, s };
    const reach = state.pos[other] === city || state.hasRole("logistics") >= 0;
    out.push({
      label: `交接 · ${STRAIN_SHORT[s]}株 ×${n}`,
      note: `交给${roleName(state, other)}`,
      cost: 1,
      kind: "apply",
      action: a,
      disabled: has(a) ? undefined : !reach ? "不在同一城市" : noAp(1),
    });
  }
  if (!anyGive) out.push({ label: "交接", cost: 1, kind: "apply", disabled: "没有可交的样本" });

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
      label: `研制 · ${STRAIN_SHORT[s]}株`,
      note: `消耗 ${need} 个样本`,
      cost: 1,
      kind: "apply",
      action: a,
      disabled: has(a) ? undefined : !where ? "需要在研究站" : noAp(1),
    });
  }
  if (!anyCure) {
    const best = bestProgress(state, r);
    out.push({ label: "研制", cost: 1, kind: "apply", disabled: best ? `样本不足（${best}）` : "样本不足" });
  }

  const build: Action = { t: "build", r };
  const buildCost = state.cost(build);
  out.push({
    label: "建研究站",
    note: role === "engineer" ? "工程师只需 2 点" : undefined,
    cost: buildCost,
    kind: "apply",
    action: build,
    disabled: has(build)
      ? undefined
      : state.stations.includes(city)
        ? "这里已有研究站"
        : state.stations.length >= state.cfg.maxStations
          ? `最多 ${state.cfg.maxStations} 座`
          : noAp(buildCost),
  });

  if (role === "engineer") {
    const lab: Action = { t: "lab", r };
    out.push({
      label: "野战实验室",
      note: `持续 ${state.cfg.labRounds} 轮`,
      cost: 1,
      kind: "apply",
      action: lab,
      disabled: has(lab) ? undefined : state.isStation(city) ? "这里已能研制" : noAp(1),
    });
  }
  if (role === "epidemiologist") {
    out.unshift({
      label: "预判感染",
      note: "看接下来 3 座，移走 1 座",
      cost: state.cost({ t: "forecast", r, bury: 0 }),
      kind: "forecast",
      disabled: legal.some((a) => a.t === "forecast") ? undefined : state.forecastUsed ? "本轮已用" : "无法预判",
    });
  }
  if (role === "officer") {
    const a: Action = { t: "cancel", r };
    out.push({
      label: "取消感染",
      note: `本局剩余 ${state.officerUses} 次`,
      cost: 1,
      kind: "apply",
      action: a,
      disabled: has(a) ? undefined : state.cancelPending || state.cancelUsed ? "本轮已用" : state.officerUses <= 0 ? "次数已用完" : noAp(1),
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
      best = `${STRAIN_SHORT[s]}株 ${state.sample(r, s)}/${state.cureNeed(r, s)}`;
    }
  }
  return best;
}

export function describe(state: State, a: Action): string {
  switch (a.t) {
    case "move":
    case "fly":
      return `${roleName(state, a.r)}${a.t === "fly" ? "快速转移" : "前往"}${CITY_NAMES[a.to]}`;
    case "treat":
      return `${roleName(state, a.r)}治疗${STRAIN_SHORT[a.s]}株`;
    case "give":
      return `${roleName(state, a.r)}交出${STRAIN_SHORT[a.s]}株样本`;
    case "cure":
      return `研制出${STRAIN_SHORT[a.s]}株解药！`;
    case "build":
      return `在${CITY_NAMES[state.pos[a.r]]}建成研究站`;
    case "lab":
      return `在${CITY_NAMES[state.pos[a.r]]}部署野战实验室`;
    case "cancel":
      return "本轮感染时可以取消 1 座城市";
    case "forecast":
      return "已移走 1 座城市";
    default:
      return "";
  }
}
