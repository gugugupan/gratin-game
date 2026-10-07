import * as THREE from "three";
import { DEFAULT_CONFIG, State, type Action, type GameEvent, type Pending, type RoleId } from "../../engine/game.js";
import { CITIES } from "../../engine/map.js";
import { cityWorld, SHEET_SCALE } from "./art/mapArt";
import { iconUrl } from "./art/assets";
import { fontsReady, type Assets } from "./art/assets";
import { Board } from "./scene/board";
import { Calendar } from "./scene/calendar";
import { CameraRig } from "./scene/cameraRig";
import { FoldMap } from "./scene/foldMap";
import { DeskProps } from "./scene/props";
import { createStage, type Stage } from "./scene/stage";
import { describe, entriesFor, type MenuEntry } from "./game/actions";
import { ActionMenu } from "./ui/actionMenu";
import { Dialog } from "./ui/dialog";
import { clearSave, loadGame, markTutorialSeen, saveGame, tutorialSeen } from "./game/save";
import { tutorialState } from "../../engine/tutorial.js";
import { Coach, type Anchor, type Rect } from "./ui/coach";
import { CityCard } from "./ui/cityCard";
import { Tutorial } from "./tutorial/tutorial";
import type { Part, TutorialHost } from "./tutorial/steps";
import { Draft } from "./ui/draft";
import { Report } from "./ui/report";
import { Rules } from "./ui/rules";
import { Hud } from "./ui/hud";
import { CITY_NAMES, MUTATION_INFO, ROLE_INFO, STRAIN_CSS, STRAIN_SHORT } from "./data";
import { clamp01, easeInOut, el, reduceMotion, seg } from "./util";

type Mode = "menu" | "transition" | "game";
const SUN_OFFSET = new THREE.Vector3(-12, 26, 16);

const PART_SELECTOR: Record<string, string> = {
  ap: ".hud .ap",
  track: ".hud .track",
  cures: ".hud .cures",
  drawn: ".hud .drawn",
  help: "#help",
  team: "#team-cards",
  end: "#end-turn",
  undo: "#undo",
};
const TRANSITION_MS = reduceMotion ? 1 : 3600;

export class App {
  readonly stage: Stage;
  private fold: FoldMap;
  private props: DeskProps;
  private calendar: Calendar;
  readonly board: Board;
  private rig: CameraRig;
  readonly hud = new Hud();
  private draft: Draft;
  private menu: ActionMenu;
  private dialog = new Dialog();
  private report = new Report();
  private rules = new Rules();
  private coach = new Coach();
  private cityCard = new CityCard();
  private tutorial: Tutorial | null = null;
  private portraits: Record<RoleId, string>;
  private history: State[] = [];
  private targeting: { role: RoleId; entry: MenuEntry } | null = null;
  private busy = false;
  private speed = 1;
  private cameraGoal: THREE.Vector3 | null = null;
  private infecting: number[] = [];

