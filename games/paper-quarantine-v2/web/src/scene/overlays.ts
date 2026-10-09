import * as THREE from "three";
import type { Carrier, V2State } from "../../../engine/game.js";
import { CITY_COUNT, EDGES } from "../../../engine/map.js";
import type { Assets } from "../art/assets";
import { cityWorld, DISTRICT_R, routePoint } from "../art/mapArt";
import { paperCutout, texture, type PaperArt } from "../art/paper";
import { FONT } from "../i18n/locale";
import { clamp01, easeInOut, easeOutBack, reduceMotion } from "../util";
import { Standee } from "./standee";

const VIRUS_KEYS = ["virus_red", "virus_blue", "virus_gold"] as const;
const CARRIER_H = 1.7;

interface CarrierView {
  st: Standee;
  arrow: THREE.Mesh;
  label: THREE.Sprite;
  eta: number;
  pos: THREE.Vector3;
  from: THREE.Vector3;
  to: THREE.Vector3;
  dir: THREE.Vector3;
  start: number;
  dur: number;
  born: number;
  dying: number | null;
}

interface Pop {
  obj: THREE.Object3D;
  born: number;
  base: THREE.Vector3;
  standee?: Standee;
}

interface Thermo {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  tex: THREE.CanvasTexture;
  value: number;
  riot: boolean;
}

const labelCache = new Map<string, THREE.SpriteMaterial>();

function labelMaterial(text: string, bg: string, fg = "#fbf6ea"): THREE.SpriteMaterial {
  const key = `${text}|${bg}|${fg}`;
  let mat = labelCache.get(key);
  if (mat) return mat;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.font = `bold 72px ${FONT.display}`;
  const w = Math.min(240, g.measureText(text).width + 44);
  g.fillStyle = bg;
  g.beginPath();
  g.roundRect((256 - w) / 2, 14, w, 100, 22);
  g.fill();
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128, 68);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
  labelCache.set(key, mat);
  return mat;
}

function label(text: string, bg: string, scale = 1): THREE.Sprite {
  const s = new THREE.Sprite(labelMaterial(text, bg));
  s.scale.set(1.3 * scale, 0.65 * scale, 1);
  s.renderOrder = 10;
  return s;
}

let personArt: PaperArt | null = null;

function person(): PaperArt {
  if (personArt) return personArt;
  personArt = paperCutout((g) => {
    g.fillStyle = "#ffffff";
    g.strokeStyle = "#b9ad98";
    g.lineWidth = 5;
    g.lineJoin = "round";
    g.lineCap = "round";
    const body = new Path2D();
    body.moveTo(52, 112);
    body.quadraticCurveTo(80, 96, 108, 112);
    body.lineTo(124, 196);
    body.lineTo(108, 200);
    body.lineTo(100, 150);
    body.lineTo(104, 290);
    body.lineTo(86, 290);
    body.lineTo(80, 210);
    body.lineTo(74, 290);
    body.lineTo(56, 290);
    body.lineTo(60, 150);
    body.lineTo(52, 200);
    body.lineTo(36, 196);
    body.closePath();
    g.fill(body);
    g.stroke(body);
    g.beginPath();
    g.arc(80, 62, 30, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }, 160, 310, 9);
  return personArt;
}

const arrowGeo = (() => {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.42);
  shape.lineTo(0.3, -0.18);
  shape.lineTo(0, -0.04);
  shape.lineTo(-0.3, -0.18);
  shape.closePath();
  return new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
})();

export class Overlays {
  private carriers = new Map<number, CarrierView>();
  private thermos: Thermo[] = [];
  private locks = new Map<number, Pop[]>();
  private checkpoints = new Map<number, Pop>();
  private supplies = new Map<number, Pop & { rounds: number }>();
  private riotLabels = new Map<number, Pop>();
  private roads: { edge: number; glow: THREE.Mesh; hit: THREE.Mesh }[] = [];
  private group = new THREE.Group();
  private virusTex: THREE.Texture[];
  private arrowMats: THREE.MeshBasicMaterial[];

