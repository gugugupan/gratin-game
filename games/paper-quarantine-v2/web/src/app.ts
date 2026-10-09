import * as THREE from "three";
import { V2_CONFIG, V2State, type Carrier, type RoleId, type V2Action, type V2Event } from "../../engine/game.js";
import { EDGES } from "../../engine/map.js";
import { cityWorld, SHEET_SCALE } from "./art/mapArt";
import { iconUrl } from "./art/assets";
import { fontsReady, type Assets } from "./art/assets";
import { Board } from "./scene/board";
import { Calendar } from "./scene/calendar";
import { TASK, TaskNote } from "./scene/taskNote";
import { CameraRig } from "./scene/cameraRig";
import { FoldMap } from "./scene/foldMap";
import { Overlays } from "./scene/overlays";
import { DeskProps } from "./scene/props";
import { createStage, type Stage } from "./scene/stage";
import { describe, entriesFor, type MenuEntry } from "./game/actions";
import { ActionMenu } from "./ui/actionMenu";
import { Dialog } from "./ui/dialog";
import { CityCard } from "./ui/cityCard";
import { Draft } from "./ui/draft";
import { Report } from "./ui/report";
import { Rules } from "./ui/rules";
import { Hud } from "./ui/hud";
import { CITY_NAMES, MUTATION_INFO, ROLE_INFO, STRAIN_NAME } from "./data";
import { NEWS_INFO } from "./text";
import { clamp01, easeInOut, el, reduceMotion, seg } from "./util";

type Mode = "menu" | "transition" | "game";
const SUN_OFFSET = new THREE.Vector3(-12, 26, 16);
const TRANSITION_MS = reduceMotion ? 1 : 3600;

export class App {
  readonly stage: Stage;
  private fold: FoldMap;
  private props: DeskProps;
  private calendar: Calendar;
  private taskNote = new TaskNote();
  readonly board: Board;
  readonly overlays: Overlays;
  private rig: CameraRig;
  readonly hud = new Hud();
  private draft: Draft;
  private menu: ActionMenu;
  private dialog = new Dialog();
  private report = new Report();
  private rules = new Rules();
  private cityCard = new CityCard();
  private portraits: Record<RoleId, string>;
  private history: V2State[] = [];
  private targeting: { role: RoleId; entry: MenuEntry } | null = null;
  private busy = false;
  private speed = 1;
  private cameraGoal: THREE.Vector3 | null = null;

  state: V2State | null = null;
  active: RoleId | null = null;
  private mode: Mode = "menu";
  private progress = 0;
  private anim: { from: number; to: number; start: number } | null = null;
  private focusGoal = new THREE.Vector3();
  private raycaster = new THREE.Raycaster();
  private drag = { id: -1, x: 0, y: 0, sx: 0, sy: 0 };
  readonly ready: Promise<void>;

  constructor(private assets: Assets) {
    this.stage = createStage(el<HTMLCanvasElement>("stage"));
    const { scene, camera } = this.stage;
    this.fold = new FoldMap(scene, fontsReady);
    this.props = new DeskProps(scene, assets, fontsReady);
    this.calendar = new Calendar(fontsReady);
    this.board = new Board(scene, assets);
    this.overlays = new Overlays(scene, assets);
    this.overlays.setVisible(false);
    this.board.addStatic(this.calendar.group, 0.7, "calendar");
    this.board.addStatic(this.taskNote.mesh, 0.72, "task");
    this.rig = new CameraRig(camera);
    this.portraits = Object.fromEntries(Object.entries(assets.roleImages).map(([k, img]) => [k, img.src])) as Record<RoleId, string>;
    this.draft = new Draft(this.portraits, (roles) => this.newGame(roles));
    this.menu = new ActionMenu((entry) => void this.pickEntry(entry));
    this.calendar.show({ round: 1, rounds: V2_CONFIG.rounds, epidemics: 0, epidemicsTotal: V2_CONFIG.riotLimit, rate: 0 }, false);

    this.bindUi();
    this.bindPointer();
    addEventListener("resize", () => this.resize());
    this.resize();
    document.fonts.ready.then(() => this.resize());
    this.applyTimeline(0);
    this.ready = this.fold.painted.then(() => {
      this.stage.renderer.compile(scene, camera);
      this.stage.renderer.render(scene, camera);
    });
    requestAnimationFrame((t) => this.tick(t));
  }

