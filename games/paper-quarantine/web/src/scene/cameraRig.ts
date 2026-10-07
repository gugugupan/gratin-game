import * as THREE from "three";
import { SHEET_H, SHEET_W } from "../art/mapArt";
import { easeInOut, seg } from "../util";

const ELEVATION = 0.86;
const HOME_Z = 0.8;
const ZOOM = (0.48 * 28) / SHEET_W;

export interface FreeArea {
  top: number;
  bottom: number;
}

export class CameraRig {
  readonly target = new THREE.Vector3(0, 0, HOME_Z);
  private distance = 32;
  private home = new THREE.Vector3(0, 0, HOME_Z);
  private rangeX = 0;
  private rangeZ = 0;
  private menuTarget = new THREE.Vector3(-0.5, 0, 1.5);
  private menuDistance = 56;
  private readonly menuElevation = 1.05;
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();
  private tmpC = new THREE.Vector3();
  following = true;

  constructor(private camera: THREE.PerspectiveCamera) {}

  private tanHalf(): number {
    return Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
  }

  frameMenu(rect: [number, number, number, number], reservedBottomPx: number): void {
    const [x0, x1, z0, z1] = rect;
    const t = this.tanHalf();
    const reserved = Math.min(0.4, reservedBottomPx / innerHeight);
    const byW = (x1 - x0) / 2 / (t * this.camera.aspect);
    const byD = (((z1 - z0) / 2) * Math.sin(this.menuElevation)) / (t * (1 - reserved));
    this.menuDistance = Math.max(byW, byD);
    const perPx = (2 * this.menuDistance * t) / innerHeight;
    const shift = (((reserved * innerHeight) / 2) * perPx) / Math.sin(this.menuElevation);
    this.menuTarget.set((x0 + x1) / 2, 0, (z0 + z1) / 2 + shift);
  }

  frameGame(area: FreeArea): void {
    const t = this.tanHalf();
    const fracH = Math.max(0.3, (area.bottom - area.top) / innerHeight);
    const byWidth = SHEET_W / 2 / (t * this.camera.aspect);
    const byDepth = ((SHEET_H / 2) * Math.sin(ELEVATION)) / (t * fracH);
    this.distance = Math.max(byWidth, byDepth) * ZOOM * (this.camera.aspect < 0.85 ? 1 : 1.3);
    const perPixel = (2 * this.distance * t) / innerHeight;
    const dy = (area.top + area.bottom) / 2 - innerHeight / 2;
    this.home.set(0, 0, HOME_Z - (dy * perPixel) / Math.sin(ELEVATION));
    const halfW = this.distance * t * this.camera.aspect;
    const halfZ = (this.distance * t * fracH) / Math.sin(ELEVATION);
    this.rangeX = Math.max(0, SHEET_W / 2 + 1 - halfW);
    this.rangeZ = Math.max(0, SHEET_H / 2 + 1 - halfZ);
    this.clamp(this.target);
  }

  clamp(v: THREE.Vector3): THREE.Vector3 {
    v.x = THREE.MathUtils.clamp(v.x, this.home.x - this.rangeX, this.home.x + this.rangeX);
    v.z = THREE.MathUtils.clamp(v.z, this.home.z - this.rangeZ - 3.5, this.home.z + this.rangeZ);
    return v;
  }

  focusOn(world: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
    return this.clamp(out.set(world.x + this.home.x, 0, world.z + this.home.z - HOME_Z - 1.2));
  }

  pan(dxPx: number, dyPx: number): void {
    const perPixel = (2 * this.distance * this.tanHalf()) / innerHeight;
    this.target.x -= dxPx * perPixel;
    this.target.z -= (dyPx * perPixel) / Math.sin(ELEVATION);
    this.clamp(this.target);
  }

  place(progress: number, time: number): void {
    const k = easeInOut(seg(progress, 0, 0.6));
    const menuTarget = this.tmpA.copy(this.menuTarget);
    menuTarget.x += Math.sin(time * 0.35) * 0.6;
    const pose = (tgt: THREE.Vector3, dist: number, elev: number, out: THREE.Vector3) =>
      out.set(tgt.x, tgt.y + dist * Math.sin(elev), tgt.z + dist * Math.cos(elev));
    const from = pose(menuTarget, this.menuDistance, this.menuElevation, this.tmpB);
    const to = pose(this.target, this.distance, ELEVATION, this.tmpC);
    this.camera.position.copy(from.lerp(to, k));
    this.camera.lookAt(menuTarget.lerp(this.target, k));
  }
}