  constructor(scene: THREE.Scene, private assets: Assets) {
    scene.add(this.group);
    this.virusTex = VIRUS_KEYS.map((k) => texture(assets.tokenArt[k].front));
    this.arrowMats = ["#c4472f", "#2f6d8c", "#c9951a"].map((color) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
    for (let c = 0; c < CITY_COUNT; c++) {
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 320;
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      const p = cityWorld(c);
      sprite.position.set(p.x + DISTRICT_R + 0.15, 1.05, p.z + 0.9);
      sprite.scale.set(0.62, 2.07, 1);
      this.group.add(sprite);
      const t: Thermo = { sprite, canvas, tex, value: -1, riot: false };
      this.thermos.push(t);
      this.paintThermo(t, 0, false);
    }
  }

  setVisible(on: boolean): void {
    this.group.visible = on;
  }

  clear(): void {
    for (const id of [...this.carriers.keys()]) this.dropCarrier(id);
    for (const c of [...this.locks.keys()]) this.setLock(c, false);
    for (const map of [this.checkpoints, this.supplies, this.riotLabels] as Map<number, Pop>[]) {
      for (const pop of map.values()) this.group.remove(pop.obj);
      map.clear();
    }
    this.highlightRoads([]);
  }

  syncCity(s: V2State): void {
    const now = performance.now();
    for (let c = 0; c < CITY_COUNT; c++) {
      const t = this.thermos[c];
      if (t.value !== s.panic[c] || t.riot !== !!s.riot[c]) this.paintThermo(t, s.panic[c], !!s.riot[c]);
      this.setLock(c, !!s.locked[c]);
      this.setSupply(c, s.supply[c]);
      this.setRiotLabel(c, !!s.riot[c]);
    }
    const want = new Set(s.checkpoints);
    for (const [e, pop] of this.checkpoints) {
      if (!want.has(e)) {
        this.group.remove(pop.obj);
        this.checkpoints.delete(e);
      }
    }
    for (const e of want) {
      if (this.checkpoints.has(e)) continue;
      const st = new Standee(this.assets.tokenArt.lockdown, 1.0);
      st.outer.position.copy(routePoint(e, EDGES[e][0], 0.5));
      this.group.add(st.outer);
      this.checkpoints.set(e, { obj: st.outer, born: now, base: st.outer.scale.clone(), standee: st });
    }
  }

  private paintThermo(t: Thermo, panic: number, riot: boolean): void {
    t.value = panic;
    t.riot = riot;
    const g = t.canvas.getContext("2d")!;
    const W = t.canvas.width, H = t.canvas.height;
    g.clearRect(0, 0, W, H);
    const cx = W / 2, top = 18, bulbY = H - 48, tubeW = 26, bulbR = 30;
    g.fillStyle = "#fbf7ee";
    g.strokeStyle = "rgba(60, 40, 20, 0.55)";
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(cx - tubeW / 2 - 9, top - 9, tubeW + 18, bulbY - top + 18, 22);
    g.arc(cx, bulbY, bulbR + 9, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.roundRect(cx - tubeW / 2, top, tubeW, bulbY - top, 13);
    g.fillStyle = "#efe6d4";
    g.fill();
    g.stroke();
    const color = riot ? "#8a1f12" : panic >= 75 ? "#c4472f" : panic >= 45 ? "#e08a2c" : "#d9a23a";
    const fillTop = bulbY - (bulbY - top - 8) * (panic / 100);
    g.fillStyle = color;
    g.beginPath();
    g.roundRect(cx - tubeW / 2 + 6, fillTop, tubeW - 12, bulbY - fillTop, 7);
    g.fill();
    g.beginPath();
    g.arc(cx, bulbY, bulbR, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "rgba(60, 40, 20, 0.7)";
    g.stroke();
    g.lineWidth = 3;
    for (let k = 1; k < 5; k++) {
      const y = bulbY - ((bulbY - top - 8) * k) / 4;
      g.beginPath();
      g.moveTo(cx + tubeW / 2, y);
      g.lineTo(cx + tubeW / 2 + (k === 4 ? 16 : 9), y);
      g.stroke();
    }
    t.tex.needsUpdate = true;
  }

  private setLock(c: number, on: boolean): void {
    const have = this.locks.get(c);
    if (!!have === on) return;
    if (!on) {
      have!.forEach((p) => this.group.remove(p.obj));
      this.locks.delete(c);
      return;
    }
    const p = cityWorld(c);
    const now = performance.now();
    const pops = [-2.4, -0.75, 0.9, 2.5].map((a) => {
      const st = new Standee(this.assets.tokenArt.lockdown, 1.15);
      st.outer.position.set(p.x + Math.cos(a) * (DISTRICT_R + 0.25), 0, p.z + Math.sin(a) * (DISTRICT_R + 0.25));
      this.group.add(st.outer);
      return { obj: st.outer, born: now, base: st.outer.scale.clone(), standee: st };
    });
    this.locks.set(c, pops);
  }

  private setSupply(c: number, rounds: number): void {
    const have = this.supplies.get(c);
    if (!rounds) {
      if (have) {
        this.group.remove(have.obj);
        this.supplies.delete(c);
      }
      return;
    }
    if (have && have.rounds === rounds) return;
    if (have) this.group.remove(have.obj);
    const p = cityWorld(c);
    const tag = label(`补给 ${rounds}`, "#5b7d4a", 1.1);
    tag.position.set(p.x - 1.7, 1.3, p.z - 1.6);
    this.group.add(tag);
    this.supplies.set(c, { obj: tag, born: have ? 0 : performance.now(), base: tag.scale.clone(), rounds });
  }

  private setRiotLabel(c: number, on: boolean): void {
    const have = this.riotLabels.get(c);
    if (!!have === on) return;
    if (!on) {
      this.group.remove(have!.obj);
      this.riotLabels.delete(c);
      return;
    }
    const p = cityWorld(c);
    const s = label("失控", "#8a1f12", 1.3);
    s.position.set(p.x, 2.2, p.z - 1.9);
    this.group.add(s);
    this.riotLabels.set(c, { obj: s, born: performance.now(), base: s.scale.clone() });
  }

  // ---- roads ----

  highlightRoads(edges: number[]): void {
    for (const r of this.roads) this.group.remove(r.glow, r.hit);
    this.roads = edges.map((edge) => {
      const pts = Array.from({ length: 13 }, (_, i) => routePoint(edge, EDGES[edge][0], 0.24 + (i / 12) * 0.52).setY(0.12));
      const curve = new THREE.CatmullRomCurve3(pts);
      const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.2, 8), new THREE.MeshBasicMaterial({ color: "#ff6a3d", transparent: true, opacity: 0.8, depthWrite: false }));
      const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.95, 6), new THREE.MeshBasicMaterial({ visible: false }));
      hit.userData.edge = edge;
      this.group.add(glow, hit);
      return { edge, glow, hit };
    });
  }

  pickRoad(raycaster: THREE.Raycaster): number | null {
    const hit = raycaster.intersectObjects(this.roads.map((r) => r.hit), false)[0];
    return hit ? (hit.object.userData.edge as number) : null;
  }

  // ---- carriers ----

  private progress(s: V2State, k: Carrier): number {
    const total = s.travelTime(k.edge);
    return 0.32 + 0.44 * ((total - k.left) / total);
  }

  carrierPoint(s: V2State, k: Carrier, out = new THREE.Vector3()): THREE.Vector3 {
    routePoint(k.edge, k.from, this.progress(s, k), out);
    const same = s.carriers.filter((x) => x.edge === k.edge && x.from === k.from && x.left === k.left);
    const idx = same.indexOf(k);
    if (same.length > 1) {
      const a = cityWorld(k.from), b = cityWorld(k.to);
      const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
      const off = (idx - (same.length - 1) / 2) * 0.85;
      out.x += (-dz / len) * off;
      out.z += (dx / len) * off;
    }
    return out;
  }

  private heading(s: V2State, k: Carrier): THREE.Vector3 {
    const f = this.progress(s, k);
    const a = routePoint(k.edge, k.from, f), b = routePoint(k.edge, k.from, Math.min(1, f + 0.06));
    return b.sub(a).setY(0).normalize();
  }

  placeCarriers(s: V2State, ms: number, only?: (id: number) => boolean): void {
    const now = performance.now();
    for (const k of s.carriers) {
      if (only && !only(k.id)) continue;
      const target = this.carrierPoint(s, k);
      let v = this.carriers.get(k.id);
      if (!v) {
        const st = new Standee(person(), CARRIER_H);
        const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshStandardMaterial({ map: this.virusTex[k.s], alphaTest: 0.5, roughness: 0.8 }));
        badge.position.set(0, CARRIER_H * 0.6, 0.03);
        st.flip.add(badge);
        const tag = label(String(k.left), "#2e2116", 0.62);
        tag.position.set(0, CARRIER_H + 0.35, 0);
        st.outer.add(tag);
        st.outer.position.copy(target);
        const arrow = new THREE.Mesh(arrowGeo, this.arrowMats[k.s]);
        arrow.renderOrder = 2;
        this.group.add(st.outer, arrow);
        v = { st, arrow, label: tag, eta: k.left, pos: target.clone(), from: target.clone(), to: target.clone(), dir: this.heading(s, k), start: now, dur: 1, born: now, dying: null };
        this.carriers.set(k.id, v);
      } else {
        v.from.copy(v.pos);
        v.to.copy(target);
        v.dir.copy(this.heading(s, k));
        v.start = now;
        v.dur = reduceMotion ? 1 : ms;
      }
      if (v.eta !== k.left) {
        v.eta = k.left;
        v.label.material = labelMaterial(String(k.left), "#2e2116");
      }
    }
  }

  finishCarrier(id: number, at: THREE.Vector3 | null, ms: number): void {
    const v = this.carriers.get(id);
    if (!v) return;
    const now = performance.now();
    v.from.copy(v.pos);
    if (at) v.to.copy(at);
    v.start = now;
    v.dur = reduceMotion ? 1 : ms;
    v.dying = now + v.dur;
  }

  dropStale(s: V2State): void {
    const ids = new Set(s.carriers.map((k) => k.id));
    for (const id of [...this.carriers.keys()]) if (!ids.has(id)) this.dropCarrier(id);
  }

  private dropCarrier(id: number): void {
    const v = this.carriers.get(id);
    if (!v) return;
    this.group.remove(v.st.outer, v.arrow);
    this.carriers.delete(id);
  }

  checkpointPoint(edge: number): THREE.Vector3 {
    return routePoint(edge, EDGES[edge][0], 0.5);
  }

  arrivalPoint(k: Carrier): THREE.Vector3 {
    return routePoint(k.edge, k.from, 0.82);
  }

  update(now: number, camera: THREE.Camera): void {
    for (const [id, v] of this.carriers) {
      const t = clamp01((now - v.start) / v.dur);
      v.pos.lerpVectors(v.from, v.to, easeInOut(t));
      const hop = t < 1 ? Math.abs(Math.sin(t * Math.PI * 3)) * 0.3 : 0;
      v.st.outer.position.set(v.pos.x, hop, v.pos.z);
      const grow = easeOutBack(clamp01((now - v.born) / 380));
      const fade = v.dying !== null ? 1 - clamp01((now - v.dying) / 260) : 1;
      const k = Math.max(0.0001, grow * fade);
      v.st.outer.scale.setScalar(k);
      v.arrow.position.set(v.pos.x + v.dir.x * 0.95, 0.06, v.pos.z + v.dir.z * 0.95);
      v.arrow.rotation.y = Math.atan2(v.dir.x, v.dir.z);
      v.arrow.scale.setScalar(k);
      if (v.dying !== null && now > v.dying + 280) this.dropCarrier(id);
      else if (reduceMotion) v.st.face(camera, 0, 0);
      else v.st.face(camera, ...v.st.gust(now));
    }
    const pops: Pop[] = [...[...this.locks.values()].flat(), ...this.checkpoints.values(), ...this.supplies.values(), ...this.riotLabels.values()];
    for (const p of pops) {
      const k = p.born ? easeOutBack(clamp01((now - p.born) / 420)) : 1;
      p.obj.scale.copy(p.base).multiplyScalar(Math.max(0.0001, k));
      if (p.standee) p.standee.face(camera, 0, 0);
    }
    const pulse = 0.55 + Math.sin(now / 160) * 0.45;
    for (const p of this.riotLabels.values()) (p.obj as THREE.Sprite).material.opacity = 0.6 + pulse * 0.4;
    for (const t of this.thermos) {
      const shaky = t.riot || t.value >= 85;
      t.sprite.material.rotation = shaky && !reduceMotion ? Math.sin(now / 70) * 0.06 : 0;
    }
    const glow = 0.55 + Math.sin(now / 200) * 0.3;
    for (const r of this.roads) (r.glow.material as THREE.MeshBasicMaterial).opacity = glow;
  }
}
