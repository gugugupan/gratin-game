import { EDGE_KIND, POPULATION, V2_CONFIG, V2State, type NewsId, type V2Action, type V2Config, type V2Event } from "../../../engine/game.js";
import { CITIES, CITY_COUNT, EDGES, LINKS, STRAINS } from "../../../engine/map.js";
import { ROLE_NAMES, ROLES, type RoleId } from "../../../engine/roles.js";
import { POS2D } from "./layout";

const PLAYTEST: V2Config = V2_CONFIG;

const COLORS = ["#c4472f", "#2f6d8c", "#c9951a"];
const TINT = ["#f2d3c8", "#cfe0e6", "#f2e2b8"];
const STRAIN = ["赤", "苍", "金"];
const NEWS: Record<NewsId, [string, string]> = {
  calm: ["风平浪静", "无事发生"],
  festival: ["纸都花灯节", "2 轮内铁路运力 ×2，纸都每轮多派 1 个携带者"],
  fog: ["海雾", "本轮航线停运，航线上的携带者不动"],
  rain: ["雨季", "2 轮内公路要走 2 轮"],
  freighter: ["货轮靠港", "一座港口城市在本轮末迎来 2 个外来携带者"],
  rumor: ["谣言", "一个疫区的所有城市恐慌 +15"],
  peak: ["疫情高峰", "所有已感染城市（未封城）各株 +1"],
};

const svg = document.getElementById("map") as unknown as SVGSVGElement;
const panel = document.getElementById("panel")!;
const tip = document.getElementById("tip")!;
const P = (c: number) => ({ x: POS2D[c][0], y: -POS2D[c][1] });
const name = (c: number) => CITIES[c].name;
const role = (s: V2State, r: number) => ROLE_NAMES[s.roles[r]];

let state: V2State;
let history: V2State[] = [];
let agent = 0;
let log: string[] = [];
let team: [RoleId, RoleId] = ["medic", "researcher"];

function newGame(seed = Math.floor(Math.random() * 1e6)): void {
  state = new V2State(PLAYTEST, team, seed);
  state.events = [];
  state.setup();
  history = [];
  agent = 0;
  log = [`开局（种子 ${seed}）：${describeEvents(state.events ?? []).join("；") || "—"}`];
  state.events = null;
  render();
}

function act(a: V2Action): void {
  history.push(state.clone());
  state.apply(a);
  log.unshift(`· ${describe(a)}`);
  render();
}

function undo(): void {
  const prev = history.pop();
  if (!prev) return;
  state = prev;
  log.unshift("· 撤销");
  render();
}

function endTurn(): void {
  if (state.status !== "playing") return;
  state.events = [];
  const round = state.round;
  state.endRound();
  const lines = describeEvents(state.events);
  log.unshift(`<b>第 ${round} 轮结算</b>：${lines.join("；") || "无事"}`);
  state.events = null;
  history = [];
  render();
}

function describe(a: V2Action): string {
  switch (a.t) {
    case "move": return `${role(state, a.r)} 移动 → ${name(a.to)}`;
    case "fly": return `${role(state, a.r)} 快速转移 → ${name(a.to)}`;
    case "treat": return `${role(state, a.r)} 治疗${STRAIN[a.s]}株`;
    case "give": return `${role(state, a.r)} 交出${STRAIN[a.s]}株样本`;
    case "cure": return `研制${STRAIN[a.s]}株解药`;
    case "build": return `${role(state, a.r)} 建研究站`;
    case "checkpoint": return `检查站：${name(EDGES[a.edge][0])}—${name(EDGES[a.edge][1])}`;
    case "lock": return `封城：${name(a.city)}`;
    case "unlock": return `解封：${name(a.city)}`;
    case "supply": return `物资补给：${name(state.pos[a.r])}及周边`;
    case "reroute": {
      const k = state.carriers.find((x) => x.id === a.carrier);
      const to = LINKS[k?.from ?? 0].find((l) => l.edge === a.edge)?.to ?? 0;
      return `改道：${k ? `${name(k.from)}→${name(k.to)}` : "?"} 改去 ${name(to)}`;
    }
    case "purge": {
      const k = state.carriers.find((x) => x.id === a.carrier);
      return `消除携带者：${k ? `${STRAIN[k.s]} ${name(k.from)}→${name(k.to)}` : "?"}`;
    }
    case "pass": return "跳过";
  }
}

