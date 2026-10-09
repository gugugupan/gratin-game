import * as THREE from "three";
import { POPULATION, type V2State } from "../../../engine/game.js";
import { LINKS, STRAINS } from "../../../engine/map.js";
import { cityWorld } from "../art/mapArt";
import { CITY_NAMES, REGION_NAMES, ROLE_INFO, STRAIN_CSS, STRAIN_NAME } from "../data";

import { el } from "../util";


export class CityCard {
  private root = el("city-card");
  private tmp = new THREE.Vector3();
  city: number | null = null;

  open(state: V2State, city: number): void {
    this.city = city;
    this.root.innerHTML = cityHtml(state, city);
    this.root.hidden = false;
    this.root.classList.remove("in");
    void this.root.offsetWidth;
    this.root.classList.add("in");
  }

  update(state: V2State): void {
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

function cityHtml(s: V2State, city: number): string {
  const own = Math.floor(city / 6);
  const rows: string[] = [];
  for (let k = 0; k < STRAINS; k++) {
    const n = s.lv(city, k);
    if (!n && k !== own) continue;
    const max = s.maxLevel(k);
    const dots = Array.from({ length: max }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("");
    const note = s.cured[k] ? "已有解药" : n >= max ? "已满：再进 1 个就爆发" : n === max - 1 ? "再进 1 个就会开始派出携带者" : n === 0 ? "暂无病毒" : `${max - n} 级后满`;
    rows.push(`<li style="--c: var(${STRAIN_CSS[k]})"><b>${STRAIN_NAME[k]}</b><span class="dots">${dots}</span><small class="${n >= max ? "warn" : ""}">${note}</small></li>`);
  }
  const panic = s.panic[city];
  const status: string[] = [];
  if (s.riot[city]) status.push(`<b class="warn">失控中</b>：每轮多派 1 个携带者，在这里行动多花 1 点；恐慌降到 ${s.cfg.riotRecover} 以下恢复`);
  if (s.locked[city]) status.push(`封城中：挡住进出，恐慌每轮 +${s.locked[city] === 2 ? s.cfg.panic.policeLocked : s.cfg.panic.locked}`);
  if (s.supply[city]) status.push(`物资补给还剩 ${s.supply[city]} 轮：恐慌上涨减半`);
  if (s.stations.includes(city)) status.push("研究站");
  const here = s.roles.filter((_, r) => s.pos[r] === city).map((role) => ROLE_INFO[role].name);
  if (here.length) status.push(`在场：${here.join("、")}`);
  const incoming = s.carriers.filter((k) => k.to === city).map((k) => {
    const caught = s.checkpoints.includes(k.edge) ? " · 会被检查站拦下" : s.locked[city] ? " · 会被封城挡住" : "";
    return `<li style="--c: var(${STRAIN_CSS[k.s]})"><b>${STRAIN_NAME[k.s]}</b> 来自${CITY_NAMES[k.from]} · ${k.left === 1 ? "本轮结束时到达" : `还要 ${k.left} 轮`}${caught}</li>`;
  });
  const neighbours = LINKS[city].map(({ to }) => `<span style="--c: var(${STRAIN_CSS[Math.floor(to / 6)]})">${CITY_NAMES[to]}</span>`).join("");
  return `
    <header style="--c: var(${STRAIN_CSS[own]})">
      <h3>${CITY_NAMES[city]}</h3>
      <small>${REGION_NAMES[own]}${city === 0 ? " · 首府" : ""} · 人口 ${POPULATION[city]} 万</small>
    </header>
    <ul class="city-virus">${rows.join("")}</ul>
    <div class="city-panic"><span>恐慌</span><span class="bar"><i style="width:${panic}%;background:${panic >= 75 ? "var(--red)" : panic >= 45 ? "#e08a2c" : "#c9a640"}"></i></span><b class="num">${panic}</b></div>
    ${status.length ? `<p class="city-facts">${status.join("<br>")}</p>` : ""}
    <div class="city-incoming"><small>来袭的携带者</small>${incoming.length ? `<ul>${incoming.join("")}</ul>` : "<p>无</p>"}</div>
    <div class="city-links"><small>相邻</small>${neighbours}</div>`;
}
