import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TROOP_IDS, type Side, type TroopId } from '../engine';
import { OUTLINE_RES, makePiece } from './figures';

export type Portraits = Record<Side, Record<TroopId, string>>;

const W = 240, H = 300, FOV = 26;

export function renderPortraits(): Portraits {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .45;
  scene.add(new THREE.HemisphereLight(0xfff6e5, 0x5d6d8f, .7));
  const key = new THREE.DirectionalLight(0xfff1d6, 2.2);
  key.position.set(3, 6, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xbcd2ff, 1.1);
  rim.position.set(-4, 3, -4);
  scene.add(rim);
  const camera = new THREE.PerspectiveCamera(FOV, W / H, .1, 50);
  const view = new THREE.Vector3(0, Math.SQRT1_2, Math.SQRT1_2);
  const saved = OUTLINE_RES.value.clone();
  OUTLINE_RES.value.set(W, H);

  const out = { red: {}, blue: {} } as Portraits;
  for (const side of ['red', 'blue'] as Side[]) {
    for (const troop of TROOP_IDS) {
      const piece = makePiece(troop, side, -1);
      piece.children[0].visible = false;
      piece.rotation.y = -.35;
      scene.add(piece);
      piece.updateMatrixWorld(true);
      const sphere = new THREE.Box3().setFromObject(piece.userData.fig).getBoundingSphere(new THREE.Sphere());
      const fit = Math.min(FOV, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * W / H)));
      const dist = sphere.radius / Math.sin(THREE.MathUtils.degToRad(fit / 2)) * .64;
      const aim = sphere.center.clone().add(new THREE.Vector3(0, sphere.radius * .08, 0));
      camera.position.copy(aim).addScaledVector(view, dist);
      camera.lookAt(aim);
      renderer.render(scene, camera);
      out[side][troop] = canvas.toDataURL('image/png');
      scene.remove(piece);
      piece.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh && !m.userData.outline) m.geometry.dispose(); });
    }
  }
  OUTLINE_RES.value.copy(saved);
  pmrem.dispose();
  renderer.dispose();
  renderer.forceContextLoss();
  return out;
}
