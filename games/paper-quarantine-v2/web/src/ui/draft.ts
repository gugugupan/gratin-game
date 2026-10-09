import type { RoleId } from "../../../engine/roles.js";
import { ROLE_ORDER } from "../data";
import { tr } from "../i18n/locale";
import { el } from "../util";

const DRAFT = tr({
  zh: { count: (n: number) => `已选 ${n} / 2` },
  ja: { count: (n: number) => `${n} / 2 人選択中` },
  en: { count: (n: number) => `${n} / 2 picked` },
});
import { idCard } from "./idcard";

const TILTS = [-2, 1.2, -0.8, 1.8, 1, -1.6, 2, -1.2];

export class Draft {
  private root = el("draft");
  private cards = el("draft-cards");
  private go = el<HTMLButtonElement>("draft-go");
  private count = el("draft-count");
  private picked: RoleId[] = [];

  constructor(private portraits: Record<RoleId, string>, private onConfirm: (roles: [RoleId, RoleId]) => void) {
    this.cards.addEventListener("click", (e) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".idcard");
      if (!card) return;
      const role = card.dataset.role as RoleId;
      if (this.picked.includes(role)) this.picked = this.picked.filter((r) => r !== role);
      else if (this.picked.length < 2) this.picked.push(role);
      else {
        card.classList.remove("nope");
        void card.offsetWidth;
        card.classList.add("nope");
        return;
      }
      this.update();
    });
    this.go.addEventListener("click", () => {
      if (this.picked.length !== 2) return;
      const roles: [RoleId, RoleId] = [this.picked[0], this.picked[1]];
      this.close();
      this.onConfirm(roles);
    });
    el("draft-back").addEventListener("click", () => this.close());
  }

  get isOpen(): boolean {
    return !this.root.hidden;
  }

  open(): void {
    this.picked = [];
    this.cards.innerHTML = "";
    ROLE_ORDER.forEach((role, k) => {
      const c = idCard(role, this.portraits[role], "draft");
      c.style.setProperty("--d", `${0.06 + k * 0.05}s`);
      c.style.setProperty("--tilt", `${TILTS[k]}deg`);
      this.cards.append(c);
    });
    this.update();
    document.body.classList.add("drafting");
    this.root.hidden = false;
    this.cards.querySelector<HTMLElement>(".idcard")?.focus({ preventScroll: true });
  }

  close(): void {
    document.body.classList.remove("drafting");
    this.root.hidden = true;
  }

  private update(): void {
    this.cards.querySelectorAll<HTMLElement>(".idcard").forEach((c) => c.setAttribute("aria-pressed", String(this.picked.includes(c.dataset.role as RoleId))));
    this.count.textContent = DRAFT.count(this.picked.length);
    this.go.disabled = this.picked.length !== 2;
  }
}