function describeEvents(events: V2Event[]): string[] {
  const out: string[] = [];
  let spawned = 0, moved = 0;
  for (const e of events) {
    switch (e.t) {
      case "news": out.push(`新闻「${NEWS[e.id][0]}」`); break;
      case "spawn": spawned++; break;
      case "move": moved++; break;
      case "intercepted": out.push(`检查站拦下携带者（${name(EDGES[e.edge][0])}—${name(EDGES[e.edge][1])}）`); break;
      case "blocked": out.push(`${name(e.city)}封城挡下携带者`); break;
      case "infect": out.push(`${name(e.city)} ${STRAIN[e.s]}株 +1`); break;
      case "outbreak": out.push(`<b>${name(e.city)}爆发！</b>`); break;
      case "riot": out.push(`<b style="color:#c4472f">${name(e.city)}失控！</b>`); break;
      case "calm": out.push(`${name(e.city)}恢复秩序`); break;
      case "mutation": out.push(`${STRAIN[e.strain]}株变异：${e.m}`); break;
      case "lose": out.push(`<b>失败：${e.reason === "riot" ? "3 座城市失控" : "时间到"}</b>`); break;
    }
  }
  if (spawned) out.push(`新派出 ${spawned} 个携带者`);
  return out;
}

function arrivingNext(c: number): number {
  return state.carriers.filter((k) => k.to === c && k.left === 1 && k.born < state.round && !state.checkpoints.includes(k.edge)).length;
}

function render(): void {
  renderMap();
  renderPanel();
}

function renderMap(): void {
  const s = state;
  const parts: string[] = [];
  EDGES.forEach(([a, b], e) => {
    const A = P(a), B = P(b);
    const kind = EDGE_KIND[e];
    const style = kind === "rail" ? 'stroke="#2e2116" stroke-width="0.35" stroke-dasharray="0.3 0.3"' : kind === "sea" ? 'stroke="#2f6d8c" stroke-width="0.22" stroke-dasharray="0.5 0.6"' : 'stroke="#7a5c3a" stroke-width="0.3"';
    parts.push(`<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" ${style} />`);
    if (s.checkpoints.includes(e)) {
      const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      const ang = (Math.atan2(B.y - A.y, B.x - A.x) * 180) / Math.PI;
      parts.push(`<rect x="${mx - 0.15}" y="${my - 0.9}" width="0.3" height="1.8" fill="#c4472f" transform="rotate(${ang} ${mx} ${my})"><title>检查站</title></rect>`);
    }
  });
  for (let c = 0; c < CITY_COUNT; c++) {
    const { x, y } = P(c);
    const region = CITIES[c].strain;
    const panic = s.panic[c];
    const ring = 2 * Math.PI * 1.75;
    const hue = panic >= 80 ? "#c4472f" : panic >= 50 ? "#e08a2c" : "#c9a640";
    parts.push(`<g data-city="${c}">`);
    parts.push(`<circle cx="${x}" cy="${y}" r="1.75" fill="none" stroke="#00000018" stroke-width="0.35"/>`);
    parts.push(`<circle cx="${x}" cy="${y}" r="1.75" fill="none" stroke="${hue}" stroke-width="0.35" stroke-dasharray="${(ring * panic) / 100} ${ring}" transform="rotate(-90 ${x} ${y})"/>`);
    parts.push(`<circle cx="${x}" cy="${y}" r="1.4" fill="${TINT[region]}" stroke="${s.locked[c] ? "#111" : COLORS[region]}" stroke-width="${s.locked[c] ? 0.4 : 0.15}"/>`);
    if (s.riot[c]) parts.push(`<circle cx="${x}" cy="${y}" r="2.1" fill="none" stroke="#c4472f" stroke-width="0.25"><animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite"/></circle>`);
    parts.push(`<text x="${x}" y="${y - 0.35}" font-size="0.75" text-anchor="middle" fill="#2e2116">${name(c)}</text>`);
    let dx = -0.9;
    for (let k = 0; k < STRAINS; k++) {
      for (let i = 0; i < s.lv(c, k); i++) {
        parts.push(`<rect x="${x + dx}" y="${y + 0.15}" width="0.5" height="0.5" fill="${COLORS[k]}" stroke="#fff" stroke-width="0.06"/>`);
        dx += 0.6;
      }
    }
    parts.push(`<text x="${x}" y="${y + 1.15}" font-size="0.42" text-anchor="middle" fill="#6b5743">恐慌 ${panic}${s.locked[c] ? " · 封" : ""}${s.supply[c] ? " · 补" : ""}</text>`);
    if (s.stations.includes(c)) parts.push(`<text x="${x - 1.9}" y="${y - 1.1}" font-size="0.8">🏠</text>`);
    const inc = arrivingNext(c);
    if (inc) parts.push(`<text x="${x + 1.3}" y="${y - 1.3}" font-size="0.75" fill="#c4472f" font-weight="700">+${inc}</text>`);
    parts.push(`</g>`);
  }
  const perEdge = new Map<number, number>();
  for (const k of s.carriers) {
    const A = P(k.from), B = P(k.to);
    const total = s.travelTime(k.edge);
    const waiting = k.born >= s.round;
    const f = waiting ? 0.18 : Math.min(0.85, 0.2 + ((total - k.left) / total) * 0.6 + 0.15);
    const n = perEdge.get(k.edge) ?? 0;
    perEdge.set(k.edge, n + 1);
    const nx = -(B.y - A.y), ny = B.x - A.x, len = Math.hypot(nx, ny) || 1;
    const off = (n - 0.5) * 0.5;
    const cx = A.x + (B.x - A.x) * f + (nx / len) * off, cy = A.y + (B.y - A.y) * f + (ny / len) * off;
    parts.push(`<g><circle cx="${cx}" cy="${cy}" r="0.42" fill="${COLORS[k.s]}" stroke="#fff" stroke-width="0.1"/><text x="${cx}" y="${cy + 0.17}" font-size="0.48" text-anchor="middle" fill="#fff">${waiting ? "·" : k.left}</text><title>${STRAIN[k.s]}株携带者 ${name(k.from)}→${name(k.to)}，还要 ${k.left} 轮${waiting ? "（本轮末才出发）" : ""}</title></g>`);
  }
  s.roles.forEach((rid, r) => {
    const { x, y } = P(s.pos[r]);
    const ox = r === 0 ? -2.3 : 2.3;
    parts.push(`<circle cx="${x + ox}" cy="${y + 0.4}" r="0.8" fill="${r === agent ? "#2e2116" : "#6b5743"}" stroke="#fff" stroke-width="0.12"/><text x="${x + ox}" y="${y + 0.68}" font-size="0.8" text-anchor="middle" fill="#fff">${ROLE_NAMES[rid][0]}</text>`);
  });
  svg.innerHTML = parts.join("");
}

