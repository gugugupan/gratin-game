import * as THREE from "three";
import type { Assets } from "../art/assets";
import { texture, type PaperArt } from "../art/paper";

const flatGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

export interface FlatMaterial {
  mat: THREE.MeshStandardMaterial;
  depth: THREE.MeshDepthMaterial;
}

export function flatMaterial(art: PaperArt, transparent = false): FlatMaterial {
  const tex = texture(art.front);
  return {
    mat: new THREE.MeshStandardMaterial({ map: tex, alphaTest: transparent ? 0.02 : 0.5, transparent, depthWrite: !transparent, roughness: 0.85 }),
    depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 }),
  };
}

export function flatSprite(art: PaperArt, size: number, m: FlatMaterial): THREE.Mesh {
  const mesh = new THREE.Mesh(flatGeo, m.mat);
  mesh.scale.set(size, 1, (size * art.front.height) / art.front.width);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.customDepthMaterial = m.depth;
  return mesh;
}

const VIRUS_KEYS = ["virus_red", "virus_blue", "virus_gold"] as const;
const virusMats = new WeakMap<Assets, FlatMaterial[]>();

export function createVirusToken(assets: Assets, strain: number): THREE.Group {
  let mats = virusMats.get(assets);
  if (!mats) {
    mats = VIRUS_KEYS.map((k) => flatMaterial(assets.tokenArt[k]));
    virusMats.set(assets, mats);
  }
  const g = new THREE.Group();
  const m = flatSprite(assets.tokenArt[VIRUS_KEYS[strain]], 0.95, mats[strain]);
  m.position.y = 0.01;
  g.add(m);
  return g;
}
