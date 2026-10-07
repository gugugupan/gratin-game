import { ROLES, type MutationId, type RoleId } from "../../engine/game.js";
import { STRAINS } from "../../engine/map.js";
import { tr } from "./i18n/locale";

export const ROLE_ORDER: readonly RoleId[] = ROLES;

export interface RoleInfo {
  name: string;
  color: string;
  key: string;
  ability: string;
}

const ROLE_STYLE: Record<RoleId, { color: string; key: string }> = {
  medic: { color: "#c4472f", key: "MEDIC" },
  researcher: { color: "#5b7d4a", key: "RESEARCH" },
  police: { color: "#34466e", key: "POLICE" },
  epidemiologist: { color: "#7a5a8c", key: "EPIDEM" },
  engineer: { color: "#b77a2a", key: "ENGINEER" },
  logistics: { color: "#3d7a7a", key: "LOGIST" },
  officer: { color: "#a3546b", key: "OFFICER" },
  pharmacist: { color: "#4f6aa0", key: "PHARMA" },
};

const ROLE_TEXT: Record<RoleId, [string, string]> = tr({
  zh: {
    medic: ["急救队员", "治疗一次清空该城同株病毒；已研制的病毒株进城即清。"],
    researcher: ["研究员", "研制只需 3 个样本，并且随处可研制。"],
    police: ["警察", "驻守封城：所在城市不再被放病毒，拦下的病毒变成样本。"],
    epidemiologist: ["流行病学家", "每轮一次 0 点预判感染：看接下来要感染的 3 座城市，移走 1 座。"],
    engineer: ["工程师", "建研究站只需 2 点；1 点部署野战实验室。"],
    logistics: ["后勤官", "不用同城也能交接样本。"],
    officer: ["卫生官", "每局 2 次：取消本轮感染城市中的 1 座。"],
    pharmacist: ["药剂师", "治疗时额外获得 1 个样本。"],
  },
  ja: {
    medic: ["救急隊員", "1 回の治療でその都市の同じ株をすべて除去。治療薬がある株は、入るだけで除去できる。"],
    researcher: ["研究員", "治療薬の開発に必要なサンプルは 3 個。どこでも開発できる。"],
    police: ["警察官", "駐在封鎖：いる都市には病原体が置かれず、防いだ分はサンプルになる。"],
    epidemiologist: ["疫学者", "毎ラウンド 1 回、0 ポイントで感染予測：次に感染する 3 都市を見て、1 都市を後回しにする。"],
    engineer: ["技師", "研究所を 2 ポイントで建設。1 ポイントで野外ラボを設置できる。"],
    logistics: ["兵站係", "同じ都市にいなくてもサンプルを渡せる。"],
    officer: ["衛生官", "1 ゲーム 2 回まで：今ラウンドの感染都市を 1 つ取り消す。"],
    pharmacist: ["薬剤師", "治療するとサンプルを 1 個多くもらえる。"],
  },
  en: {
    medic: ["Medic", "One treat clears every virus of that strain here. Cured strains are cleared just by walking in."],
    researcher: ["Researcher", "Needs only 3 samples to develop a cure, and can do it anywhere."],
    police: ["Police", "Lockdown: no virus lands where the police stand. Blocked viruses become samples."],
    epidemiologist: ["Epidemiologist", "Once a round, free: see the next 3 cities to be infected and push one back."],
    engineer: ["Engineer", "Builds a research station for 2 AP, or a field lab for 1 AP."],
    logistics: ["Logistician", "Hands samples to a teammate in any city."],
    officer: ["Health Officer", "Twice per game: cancel one of this round's infected cities."],
    pharmacist: ["Pharmacist", "Gains 1 extra sample whenever they treat."],
  },
});

export const ROLE_INFO = Object.fromEntries(
  ROLE_ORDER.map((r) => [r, { ...ROLE_STYLE[r], name: ROLE_TEXT[r][0], ability: ROLE_TEXT[r][1] }]),
) as Record<RoleId, RoleInfo>;

