# 纸上防疫 · 开发约定

- 先读 docs/DESIGN.md。规则改动以 engine/ 为准，改完跑 `npm test -w games/paper-quarantine`；涉及数值时再跑一次 sim 看胜率。
- engine/ 不依赖 DOM，模拟器和游戏共用；界面文案只做中文。
- 新素材按 docs/*_PROMPTS.md 生成，原图放 art-src/（不部署），用 tools/cut_lineup.py 切图后转 WebP 放 web/public/art/。
- 这个仓库有多个会话同时工作：只暂存自己改的文件，不要 `git add -A`。
