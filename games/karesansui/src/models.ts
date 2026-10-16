import {
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import { rng, type GardenMap } from './engine';
import type { SandPainter } from './sand';

const mat = (color: string, extra: Partial<ConstructorParameters<typeof MeshStandardMaterial>[0]> = {}) =>
  new MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });

function mesh(geo: BufferGeometry, m: Material, cast = true, receive = true) {
  const o = new Mesh(geo, m);
  o.castShadow = cast;
  o.receiveShadow = receive;
  return o;
}

function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

const woodTex = () =>
  canvasTex(
    256,
    64,
    (ctx) => {
      ctx.fillStyle = '#c79f72';
      ctx.fillRect(0, 0, 256, 64);
      const r = rng(5);
      for (let k = 0; k < 30; k++) {
        const y = r() * 64;
        ctx.strokeStyle = `rgba(120,80,45,${0.15 + r() * 0.2})`;
        ctx.lineWidth = 0.6 + r();
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 256; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.03 + k) * 2);
        ctx.stroke();
      }
    },
    [2, 1],
  );

const mossTex = (seed: number) =>
  canvasTex(
    256,
    256,
    (ctx) => {
      ctx.fillStyle = '#a3bb40';
      ctx.fillRect(0, 0, 256, 256);
      const r = rng(seed);
      for (let k = 0; k < 220; k++) {
        const x = r() * 256;
        const y = r() * 256;
        const rd = 6 + r() * 22;
        const g = ctx.createRadialGradient(x, y, 0, x, y, rd);
        const c = r() < 0.5 ? 'rgba(120,152,36,' : 'rgba(196,214,92,';
        g.addColorStop(0, c + '.6)');
        g.addColorStop(1, c + '0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - rd, y - rd, rd * 2, rd * 2);
      }
      for (let k = 0; k < 900; k++) {
        ctx.fillStyle = r() < 0.5 ? 'rgba(80,110,30,.55)' : 'rgba(225,235,150,.5)';
        ctx.fillRect(r() * 256, r() * 256, 1.5, 1.5);
      }
    },
    [1, 1],
  );

function stoneGeo(seed: number, radius: number) {
  const g = new IcosahedronGeometry(radius, 1);
  const r = rng(seed);
  const pos = g.attributes.position;
  const v = new Vector3();
  const offs = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = v.toArray().map((n) => n.toFixed(3)).join(',');
    if (!offs.has(key)) offs.set(key, 0.82 + r() * 0.32);
    v.multiplyScalar(offs.get(key)!);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

const STONE_COLORS = ['#7d8f99', '#46625f', '#6b4a5e', '#5d5a55', '#8b8578'];

function stone(seed: number, radius: number, color: string, height = 0.8) {
  const m = mesh(stoneGeo(seed, radius), mat(color, { flatShading: true, roughness: 0.6 }));
  m.scale.set(1.15, height, 1);
  m.position.y = radius * height * 0.55;
  m.rotation.y = rng(seed + 3)() * Math.PI * 2;
  return m;
}

function mossPatch(seed: number, radius: number) {
  const g = new CircleGeometry(radius, 20);
  const r = rng(seed);
  const pos = g.attributes.position;
  for (let i = 1; i < pos.count; i++) {
    const k = 0.8 + r() * 0.3;
    pos.setXY(i, pos.getX(i) * k, pos.getY(i) * k);
  }
  const m = mesh(g, mat('#ffffff', { map: mossTex(seed) }), false, true);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006;
  return m;
}

function lantern() {
  const g = new Group();
  const stoneM = mat('#9c978c', { flatShading: true });
  const add = (geo: BufferGeometry, y: number, rotY = 0) => {
    const m = mesh(geo, stoneM);
    m.position.y = y;
    m.rotation.y = rotY;
    g.add(m);
    return m;
  };
  add(new CylinderGeometry(0.2, 0.24, 0.08, 6), 0.04);
  add(new CylinderGeometry(0.06, 0.07, 0.38, 6), 0.27);
  add(new CylinderGeometry(0.17, 0.12, 0.07, 6), 0.49);
  const box = add(new BoxGeometry(0.2, 0.18, 0.2), 0.62);
  box.material = mat('#a8a397', { flatShading: true });
  const light = mesh(new BoxGeometry(0.12, 0.1, 0.205), mat('#f4d58a', { emissive: new Color('#f0b44a'), emissiveIntensity: 0.6 }), false, false);
  light.position.y = 0.62;
  g.add(light);
  add(new ConeGeometry(0.28, 0.18, 6), 0.8, Math.PI / 6);
  add(new SphereGeometry(0.045, 8, 6), 0.92);
  return g;
}

function deadTree(seed: number) {
  const g = new Group();
  const bark = mat('#4b3a2c', { roughness: 0.95, flatShading: true });
  const r = rng(seed);
  const up = new Vector3(0, 1, 0);
  const branch = (from: Vector3, dir: Vector3, len: number, rad: number, depth: number) => {
    const to = from.clone().addScaledVector(dir, len);
    const geo = new CylinderGeometry(rad * 0.65, rad, len, 6);
    const m = mesh(geo, bark);
    m.position.copy(from).add(to).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(up, dir.clone().normalize());
    g.add(m);
    if (depth <= 0) return;
    const n = depth > 1 ? 2 + (r() < 0.5 ? 1 : 0) : 2;
    for (let k = 0; k < n; k++) {
      const d = dir
        .clone()
        .add(new Vector3((r() - 0.5) * 1.4, (r() - 0.2) * 0.6, (r() - 0.5) * 1.4))
        .normalize();
      branch(to, d, len * (0.6 + r() * 0.2), rad * 0.62, depth - 1);
    }
  };
  branch(new Vector3(0, 0, 0), new Vector3(0.12, 1, 0.08).normalize(), 0.7, 0.08, 4);
  return g;
}

function pine(seed: number) {
  const g = new Group();
  const r = rng(seed);
  const trunk = mesh(new CylinderGeometry(0.06, 0.09, 0.8, 6), mat('#5a4430', { flatShading: true }));
  trunk.position.y = 0.4;
  g.add(trunk);
  const leaf = mat('#3f5a35', { flatShading: true });
  for (let i = 0; i < 3; i++) {
    const c = mesh(new ConeGeometry(0.55 - i * 0.13, 0.5, 7), leaf);
    c.position.set((r() - 0.5) * 0.1, 0.75 + i * 0.3, (r() - 0.5) * 0.1);
    g.add(c);
  }
  return g;
}

function bush(seed: number) {
  const g = new Group();
  const r = rng(seed);
  const m = mat(r() < 0.5 ? '#4f6a3a' : '#5d7a40', { flatShading: true });
  for (let i = 0; i < 3; i++) {
    const s = mesh(new IcosahedronGeometry(0.22 + r() * 0.15, 0), m);
    s.position.set((r() - 0.5) * 0.4, 0.15 + r() * 0.1, (r() - 0.5) * 0.4);
    g.add(s);
  }
  return g;
}

export function templeGate() {
  const g = new Group();
  const wood = mat('#8a5c3c', { roughness: 0.8 });
  const dark = mat('#4b4f54', { flatShading: true, roughness: 0.7 });
  for (const x of [-1.1, 1.1]) {
    const p = mesh(new CylinderGeometry(0.11, 0.12, 2, 10), wood);
    p.position.set(x, 1, 0);
    g.add(p);
    const base = mesh(new CylinderGeometry(0.18, 0.2, 0.12, 8), mat('#9c978c'));
    base.position.set(x, 0.06, 0);
    g.add(base);
  }
  const beam = mesh(new BoxGeometry(2.7, 0.16, 0.18), wood);
  beam.position.set(0, 1.85, 0);
  g.add(beam);
  const beam2 = mesh(new BoxGeometry(2.4, 0.1, 0.14), wood);
  beam2.position.set(0, 1.55, 0);
  g.add(beam2);
  const plaque = mesh(new BoxGeometry(0.5, 0.26, 0.04), mat('#2d2a26'));
  plaque.position.set(0, 1.7, 0.1);
  g.add(plaque);
  const roof = mesh(new ConeGeometry(2.3, 0.75, 4, 1), dark);
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1, 1, 0.55);
  roof.position.y = 2.3;
  g.add(roof);
  const eave = mesh(new BoxGeometry(3.2, 0.06, 1.6), dark);
  eave.position.y = 1.96;
  g.add(eave);
  const doorM = mat('#9a6d48');
  for (const s of [-1, 1]) {
    const d = mesh(new BoxGeometry(1, 1.45, 0.05), doorM);
    d.geometry.translate(0.5 * -s, 0, 0);
    d.position.set(1.08 * s, 0.75, 0.02);
    d.rotation.y = s * 2.5;
    g.add(d);
  }
  return g;
}

export interface GardenScene {
  root: Group;
  gatePos: Vector3;
  cellCenter: (c: number, r: number) => Vector3;
  sand: Mesh;
}

/** Garden board in world units: one cell = 1, sand surface at y = 0, north = -z. */
export function buildGarden(map: GardenMap, painter: SandPainter, seed: number): GardenScene {
  const root = new Group();
  const hw = map.cols / 2;
  const hh = map.rows / 2;
  const cellCenter = (c: number, r: number) => new Vector3(c - hw + 0.5, 0, r - hh + 0.5);
  const r = rng(seed + 101);

  const ground = mesh(new PlaneGeometry(60, 60), mat('#ffffff', { map: mossTex(seed + 1) }), false, true);
  (ground.material as MeshStandardMaterial).map!.repeat.set(24, 24);
  (ground.material as MeshStandardMaterial).map!.wrapS = (ground.material as MeshStandardMaterial).map!.wrapT = RepeatWrapping;
  (ground.material as MeshStandardMaterial).color = new Color('#8a9a55');
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.12;
  root.add(ground);

  const sandM = mat('#ffffff', { map: painter.colorTex, bumpMap: painter.bumpTex, bumpScale: 2.2, roughness: 0.95 });
  const sand = mesh(new PlaneGeometry(map.cols, map.rows), sandM, false, true);
  sand.rotation.x = -Math.PI / 2;
  root.add(sand);

  const bank = 1.4;
  const curb = 0.1;
  const frame = 0.3;
  const x0 = -hw - bank - curb;
  const x1 = hw + curb;
  const z0 = -hh - curb;
  const z1 = hh + curb;
  const under = mesh(new BoxGeometry(x1 - x0 + frame * 2, 0.14, z1 - z0 + frame * 2), mat('#8d6c49'));
  under.position.set((x0 + x1) / 2, -0.075, (z0 + z1) / 2);
  root.add(under);

  const curbM = mat('#d9d5cb', { roughness: 0.9 });
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number, m: Material) => {
    const b = mesh(new BoxGeometry(w, h, d), m);
    b.position.set(x, y, z);
    root.add(b);
    return b;
  };
  addBox(map.cols + curb * 2, 0.05, curb, 0, 0.025, -hh - curb / 2, curbM);
  addBox(map.cols + curb * 2, 0.05, curb, 0, 0.025, hh + curb / 2, curbM);
  addBox(curb, 0.05, map.rows, hw + curb / 2, 0.025, 0, curbM);
  addBox(curb, 0.05, map.rows, -hw - curb / 2, 0.025, 0, curbM);

  const mossM = mat('#ffffff', { map: mossTex(seed + 2) });
  const bankBox = addBox(bank, 0.06, map.rows + curb * 2, -hw - curb - bank / 2, 0.03, 0, mossM);
  bankBox.castShadow = false;

  const woodM = mat('#ffffff', { map: woodTex(), roughness: 0.7 });
  const fw = x1 - x0 + frame * 2;
  const fd = z1 - z0 + frame * 2;
  addBox(fw, 0.16, frame, (x0 + x1) / 2, 0.06, z0 - frame / 2, woodM);
  addBox(fw, 0.16, frame, (x0 + x1) / 2, 0.06, z1 + frame / 2, woodM);
  addBox(frame, 0.16, fd, x0 - frame / 2, 0.06, (z0 + z1) / 2, woodM);
  addBox(frame, 0.16, fd, x1 + frame / 2, 0.06, (z0 + z1) / 2, woodM);

  const wallZ = z0 - frame - 0.2;
  const wall = addBox(fw + 0.4, 0.95, 0.28, (x0 + x1) / 2, 0.36, wallZ, mat('#e3d2b0', { roughness: 0.95 }));
  wall.castShadow = true;
  const tileM = mat('#55595d', { flatShading: true, roughness: 0.6 });
  for (const s of [-1, 1]) {
    const roof = addBox(fw + 0.6, 0.06, 0.32, (x0 + x1) / 2, 0.9, wallZ + s * 0.12, tileM);
    roof.rotation.x = s * 0.45;
  }
  addBox(fw + 0.6, 0.06, 0.08, (x0 + x1) / 2, 0.97, wallZ, mat('#3f4246'));

  map.rocks.forEach((rk, i) => {
    const c = cellCenter(rk[0], rk[1]);
    const patch = mossPatch(seed + i * 13, 0.42);
    patch.position.add(c);
    root.add(patch);
    const big = stone(seed + i * 7, 0.26, STONE_COLORS[i % STONE_COLORS.length], 0.75 + r() * 0.5);
    big.position.x += c.x - 0.04;
    big.position.z += c.z - 0.03;
    root.add(big);
    if (r() < 0.7) {
      const small = stone(seed + i * 7 + 1, 0.11, STONE_COLORS[(i + 2) % STONE_COLORS.length], 0.7);
      small.position.x += c.x + 0.22;
      small.position.z += c.z + 0.2;
      root.add(small);
    }
  });

  const bankX = -hw - curb - bank / 2;
  const lan = lantern();
  lan.position.set(bankX - 0.15, 0.06, -hh + Math.min(2.1, map.rows * 0.42));
  root.add(lan);
  const tree = deadTree(seed + 5);
  tree.scale.setScalar(0.72);
  tree.position.set(bankX - 0.4, 0.06, -hh + 0.3);
  root.add(tree);
  if (map.entry) {
    const e = cellCenter(map.entry.cell[0], map.entry.cell[1]);
    const stepM = mat('#cfcabe', { roughness: 0.8 });
    const steps =
      map.entry.side === 'W'
        ? [0, 1, 2].map((k) => new Vector3(-hw - curb - 0.3 - k * 0.42, 0.07, e.z + k * 0.3))
        : [0, 1, 2].map((k) => new Vector3(e.x + k * 0.25, 0.0, hh + curb + frame + 0.35 + k * 0.45));
    steps.forEach((p, k) => {
      const s = mesh(new CylinderGeometry(0.17, 0.19, 0.06, 9), stepM);
      s.scale.set(1, 1, 0.75);
      s.position.copy(p);
      s.rotation.y = k * 0.5;
      root.add(s);
    });
  }
  for (const gt of [map.entry, map.exit]) {
    if (!gt) continue;
    const c = cellCenter(gt.cell[0], gt.cell[1]);
    const d = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] }[gt.side];
    const flag = mesh(new ConeGeometry(0.07, 0.16, 3), mat('#b23a26'), true, false);
    flag.rotation.z = -Math.PI / 2;
    flag.rotation.y = Math.atan2(-d[1], d[0]) + (gt === map.entry ? Math.PI : 0);
    flag.position.set(c.x + d[0] * 0.58, 0.07, c.z + d[1] * 0.58);
    root.add(flag);
  }

  const gatePos = new Vector3((x0 + x1) / 2, -0.12, z1 + frame + 3.2);
  const gate = templeGate();
  gate.position.copy(gatePos);
  root.add(gate);
  for (let k = 0; k < 6; k++) {
    const s = mesh(new CylinderGeometry(0.2, 0.22, 0.05, 9), mat('#bdb7aa'));
    s.position.set(gatePos.x + (k % 2 ? 0.15 : -0.15), -0.1, z1 + frame + 0.4 + k * 0.5);
    s.scale.set(1, 1, 0.75);
    root.add(s);
  }
  const deco: [Object3D, number, number][] = [
    [pine(seed + 11), gatePos.x - 2.4, gatePos.z + 0.6],
    [pine(seed + 12), gatePos.x + 2.6, gatePos.z + 0.2],
    [bush(seed + 13), gatePos.x - 1.7, gatePos.z + 0.4],
    [bush(seed + 14), gatePos.x + 1.8, gatePos.z + 0.6],
    [bush(seed + 15), x1 + 1.2, 0],
    [bush(seed + 16), x0 - 1.0, z1 - 0.5],
    [pine(seed + 17), x1 + 1.4, wallZ - 0.8],
    [pine(seed + 18), x0 - 0.9, wallZ - 0.6],
  ];
  for (const [o, x, z] of deco) {
    o.position.set(x, -0.12, z);
    root.add(o);
  }
  return { root, gatePos, cellCenter, sand };
}

