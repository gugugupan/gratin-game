import type { Action, GameEvent, Pending } from "../../../engine/game.js";
import type { Coach } from "../ui/coach";
import { MUTATION_NOTE, NOTES, PARTS, STEPS, type Note, type Step, type TutorialHost } from "./steps";

export class Tutorial {
  private index = -1;
  private seen = new Set<Note>();
  private mutationShown = false;

  constructor(private host: TutorialHost, private coach: Coach) {}

  private get step(): Step | undefined {
    return STEPS[this.index];
  }

  start(): void {
    PARTS.forEach((p) => this.host.reveal(p, false));
    this.go(0);
  }

  stop(): void {
    this.index = STEPS.length;
    this.coach.hide();
    PARTS.forEach((p) => this.host.reveal(p, true));
  }

  private go(i: number): void {
    this.index = i;
    const step = this.step;
    if (!step) {
      this.coach.hide();
      this.host.finish();
      return;
    }
    step.reveal?.forEach((p) => this.host.reveal(p, true));
    step.enter?.(this.host);
    void this.coach
      .show({ step: `教程 ${i + 1} / ${STEPS.length}`, title: step.title, text: step.text, button: step.button, focus: step.focus, anchor: step.anchor })
      .then(() => {
        if (this.index === i) this.go(i + 1);
      });
  }

  private advance(): void {
    this.go(this.index + 1);
  }

  allows(a: Action): boolean {
    const s = this.host.state;
    return !!s && !!this.step?.allow?.(a, s);
  }

  get canEndTurn(): boolean {
    return !!this.step?.endTurn;
  }

  get canUndo(): boolean {
    return !!this.step?.undo;
  }

  afterAction(): void {
    const s = this.host.state;
    if (s && this.step?.done?.(s)) this.advance();
  }

  afterUndo(): void {
    if (this.step?.on === "undo") this.advance();
  }

  onPan(): void {
    if (this.step?.on === "pan") this.advance();
  }

  onInfectionStart(): void {
    this.coach.hide();
  }

  async onEvent(e: GameEvent): Promise<void> {
    const note = NOTES.find((n) => !this.seen.has(n) && n.match(e));
    if (!note) return;
    this.seen.add(note);
    note.reveal?.forEach((p) => this.host.reveal(p, true));
    await this.coach.show({ step: "感染阶段", title: note.title, text: note.text(e), button: "继续", focus: note.focus, anchor: note.anchor?.(e) });
    this.coach.hide();
  }

  async onPending(p: Pending): Promise<void> {
    if (p.kind !== "mutation" || this.mutationShown) return;
    this.mutationShown = true;
    await this.coach.show({ step: "感染阶段", title: MUTATION_NOTE.title, text: MUTATION_NOTE.text, button: "去选择" });
    this.coach.hide();
  }

  afterRound(): void {
    if (this.step?.on === "round") this.advance();
  }
}
