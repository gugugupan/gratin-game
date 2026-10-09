import { el } from "../util";

export interface DialogButton {
  id: string;
  label: string;
  primary?: boolean;
  html?: string;
}

export class Dialog {
  private root = el("dialog");
  private titleEl = el("dialog-title");
  private bodyEl = el("dialog-body");
  private actions = el("dialog-actions");
  private resolve: ((id: string) => void) | null = null;
  private cancelId: string | null = null;

  constructor() {
    this.actions.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-id]");
      if (b) this.finish(b.dataset.id!);
    });
    this.bodyEl.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>("[data-id]");
      if (b) this.finish(b.dataset.id!);
    });
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen && this.cancelId) this.finish(this.cancelId);
    });
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  show(opts: { title: string; body?: string; choices?: DialogButton[]; buttons?: DialogButton[]; cancel?: string; wide?: boolean }): Promise<string> {
    this.titleEl.textContent = opts.title;
    this.bodyEl.innerHTML = opts.body ?? "";
    if (opts.choices?.length) {
      const list = document.createElement("div");
      list.className = opts.wide ? "dialog-choices wide" : "dialog-choices";
      opts.choices.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "choice-card";
        b.dataset.id = c.id;
        b.innerHTML = c.html ?? c.label;
        list.append(b);
      });
      this.bodyEl.append(list);
    }
    this.actions.innerHTML = "";
    (opts.buttons ?? []).forEach((btn) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.id = btn.id;
      b.className = btn.primary ? "stamp-btn" : "text-btn dark";
      b.textContent = btn.label;
      this.actions.append(b);
    });
    this.cancelId = opts.cancel ?? null;
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.querySelector<HTMLElement>(".stamp-btn, .choice-card")?.focus({ preventScroll: true }));
    return new Promise((res) => { this.resolve = res; });
  }

  private finish(id: string): void {
    this.root.hidden = true;
    const r = this.resolve;
    this.resolve = null;
    r?.(id);
  }
}
