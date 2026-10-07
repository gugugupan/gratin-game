# 纸上防疫（Paper Quarantine）

单人、两角色的纸片风防疫小游戏，线上地址 https://gratin-game.com/paper-quarantine/

- **设计与架构：[docs/DESIGN.md](docs/DESIGN.md)**（从这里看起）
- 规则：[docs/RULES.md](docs/RULES.md)
- 开发记录：[docs/PROGRESS.md](docs/PROGRESS.md)
- 平衡报告：[reports/balance.md](reports/balance.md)

在 gratin-game 仓库根目录执行：

```bash
npm run dev -w games/paper-quarantine     # http://localhost:5240
npm test -w games/paper-quarantine        # 引擎规则测试
npm run build -w games/paper-quarantine   # 构建到 dist-web/
GAMES=400 BEAM=16 npm run sim -w games/paper-quarantine   # 平衡实验 → reports/
```

开发模式下按 `N` 让 AI 代打一轮；`?cover` 会直接进入一局用来截封面。
