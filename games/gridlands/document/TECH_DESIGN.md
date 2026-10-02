# 技术方案（Technical Design）

> 项目：**Gridlands · 阡陌**
> 文档版本：v1.0
> 最后更新：2026-06-13
> 配套文档：`PRD.md`

---

> **实现现状（As-built，MVP）** —— 本文档描述的是目标方案；当前已落地的与之有意偏差：
> - **未做 monorepo / 后端 / 数据库**：MVP 是单个 Vite 前端应用（`web/`），规则引擎以纯 JS 模块 `web/src/core/engine.js` 形式存在（前端 + node 校验脚本共用），尚未抽成 `@rlp/core` 独立包。
> - **路由**：用 react-router `HashRouter`（三页：介绍 / 关卡列表 / 游玩）。
> - **进度**：存浏览器 `localStorage`（key `rlp-progress`），顺序解锁；后端/账号方案见下文，尚未实现。
> - **渲染**：棋盘用 CSS Grid DOM（非 Canvas）。
> 详细的当前结构与约定见项目根 `CLAUDE.md`。下面的 Server/数据库/Monorepo 章节为后续目标。

## 1. 总体目标

- **网页版游戏**：浏览器内即玩（桌面 + 移动端），无需安装。
- **轻量 Server 端**：当前只需最小可用，但数据模型要为未来扩展预留空间——能保存**关卡数据、用户数据、订阅数据、游玩进度/成绩**等。
- 核心逻辑（求解器/校验器）可在前后端复用（同一套规则定义）。

设计原则：**前端先行、后端最小、规则共享、数据可扩展**。

---

## 2. 总体架构

```
┌─────────────────────────────────────────────┐
│                  浏览器 (Web)                  │
│  ┌──────────────┐   ┌─────────────────────┐  │
│  │  游戏 UI 层   │   │  规则/校验引擎(共享)  │  │
│  │ (React+Canvas)│←→ │  rules / validator   │  │
│  └──────────────┘   └─────────────────────┘  │
│           │  HTTP/JSON (REST)                  │
└───────────┼─────────────────────────────────┘
            ▼
┌─────────────────────────────────────────────┐
│            Server 端 (Node + Fastify)          │
│  路由层 → 服务层 → 数据访问层(Repository)        │
│  ┌──────────────┐  ┌────────────────────────┐ │
│  │ 关卡/进度/用户 │  │  规则/校验引擎(同一份代码) │ │
│  │   API         │  │  用于发布前校验关卡       │ │
│  └──────────────┘  └────────────────────────┘ │
│           │                                    │
└───────────┼────────────────────────────────────┘
            ▼
   ┌─────────────────────┐
   │   数据库 (SQLite →    │
   │   PostgreSQL 可平滑迁移)│
   └─────────────────────┘
```

要点：

- **规则引擎是独立的 TS 包**（`packages/core`），前端运行它做「实时校验/通关判定」，后端运行它做「关卡发布前的唯一解/可解性校验」。一套代码，杜绝前后端规则不一致。
- 前后端之间是普通 REST + JSON，无强耦合。
- 数据库从 SQLite 起步（零运维），ORM 抽象保证可平滑迁移到 PostgreSQL。

---

## 3. 技术栈选型

| 层 | 选型 | 理由 |
| --- | --- | --- |
| 前端框架 | **React + TypeScript + Vite** | 生态成熟、构建快、TS 与核心包共享类型 |
| 渲染 | **Canvas 2D**（或 PixiJS，后续） | 网格/区域绘制频繁，Canvas 性能与控制力优于 DOM |
| 状态管理 | **Zustand** | 轻量，适合棋盘类局部状态 |
| 样式 | Tailwind CSS | 快速搭 UI |
| 核心包 | **TypeScript 纯逻辑包** `@rlp/core` | 规则、数据模型、求解器、校验器，前后端共用 |
| 后端 | **Node.js + Fastify + TypeScript** | 轻量高性能，与前端同语言，复用 `@rlp/core` |
| ORM | **Prisma** | 类型安全、迁移友好，SQLite↔PostgreSQL 切换简单 |
| 数据库 | **SQLite（MVP）→ PostgreSQL（增长后）** | 起步零运维，后期可扩展 |
| 鉴权（后续） | JWT + 第三方登录（Apple/Google） | MVP 可先匿名 deviceId |
| 部署 | 前端静态托管（Vercel/Netlify/CDN）+ 后端容器（Fly.io/Render/自建） | 简单、成本低 |

> 全栈 TypeScript 的最大收益：**数据模型与规则定义只写一次**，前端、后端、关卡编辑器全部 import 同一份。

---

## 4. 仓库结构（Monorepo）

采用 pnpm workspace monorepo，便于共享核心包。