function renderPanel(): void {
  const s = state;
  const acts = s.legalActions();
  const mine = acts.filter((a) => "r" in a && a.r === agent);
  const unlocks = acts.filter((a) => a.t === "unlock");
  const roleOpts = (sel: RoleId) => ROLES.map((r) => `<option value="${r}" ${r === sel ? "selected" : ""}>${ROLE_NAMES[r]}</option>`).join("");
  const samples = (r: number) => [0, 1, 2].map((k) => `${STRAIN[k]}${s.sample(r, k)}`).join(" ");
  const danger = [...Array(CITY_COUNT).keys()].filter((c) => s.panic[c] >= 70 && !s.riot[c]).map((c) => `${name(c)} ${s.panic[c]}`).join("、");
  panel.innerHTML = `
    <h1>纸上防疫 v2 试玩（原型）</h1>
    <div class="row">
      <select id="r0">${roleOpts(team[0])}</select><select id="r1">${roleOpts(team[1])}</select>
      <input id="seed" placeholder="种子（可空）" size="9"><button id="new">开新局</button>
    </div>
    <h2>局面</h2>
    <div class="row">
      <span class="pill">第 ${s.round} / ${s.cfg.rounds} 轮</span>
      <span class="pill">行动点 ${s.ap}</span>
      <span class="pill ${s.riots() ? "bad" : ""}">失控 ${s.riots()} / ${s.cfg.riotLimit}</span>
      <span class="pill">在路上 ${s.carriers.length}</span>
      <span class="pill">检查站 ${s.checkpoints.length}/${s.maxCheckpoints()}</span>
    </div>
    <div class="row" style="margin-top:6px">${[0, 1, 2].map((k) => `<span class="pill" style="border-color:${COLORS[k]}">${STRAIN[k]}株 ${s.cured[k] ? "✓已研制" : `需 ${Math.min(s.cureNeed(0, k), s.cureNeed(1, k))}`}</span>`).join("")}</div>
    ${danger ? `<p style="color:#c4472f;margin:6px 0 0">接近失控：${danger}</p>` : ""}
    <h2>新闻</h2>
    <div class="news">本轮：<b>${NEWS[s.news][0]}</b><small>${NEWS[s.news][1]}</small></div>
    <div class="news">下轮预告：<b>${NEWS[s.nextNews][0]}</b><small>${NEWS[s.nextNews][1]}</small></div>
    <h2>队员</h2>
    <div class="row tabs">${s.roles.map((rid, r) => `<button data-agent="${r}" aria-pressed="${r === agent}">${ROLE_NAMES[rid]} @ ${name(s.pos[r])}<br><small>样本 ${samples(r)}</small></button>`).join("")}</div>
    <h2>${role(s, agent)}的行动</h2>
    <div class="acts">${mine.map((a, i) => `<button data-act="${acts.indexOf(a)}"><span>${describe(a)}</span><i>${s.cost(a)} 点</i></button>`).join("") || "<p class='help'>没有可用行动</p>"}</div>
    ${unlocks.length ? `<h2>解封（0 点）</h2><div class="acts">${unlocks.map((a) => `<button data-act="${acts.indexOf(a)}"><span>${describe(a)}</span><i>恐慌 ${s.panic[(a as { city: number }).city]}</i></button>`).join("")}</div>` : ""}
    <h2>回合</h2>
    <div class="row"><button class="primary" id="end" ${s.status === "playing" ? "" : "disabled"}>结束行动</button><button id="undo" ${history.length ? "" : "disabled"}>撤销</button></div>
    <h2>记录</h2>
    <div class="log">${log.slice(0, 40).join("<br>")}</div>
    <h2>说明</h2>
    <p class="help">
      圆点 = 携带者，数字 = 还要几轮到达（· = 本轮末才出发）。城市旁红色 +n = 本轮结算时会到达的数量。<br>
      外圈 = 恐慌（满 100 失控），粗黑边 = 封城。3 座城市同时失控就失败；研制 3 种解药获胜。<br>
      感染 3 级的城市每轮派出 1 个携带者；3 级时再进来 1 个就爆发，向所有邻城各派 1 个。<br>
      检查站拦下经过的第一个携带者（得样本，目标城恐慌 −15）。封城可对所在城市或相邻城市下令：挡住进出，但恐慌每轮 +25（警察 +12）。物资补给：所在城和邻城 2 轮内恐慌上涨减半。
    </p>`;
  panel.querySelectorAll<HTMLButtonElement>("[data-act]").forEach((b) => b.addEventListener("click", () => act(acts[Number(b.dataset.act)])));
  panel.querySelectorAll<HTMLButtonElement>("[data-agent]").forEach((b) => b.addEventListener("click", () => { agent = Number(b.dataset.agent); render(); }));
  panel.querySelector("#end")!.addEventListener("click", endTurn);
  panel.querySelector("#undo")!.addEventListener("click", undo);
  panel.querySelector("#new")!.addEventListener("click", () => {
    team = [(panel.querySelector("#r0") as HTMLSelectElement).value as RoleId, (panel.querySelector("#r1") as HTMLSelectElement).value as RoleId];
    const seed = Number((panel.querySelector("#seed") as HTMLInputElement).value);
    newGame(seed || undefined);
  });
  if (s.status !== "playing") showOver();
}

