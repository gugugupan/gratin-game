import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Side } from '../engine';

type Vec3 = [number, number, number];
export type Shade = 'main' | 'dark' | 'enemy';

export const TEAM: Record<Side, Record<Shade, number>> = {
  red: { main: 0xd9362b, dark: 0x9c241c, enemy: 0x2a68d6 },
  blue: { main: 0x2a68d6, dark: 0x1a4392, enemy: 0xd9362b },
};
export const TEAM_CSS: Record<Side, { main: string; dark: string }> = {
  red: { main: '#d9362b', dark: '#9c241c' },
  blue: { main: '#2a68d6', dark: '#1a4392' },
};

let buildSide: Side = 'red';
export const setBuildSide = (side: Side) => { buildSide = side; };

function rim<T extends THREE.Material>(mat: T, strength = .18): T {
  mat.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>',
      `{ float rimF = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 3.0);
         outgoingLight += vec3(1.0, .96, .9) * rimF * ${strength.toFixed(2)}; }
       #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'rim' + strength;
  return mat;
}
export const paint = (c: number, o: THREE.MeshPhysicalMaterialParameters = {}) =>
  rim(new THREE.MeshPhysicalMaterial({ color: c, roughness: .5, metalness: 0, clearcoat: .3, clearcoatRoughness: .4, ...o }));
export const metal = (c: number, r = .32) => rim(new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: .8 }), .2);
export const glow = (c: number) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.5 });

const teamCache = new Map<string, THREE.Material>();
export function teamMat(shade: Shade = 'main'): THREE.Material {
  const key = buildSide + shade;
  let m = teamCache.get(key);
  if (!m) { m = paint(TEAM[buildSide][shade]); teamCache.set(key, m); }
  return m;
}

function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d')!;
  x.fillStyle = '#d8a86b'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3; i++) {
    x.fillStyle = ['rgba(255,235,200,.10)', 'rgba(120,70,30,.08)', 'rgba(255,235,200,.05)'][i];
    x.fillRect(0, i * 86, 256, 85);
    x.fillStyle = 'rgba(90,50,20,.4)'; x.fillRect(0, i * 86 + 84, 256, 2);
  }
  for (let i = 0; i < 70; i++) {
    const y0 = Math.random() * 256, amp = 1.5 + Math.random() * 3, ph = Math.random() * 6;
    x.strokeStyle = `rgba(120,70,30,${.08 + Math.random() * .16})`; x.lineWidth = .8 + Math.random() * 1.2;
    x.beginPath();
    for (let px = 0; px <= 256; px += 12) x.lineTo(px, y0 + Math.sin(px / 40 + ph) * amp);
    x.stroke();
  }
  x.fillStyle = 'rgba(110,60,25,.35)';
  x.beginPath(); x.ellipse(70 + Math.random() * 120, 40 + Math.random() * 170, 9, 4, 0, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export const M = {
  black: paint(0x262a35), white: paint(0xf7f5ef), cream: paint(0xf3eedf, { roughness: .7, clearcoat: 0 }),
  orange: paint(0xf5a531), orangeDark: paint(0xd9822a), gold: metal(0xf0c24a, .28), steel: metal(0xc3ccd6, .3),
  gun: metal(0x5f6876, .42), dark: paint(0x2a3140), pink: paint(0xf59aa0), red: paint(0xe8483d), yellow: paint(0xf7d040),
  mouth: paint(0x5a1f22), tongue: paint(0xf0727a), leaf: paint(0x5fb35a), mint: paint(0x7fd1b9), patch: paint(0x7fb0d9),
  skin: paint(0xf8cfae, { clearcoat: .1 }), hair: paint(0x5b3a24), wood: paint(0xc98a4b, { roughness: .65, clearcoat: .1 }),
  boxWood: paint(0xebc27c, { roughness: .6, clearcoat: .1 }), boxWoodDark: paint(0xc79a55, { roughness: .6, clearcoat: .1 }),
  frog: paint(0x66c84a), frogDark: paint(0x4aa23a), frogBelly: paint(0xe0f3a0),
  bear: paint(0xb8773e, { roughness: .85, clearcoat: 0 }), bearLight: paint(0xedc795, { roughness: .85, clearcoat: 0 }),
  bearDark: paint(0x6b4423, { roughness: .85, clearcoat: 0 }),
  dino: paint(0x43b56c), dinoBelly: paint(0xeee6a0), dinoBellyDark: paint(0xcfc47e),
  tokenWood: paint(0xffffff, { map: woodTexture(), roughness: .6, clearcoat: .25 }),
  stone: paint(0xb9b3a6, { roughness: .8, clearcoat: 0 }), stoneTop: paint(0xd9d4c8, { roughness: .8, clearcoat: 0 }),
  stoneDark: paint(0x9a9488, { roughness: .8, clearcoat: 0 }),
  path: paint(0xe3cfa2, { roughness: .8, clearcoat: 0 }), path2: paint(0xd2ba88, { roughness: .8, clearcoat: 0 }),
  woodLight: paint(0xdca66a, { roughness: .65, clearcoat: .1 }), woodDark: paint(0x8f5a2e, { roughness: .65, clearcoat: .1 }),
  lawn: paint(0x8fd56a, { roughness: .8, clearcoat: 0 }), hedge: paint(0x3f9a45, { roughness: .8, clearcoat: 0 }),
  goldDark: metal(0xb8892a, .35),
  trunk: paint(0x8a5a33, { roughness: .8, clearcoat: 0 }), leafMid: paint(0x56b04a, { roughness: .7, clearcoat: .1 }),
  leafDark: paint(0x3b8f3c, { roughness: .7, clearcoat: .1 }), leafLight: paint(0x86cf5a, { roughness: .7, clearcoat: .1 }),
  rock: paint(0xa8a59c, { roughness: .85, clearcoat: 0 }), rockLight: paint(0xc6c3ba, { roughness: .85, clearcoat: 0 }),
  flowerPink: paint(0xff8fb0), flowerYellow: paint(0xffd84a), flowerWhite: paint(0xfff7e8),
  lamp: glow(0xffd27a),
};

export function box(parent: THREE.Object3D, [w, h, d]: Vec3, mat: THREE.Material, p: Vec3 = [0, 0, 0], r: Vec3 = [0, 0, 0], rad = .06): THREE.Mesh {
  const radius = Math.min(rad * .5, w / 2, h / 2, d / 2) * .98;
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), mat);
  m.position.set(...p); m.rotation.set(...r);
  parent.add(m);
  return m;
}
export const B = (g: THREE.Object3D, size: Vec3, mat: THREE.Material, p: Vec3, rad = .05, r: Vec3 = [0, 0, 0]) => box(g, size, mat, p, r, rad);
export function add(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, p: Vec3 = [0, 0, 0], r: Vec3 = [0, 0, 0]): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...p); m.rotation.set(...r);
  parent.add(m);
  return m;
}
export function grp(parent: THREE.Object3D, p: Vec3 = [0, 0, 0], r: Vec3 = [0, 0, 0]): THREE.Group {
  const g = new THREE.Group();
  g.position.set(...p); g.rotation.set(...r);
  parent.add(g);
  return g;
}
export const pyramid = (r: number, h: number) => new THREE.ConeGeometry(r, h, 4);
export const stud = (r: number, h: number) => new THREE.CylinderGeometry(r, r, h, 16);

export function face(g: THREE.Object3D, { x, y, z, s = .12, mood = 'brave' }: { x: number; y: number; z: number; s?: number; mood?: 'brave' | 'happy' | null }) {
  for (const sx of [-1, 1]) {
    const ex = sx * x, px = ex - sx * s * .08;
    B(g, [s, s * 1.2, .04], M.white, [ex, y, z], .025);
    B(g, [s * .56, s * .7, .03], M.black, [px, y - s * .12, z + .022], .02);
    B(g, [s * .2, s * .2, .01], M.white, [px - s * .1, y, z + .04], .005);
    if (mood) {
      const tilt = mood === 'brave' ? sx * .34 : -sx * .2;
      B(g, [s * 1.35, s * .3, .05], M.dark, [ex, y + s * .9, z + .01], .022, [0, 0, tilt]);
    }
  }
}
export function smile(g: THREE.Object3D, y: number, z: number, w = .2, t = .035) {
  B(g, [w * .6, t, .03], M.dark, [0, y, z], t * .45);
  for (const sx of [-1, 1]) B(g, [w * .32, t, .03], M.dark, [sx * w * .38, y + w * .08, z - .002], t * .45, [0, 0, sx * .55]);
}
export function grin(g: THREE.Object3D, y: number, z: number, w = .26, h = .1) {
  B(g, [w, h, .04], M.mouth, [0, y, z], h * .45);
  B(g, [w * .8, h * .28, .02], M.white, [0, y + h * .3, z + .015], .01);
  B(g, [w * .5, h * .35, .02], M.tongue, [0, y - h * .22, z + .015], .015);
}
class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(private r: number, private h: number, private turns: number) { super(); }
  getPoint(t: number, o = new THREE.Vector3()) {
    const a = t * Math.PI * 2 * this.turns;
    return o.set(Math.cos(a) * this.r, t * this.h, Math.sin(a) * this.r);
  }
}
export const coil = (r: number, h: number, turns: number, t = .035) => new THREE.TubeGeometry(new Helix(r, h, turns), 220, t, 8, false);

export type Tick = (t: number) => void;
let ticks: Tick[] | null = null;
export const tick = (fn: Tick) => { if (ticks) ticks.push(fn); };
export function collectTicks(fn: () => void): Tick[] {
  const list: Tick[] = [];
  ticks = list;
  try { fn(); } finally { ticks = null; }
  return list;
}

export const F = .27;

export function windKey(parent: THREE.Object3D, p: Vec3) {
  const k = grp(parent, p);
  B(k, [.08, .08, .22], M.gold, [0, 0, -.08], .03);
  B(k, [.14, .14, .06], M.gold, [0, 0, -.2], .03);
  for (const sy of [-1, 1]) B(k, [.05, .26, .22], M.gold, [0, sy * .16, -.26], .06);
  tick(t => { k.rotation.z = t * 2.2; });
  return k;
}

export function enableShadows(obj: THREE.Object3D) {
  obj.traverse(o => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m.material as THREE.Material).type === 'MeshBasicMaterial' || m.userData.outline) return;
    m.receiveShadow = true;
    m.castShadow = m.geometry.type !== 'PlaneGeometry';
  });
}
