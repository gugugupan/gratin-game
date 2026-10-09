import * as THREE from "three";
import { texture, type PaperArt } from "../art/paper";

export const paperWhite = new THREE.MeshStandardMaterial({ color: "#f7f0e2", roughness: 0.9 });

interface Wind {
  next: number;
  start: number;
  amp: number;
  dir: number;
}

export class Standee {
  readonly outer = new THREE.Group();
  readonly rise = new THREE.Group();
  readonly flip = new THREE.Group();
  readonly front: THREE.Mesh;
  facing = 1;
  private wind: Wind | null = null;
  private alpha: Uint8ClampedArray | null = null;

  constructor(readonly art: PaperArt, height: number) {
    this.outer.add(this.rise);
    this.rise.add(this.flip);
    const w = (height * art.front.width) / art.front.height;
    const geo = new THREE.PlaneGeometry(w, height);
    geo.translate(0, height / 2 - 0.08, 0);
    const frontTex = texture(art.front);
    this.front = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: frontTex, alphaTest: 0.5, roughness: 0.85 }));
    this.front.position.z = 0.012;
    const back = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texture(art.back), alphaTest: 0.5, roughness: 0.95 }));
    back.rotation.y = Math.PI;
    back.position.z = -0.012;
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: frontTex, alphaTest: 0.5 });
    [this.front, back].forEach((m) => { m.castShadow = true; m.customDepthMaterial = depth; this.flip.add(m); });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.08, 32), paperWhite);
    base.position.y = 0.04;
    base.castShadow = base.receiveShadow = true;
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), paperWhite);
    tab.position.set(0, 0.09, -0.18);
    tab.rotation.x = -0.5;
    tab.castShadow = true;
    this.rise.add(base, tab);
  }

  gust(now: number): [number, number] {
    if (!this.wind) this.wind = { next: now + 1200 + Math.random() * 3500, start: -1, amp: 0, dir: 1 };
    const w = this.wind;
    if (w.start < 0) {
      if (now < w.next) return [0, 0];
      Object.assign(w, { start: now, amp: 0.06 + Math.random() * 0.07, dir: Math.random() < 0.5 ? -1 : 1 });
    }
    const k = (now - w.start) / 1000;
    if (k > 3.2) {
      Object.assign(w, { start: -1, next: now + 2500 + Math.random() * 5500 });
      return [0, 0];
    }
    const env = Math.min(1, k * 5) * Math.exp(-k * 1.5);
    return [w.dir * w.amp * env * Math.sin(k * 8.5), w.amp * 0.55 * env * (0.55 + 0.45 * Math.sin(k * 6.1 + 0.8))];
  }

  face(camera: THREE.Camera, wobble: number, lean: number, billboard = true): void {
    if (billboard) {
      const p = this.outer.getWorldPosition(tmp);
      this.outer.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
    }
    this.flip.scale.x += (this.facing - this.flip.scale.x) * 0.18;
    this.flip.rotation.z = wobble;
    this.flip.rotation.x = -lean;
  }

  opaqueAt(uv: THREE.Vector2): boolean {
    if (!this.alpha) {
      const c = this.art.front;
      this.alpha = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    }
    const w = this.art.front.width, h = this.art.front.height;
    const x = Math.min(w - 1, Math.floor(uv.x * w)), y = Math.min(h - 1, Math.floor((1 - uv.y) * h));
    return this.alpha[(y * w + x) * 4 + 3] > 100;
  }
}

const tmp = new THREE.Vector3();
