# CLAUDE.md — Gridlands · 阡陌

单人逻辑推理益智游戏：按条件把 N×M 地图划分成若干**矩形区域**，每关有**唯一解**且可纯逻辑推导（无猜测）。中文名「阡陌」，英文「Gridlands」。

本文件给后续开发 / AI 会话提供项目上下文与约定。设计文档在 `document/`，本文件偏「怎么干活」。

## 现状（as-built）

纯前端 MVP，可玩，无后端。已完成：
- 规则引擎 + 唯一解校验器 + 「无猜测」推理检查（`tools/deduce.mjs`）；第 1 章 `levels/1-1.json` … `1-6.json`，第 2 章 `2-1.json`、`2-2.json`，全部通过。
- 关卡编号 2026-10-03 改过：旧 2-1/2-2/3-1/4-1 → 1-3/1-4/1-5/1-6；`state/store.ts` 里有一次性的通关进度迁移（`rlp-progress-version`）。
- 每关有 `theme`（氛围色 + 故事卡插图）和 `story`（背景故事）。
- 三页路由（介绍 / 关卡列表 / 游玩）；进度与**顺序解锁**存 localStorage。
- 中英双语 i18n；扁平 SVG 图标（地形 + 角色头像）；品牌 logo / favicon。

未做：后端 / 数据库 / 账号 / 订阅 / 自动关卡生成器 / 每日挑战。

## 目录

```
document/   设计文档：PRD.md、LEVEL_SCHEMA.md（关卡 JSON 权威定义）、TECH_DESIGN.md、README.md
levels/     关卡 JSON（权威数据；结构见 LEVEL_SCHEMA.md）
tools/      gen-samples.mjs（生成 1-2…1-6）、gen-chapter2.mjs（生成 2-1、2-2）、verify-levels.mjs（唯一解 + 比对内置答案 + 推理可解）、deduce.mjs（排除推理求解器）
web/        Vite + React + TS 前端
  src/core/engine.js   规则引擎（纯 ESM JS，前端与 node 校验脚本共用；类型在 engine.d.ts）
  src/pages/           IndexPage / LevelsPage / PlayPage
  src/components/      Board, Cell, RegionList, ConditionPanel, conditions, icons, Header, LanguageSelect
  src/state/store.ts   Zustand：level/assignment/selectedRegion/locale/passed + 动作
  src/i18n/index.ts    UI 文案 + 地形名(TAGS) + 本地化助手(localized/t/tagName)
  src/levels.ts        关卡加载 + 解锁助手(isUnlocked/nextLevel)
```

## 常用命令

```bash
cd web && npm install
npm run dev        # 开发 (http://localhost:5173，HashRouter：#/ 首页)
npm run build      # tsc -b && vite build（提交前务必跑通）
node ../tools/verify-levels.mjs   # 校验所有关卡唯一解（改/加关卡后必跑）
node ../tools/gen-samples.mjs     # 重新生成 1-2…1-6（1-1 是手写 JSON，不由生成器产出）
node ../tools/gen-chapter2.mjs    # 重新生成 2-1、2-2
```

## 架构与关键决策

- **规则引擎单一来源**：`engine.js` 同时被前端（实时 `validate` + 通关判定）和 node 校验脚本（`solve`/`isUniqueSolution`）使用，避免前后端规则不一致。Node 20，无法跑 .ts，故引擎用 JS + `.d.ts`。
- **渲染用 CSS Grid DOM，不用 Canvas**：小棋盘 + 「点/hover/拖拽圈选」用 DOM 最省事。
- **棋盘有内边距/缝隙（视觉上的「阡陌」）**，所以拖拽命中用 `document.elementFromPoint` 读 `.cell[data-id]`，**不要**用 rect 比例换算（会因 gap 错位）。terrain svg 设 `pointer-events:none` 以便命中到 `.cell`。
- **区域=单个矩形**：同一区域再次拖拽时 `assignCells` 会**先清空该区域旧选择再赋新矩形**（替换语义，保证始终是矩形）；`fixedRegion` 预置线索不被清。
- **地形图标按 tag + 语言派生**，不写死在关卡 JSON 的 `display.label` 里；`display.bg` 也被前端 `TERRAIN_STYLE` 覆盖。新增地形需同时改 `components/icons.tsx`(TERRAIN_STYLE+terrainGlyph) 和 `i18n/index.ts`(TAGS)。
- **本地化**：关卡 `name` 与 `owner.name` 用 `LocalizedString`（字符串或 `{zh,en}`）；角色头像由 `owner.icon` 键映射（farmer/rancher/miner/forester/developer/crown/house，缺省通用剪影）。
- **进度/解锁**：localStorage key `rlp-progress`（已通关 id 数组）、`rlp-locale`（语言）。第 1 关默认解锁，第 N 关需第 N−1 关已通关；直接访问未解锁关卡会重定向回 `/levels`。
- **答案不暴露给玩法**：通关判定靠前端对玩家局面跑 `validate`，不读 `solution`。

## 加 / 改关卡

1. 改 `tools/gen-samples.mjs`（或直接写 `levels/x.json`，遵循 `document/LEVEL_SCHEMA.md`）。
2. `node tools/gen-samples.mjs`（若用生成器）。
3. **必须** `node tools/verify-levels.mjs` 确认 `solutions=1 matchesStored=true deducible=true`——唯一解、且只靠推理可解是硬要求。
4. 关卡按 `levels.ts` 里的 `LEVELS`（按 id 排序）顺序解锁，命名遵循 `章-关`（如 `2-3`）。
5. 只支持 `shapeRule: "RECT"` + `coverage: "FULL"`（求解器与 UI 目前的范围）。

## 约定

- 仍遵守仓库通用规则：中文回复；动代码前先给计划并确认；不在 develop/main 直接提交。
- 提交前跑 `npm run build` 与 `verify-levels`。
- 改玩法逻辑务必同时考虑「前端实时校验」和「node 唯一解校验」两条路径（同一份 engine.js）。
