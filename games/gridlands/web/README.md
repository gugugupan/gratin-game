# Gridlands · 阡陌 — Web MVP（纯前端）

区域划分逻辑推理游戏 **Gridlands（阡陌）** 的 MVP。纯前端、关卡 JSON 硬编码，无后端。

## 技术栈

- React + TypeScript + Vite
- Zustand（状态）
- 渲染：CSS Grid DOM（非 Canvas）——适配点击/hover/拖拽圈选；响应式（`aspect-ratio` + `dvh` + media query），Pointer Events 统一鼠标与触控
- 零 UI 框架依赖

## 运行

```bash
cd games/gridlands/web
npm install
npm run dev      # http://localhost:5173
npm run build    # 类型检查 + 生产构建
```

## 功能

- 选择区域 → 高亮相关格（含/不含 cell、含/不含/接触 tag）
- 拖拽圈选矩形 → 分配给当前区域
- 实时条件校验面板（满足✓/未满足✗），矩形硬规则冲突格描红
- 通关判定、撤销、重置、清空区域、关卡切换
- 支持 `fixedRegion` 预置线索、`assignable:false` 障碍格
- **多语言（中文 / English）**：界面 + 关卡内容（关卡名/角色名/地形名/条件描述）全本地化，自建轻量 i18n（`src/i18n/`），语言选择存 localStorage

## 目录

```
web/src/
  core/engine.js     # 规则引擎（纯 ESM，前端 + node 验证共用）；类型见 engine.d.ts
  state/store.ts     # Zustand store + validate 桥接
  levels.ts          # 从 ../../levels/*.json 编译期打包关卡
  components/        # Board / Cell / RegionList / ConditionPanel / Toolbar
```

## 关卡

关卡 JSON 在仓库根的 [`levels/`](../levels)，结构定义见 [`document/LEVEL_SCHEMA.md`](../document/LEVEL_SCHEMA.md)。

验证所有关卡为「唯一解」且与内置答案一致：

```bash
node ../tools/verify-levels.mjs
```
