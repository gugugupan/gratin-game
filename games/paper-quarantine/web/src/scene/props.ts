import * as THREE from "three";
import type { Assets } from "../art/assets";
import { SHEET_SCALE } from "../art/mapArt";
import { FONT, tr } from "../i18n/locale";
import { ID_TEXT } from "../ui/idcard";
import { canvasTexture } from "../art/paper";
import { ROLE_INFO, ROLE_ORDER } from "../data";
import { rand } from "../util";

const NOTE_LINES = tr({
  zh: ["今日任务", "研制三种解药", "别让爆发到 6 次", "12 轮内完成！"],
  ja: ["今日のミッション", "治療薬を 3 つ開発", "アウトブレイクは 6 回まで", "12 ラウンドで完了！"],
  en: ["Today's tasks", "Develop 3 cures", "Keep outbreaks under 6", "Done in 12 rounds!"],
});
import { createVirusToken } from "./tokens";

interface DeskLayout {
  rect: [number, number, number, number];
  mug: [number, number];
  stamp: [number, number, number];
  scissors: [number, number, number];
  note: [number, number, number];
  dish: [number, number, number];
  pencil: [number, number, number];
  roll: [number, number];
  ring: [number, number];
  cards: [number, number];
}

const LAYOUTS: Record<"landscape" | "portrait", DeskLayout> = {
  landscape: {
    rect: [-25, 24, -15.5, 15],
    mug: [-21, -8], stamp: [-21.5, 2, 0.25], scissors: [17.5, 12.6, -0.7], note: [-10, -15.2, 0.12], dish: [19.5, -9, 0],
    pencil: [9, 14.8, 0.55], roll: [-12, 14.6], ring: [-17.6, -11.2], cards: [20.5, 4.6],
  },
  portrait: {
    rect: [-12.5, 12.5, -23.5, 21],
    mug: [-8.2, -19.6], stamp: [-9.6, -14.2, 0.1], scissors: [1.6, 20.4, 0.5], note: [8.8, -19.4, -0.12], dish: [7.2, -14.8, 0],
    pencil: [-8.5, 17.8, 0.35], roll: [9.6, 17.2], ring: [-4.2, -22.2], cards: [0.5, 14.2],
  },
};

const shadowed = <T extends THREE.Mesh>(m: T, receive = true): T => {
  m.castShadow = true;
  m.receiveShadow = receive;
  return m;
};

export class DeskProps {
  readonly group = new THREE.Group();
  private mug = new THREE.Group();
  private stamp = new THREE.Group();
  private scissors = new THREE.Group();
  private pencil = new THREE.Group();
  private roll = new THREE.Group();
  private dish = new THREE.Group();
  private note: THREE.Mesh;
  private ring: THREE.Mesh;
  private cards: { mesh: THREE.Mesh; a: number; k: number }[] = [];

  constructor(scene: THREE.Scene, assets: Assets, ready: Promise<unknown>) {
    scene.add(this.group);
    this.buildMug();
    this.buildStamp();
    this.buildScissors();
    this.buildPencil();
    this.buildRoll();
    this.buildDish(assets);
    this.buildCards(assets, ready);
    this.note = this.buildNote(ready);
    this.ring = this.buildRing();
    this.group.add(this.mug, this.stamp, this.scissors, this.pencil, this.roll, this.dish, this.note, this.ring);
  }

  layout(portrait: boolean): DeskLayout {
    const L = portrait ? LAYOUTS.portrait : LAYOUTS.landscape;
    this.group.scale.setScalar(SHEET_SCALE);
    this.mug.position.set(L.mug[0], 0, L.mug[1]);
    this.stamp.position.set(L.stamp[0], 0, L.stamp[1]);
    this.stamp.rotation.y = L.stamp[2];
    this.scissors.position.set(L.scissors[0], 0, L.scissors[1]);
    this.scissors.rotation.y = L.scissors[2];
    this.note.position.set(L.note[0], 0.02, L.note[1]);
    this.note.rotation.y = L.note[2];
    this.dish.position.set(L.dish[0], 0, L.dish[1]);
    this.dish.rotation.y = L.dish[2];
    this.pencil.position.set(L.pencil[0], 0.3, L.pencil[1]);
    this.pencil.rotation.y = L.pencil[2];
    this.roll.position.set(L.roll[0], 0.45, L.roll[1]);
    this.ring.position.set(L.ring[0], 0.006, L.ring[1]);
    this.cards.forEach(({ mesh, a, k }) => {
      mesh.position.set(L.cards[0] + Math.sin(a) * 3.6, 0.02 + k * 0.012, L.cards[1] - Math.cos(a) * 3.6 + 3.6);
    });
    return { ...L, rect: L.rect.map((v) => v * SHEET_SCALE) as DeskLayout["rect"] };
  }

