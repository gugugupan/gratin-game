import * as THREE from 'three';
import type { WeatherKey } from '../core/map';
import type { World } from './scene';

const LIGHT: Record<WeatherKey, { sun: string; sunI: number; hemiI: number; exp: number; fog: number }> = {
  sun: { sun: '#fff1d6', sunI: 2.6, hemiI: 1.25, exp: 1.08, fog: 40 },
  cloud: { sun: '#e8ecf2', sunI: 1.5, hemiI: 1.35, exp: 1.0, fog: 34 },
  rain: { sun: '#c9d4e2', sunI: 1.0, hemiI: 1.15, exp: 0.92, fog: 26 },
  fog: { sun: '#e9e9e4', sunI: 0.9, hemiI: 1.45, exp: 1.0, fog: 13 },
  storm: { sun: '#9aa6bd', sunI: 0.6, hemiI: 0.9, exp: 0.82, fog: 22 },
};

export class WeatherFx {
  rain: THREE.LineSegments;
  private rainPos: Float32Array;
  private speeds: Float32Array;
  mist: THREE.Mesh[] = [];
  weather: WeatherKey = 'sun';
  night = 0;
  private flashT = 0;
  private nextBolt = 3;
  onBolt?: () => void;

  constructor(private world: World) {
    const N = 1400;
    this.rainPos = new Float32Array(N * 6);
    this.speeds = new Float32Array(N);
    for (let i = 0; i < N; i++) this.seedDrop(i, Math.random() * 6);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3));
    this.rain = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#c7d9ec', transparent: true, opacity: 0.55 }));
    this.rain.visible = false;
    world.scene.add(this.rain);
    const mistMat = new THREE.MeshBasicMaterial({ map: mistTexture(), transparent: true, opacity: 0, depthWrite: false });
    for (let i = 0; i < 7; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 3), mistMat.clone());
      m.rotation.x = -Math.PI / 2;
      m.position.set((Math.random() - 0.5) * 7, 0.35 + i * 0.06, (Math.random() - 0.5) * 5);
      m.userData.v = (Math.random() - 0.5) * 0.15 + 0.12;
      this.mist.push(m);
      world.scene.add(m);
    }
  }

  private seedDrop(i: number, y: number) {
    const x = (Math.random() - 0.5) * 10;
    const z = (Math.random() - 0.5) * 8;
    const p = this.rainPos;
    p[i * 6] = x;
    p[i * 6 + 1] = y;
    p[i * 6 + 2] = z;
    p[i * 6 + 3] = x + 0.02;
    p[i * 6 + 4] = y - 0.16;
    p[i * 6 + 5] = z + 0.01;
    this.speeds[i] = 5 + Math.random() * 3;
  }

  set(w: WeatherKey) {
    this.weather = w;
    this.rain.visible = w === 'rain' || w === 'storm';
  }

  update(dt: number) {
    const L = LIGHT[this.weather];
    const k = 1 - Math.exp(-dt * 2);
    const n = this.night;
    const sunColor = new THREE.Color(L.sun).lerp(new THREE.Color('#ff9d5c'), Math.min(1, n * 1.6)).lerp(new THREE.Color('#5a6aa8'), Math.max(0, n * 2 - 1));
    this.world.sun.color.lerp(sunColor, k);
    this.world.sun.intensity += (L.sunI * (1 - n * 0.8) - this.world.sun.intensity) * k;
    this.world.hemi.intensity += (L.hemiI * (1 - n * 0.65) - this.world.hemi.intensity) * k;
    const ex = L.exp * (1 - n * 0.25);
    this.world.renderer.toneMappingExposure += (ex - this.world.renderer.toneMappingExposure) * k;

    if (this.rain.visible) {
      const p = this.rainPos;
      for (let i = 0; i < this.speeds.length; i++) {
        const dy = this.speeds[i] * dt;
        p[i * 6 + 1] -= dy;
        p[i * 6 + 4] -= dy;
        if (p[i * 6 + 4] < 0) this.seedDrop(i, 5 + Math.random());
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }
    const mistOn = this.weather === 'fog' ? 0.38 : this.weather === 'rain' || this.weather === 'storm' ? 0.12 : 0;
    const mistColor = new THREE.Color('#ffffff').lerp(new THREE.Color('#3a4560'), n);
    for (const m of this.mist) {
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity += (mistOn * (1 - n * 0.6) - mat.opacity) * k;
      mat.color.lerp(mistColor, k);
      m.position.x += m.userData.v * dt;
      if (m.position.x > 6) m.position.x = -6;
    }
    if (this.weather === 'storm') {
      this.nextBolt -= dt;
      if (this.nextBolt < 0) {
        this.flashT = 0.25;
        this.nextBolt = 2.5 + Math.random() * 5;
        this.onBolt?.();
      }
    }
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.world.sun.intensity = 6 * Math.max(0, this.flashT) * 4;
    }
  }
}

function mistTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const ctx = cv.getContext('2d')!;
  for (let i = 0; i < 30; i++) {
    const x = 40 + Math.random() * 176;
    const y = 40 + Math.random() * 176;
    const r = 30 + Math.random() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
