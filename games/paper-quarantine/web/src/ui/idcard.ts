import type { RoleId } from "../../../engine/game.js";
import { iconUrl } from "../art/assets";
import { ROLE_INFO, ROLE_ORDER, STRAIN_KEY, STRAIN_SHORT } from "../data";

export interface IdCardDetail {
  samples: number[];
  status?: string;
}

export function idCard(role: RoleId, portrait: string, kind: "team" | "draft", detail?: IdCardDetail): HTMLButtonElement {
  const info = ROLE_INFO[role];
  const b = document.createElement("button");
  b.type = "button";
  b.className = `idcard idcard-${kind}`;
  b.dataset.role = role;
  b.style.setProperty("--rc", info.color);
  b.setAttribute("aria-pressed", "false");
  const no = String(ROLE_ORDER.indexOf(role) + 1).padStart(2, "0");
  b.innerHTML = `
    <span class="id-head"><span>纸上防疫 · 行动人员证</span><span class="id-no">No. OB-07-${no}</span></span>
    <span class="id-body">
      <span class="id-photo"><img src="${portrait}" alt=""></span>
      <span class="id-fields">
        <span class="id-label">职务</span><span class="id-name">${info.name}</span>
        <span class="id-label">能力</span><span class="id-ability">${info.ability}</span>
        ${detail ? `<span class="id-label">样本</span><span class="chips">${sampleChips(detail.samples)}</span>${detail.status ? `<span class="status">${detail.status}</span>` : ""}` : ""}
      </span>
    </span>
    <span class="id-mrz">OB&lt;&lt;${info.key}&lt;&lt;07${no}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
    <span class="id-holo" aria-hidden="true"></span>
    <span class="id-seal" aria-hidden="true">${kind === "team" ? "行动中" : "入选"}</span>`;
  return b;
}

function sampleChips(samples: number[]): string {
  const chips = samples
    .map((n, s) => (n > 0 ? `<span class="chip-icon" title="${STRAIN_SHORT[s]}株样本 ×${n}"><img src="${iconUrl(`sample_${STRAIN_KEY[s]}`)}" alt="${STRAIN_SHORT[s]}株样本">×${n}</span>` : ""))
    .join("");
  return chips || `<span class="id-empty">暂无样本</span>`;
}
