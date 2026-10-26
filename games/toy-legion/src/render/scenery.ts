import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { MapDef } from '../engine';
import { B, paint } from './kit';
import manifest from './models.json';

export type Biome = 'plains' | 'valley' | 'city';
const MODELS = manifest as Record<string, string>;
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const cache = new Map<string, Promise<THREE.Object3D>>();

function load(key: string): Promise<THREE.Object3D> {
  let p = cache.get(key);
  if (!p) {
    p = loader.loadAsync(`${import.meta.env.BASE_URL}models/${MODELS[key]}`).then(g => {
      g.scene.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      return g.scene;
    });
    cache.set(key, p);
  }
  return p;
}

let seed = 11;
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];

export class Placer {
  private templates = new Map<string, { obj: THREE.Object3D; h: number; minY: number }>();
  constructor(private parent: THREE.Object3D, private y0: number) {}

  async preload(keys: string[]) {
    await Promise.all(keys.map(async k => {
      const obj = await load(k);
      const box = new THREE.Box3().setFromObject(obj);
      this.templates.set(k, { obj, h: box.max.y - box.min.y, minY: box.min.y });
    }));
  }

  put(key: string, x: number, z: number, height: number, rotY = rand() * Math.PI * 2, y = this.y0) {
    const t = this.templates.get(key);
    if (!t) return;
    const o = t.obj.clone(true);
    const s = height / t.h;
    o.scale.setScalar(s);
    o.position.set(x, y - t.minY * s, z);
    o.rotation.y = rotY;
    this.parent.add(o);
  }
}

interface Area { halfW: number; halfH: number; riverZ: number | null }

function ringSpots(a: Area, count: number, inner: number, outer: number, avoid: (x: number, z: number) => boolean = () => false): [number, number][] {
  const out: [number, number][] = [];
  let tries = 0;
  while (out.length < count && tries++ < count * 60) {
    const x = (rand() * 2 - 1) * (a.halfW + outer), z = (rand() * 2 - 1) * (a.halfH + outer);
    if (Math.abs(x) < a.halfW + inner && Math.abs(z) < a.halfH + inner) continue;
    if (avoid(x, z) || out.some(([px, pz]) => Math.hypot(px - x, pz - z) < 1)) continue;
    out.push([x, z]);
  }
  return out;
}

async function plains(p: Placer, a: Area) {
  const trees = ['forest/Tree_1_A_Color1', 'forest/Tree_2_A_Color1', 'forest/Tree_3_A_Color1', 'forest/Tree_4_A_Color1', 'original_nature/leafy_tree_a', 'original_nature/leafy_tree_b'];
  const farm: [string, number, number, number, number][] = [
    ['original/barn', -a.halfW - 3.4, 3.2, 2.4, Math.PI / 2],
    ['original/silo', -a.halfW - 5.2, 1.4, 3.2, 0],
    ['original/farmhouse', a.halfW + 3.4, -3.4, 2.2, -Math.PI / 2],
    ['medieval/building_windmill_red', a.halfW + 3.8, 4.4, 4.2, -Math.PI / 2],
    ['medieval/wheelbarrow', -a.halfW - 2.2, 5.1, .6, .6],
    ['medieval/barrel', a.halfW + 2.3, -1.6, .55, 0],
  ];
  await p.preload([...trees, ...farm.map(f => f[0])]);
  for (const [key, x, z, h, r] of farm) p.put(key, x, z, h, r);
  const nearFarm = (x: number, z: number) => farm.some(f => Math.hypot(f[1] - x, f[2] - z) < 2.4);
  for (const [x, z] of ringSpots(a, 150, .8, 15, nearFarm)) p.put(pick(trees), x, z, 1.5 + rand() * 1.2);
}

async function valley(p: Placer, a: Area, parent: THREE.Object3D, y0: number) {
  const rockMats = [paint(0xb59a72, { roughness: .9, clearcoat: 0 }), paint(0x9d8665, { roughness: .9, clearcoat: 0 }), paint(0xc4ab82, { roughness: .9, clearcoat: 0 })];
  const cap = paint(0x86b64e, { roughness: .9, clearcoat: 0 });
  const gap = (z: number) => a.riverZ !== null && Math.abs(z - a.riverZ) < 2.4;
  const tops: [number, number, number][] = [];
  for (const s of [-1, 1]) {
    for (let z = -34; z <= 34; z += 1.5) {
      if (gap(z)) continue;
      for (let k = 0; k < 4; k++) {
        const h = .9 + k * 1.05 + rand() * .5;
        const x = s * (a.halfW + 1.5 + k * 1.7 + rand() * .4);
        const w = 1.9 + rand() * .5, d = 1.7 + rand() * .3;
        B(parent, [w, h, d], rockMats[(k + Math.round(z)) % 3], [x, y0 + h / 2 - .05, z + rand() * .3], .12, [0, (rand() - .5) * .2, 0]);
        B(parent, [w * .96, .14, d * .96], cap, [x, y0 + h + .02, z], .06);
        if (rand() < .45) tops.push([x, z, y0 + h + .08]);
      }
    }
  }
  const pines = ['original_nature/pine_tree_a', 'forest/Tree_1_A_Color1'];
  const extras = ['medieval/building_watermill_blue', 'medieval/waterlily_A', 'forest/Rock_1_A_Color1', 'forest/Rock_1_E_Color1'];
  await p.preload([...pines, ...extras]);
  for (const [x, z, y] of tops) p.put(pick(pines), x, z, 1.2 + rand() * 1.1, undefined, y);
  if (a.riverZ !== null) {
    p.put('medieval/building_watermill_blue', a.halfW + 2.6, a.riverZ + 1.6, 2.6, Math.PI);
    for (let i = 0; i < 14; i++) {
      const x = (rand() < .5 ? -1 : 1) * (a.halfW + .8 + rand() * 12);
      p.put('medieval/waterlily_A', x, a.riverZ + (rand() - .5) * .8, .12, undefined, y0 + .01);
    }
  }
  for (const [x, z] of ringSpots(a, 30, .6, 3, gap)) p.put(pick(['forest/Rock_1_A_Color1', 'forest/Rock_1_E_Color1']), x, z, .5 + rand() * .5);
}

