import { mkdirSync, writeFileSync } from "node:fs";
import { ApRule, Config, DEFAULT_CONFIG, MUTATION_NAMES, MutationId, ROLE_NAMES, ROLES } from "../engine/game.js";
import { avg, Cell, PAIRS, pairName, pct, runAll, spread, total } from "./pool.js";
import { PolicyName } from "./play.js";

const AP_RULES: { label: string; ap: ApRule }[] = [
  { label: "每人3点(共6)", ap: { mode: "perRole", n: 3 } },
  { label: "每人2点(共4)", ap: { mode: "perRole", n: 2 } },
  { label: "共享3点", ap: { mode: "shared", n: 3 } },
  { label: "共享4点", ap: { mode: "shared", n: 4 } },
  { label: "共享5点", ap: { mode: "shared", n: 5 } },
];


async function main(): Promise<void> {
  const games = Number(process.env.GAMES ?? 400);
  const t0 = Date.now();
  const out: string[] = [];
  const line = (s = "") => out.push(s);

  const apCells: Cell[] = AP_RULES.flatMap(({ label, ap }, ai) =>
    PAIRS.map((roles, pi) => ({
      key: `ap${ai}:${roles.join("+")}`,
      cfg: { ...DEFAULT_CONFIG, ap },
      roles,
      policy: "heuristic" as PolicyName,
      games,
      seed: 1_000_000 + pi * 10_000,
    })),
  );
  const randomCells: Cell[] = AP_RULES.map(({ ap }, ai) => ({
    key: `rand${ai}`,
    cfg: { ...DEFAULT_CONFIG, ap },
    roles: ["medic", "researcher"],
    policy: "random" as PolicyName,
    games: games * 2,
    seed: 5_000_000,
  }));
  const apResults = await runAll([...apCells, ...randomCells]);
  const byAp = AP_RULES.map((_, ai) => apResults.filter((s) => s.key.startsWith(`ap${ai}:`)));
  const rand = apResults.filter((s) => s.key.startsWith("rand"));

  line(`# 平衡模拟报告`);
  line();
  line(`- 每个格子 ${games} 局，启发式 bot（beam search，宽度 ${process.env.BEAM ?? 16}），默认规则：${DEFAULT_CONFIG.rounds} 轮，每轮点名 ${DEFAULT_CONFIG.infectionRate.join("/")} 城，流行病 ${DEFAULT_CONFIG.epidemics}，爆发上限 ${DEFAULT_CONFIG.outbreakLimit}，每株 ${DEFAULT_CONFIG.cubesPerStrain} 个病毒，开局 ${DEFAULT_CONFIG.setup.join("/")}`);
  line(`- 生成于 ${new Date().toISOString()}，耗时 ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  line();
  line(`## 1. 行动点方案`);
  line();
  line(`| 方案 | 启发式胜率 | 随机胜率 | 组合胜率最低 | 组合胜率最高 | 标准差 | 胜局平均轮数 | 平均爆发 | 失败原因 |`);
  line(`|---|---|---|---|---|---|---|---|---|`);
  AP_RULES.forEach(({ label }, ai) => {
    const t = total(byAp[ai]);
    const { min, max, sd } = spread(byAp[ai]);
    const reasons = Object.entries(t.reasons).map(([k, v]) => `${k} ${pct(v, t.games)}`).join(" / ");
    line(`| ${label} | **${pct(t.wins, t.games)}** | ${pct(rand[ai].wins, rand[ai].games)} | ${pct(min.wins, min.games)} ${pairName(min.roles)} | ${pct(max.wins, max.games)} ${pairName(max.roles)} | ${(sd * 100).toFixed(1)} | ${avg(t.winRounds, t.wins)} | ${avg(t.outbreaks, t.games)} | ${reasons} |`);
  });

  for (const [ai, { label }] of AP_RULES.entries()) {
    line();
    line(`## 2.${ai + 1} 职业组合胜率 — ${label}`);
    line();
    const roleRate = ROLES.map((role) => {
      const t = total(byAp[ai].filter((s) => s.roles.includes(role)));
      return { role, rate: t.wins / t.games };
    }).sort((a, b) => b.rate - a.rate);
    line(`职业平均（含该职业的 7 个组合）：${roleRate.map((r) => `${ROLE_NAMES[r.role]} ${(r.rate * 100).toFixed(0)}%`).join("，")}`);
    line();
    line(`| | ${ROLES.map((r) => ROLE_NAMES[r]).join(" | ")} |`);
    line(`|---|${ROLES.map(() => "---").join("|")}|`);
    for (const a of ROLES) {
      const cells = ROLES.map((b) => {
        if (a === b) return "—";
        const s = byAp[ai].find((x) => x.roles.includes(a) && x.roles.includes(b))!;
        return pct(s.wins, s.games);
      });
      line(`| ${ROLE_NAMES[a]} | ${cells.join(" | ")} |`);
    }
    const t = total(byAp[ai]);
    const acts = Object.entries(t.actions).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${avg(v, t.games)}`).join("，");
    line();
    line(`每局平均行动次数：${acts}`);
  }

  const muts = total(byAp[0]).mutations;
  line();
  line(`## 3. 变异抉择（每人3点方案，启发式）`);
  line();
  line(`| 变异 | 被选次数/局 | 给已研制株 | 给已根除株 |`);
  line(`|---|---|---|---|`);
  const g0 = total(byAp[0]).games;
  for (const [k, v] of Object.entries(muts)) line(`| ${MUTATION_NAMES[k as MutationId]} | ${avg(v.picks, g0)} | ${pct(v.onCured, v.picks)} | ${pct(v.onEradicated, v.picks)} |`);

  const diff: { label: string; patch: Partial<Config> }[] = [];
  for (const epidemics of [3, 4, 5]) for (const outbreakLimit of [6, 8]) diff.push({ label: `流行病${epidemics} 爆发上限${outbreakLimit}`, patch: { epidemics, outbreakLimit } });
  diff.push({ label: "感染率 3→3→4→4→5", patch: { infectionRate: [3, 3, 4, 4, 5] } });
  diff.push({ label: "每株 20 个病毒", patch: { cubesPerStrain: 20 } });
  diff.push({ label: "开局 3/3/3/2/2/2/1/1/1", patch: { setup: [3, 3, 3, 2, 2, 2, 1, 1, 1] } });
  diff.push({ label: "10 轮", patch: { rounds: 10 } });
  const diffGames = Math.max(50, Math.round(games / 4));
  const diffCells: Cell[] = AP_RULES.flatMap(({ ap }, ai) =>
    diff.flatMap(({ patch }, di) =>
      PAIRS.map((roles, pi) => ({
        key: `d${ai}:${di}:${roles.join("+")}`,
        cfg: { ...DEFAULT_CONFIG, ...patch, ap },
        roles,
        policy: "heuristic" as PolicyName,
        games: diffGames,
        seed: 9_000_000 + pi * 10_000,
      })),
    ),
  );
  const diffResults = await runAll(diffCells);
  line();
  line(`## 4. 难度参数扫描（28 组合合计，每组合 ${diffGames} 局）`);
  line();
  line(`| 参数 | ${AP_RULES.map((a) => a.label).join(" | ")} |`);
  line(`|---|${AP_RULES.map(() => "---").join("|")}|`);
  diff.forEach(({ label }, di) => {
    const cols = AP_RULES.map((_, ai) => {
      const t = total(diffResults.filter((s) => s.key.startsWith(`d${ai}:${di}:`)));
      return pct(t.wins, t.games);
    });
    line(`| ${label} | ${cols.join(" | ")} |`);
  });

  const variants: { label: string; patch: Partial<Config> }[] = [
    { label: "原案", patch: {} },
    { label: "完全封锁的爆发不计数", patch: { sealedOutbreakFree: true } },
    { label: "流行病学家预判 0 点", patch: { forecastFree: true } },
    { label: "后勤官无免费移动", patch: { logisticsFreeMove: false } },
    { label: "以上三项", patch: { sealedOutbreakFree: true, forecastFree: true, logisticsFreeMove: false } },
  ];
  const variantAps = [0, 3];
  const variantGames = Math.max(50, Math.round(games / 2));
  const variantCells: Cell[] = variantAps.flatMap((ai) =>
    variants.flatMap(({ patch }, vi) =>
      PAIRS.map((roles, pi) => ({
        key: `v${ai}:${vi}:${roles.join("+")}`,
        cfg: { ...DEFAULT_CONFIG, ...patch, ap: AP_RULES[ai].ap },
        roles,
        policy: "heuristic" as PolicyName,
        games: variantGames,
        seed: 13_000_000 + pi * 10_000,
      })),
    ),
  );
  const variantResults = await runAll(variantCells);
  line();
  line(`## 5. 职业平衡变体（每组合 ${variantGames} 局）`);
  for (const ai of variantAps) {
    line();
    line(`### ${AP_RULES[ai].label}`);
    line();
    line(`| 变体 | 总胜率 | 标准差 | ${ROLES.map((r) => ROLE_NAMES[r]).join(" | ")} | 隔离/局 | 预判/局 |`);
    line(`|---|---|---|${ROLES.map(() => "---").join("|")}|---|---|`);
    variants.forEach(({ label }, vi) => {
      const list = variantResults.filter((s) => s.key.startsWith(`v${ai}:${vi}:`));
      const t = total(list);
      const roleCols = ROLES.map((role) => {
        const r = total(list.filter((s) => s.roles.includes(role)));
        return pct(r.wins, r.games);
      });
      line(`| ${label} | **${pct(t.wins, t.games)}** | ${(spread(list).sd * 100).toFixed(1)} | ${roleCols.join(" | ")} | ${avg(t.actions.quarantine ?? 0, t.games)} | ${avg(t.actions.forecast ?? 0, t.games)} |`);
    });
  }

  mkdirSync("reports", { recursive: true });
  const md = out.join("\n") + "\n";
  writeFileSync("reports/balance.md", md);
  writeFileSync("reports/balance.json", JSON.stringify({ apResults, diffResults, variantResults }, null, 1));
  console.log(md);
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

await main();
