import { Box3, Group, Mesh, Vector3, type Object3D } from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const BASE: string = import.meta.env.VITE_ASSET_BASE ?? './models/';

export const MODEL_NAMES = [
  'panda',
  'toriigate',
  'woodenbeam',
  'bench',
  'wall_door',
  'wall_normal',
  'wall_shoji',
  'sakuratree',
  'bamboo',
  'light',
  'plant1',
  'deadtree_1',
  'deadtree_6',
  'mapletree_1',
  'mapletree_3',
  'bush',
  'bush_large',
  'bush_flowers',
  'grass_large',
  'flower_3_clump',
  'flower_4_clump',
] as const;
export type ModelName = (typeof MODEL_NAMES)[number];
export type Assets = Record<ModelName, GLTF>;

export async function loadAssets(onProgress?: (done: number, total: number) => void): Promise<Assets> {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  let done = 0;
  const entries = await Promise.all(
    MODEL_NAMES.map(async (name) => {
      const gltf = await loader.loadAsync(`${BASE}${name}.glb`);
      onProgress?.(++done, MODEL_NAMES.length);
      return [name, gltf] as const;
    }),
  );
  return Object.fromEntries(entries) as Assets;
}

/**
 * A static copy of a model scaled by `scale`, re-centred so its footprint is centred on
 * the group origin and its lowest point sits at y = 0.
 */
export function prop(assets: Assets, name: ModelName, scale: number): Group {
  const model: Object3D = assets[name].scene.clone(true);
  model.scale.setScalar(scale);
  model.traverse((o) => {
    if ((o as Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  model.updateMatrixWorld(true);
  const box = new Box3().setFromObject(model);
  const c = box.getCenter(new Vector3());
  model.position.set(-c.x, -box.min.y, -c.z);
  const g = new Group();
  g.add(model);
  return g;
}