async function city(p: Placer, a: Area, parent: THREE.Object3D, y0: number) {
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x5d6168, roughness: .95 });
  const dash = new THREE.MeshStandardMaterial({ color: 0xf2efe4, roughness: .8 });
  const road = (x: number, z: number, w: number, d: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), asphalt);
    m.rotation.x = -Math.PI / 2; m.position.set(x, y0 - .001, z); m.receiveShadow = true;
    parent.add(m);
    const along = w > d;
    const len = along ? w : d;
    for (let t = -len / 2 + .5; t < len / 2; t += 1.4) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(along ? .6 : .08, along ? .08 : .6), dash);
      s.rotation.x = -Math.PI / 2; s.position.set(along ? x + t : x, y0 + .001, along ? z : z + t);
      parent.add(s);
    }
  };
  const ringX = a.halfW + 1.4, ringZ = a.halfH + 1.4, RW = 1.3;
  road(0, -ringZ, 80, RW); road(0, ringZ, 80, RW); road(-ringX, 0, RW, 80); road(ringX, 0, RW, 80);
  for (const x of [-ringX - 7.5, ringX + 7.5]) road(x, 0, RW, 80);
  for (const z of [-ringZ - 7.5, ringZ + 7.5]) road(0, z, 80, RW);
  const shops = ['commercial/building-a', 'commercial/building-b', 'commercial/building-c', 'commercial/building-d', 'commercial/building-e'];
  const houses = ['suburban/building-type-a', 'suburban/building-type-b', 'suburban/building-type-c', 'suburban/building-type-d'];
  const towers = ['commercial/building-skyscraper-a', 'commercial/building-skyscraper-b'];
  const props = ['city/streetlight', 'city/car_taxi', 'city/car_sedan', 'city/car_police', 'city/bench', 'city/firehydrant'];
  await p.preload([...shops, ...houses, ...towers, ...props]);
  const onRoad = (x: number, z: number) =>
    [ringX, ringX + 7.5, -ringX, -ringX - 7.5].some(rx => Math.abs(x - rx) < RW / 2 + 1) ||
    [ringZ, ringZ + 7.5, -ringZ, -ringZ - 7.5].some(rz => Math.abs(z - rz) < RW / 2 + 1);
  for (let x = -30; x <= 30; x += 2.6) for (let z = -32; z <= 32; z += 2.6) {
    const jx = x + (rand() - .5) * .3, jz = z + (rand() - .5) * .3;
    if (Math.abs(jx) < ringX + 1.2 && Math.abs(jz) < ringZ + 1.2) continue;
    if (onRoad(jx, jz)) continue;
    const far = Math.max(Math.abs(jx) - ringX, Math.abs(jz) - ringZ);
    const r = rand();
    const key = far > 8 && r < .25 ? pick(towers) : r < .55 ? pick(shops) : pick(houses);
    const h = key.includes('skyscraper') ? 5 + rand() * 2.5 : key.includes('suburban') ? 1.6 + rand() * .5 : 2.2 + rand() * 1.8;
    const face = Math.abs(jx) - ringX > Math.abs(jz) - ringZ ? (jx > 0 ? -Math.PI / 2 : Math.PI / 2) : (jz > 0 ? Math.PI : 0);
    p.put(key, jx, jz, h, face);
  }
  for (let t = -a.halfH; t <= a.halfH; t += 2.4) for (const s of [-1, 1]) p.put('city/streetlight', s * (ringX - RW / 2 - .35), t, 1.1, s > 0 ? -Math.PI / 2 : Math.PI / 2);
  for (let t = -a.halfW; t <= a.halfW; t += 2.4) for (const s of [-1, 1]) p.put('city/streetlight', t, s * (ringZ - RW / 2 - .35), 1.1, s > 0 ? Math.PI : 0);
  const cars = ['city/car_taxi', 'city/car_sedan', 'city/car_police'];
  for (let i = 0; i < 16; i++) {
    const vertical = rand() < .5;
    const lane = pick([-1, 1]) * (vertical ? ringX : ringZ);
    const t = (rand() * 2 - 1) * 26;
    if (vertical) p.put(pick(cars), lane + (rand() < .5 ? -.3 : .3), t, .55, rand() < .5 ? 0 : Math.PI);
    else p.put(pick(cars), t, lane + (rand() < .5 ? -.3 : .3), .55, rand() < .5 ? Math.PI / 2 : -Math.PI / 2);
  }
}

export function biomeFor(mapId: string): Biome {
  return mapId === 'river-banks' ? 'valley' : mapId === 'block-town' ? 'city' : 'plains';
}

export async function addScenery(map: MapDef, parent: THREE.Object3D, y0: number, u: number, riverY: number | undefined) {
  seed = 11;
  const a: Area = { halfW: map.width * u / 2, halfH: map.height * u / 2, riverZ: riverY === undefined ? null : (riverY - map.height / 2) * u };
  const p = new Placer(parent, y0);
  const biome = biomeFor(map.id);
  if (biome === 'plains') await plains(p, a);
  else if (biome === 'valley') await valley(p, a, parent, y0);
  else await city(p, a, parent, y0);
}
