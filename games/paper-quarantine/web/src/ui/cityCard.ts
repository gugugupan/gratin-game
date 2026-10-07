import * as THREE from "three";
import type { State } from "../../../engine/game.js";
import { LINKS, STRAINS } from "../../../engine/map.js";
import { cityWorld } from "../art/mapArt";
import { CITY_NAMES, REGION_NAMES, ROLE_INFO, STRAIN_CSS, STRAIN_NAME } from "../data";
import { tr } from "../i18n/locale";

const CC = tr({
  zh: {
    eradicated: "已根除", full: "已满，再感染就爆发", empty: "暂无病毒", untilOutbreak: (n: number) => `再 ${n} 个就爆发`, cured: "已有解药",
    station: "研究站", lab: (r: number) => `野战实验室 · 到第 ${r} 轮`, lockdown: "警察驻守封城", here: (who: string[]) => `在场：${who.join("、")}`,
    capital: "首府", risk: "下一轮被感染", recent: "上一轮刚被感染", links: "相邻",
  },
  ja: {
    eradicated: "根絶", full: "満杯：次でアウトブレイク", empty: "病原体なし", untilOutbreak: (n: number) => `あと ${n} 個でアウトブレイク`, cured: "治療薬あり",
    station: "研究所", lab: (r: number) => `野外ラボ · 第 ${r} ラウンドまで`, lockdown: "警察官が駐在封鎖中", here: (who: string[]) => `滞在：${who.join("、")}`,
    capital: "首都", risk: "次のラウンドに感染", recent: "前回感染したばかり", links: "隣接",
  },
  en: {
    eradicated: "Eradicated", full: "Full: next one breaks out", empty: "No virus", untilOutbreak: (n: number) => `${n} more to break out`, cured: "cure ready",
    station: "Research station", lab: (r: number) => `Field lab until round ${r}`, lockdown: "Police lockdown", here: (who: string[]) => `Here: ${who.join(", ")}`,
    capital: "Capital", risk: "Chance of infection next round", recent: "Just infected", links: "Next to",
  },
});
import { el } from "../util";


export class CityCard {
  private root = el("city-card");
  private tmp = new THREE.Vector3();
  city: number | null = null;

  open(state: State, city: number): void {
    this.city = city;
    this.root.innerHTML = cityHtml(state, city);
    this.root.hidden = false;
    this.root.classList.remove("in");
    void this.root.offsetWidth;
    this.root.classList.add("in");
  }

  update(state: State): void {
    if (this.city !== null) this.root.innerHTML = cityHtml(state, this.city);
  }

  close(): void {
    this.city = null;
    this.root.hidden = true;
  }

  position(camera: THREE.Camera): void {
    if (this.city === null) return;
    const v = cityWorld(this.city, this.tmp).project(camera);
    const x = ((v.x + 1) / 2) * innerWidth, y = ((1 - v.y) / 2) * innerHeight;
    const w = this.root.offsetWidth, h = this.root.offsetHeight;
    const gap = Math.min(110, innerWidth * 0.12);
    let left = x + gap;
    if (left + w > innerWidth - 16) left = x - gap - w;
    left = Math.max(16, Math.min(innerWidth - 16 - w, left));
    const topLimit = document.querySelector(".top")!.getBoundingClientRect().bottom + 8;
    const bottomLimit = el("team-cards").getBoundingClientRect().top - 8;
    const top = Math.max(topLimit, Math.min(bottomLimit - h, y - h / 2));
    this.root.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }
}

function cityHtml(s: State, city: number): string {
  const own = Math.floor(city / 6);
  const rows: string[] = [];
  for (let k = 0; k < STRAINS; k++) {
    const n = s.cube(city, k);
    if (!n && k !== own) continue;
    const max = s.maxCubes(k);
    const dots = Array.from({ length: max }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("");
    const state = s.eradicated[k] ? CC.eradicated : n >= max ? CC.full : n === 0 ? CC.empty : CC.untilOutbreak(max - n);
    rows.push(`<li style="--c: var(${STRAIN_CSS[k]})"><b>${STRAIN_NAME[k]}</b><span class="dots">${dots}</span><small class="${n >= max ? "warn" : ""}">${state}${s.cured[k] && !s.eradicated[k] ? ` · ${CC.cured}` : ""}</small></li>`);
  }
  const facts: string[] = [];
  if (s.stations.includes(city)) facts.push(CC.station);
  if (s.labCity === city) facts.push(CC.lab(s.labExpires));
  if (s.isLocked(city)) facts.push(CC.lockdown);
  const here = s.roles.filter((_, r) => s.pos[r] === city).map((role) => ROLE_INFO[role].name);
  if (here.length) facts.push(CC.here(here));
  const chance = Math.round(s.drawProbabilities()[city] * 100);
  const recent = s.lastDrawn.includes(city);
  const neighbours = LINKS[city].map(({ to }) => `<span style="--c: var(${STRAIN_CSS[Math.floor(to / 6)]})">${CITY_NAMES[to]}</span>`).join("");
  return `
    <header style="--c: var(${STRAIN_CSS[own]})">
      <h3>${CITY_NAMES[city]}</h3>
      <small>${REGION_NAMES[own]}${city === 0 ? ` · ${CC.capital}` : ""}</small>
    </header>
    <ul class="city-virus">${rows.join("")}</ul>
    <p class="city-risk"><span>${CC.risk}</span><b class="num">${chance}%</b>${recent ? `<small>${CC.recent}</small>` : ""}</p>
    ${facts.length ? `<p class="city-facts">${facts.join(" · ")}</p>` : ""}
    <div class="city-links"><small>${CC.links}</small>${neighbours}</div>`;
}
