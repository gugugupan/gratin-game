import { writeFileSync } from "node:fs";
import { Config, DEFAULT_CONFIG, MUTATION_NAMES, MutationId, ROLE_NAMES, ROLES } from "../engine/game.js";
import { PolicyName } from "./play.js";
import { avg, Cell, PAIRS, pct, runAll, spread, total } from "./pool.js";

const games = Number(process.env.GAMES ?? 150);
const v1 = { lockdownBlocksInfection: false };
const variants: [string, Partial<Config>][] = [
  ["边隔离（旧）", { policeMode: "edge" }],
  ["封城A 只拦爆发 1点", { policeMode: "lockdown", lockdownBlocksInfection: false }],
  ["封城B 拦爆发+点名 1点", { policeMode: "lockdown" }],
  ["封城B 0点（每轮1次）", { policeMode: "lockdown", lockdownCost: 0 }],
  ["封城B 被动（跟随警察）", { policeMode: "passive" }],
  ["封城C 拦下的病毒变样本 1点", { policeMode: "lockdown", lockdownSample: true }],
  ["封城C 被动 + 样本", { policeMode: "passive", lockdownSample: true }],
];
const cells: Cell[] = variants.flatMap(([, patch], vi) =>
  PAIRS.map((roles, pi) => ({
    key: `p${vi}:${roles.join("+")}`,
    cfg: { ...DEFAULT_CONFIG, ...patch },
    roles,
    policy: "heuristic" as PolicyName,
    games,
    seed: 30_000_000 + pi * 10_000,
  })),
);
const results = await runAll(cells);
const out: string[] = [];
out.push(`# 警察封城变体`, ``, `共享4点 + 职业修正 + 变异只给未研制株；28 组合 × ${games} 局，beam ${process.env.BEAM ?? 16}`, ``);
out.push(`| 变体 | 总胜率 | 标准差 | 警察 | 警察排名 | 最弱组合 | 最强组合 | 封城/局 | 平均爆发 |`);
out.push(`|---|---|---|---|---|---|---|---|---|`);
variants.forEach(([label], vi) => {
  const list = results.filter((s) => s.key.startsWith(`p${vi}:`));
  const t = total(list);
  const { min, max, sd } = spread(list);
  const rates = ROLES.map((role) => {
    const r = total(list.filter((s) => s.roles.includes(role)));
    return { role, rate: r.wins / r.games };
  }).sort((a, b) => b.rate - a.rate);
  const police = rates.find((r) => r.role === "police")!;
  const rank = rates.indexOf(police) + 1;
  const name = (s: typeof min) => `${pct(s.wins, s.games)} ${ROLE_NAMES[s.roles[0]]}+${ROLE_NAMES[s.roles[1]]}`;
  const uses = (t.actions.lockdown ?? 0) + (t.actions.quarantine ?? 0);
  const policeGames = total(list.filter((s) => s.roles.includes("police"))).games;
  out.push(`| ${label} | **${pct(t.wins, t.games)}** | ${(sd * 100).toFixed(1)} | ${(police.rate * 100).toFixed(1)}% | ${rank}/8 | ${name(min)} | ${name(max)} | ${avg(uses, policeGames)} | ${avg(t.outbreaks, t.games)} |`);
});
out.push(``);
variants.forEach(([label], vi) => {
  const list = results.filter((s) => s.key.startsWith(`p${vi}:`));
  const rates = ROLES.map((role) => {
    const r = total(list.filter((s) => s.roles.includes(role)));
    return `${ROLE_NAMES[role]} ${pct(r.wins, r.games)}`;
  });
  out.push(`- ${label}：${rates.join("，")}`);
});
const t1 = total(results.filter((s) => s.key.startsWith(`p1:`)));
out.push(``, `变异（封城A）：`);
for (const [k, v] of Object.entries(t1.mutations)) out.push(`- ${MUTATION_NAMES[k as MutationId]} ${avg(v.picks, t1.games)}/局，给已研制株 ${pct(v.onCured, v.picks)}`);
const md = out.join("\n") + "\n";
writeFileSync("reports/police.md", md);
console.log(md);