  state: State | null = null;
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
    this.board.addStatic(this.calendar.group, 0.7, "calendar");
    this.rig = new CameraRig(camera);
    this.portraits = Object.fromEntries(Object.entries(assets.roleImages).map(([k, img]) => [k, img.src])) as Record<RoleId, string>;
    this.draft = new Draft(this.portraits, (roles) => this.newGame(roles));
    this.menu = new ActionMenu((entry) => this.pickEntry(entry));
    this.calendar.show({ round: 1, rounds: DEFAULT_CONFIG.rounds, epidemics: 0, epidemicsTotal: DEFAULT_CONFIG.epidemics, rate: DEFAULT_CONFIG.infectionRate[0] }, false);

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
    el("start-game").addEventListener("click", () => void this.startGame());
    el("start-tutorial").addEventListener("click", () => this.startTutorial());
    el("continue-game").addEventListener("click", () => this.continueGame());
    el("open-rules").addEventListener("click", () => this.rules.open());
    el("help").addEventListener("click", () => this.rules.open());
    this.updateContinue();
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
      this.tutorial?.onPan();
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
          const city = this.board.pickCity(this.raycaster);
          const target = city === null ? undefined : this.targeting.entry.targets?.find((t) => t.city === city);
          if (target) {
            this.stopTargeting();
            this.perform(target.action);
          } else this.hud.toast("请点选高亮的城市");
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
      this.hud.toast("感染结算中，结束后再返回");
      return;
    }
    const choice = await this.dialog.show(this.tutorial
      ? { title: "退出教程？", body: "退出后回到菜单，下次可以从「新手教程」重新开始。", buttons: [{ id: "stay", label: "继续教程" }, { id: "leave", label: "退出教程", primary: true }], cancel: "stay" }
      : { title: "返回菜单？", body: "进度已经自动保存，可以从「继续上局」接着玩。", buttons: [{ id: "stay", label: "继续游戏" }, { id: "leave", label: "返回菜单", primary: true }], cancel: "stay" });
    if (choice !== "leave") return;
    this.closeMenus();
    this.stopTutorial();
    this.updateContinue();
    this.play(0);
  }

  private async startGame(): Promise<void> {
    if (!tutorialSeen()) {
      const choice = await this.dialog.show({
        title: "第一次玩？",
        body: "推荐先玩一遍新手教程，大约 5 分钟，带你一步步走完一轮完整的防疫。",
        buttons: [{ id: "skip", label: "直接开始" }, { id: "tutorial", label: "玩教程", primary: true }],
        cancel: "close",
      });
      if (choice === "close") return;
      markTutorialSeen();
      if (choice === "tutorial") return this.startTutorial();
    }
    this.draft.open();
  }

  private startTutorial(): void {
    markTutorialSeen();
    this.stopTutorial();
    const state = tutorialState();
    this.state = state;
    this.active = state.roles[0];
    this.history = [];
    this.busy = false;
    this.closeMenus();
    this.board.reset([...state.roles]);
    document.body.classList.add("tutorial");
    this.tutorial = new Tutorial(this.tutorialHost(), this.coach);
    this.tutorial.start();
    this.refresh(false);
    this.play(1);
  }

  private stopTutorial(): void {
    if (!this.tutorial) return;
    this.tutorial.stop();
    this.tutorial = null;
    document.body.classList.remove("tutorial");
  }

  private tutorialHost(): TutorialHost {
    const app = this;
    return {
      get state() { return app.state; },
      reveal: (part, on) => this.revealPart(part, on),
      follow: (role) => this.select(role),
      focusCity: (city) => this.focusCity(city),
      clearHistory: () => {
        this.history = [];
        this.refresh(false);
      },
      finish: () => void this.finishTutorial(),
    };
  }

  private revealPart(part: Part, on: boolean): void {
    switch (part) {
      case "cube":
      case "pin":
      case "calendar":
      case "station":
        this.board.setGroupHidden(part, !on);
        return;
      case "researcher":
        this.board.setRoleHidden("researcher", !on);
        if (on) this.hud.hiddenRoles.delete("researcher");
        else this.hud.hiddenRoles.add("researcher");
        this.refresh(false);
        return;
    }
    const body = document.body.classList;
    if (body.contains(`tut-off-${part}`) === !on) return;
    body.toggle(`tut-off-${part}`, !on);
    if (!on) return;
    const node = document.querySelector<HTMLElement>(PART_SELECTOR[part]);
    node?.classList.remove("tut-pop");
    void node?.offsetWidth;
    node?.classList.add("tut-pop");
  }

  private async finishTutorial(): Promise<void> {
    const choice = await this.dialog.show({
      title: "教程完成",
      body: `<span class="tut-stamp">结业</span><p class="tut-done">移动、治疗、交接、研制、撤销，还有感染、爆发、流行病和变异，你都已经见过了。正式游戏里，自己选 2 名队员出发吧。</p>`,
      buttons: [{ id: "menu", label: "回到菜单" }, { id: "play", label: "开始正式游戏", primary: true }],
      cancel: "menu",
    });
    this.closeMenus();
    this.stopTutorial();
    this.updateContinue();
    this.play(0);
    if (choice === "play") this.draft.open();
  }

  newGame(roles: [RoleId, RoleId], seed = Math.floor(Math.random() * 2 ** 31)): void {
    this.stopTutorial();
    const state = new State(DEFAULT_CONFIG, roles, seed);
    state.setup();
    this.state = state;
    this.active = roles[0];
    this.history = [];
    this.busy = false;
    this.closeMenus();
    this.board.reset(roles);
    this.refresh(false);
    saveGame(state);
    this.play(1);
  }

  private continueGame(): void {
    this.stopTutorial();
    const state = loadGame();
    if (!state) {
      this.updateContinue();
      return;
    }
    this.state = state;
    this.active = state.roles[0];
    this.history = [];
    this.busy = false;
    this.closeMenus();
    this.board.reset([...state.roles]);
    this.refresh(false);
    this.play(1);
  }

  private updateContinue(): void {
    const saved = loadGame();
    const btn = el<HTMLButtonElement>("continue-game");
    btn.disabled = !saved;
    el("continue-note").textContent = saved
      ? `第 ${saved.round} 轮 · ${saved.roles.map((r) => ROLE_INFO[r].name).join(" + ")}`
      : "暂无存档";
  }

  refresh(animate: boolean): void {
    const s = this.state;
    if (!s) return;
    this.board.sync(s, animate);
    this.hud.render(s, this.portraits, this.active);
    this.cityCard.update(s);
    this.relayout();
    el<HTMLButtonElement>("undo").disabled = this.history.length === 0 || (!!this.tutorial && !this.tutorial.canUndo);
    el("end-turn").classList.toggle("ready", s.status === "playing" && s.apLeft(0) <= 0);
    document.body.classList.toggle("busy", this.busy);
    el("fast").hidden = !this.busy;
    this.calendar.show({
      round: s.round,
      rounds: s.cfg.rounds,
      epidemics: s.epidemicsDone,
      epidemicsTotal: s.cfg.epidemics,
      rate: s.infectionRate(),
    }, animate);
  }

  select(role: RoleId, openMenu = false): void {
    if (this.board.isRoleHidden(role)) return;
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
    let entries = entriesFor(s, r);
    const tut = this.tutorial;
    if (tut) {
      entries = entries
        .map((e) => {
          if (!e.targets) return e;
          const targets = e.targets.filter((t) => tut.allows(t.action));
          return { ...e, targets, note: targets.length === 1 ? `前往${CITY_NAMES[targets[0].city]}` : e.note };
        })
        .filter((e) => (e.action ? tut.allows(e.action) && !e.disabled : !!e.targets?.length));
      if (!entries.length) {
        this.menu.close();
        this.hud.toast("先按教程提示操作");
        return;
      }
    }
    this.menu.open(ROLE_INFO[role].name, entries, st.outer);
  }

  private closeMenus(): void {
    this.menu.close();
    this.cityCard.close();
    this.stopTargeting();
  }

  private pickEntry(entry: MenuEntry): void {
    this.menu.close();
    if (!this.canAct() || entry.disabled) return;
    if (entry.kind === "apply" && entry.action) this.perform(entry.action);
    else if (entry.kind === "target") this.startTargeting(entry);
    else if (entry.kind === "forecast") void this.forecast();
  }

  private startTargeting(entry: MenuEntry): void {
    if (!this.active || !entry.targets?.length) return;
    this.targeting = { role: this.active, entry };
    this.board.highlight(entry.targets.map((t) => t.city));
    el("target-text").textContent = `${entry.label}：点选高亮的城市`;
    el("target-hint").hidden = false;
  }

  private stopTargeting(): void {
    if (!this.targeting) return;
    this.targeting = null;
    this.board.highlight([]);
    el("target-hint").hidden = true;
  }

  private perform(action: Action, snapshot = true): void {
    const s = this.state;
    if (!s || !this.canAct()) return;
    const text = describe(s, action);
    if (snapshot) this.history.push(s.clone(true));
    s.apply(action);
    this.tutorial?.afterAction();
    this.refresh(true);
    this.save();
    if (text) this.hud.toast(text);
    if (s.status === "won") void this.gameOver();
  }

  private undo(): void {
    if (!this.canAct() || !this.history.length) return;
    if (this.tutorial && !this.tutorial.canUndo) return;
    this.closeMenus();
    this.state = this.history.pop()!;
    this.tutorial?.afterUndo();
    this.refresh(true);
    this.save();
    this.hud.toast("已撤销上一步");
  }

  private async forecast(): Promise<void> {
    const s = this.state;
    if (!s || !this.active) return;
    const r = s.roles.indexOf(this.active);
    this.history = [];
    const top = s.deck.slice(0, Math.min(3, s.deck.length));
    const pickId = await this.dialog.show({
      title: "预判感染：接下来的 3 座城市",
      body: "这是接下来最先被感染的城市。选 1 座移到牌库倒数第二张（翻开后不能撤销）。",
      choices: top.map((city, i) => ({
        id: String(i),
        label: CITY_NAMES[city],
        html: `<b style="color: var(${STRAIN_CSS[Math.floor(city / 6)]})">${CITY_NAMES[city]}</b><small>现有病毒 ${s.cube(city, Math.floor(city / 6))} 个</small>`,
      })),
    });
    this.perform({ t: "forecast", r, bury: Number(pickId) }, false);
  }

  async endTurn(skipConfirm = false): Promise<void> {
    const s = this.state;
    if (!s || !this.canAct()) return;
    if (this.tutorial && !this.tutorial.canEndTurn) {
      this.hud.toast("先按教程提示操作");
      return;
    }
    this.closeMenus();
    const left = s.apLeft(0);
    if (left > 0 && !skipConfirm) {
      const choice = await this.dialog.show({
        title: "结束行动？",
        body: `还剩 ${left} 个行动点没有用。结束后进入感染阶段，之前的行动就不能撤销了。`,
        buttons: [{ id: "no", label: "继续行动" }, { id: "yes", label: "结束行动", primary: true }],
        cancel: "no",
      });
      if (choice !== "yes") return;
    }
    this.history = [];
    this.tutorial?.onInfectionStart();
    this.busy = true;
    this.speed = reduceMotion ? 5 : 1;
    this.refresh(false);
    const view = { cubes: s.cubes.slice(), outbreaks: s.outbreaks };
    s.events = [];
    s.beginInfection();
    for (;;) {
      const pending = s.continueInfection();
      await this.playEvents(s.events.splice(0), view);
      if (!pending) break;
      await this.resolvePending(pending);
    }
    s.events = null;
    this.busy = false;
    this.cameraGoal = null;
    this.rig.following = true;
    this.refresh(true);
    this.save();
    if (s.status !== "playing") {
      await this.sleep(500);
      void this.gameOver();
      return;
    }
    this.hud.toast(`第 ${s.round} 轮 · 开始行动`);
    this.tutorial?.afterRound();
  }

  private save(): void {
    if (this.state && !this.tutorial) saveGame(this.state);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms / this.speed));
  }

  private focusCity(city: number): void {
    this.rig.following = false;
    this.cameraGoal = this.rig.focusOn(cityWorld(city), new THREE.Vector3());
  }

  private async playEvents(events: GameEvent[], view: { cubes: Int8Array; outbreaks: number }): Promise<void> {
    const s = this.state!;
    const name = (c: number) => CITY_NAMES[c];
    const strainName = (k: number) => `${STRAIN_SHORT[k]}株`;
    const infecting = this.infecting;
    for (const e of events) {
      switch (e.t) {
        case "epidemic": {
          el("epi-detail").textContent = `第 ${e.count} 次流行病：牌库最底的${name(e.city)}一次放 3 个病毒，随后弃牌堆洗回牌库顶。`;
          const card = el("epi-card");
          card.classList.remove("show");
          void card.offsetWidth;
          card.classList.add("show");
          await this.sleep(1700);
          this.focusCity(e.city);
          await this.sleep(500);
          break;
        }
        case "cube":
          view.cubes[e.city * 3 + e.s]++;
          this.focusCity(e.city);
          this.board.setCubes((c, k) => view.cubes[c * 3 + k], true);
          await this.sleep(360);
          break;
        case "outbreak":
          view.outbreaks = e.total;
          this.focusCity(e.city);
          this.board.triggerOutbreak(e.city);
          this.hud.showOutbreaks(e.total, s.cfg.outbreakLimit, true);
          this.hud.toast(`${name(e.city)}爆发！病毒向邻近城市扩散（${e.total}/${s.cfg.outbreakLimit}）`);
          await this.sleep(900);
          break;
        case "blocked":
          this.focusCity(e.city);
          this.hud.toast(`封城拦下了${name(e.city)}的${strainName(e.s)}${e.sample ? " · 警察获得 1 个样本" : ""}`);
          await this.sleep(700);
          break;
        case "shielded":
          this.hud.toast(`封城挡住了扩散到${name(e.city)}的病毒`);
          await this.sleep(450);
          break;
        case "guarded":
          this.hud.toast(`急救队员守住了${name(e.city)}`);
          await this.sleep(500);
          break;
        case "intensify":
          this.hud.toast("弃牌堆洗回牌库顶：最近感染过的城市很快会再被感染");
          await this.sleep(1300);
          break;
        case "mutation":
          this.hud.toast(`${strainName(e.strain)}发生变异：${MUTATION_INFO[e.m].name}（${MUTATION_INFO[e.m].text}）`);
          await this.sleep(1100);
          break;
        case "named":
          infecting.length = 0;
          this.board.showNamed([], true);
          this.hud.showStubs([], "本轮感染");
          this.hud.toast(`本轮感染 ${e.cities.length} 座城市`);
          await this.sleep(900);
          break;
        case "infecting":
          infecting.push(e.city);
          this.focusCity(e.city);
          await this.sleep(650);
          this.board.showNamed(infecting, true);
          this.hud.showStubs(infecting, "本轮感染");
          this.hud.toast(`感染城市：${name(e.city)}`);
          await this.sleep(550);
          break;
        case "cancelled":
          this.hud.toast(`取消感染：${name(e.city)}`);
          await this.sleep(700);
          break;
        case "labExpired":
          this.hud.toast(`${name(e.city)}的野战实验室撤除了`);
          await this.sleep(500);
          break;
        case "round":
        case "lose":
          break;
      }
      if (this.tutorial) await this.tutorial.onEvent(e);
    }
  }

  private async resolvePending(p: Pending): Promise<void> {
    const s = this.state!;
    await this.tutorial?.onPending(p);
    if (p.kind === "mutation") {
      const choices = p.cards.flatMap((m, card) =>
        p.targets.map((strain) => ({
          id: `${card}:${strain}`,
          label: `${MUTATION_INFO[m].name} → ${STRAIN_SHORT[strain]}株`,
          html: `<span class="mut"><img src="${iconUrl(MUTATION_INFO[m].icon)}" alt=""><span><b>${MUTATION_INFO[m].name} → <span style="color: var(${STRAIN_CSS[strain]})">${STRAIN_SHORT[strain]}株</span></b><small>${MUTATION_INFO[m].text} · 场上 ${CITIES.reduce((n, c) => n + s.cube(c.id, strain), 0)} 个</small></span></span>`,
        })),
      );
      const id = await this.dialog.show({
        title: "变异：选 1 张交给 1 株病毒",
        body: "翻出了 2 张变异卡。选 1 张交给一株还没研制出解药的病毒，另一张放回牌库底。",
        choices,
        wide: true,
      });
      const [card, strain] = id.split(":").map(Number);
      s.resolveMutation({ card, strain });
      this.hud.render(s, this.portraits, this.active);
      return;
    }
    const id = await this.dialog.show({
      title: "卫生官：取消 1 座感染城市",
      body: "这 3 座城市将被感染。选 1 座取消，它这轮不放病毒。",
      choices: p.cities.map((city, i) => ({
        id: String(i),
        label: CITY_NAMES[city],
        html: `<b style="color: var(${STRAIN_CSS[Math.floor(city / 6)]})">${CITY_NAMES[city]}</b><small>现有病毒 ${s.cube(city, Math.floor(city / 6))} 个</small>`,
      })),
    });
    s.resolveCancel(Number(id));
  }

  private async gameOver(): Promise<void> {
    const s = this.state;
    if (!s) return;
    this.closeMenus();
    clearSave();
    this.updateContinue();
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

  private placeCoach(): void {
    const target = this.anchorRect(this.coach.anchor);
    const rectOf = (node: Element | null): Rect | null => {
      if (!node || (node as HTMLElement).offsetParent === null) return null;
      const r = node.getBoundingClientRect();
      return r.width && r.height ? r : null;
    };
    const top = rectOf(document.querySelector(".hud .top"));
    const cards = rectOf(this.hud.teamCards);
    const avoid = [top, cards, rectOf(el("turn-ctrl")), this.menu.isOpen ? rectOf(el("act-menu")) : null]
      .filter((r): r is Rect => !!r && !(target && overlaps(r, target)));
    const safe = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    if (!target) {
      safe.top = top ? top.bottom : 0;
      safe.bottom = cards ? cards.top : innerHeight;
    }
    this.coach.place(target, safe, avoid);
  }

  private anchorRect(anchor: Anchor | undefined): Rect | null {
    if (!anchor) return null;
    if ("el" in anchor) {
      const r = document.querySelector(anchor.el)?.getBoundingClientRect();
      return r && r.width ? r : null;
    }
    const camera = this.stage.camera;
    const toPx = (v: THREE.Vector3): [number, number] => [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight];
    if ("role" in anchor) {
      const st = this.board.standeeOf(anchor.role);
      if (!st) return null;
      const [x0, y0] = toPx(st.outer.position.clone().project(camera));
      const [, y1] = toPx(st.outer.position.clone().setY(3.7).project(camera));
      const half = (y0 - y1) * 0.3;
      return { left: x0 - half, right: x0 + half, top: y1, bottom: y0 };
    }
    const [x, y] = toPx(cityWorld(anchor.city).project(camera));
    return { left: x - 70, right: x + 70, top: y - 70, bottom: y + 50 };
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
    if (this.coach.isOpen) this.placeCoach();
    this.calendar.update(now);
    this.board.update(now, this.stage.camera, this.state?.roles ?? []);
    this.stage.renderer.render(this.stage.scene, this.stage.camera);
    requestAnimationFrame((t) => this.tick(t));
  }
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}
