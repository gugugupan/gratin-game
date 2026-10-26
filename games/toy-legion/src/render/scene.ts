import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { MapDef } from '../engine';
import { OUTLINE_RES } from './figures';
import { HQ_S, PAD_S, U } from './board';

const VIEW_DIR = new THREE.Vector3(0, 24.5, 14).normalize();
type Tween = { start: number; dur: number; fn: (k: number) => void; done: () => void };

export interface Insets { top: number; bottom: number }

export class Stage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  private tweens: Tween[] = [];
  private frameHooks: ((t: number, dt: number) => void)[] = [];
  private size = { w: 0, h: 0 };
  private last = performance.now();
  private raycaster = new THREE.Raycaster();

  constructor(private canvas: HTMLCanvasElement, private map: MapDef, private insets: () => Insets) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.toneMapping = THREE.NeutralToneMapping;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
    this.scene.environmentIntensity = .4;
    this.scene.add(new THREE.HemisphereLight(0xfff6e5, 0x5d6d8f, .55));
    const key = new THREE.DirectionalLight(0xfff1d6, 2.2);
    key.position.set(6, 12, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    Object.assign(key.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 45 });
    key.shadow.bias = -.0004;
    key.shadow.normalBias = .03;
    this.scene.add(key);
    const rimLight = new THREE.DirectionalLight(0xbcd2ff, .9);
    rimLight.position.set(-8, 6, -8);
    this.scene.add(rimLight);
    requestAnimationFrame(this.frame);
  }

  onFrame(fn: (t: number, dt: number) => void) { this.frameHooks.push(fn); }

  tween(dur: number, fn: (k: number) => void): Promise<void> {
    return new Promise(done => this.tweens.push({ start: performance.now(), dur, fn, done }));
  }

  refit() { this.size = { w: 0, h: 0 }; }

  private fit(w: number, h: number) {
    const narrow = w / h < .72;
    const BW = this.map.width * U, BH = this.map.height * U;
    let b = { minX: -BW / 2 - .6, maxX: BW / 2 + .6, minZ: -BH / 2 - .6, maxZ: BH / 2 + .6 };
    if (narrow) {
      b = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
      for (const n of Object.values(this.map.nodes)) {
        const x = (n.pos[0] - this.map.width / 2) * U, z = (n.pos[1] - this.map.height / 2) * U;
        const r = (n.type === 'hq' ? 1.05 * HQ_S : .66 * PAD_S) + .3;
        b.minX = Math.min(b.minX, x - r); b.maxX = Math.max(b.maxX, x + r);
        b.minZ = Math.min(b.minZ, z - r); b.maxZ = Math.max(b.maxZ, z + r);
      }
      const hw = Math.max(-b.minX, b.maxX), hd = Math.max(-b.minZ, b.maxZ);
      b = { minX: -hw, maxX: hw, minZ: -hd, maxZ: hd };
    }
    const target = new THREE.Vector3((b.minX + b.maxX) / 2, 0, (b.minZ + b.maxZ) / 2);
    const pts: THREE.Vector3[] = [];
    for (const x of [b.minX, b.maxX]) for (const z of [b.minZ, b.maxZ]) for (const y of [0, 1.4]) pts.push(new THREE.Vector3(x, y, z));
    const cam = this.camera;
    cam.clearViewOffset();
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    const { top, bottom } = this.insets();
    const yMax = 1 - 2 * (top + 4) / h, yMin = -1 + 2 * (bottom + 8) / h;
    const v = new THREE.Vector3();
    const measure = (d: number) => {
      cam.position.copy(target).addScaledVector(VIEW_DIR, d);
      cam.lookAt(target);
      cam.updateMatrixWorld();
      let lo = Infinity, hi = -Infinity, mx = 0;
      for (const p of pts) { v.copy(p).project(cam); lo = Math.min(lo, v.y); hi = Math.max(hi, v.y); mx = Math.max(mx, Math.abs(v.x)); }
      return { lo, hi, mx };
    };
    const fits = (d: number) => { const m = measure(d); return m.mx <= .97 && m.hi - m.lo <= (yMax - yMin) * .98; };
    let lo = 3, hi = 90;
    for (let i = 0; i < 28; i++) { const d = (lo + hi) / 2; if (fits(d)) hi = d; else lo = d; }
    const m = measure(hi);
    cam.setViewOffset(w, h, 0, ((yMin + yMax) / 2 - (m.lo + m.hi) / 2) * h / 2, w, h);
    if (this.scene.fog instanceof THREE.Fog) { this.scene.fog.near = hi + 4; this.scene.fog.far = hi + 38; }
    OUTLINE_RES.value.set(w, h);
  }

  pickGround(clientX: number, clientY: number, y: number): THREE.Vector3 | null {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    const hit = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -y), hit) ? hit : null;
  }

  private frame = (now: number) => {
    const dt = Math.min((now - this.last) / 1000, .05);
    this.last = now;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (w !== this.size.w || h !== this.size.h) {
      this.size = { w, h };
      this.renderer.setSize(w, h, false);
      this.fit(w, h);
    }
    for (const tw of [...this.tweens]) {
      const k = Math.min(1, (now - tw.start) / tw.dur);
      tw.fn(k);
      if (k >= 1) { this.tweens.splice(this.tweens.indexOf(tw), 1); tw.done(); }
    }
    for (const fn of this.frameHooks) fn(now / 1000, dt);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.frame);
  };
}
