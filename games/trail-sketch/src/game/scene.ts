import * as THREE from 'three';
import { GameMap, MH, W, elevAt } from '../core/map';
import { drawMapCanvas, drawPaperMargin, TEX_SCALE } from './mapTexture';

export const UNIT = 0.01;
export const MAP_W = W * UNIT;
export const MAP_H = MH * UNIT;
const RELIEF = 0.4;
const SHEET_PAD = 2.2;
const SHEET_BOTTOM = 2.2;

export function mapToWorld(x: number, y: number, m: GameMap | null, lift = 0) {
  return new THREE.Vector3(x * UNIT - MAP_W / 2, (m ? heightAt(m, x, y) : 0) + lift, y * UNIT - MAP_H / 2);
}

export function heightAt(m: GameMap, x: number, y: number) {
  const e = Math.max(0, elevAt(m, x, y) - m.sea);
  const edge = Math.min(x, W - x, y, MH - y);
  const taper = Math.max(0, Math.min(1, edge / 14));
  return 0.004 + (e / 2600) * RELIEF * taper;
}

function woodTexture() {
  const cv = document.createElement('canvas');
  cv.width = 1024;
  cv.height = 1024;
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = '#7a5434';
  ctx.fillRect(0, 0, 1024, 1024);
  for (let plank = 0; plank < 6; plank++) {
    const y0 = plank * 171;
    const tone = 0.85 + Math.random() * 0.25;
    ctx.fillStyle = `rgb(${122 * tone},${84 * tone},${52 * tone})`;
    ctx.fillRect(0, y0, 1024, 168);
    for (let k = 0; k < 70; k++) {
      ctx.strokeStyle = `rgba(${60 + Math.random() * 30},${35 + Math.random() * 20},${18},${0.12 + Math.random() * 0.18})`;
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      const yy = y0 + Math.random() * 168;
      ctx.moveTo(0, yy);
      for (let x = 0; x <= 1024; x += 32) ctx.lineTo(x, yy + Math.sin(x / (60 + k) + k) * 3 + (Math.random() - 0.5) * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(30,15,5,.55)';
    ctx.fillRect(0, y0 + 168, 1024, 3);
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.OrthographicCamera;
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  relief?: THREE.Mesh;
  overlay?: THREE.Mesh;
  overlayCanvas = document.createElement('canvas');
  overlayTex: THREE.CanvasTexture;
  sheet?: THREE.Mesh;
  mapGroup = new THREE.Group();
  camTarget = new THREE.Vector3(0, 0, 0);
  camLook = new THREE.Vector3(0, 0, 0);
  zoomLevel = 1;
  zoomGoal = 1;
  viewW = MAP_W;
  viewH = MAP_H;
  follow: THREE.Object3D | null = null;
  view: 'map' | 'plan' = 'map';
  edgePointer: { x: number; y: number } | null = null;
  private ray = new THREE.Raycaster();

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 60);
    this.camera.up.set(0, 0, -1);
    this.scene.background = new THREE.Color('#efe8d4');

    this.hemi = new THREE.HemisphereLight('#fff6e6', '#5a3c22', 1.25);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight('#fff1d6', 2.4);
    this.sun.position.set(-5, 9, -4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -7;
    sc.right = 7;
    sc.top = 6;
    sc.bottom = -6;
    sc.near = 1;
    sc.far = 25;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun);

    const desk = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.75 }));
    desk.rotation.x = -Math.PI / 2;
    desk.position.y = -0.02;
    desk.receiveShadow = true;
    this.scene.add(desk);
    this.scene.add(this.mapGroup);

    this.overlayCanvas.width = W * TEX_SCALE;
    this.overlayCanvas.height = MH * TEX_SCALE;
    this.overlayTex = new THREE.CanvasTexture(this.overlayCanvas);
    this.overlayTex.colorSpace = THREE.SRGBColorSpace;
    this.overlayTex.anisotropy = 8;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  buildMap(m: GameMap, contourInterval: number) {
    this.mapGroup.clear();
    const mapCv = drawMapCanvas(m, contourInterval);
    const mapTex = new THREE.CanvasTexture(mapCv);
    mapTex.colorSpace = THREE.SRGBColorSpace;
    mapTex.anisotropy = 8;

    const sw = MAP_W + SHEET_PAD * 2;
    const sh = MAP_H + SHEET_PAD + SHEET_BOTTOM;
    const ppu = 200;
    const marginCv = drawPaperMargin(m, Math.round(sw * ppu), Math.round(sh * ppu), {
      x: SHEET_PAD * ppu,
      y: SHEET_PAD * ppu,
      w: MAP_W * ppu,
      h: MAP_H * ppu,
    });
    const marginTex = new THREE.CanvasTexture(marginCv);
    marginTex.colorSpace = THREE.SRGBColorSpace;
    marginTex.anisotropy = 8;
    const sheetGeo = new THREE.PlaneGeometry(sw, sh, 24, 16);
    const pos = sheetGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, 0.012 * Math.sin(x * 1.3) * Math.cos(y * 0.9) + 0.006 * Math.abs(x) / sw);
    }
    sheetGeo.computeVertexNormals();
    const sheet = new THREE.Mesh(sheetGeo, new THREE.MeshStandardMaterial({ map: marginTex, roughness: 0.92 }));
    sheet.rotation.x = -Math.PI / 2;
    sheet.position.set(0, -0.004, (SHEET_BOTTOM - SHEET_PAD) / 2);
    sheet.geometry.attributes.position.needsUpdate = true;
    sheet.receiveShadow = true;
    this.sheet = sheet;
    this.mapGroup.add(sheet);

    const SX = 200;
    const SY = 140;
    const geo = new THREE.PlaneGeometry(MAP_W, MAP_H, SX, SY);
    geo.rotateX(-Math.PI / 2);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const mx = (p.getX(i) + MAP_W / 2) / UNIT;
      const my = (p.getZ(i) + MAP_H / 2) / UNIT;
      p.setY(i, heightAt(m, mx, my));
    }
    geo.computeVertexNormals();
    const relief = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.88 }));
    relief.receiveShadow = true;
    relief.castShadow = true;
    this.relief = relief;
    this.mapGroup.add(relief);

    const ctx = this.overlayCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    this.overlayTex.needsUpdate = true;
    const overlay = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ map: this.overlayTex, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    );
    overlay.renderOrder = 2;
    this.overlay = overlay;
    this.mapGroup.add(overlay);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const a = w / h;
    if (a > MAP_W / MAP_H) {
      this.viewH = MAP_H;
      this.viewW = MAP_H * a;
    } else {
      this.viewW = MAP_W;
      this.viewH = MAP_W / a;
    }
    const c = this.camera;
    c.left = -this.viewW / 2;
    c.right = this.viewW / 2;
    c.top = this.viewH / 2;
    c.bottom = -this.viewH / 2;
    c.updateProjectionMatrix();
    if (this.view === 'plan') this.zoomGoal = this.planZoom;
  }

  pick(clientX: number, clientY: number): [number, number] | null {
    if (!this.relief) return null;
    const ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const hit = this.ray.intersectObject(this.relief, false)[0];
    if (!hit) return null;
    return [(hit.point.x + MAP_W / 2) / UNIT, (hit.point.z + MAP_H / 2) / UNIT];
  }

  pickPlane(clientX: number, clientY: number, y = 0.1) {
    const ndc = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -y);
    const out = new THREE.Vector3();
    return this.ray.ray.intersectPlane(plane, out) ? out : null;
  }

  project(v: THREE.Vector3) {
    const p = v.clone().project(this.camera);
    return { x: ((p.x + 1) / 2) * window.innerWidth, y: ((1 - p.y) / 2) * window.innerHeight };
  }

  get planZoom() {
    return Math.max(1.6, Math.min(4, Math.min(this.viewW / 3.4, this.viewH / 2.6)));
  }

  setView(v: 'map' | 'plan', focus?: THREE.Vector3) {
    this.view = v;
    this.edgePointer = null;
    this.zoomGoal = v === 'plan' ? this.planZoom : 1;
    if (v === 'plan' && focus) this.camTarget.set(focus.x, 0, focus.z);
    if (v === 'map') this.camTarget.set(0, 0, 0);
    this.clampTarget(this.camTarget);
  }

  private edgeScroll(dt: number) {
    const e = this.edgePointer;
    if (!e) return false;
    const m = 0.2;
    const nx = e.x / window.innerWidth;
    const ny = e.y / window.innerHeight;
    const push = (t: number) => (t < m ? -(m - t) / m : t > 1 - m ? (t - (1 - m)) / m : 0);
    const px = push(nx);
    const py = push(ny);
    if (!px && !py) return false;
    const speed = (this.viewH / this.zoomLevel) * 0.9 * dt;
    const before = this.camTarget.clone();
    this.camTarget.x += px * speed;
    this.camTarget.z += py * speed;
    this.clampTarget(this.camTarget);
    this.camLook.copy(this.camTarget);
    return before.distanceToSquared(this.camTarget) > 1e-10;
  }

  panPixels(dx: number, dy: number) {
    if (this.view !== 'map') return;
    const k = this.viewH / window.innerHeight / this.zoomLevel;
    this.camTarget.x -= dx * k;
    this.camTarget.z -= dy * k;
    this.clampTarget(this.camTarget);
  }

  private clampTarget(v: THREE.Vector3) {
    const pad = this.view === 'plan' ? 1 : 0;
    const hx = Math.max(0, (MAP_W - this.viewW / this.zoomGoal) / 2 + pad);
    const hz = Math.max(0, (MAP_H - this.viewH / this.zoomGoal) / 2 + pad);
    v.x = Math.max(-hx, Math.min(hx, v.x));
    v.z = Math.max(-hz, Math.min(hz, v.z));
    if (!Number.isFinite(v.x + v.z)) v.set(0, 0, 0);
  }

  zoom(f: number) {
    if (this.view !== 'map') return;
    this.zoomGoal = Math.max(1, Math.min(3.5, this.zoomGoal / f));
    this.clampTarget(this.camTarget);
  }

  update(dt: number): boolean {
    const scrolled = this.view === 'plan' && this.edgeScroll(dt);
    if (this.follow && this.view === 'plan') {
      const p = this.follow.getWorldPosition(new THREE.Vector3());
      this.camTarget.lerp(new THREE.Vector3(p.x, 0, p.z), 1 - Math.exp(-dt * 2.5));
    }
    this.clampTarget(this.camTarget);
    this.zoomLevel += (this.zoomGoal - this.zoomLevel) * (1 - Math.exp(-dt * 8));
    this.camLook.lerp(this.camTarget, 1 - Math.exp(-dt * 8));
    if (!Number.isFinite(this.camLook.x + this.camLook.z)) this.camLook.copy(this.camTarget);
    const c = this.camera;
    if (Math.abs(c.zoom - this.zoomLevel) > 1e-4) {
      c.zoom = this.zoomLevel;
      c.updateProjectionMatrix();
    }
    c.position.set(this.camLook.x, 20, this.camLook.z);
    c.lookAt(this.camLook.x, 0, this.camLook.z);
    this.renderer.render(this.scene, this.camera);
    return scrolled;
  }
}
