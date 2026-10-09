import * as THREE from "three";
import { texture } from "../art/paper";

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  canvas: HTMLCanvasElement;
  sun: THREE.DirectionalLight;
}

export function createStage(canvas: HTMLCanvasElement): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#2c5a4c");
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 300);

  scene.add(new THREE.HemisphereLight("#fff3df", "#30483f", 0.62 * Math.PI));
  const sun = new THREE.DirectionalLight("#ffe8c8", 0.95 * Math.PI);
  sun.position.set(-12, 26, 16);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -27, right: 27, top: 24, bottom: -24, near: 1, far: 90 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);

  scene.add(cuttingMat());
  return { renderer, scene, camera, canvas, sun };
}

function cuttingMat(): THREE.Mesh {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2c5a4c";
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i <= 10; i++) {
    const p = (i / 10) * 1024;
    g.strokeStyle = i % 5 === 0 ? "rgba(236,214,120,0.55)" : "rgba(220,240,230,0.18)";
    g.lineWidth = i % 5 === 0 ? 3 : 1.5;
    g.beginPath(); g.moveTo(p, 0); g.lineTo(p, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, p); g.lineTo(1024, p); g.stroke();
  }
  g.strokeStyle = "rgba(220,240,230,0.12)";
  g.beginPath(); g.moveTo(0, 1024); g.lineTo(1024, 0); g.stroke();
  const tex = texture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(15, 15);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 }));
  mat.rotation.x = -Math.PI / 2;
  mat.position.y = -0.02;
  mat.receiveShadow = true;
  return mat;
}