```
region-logic-puzzle/
├── document/                # 文档（PRD、技术方案、README）
├── packages/
│   ├── core/                # @rlp/core 纯逻辑：模型 + 规则 + 求解器 + 校验器
│   │   ├── src/
│   │   │   ├── model.ts          # Board/Cell/Region/Constraint 类型
│   │   │   ├── constraints/      # 各条件的求值实现
│   │   │   ├── validator.ts      # 校验某个解是否满足全部条件
│   │   │   ├── solver.ts         # 枚举/CSP 求解，判定唯一解
│   │   │   ├── human-solver.ts   # 「无猜测」可解性验证 + 难度评估
│   │   │   └── generator.ts      # 关卡自动生成（M5）
│   │   └── package.json
│   └── ...
├── apps/
│   ├── web/                 # React 前端
│   │   └── src/
│   │       ├── render/           # Canvas 渲染
│   │       ├── state/            # Zustand store
│   │       ├── components/       # UI 组件（条件面板、组织选择等）
│   │       └── api/              # 调用后端的 client
│   └── server/              # Fastify 后端
│       └── src/
│           ├── routes/           # REST 路由
│           ├── services/         # 业务逻辑
│           ├── repositories/     # 数据访问（Prisma）
│           └── prisma/schema.prisma
├── package.json
└── pnpm-workspace.yaml
```

> MVP 阶段也可先只建 `apps/web` + `packages/core`，后端在 M2/M3 引入。

---

## 5. 核心数据模型（`@rlp/core`）

> 关卡数据以 JSON 落盘，其**权威定义见 `LEVEL_SCHEMA.md`**。下面是与之一一对应的 TypeScript 类型（前后端 import 同一份）。要点：cell 有唯一 `id`（精确引用）+ 可共享 `tags`（按类别引用）；region 是预定义归属者；条件分 region-scoped 与 global 两层。

```ts
type Tag = string; // 地形+资源混排：'forest' | 'lake' | 'mountain' | 'gold' | 'iron' ...

interface CellDisplay { bg?: string; label?: string; sprite?: string | null; }

interface Cell {
  id: number;                // 全局唯一编号，condition 用它精确引用
  x: number; y: number;
  tags: Tag[];               // 类别集合，可多个、可共享
  assignable: boolean;       // false=障碍，不可归属任何 region
  fixedRegion: string | null;// 预置线索：锁定归属某 region id
  display?: CellDisplay;     // 仅渲染层读取
}

interface Board {
  width: number; height: number;
  cells: Cell[];             // 显式坐标，长度可 < w*h（支持不规则地图）
}

interface RegionDef {        // 预定义的归属者容器
  id: string;
  owner: { name: string; color: string; avatar?: string | null };
  constraints: Constraint[]; // region-scoped，隐式 target=本 region
}

type ConstraintType =
  // region-scoped
  | 'AREA_EQ' | 'AREA_GE' | 'AREA_LE' | 'AREA_MAX' | 'AREA_MIN'
  | 'MUST_CONTAIN_CELL' | 'MUST_NOT_CONTAIN_CELL'
  | 'MUST_CONTAIN_TAG' | 'MUST_NOT_CONTAIN_TAG'
  | 'TAG_COUNT_EQ' | 'TAG_COUNT_GE' | 'TAG_COUNT_LE'
  | 'MUST_TOUCH_TAG' | 'MUST_NOT_TOUCH_TAG'
  | 'MUST_TOUCH_REGION' | 'MUST_NOT_TOUCH_REGION'
  | 'MUST_ON_EDGE' | 'MUST_NOT_ON_CORNER'
  // global
  | 'AREA_LARGER_THAN' | 'AREA_EQUAL_TO' | 'DIRECTION_OF'
  | 'ONLY_ONE_CONTAINS' | 'ONLY_ONE_TOUCHES';

interface Constraint {
  type: ConstraintType;
  params?: Record<string, unknown>; // { value, cellId, tag, a, b, dir ... }
}

// 一关的完整定义
interface Level {
  schemaVersion: number;
  id: string;
  name: string;
  chapter?: number;
  difficulty?: number;
  shapeRule: 'RECT' | 'ANY' | 'SQUARE' | 'L';  // MVP: RECT
  adjacency?: 4 | 8;                            // 默认 4
  coverage: 'FULL' | 'PARTIAL';
  board: Board;
  regions: RegionDef[];
  globalConstraints?: Constraint[];
  solution?: Array<{ region: string; cells: number[] }>; // 下发前剥离
  meta?: { author?: string; verifiedUnique?: boolean; verifiedHumanSolvable?: boolean; createdAt?: string; locale?: string };
}

// 求解/校验时的运行态：一个区域 = 一组 cell id + 所属 region
interface Region { regionId: string; cells: number[]; }
// 玩家当前局面：cellId -> regionId
type Assignment = Map<number, string>;
```

