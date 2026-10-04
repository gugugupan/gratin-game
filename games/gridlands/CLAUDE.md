# CLAUDE.md — Gridlands · 阡陌

单人逻辑推理益智游戏：按条件把 N×M 地图划分成若干**矩形区域**，每关有**唯一解**且可纯逻辑推导（无猜测）。中文名「阡陌」，英文「Gridlands」。

本文件给后续开发 / AI 会话提供项目上下文与约定。设计文档在 `document/`，本文件偏「怎么干活」。

## 现状（as-built）

纯前端 MVP，可玩，无后端。已完成：
- 规则引擎 + 唯一解校验器 + 「无猜测」推理检查（`tools/deduce.mjs`）；4 章 × 8 关，每章第 8 关是尾声：第 1 章 `1-1…1-8`（入门，1-7 相邻、1-8 边缘/角落），第 2 章「开发商来了」`2-1…2-8`（6×5 → 8×8），第 3 章「海岛拓荒」`3-1…3-8`（8×8 → 11×10，海岸线 + 营地旗 + 方位），第 4 章「蒸汽时代」`4-1…4-8`（6×6 → 10×10，剪刀 → 铁锅 → 毛线 → 蜡烛 → 怀表 → 雨伞 → 座钟 → 大衣），第 5 章「铁路通车」`5-1…5-8`（6×6 → 10×10），全部通过。
- 2026-10-04 每章补到 8 关时，原尾声 2-7/3-7/4-7 改名为 2-8/3-8/4-8；`state/store.ts` 的进度迁移升到 v3。
- 第 4 章机制：区域可标 `facility: gather|factory`，关卡带 `product`；新条件 SUPPLIED_BY（流水线供料 + 产量）、EXCLUSIVE_TO（独占供料）、NO_TAG_WITHIN（污染范围）；侧边栏 RecipeTree 画配方树，通关时 FlowOverlay 播放物资流动。
- 第 5 章机制：区域可标 `kind: station|rail`；铁轨用 SHAPE_LINE / SHAPE_HLINE / SHAPE_VLINE + MUST_TOUCH_REGION 首尾相接，车站 SHAPE_SQUARE；5-6 起「隧道与桥梁」——不可通行的山脉 / 河流（地图小写 m / l）+ 全局 RAIL_ONLY_TAG（可通行的山 / 湖格只能归铁轨）。Board 给铁轨格画枕木（按分配格子的走向）、车站画站台纹，通关时 TrainOverlay 让火车沿铁轨从第一座车站开到第二座。电力试做关（WITHIN_REGION / FAR_FROM_REGION）已移出，留给第 6 章，设计见提交 fdff693。
- `web/public/tiles/terrain-{coal,copper,cotton}.svg` 是本项目自绘（仿 Fluent Flat 风格），其余图标来自 Fluent Emoji（MIT）。
- 关卡编号 2026-10-03 改过：旧 2-1/2-2/3-1/4-1 → 1-3/1-4/1-5/1-6；`state/store.ts` 里有一次性的通关进度迁移（`rlp-progress-version`）。
- 每关有 `theme`（氛围色 + 故事卡插图）和 `story`（背景故事）。
- 网址带 `?unlock=all`（如 `/gridlands/?unlock=all#/levels`，或 `#/levels?unlock=all`）时所有关卡可玩，不写入通关记录。
- 网址带 `?answer=1`（如 `/gridlands/?answer=1#/levels/3-5`）时打开关卡直接填好标准答案，同时解锁该关；答案模式下不记录通关，顶部显示提示条。
- 三页路由（介绍 / 关卡列表 / 游玩）；进度与**顺序解锁**存 localStorage。
- 中日英三语 i18n（日语 2026-10-04 加入）；扁平 SVG 图标（地形 + 角色头像）；品牌 logo / favicon。

未做：后端 / 数据库 / 账号 / 订阅 / 自动关卡生成器 / 每日挑战。

## 目录

```
document/   设计文档：PRD.md、LEVEL_SCHEMA.md（关卡 JSON 权威定义）、TECH_DESIGN.md、README.md
levels/     关卡 JSON（权威数据；结构见 LEVEL_SCHEMA.md）
tools/      gen-samples.mjs（生成 1-2…1-6）、gen-chapter1.mjs（生成 1-7、1-8）、level-kit.mjs（ASCII 地图 → 关卡 JSON；`~` 海，记号后跟数字 = 开局插旗给该区域）、gen-chapter2.mjs（生成 2-1…2-8）、gen-chapter3.mjs（生成 3-1…3-8）、gen-chapter4.mjs（生成 4-x）、gen-chapter5.mjs（生成 5-x）、generate-rail.mjs（第 5 章铁路关候选：先铺车站和铁轨、再切地块、最后精简条件）、recipes-ch4.mjs（第 4 章配方树）、generate-level.mjs（随机生成候选关卡：最小条件集 + 唯一解 + 推理可解）、verify-levels.mjs（唯一解 + 比对内置答案 + 推理可解）、deduce.mjs（排除推理求解器）
web/        Vite + React + TS 前端
  src/core/engine.js   规则引擎（纯 ESM JS，前端与 node 校验脚本共用；类型在 engine.d.ts）
  src/pages/           IndexPage / LevelsPage / PlayPage
  src/components/      Board, Cell, RegionList, ConditionPanel, conditions, icons, Header, LanguageSelect
  src/state/store.ts   Zustand：level/assignment/selectedRegion/locale/passed + 动作
  src/i18n/index.ts    UI 文案 + 地形名(TAGS) + 本地化助手(localized/t/tagName)
  src/i18n/ja-text.ts  关卡文字的日语对照表（以中文原文为键）
  src/levels.ts        关卡加载 + 解锁助手(isUnlocked/nextLevel)
```

