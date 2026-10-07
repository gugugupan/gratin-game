import { ROLES, type MutationId, type RoleId } from "../../engine/game.js";
import { CITIES, STRAINS } from "../../engine/map.js";

export const ROLE_ORDER: readonly RoleId[] = ROLES;

export interface RoleInfo {
  name: string;
  color: string;
  key: string;
  ability: string;
}

export const ROLE_INFO: Record<RoleId, RoleInfo> = {
  medic: { name: "急救队员", color: "#c4472f", key: "MEDIC", ability: "治疗一次清空该城同株病毒；已研制的病毒株进城即清。" },
  researcher: { name: "研究员", color: "#5b7d4a", key: "RESEARCH", ability: "研制只需 3 个样本，并且随处可研制。" },
  police: { name: "警察", color: "#34466e", key: "POLICE", ability: "驻守封城：所在城市不再被放病毒，拦下的病毒变成样本。" },
  epidemiologist: { name: "流行病学家", color: "#7a5a8c", key: "EPIDEM", ability: "每轮一次 0 点预判感染：看接下来要感染的 3 座城市，移走 1 座。" },
  engineer: { name: "工程师", color: "#b77a2a", key: "ENGINEER", ability: "建研究站只需 2 点；1 点部署野战实验室。" },
  logistics: { name: "后勤官", color: "#3d7a7a", key: "LOGIST", ability: "不用同城也能交接样本。" },
  officer: { name: "卫生官", color: "#a3546b", key: "OFFICER", ability: "每局 2 次：取消本轮感染城市中的 1 座。" },
  pharmacist: { name: "药剂师", color: "#4f6aa0", key: "PHARMA", ability: "治疗时额外获得 1 个样本。" },
};

export const STRAIN_COLORS = ["#c4472f", "#2f6d8c", "#c9951a"] as const;
export const STRAIN_SHORT = ["赤", "苍", "金"] as const;
export const STRAIN_KEY = ["red", "blue", "gold"] as const;
export const STRAIN_CSS = ["--red", "--blue", "--gold"] as const;

export const MUTATION_INFO: Record<MutationId, { name: string; text: string; icon: string }> = {
  breach: { name: "突破", text: "每轮无视 1 次封城", icon: "mut_breach" },
  resistant: { name: "耐药", text: "研制多需 1 个样本", icon: "mut_resistant" },
  virulent: { name: "烈性", text: "已有病毒的城市被感染时放 2 个", icon: "mut_virulent" },
  stubborn: { name: "顽固", text: "全清效果无效，每次只能移除 1 个", icon: "mut_stubborn" },
  acute: { name: "急性", text: "2 个病毒就会爆发", icon: "mut_acute" },
};

export const CITY_NAMES = CITIES.map((c) => c.name);
export const STRAIN_COUNT = STRAINS;