---

## 6. 规则校验引擎（前后端共用）

```ts
// 单个解是否满足全部条件
function validate(level: Level, regions: Region[]): {
  ok: boolean;
  results: Array<{ constraint: Constraint; satisfied: boolean; reason?: string }>;
};
```

- 每种 `ConstraintType` 对应一个纯函数 `evaluate(level, regions, constraint) -> bool`。
- 前端在玩家每次操作后调用 `validate`，把每条结果回填到条件面板（满足/冲突高亮）。
- 同时检查硬规则：连通性、唯一归属、形状约束、覆盖要求。
- 当 `ok === true` 且覆盖要求满足 → 通关。

**方位/接触的形式化定义**（消除歧义）：

- 接触/相邻：区域内任一格与目标格 4-邻接（曼哈顿距离=1）。
- `DIRECTION_OF(a, b, 'north')`：a 的质心 y < b 的质心 y（屏幕坐标 y 向下，北=上）；东西同理用 x。可加最小差值阈值避免「几乎齐平」歧义（建议阈值=0，严格小于即可，生成时保证非歧义）。

---

## 7. 求解器与唯一解判定（后端发布校验）

```ts
function solve(level: Level, opts?: { maxSolutions?: number }): Region[][];
function isUniqueSolution(level: Level): boolean; // solve(maxSolutions=2).length === 1
```

实现思路（MVP，矩形 + 小地图，规模可暴力）：

1. **候选枚举**：矩形区域候选 = 所有 `(x1,y1,x2,y2)` 组合，先用「包含/排除/面积/障碍」条件过滤掉非法矩形。
2. **组合搜索**：把候选矩形分配给各组织，做带剪枝的回溯（DFS）：
   - 互不重叠、满足覆盖要求、满足全部条件。
3. **唯一解判定**：找到第 2 个解即可提前停止 → 非唯一。
4. 规模控制：MVP 地图 ≤ 7×7、组织 ≤ 2、矩形约束 → 搜索空间可接受。
5. 长期：地图变大或开放任意形状时，迁移到 **CSP/SAT** 编码（如 z3 / MiniSat / 自研约束传播），把「格子∈区域」建模为变量。

---

## 8. 「无猜测」人类可解性验证器

唯一解 ≠ 无需猜测。需单独验证关卡能否仅靠「强制单步推导」解出。

```ts
function isHumanSolvable(level: Level): {
  solvable: boolean;        // 是否无需假设回溯即可解
  steps: DeductionStep[];   // 推理链（用于通关解说 & Hint）
  difficulty: number;       // 由步数/分支因子综合评分
};
```

算法（约束传播 / propagation）：

1. 维护每个格子的「可能归属集合」（含「未分配」）。
2. 反复应用推导规则：若某条件能**强制**排除某格的某种可能（如「面积=6 且已确定 5 格，唯一连通扩展只剩此格」），则缩小可能集。
3. 若不再有任何强制推导，但仍未完全确定 → 该关**需要猜测**，判定 `solvable=false`。
4. 全部格子归属唯一确定 → `solvable=true`，记录推导链 `steps`。
5. **难度**由：推导步数、平均分支因子、用到的条件类型权重综合给出。

> 这一验证器同时产出 PRD §7 要求的「可解释推理链」与 §5.3 的 Hint。

---

## 9. 关卡自动生成（M5）

```
生成地图(随机+主题模板)
 → 随机生成一组合法区域作为答案
 → 由答案反推候选条件集合
 → 选取条件子集，使 isUniqueSolution() 成立
 → 用 isHumanSolvable() 过滤掉需猜测的关卡
 → 用最小条件集（去掉冗余条件仍唯一解）
 → difficulty 分级 → 入库 → 发布
```

- 反推条件：从答案直接读出各区域真实面积/包含/邻接等，作为候选条件池。
- 最小化：贪心删除条件，只要删后仍唯一解+可解就删，得到「优雅」关卡。
- MVP 阶段不做生成器，先用 §7/§8 做**校验器**保障手工关卡质量。

---

## 10. Server 端设计

### 10.1 职责（按阶段）

| 阶段 | Server 职责 |
| --- | --- |
| MVP | 提供关卡列表/详情（也可先纯静态 JSON）、保存玩家进度（匿名 deviceId） |
| 成长期 | 用户账号、每日挑战发布、成绩/排行、提示次数 |
| 商业化 | 订阅/内购校验、章节解锁权限 |

### 10.2 数据模型（Prisma，预留扩展）