  private buildMug(): void {
    const ceramic = new THREE.MeshStandardMaterial({ color: "#efe7d7", roughness: 0.45 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.35, 2.8, 40), [ceramic, new THREE.MeshStandardMaterial({ color: "#4a2e1c", roughness: 0.25 }), ceramic]);
    body.position.y = 1.4;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(1.465, 1.455, 0.42, 40, 1, true), new THREE.MeshStandardMaterial({ color: "#c4472f", roughness: 0.5 }));
    band.position.y = 2.15;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 10, 40).rotateX(Math.PI / 2), ceramic);
    rim.position.y = 2.8;
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.17, 12, 24, Math.PI), ceramic);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(1.4, 1.45, 0);
    [body, band, rim, handle].forEach((m) => this.mug.add(shadowed(m)));
  }

  private buildStamp(): void {
    const tin = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.34, 2.2), new THREE.MeshStandardMaterial({ color: "#55585c", metalness: 0.5, roughness: 0.45 }));
    tin.position.y = 0.17;
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.04, 1.8), new THREE.MeshStandardMaterial({ color: "#7c2420", roughness: 0.9 }));
    pad.position.y = 0.36;
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.3), new THREE.MeshStandardMaterial({ color: "#9a6a3e", roughness: 0.8 }));
    block.position.set(2.7, 0.2, 0.4);
    const face = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), new THREE.MeshStandardMaterial({ color: "#b0342a", roughness: 0.9 }));
    face.position.set(2.7, 0.04, 0.4);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.2, 16), new THREE.MeshStandardMaterial({ color: "#b98a5a", roughness: 0.7 }));
    neck.position.set(2.7, 1.0, 0.4);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 12), new THREE.MeshStandardMaterial({ color: "#c4472f", roughness: 0.5 }));
    knob.position.set(2.7, 1.75, 0.4);
    [tin, pad, block, face, neck, knob].forEach((m) => this.stamp.add(shadowed(m)));
  }

  private buildScissors(): void {
    const steel = new THREE.MeshStandardMaterial({ color: "#c9cdd0", metalness: 0.8, roughness: 0.3 });
    const grip = new THREE.MeshStandardMaterial({ color: "#d9612f", roughness: 0.55 });
    [-0.16, 0.16].forEach((a, k) => {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 4.7), steel);
      blade.geometry.translate(0, 0, -1.25);
      blade.rotation.y = a;
      blade.position.y = 0.05 + k * 0.05;
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.17, 10, 28).rotateX(Math.PI / 2), grip);
      handle.position.set(Math.sin(-a) * 1.9 + (k ? 0.55 : -0.55), 0.17, 1.6);
      this.scissors.add(shadowed(blade, false), shadowed(handle, false));
    });
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.2, 12), steel);
    pivot.position.y = 0.12;
    this.scissors.add(pivot);
  }

  private buildPencil(): void {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), new THREE.MeshStandardMaterial({ color: "#e3b02a", roughness: 0.6, flatShading: true }));
    const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.3, 1.1, 6), new THREE.MeshStandardMaterial({ color: "#e8c9a0", roughness: 0.9, flatShading: true }));
    wood.position.y = 4.55;
    const lead = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.08, 0.3, 6), new THREE.MeshStandardMaterial({ color: "#3a3a3a" }));
    lead.position.y = 5.25;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.45, 12), new THREE.MeshStandardMaterial({ color: "#b8b8b0", metalness: 0.6, roughness: 0.4 }));
    band.position.y = -4.2;
    const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12), new THREE.MeshStandardMaterial({ color: "#e48f8a", roughness: 0.8 }));
    eraser.position.y = -4.65;
    [body, wood, lead, band, eraser].forEach((m) => this.pencil.add(shadowed(m, false)));
    this.pencil.rotation.z = Math.PI / 2;
  }

  private buildRoll(): void {
    const washi = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.9, 48, 1, true), new THREE.MeshStandardMaterial({ color: "#e7a49c", roughness: 0.8, side: THREE.DoubleSide }));
    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.92, 48, 1, true), new THREE.MeshStandardMaterial({ color: "#cfb488", roughness: 0.9, side: THREE.DoubleSide }));
    const face = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.5, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#efbdb5", roughness: 0.8 }));
    face.position.y = 0.451;
    [washi, core, face].forEach((m) => this.roll.add(shadowed(m)));
  }

  private buildDish(assets: Assets): void {
    const glass = new THREE.MeshStandardMaterial({ color: "#e4f4f1", transparent: true, opacity: 0.32, roughness: 0.08, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.08, 48), glass);
    base.position.y = 0.04;
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.5, 48, 1, true), glass);
    wall.position.y = 0.25;
    const agar = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.16, 48), new THREE.MeshStandardMaterial({ color: "#f0dcae", transparent: true, opacity: 0.85, roughness: 0.3 }));
    agar.position.y = 0.12;
    agar.receiveShadow = true;
    this.dish.add(agar, base, wall);
    const r = rand(5);
    for (let k = 0; k < 12; k++) {
      const v = createVirusToken(assets, k % 3);
      const ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * 1.8;
      v.scale.setScalar(0.85);
      v.position.set(Math.cos(ang) * rad, 0.21 + (k % 3) * 0.03, Math.sin(ang) * rad);
      v.rotation.y = r() * 6;
      this.dish.add(v);
    }
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.4, 48, 1, true), glass);
    lid.position.set(3.4, 0.2, 2.2);
    const lidTop = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.75, 0.05, 48), glass);
    lidTop.position.set(3.4, 0.03, 2.2);
    this.dish.add(lid, lidTop);
  }

  private buildCards(assets: Assets, ready: Promise<unknown>): void {
    ROLE_ORDER.forEach((role, k) => {
      const { name, color } = ROLE_INFO[role];
      const img = assets.roleImages[role];
      const tex = canvasTexture(330, 210, (g, w, h) => {
        g.fillStyle = "#f8f4ea";
        g.fillRect(0, 0, w, h);
        g.fillStyle = color;
        g.fillRect(0, 0, w, 34);
        g.fillStyle = "#fbf6ea";
        g.font = `15px ${FONT.body}`;
        g.textBaseline = "middle";
        g.fillText(ID_TEXT.header, 12, 18);
        g.fillStyle = "#c7dbe6";
        g.fillRect(14, 44, 70, 100);
        const sh = Math.min(img.height, img.width * (100 / 70));
        g.save();
        g.beginPath(); g.rect(14, 44, 70, 100); g.clip();
        g.drawImage(img, 0, 0, img.width, sh, 14, 44, 70, 100);
        g.restore();
        g.strokeStyle = "#93abba";
        g.lineWidth = 2;
        g.strokeRect(14, 44, 70, 100);
        g.fillStyle = "#6b5743";
        g.font = `12px ${FONT.body}`;
        g.fillText(ID_TEXT.role, 100, 58);
        g.fillStyle = "#2e2116";
        g.font = `28px ${FONT.display}`;
        const nw = g.measureText(name).width;
        if (nw > 210) g.font = `${(28 * 210) / nw}px ${FONT.display}`;
        g.fillText(name, 100, 86);
        g.fillStyle = "rgba(46,33,22,.25)";
        [112, 124, 136].forEach((y, i) => g.fillRect(100, y, 190 - i * 40, 5));
        g.fillStyle = "rgba(46,33,22,.4)";
        g.font = '13px "Courier Prime", monospace';
        g.fillText(`OB<<${String(k + 1).padStart(2, "0")}<<<<<<<<<<<<<<<<<<<`, 12, 178);
        g.strokeStyle = "#d6c9ae";
        g.lineWidth = 3;
        g.strokeRect(1.5, 1.5, w - 3, h - 3);
      }, ready);
      const mesh = shadowed(new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.9).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 })));
      const a = -0.6 + k * 0.17;
      mesh.rotation.y = -a;
      this.group.add(mesh);
      this.cards.push({ mesh, a, k });
    });
  }

  private buildNote(ready: Promise<unknown>): THREE.Mesh {
    const tex = canvasTexture(400, 400, (g, w) => {
      g.fillStyle = "#f2d974";
      g.fillRect(0, 0, w, w);
      g.fillStyle = "rgba(0,0,0,0.05)";
      g.fillRect(0, 0, w, 40);
      g.fillStyle = "#3a2c14";
      NOTE_LINES.forEach((t, k) => {
        g.font = `40px ${FONT.display}`;
        const tw = g.measureText(t).width;
        if (tw > w - 60) g.font = `${(40 * (w - 60)) / tw}px ${FONT.display}`;
        g.fillText(t, 34, 100 + k * 72);
      });
    }, ready);
    return shadowed(new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })));
  }

  private buildRing(): THREE.Mesh {
    const tex = canvasTexture(256, 256, (g, w) => {
      g.clearRect(0, 0, w, w);
      for (let k = 0; k < 3; k++) {
        g.strokeStyle = `rgba(92,58,30,${0.32 - k * 0.09})`;
        g.lineWidth = 9 - k * 2;
        g.beginPath();
        g.arc(w / 2 + k * 2, w / 2 - k, 92 - k * 3, 0.2 + k, Math.PI * 1.8 + k * 0.6);
        g.stroke();
      }
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(6, 6).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  }
}
