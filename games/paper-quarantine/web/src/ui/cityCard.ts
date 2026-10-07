import * as THREE from "three";
import type { State } from "../../../engine/game.js";
import { LINKS, STRAINS } from "../../../engine/map.js";
import { cityWorld } from "../art/mapArt";
import { CITY_NAMES, ROLE_INFO, STRAIN_CSS, STRAIN_SHORT } from "../data";
import { el } from "../util";

const REGION = ["赤域", "苍域", "金域"] as const;

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
    const state = s.eradicated[k] ? "已根除" : n >= max ? "已满，再感染就爆发" : n === 0 ? "暂无病毒" : `再 ${max - n} 个就爆发`;
    rows.push(`<li style="--c: var(${STRAIN_CSS[k]})"><b>${STRAIN_SHORT[k]}株</b><span class="dots">${dots}</span><small class="${n >= max ? "warn" : ""}">${state}${s.cured[k] && !s.eradicated[k] ? " · 已有解药" : ""}</small></li>`);
  }
  const facts: string[] = [];
  if (s.stations.includes(city)) facts.push("研究站");
  if (s.labCity === city) facts.push(`野战实验室 · 到第 ${s.labExpires} 轮`);
  if (s.isLocked(city)) facts.push("警察驻守封城");
  const here = s.roles.filter((_, r) => s.pos[r] === city).map((role) => ROLE_INFO[role].name);
  if (here.length) facts.push(`在场：${here.join("、")}`);
  const chance = Math.round(s.drawProbabilities()[city] * 100);
  const recent = s.lastDrawn.includes(city);
  const neighbours = LINKS[city].map(({ to }) => `<span style="--c: var(${STRAIN_CSS[Math.floor(to / 6)]})">${CITY_NAMES[to]}</span>`).join("");
  return `
    <header style="--c: var(${STRAIN_CSS[own]})">
      <h3>${CITY_NAMES[city]}</h3>
      <small>${REGION[own]}${city % 6 === 0 ? " · 中枢城市" : ""}</small>
    </header>
    <ul class="city-virus">${rows.join("")}</ul>
    <p class="city-risk"><span>下一轮被感染</span><b class="num">${chance}%</b>${recent ? `<small>上一轮刚被感染</small>` : ""}</p>
    ${facts.length ? `<p class="city-facts">${facts.join(" · ")}</p>` : ""}
    <div class="city-links"><small>相邻</small>${neighbours}</div>`;
}
