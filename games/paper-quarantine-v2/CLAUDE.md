# 纸上防疫 v2 · 开发约定

- 先读 docs/RULES_V2_DRAFT.md（规则、原型数据、待定问题）。
- 和 v1（games/paper-quarantine）完全独立：不要 import v1 的文件，也不要改 v1 来迁就 v2。
- 不加进根目录 workspaces、test:all、games/builds.json 或门户 src/games.json。它通过部署流程里的可选步骤发布到 /paper-quarantine-v2/（只能通过链接访问）；推送到 main 就会更新线上预览，需要用户同意。
- 规则改动后跑 `npm test`；改数值时跑 `npm run sim` 看胜率、携带者数量和失控时机。
- 这个仓库有多个会话同时工作：只暂存自己改的文件，不要 `git add -A`。
