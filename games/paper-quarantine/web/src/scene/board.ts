import * as THREE from "three";
import type { RoleId, State } from "../../../engine/game.js";
import { CITY_COUNT, STRAINS } from "../../../engine/map.js";
import type { Assets } from "../art/assets";
import { cityWorld, DISTRICT_R } from "../art/mapArt";
import { STRAIN_COLORS } from "../data";
import { clamp01, easeInOut, easeOutBack, rand, reduceMotion, seg } from "../util";
import { paperWhite, Standee } from "./standee";
import { createVirusToken, flatMaterial, flatSprite, type FlatMaterial } from "./tokens";

const SPAWN_MS = 420;
const VIRUS_SIZE = 0.95;

function cubeSlot(city: number, strain: number, k: number): [number, number] {
  const own = Math.floor(city / 6);
  if (strain === own) return [(k - 1) * 0.95, 1.1];
  const side = (strain - own + 3) % 3 === 1 ? -1 : 1;
  return [side * 1.55, -0.75 + k * 0.72];
}
const REMOVE_MS = 260;
const WALK_MS = 760;

interface Item {
  obj: THREE.Object3D;
  at: number;
  born: number | null;
  dying: number | null;
  standee?: Standee;
  group?: BoardGroup;
  home?: THREE.Vector3;
  phase?: number;
}

export type BoardGroup = "cube" | "station" | "pin" | "calendar";

interface Walker {
  standee: Standee;
  city: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  start: number | null;
  at: number;
  rise: number | null;
}

export class Board {
  private items = new Set<Item>();
  private stacks = new Map<number, Item[]>();
  private stations = new Map<number, Item>();
  private lab: { item: Item; city: number } | null = null;
  private pins: Item[] = [];
  private pinCities: number[] = [];
  private pinSwap: { start: number; cities: number[]; moved: boolean[] } | null = null;
  private walkers = new Map<RoleId, Walker>();
  private barricade: Item | null = null;
  private burst: { mesh: THREE.Mesh; fm: FlatMaterial; start: number | null };
  private reveal = 0;
  private hitAreas: THREE.Mesh[] = [];
  private markers: THREE.Mesh[] = [];
  private markerCities: number[] = [];
  private hiddenGroups = new Set<BoardGroup>();
  private hiddenRoles = new Set<RoleId>();