function showOver(): void {
  document.querySelector(".over")?.remove();
  const won = state.status === "won";
  const div = document.createElement("div");
  div.className = "over";
  div.innerHTML = `<div><h2 style="font-size:22px;color:${won ? "#5b7d4a" : "#c4472f"}">${won ? "防疫成功" : state.lossReason === "riot" ? "3 座城市失控" : "12 轮结束，未研制完"}</h2>
    <p>${won ? `得分 ${state.score()}（安全人口 ${POPULATION.reduce((n, p, c) => n + (state.riot[c] ? 0 : p), 0)} 万）` : `坚持到第 ${state.round} 轮`}</p>
    <button class="primary">再来一局</button></div>`;
  div.querySelector("button")!.addEventListener("click", () => { div.remove(); newGame(); });
  document.body.append(div);
}

svg.addEventListener("mousemove", (e) => {
  const g = (e.target as Element).closest("[data-city]");
  if (!g) {
    tip.style.display = "none";
    return;
  }
  const c = Number((g as HTMLElement).dataset.city);
  const s = state;
  const lv = [0, 1, 2].filter((k) => s.lv(c, k)).map((k) => `${STRAIN[k]}${s.lv(c, k)}`).join(" ") || "无";
  const inc = s.carriers.filter((k) => k.to === c).map((k) => `${STRAIN[k.s]}←${name(k.from)}（${k.left} 轮）`).join("<br>") || "无";
  tip.innerHTML = `<b>${name(c)}</b>（人口 ${POPULATION[c]} 万）<br>感染：${lv}<br>恐慌：${s.panic[c]}${s.riot[c] ? "（失控）" : ""}${s.locked[c] ? " · 封城中" : ""}${s.supply[c] ? ` · 补给 ${s.supply[c]} 轮` : ""}<br>来袭：<br>${inc}`;
  tip.style.display = "block";
  tip.style.left = `${e.clientX + 14}px`;
  tip.style.top = `${e.clientY + 14}px`;
});
svg.addEventListener("mouseleave", () => { tip.style.display = "none"; });

newGame();
