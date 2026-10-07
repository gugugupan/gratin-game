import * as THREE from "three";
import { SHEET_H } from "../art/mapArt";
import { kraftCanvas, texture } from "../art/paper";
import { clamp01, easeInOut } from "../util";

export interface CalendarInfo {
  round: number;
  rounds: number;
  epidemics: number;
  epidemicsTotal: number;
  rate: number;
}

const W = 4.2, H = 4.2, TILT = -0.42;

class Page {
  readonly group = new THREE.Group();
  private canvas = document.createElement("canvas");
  private tex: THREE.CanvasTexture;
  info: CalendarInfo | null = null;

  constructor(geo: THREE.PlaneGeometry, backMat: THREE.Material) {
    this.canvas.width = this.canvas.height = 512;
    this.tex = texture(this.canvas);
    const front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.9 }));
    const back = new THREE.Mesh(geo, backMat);
    [front, back].forEach((m) => { m.castShadow = true; m.receiveShadow = true; this.group.add(m); });
  }

  paint(info: CalendarInfo): void {
    this.info = info;
    const g = this.canvas.getContext("2d")!;
    const w = 512;
    g.drawImage(kraftCanvas(w, w, "#fbf6ea", 40 + info.round, 0.25), 0, 0);
    g.fillStyle = "#c4472f";
    g.fillRect(0, 0, w, 92);
    g.fillStyle = "#fbf6ea";
    g.font = '44px "ZCOOL XiaoWei", serif';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("回 合", w / 2, 50);
    g.fillStyle = "#2e2116";
    g.font = 'bold 230px "Courier Prime", monospace';
    g.fillText(String(info.round).padStart(2, "0"), w / 2, 250);
    g.font = '34px "ZCOOL XiaoWei", serif';
    g.fillText(`第 ${info.round} 轮 · 共 ${info.rounds} 轮`, w / 2, 410);
    g.fillStyle = "#6b5743";
    g.font = '28px "ZCOOL XiaoWei", serif';
    g.fillText(`流行病 ${info.epidemics} / ${info.epidemicsTotal} · 每轮感染 ${info.rate} 城`, w / 2, 462);
    g.strokeStyle = "rgba(46,33,22,.25)";
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(60, 372); g.lineTo(w - 60, 372); g.stroke();
    this.tex.needsUpdate = true;
  }
}

export class Calendar {
  readonly group = new THREE.Group();
  private top: Page;
  private under: Page;
  private flip: { start: number; info: CalendarInfo } | null = null;
  private shown: CalendarInfo | null = null;

  constructor(ready: Promise<unknown>) {
    const boardMat = new THREE.MeshStandardMaterial({ color: "#8a6a45", roughness: 0.9 });
    const board = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, H + 0.3, 0.08), boardMat);
    board.geometry.translate(0, -(H + 0.3) / 2, -0.06);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, H + 0.3, 0.08), boardMat);
    leg.geometry.translate(0, -(H + 0.3) / 2, 0);
    const binding = new THREE.Group();
    binding.position.y = (H + 0.3) * Math.cos(TILT) - 0.02;
    binding.rotation.x = TILT;
    leg.rotation.x = -TILT * 2;
    leg.position.z = -0.08;
    [board, leg].forEach((m) => { m.castShadow = true; m.receiveShadow = true; binding.add(m); });
    const pageGeo = new THREE.PlaneGeometry(W, H);
    pageGeo.translate(0, -H / 2 - 0.12, 0);
    const backMat = new THREE.MeshStandardMaterial({ color: "#efe6d2", roughness: 0.95, side: THREE.BackSide });
    this.under = new Page(pageGeo, backMat);
    this.under.group.position.z = 0.005;
    this.top = new Page(pageGeo, backMat);
    this.top.group.position.z = 0.01;
    binding.add(this.under.group, this.top.group);
    const ringMat = new THREE.MeshStandardMaterial({ color: "#9a9a92", metalness: 0.7, roughness: 0.35 });
    for (let k = 0; k < 7; k++) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 16), ringMat);
      r.rotation.y = Math.PI / 2;
      r.position.set(-W / 2 + 0.4 + k * ((W - 0.8) / 6), 0, 0.02);
      binding.add(r);
    }
    this.group.add(binding);
    this.group.position.set(0, 0, -(SHEET_H / 2 + 2.1));
    ready.then(() => {
      if (this.top.info) this.top.paint(this.top.info);
      if (this.under.info) this.under.paint(this.under.info);
    });
  }

  show(info: CalendarInfo, animate: boolean): void {
    if (this.shown && this.shown.round === info.round && this.shown.epidemics === info.epidemics && this.shown.rounds === info.rounds) return;
    const turned = this.shown !== null && info.round !== this.shown.round;
    this.shown = info;
    if (!animate || !turned) {
      this.flip = null;
      this.top.group.rotation.x = 0;
      this.top.paint(info);
      this.under.paint(info);
      return;
    }
    this.under.paint(info);
    this.flip = { start: performance.now(), info };
  }

  update(now: number): void {
    if (!this.flip) return;
    const k = clamp01((now - this.flip.start) / 900);
    this.top.group.rotation.x = -(Math.PI + 0.75) * easeInOut(k);
    if (k >= 1) {
      this.top.paint(this.flip.info);
      this.top.group.rotation.x = 0;
      this.flip = null;
    }
  }
}
