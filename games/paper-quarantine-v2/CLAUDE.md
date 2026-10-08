# 纸上防疫 v2 · 开发约定

- 先读 docs/RULES_V2_DRAFT.md（规则、原型数据、待定问题）。
- 和 v1（games/paper-quarantine）完全独立：不要 import v1 的文件，也不要改 v1 来迁就 v2。
- 不加进根目录 workspaces、test:all 或 games/builds.json，除非用户决定发布 v2。
- 规则改动后跑 `npm test`；改数值时跑 `npm run sim` 看胜率、携带者数量和失控时机。
- 这个仓库有多个会话同时工作：只暂存自己改的文件，不要 `git add -A`。
