import type { RoleId } from "../../../engine/game.js";
import { iconUrl } from "../art/assets";
import { ROLE_INFO, ROLE_ORDER, STRAIN_KEY, STRAIN_NAME } from "../data";

export const ID_TEXT = tr({
  zh: { header: "纸上防疫 · 行动人员证", role: "职务", ability: "能力", samples: "样本", onDuty: "行动中", picked: "入选", none: "暂无样本", sample: (s: string) => `${s}样本` },
  ja: { header: "紙上防疫 · 作戦隊員証", role: "職務", ability: "能力", samples: "サンプル", onDuty: "出動中", picked: "選出", none: "サンプルなし", sample: (s: string) => `${s}のサンプル` },
  en: { header: "PAPER QUARANTINE · AGENT ID", role: "Role", ability: "Ability", samples: "Samples", onDuty: "ON DUTY", picked: "PICKED", none: "No samples yet", sample: (s: string) => `${s} sample` },
});
import { tr } from "../i18n/locale";

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
    <span class="id-head"><span>${ID_TEXT.header}</span><span class="id-no">No. OB-07-${no}</span></span>
    <span class="id-body">
      <span class="id-photo"><img src="${portrait}" alt=""></span>
      <span class="id-fields">
        <span class="id-label">${ID_TEXT.role}</span><span class="id-name">${info.name}</span>
        <span class="id-label">${ID_TEXT.ability}</span><span class="id-ability">${info.ability}</span>
        ${detail ? `<span class="id-label">${ID_TEXT.samples}</span><span class="chips">${sampleChips(detail.samples)}</span>${detail.status ? `<span class="status">${detail.status}</span>` : ""}` : ""}
      </span>
    </span>
    <span class="id-mrz">OB&lt;&lt;${info.key}&lt;&lt;07${no}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
    <span class="id-holo" aria-hidden="true"></span>
    <span class="id-seal" aria-hidden="true">${kind === "team" ? ID_TEXT.onDuty : ID_TEXT.picked}</span>`;
  return b;
}

function sampleChips(samples: number[]): string {
  const chips = samples
    .map((n, s) => (n > 0 ? `<span class="chip-icon" title="${ID_TEXT.sample(STRAIN_NAME[s])} ×${n}"><img src="${iconUrl(`sample_${STRAIN_KEY[s]}`)}" alt="${ID_TEXT.sample(STRAIN_NAME[s])}">×${n}</span>` : ""))
    .join("");
  return chips || `<span class="id-empty">${ID_TEXT.none}</span>`;
}
