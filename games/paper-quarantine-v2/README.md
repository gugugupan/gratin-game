# 纸上防疫 v2（原型）

v2 规则原型："看得见的传播"（携带者沿交通线移动）+ "城市恐慌"（失控即失败），新增检查站、封城、物资补给和新闻事件。规则见 [docs/RULES_V2_DRAFT.md](docs/RULES_V2_DRAFT.md)。

这是一个**独立项目**：
- 不引用 v1（`games/paper-quarantine/`）的代码。地图数据（`engine/map.ts`）、随机数（`engine/rng.ts`）、职业和变异列表（`engine/roles.ts`）、城市坐标（`web/src/layout.ts`）都是从 v1 复制来的，之后各自演化。
- 不是根目录的 npm workspace，不在 `games/builds.json` 里，依赖装在自己的 `node_modules`，有自己的 `package-lock.json`。
- **预览部署**：两个部署流程（`.github/workflows/deploy*.yml`）在主站构建之后，各有一个"失败也继续"的可选步骤：安装依赖、跑测试、构建 v2，然后复制到 `dist/paper-quarantine-v2/`。v2 出错只会跳过这一步，不影响 v1 和主站。线上地址 https://gratin-game.com/paper-quarantine-v2/ ，不在门户列表里，页面带 `noindex`。

## 命令（在本目录下执行）

```bash
npm install
npm test          # 引擎测试
npm run check     # 试玩页类型检查
npm run sim       # 模拟：GAMES=10 BEAM=6 CFGS='[{"spawn":[0,0,0,1]}]' 可调
npm run dev       # 游戏 http://localhost:5241
```

- `web/index.html`：完整界面（从 v1 复制的纸片场景，换成 v2 引擎）：携带者立牌沿线路移动、恐慌环、封城路障、检查站、补给标签、新闻、传播阶段动画。只有中文，没有教程和存档。
- `web/playtest.html`：最早的圆点 + 线条试玩页，留作调试（http://localhost:5241/playtest.html）。
- 两个页面都用引擎默认值 `V2_CONFIG`（感染 3 级才派出、治疗每降 1 级得 1 个样本、封城可对邻城下令）。
