import * as THREE from "three";
import type { MenuEntry } from "../game/actions";
import { el } from "../util";

export class ActionMenu {
  private root = el("act-menu");
  private anchor: THREE.Object3D | null = null;
  private tmpA = new THREE.Vector3();
  private tmpB = new THREE.Vector3();

  constructor(private onPick: (entry: MenuEntry) => void) {}

  get isOpen(): boolean {
    return this.anchor !== null;
  }

  open(title: string, entries: MenuEntry[], anchor: THREE.Object3D): void {
    this.anchor = anchor;
    this.root.classList.remove("open");
    this.root.innerHTML = `<h3>${title} · 选择行动</h3>`;
    entries.forEach((entry, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "act";
      b.setAttribute("role", "menuitem");
      b.style.setProperty("--d", `${k * 0.03}s`);
      b.disabled = !!entry.disabled;
      const sub = entry.disabled ?? entry.note ?? "";
      const holes = entry.cost ? "<i></i>".repeat(entry.cost) : `<b class="free">免费</b>`;
      b.innerHTML = `<span>${entry.label}${sub ? `<small>${sub}</small>` : ""}</span><span class="holes" aria-label="${entry.cost} 点">${holes}</span>`;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        b.classList.add("picked");
        setTimeout(() => this.onPick(entry), 140);
      });
      this.root.append(b);
    });
    requestAnimationFrame(() => {
      this.root.classList.add("open");
      this.root.querySelector<HTMLElement>(".act:not(:disabled)")?.focus({ preventScroll: true });
    });
  }

  close(): void {
    this.root.classList.remove("open");
    this.anchor = null;
  }

  position(camera: THREE.Camera): void {
    if (!this.anchor) return;
    const p = this.anchor.position;
    const side = this.tmpA.set(p.x + 0.9, p.y + 1.6, p.z).project(camera);
    const mid = this.tmpB.set(p.x, p.y + 1.6, p.z).project(camera);
    const toPx = (v: THREE.Vector3) => [((v.x + 1) / 2) * innerWidth, ((1 - v.y) / 2) * innerHeight];
    const [mx, my] = toPx(mid);
    const [sx] = toPx(side);
    const gap = Math.max(24, sx - mx) + 14;
    const w = this.root.offsetWidth, h = this.root.offsetHeight;
    let left = mx + gap;
    const flip = left + w > innerWidth - 16;
    if (flip) left = mx - gap - w;
    left = Math.max(16, Math.min(innerWidth - 16 - w, left));
    const topLimit = document.querySelector(".top")!.getBoundingClientRect().bottom + 8;
    const bottomLimit = el("team-cards").getBoundingClientRect().top - 8;
    const top = Math.max(topLimit, Math.min(bottomLimit - h, my - h / 2));
    this.root.classList.toggle("flip", flip);
    this.root.style.transform = `translate(${left}px, ${top}px)`;
    this.root.style.setProperty("--arrow-y", `${Math.max(18, Math.min(h - 18, my - top))}px`);
  }
}