export interface Monk {
  root: Group;
  rake: Group;
  head: Object3D;
  update(dt: number, moving: number): void;
}

const strawTex = () =>
  canvasTex(256, 256, (ctx) => {
    ctx.fillStyle = '#d4b06a';
    ctx.fillRect(0, 0, 256, 256);
    for (let a = 0; a < 180; a++) {
      const an = (a / 180) * Math.PI * 2;
      ctx.strokeStyle = a % 2 ? 'rgba(150,110,50,.5)' : 'rgba(240,215,150,.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(128, 128);
      ctx.lineTo(128 + Math.cos(an) * 181, 128 + Math.sin(an) * 181);
      ctx.stroke();
    }
    for (let k = 1; k < 8; k++) {
      ctx.strokeStyle = 'rgba(140,100,45,.35)';
      ctx.beginPath();
      ctx.arc(128, 128, k * 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

/** Low-poly monk; local +z is the face. Origin at the feet. */
export function buildMonk(): Monk {
  const root = new Group();
  const body = new Group();
  root.add(body);
  const robeM = mat('#2f3542', { roughness: 0.9 });
  const skin = mat('#eac39c', { roughness: 0.7 });
  const robeProfile = [
    [0, 0.02],
    [0.2, 0.02],
    [0.19, 0.2],
    [0.16, 0.4],
    [0.15, 0.52],
    [0.09, 0.58],
    [0, 0.6],
  ].map(([x, y]) => new Vector2(x, y));
  const robe = mesh(new LatheGeometry(robeProfile, 14), robeM);
  body.add(robe);
  const sash = mesh(new TorusGeometry(0.16, 0.022, 6, 16), mat('#9a7b3c'));
  sash.rotation.x = Math.PI / 2 + 0.25;
  sash.rotation.z = 0.5;
  sash.position.y = 0.42;
  body.add(sash);
  const collar = mesh(new TorusGeometry(0.075, 0.02, 6, 14), mat('#e9e4d8'));
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.585;
  body.add(collar);

  const head = new Group();
  head.position.y = 0.69;
  body.add(head);
  head.add(mesh(new SphereGeometry(0.115, 18, 14), skin));
  const dark = mat('#2a2522');
  for (const s of [-1, 1]) {
    const eye = mesh(new TorusGeometry(0.02, 0.0055, 6, 12, Math.PI), dark, false, false);
    eye.position.set(s * 0.042, 0.005, 0.106);
    eye.rotation.z = Math.PI;
    head.add(eye);
    const brow = mesh(new BoxGeometry(0.035, 0.007, 0.01), dark, false, false);
    brow.position.set(s * 0.043, 0.04, 0.104);
    brow.rotation.z = s * -0.15;
    head.add(brow);
    const cheek = mesh(new CircleGeometry(0.016, 10), mat('#e79a8a', { transparent: true, opacity: 0.6 }), false, false);
    cheek.position.set(s * 0.065, -0.025, 0.098);
    cheek.rotation.y = s * 0.55;
    head.add(cheek);
  }
  const mouth = mesh(new TorusGeometry(0.014, 0.004, 6, 10, Math.PI), mat('#8a4b3c'), false, false);
  mouth.position.set(0, -0.045, 0.108);
  mouth.rotation.z = Math.PI;
  head.add(mouth);
  const nose = mesh(new SphereGeometry(0.012, 8, 6), skin, false, false);
  nose.position.set(0, -0.012, 0.114);
  head.add(nose);
  for (const s of [-1, 1]) {
    const ear = mesh(new SphereGeometry(0.025, 8, 6), skin, false, false);
    ear.scale.set(0.5, 1, 0.8);
    ear.position.set(s * 0.113, 0, 0);
    head.add(ear);
  }

  const hatM = mat('#ffffff', { map: strawTex(), roughness: 0.95 });
  const hat = mesh(new ConeGeometry(0.36, 0.17, 28, 1), hatM);
  hat.position.y = 0.15;
  head.add(hat);
  const hatTop = mesh(new SphereGeometry(0.03, 8, 6), hatM);
  hatTop.position.y = 0.24;
  head.add(hatTop);
  const strap = mesh(new TorusGeometry(0.105, 0.004, 4, 20), mat('#5a3d22'), false, false);
  strap.scale.set(1.02, 1.2, 1);
  strap.position.set(0, -0.012, 0.012);
  head.add(strap);

  const hands: Object3D[] = [];
  for (const s of [-1, 1]) {
    const arm = new Group();
    arm.position.set(s * 0.13, 0.52, 0);
    const sleeve = mesh(new CylinderGeometry(0.045, 0.06, 0.26, 8), robeM);
    sleeve.position.y = -0.13;
    arm.add(sleeve);
    const hand = mesh(new SphereGeometry(0.035, 8, 6), skin);
    hand.position.y = -0.27;
    arm.add(hand);
    arm.rotation.x = -0.95;
    arm.rotation.z = s * 0.25;
    body.add(arm);
    hands.push(hand);
  }
  const feet: Mesh[] = [];
  for (const s of [-1, 1]) {
    const f = mesh(new BoxGeometry(0.07, 0.035, 0.13), mat('#b48a5a'));
    f.position.set(s * 0.07, 0.018, 0.02);
    root.add(f);
    feet.push(f);
  }

  const rake = new Group();
  const rakeWood = mat('#a77a49', { roughness: 0.8 });
  const bar = mesh(new BoxGeometry(0.92, 0.05, 0.06), rakeWood);
  bar.position.y = 0.07;
  rake.add(bar);
  for (let k = 0; k < 12; k++) {
    const tooth = mesh(new BoxGeometry(0.025, 0.06, 0.025), mat('#7e5a35'));
    tooth.position.set(-0.46 + (k + 0.5) * (0.92 / 12), 0.03, 0);
    rake.add(tooth);
  }
  const handle = mesh(new CylinderGeometry(0.018, 0.018, 1, 6), rakeWood);
  rake.add(handle);

  let phase = 0;
  const tmp = new Vector3();
  const tmp2 = new Vector3();
  const up = new Vector3(0, 1, 0);
  return {
    root,
    rake,
    head,
    update(dt, moving) {
      phase += dt * (moving > 0 ? 11 : 0);
      const sw = Math.sin(phase) * Math.min(1, moving);
      feet[0].position.z = 0.02 + sw * 0.06;
      feet[1].position.z = 0.02 - sw * 0.06;
      body.position.y = Math.abs(Math.cos(phase)) * 0.012 * Math.min(1, moving);
      body.rotation.z = sw * 0.03;
      root.updateMatrixWorld(true);
      rake.updateMatrixWorld(true);
      hands[0].getWorldPosition(tmp);
      hands[1].getWorldPosition(tmp2);
      tmp.add(tmp2).multiplyScalar(0.5);
      rake.worldToLocal(tmp);
      const base = new Vector3(0, 0.08, 0);
      const dir = tmp.clone().sub(base);
      const len = dir.length();
      handle.scale.y = len;
      handle.position.copy(base).addScaledVector(dir, 0.5);
      handle.quaternion.setFromUnitVectors(up, dir.normalize());
    },
  };
}