  constructor(private scene: THREE.Scene, private assets: Assets) {
    for (let i = 0; i < CITY_COUNT; i++) {
      const p = cityWorld(i);
      const g = new THREE.Group();
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.06, 40), paperWhite);
      rim.position.y = 0.04;
      rim.castShadow = rim.receiveShadow = true;
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.03, 40), new THREE.MeshStandardMaterial({ color: STRAIN_COLORS[Math.floor(i / 6)], roughness: 0.85 }));
      top.position.y = 0.085;
      top.receiveShadow = true;
      g.add(rim, top);
      g.position.copy(p);
      this.add(g, 0.56 + (i / CITY_COUNT) * 0.12, false);
      const hit = new THREE.Mesh(new THREE.CylinderGeometry(DISTRICT_R, DISTRICT_R, 0.6, 20), new THREE.MeshBasicMaterial({ visible: false }));
      hit.position.set(p.x, 0.3, p.z + 0.2);
      hit.userData.city = i;
      scene.add(hit);
      this.hitAreas.push(hit);
    }
    const fm = flatMaterial(assets.tokenArt.outbreak, true);
    const mesh = flatSprite(assets.tokenArt.outbreak, 1, fm);
    mesh.castShadow = false;
    mesh.visible = false;
    scene.add(mesh);
    this.burst = { mesh, fm, start: null };
  }

  addStatic(obj: THREE.Object3D, at: number, group?: BoardGroup): void {
    this.add(obj, at, false, undefined, group);
  }

  setGroupHidden(group: BoardGroup, hidden: boolean): void {
    if (this.hiddenGroups.has(group) === hidden) return;
    if (hidden) this.hiddenGroups.add(group);
    else {
      this.hiddenGroups.delete(group);
      const now = performance.now();
      for (const item of this.items) if (item.group === group && item.dying === null) item.born = now;
    }
  }

  setRoleHidden(role: RoleId, hidden: boolean): void {
    if (this.hiddenRoles.has(role) === hidden) return;
    if (hidden) this.hiddenRoles.add(role);
    else {
      this.hiddenRoles.delete(role);
      const w = this.walkers.get(role);
      if (w) w.rise = performance.now();
    }
  }

  isRoleHidden(role: RoleId): boolean {
    return this.hiddenRoles.has(role);
  }

  private add(obj: THREE.Object3D, at: number, spawned: boolean, standee?: Standee, group?: BoardGroup): Item {
    const item: Item = { obj, at, born: spawned ? performance.now() : null, dying: null, standee, group };
    this.scene.add(obj);
    this.items.add(item);
    return item;
  }

  private remove(item: Item, animate: boolean): void {
    if (!animate) {
      this.scene.remove(item.obj);
      this.items.delete(item);
      return;
    }
    item.dying = performance.now();
  }

  private tokenStandee(key: keyof Assets["tokenArt"], height: number): Standee {
    return new Standee(this.assets.tokenArt[key], height);
  }

  reset(roles: RoleId[]): void {
    for (const list of this.stacks.values()) list.forEach((it) => this.remove(it, false));
    this.stacks.clear();
    for (const it of this.stations.values()) this.remove(it, false);
    this.stations.clear();
    if (this.lab) this.remove(this.lab.item, false);
    this.lab = null;
    this.pins.forEach((it) => this.remove(it, false));
    this.pins = [];
    this.pinCities = [];
    this.pinSwap = null;
    for (const w of this.walkers.values()) this.scene.remove(w.standee.outer);
    this.walkers.clear();
    if (this.barricade) this.remove(this.barricade, false);
    this.barricade = null;

    roles.forEach((role, i) => {
      const st = new Standee(this.assets.roleArt[role], 3.7);
      this.scene.add(st.outer);
      this.walkers.set(role, { standee: st, city: -1, from: new THREE.Vector3(), to: new THREE.Vector3(), start: null, at: 0.8 + i * 0.06, rise: null });
    });
    for (let k = 0; k < 3; k++) {
      const st = this.tokenStandee("named_pin", 1.15);
      const item = this.add(st.outer, 0.78, false, st, "pin");
      item.obj.visible = false;
      this.pins.push(item);
    }
    if (roles.includes("police")) {
      const st = this.tokenStandee("lockdown", 1.35);
      this.barricade = this.add(st.outer, 0.9, false, st);
    }
  }

  standeeOf(role: RoleId): Standee | undefined {
    return this.walkers.get(role)?.standee;
  }

  roles(): RoleId[] {
    return [...this.walkers.keys()];
  }

  sync(state: State, animate: boolean): void {
    const now = performance.now();
    this.setCubes((c, s) => state.cube(c, s), animate);
    this.syncStations(state, animate);
    this.syncLab(state, animate);
    this.showNamed(state.lastDrawn, animate);
    this.syncWalkers(state, animate, now);
  }

  setCubes(count: (city: number, strain: number) => number, animate: boolean): void {
    for (let c = 0; c < CITY_COUNT; c++) {
      for (let s = 0; s < STRAINS; s++) {
        const key = c * STRAINS + s;
        const want = count(c, s);
        const list = this.stacks.get(key) ?? [];
        while (list.length < want) {
          const k = list.length;
          const r = rand(key * 31 + k * 7 + 3);
          const v = createVirusToken(this.assets, s);
          v.scale.setScalar(VIRUS_SIZE);
          const [dx, dz] = cubeSlot(c, s, k);
          const p = cityWorld(c);
          v.position.set(p.x + dx, 0.03, p.z + dz);
          v.rotation.y = r() * Math.PI * 2;
          const item = this.add(v, 0.64 + ((key + k) % 12) * 0.012, animate, undefined, "cube");
          item.home = v.position.clone();
          item.phase = r() * 100;
          list.push(item);
        }
        while (list.length > want) this.remove(list.pop()!, animate);
        this.stacks.set(key, list);
      }
    }
  }

  private syncStations(state: State, animate: boolean): void {
    const want = new Set(state.stations);
    for (const [city, item] of this.stations) {
      if (!want.has(city)) {
        this.remove(item, animate);
        this.stations.delete(city);
      }
    }
    want.forEach((city) => {
      if (this.stations.has(city)) return;
      const st = this.tokenStandee("station", 1.9);
      const p = cityWorld(city);
      st.outer.position.set(p.x + 1.25, 0, p.z - 1.15);
      this.stations.set(city, this.add(st.outer, 0.72, animate, st, "station"));
    });
  }

  private syncLab(state: State, animate: boolean): void {
    const city = state.labCity;
    if (this.lab && this.lab.city !== city) {
      this.remove(this.lab.item, animate);
      this.lab = null;
    }
    if (city >= 0 && !this.lab) {
      const st = this.tokenStandee("field_lab", 1.9);
      const p = cityWorld(city);
      st.outer.position.set(p.x - 1.25, 0, p.z - 1.15);
      this.lab = { item: this.add(st.outer, 0.74, animate, st), city };
    }
  }

  private placePin(item: Item, city: number): void {
    const p = cityWorld(city);
    item.obj.position.set(p.x - 0.25, 0, p.z - 1.55);
  }

  showNamed(cities: number[], animate: boolean): void {
    const now = performance.now();
    const same = cities.length === this.pinCities.length && cities.every((c, i) => c === this.pinCities[i]);
    if (same) return;
    const hadPins = this.pinCities.length > 0;
    const grows = hadPins && cities.length > this.pinCities.length && this.pinCities.every((c, i) => c === cities[i]);
    const from = this.pinCities.length;
    this.pinCities = cities.slice();
    if (grows && !this.pinSwap) {
      for (let i = from; i < Math.min(cities.length, this.pins.length); i++) {
        const item = this.pins[i];
        this.placePin(item, cities[i]);
        item.obj.visible = true;
        item.born = animate ? now : null;
      }
      return;
    }
    if (!animate || !hadPins) {
      this.pinSwap = null;
      this.pins.forEach((item, i) => {
        item.obj.visible = i < cities.length;
        if (i < cities.length) this.placePin(item, cities[i]);
        if (animate && i < cities.length) item.born = now;
      });
      return;
    }
    this.pinSwap = { start: now, cities: cities.slice(), moved: this.pins.map(() => false) };
  }

  private syncWalkers(state: State, animate: boolean, now: number): void {
    const byCity = new Map<number, RoleId[]>();
    state.roles.forEach((role, r) => {
      const c = state.pos[r];
      byCity.set(c, [...(byCity.get(c) ?? []), role]);
    });
    state.roles.forEach((role, r) => {
      const w = this.walkers.get(role);
      if (!w) return;
      const city = state.pos[r];
      const mates = byCity.get(city)!;
      const slot = mates.indexOf(role);
      const spread = mates.length > 1 ? (slot - (mates.length - 1) / 2) * 1.1 : 0;
      const dest = cityWorld(city).add(new THREE.Vector3(spread, 0, 0.15));
      if (w.city === -1 || !animate || reduceMotion) {
        w.standee.outer.position.copy(dest);
        w.to.copy(dest);
        w.start = null;
      } else if (!dest.equals(w.to)) {
        w.from.copy(w.standee.outer.position);
        w.to.copy(dest);
        w.start = now;
      }
      w.city = city;
    });
  }

  highlight(cities: number[]): void {
    this.markerCities = cities.slice();
    while (this.markers.length < cities.length) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.09, 10, 48).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: "#fbf6ea", emissive: "#c4472f", emissiveIntensity: 0.55, roughness: 0.6 }),
      );
      ring.castShadow = true;
      this.scene.add(ring);
      this.markers.push(ring);
    }
    this.markers.forEach((m, i) => {
      m.visible = i < cities.length;
      if (i < cities.length) m.position.copy(cityWorld(cities[i])).setY(0.16);
    });
  }

  pickCity(raycaster: THREE.Raycaster): number | null {
    const hit = raycaster.intersectObjects(this.hitAreas, false)[0];
    return hit ? (hit.object.userData.city as number) : null;
  }

  isHighlighted(city: number): boolean {
    return this.markerCities.includes(city);
  }

  triggerOutbreak(city: number): void {
    const c = cityWorld(city);
    this.burst.mesh.position.set(c.x, 0.45, c.z + 0.4);
    this.burst.start = performance.now();
  }

  setReveal(p: number): void {
    this.reveal = p;
  }

  update(now: number, camera: THREE.Camera, team: RoleId[]): void {
    for (const item of [...this.items]) {
      if (item === this.barricade && !team.includes("police")) {
        item.obj.visible = false;
        continue;
      }
      if (item.group && this.hiddenGroups.has(item.group)) {
        item.obj.visible = false;
        continue;
      }
      const isPin = this.pins.includes(item);
      if (isPin && this.pinSwap) continue;
      const k = seg(this.reveal, item.at, item.at + 0.1);
      let s = k <= 0 ? 0 : easeOutBack(k);
      if (item.born !== null) s *= easeOutBack(clamp01((now - item.born) / SPAWN_MS));
      if (item.dying !== null) {
        const d = clamp01((now - item.dying) / REMOVE_MS);
        s *= 1 - easeInOut(d);
        if (d >= 1) {
          this.scene.remove(item.obj);
          this.items.delete(item);
          continue;
        }
      }
      if (isPin && this.pins.indexOf(item) >= this.pinCities.length) s = 0;
      item.obj.visible = s > 0.001;
      if (item.home) s *= this.idleVirus(item, now);
      item.obj.scale.setScalar(Math.max(0.0001, s * (item.group === "cube" ? VIRUS_SIZE : 1)));
      if (item.standee && !reduceMotion) {
        const [w, l] = item.standee.gust(now);
        item.standee.face(camera, w * 0.7, l * 0.7, false);
      }
    }
    this.updatePinSwap(now);
    this.updateWalkers(now, camera);
    this.updateBurst(now);
    const pulse = 1 + Math.sin(now / 180) * 0.08;
    this.markers.forEach((m) => m.scale.set(pulse, 1, pulse));
  }

  private idleVirus(item: Item, now: number): number {
    if (reduceMotion || !item.home) return 1;
    const t = now / 1000, ph = item.phase ?? 0;
    const period = 6 + (ph % 5);
    const local = (t + ph * 3) % period;
    const hop = local < 0.5 ? Math.sin((local / 0.5) * Math.PI) * 0.22 : 0;
    item.obj.position.set(
      item.home.x + Math.sin(t * 0.45 + ph) * 0.06,
      item.home.y + hop,
      item.home.z + Math.cos(t * 0.38 + ph * 1.7) * 0.05,
    );
    item.obj.rotation.y = ph + Math.sin(t * 0.25 + ph) * 0.9;
    return 1 + Math.sin(t * 1.5 + ph * 3) * 0.07;
  }

  private updatePinSwap(now: number): void {
    const swap = this.pinSwap;
    if (!swap) return;
    const k = clamp01((now - swap.start) / 1000);
    this.pins.forEach((item, i) => {
      const local = clamp01((k - i * 0.08) / 0.76);
      let s: number;
      if (local < 0.45) s = 1 - easeInOut(local / 0.45);
      else {
        if (!swap.moved[i] && i < swap.cities.length) {
          this.placePin(item, swap.cities[i]);
          swap.moved[i] = true;
        }
        s = i < swap.cities.length ? easeOutBack((local - 0.45) / 0.55) : 0;
      }
      item.obj.visible = s > 0.001;
      item.obj.scale.setScalar(Math.max(0.0001, s));
    });
    if (k >= 1) this.pinSwap = null;
  }

  private updateWalkers(now: number, camera: THREE.Camera): void {
    for (const [role, w] of this.walkers) {
      const st = w.standee;
      let k = seg(this.reveal, w.at, w.at + 0.1);
      if (w.rise !== null) {
        k = Math.min(k, clamp01((now - w.rise) / 700));
        if (k >= 1) w.rise = null;
      }
      st.outer.visible = k > 0 && !this.hiddenRoles.has(role);
      st.rise.rotation.x = (-Math.PI / 2) * (1 - easeOutBack(k));
      if (w.start !== null) {
        const t = clamp01((now - w.start) / WALK_MS);
        st.outer.position.lerpVectors(w.from, w.to, easeInOut(t));
        st.outer.position.y = Math.abs(Math.sin(t * Math.PI * 2)) * 0.35;
        const dx = w.to.clone().project(camera).x - w.from.clone().project(camera).x;
        if (Math.abs(dx) > 0.01) st.facing = dx > 0 ? 1 : -1;
        st.face(camera, Math.sin(t * Math.PI * 4) * 0.1, 0);
        if (t >= 1) {
          st.outer.position.copy(w.to);
          w.start = null;
        }
      } else if (reduceMotion) st.face(camera, 0, 0);
      else st.face(camera, ...st.gust(now));
    }
    const police = this.walkers.get("police");
    if (police && this.barricade) {
      const p = police.standee.outer.position;
      this.barricade.obj.position.set(p.x + 1.15, 0, p.z + 0.45);
    }
  }

  private updateBurst(now: number): void {
    const b = this.burst;
    if (b.start === null) return;
    const k = clamp01((now - b.start) / 1500);
    const size = 4 * easeOutBack(clamp01(k * 3.2));
    b.mesh.visible = true;
    b.mesh.scale.set(size, 1, size);
    b.mesh.rotation.y = k * 0.5;
    b.fm.mat.opacity = k < 0.55 ? 1 : 1 - (k - 0.55) / 0.45;
    if (k >= 1) {
      b.mesh.visible = false;
      b.start = null;
    }
  }

  pickRole(raycaster: THREE.Raycaster): RoleId | null {
    for (const [role, w] of this.walkers) {
      if (this.hiddenRoles.has(role)) continue;
      for (const hit of raycaster.intersectObject(w.standee.flip, true)) {
        if (hit.uv && w.standee.opaqueAt(hit.uv)) return role;
      }
    }
    return null;
  }
}
