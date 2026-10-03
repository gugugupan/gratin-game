# 关卡数据结构（Level JSON Schema）

> 项目：**Gridlands · 阡陌**
> 文档版本：v1.0
> 最后更新：2026-06-13
> 配套文档：`PRD.md`、`TECH_DESIGN.md`

每一关都是一份 JSON。本文件是关卡数据的**权威定义**：前端渲染、规则引擎、求解器、关卡编辑器都以此为准。

---

## 0. 设计决策（已定稿）

| # | 决策 | 结论 |
| --- | --- | --- |
| A | cell 引用方式 | 每个 cell 有**全局唯一 `id`**（精确引用某一格）+ 可共享的 **`tags`**（按类别引用，如「所有森林」） |
| B | region 模型 | region 是**预定义的归属者容器**；谜题 = 把格子分配给这些 region，玩家不自创区域 |
| C | 覆盖规则 | 关卡级可配置 `coverage`；MVP 默认 `FULL`（所有可分配格必须归属） |
| D | 预置线索 | 支持 `fixedRegion`（开局锁定某格归属，类似数独已知数） |
| E | 多类别 | 一个 cell 的 `tags` 是数组，可同时携带多个类别（森林+金矿） |

---

## 1. 顶层结构

```jsonc
{
  "schemaVersion": 1,        // 结构版本号，升级时递增
  "id": "ch1-007",           // 关卡唯一 ID
  "name": "金矿之争",         // 关卡名（展示）
  "chapter": 1,              // 所属章节，可空
  "difficulty": 3,           // 难度分，可由校验器评估或手填
  "shapeRule": "RECT",       // 区域形状约束：RECT | ANY | SQUARE | L
  "adjacency": 4,            // 连通性定义：4 | 8（默认 4）
  "coverage": "FULL",        // FULL | PARTIAL

  "board":  { /* §2 */ },
  "regions": [ /* §4 */ ],
  "globalConstraints": [ /* §5.2 */ ],

  "solution": [ /* §6，下发客户端前剥离 */ ],
  "meta":     { /* §7 */ }
}
```

### 顶层字段

> **本地化字段（LocalizedString）**：`name` 与 `owner.name` 既可写普通字符串，也可写 `{ "zh": "…", "en": "…" }` 对象，前端按当前语言取值并回退到默认语言。地形/资源的显示名与格内短标**不存在 JSON 里**，由前端按 `tags` + 语言统一派生（见 §3）。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `schemaVersion` | int | ✓ | 当前为 `1`。结构不兼容升级时 +1 |
| `id` | string | ✓ | 全局唯一关卡标识 |
| `name` | LocalizedString | ✓ | 展示名（字符串或 `{zh,en,…}`） |
| `chapter` | int | — | 章节编号 |
| `difficulty` | int | — | 难度（建议 1~10），由 `human-solver` 评估或人工填 |
| `theme` | string | — | 关卡氛围键（页面底色、棋盘边框、故事卡插图），取值见 `web/src/components/themes.ts`；缺省 `meadow` |
| `story` | LocalizedString | — | 关卡背景故事，游玩页棋盘上方的卡片显示 |

> 第 4 章：region 可带 `facility`（`gather` 采集 / `factory` 制造），关卡可带 `product: { name, icon, goal }`（goal = 产出成品的区域）。新条件：`SUPPLIED_BY { region, tag?, value? }`（本设施挨着供料设施，且供料设施里正好 value 格 tag）、`EXCLUSIVE_TO { region }`（只挨着这一家制造设施）、`NO_TAG_WITHIN { tag, dist }`（曼哈顿距离 dist 内不能有该地形）。

