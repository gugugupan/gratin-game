import {
  AnimationClip,
  AnimationMixer,
  Box3,
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  LoopOnce,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  RepeatWrapping,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { prop, type Assets, type ModelName } from './assets';
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

const KIT = 0.38;

/** Hojo-style hall north of the garden: shoji wall modules, an engawa deck with posts, a tiled gable roof. */
function buildHouse(assets: Assets, xa: number, xb: number, zFront: number) {
  const g = new Group();
  const width = xb - xa + 0.6;
  const cx = (xa + xb) / 2;
  const deckDepth = 0.95;
  const wallZ = zFront - 0.25 - deckDepth;
  const modW = 4 * KIT;
  const n = Math.max(3, Math.round(width / modW));
  const start = cx - (n * modW) / 2 + modW / 2;
  for (let i = 0; i < n; i++) {
    const kind = i === Math.floor(n / 2) ? 'wall_door' : i === 0 || i === n - 1 ? 'wall_normal' : 'wall_shoji';
    const w = prop(assets, kind, KIT);
    w.position.set(start + i * modW, 0.12, wallZ);
    g.add(w);
  }
  const wallH = 5.17 * KIT;
  const span = n * modW;
  const deck = mesh(new BoxGeometry(span + 0.3, 0.16, deckDepth), mat('#ffffff', { map: woodTex(), roughness: 0.7 }));
  deck.position.set(cx, 0.04, wallZ + 0.15 + deckDepth / 2);
  g.add(deck);
  for (let i = 0; i <= n; i++) {
    const post = prop(assets, 'woodenbeam', KIT);
    post.scale.y = (wallH + 0.15) / (5.15 * KIT);
    post.position.set(cx - span / 2 + i * modW, 0.12, wallZ + 0.15 + deckDepth - 0.1);
    g.add(post);
  }
  const tile = canvasTex(
    128,
    128,
    (ctx) => {
      ctx.fillStyle = '#4c5257';
      ctx.fillRect(0, 0, 128, 128);
      for (let x = 0; x < 128; x += 16) {
        ctx.fillStyle = '#5b6166';
        ctx.fillRect(x + 2, 0, 10, 128);
        ctx.fillStyle = 'rgba(0,0,0,.25)';
        ctx.fillRect(x + 12, 0, 2, 128);
      }
      for (let y = 0; y < 128; y += 32) {
        ctx.fillStyle = 'rgba(0,0,0,.2)';
        ctx.fillRect(0, y, 128, 3);
      }
    },
    [Math.round(span * 2), 2],
  );
  const roofM = mat('#ffffff', { map: tile, roughness: 0.6 });
  const ridgeY = wallH + 0.9;
  const ridgeZ = wallZ - 0.1;
  const eaveFront = wallZ + 0.15 + deckDepth + 0.35;
  const eaveBack = wallZ - 1.2;
  for (const [edge, eaveY] of [
    [eaveFront, wallH + 0.05],
    [eaveBack, wallH + 0.15],
  ] as const) {
    const run = edge - ridgeZ;
    const rise = eaveY - ridgeY;
    const len = Math.hypot(run, rise);
    const slab = mesh(new BoxGeometry(span + 0.8, 0.08, len), roofM);
    slab.position.set(cx, (ridgeY + eaveY) / 2 + 0.12, (ridgeZ + edge) / 2);
    slab.rotation.x = Math.atan2(-rise, Math.abs(run)) * Math.sign(run);
    g.add(slab);
  }
  const ridge = mesh(new BoxGeometry(span + 0.9, 0.12, 0.16), mat('#3a3f44', { roughness: 0.5 }));
  ridge.position.set(cx, ridgeY + 0.18, ridgeZ);
  g.add(ridge);
  const bench = prop(assets, 'bench', KIT);
  bench.rotation.y = Math.PI / 2;
  bench.position.set(cx + span / 2 - 0.6, 0.12, wallZ + 0.6);
  g.add(bench);
  const plant = prop(assets, 'plant1', KIT);
  plant.position.set(cx - span / 2 + 0.45, 0.12, wallZ + 0.55);
  g.add(plant);
  return g;
}

export interface GardenScene {
  root: Group;
  gatePos: Vector3;
  gate: Group;
  cellCenter: (c: number, r: number) => Vector3;
  sand: Mesh;
  /** Overlay that lights up unraked sand; its alpha map is set from the painter's mask. */
  highlight: Mesh<PlaneGeometry, MeshBasicMaterial>;
  /** Plants and props around the garden that may be hidden when they block a close-up. */
  decor: Object3D[];
}

/** Garden board in world units: one cell = 1, sand surface at y = 0, north = -z. */
export function buildGarden(map: GardenMap, painter: SandPainter, seed: number, assets: Assets): GardenScene {
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

  const sandM = mat('#ffffff', { map: painter.colorTex, bumpMap: painter.bumpTex, bumpScale: 1.3, roughness: 0.95 });
  const sand = mesh(new PlaneGeometry(map.cols, map.rows), sandM, false, true);
  sand.rotation.x = -Math.PI / 2;
  root.add(sand);
  const highlight = new Mesh(
    new PlaneGeometry(map.cols, map.rows),
    new MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
  );
  highlight.rotation.x = -Math.PI / 2;
  highlight.position.y = 0.004;
  highlight.visible = false;
  root.add(highlight);

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
  root.add(buildHouse(assets, x0 - frame, x1 + frame, z0 - frame));

  map.rocks.forEach((rk, i) => {
    const c = cellCenter(rk[0], rk[1]);
    const big = stone(seed + i * 7, 0.36, STONE_COLORS[i % STONE_COLORS.length], 0.7 + r() * 0.45);
    big.position.x += c.x - 0.02;
    big.position.z += c.z - 0.02;
    root.add(big);
    if (r() < 0.7) {
      const small = stone(seed + i * 7 + 1, 0.1, STONE_COLORS[(i + 2) % STONE_COLORS.length], 0.7);
      const corner = r() < 0.5 ? 1 : -1;
      small.position.x += c.x + 0.3 * corner;
      small.position.z += c.z + 0.3;
      root.add(small);
    }
  });

  const bankX = -hw - curb - bank / 2;
  const lan = lantern();
  lan.position.set(bankX - 0.15, 0.06, -hh + Math.min(2.1, map.rows * 0.42));
  root.add(lan);
  const tree = prop(assets, 'deadtree_1', 0.28);
  tree.position.set(bankX - 0.3, 0.06, -hh + 0.45);
  tree.rotation.y = 0.6;
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
  const gate = prop(assets, 'toriigate', 0.45);
  gate.position.copy(gatePos);
  root.add(gate);
  for (let k = 0; k < 6; k++) {
    const st = mesh(new CylinderGeometry(0.2, 0.22, 0.05, 9), mat('#bdb7aa'));
    st.position.set(gatePos.x + (k % 2 ? 0.15 : -0.15), -0.1, z1 + frame + 0.4 + k * 0.5);
    st.scale.set(1, 1, 0.75);
    root.add(st);
  }
  const decor: Object3D[] = [];
  const place = (name: ModelName, scale: number, x: number, z: number, rot = r() * Math.PI * 2) => {
    const o = prop(assets, name, scale);
    o.position.set(x, -0.12, z);
    o.rotation.y = rot;
    root.add(o);
    decor.push(o);
  };
  place('light', 0.4, gatePos.x - 1.6, gatePos.z + 0.3, 0);
  place('light', 0.4, gatePos.x + 1.6, gatePos.z + 0.3, 0);
  place('sakuratree', 0.5, gatePos.x - 3.2, gatePos.z - 0.6, 0.3);
  place('mapletree_1', 0.4, gatePos.x + 3.6, gatePos.z - 0.2);
  place('mapletree_3', 0.33, x0 - frame - 2.2, wallZ - 1.6);
  place('mapletree_1', 0.36, x1 + frame + 2.0, wallZ - 1.2);
  place('deadtree_6', 0.28, x1 + frame + 1.6, z1 - 0.4);
  for (let k = 0; k < 5; k++) place('bamboo', 0.42 + r() * 0.1, x1 + frame + 0.7 + r() * 0.5, wallZ + 0.6 + k * 0.55);
  const shrubs: ModelName[] = ['bush', 'bush_large', 'bush_flowers'];
  for (let k = 0; k < 10; k++) {
    const side = k % 2 ? 1 : -1;
    const x = side > 0 ? x1 + frame + 0.5 + r() * 1.6 : x0 - frame - 0.5 - r() * 1.6;
    place(shrubs[k % 3], 0.38 + r() * 0.15, x, z0 + r() * (z1 - z0 + 3));
  }
  for (let k = 0; k < 4; k++) place(shrubs[k % 3], 0.4, gatePos.x + (k < 2 ? -1 : 1) * (2.1 + (k % 2) * 0.6), gatePos.z + 0.9);
  const tufts: ModelName[] = ['grass_large', 'flower_3_clump', 'flower_4_clump'];
  for (let k = 0; k < 26; k++) {
    const x = x0 - frame - 3 + r() * (x1 - x0 + frame * 2 + 6);
    const z = z1 + frame + 0.2 + r() * 4.5;
    if (Math.abs(x - gatePos.x) < 0.6) continue;
    place(tufts[k % 3], 0.35 + r() * 0.2, x, z);
  }
  for (let k = 0; k < 6; k++) {
    const t = prop(assets, tufts[k % 3], 0.28);
    t.position.set(bankX - 0.5 + r() * 0.9, 0.06, -hh + 1 + r() * (map.rows - 1.4));
    root.add(t);
  }
  return { root, gatePos, gate, cellCenter, sand, highlight, decor };
}

export interface Monk {
  root: Group;
  rake: Group;
  head: Object3D;
  update(dt: number, moving: number): void;
  wave(): void;
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

function buildRake() {
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
  return { rake, handle };
}

const PANDA_HEIGHT = 0.82;

/** The Sushi Kit panda in a straw kasa, raking backwards; local +z is the face. */
export function buildPanda(gltf: GLTF): Monk {
  const root = new Group();
  const model = cloneSkinned(gltf.scene);
  model.traverse((o) => {
    if ((o as Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
      (o as Mesh).frustumCulled = false;
    }
  });
  const mixer = new AnimationMixer(model);
  const clip = (name: string) => mixer.clipAction(AnimationClip.findByName(gltf.animations, name)!);
  const idle = clip('Idle_Holding');
  const walk = clip('Walk_Holding');
  const waveA = clip('Wave');
  waveA.setLoop(LoopOnce, 1);
  waveA.clampWhenFinished = true;
  for (const a of [idle, walk]) a.play();
  walk.setEffectiveWeight(0);
  walk.timeScale = -1.15;
  mixer.update(0);
  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model, true);
  const k = PANDA_HEIGHT / (box.max.y - box.min.y);
  model.scale.setScalar(k);
  model.position.y = -box.min.y * k;
  root.add(model);
  root.updateMatrixWorld(true);

  const headBone = model.getObjectByName('Head')!;
  const handL = model.getObjectByName('Middle1L')!;
  const handR = model.getObjectByName('Middle1R')!;
  const top = new Box3().setFromObject(model, true).max.y;
  const hatM = mat('#ffffff', { map: strawTex(), roughness: 0.95 });
  const hat = new Group();
  const cone = mesh(new ConeGeometry(0.42, 0.17, 28, 1), hatM);
  hat.add(cone);
  const knob = mesh(new SphereGeometry(0.025, 8, 6), hatM);
  knob.position.y = 0.09;
  hat.add(knob);
  const hw = headBone.getWorldPosition(new Vector3());
  hat.position.set(hw.x, top + 0.02, hw.z);
  root.add(hat);
  headBone.attach(hat);

  const { rake, handle } = buildRake();
  let waving = false;
  mixer.addEventListener('finished', (e) => {
    if (e.action === waveA) {
      waving = false;
      waveA.fadeOut(0.3);
      idle.reset().fadeIn(0.3).play();
    }
  });
  const tmp = new Vector3();
  const tmp2 = new Vector3();
  const up = new Vector3(0, 1, 0);
  let walkW = 0;
  return {
    root,
    rake,
    head: headBone,
    wave() {
      waving = true;
      walk.fadeOut(0.2);
      idle.fadeOut(0.2);
      waveA.reset().fadeIn(0.2).play();
    },
    update(dt, moving) {
      if (!waving) {
        walkW += ((moving > 0 ? 1 : 0) - walkW) * Math.min(1, dt * 8);
        walk.setEffectiveWeight(walkW);
        idle.setEffectiveWeight(1 - walkW);
        walk.timeScale = -1.15 * Math.max(0.6, Math.min(1.4, moving));
      }
      mixer.update(dt);
      root.updateMatrixWorld(true);
      rake.updateMatrixWorld(true);
      handL.getWorldPosition(tmp);
      handR.getWorldPosition(tmp2);
      tmp.add(tmp2).multiplyScalar(0.5);
      rake.worldToLocal(tmp);
      const base = new Vector3(0, 0.08, 0);
      const dir = tmp.clone().sub(base);
      handle.scale.y = dir.length();
      handle.position.copy(base).addScaledVector(dir, 0.5);
      handle.quaternion.setFromUnitVectors(up, dir.normalize());
    },
  };
}
