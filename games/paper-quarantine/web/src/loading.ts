import { el } from "./util";

export class Loading {
  private root = el("loading");
  private bar = el("loading-bar");
  private text = el("loading-text");
  private done = 0;

  constructor(private total: number) {}

  say(text: string): void {
    this.text.textContent = text;
  }

  track<T>(work: Promise<T>, weight = 1): Promise<T> {
    return work.then((value) => {
      this.advance(weight);
      return value;
    });
  }

  advance(weight = 1): void {
    this.done = Math.min(this.total, this.done + weight);
    this.bar.style.width = `${Math.round((this.done / this.total) * 100)}%`;
  }

  finish(): void {
    this.bar.style.width = "100%";
    this.root.classList.add("done");
    this.root.addEventListener("transitionend", () => this.root.remove(), { once: true });
    setTimeout(() => this.root.remove(), 1200);
  }

  fail(message: string): void {
    this.root.classList.add("failed");
    this.say(message);
  }
}

export const nextFrame = (): Promise<void> =>
  new Promise((res) => {
    requestAnimationFrame(() => setTimeout(res, 0));
    setTimeout(res, 80);
  });