> 不规则地图：`board.cells` 里缺失的 (x,y) 在界面上画成海。带 `fixedRegion` 的格子开局即归属该区域，界面上显示一面小旗。
| `shapeRule` | enum | ✓ | `RECT`(MVP) / `ANY` / `SQUARE` / `L` |
| `adjacency` | 4\|8 | — | 区域连通判定，默认 `4` |
| `coverage` | enum | ✓ | `FULL`=所有可分配格必须归属；`PARTIAL`=允许中立空地 |
| `board` | object | ✓ | 地图，见 §2 |
| `regions` | array | ✓ | 预定义区域/归属者，见 §4 |
| `globalConstraints` | array | — | 全局条件，见 §5.2 |
| `solution` | array | — | 标准答案，见 §6 |
| `meta` | object | — | 非玩法元数据，见 §7 |

---

## 2. board（地图）

```jsonc
"board": {
  "width": 3,
  "height": 3,
  "cells": [ /* §3，cell 列表，长度可少于 width*height（不规则地图留洞）*/ ]
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `width` | int | ✓ | 列数 N |
| `height` | int | ✓ | 行数 M |
| `cells` | Cell[] | ✓ | 格子列表，坐标显式（见 §3）。缺失的 (x,y) 视为「不存在的格」，支持非矩形地图 |

> 坐标原点 `(0,0)` 在左上角，`x` 向右、`y` 向下。

---

## 3. cell（格子）

```jsonc
{
  "id": 1,                       // 全局唯一编号，condition 用它精确引用
  "x": 0, "y": 0,
  "tags": ["forest", "gold"],    // 类别/属性，可共享、可多个
  "assignable": true,            // false=障碍，不可归属任何 region
  "fixedRegion": null,           // 预置线索：锁定归属某 region id；null=未锁定
  "display": {
    "bg": "#3a5",                // 背景色（十六进制）
    "label": "金",                // 文字说明（短期直接字符串，预留 i18n key）
    "sprite": null               // 贴图资源 id，现在留空，未来扩展
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | int | ✓ | **全局唯一**。条件用 `cellId` 引用它 |
| `x` / `y` | int | ✓ | 显式坐标 |
| `tags` | string[] | — | 类别集合：地形 + 资源混排，如 `forest` `lake` `mountain` `gold` `iron` … 条件用 `tag` 按类别引用 |
| `assignable` | bool | — | 默认 `true`；`false` = 障碍格，任何 region 都不能含它，也不计入 `coverage` |
| `fixedRegion` | string\|null | — | 预置线索：开局即锁定归属某 region；`null` 表示待玩家推理 |
| `display.bg` | string | — | 背景色（与语言无关，存 JSON） |
| `display.sprite` | string\|null | — | 贴图 id，**当前不渲染，仅预留** |

> 格内短标（如「金/Au」「林/F」）不再存于 `display.label`，而是前端按 cell 的主 `tag` + 当前语言派生（保证多语言一致）。

> 渲染层只读 `display`，逻辑层只读 `id/tags/assignable/fixedRegion`，两者解耦。

---

## 4. region（区域 / 归属者）

```jsonc
{
  "id": "R1",
  "owner": {
    "name": "矿业公司",
    "color": "#c33",             // 该区域格子的填充色
    "avatar": null               // 人物头像资源 id，未来扩展
  },
  "constraints": [ /* §5.1 只作用于本 region 的条件 */ ]
}
```

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | string | ✓ | region 唯一标识，被条件/答案/`fixedRegion` 引用 |
| `owner.name` | LocalizedString | ✓ | 人物/组织名（字符串或 `{zh,en,…}`） |
| `owner.color` | string | ✓ | 填充色 |
| `owner.icon` | string | — | 角色头像图标键：`farmer` `rancher` `miner` `forester` `developer` `crown` `house`；缺省回退为通用剪影 |
| `owner.avatar` | string\|null | — | 自定义头像图资源 id，**当前不渲染，仅预留** |
| `constraints` | Constraint[] | — | 仅约束本 region 的条件，见 §5.1 |

---

## 5. 条件（Constraint）

统一结构：`{ "type": <枚举>, "params": { ... } }`。

条件分两层存放：
- **region-scoped**：写在 `region.constraints` 内，隐式 `target = 该 region`。
- **global**：写在顶层 `globalConstraints` 内，跨多个 region 或针对全局。

引用方式：用 `cellId`(int) 引用某格、`tag`(string) 引用某类、`region`(string id) 引用某区域。

### 5.1 region-scoped 条件

| type | 含义 | params |
| --- | --- | --- |
| `AREA_EQ` / `AREA_GE` / `AREA_LE` | 面积 = / ≥ / ≤ K | `{ value }` |
| `AREA_MAX` / `AREA_MIN` | 面积在所有 region 中最大/最小 | — |
| `MUST_CONTAIN_CELL` | 必须包含某格 | `{ cellId }` |
| `MUST_NOT_CONTAIN_CELL` | 不能包含某格 | `{ cellId }` |
| `MUST_CONTAIN_TAG` | 必须包含某类（至少 1） | `{ tag }` |
| `MUST_NOT_CONTAIN_TAG` | 不能包含某类 | `{ tag }` |
| `TAG_COUNT_EQ/GE/LE` | 含某类格子数 = / ≥ / ≤ K | `{ tag, value }` |
| `MUST_TOUCH_TAG` | 必须接触某类地形（4-邻接） | `{ tag }` |
| `MUST_NOT_TOUCH_TAG` | 不能接触某类地形 | `{ tag }` |
| `MUST_TOUCH_REGION` | 必须与某区域相邻 | `{ region }` |
| `MUST_NOT_TOUCH_REGION` | 不能与某区域相邻 | `{ region }` |
| `MUST_ON_EDGE` | 必须触及地图边缘 | — |
| `MUST_NOT_ON_CORNER` | 不能占据地图角落 | — |

### 5.2 global 条件

| type | 含义 | params |
| --- | --- | --- |
| `AREA_LARGER_THAN` | A 面积 > B | `{ a, b }`（region id） |
| `AREA_EQUAL_TO` | A 面积 = B | `{ a, b }` |
| `DIRECTION_OF` | A 在 B 的某方位 | `{ a, b, dir }`，`dir`∈`north/south/east/west` |
| `ONLY_ONE_CONTAINS` | 全局唯一拥有某类的区域 | `{ tag }` |
| `ONLY_ONE_TOUCHES` | 全局唯一接触某类地形的区域 | `{ tag }` |

> 语义形式化（接触、方位的判定阈值）见 `TECH_DESIGN.md` §6。所有条件默认 **AND** 关系（全部满足才通关）；暂不支持 OR。

---

## 6. solution（标准答案）

```jsonc
"solution": [
  { "region": "R1", "cells": [1, 4, 5, 6] },
  { "region": "R2", "cells": [2, 3, 8, 9] }
]
```

- 用 cell `id` 列表表示每个 region 的归属。
- 供求解器/编辑器校验与生成推理链用。
- **下发给客户端前必须剥离**（防止扒答案）。通关判定在前端用规则引擎对玩家的局面跑 `validate`。

---

## 7. meta（元数据）

```jsonc
"meta": {
  "author": "manual",            // manual | generator
  "verifiedUnique": true,        // 是否过唯一解校验
  "verifiedHumanSolvable": true, // 是否过「无猜测」可解性校验
  "createdAt": "2026-06-13",
  "locale": "zh"                 // 文案语言，预留 i18n
}
```

> 发布门槛：`verifiedUnique` 与 `verifiedHumanSolvable` 必须为 `true`。

---

## 8. 完整示例（3×3，2 个 region）

```jsonc
{
  "schemaVersion": 1,
  "id": "ch1-007",
  "name": "金矿之争",
  "chapter": 1,
  "difficulty": 3,
  "shapeRule": "RECT",
  "adjacency": 4,
  "coverage": "FULL",

  "board": {
    "width": 3,
    "height": 3,
    "cells": [
      { "id": 1, "x": 0, "y": 0, "tags": ["forest","gold"], "assignable": true,  "fixedRegion": null, "display": { "bg": "#3a5", "label": "金", "sprite": null } },
      { "id": 2, "x": 1, "y": 0, "tags": ["plain"],          "assignable": true,  "fixedRegion": null, "display": { "bg": "#9c6", "label": "",  "sprite": null } },
      { "id": 3, "x": 2, "y": 0, "tags": ["plain"],          "assignable": true,  "fixedRegion": null, "display": { "bg": "#9c6", "label": "",  "sprite": null } },
      { "id": 4, "x": 0, "y": 1, "tags": ["forest"],         "assignable": true,  "fixedRegion": "R1", "display": { "bg": "#3a5", "label": "",  "sprite": null } },
      { "id": 5, "x": 1, "y": 1, "tags": ["lake"],           "assignable": false, "fixedRegion": null, "display": { "bg": "#39f", "label": "湖", "sprite": null } },
      { "id": 6, "x": 2, "y": 1, "tags": ["plain"],          "assignable": true,  "fixedRegion": null, "display": { "bg": "#9c6", "label": "",  "sprite": null } },
      { "id": 7, "x": 0, "y": 2, "tags": ["mountain"],       "assignable": true,  "fixedRegion": null, "display": { "bg": "#996", "label": "山", "sprite": null } },
      { "id": 8, "x": 1, "y": 2, "tags": ["plain"],          "assignable": true,  "fixedRegion": null, "display": { "bg": "#9c6", "label": "",  "sprite": null } },
      { "id": 9, "x": 2, "y": 2, "tags": ["plain","iron"],   "assignable": true,  "fixedRegion": null, "display": { "bg": "#9c6", "label": "铁", "sprite": null } }
    ]
  },

  "regions": [
    {
      "id": "R1",
      "owner": { "name": "矿业公司", "color": "#c33", "avatar": null },
      "constraints": [
        { "type": "MUST_CONTAIN_CELL", "params": { "cellId": 1 } },
        { "type": "MUST_NOT_CONTAIN_CELL", "params": { "cellId": 9 } }
      ]
    },
    {
      "id": "R2",
      "owner": { "name": "农业公司", "color": "#3a7", "avatar": null },
      "constraints": [
        { "type": "MUST_CONTAIN_TAG", "params": { "tag": "iron" } }
      ]
    }
  ],

  "globalConstraints": [
    { "type": "ONLY_ONE_CONTAINS", "params": { "tag": "gold" } },
    { "type": "AREA_LARGER_THAN", "params": { "a": "R1", "b": "R2" } }
  ],

  "solution": [
    { "region": "R1", "cells": [1, 2, 3, 4, 6] },
    { "region": "R2", "cells": [7, 8, 9] }
  ],

  "meta": {
    "author": "manual",
    "verifiedUnique": true,
    "verifiedHumanSolvable": true,
    "createdAt": "2026-06-13",
    "locale": "zh"
  }
}
```

> 注：cell 5（湖）`assignable:false`，是障碍，不归任何 region，也不参与全覆盖；cell 4 用 `fixedRegion:"R1"` 作为开局线索。该示例仅演示结构，未经唯一解校验。

---

## 9. 给求解器/编辑器的不变式（校验规则）

发布前，编辑器须校验关卡 JSON 满足：

1. 所有 cell `id` 唯一；所有 `(x,y)` 唯一且落在 `[0,width)×[0,height)`。
2. 所有条件引用的 `cellId` / `region` / `tag` 都存在。
3. `fixedRegion` 指向的 region 存在；被锁定的 cell `assignable` 必须为 `true`。
4. `solution` 与全部条件一致；每格至多归一个 region；`coverage=FULL` 时所有可分配格都被覆盖；区域满足 `shapeRule` 与 `adjacency` 连通性。
5. `tools/verify-levels.mjs` 通过（唯一解 + 与内置答案一致 + `tools/deduce.mjs` 只靠排除推理可解）→ 方可置 `meta.verified* = true`。
