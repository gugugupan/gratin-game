# Gridlands · 阡陌（区域划分逻辑推理游戏）

一款单人逻辑推理益智游戏：玩家根据一组规则与条件，对地图进行**区域划分**，推导出**唯一正确**的规划方案。体验类比数独 / Nonogram，但推理对象是「空间区域」。

呈现形态：**网页版游戏 + 轻量 Server 端**（持久化关卡 / 用户 / 进度 / 订阅等数据）。

---

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [PRD.md](./PRD.md) | 产品需求文档：定位、核心系统、条件系统形式化、难度体系、关卡设计原则、MVP 范围、里程碑、指标 |
| [LEVEL_SCHEMA.md](./LEVEL_SCHEMA.md) | 关卡数据结构：关卡 JSON 的权威定义（board/cell/region/condition/solution）、完整示例、校验不变式 |
| [TECH_DESIGN.md](./TECH_DESIGN.md) | 技术方案：架构、技术栈、Monorepo 结构、数据模型、规则引擎、求解器、可解性验证、Server/API、数据库、里程碑 |

---

## 一句话概览

- **玩法**：选区域 → 拖拽圈选矩形 → 实时校验 → 满足全部条件即通关。
- **核心标准**：每关唯一解、无猜测（可纯逻辑推导）、可解释。
- **技术主线（as-built MVP）**：规则引擎 `web/src/core/engine.js`（前端与校验脚本共用一份）；React + Vite + TypeScript + Zustand + react-router（HashRouter）；棋盘用 **CSS Grid DOM** 渲染（非 Canvas）；进度存 **localStorage**；中英 i18n；暂无后端。后端/数据库方案见 TECH_DESIGN（尚未实现，仅规划）。

---

## 关键决策（已定）

- 网页版优先，移动端浏览器适配。
- MVP 仅矩形区域、5×5~7×7 地图、1~2 组织、面积/包含排除/基础邻接条件、手工 10~20 关。
- Server 端最小起步（关卡 + 进度 API，匿名 deviceId），数据库 SQLite→PostgreSQL 可迁移。
- 关卡答案不下发；自动生成器作为后期（M5）攻坚，前期先做校验器保障手工关卡质量。

---

## 里程碑速览

`M1 可玩原型 → M2 唯一解/可解性校验器 → M3 MVP 关卡包+轻后端 → M4 内测打磨 → M5 自动生成+每日挑战+账号/订阅`

详见各文档的「里程碑」章节。

---

## 当前进度（as-built）

- ✅ **纯前端 MVP 可玩**：6 关样例（1-1 … 4-1，均过唯一解校验）。
- ✅ 规则引擎 + 唯一解校验器（`engine.js` / `tools/verify-levels.mjs`）。
- ✅ 三页路由（介绍 / 关卡列表 / 游玩），进度与顺序解锁存 localStorage。
- ✅ 中英双语 i18n、扁平 SVG 图标（地形 + 角色头像）、品牌 logo。
- ⬜ 后端 / 数据库 / 自动生成 / 每日挑战 / 无猜测校验器：未开始（见 TECH_DESIGN 里程碑）。

> 开发约定、运行方式、结构与关键决策详见项目根的 [CLAUDE.md](../CLAUDE.md)。

## 实际目录结构

```
region-logic-puzzle/
├── CLAUDE.md             # 项目上下文与约定（给后续开发/AI 会话）
├── document/             # 设计文档（PRD / LEVEL_SCHEMA / TECH_DESIGN / 本 README）
├── levels/               # 关卡 JSON（1-1 … 4-1，共 6 关，均过唯一解校验）
├── tools/
│   ├── gen-samples.mjs   # 生成样例关卡（1-2 … 4-1）
│   └── verify-levels.mjs # 校验每关唯一解 + 与内置答案一致
└── web/                  # 纯前端 MVP（React + Vite），详见 web/README.md
    └── src/
        ├── core/engine.js  # 规则引擎（前端与 node 校验共用）
        ├── pages/          # IndexPage / LevelsPage / PlayPage（react-router）
        ├── components/     # Board / Cell / RegionList / ConditionPanel / icons / Header …
        ├── state/store.ts  # Zustand：游戏状态 + 进度(passed) + 语言
        ├── i18n/           # 文案 + 地形名 + 本地化助手
        └── levels.ts       # 关卡加载 + 解锁(isUnlocked) 助手
```

运行 MVP：`cd web && npm install && npm run dev`（详见 [web/README.md](../web/README.md)）。

## 后续（按 TECH_DESIGN 里程碑）

- M2 收尾：`isHumanSolvable()` 无猜测校验器 + 推理链 / Hint
- M3：轻后端（Fastify + Prisma + SQLite）、关卡/进度 API
- M5：自动生成器、每日挑战、账号 / 订阅
