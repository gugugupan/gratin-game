import * as THREE from "three";
import { drawMap, SHEET_H, SHEET_W } from "../art/mapArt";
import { texture } from "../art/paper";

const PW = SHEET_W / 3, PH = SHEET_H / 2;

function panelGeo(col: number, row: number): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(PW, PH);
  geo.rotateX(-Math.PI / 2);
  const uv = geo.attributes.uv;
  const v0 = row === 0 ? 0.5 : 0;
  for (let k = 0; k < uv.count; k++) uv.setXY(k, (col + uv.getX(k)) / 3, v0 + uv.getY(k) / 2);
  return geo;
}

export class FoldMap {
  readonly root = new THREE.Group();
  private columns: THREE.Group[] = [];
  private hinges: THREE.Group[] = [];
  private panels: { front: THREE.Mesh; back: THREE.Mesh }[] = [];

  constructor(scene: THREE.Scene, ready: Promise<unknown>) {
    this.root.position.y = 0.01;
    scene.add(this.root);
    for (let col = 0; col < 3; col++) {
      const pivot = new THREE.Group();
      pivot.position.x = (col - 1) * (PW / 2);
      this.root.add(pivot);
      const hinge = new THREE.Group();
      pivot.add(hinge);
      const localX = (col - 1) * PW - pivot.position.x;
      for (let row = 0; row < 2; row++) {
        const geo = panelGeo(col, row);
        const front = new THREE.Mesh(geo);
        const back = new THREE.Mesh(geo);
        [front, back].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
        const z = row === 0 ? -PH / 2 : PH / 2;
        front.position.set(localX, 0, z);
        back.position.set(localX, -0.002, z);
        (row === 0 ? hinge : pivot).add(front, back);
        this.panels.push({ front, back });
      }
      this.columns.push(pivot);
      this.hinges.push(hinge);
    }
    ready.then(() => this.paint());
  }

  private paint(): void {
    const art = drawMap();
    const mask = new THREE.CanvasTexture(art.mask);
    const frontMat = new THREE.MeshStandardMaterial({ map: texture(art.front), alphaTest: 0.5, roughness: 0.92 });
    const backMat = new THREE.MeshStandardMaterial({ map: texture(art.back), alphaMap: mask, alphaTest: 0.5, roughness: 0.95, side: THREE.BackSide });
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: mask, alphaTest: 0.5 });
    this.panels.forEach(({ front, back }) => {
      front.material = frontMat;
      back.material = backMat;
      front.customDepthMaterial = depth;
      back.customDepthMaterial = depth;
    });
  }

  setFold(columnsOpen: number, topOpen: number): void {
    const fc = 1 - columnsOpen, ft = 1 - topOpen;
    this.hinges.forEach((h) => { h.rotation.x = Math.PI * ft; h.position.y = 0.015 * ft; });
    this.columns[0].rotation.z = -Math.PI * fc;
    this.columns[0].position.y = 0.035 * fc;
    this.columns[2].rotation.z = Math.PI * fc;
    this.columns[2].position.y = 0.06 * fc;
    this.root.position.y = 0.01 + 0.2 * Math.sin(Math.PI * (1 - Math.max(fc, ft)));
  }
}
