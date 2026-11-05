import * as THREE from 'three';
import { GameMap, Mark, SPECIES } from '../core/map';
import { SPECIES_ICON, iconCanvas } from './icons';
import { mapToWorld } from './scene';

const std = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });
const shadowAll = (o: THREE.Object3D) => o.traverse((c) => ((c as THREE.Mesh).isMesh ? ((c.castShadow = true), (c.receiveShadow = true)) : 0));

export class Hiker {
  root = new THREE.Group();
  body = new THREE.Group();
  legL: THREE.Mesh;
  legR: THREE.Mesh;
  armL: THREE.Mesh;
  armR: THREE.Mesh;
  kayak: THREE.Group;
  boat: THREE.Group;
  walkPhase = 0;
  modeY = 0;
  base: THREE.Group;
  constructor() {
    const s = 0.11;
    const jacket = std('#c8552b');
    const pants = std('#38485a');
    const skin = std('#f0c9a0');
    const legGeo = new THREE.CapsuleGeometry(0.11 * s * 2, 0.5 * s * 2, 4, 8);
    this.legL = new THREE.Mesh(legGeo, pants);
    this.legR = new THREE.Mesh(legGeo, pants);
    this.legL.geometry.translate(0, -0.3 * s * 2, 0);
    this.legL.position.set(-0.12 * s * 2, 0.62 * s * 2, 0);
    this.legR.position.set(0.12 * s * 2, 0.62 * s * 2, 0);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.26 * s * 2, 0.45 * s * 2, 6, 12), jacket);
    torso.position.y = 1.05 * s * 2;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * s * 2, 20, 16), skin);
    head.position.y = 1.62 * s * 2;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.36 * s * 2, 0.36 * s * 2, 0.04 * s * 2, 24), std('#d9b25b'));
    brim.position.y = 1.78 * s * 2;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.17 * s * 2, 0.22 * s * 2, 0.2 * s * 2, 20), std('#d9b25b'));
    crown.position.y = 1.88 * s * 2;
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42 * s * 2, 0.55 * s * 2, 0.26 * s * 2), std('#3f5a36'));
    pack.position.set(0, 1.12 * s * 2, -0.3 * s * 2);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s * 2, 0.1 * s * 2, 0.48 * s * 2, 12), std('#e0a12a'));
    roll.rotation.z = Math.PI / 2;
    roll.position.set(0, 1.45 * s * 2, -0.3 * s * 2);
    const armGeo = new THREE.CapsuleGeometry(0.08 * s * 2, 0.42 * s * 2, 4, 8);
    armGeo.translate(0, -0.22 * s * 2, 0);
    this.armL = new THREE.Mesh(armGeo, jacket);
    this.armR = new THREE.Mesh(armGeo, jacket);
    this.armL.position.set(-0.33 * s * 2, 1.3 * s * 2, 0);
    this.armR.position.set(0.33 * s * 2, 1.3 * s * 2, 0);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), std('#888', { metalness: 0.6 }));
    pole.position.set(0, -0.12, 0.03);
    pole.rotation.x = 0.3;
    this.armR.add(pole);
    this.body.add(this.legL, this.legR, torso, head, brim, crown, pack, roll, this.armL, this.armR);
    this.body.scale.setScalar(1.35);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.025, 32), std('#c8552b', { roughness: 0.4 }));
    base.position.y = 0.012;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.012, 8, 40), std('#fff6ea'));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.026;
    this.base = new THREE.Group();
    this.base.add(base, rim);
    this.root.add(this.body, this.base);

    this.kayak = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), std('#d23c2c', { roughness: 0.35 }));
    hull.scale.set(0.06, 0.03, 0.26);
    const paddle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 6), std('#333'));
    paddle.rotation.z = Math.PI / 2;
    paddle.position.y = 0.12;
    this.kayak.add(hull, paddle);
    this.kayak.visible = false;
    this.boat = new THREE.Group();
    const bhull = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.06, 0.06, 16, 1, false, 0, Math.PI), std('#a87445'));
    bhull.rotation.set(0, 0, Math.PI);
    bhull.scale.set(1, 1, 2.6);
    bhull.position.y = 0.03;
    const sail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 3), std('#f3eedd'));
    sail.position.set(0, 0.24, 0.02);
    sail.scale.z = 0.15;
    this.boat.add(bhull, sail);
    this.boat.visible = false;
    this.root.add(this.kayak, this.boat);
    shadowAll(this.root);
  }

  setMode(mode: 'walk' | 'kayak' | 'boat') {
    this.kayak.visible = mode === 'kayak';
    this.boat.visible = mode === 'boat';
    this.modeY = mode === 'walk' ? 0 : -0.07;
    this.legL.visible = this.legR.visible = mode === 'walk';
  }

  animate(dt: number, moving: boolean, t: number) {
    if (moving) this.walkPhase += dt * 11;
    const sw = moving ? Math.sin(this.walkPhase) * 0.6 : 0;
    this.legL.rotation.x = sw;
    this.legR.rotation.x = -sw;
    this.armL.rotation.x = -sw * 0.8;
    this.armR.rotation.x = sw * 0.8 - 0.2;
    this.body.position.y = this.modeY + (moving ? Math.abs(Math.cos(this.walkPhase)) * 0.012 : Math.sin(t * 2) * 0.003);
  }
}

