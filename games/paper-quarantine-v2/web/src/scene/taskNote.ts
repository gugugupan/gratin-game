import * as THREE from "three";
import type { V2State } from "../../../engine/game.js";
import { SHEET_H } from "../art/mapArt";
import { texture } from "../art/paper";
import { FONT } from "../i18n/locale";

export const TASK = {
  title: "任务",
  goal: (n: number) => `研制 3 种解药（${n}/3）`,
  lose: "失败条件",
  riots: (n: number, of: number) => `${of} 座城市同时失控（${n}/${of}）`,
  time: (round: number, of: number) => `${of} 轮结束（第 ${round} 轮）`,
  go: "出发",
  lead: "研制出 3 种解药就获胜。出现以下任一情况就失败：",
};

const SIZE = 512;

export class TaskNote {
  readonly mesh: THREE.Mesh;
  private canvas = document.createElement("canvas");
  private tex: THREE.CanvasTexture;
  private key = "";

  constructor() {
    this.canvas.width = this.canvas.height = SIZE;
    this.tex = texture(this.canvas);
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.8, 4.8).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.9 }),
    );
    this.mesh.position.set(5.8, 0.03, -(SHEET_H / 2 + 1.5));
    this.mesh.rotation.y = -0.1;
    this.mesh.castShadow = this.mesh.receiveShadow = true;
  }

  update(s: V2State): void {
    const cures = s.curedCount();
    const riots = s.riots();
    const key = [cures, riots, s.cfg.riotLimit, s.round, s.cfg.rounds].join(",");
    if (key === this.key) return;
    this.key = key;
    const g = this.canvas.getContext("2d")!;
    g.fillStyle = "#f2d974";
    g.fillRect(0, 0, SIZE, SIZE);
    g.fillStyle = "rgba(0,0,0,0.05)";
    g.fillRect(0, 0, SIZE, 46);
    g.fillStyle = "rgba(236, 222, 176, 0.85)";
    g.save();
    g.translate(SIZE / 2, 10);
    g.rotate(-0.04);
    g.fillRect(-90, -18, 180, 40);
    g.restore();
    const line = (text: string, y: number, size: number, color: string, x = 34) => {
      g.fillStyle = color;
      g.font = `${size}px ${FONT.display}`;
      const w = g.measureText(text).width;
      if (w > SIZE - x - 24) g.font = `${(size * (SIZE - x - 24)) / w}px ${FONT.display}`;
      g.fillText(text, x, y);
    };
    const ink = "#3a2c14", red = "#b8371f";
    g.textBaseline = "middle";
    line(TASK.title, 92, 50, ink);
    line(`${cures >= 3 ? "☑" : "☐"} ${TASK.goal(cures)}`, 166, 34, ink);
    line(TASK.lose, 244, 30, "#6b5743");
    line(`✕ ${TASK.riots(riots, s.cfg.riotLimit)}`, 320, 32, riots >= s.cfg.riotLimit - 1 ? red : ink, 46);
    line(`✕ ${TASK.time(s.round, s.cfg.rounds)}`, 400, 32, s.cfg.rounds - s.round + 1 <= 3 ? red : ink, 46);
    this.tex.needsUpdate = true;
  }
}
