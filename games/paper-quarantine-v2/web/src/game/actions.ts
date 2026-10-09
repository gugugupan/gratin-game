import type { V2Action, V2State } from "../../../engine/game.js";
import { EDGES, LINKS, STRAINS } from "../../../engine/map.js";
import { CITY_NAMES, ROLE_INFO, STRAIN_NAME } from "../data";

export type EntryKind = "apply" | "target" | "road" | "pick";

export interface MenuEntry {
  label: string;
  note?: string;
  cost: number;
  kind: EntryKind;
  action?: V2Action;
  targets?: { city: number; action: V2Action }[];
  roads?: { edge: number; action: V2Action }[];
  picks?: { label: string; note?: string; action: V2Action }[];
  disabled?: string;
}

const same = (a: V2Action, b: V2Action) => JSON.stringify(a) === JSON.stringify(b);
const roleName = (s: V2State, r: number) => ROLE_INFO[s.roles[r]].name;
const edgeName = (e: number) => `${CITY_NAMES[EDGES[e][0]]}—${CITY_NAMES[EDGES[e][1]]}`;

export function entriesFor(s: V2State, r: number): MenuEntry[] {
  const role = s.roles[r];
  const legal = s.legalActions().filter((a) => "r" in a && a.r === r);
  const has = (a: V2Action) => legal.some((l) => same(l, a));
  const city = s.pos[r];
  const surcharge = s.surcharge(r);
  const noAp = (cost: number) => (cost > s.ap ? "行动点不足" : undefined);
  const out: MenuEntry[] = [];
  const pickTargets = <T extends V2Action["t"]>(t: T) => legal.filter((a): a is Extract<V2Action, { t: T }> => a.t === t);

  const moves = pickTargets("move").map((a) => ({ city: a.to, action: a as V2Action }));
  out.push({ label: "移动", note: `相邻 ${LINKS[city].length} 城`, cost: 1 + surcharge, kind: "target", targets: moves, disabled: moves.length ? undefined : noAp(1 + surcharge) ?? "无法移动" });

  if (s.stations.length > 1) {
    const flights = pickTargets("fly").map((a) => ({ city: a.to, action: a as V2Action }));
    out.push({ label: "快速转移", note: "研究站之间", cost: 1 + surcharge, kind: "target", targets: flights, disabled: flights.length ? undefined : !s.stations.includes(city) ? "不在研究站" : noAp(1 + surcharge) ?? "无法转移" });
  }

  let anyVirus = false;
  for (let k = 0; k < STRAINS; k++) {
    const n = s.lv(city, k);
    if (!n) continue;
    anyVirus = true;
    const a: V2Action = { t: "treat", r, s: k };
    const all = (role === "medic" || s.cured[k]) && !s.hasMutation(k, "stubborn");
    const removed = all ? n : 1;
    const gain = s.cured[k] ? 0 : (s.cfg.samplePerLevel ? removed : 1) + (role === "pharmacist" ? 1 : 0);
    out.push({ label: `治疗 · ${STRAIN_NAME[k]}`, note: `降 ${removed} 级${gain ? ` · 样本 +${gain}` : ""} · 恐慌 −${removed * s.cfg.panic.treat}`, cost: 1 + surcharge, kind: "apply", action: a, disabled: has(a) ? undefined : noAp(1 + surcharge) });
  }
  if (!anyVirus) out.push({ label: "治疗", cost: 1, kind: "apply", disabled: "这里没有病毒" });

  for (let k = 0; k < STRAINS; k++) {
    const n = s.sample(r, k);
    if (!n || s.cured[k]) continue;
    const a: V2Action = { t: "give", r, s: k };
    const reach = s.pos[1 - r] === city || s.hasRole("logistics") >= 0;
    out.push({ label: `交接 · ${STRAIN_NAME[k]} ×${n}`, note: `交给${roleName(s, 1 - r)}`, cost: 1 + surcharge, kind: "apply", action: a, disabled: has(a) ? undefined : !reach ? "不在同一城市" : noAp(1 + surcharge) });
  }

  let anyCure = false;
  for (let k = 0; k < STRAINS; k++) {
    if (s.cured[k] || s.sample(r, k) < s.cureNeed(r, k)) continue;
    anyCure = true;
    const a: V2Action = { t: "cure", r, s: k };
    out.push({ label: `研制 · ${STRAIN_NAME[k]}`, note: `消耗 ${s.cureNeed(r, k)} 个样本`, cost: 1 + surcharge, kind: "apply", action: a, disabled: has(a) ? undefined : role !== "researcher" && !s.stations.includes(city) ? "需要在研究站" : noAp(1 + surcharge) });
  }
  if (!anyCure) {
    const best = [0, 1, 2].filter((k) => !s.cured[k]).map((k) => `${STRAIN_NAME[k]} ${s.sample(r, k)}/${s.cureNeed(r, k)}`).join("、");
    out.push({ label: "研制", cost: 1, kind: "apply", disabled: `样本不足（${best}）` });
  }

  const cpCost = s.cost({ t: "checkpoint", r, edge: 0 });
  const cps = pickTargets("checkpoint").map((a) => ({ edge: a.edge, action: a as V2Action }));
  out.push({
    label: "检查站",
    note: `选一条道路，拦下第一个经过的携带者 · ${s.checkpoints.length}/${s.maxCheckpoints()}`,
    cost: cpCost,
    kind: "road",
    roads: cps,
    disabled: cps.length ? undefined : s.checkpoints.length >= s.maxCheckpoints() ? "检查站已满" : noAp(cpCost) ?? "没有可设的线路",
  });

  const locks = pickTargets("lock").map((a) => ({ city: a.city, action: a as V2Action }));
  out.push({
    label: "封城",
    note: `所在或相邻城市 · 恐慌每轮 +${role === "police" ? s.cfg.panic.policeLocked : s.cfg.panic.locked}`,
    cost: 1 + surcharge,
    kind: "target",
    targets: locks,
    disabled: locks.length ? undefined : noAp(1 + surcharge) ?? "没有可封的城市",
  });

  const supply: V2Action = { t: "supply", r };
  out.push({ label: "物资补给", note: `${role === "logistics" ? "周边 2 格" : "本城和邻城"} · ${s.cfg.supplyRounds} 轮内恐慌上涨减半`, cost: 1 + surcharge, kind: "apply", action: supply, disabled: has(supply) ? undefined : noAp(1 + surcharge) });

  const build: V2Action = { t: "build", r };
  out.push({
    label: "建研究站",
    cost: s.cfg.stationCost + surcharge,
    kind: "apply",
    action: build,
    disabled: has(build) ? undefined : s.stations.includes(city) ? "这里已有研究站" : s.stations.length >= s.cfg.maxStations ? `最多 ${s.cfg.maxStations} 座` : noAp(s.cfg.stationCost + surcharge),
  });

  if (role === "epidemiologist") {
    const picks = pickTargets("reroute").map((a) => {
      const k = s.carriers.find((x) => x.id === a.carrier)!;
      const to = LINKS[k.from].find((l) => l.edge === a.edge)!.to;
      return { label: `${STRAIN_NAME[k.s]}：${CITY_NAMES[k.from]}→${CITY_NAMES[k.to]}`, note: `改去 ${CITY_NAMES[to]}`, action: a as V2Action };
    });
    out.unshift({ label: "改道", note: "让一个还没出发的携带者换线路", cost: 0, kind: "pick", picks, disabled: picks.length ? undefined : s.rerouteUsed ? "本轮已用" : "没有可改道的携带者" });
  }
  if (role === "officer") {
    const picks = pickTargets("purge").map((a) => {
      const k = s.carriers.find((x) => x.id === a.carrier)!;
      return { label: `${STRAIN_NAME[k.s]}：${CITY_NAMES[k.from]}→${CITY_NAMES[k.to]}`, note: `还要 ${k.left} 轮`, action: a as V2Action };
    });
    out.push({ label: "消除携带者", note: `本局剩 ${s.officerUses} 次`, cost: 1 + surcharge, kind: "pick", picks, disabled: picks.length ? undefined : s.officerUses <= 0 ? "次数已用完" : noAp(1 + surcharge) ?? "地图上没有携带者" });
  }

  for (const a of s.legalActions()) {
    if (a.t !== "unlock") continue;
    out.push({ label: `解封 · ${CITY_NAMES[a.city]}`, note: `恐慌 ${s.panic[a.city]}`, cost: 0, kind: "apply", action: a });
  }
  return out;
}

export function describe(s: V2State, a: V2Action): string {
  switch (a.t) {
    case "move":
    case "fly":
      return `${roleName(s, a.r)}${a.t === "fly" ? "快速转移" : "前往"}${CITY_NAMES[a.to]}`;
    case "treat":
      return `${roleName(s, a.r)}治疗${STRAIN_NAME[a.s]}`;
    case "give":
      return `${roleName(s, a.r)}交出${STRAIN_NAME[a.s]}样本`;
    case "cure":
      return `研制出${STRAIN_NAME[a.s]}解药！该疫区恐慌 −${s.cfg.panic.cure}`;
    case "build":
      return `在${CITY_NAMES[s.pos[a.r]]}建成研究站`;
    case "checkpoint":
      return `在 ${edgeName(a.edge)} 设下检查站`;
    case "lock":
      return `${CITY_NAMES[a.city]}封城`;
    case "unlock":
      return `${CITY_NAMES[a.city]}解封`;
    case "supply":
      return `向${CITY_NAMES[s.pos[a.r]]}一带送去物资`;
    case "reroute":
      return "携带者改道了";
    case "purge":
      return "消除了一个携带者";
    default:
      return "";
  }
}