```prisma
model Level {
  id          String   @id @default(cuid())
  chapter     Int?
  difficulty  Int?
  shapeRule   String                    // RECT / ANY ...
  data        Json                      // 完整 Level 定义（board/orgs/constraints/solution）
  status      String   @default("draft") // draft / published
  isDaily     Boolean  @default(false)
  publishDate DateTime?                  // 每日挑战发布日
  createdAt   DateTime @default(now())
  progresses  Progress[]
}

model User {
  id          String   @id @default(cuid())
  deviceId    String?  @unique           // MVP 匿名标识
  email       String?  @unique           // 后续账号
  authProvider String?                   // apple / google ...
  createdAt   DateTime @default(now())
  progresses  Progress[]
  subscription Subscription?
}

model Progress {
  id         String   @id @default(cuid())
  userId     String
  levelId    String
  status     String   @default("in_progress") // in_progress / completed
  assignment Json?                       // 玩家当前局面（断点续玩）
  timeMs     Int?                        // 用时
  hintsUsed  Int      @default(0)
  completedAt DateTime?
  user  User  @relation(fields: [userId], references: [id])
  level Level @relation(fields: [levelId], references: [id])
  @@unique([userId, levelId])
}

model Subscription {
  id         String   @id @default(cuid())
  userId     String   @unique
  plan       String                      // free / premium
  status     String                      // active / expired / canceled
  platform   String?                     // apple / google / stripe
  expiresAt  DateTime?
  raw        Json?                       // 原始收据/回调数据
  user User @relation(fields: [userId], references: [id])
}
```

> 关卡用 `data Json` 存整份 Level，灵活应对规则演进；查询字段（chapter/difficulty/isDaily）单独建列以便索引。

### 10.3 API 草案（REST / JSON）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/levels` | 关卡列表（按章节/分页，不含 solution） |
| GET | `/api/levels/:id` | 关卡详情（下发时剥离 `solution`） |
| GET | `/api/daily` | 当日每日挑战 |
| POST | `/api/users/anon` | 创建/获取匿名用户（deviceId） |
| GET | `/api/progress?levelId=` | 读取进度（断点续玩） |
| PUT | `/api/progress/:levelId` | 保存进度 / 标记完成 |
| GET | `/api/me/subscription` | 查询订阅状态（后续） |
| POST | `/api/admin/levels/validate` | 内部：校验关卡唯一解+可解性 |
| POST | `/api/admin/levels` | 内部：发布关卡 |

安全要点：

- **答案不下发**：`GET /levels/:id` 永远剥离 `solution`，通关判定在前端用规则引擎做（无解题价值的答案不暴露）。每日挑战防作弊可在服务端二次校验提交的解。
- MVP 用 deviceId 匿名；账号化后加 JWT。
- 订阅校验走服务端验票（Apple/Google/Stripe 回调），不信任客户端。

---

## 11. 前端关键设计

- **渲染**：Canvas 画网格、地形图标、资源标记、区域填充（半透明组织色）、笔记三态、冲突高亮。
- **交互**：拖拽形成矩形（MVP），实时预览；松手后调用 `validate` 更新条件面板。
- **状态**：Zustand 管理 `assignment`、`marks`、`selectedOrg`、撤销/重做栈。
- **离线优先**：MVP 关卡可打包进前端或首屏拉取后缓存，无网也能玩；进度本地存 + 有网时同步。

---

## 12. 里程碑（技术视角）

| 阶段 | 交付 | 关键技术任务 |
| --- | --- | --- |
| M1 | 可玩原型（纯前端） | `@rlp/core` 模型+`validate`；Canvas 渲染；矩形圈选；通关判定 |
| M2 | 校验器 | `solve`/`isUniqueSolution`/`isHumanSolvable`；推理链输出 |
| M3 | MVP 关卡包 + 轻后端 | 手工 10~20 关过校验；Fastify + Prisma + SQLite；关卡/进度 API |
| M4 | 内测打磨 | Hint、引导、难度曲线、移动端适配 |
| M5 | 生成器 + 每日挑战 + 账号/订阅 | `generator`；每日挑战发布；用户/订阅；可迁移 PostgreSQL |

---

## 13. 待决策技术点

| 议题 | 选项 | 倾向 |
| --- | --- | --- |
| 渲染引擎 | Canvas 2D vs PixiJS | MVP 用 Canvas 2D，复杂动效再上 Pixi |
| 求解器实现 | 暴力回溯 vs SAT/CSP | MVP 暴力（规模小），地图变大再上 CSP |
| 数据库 | SQLite vs PostgreSQL | 起步 SQLite，增长后迁移 |
| 是否 monorepo | 单仓 vs 多仓 | 单仓 pnpm workspace，便于共享 core |
| MVP 是否要后端 | 纯静态 vs 带后端 | 玩法验证可纯前端；进度保存需求出现即引入轻后端 |