export class Pencil {
  root = new THREE.Group();
  tilt = new THREE.Group();
  eraserMode = false;
  pressing = 0;
  constructor() {
    const len = 1.5;
    const r = 0.045;
    const wood = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), std('#f2c230', { roughness: 0.45 }));
    wood.position.y = 0.12 + len / 2;
    const tip = new THREE.Mesh(new THREE.ConeGeometry(r, 0.12, 6), std('#e8c9a0'));
    tip.rotation.x = Math.PI;
    tip.position.y = 0.06;
    const lead = new THREE.Mesh(new THREE.ConeGeometry(r * 0.35, 0.04, 8), std('#333', { roughness: 0.3, metalness: 0.3 }));
    lead.rotation.x = Math.PI;
    lead.position.y = 0.02;
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.08, 16), std('#c0c4c8', { metalness: 0.9, roughness: 0.3 }));
    ferrule.position.y = 0.12 + len + 0.04;
    const eraser = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.09, 16), std('#e8899a'));
    eraser.position.y = 0.12 + len + 0.125;
    const lettering = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.4, 0.02), std('#3f5a36'));
    lettering.position.set(r * 0.82, 0.12 + len * 0.55, 0);
    this.tilt.add(wood, tip, lead, ferrule, eraser, lettering);
    this.root.add(this.tilt);
    shadowAll(this.root);
    this.tilt.rotation.set(0.55, 0, -0.35);
  }

  setEraser(on: boolean) {
    this.eraserMode = on;
  }

  private endT = 0;
  update(dt: number) {
    const k = 1 - Math.exp(-dt * 10);
    this.endT += ((this.eraserMode ? 1 : 0) - this.endT) * k;
    this.tilt.rotation.x = 0.55 + (Math.PI - 1.1) * this.endT;
    const e = new THREE.Vector3(0, 1.79 * this.endT, 0).applyEuler(this.tilt.rotation);
    const lift = 0.07 * (1 - this.pressing);
    this.tilt.position.set(-e.x, -e.y + lift, -e.z);
  }
}

export interface Token {
  mark: Mark;
  root: THREE.Group;
  top: THREE.Mesh;
  ring: THREE.Mesh;
  bounce: number;
  pulse: number;
  base: THREE.Vector3;
  done: boolean;
  highlighted: boolean;
  setDone: (on: boolean) => void;
}

function hutMesh() {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.13, 0.16), std('#b98953'));
  base.position.y = 0.065;
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.0001, 0.15, 0.12, 4, 1), std('#7a3e1d'));
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.15, 1, 0.95);
  roof.position.y = 0.19;
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.005), std('#4b2e16'));
  door.position.set(0, 0.04, 0.082);
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.03), std('#8c8c8c'));
  chimney.position.set(0.05, 0.24, -0.02);
  g.add(base, roof, door, chimney);
  return g;
}

