import type { RoleId } from "../../../engine/game.js";
import { el } from "../util";

export type Anchor = { el: string } | { role: RoleId } | { city: number };

export interface CoachCard {
  step: string;
  title: string;
  text: string;
  button?: string;
  focus?: string;
  anchor?: Anchor;
}

export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type Side = "left" | "right" | "below" | "above";

const GAP = 18;
const MARGIN = 12;

export class Coach {
  private root = el("coach");
  private stepEl = el("coach-step");
  private titleEl = el("coach-title");
  private textEl = el("coach-text");
  private next = el<HTMLButtonElement>("coach-next");
  private resolve: (() => void) | null = null;
  private focused: Element[] = [];
  private side: Side | null = null;
  anchor: Anchor | undefined;

  constructor() {
    this.next.addEventListener("click", () => {
      const r = this.resolve;
      this.resolve = null;
      r?.();
    });
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  show(card: CoachCard): Promise<void> {
    this.resolve = null;
    this.anchor = card.anchor;
    this.side = null;
    this.stepEl.textContent = card.step;
    this.titleEl.textContent = card.title;
    this.textEl.innerHTML = card.text;
    this.next.hidden = !card.button;
    this.next.textContent = card.button ?? "";
    this.setFocus(card.focus);
    this.root.hidden = false;
    this.root.classList.remove("in");
    void this.root.offsetWidth;
    this.root.classList.add("in");
    if (card.button) requestAnimationFrame(() => this.next.focus({ preventScroll: true }));
    return new Promise((res) => { this.resolve = res; });
  }

  hide(): void {
    this.resolve = null;
    this.anchor = undefined;
    this.root.hidden = true;
    this.setFocus();
  }

  place(target: Rect | null, safe: Rect, avoid: Rect[]): void {
    if (this.root.hidden) return;
    const w = this.root.offsetWidth, h = this.root.offsetHeight;
    let pos: [number, number] | null = null;
    if (target) {
      const tx = (target.left + target.right) / 2, ty = (target.top + target.bottom) / 2;
      const spots: Record<Side, [number, number]> = {
        left: [target.left - GAP - w, ty - h / 2],
        right: [target.right + GAP, ty - h / 2],
        below: [tx - w / 2, target.bottom + GAP],
        above: [tx - w / 2, target.top - GAP - h],
      };
      const cost = (side: Side): [number, [number, number]] => {
        const [x, y] = clampInto(spots[side], w, h, safe);
        const box = { left: x, top: y, right: x + w, bottom: y + h };
        return [overlap(box, target) * 4 + avoid.reduce((n, a) => n + overlap(box, a), 0), [x, y]];
      };
      const order: Side[] = this.side ? [this.side, "left", "right", "below", "above"] : ["left", "right", "below", "above"];
      let best = Infinity;
      for (const side of order) {
        const [c, p] = cost(side);
        if (c < best - 1) {
          best = c;
          pos = p;
          this.side = side;
        }
        if (c < 1) break;
      }
    }
    if (!pos) {
      this.side = null;
      pos = clampInto([(safe.left + safe.right - w) / 2, (safe.top + safe.bottom - h) / 2], w, h, safe);
    }
    this.root.style.left = `${Math.round(pos[0])}px`;
    this.root.style.top = `${Math.round(pos[1])}px`;
  }

  private setFocus(selector?: string): void {
    this.focused.forEach((n) => n.classList.remove("tut-focus"));
    this.focused = selector ? [...document.querySelectorAll(selector)] : [];
    this.focused.forEach((n) => n.classList.add("tut-focus"));
  }
}

function clampInto([x, y]: [number, number], w: number, h: number, safe: Rect): [number, number] {
  return [
    Math.max(safe.left + MARGIN, Math.min(safe.right - MARGIN - w, x)),
    Math.max(safe.top + MARGIN, Math.min(safe.bottom - MARGIN - h, y)),
  ];
}

function overlap(a: Rect, b: Rect): number {
  const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return x > 0 && y > 0 ? x * y : 0;
}