export const STRAIN_COLORS = ["#c4472f", "#2f6d8c", "#c9951a"] as const;
export const STRAIN_SHORT = tr({ zh: ["赤", "苍", "金"], ja: ["赤", "蒼", "金"], en: ["Red", "Blue", "Gold"] });
export const STRAIN_NAME = tr({
  zh: ["赤株", "苍株", "金株"],
  ja: ["赤株", "蒼株", "金株"],
  en: ["Red strain", "Blue strain", "Gold strain"],
});
export const STRAIN_KEY = ["red", "blue", "gold"] as const;
export const STRAIN_CSS = ["--red", "--blue", "--gold"] as const;

const MUTATION_ICON: Record<MutationId, string> = {
  breach: "mut_breach",
  resistant: "mut_resistant",
  virulent: "mut_virulent",
  stubborn: "mut_stubborn",
  acute: "mut_acute",
};

const MUTATION_TEXT: Record<MutationId, [string, string]> = tr({
  zh: {
    breach: ["突破", "每轮无视 1 次封城"],
    resistant: ["耐药", "研制多需 1 个样本"],
    virulent: ["烈性", "已有病毒的城市被感染时放 2 个"],
    stubborn: ["顽固", "全清效果无效，每次只能移除 1 个"],
    acute: ["急性", "2 个病毒就会爆发"],
  },
  ja: {
    breach: ["突破", "毎ラウンド 1 回、封鎖を無視する"],
    resistant: ["耐性", "開発に必要なサンプルが 1 個増える"],
    virulent: ["強毒", "病原体がある都市が感染すると 2 個置く"],
    stubborn: ["頑固", "一掃効果が効かず、1 回に 1 個しか除去できない"],
    acute: ["急性", "2 個でアウトブレイクする"],
  },
  en: {
    breach: ["Breach", "Ignores one lockdown each round"],
    resistant: ["Resistant", "Cures need 1 more sample"],
    virulent: ["Virulent", "Infecting a city that already has it adds 2"],
    stubborn: ["Stubborn", "Clear-all effects fail; only 1 per treat"],
    acute: ["Acute", "Breaks out at just 2 viruses"],
  },
});

export const MUTATION_INFO = Object.fromEntries(
  (Object.keys(MUTATION_ICON) as MutationId[]).map((m) => [m, { name: MUTATION_TEXT[m][0], text: MUTATION_TEXT[m][1], icon: MUTATION_ICON[m] }]),
) as Record<MutationId, { name: string; text: string; icon: string }>;

export const CITY_NAMES: readonly string[] = tr({
  zh: ["纸都", "朱砂", "印泉", "胭脂湾", "红笺", "丹关", "砚城", "墨湾", "松烟", "靛染", "青螺", "雪浪", "箔城", "竹帘", "楮林", "浆池", "琥珀滩", "金粟"],
  ja: ["紙都", "朱ノ里", "印泉", "紅浦", "緋箋", "丹ノ関", "硯町", "墨ノ浦", "松煙", "藍染", "青嶺", "雪浪", "箔町", "竹簾", "楮ノ森", "紙漉", "琥珀浜", "金穂"],
  en: ["Folio", "Cinnabar", "Sealwell", "Rouge Bay", "Redleaf", "Emberpass", "Inkstone", "Ink Bay", "Pinesoot", "Indigo", "Bluecrest", "Snowwave", "Gilding", "Bamboo", "Mulberry", "Pulpmere", "Amber Shore", "Goldgrain"],
});

export const REGION_NAMES = tr<[string, string, string]>({
  zh: ["朱原", "墨岭", "金滨"],
  ja: ["朱の原", "墨の峰", "金の浜"],
  en: ["Vermilion Plains", "Ink Highlands", "Gilt Coast"],
});

export const GAME_NAME = tr({ zh: "纸上防疫", ja: "紙上防疫", en: "Paper Quarantine" });
export const STRAIN_COUNT = STRAINS;
