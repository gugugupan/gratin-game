export const ROLES = [
  "medic",
  "researcher",
  "police",
  "epidemiologist",
  "engineer",
  "logistics",
  "officer",
  "pharmacist",
] as const;
export type RoleId = (typeof ROLES)[number];

export const ROLE_NAMES: Record<RoleId, string> = {
  medic: "急救队员",
  researcher: "研究员",
  police: "警察",
  epidemiologist: "流行病学家",
  engineer: "工程师",
  logistics: "后勤官",
  officer: "卫生官",
  pharmacist: "药剂师",
};

export const MUTATIONS = ["breach", "resistant", "virulent", "stubborn", "acute"] as const;
export type MutationId = (typeof MUTATIONS)[number];

export const MUTATION_NAMES: Record<MutationId, string> = {
  breach: "突破",
  resistant: "耐药",
  virulent: "烈性",
  stubborn: "顽固",
  acute: "急性",
};