  private bindUi(): void {
    el("start-game").addEventListener("click", () => this.draft.open());
    el("open-rules").addEventListener("click", () => this.rules.open());
    el("help").addEventListener("click", () => this.rules.open());
    el<HTMLButtonElement>("continue-game").disabled = true;
    el("continue-note").textContent = "原型暂不支持存档";
    el("back-menu").addEventListener("click", () => void this.backToMenu());
    this.hud.teamCards.addEventListener("click", (e) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".idcard");
      if (card) this.select(card.dataset.role as RoleId, true);
    });
    el("undo").addEventListener("click", () => this.undo());
    el("end-turn").addEventListener("click", () => void this.endTurn());
    el("target-cancel").addEventListener("click", () => this.stopTargeting());
    el("fast").addEventListener("click", () => { this.speed = 5; });
    addEventListener("keydown", (e) => {
      if (this.dialog.isOpen || this.rules.isOpen || !el("report").hidden) return;
      if (e.key === "Escape") {
        if (this.draft.isOpen) this.draft.close();
        else if (this.targeting) this.stopTargeting();
        else this.menu.close();
      }
      if ((e.key === "z" || e.key === "Z") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.undo();
      }
    });
  }

  private bindPointer(): void {
    const canvas = this.stage.canvas;
    const drag = this.drag;
    canvas.addEventListener("pointerdown", (e) => {
      if (this.busy) this.speed = 5;
      if (drag.id !== -1 || this.mode !== "game") return;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // Synthetic or already-released pointers cannot be captured; dragging still works without capture.
      }
      Object.assign(drag, { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY });
    });
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerId !== drag.id) return;
      if (e.pointerType === "mouse" && !(e.buttons & 1)) {
        drag.id = -1;
        return;
      }
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      this.rig.following = false;
      this.rig.pan(e.clientX - drag.x, e.clientY - drag.y);
      drag.x = e.clientX;
      drag.y = e.clientY;
    });
    const release = (e: PointerEvent) => {
      if (e.pointerId === drag.id) drag.id = -1;
    };
    canvas.addEventListener("pointerup", (e) => {
      if (e.pointerId === drag.id && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) {
        const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
        this.raycaster.setFromCamera(ndc, this.stage.camera);
        if (this.targeting) {
          const entry = this.targeting.entry;
          if (entry.kind === "road") {
            const edge = this.overlays.pickRoad(this.raycaster);
            const road = edge === null ? undefined : entry.roads?.find((r) => r.edge === edge);
            if (road) {
              this.stopTargeting();
              this.perform(road.action);
            } else this.hud.toast("请点选高亮的道路");
          } else {
            const city = this.board.pickCity(this.raycaster);
            const target = city === null ? undefined : entry.targets?.find((t) => t.city === city);
            if (target) {
              this.stopTargeting();
              this.perform(target.action);
            } else this.hud.toast("请点选高亮的城市");
          }
          release(e);
          return;
        }
        const role = this.board.pickRole(this.raycaster);
        const city = role ? null : this.board.pickCity(this.raycaster);
        if (role) this.select(role, true);
        else if (city !== null && this.state && this.mode === "game") {
          this.menu.close();
          if (this.cityCard.city === city) this.cityCard.close();
          else this.cityCard.open(this.state, city);
        } else {
          this.menu.close();
          this.cityCard.close();
        }
      }
      release(e);
    });
    canvas.addEventListener("pointercancel", release);
    canvas.addEventListener("lostpointercapture", release);
    canvas.addEventListener("dblclick", () => { this.rig.following = true; });
  }

  private async backToMenu(): Promise<void> {
    if (this.dialog.isOpen || this.mode !== "game") return;
    if (this.busy) {
      this.hud.toast("传播结算中，结束后再返回");
      return;
    }
    const choice = await this.dialog.show({
      title: "返回菜单？",
      body: "原型暂不支持存档，返回菜单后这一局就结束了。",
      buttons: [{ id: "stay", label: "继续游戏" }, { id: "leave", label: "返回菜单", primary: true }],
      cancel: "stay",
    });
    if (choice !== "leave") return;
    this.closeMenus();
    this.play(0);
  }

  newGame(roles: [RoleId, RoleId], seed = Math.floor(Math.random() * 2 ** 31)): void {
    const state = new V2State(V2_CONFIG, roles, seed);
    state.setup();
    this.state = state;
    this.active = roles[0];
    this.history = [];
    this.busy = false;
    this.closeMenus();
    this.board.reset(roles);
    this.board.setGroupHidden("task", true);
    this.overlays.clear();
    this.overlays.setVisible(true);
    this.refresh(false);
    this.play(1);
    void this.briefTask(state);
  }

  private async briefTask(state: V2State): Promise<void> {
    await new Promise((res) => setTimeout(res, TRANSITION_MS * 0.9));
    if (this.state !== state || this.mode === "menu") return;
    if (!document.body.classList.contains("cover-shot")) {
      const s = state;
      await this.dialog.show({
        title: TASK.title,
        body: `<p>${TASK.lead}</p><ul class="task-list">
          <li class="win">☐ ${TASK.goal(s.curedCount())}</li>
          <li>✕ ${TASK.riots(s.riots(), s.cfg.riotLimit)}</li>
          <li>✕ ${TASK.time(s.round, s.cfg.rounds)}</li>
        </ul>
        <p class="task-hint">地图上的小纸片是<b>携带者</b>，头上的数字是还要几轮到达；城市旁红色的 <b>+n</b> 是本轮结束时会进城的数量。城区外圈是<b>恐慌</b>。点城市可以看详情。</p>`,
        buttons: [{ id: "go", label: TASK.go, primary: true }],
        cancel: "go",
      });
      if (this.state !== state) return;
      await this.flyTaskCard();
    }
    this.board.setGroupHidden("task", false);
  }

  private flyTaskCard(): Promise<void> {
    const fly = document.createElement("div");
    fly.className = "task-fly";
    fly.textContent = TASK.title;
    document.body.append(fly);
    const v = this.taskNote.mesh.position.clone().project(this.stage.camera);
    const x = Math.max(40, Math.min(innerWidth - 40, ((v.x + 1) / 2) * innerWidth));
    const y = Math.max(20, Math.min(innerHeight - 40, ((1 - v.y) / 2) * innerHeight));
    void fly.offsetWidth;
    fly.style.transform = `translate(${x - innerWidth / 2}px, ${y - innerHeight / 2}px) scale(.22) rotate(-8deg)`;
    fly.style.opacity = "0.2";
    return new Promise((res) => setTimeout(() => {
      fly.remove();
      res();
    }, reduceMotion ? 0 : 650));
  }

  refresh(animate: boolean): void {
    const s = this.state;
    if (!s) return;
    this.board.sync(s, animate);
    this.overlays.syncCity(s);
    this.overlays.placeCarriers(s, animate ? 400 : 1);
    this.overlays.dropStale(s);
    this.hud.render(s, this.portraits, this.active);
    this.taskNote.update(s);
    this.cityCard.update(s);
    this.relayout();
    el<HTMLButtonElement>("undo").disabled = this.history.length === 0;
    el("end-turn").classList.toggle("ready", s.status === "playing" && s.ap <= 0);
    document.body.classList.toggle("busy", this.busy);
    el("fast").hidden = !this.busy;
    this.calendar.show({ round: s.round, rounds: s.cfg.rounds, epidemics: s.riots(), epidemicsTotal: s.cfg.riotLimit, rate: s.carriers.length }, animate);
  }

  select(role: RoleId, openMenu = false): void {
    this.active = role;
    this.rig.following = true;
    this.hud.setActive(role);
    if (openMenu) this.openMenu(role);
  }

  private canAct(): boolean {
    return this.mode === "game" && !this.busy && !!this.state && this.state.status === "playing" && !this.dialog.isOpen;
  }

  private openMenu(role: RoleId): void {
    const s = this.state;
    if (!s || !this.canAct()) return;
    this.stopTargeting();
    this.cityCard.close();
    const r = s.roles.indexOf(role);
    const st = this.board.standeeOf(role);
    if (r < 0 || !st) return;
    this.menu.open(ROLE_INFO[role].name, entriesFor(s, r), st.outer);
  }

  private closeMenus(): void {
    this.menu.close();
    this.cityCard.close();
    this.stopTargeting();
  }

  private async pickEntry(entry: MenuEntry): Promise<void> {
    this.menu.close();
    if (!this.canAct() || entry.disabled) return;
    if (entry.kind === "apply" && entry.action) this.perform(entry.action);
    else if (entry.kind === "target" || entry.kind === "road") this.startTargeting(entry);
    else if (entry.kind === "pick" && entry.picks?.length) {
      const id = await this.dialog.show({
        title: entry.label,
        body: entry.note ?? "",
        choices: entry.picks.map((p, i) => ({ id: String(i), label: p.label, html: `<b>${p.label}</b>${p.note ? `<small>${p.note}</small>` : ""}` })),
        buttons: [{ id: "cancel", label: "取消" }],
        cancel: "cancel",
      });
      if (id !== "cancel") this.perform(entry.picks[Number(id)].action);
    }
  }

  private startTargeting(entry: MenuEntry): void {
    if (!this.active) return;
    if (entry.kind === "road") {
      if (!entry.roads?.length) return;
      this.overlays.highlightRoads(entry.roads.map((r) => r.edge));
      el("target-text").textContent = `${entry.label}：点选高亮的道路`;
    } else {
      if (!entry.targets?.length) return;
      this.board.highlight(entry.targets.map((t) => t.city));
      el("target-text").textContent = `${entry.label}：点选高亮的城市`;
    }
    this.targeting = { role: this.active, entry };
    el("target-hint").hidden = false;
  }

  private stopTargeting(): void {
    if (!this.targeting) return;
    this.targeting = null;
    this.board.highlight([]);
    this.overlays.highlightRoads([]);
    el("target-hint").hidden = true;
  }

  private perform(action: V2Action): void {
    const s = this.state;
    if (!s || !this.canAct()) return;
    const text = describe(s, action);
    this.history.push(s.clone());
    s.apply(action);
    this.refresh(true);
    if (text) this.hud.toast(text);
    if (s.status === "won") void this.gameOver();
  }

  private undo(): void {
    if (!this.canAct() || !this.history.length) return;
    this.closeMenus();
    this.state = this.history.pop()!;
    this.refresh(true);
    this.hud.toast("已撤销上一步");
  }

  async endTurn(skipConfirm = false): Promise<void> {
    const s = this.state;
    if (!s || !this.canAct()) return;
    this.closeMenus();
    if (s.ap > 0 && !skipConfirm) {
      const choice = await this.dialog.show({
        title: "结束行动？",
        body: `还剩 ${s.ap} 个行动点没有用。结束后进入传播阶段，之前的行动就不能撤销了。`,
        buttons: [{ id: "no", label: "继续行动" }, { id: "yes", label: "结束行动", primary: true }],
        cancel: "no",
      });
      if (choice !== "yes") return;
    }
    this.history = [];
    this.busy = true;
    this.speed = reduceMotion ? 5 : 1;
    this.refresh(false);
    const before = s.clone();
    s.events = [];
    s.endRound();
    const events = s.events;
    s.events = null;
    await this.playSpread(before, s, events);
    this.busy = false;
    this.cameraGoal = null;
    this.rig.following = true;
    this.refresh(true);
    if (s.status !== "playing") {
      await this.sleep(600);
      void this.gameOver();
      return;
    }
    this.hud.toast(`第 ${s.round} / ${s.cfg.rounds} 轮 · 开始行动`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms / this.speed));
  }

  private focusCity(city: number): void {
    this.rig.following = false;
    this.cameraGoal = this.rig.focusOn(cityWorld(city), new THREE.Vector3());
  }

  private async playSpread(before: V2State, after: V2State, events: V2Event[]): Promise<void> {
    const name = (c: number) => CITY_NAMES[c];
    const cubes = before.level.slice();
    const view = (c: number, k: number) => cubes[c * 3 + k];
    const beforeCarriers = new Map<number, Carrier>(before.carriers.map((k) => [k.id, k]));
    const afterIds = new Set(after.carriers.map((k) => k.id));
    let moved = false;
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      switch (e.t) {
        case "mutation":
          this.showEventCard(iconUrl(MUTATION_INFO[e.m].icon), "变异！", `${STRAIN_NAME[e.strain]}发生变异：${MUTATION_INFO[e.m].name}（${MUTATION_INFO[e.m].text}）`);
          await this.sleep(2200);
          break;
        case "move":
        case "intercepted": {
          if (moved) break;
          moved = true;
          const intercepted = events.filter((x): x is Extract<V2Event, { t: "intercepted" }> => x.t === "intercepted");
          const caught = new Set(intercepted.map((x) => x.carrier));
          this.overlays.placeCarriers(after, 1000, (id) => beforeCarriers.has(id) && afterIds.has(id));
          for (const [id, k] of beforeCarriers) {
            if (afterIds.has(id)) continue;
            if (caught.has(id)) this.overlays.finishCarrier(id, this.overlays.checkpointPoint(k.edge), 600);
            else this.overlays.finishCarrier(id, this.overlays.arrivalPoint(k), 1000);
          }
          if (intercepted.length) {
            const x = intercepted[0];
            this.hud.toast(`检查站拦下了 ${intercepted.length} 个携带者（${name(EDGES[x.edge][0])}—${name(EDGES[x.edge][1])}${intercepted.length > 1 ? " 等" : ""}）`);
          }
          await this.sleep(1150);
          break;
        }
        case "blocked":
          this.focusCity(e.city);
          this.hud.toast(`${name(e.city)}封城，挡下了一个携带者`);
          await this.sleep(650);
          break;
        case "infect":
          cubes[e.city * 3 + e.s]++;
          this.focusCity(e.city);
          this.board.setCubes(view, true);
          this.hud.toast(`${name(e.city)}：${STRAIN_NAME[e.s]}感染 +1`);
          await this.sleep(520);
          break;
        case "outbreak":
          this.focusCity(e.city);
          this.board.triggerOutbreak(e.city);
          this.hud.toast(`${name(e.city)}爆发！向所有邻城派出携带者`);
          await this.sleep(1000);
          break;
        case "spawn": {
          const ids = [e.carrier];
          while (events[i + 1]?.t === "spawn") ids.push((events[++i] as Extract<V2Event, { t: "spawn" }>).carrier);
          const set = new Set(ids);
          this.overlays.placeCarriers(after, 1, (id) => set.has(id));
          this.hud.toast(ids.length > 1 ? `新派出 ${ids.length} 个携带者` : "新派出 1 个携带者");
          await this.sleep(ids.length > 1 ? 900 : 600);
          break;
        }
        case "riot":
          this.focusCity(e.city);
          this.overlays.syncCity(after);
          this.showEventCard(iconUrl("epidemic"), "失控！", `${name(e.city)}的恐慌满了，城市失控：每轮多派 1 个携带者，在这里行动多花 1 点。`);
          await this.sleep(1900);
          break;
        case "calm":
          this.hud.toast(`${name(e.city)}恢复了秩序`);
          await this.sleep(700);
          break;
        case "news": {
          this.overlays.syncCity(after);
          if (e.id === "calm") {
            this.hud.toast("本轮没有新闻");
            await this.sleep(700);
            break;
          }
          const n = NEWS_INFO[e.id];
          this.showEventCard(iconUrl("epidemic"), `新闻：${n.name}`, n.text);
          await this.sleep(2000);
          break;
        }
        case "lose":
          break;
      }
    }
  }

  private showEventCard(icon: string, title: string, detail: string): void {
    const card = el("epi-card");
    card.querySelector("img")!.src = icon;
    card.querySelector("b")!.textContent = title;
    el("epi-detail").textContent = detail;
    card.classList.remove("show");
    void card.offsetWidth;
    card.classList.add("show");
  }

  private async gameOver(): Promise<void> {
    const s = this.state;
    if (!s) return;
    this.closeMenus();
    const choice = await this.report.show(s, this.portraits);
    if (choice === "again") this.newGame([s.roles[0], s.roles[1]]);
    else {
      this.play(0);
      if (choice === "draft") this.draft.open();
    }
  }

  skipIntro(): void {
    this.anim = null;
    this.progress = 1;
    this.mode = "game";
    document.body.classList.remove("in-menu");
    this.applyTimeline(1);
    this.focusActive(this.rig.target);
  }

  private play(to: 0 | 1): void {
    this.anim = { from: this.progress, to, start: performance.now() };
    this.mode = "transition";
    document.body.classList.toggle("in-menu", to === 0);
    if (to === 1) this.focusActive(this.rig.target);
  }

  private focusActive(out: THREE.Vector3): boolean {
    const st = this.active ? this.board.standeeOf(this.active) : undefined;
    if (!st) return false;
    this.rig.focusOn(st.outer.position, out);
    return true;
  }

  private applyTimeline(p: number): void {
    this.fold.setFold(easeInOut(seg(p, 0.12, 0.36)), easeInOut(seg(p, 0.32, 0.56)));
    this.board.setReveal(p);
    this.overlays.setVisible(!!this.state && p > 0.75);
    document.body.classList.toggle("playing", p > 0.82 && !document.body.classList.contains("in-menu"));
  }

  private resize(): void {
    const { renderer, camera } = this.stage;
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    const layout = this.props.layout(camera.aspect < 0.85);
    const menu = el("menu");
    this.rig.frameMenu(layout.rect, menu.offsetHeight + innerHeight * 0.07 + 16);
    this.relayout();
  }

  private relayout(): void {
    const top = el("ap-punches").closest<HTMLElement>(".top")!;
    const side = this.hud.teamCards;
    const bottom = side.childElementCount ? side.offsetTop : innerHeight - 180;
    this.rig.frameGame({ top: top.offsetTop + top.offsetHeight, bottom });
    document.body.style.setProperty("--side-h", `${innerHeight - bottom + 12}px`);
    document.body.style.setProperty("--top-h", `${top.offsetTop + top.offsetHeight + 10}px`);
  }

  private fitShadows(): void {
    const { sun } = this.stage;
    const p = this.progress;
    const extent = 27 * SHEET_SCALE + (22 - 27 * SHEET_SCALE) * p;
    sun.target.position.copy(this.rig.target).multiplyScalar(p);
    sun.position.copy(sun.target.position).add(SUN_OFFSET);
    const cam = sun.shadow.camera;
    if (cam.right !== extent) {
      Object.assign(cam, { left: -extent, right: extent, top: extent, bottom: -extent });
      cam.updateProjectionMatrix();
    }
  }

  private tick(now: number): void {
    if (this.anim) {
      const span = TRANSITION_MS * Math.abs(this.anim.to - this.anim.from) || 1;
      const k = clamp01((now - this.anim.start) / span);
      this.progress = this.anim.from + (this.anim.to - this.anim.from) * k;
      if (k >= 1) {
        this.progress = this.anim.to;
        this.mode = this.anim.to === 1 ? "game" : "menu";
        this.anim = null;
      }
      this.applyTimeline(this.progress);
    }
    if (this.mode !== "menu" && this.rig.following && this.focusActive(this.focusGoal)) {
      this.rig.target.lerp(this.focusGoal, this.mode === "game" ? 0.06 : 1);
    } else if (this.cameraGoal) {
      this.rig.target.lerp(this.cameraGoal, 0.08);
    }
    this.rig.place(this.progress, now / 1000);
    this.fitShadows();
    this.menu.position(this.stage.camera);
    this.cityCard.position(this.stage.camera);
    this.calendar.update(now);
    this.board.update(now, this.stage.camera, this.state?.roles ?? []);
    this.overlays.update(now, this.stage.camera);
    this.stage.renderer.render(this.stage.scene, this.stage.camera);
    requestAnimationFrame((t) => this.tick(t));
  }
}
