# 纸上防疫 v2（原型）

v2 规则原型："看得见的传播"（携带者沿交通线移动）+ "城市恐慌"（失控即失败），新增检查站、封城、物资补给和新闻事件。规则见 [docs/RULES_V2_DRAFT.md](docs/RULES_V2_DRAFT.md)。

这是一个**独立项目**：
- 不引用 v1（`games/paper-quarantine/`）的代码。地图数据（`engine/map.ts`）、随机数（`engine/rng.ts`）、职业和变异列表（`engine/roles.ts`）、城市坐标（`web/src/layout.ts`）都是从 v1 复制来的，之后各自演化。
- 不是根目录的 npm workspace，不在 `games/builds.json` 里：线上构建和部署流程完全不会碰到它。依赖装在自己的 `node_modules`，有自己的 `package-lock.json`。

## 命令（在本目录下执行）

```bash
npm install
npm test          # 引擎测试
npm run check     # 试玩页类型检查
npm run sim       # 模拟：GAMES=10 BEAM=6 CFGS='[{"spawn":[0,0,0,1]}]' 可调
npm run dev       # 试玩页 http://localhost:5241
```

试玩页用的数值是 `web/src/main.ts` 里的 `PLAYTEST`（在 `V2_CONFIG` 基础上覆盖），引擎默认值仍是草案原值。