## 常用命令

```bash
cd web && npm install
npm run dev        # 开发 (http://localhost:5173，HashRouter：#/ 首页)
npm run build      # tsc -b && vite build（提交前务必跑通）
node ../tools/verify-levels.mjs   # 校验所有关卡唯一解（改/加关卡后必跑）
node ../tools/gen-samples.mjs     # 重新生成 1-2…1-6（1-1 是手写 JSON，不由生成器产出）
node ../tools/gen-chapter2.mjs    # 重新生成 2-1…2-7
node ../tools/gen-chapter3.mjs    # 重新生成 3-1…3-7
node ../tools/generate-level.mjs search 7 7 5 1 60   # 找候选；再用 show W H K SEED 查看，挑中的手写进 gen-chapterN.mjs
# 海岛关：加 --sea=3 --noblock --dir --flags=2 [--mindir=3] [--maxshare=0.25]；大地图搜得慢，放后台跑，结果逐行输出
node ../tools/generate-level.mjs factory pan 6 7 1 300 --maxshare=0.3   # 第 4 章：按配方树搜；factoryshow 查看、factoryjs 导出代码块
# 设施多的大配方（怀表/雨伞/大衣）加 --loose --nodecoy，并可用 recipes-ch4.mjs 里的 *-lean（去掉普通区域）；候选每家常有 4 条条件
node ../tools/generate-rail.mjs search 8 7 1 800 --runs=3 --plots=3   # 第 5 章；show / js 同参数查看、导出（OWNER_ 占位换成角色）
# 选项 --spur 支线+货场、--tunnel / --bridge 山脉隧道 / 河流桥梁、--orient 横纵线索、--edge 起点站贴边；带支线的大图地块多，--plots 设 5–6，放后台跑
```

## 架构与关键决策

- **规则引擎单一来源**：`engine.js` 同时被前端（实时 `validate` + 通关判定）和 node 校验脚本（`solve`/`isUniqueSolution`）使用，避免前后端规则不一致。Node 20，无法跑 .ts，故引擎用 JS + `.d.ts`。
- **渲染用 CSS Grid DOM，不用 Canvas**：小棋盘 + 「点/hover/拖拽圈选」用 DOM 最省事。
- **棋盘有内边距/缝隙（视觉上的「阡陌」）**，所以拖拽命中用 `document.elementFromPoint` 读 `.cell[data-id]`，**不要**用 rect 比例换算（会因 gap 错位）。terrain svg 设 `pointer-events:none` 以便命中到 `.cell`。
- **区域=单个矩形**：同一区域再次拖拽时 `assignCells` 会**先清空该区域旧选择再赋新矩形**（替换语义，保证始终是矩形）；`fixedRegion` 预置线索不被清。
- **地形图标按 tag + 语言派生**，不写死在关卡 JSON 的 `display.label` 里；`display.bg` 也被前端 `TERRAIN_STYLE` 覆盖。新增地形需同时改 `components/icons.tsx`(TERRAIN_STYLE+terrainGlyph) 和 `i18n/index.ts`(TAGS)。
- **本地化**：关卡 `name` 与 `owner.name` 用 `LocalizedString`（字符串或 `{zh,en}`）。关卡 JSON 和生成脚本里只写 zh/en；日语译文放在 `i18n/ja-text.ts`，按中文原文查表，查不到时回退英文——新增或改动中文文案后记得补译文；角色头像由 `owner.icon` 键映射（farmer/rancher/miner/forester/developer/crown/house，缺省通用剪影）。
- **进度/解锁**：localStorage key `rlp-progress`（已通关 id 数组）、`rlp-locale`（语言）。第 1 关默认解锁，第 N 关需第 N−1 关已通关；直接访问未解锁关卡会重定向回 `/levels`。
- **答案不暴露给玩法**：通关判定靠前端对玩家局面跑 `validate`，不读 `solution`。

## 加 / 改关卡

1. 改 `tools/gen-samples.mjs`（或直接写 `levels/x.json`，遵循 `document/LEVEL_SCHEMA.md`）。
2. `node tools/gen-samples.mjs`（若用生成器）。
2.5 `levels/` 在 Vite 的监听范围外：新增关卡文件后要重启 dev server 才能看到。
3. **必须** `node tools/verify-levels.mjs` 确认 `solutions=1 matchesStored=true deducible=true`——唯一解、且只靠推理可解是硬要求。
4. 关卡按 `levels.ts` 里的 `LEVELS`（按 id 排序）顺序解锁，命名遵循 `章-关`（如 `2-3`）。
5. 只支持 `shapeRule: "RECT"` + `coverage: "FULL"`（求解器与 UI 目前的范围）。

## 约定

- 仍遵守仓库通用规则：中文回复；动代码前先给计划并确认；不在 develop/main 直接提交。
- 提交前跑 `npm run build` 与 `verify-levels`。
- 改玩法逻辑务必同时考虑「前端实时校验」和「node 唯一解校验」两条路径（同一份 engine.js）。