function flagMesh() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 6), std('#5a4630'));
  pole.position.y = 0.16;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.09), std('#b3261e', { side: THREE.DoubleSide }));
  flag.position.set(0.07, 0.27, 0);
  const cairn = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05), std('#9b9488'));
  cairn.position.y = 0.02;
  g.add(pole, flag, cairn);
  return g;
}

export function makeTokens(m: GameMap): Token[] {
  const tokens: Token[] = [];
  for (const mk of m.marks) {
    const root = new THREE.Group();
    const base = mapToWorld(mk.x, mk.y, m);
    root.position.copy(base);
    let top: THREE.Mesh;
    let setDone: (on: boolean) => void = () => {};
    if (mk.kind === 'animal') {
      const sp = SPECIES.find((s) => s.key === mk.species)!;
      const icon = SPECIES_ICON[sp.key];
      const texOff = new THREE.CanvasTexture(iconCanvas(icon, sp.color, '#fbf6ea', 128, sp.color));
      const texOn = new THREE.CanvasTexture(iconCanvas(icon, '#ffffff', sp.color, 128, '#ffffff'));
      texOff.colorSpace = texOn.colorSpace = THREE.SRGBColorSpace;
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.045, 36), [std('#d8c7a0'), new THREE.MeshStandardMaterial({ map: texOff, roughness: 0.5 }), std('#d8c7a0')]);
      disc.position.y = 0.04;
      top = disc;
      root.add(disc);
      setDone = (on) => {
        (disc.material as THREE.MeshStandardMaterial[])[1].map = on ? texOn : texOff;
        (disc.material as THREE.MeshStandardMaterial[])[1].needsUpdate = true;
      };
    } else if (mk.kind === 'hut') {
      top = new THREE.Mesh();
      const h = hutMesh();
      root.add(h, top);
    } else {
      top = new THREE.Mesh();
      root.add(flagMesh(), top);
    }
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.18, 40), new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    root.add(ring);
    shadowAll(root);
    tokens.push({ mark: mk, root, top, ring, bounce: 0, pulse: 0, base: base.clone(), done: false, highlighted: false, setDone });
  }
  return tokens;
}

export function updateTokens(tokens: Token[], dt: number, t: number) {
  for (const tk of tokens) {
    tk.bounce = Math.max(0, tk.bounce - dt * 1.8);
    const b = tk.bounce;
    const hop = b > 0 ? Math.sin((1 - b) * Math.PI) * 0.16 : 0;
    const idle = tk.highlighted ? Math.sin(t * 6) * 0.012 + 0.02 : 0;
    tk.root.position.y = tk.base.y + hop + idle;
    tk.root.rotation.y = b > 0 ? (1 - b) * Math.PI * 2 : tk.root.rotation.y * 0.9;
    if (tk.pulse > 0) {
      tk.pulse = Math.max(0, tk.pulse - dt * 1.2);
      const k = 1 - tk.pulse;
      tk.ring.scale.setScalar(1 + k * 2.4);
      (tk.ring.material as THREE.MeshBasicMaterial).opacity = tk.pulse * 0.9;
    } else if (tk.highlighted) {
      tk.ring.scale.setScalar(1 + Math.sin(t * 5) * 0.08);
      (tk.ring.material as THREE.MeshBasicMaterial).opacity = 0.75;
    } else (tk.ring.material as THREE.MeshBasicMaterial).opacity = 0;
  }
}

export function tentMesh(color = '#e0a12a') {
  const g = new THREE.Group();
  const tent = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.13, 3), std(color, { flatShading: true }));
  tent.rotation.y = Math.PI / 6;
  tent.scale.set(1, 1, 1.5);
  tent.position.y = 0.065;
  const fire = new THREE.PointLight('#ff9a3c', 0, 0.9, 2);
  fire.position.set(0.12, 0.05, 0.08);
  const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 6), std('#5a3b1d'));
  logs.rotation.z = Math.PI / 2;
  logs.position.set(0.12, 0.01, 0.08);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 8), new THREE.MeshBasicMaterial({ color: '#ffb347' }));
  flame.position.set(0.12, 0.04, 0.08);
  g.add(tent, fire, logs, flame);
  shadowAll(g);
  g.userData.fire = fire;
  g.userData.flame = flame;
  return g;
}
