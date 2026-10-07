# 纸上防疫 · 设计与架构

单人、单局 10–15 分钟的合作防疫小游戏，灵感来自桌游《瘟疫危机》（名称和美术都不沿用）。玩家同时指挥两名不同职业的队员，在一张折叠的牛皮纸地图上阻止三种病毒蔓延，要在 12 轮内研制出全部解药。

- 线上地址：https://gratin-game.com/paper-quarantine/
- 规则全文：[RULES.md](RULES.md)
- 开发记录：[PROGRESS.md](PROGRESS.md)
- 平衡数据：[../reports/balance.md](../reports/balance.md)、[../reports/police.md](../reports/police.md)
- 美术提示词：[ART_PROMPTS.md](ART_PROMPTS.md)（角色）、[TOKEN_PROMPTS.md](TOKEN_PROMPTS.md)（token 和图标）

---

## 1. 玩法

### 一局的流程

1. **菜单**：俯视一张手工桌面，上面有咖啡杯、印泥、培养皿、身份证、剪刀、铅笔、胶带和折起来的地图。
2. **选人**：从 8 张"行动人员证"中任选 2 名队员。第一次玩会先推荐新手教程（见 §5「教程」）。
3. **开局**：镜头推进，地图展开，城市和 token 弹出，纸片立牌立起。开局随机给 6 座城市放上病毒，数量分别是 3/3/2/2/1/1。
4. **每一轮**：
   - **行动阶段**：两名队员共用 4 个行动点，可以任意穿插使用，也可以撤销。
   - **感染阶段**：如果本轮有流行病，先结算流行病和变异抉择；然后逐座感染 3 座城市，各放 1 个病毒，可能引发连锁爆发。
5. **结局**：研制出全部 3 种解药就获胜。以下任一情况失败：爆发达到 6 次、某一株病毒用完、12 轮结束还没研制完。最后弹出"防疫报告"。

### 玩家要做的决策

| 层级 | 决策 |
|---|---|
| 开局 | 选哪两名队员。组合差异很大，例如研究员 + 药剂师擅长研制，警察 + 急救队员擅长压制病毒 |
| 每轮 | 4 个行动点分给谁、做什么。本质是"灭火"和"攒样本研制"之间的取舍 |
| 流行病 | 把变异交给哪一株病毒，只能给还没研制出解药的。交给快要研制完的那株，伤害最小 |
| 职业能力 | 预判感染之后移走哪一座城市；取消本轮感染中的哪一座 |
| 风险阅读 | "加剧"机制会把最近感染过的城市洗回牌库顶，所以刚被感染的城市最危险，可以靠记牌来规划 |

---

## 2. 关键设计决定和理由

| 决定 | 理由 |
|---|---|
| 每轮感染 3 座城市 | 沿用原作随机抽城、记牌预判的乐趣。界面统一叫"感染城市"，不用"点名" |
| 两人**共享 4 个行动点** | 模拟中，每人 3 点共 6 点时胜率 86%，太简单；共享 4 点约 55%。共享点数还让每一点都要决定给谁用，符合"高层决策"的定位 |
| 治疗产出**样本**，样本用来研制 | 让灭火和研制挂钩，交接和研究站的位置因此变得重要 |
| 警察改为**驻守封城 + 拦截转样本** | 最初的"隔离一条边"几乎没人用：1 点治疗就能拆掉一颗雷，还能拿样本，比封边划算。模拟了 7 种封城方案后选了这个，警察胜率从 34% 回到 51% |
| 后勤官取消每轮免费移动；流行病学家的预判改为 0 点 | 前者等于多 1 个行动点，太强；后者原来太弱 |
| 变异**只能给还没研制出解药的株** | 否则一旦研制出第一种解药，变异抉择就没有意义了。AI 把 80–90% 的变异都给了已研制的株 |
| 8 名队员**自由选 2 名** | 用户决定，不随机抽候选 |
| 撤销只能撤到**新随机结果出现之前** | 进入感染阶段或预判翻牌后就锁定，保证随机结果不能被刷掉 |
| 存档连随机数状态一起保存 | 读档后结果完全一致，无法通过刷新页面重抽 |
| 开局放病毒时封城不产生样本 | 否则警察站在枢港开局就白拿样本 |

---

## 3. 平衡方法

- `sim/` 里有一个启发式 AI：用束搜索比较每轮的多种行动组合，评估局面时看爆发风险、样本进度和站位。另有随机 AI 作为下限对照。
- `npm run sim -w games/paper-quarantine` 会把 8 名队员的 28 种组合 × 多种行动点方案 × 多种难度参数各跑几百局，输出 `reports/balance.md`。
- 当前默认规则下，启发式 AI 胜率约 50%（beam 10）到 55%（beam 16）。各组合之间的标准差约 13–16 个百分点。
- 工程师（约 43%）偏弱，研究员和药剂师（约 65%）偏强。用户决定维持现状。

---

## 4. 美术

**风格**：纸片手工感。
- 场景：绿色切割垫上的牛皮纸地图。
- 人物和 token：写实手绘的立牌，带白色卡纸描边和牛皮纸背面，站立时会被风吹得轻轻摇晃。
- 界面：用纸胶带贴在屏幕边缘的纸片。
- 证件：职业卡是身份证样式，盖章表示状态。

**素材流程**：
1. 用 `docs/*_PROMPTS.md` 里的提示词，在外部 AI 工具生成整张设定图，原图放在 `art-src/`。
2. `tools/cut_lineup.py <设定图> <输出目录> <名字列表>` 抠掉白底，按连通区域切成单张，再用 `cwebp` 转成 WebP，放进 `web/public/art/`。
3. 运行时由 `art/paper.ts` 统一加白边、生成纸背（`paperCutout`）。

**代码生成的部分**：地图、桌面道具、日历、病毒托盘都是 canvas 或 three.js 程序生成的，不需要图片。

**地图**（`art/mapArt.ts`）：城市坐标是三条放射状疫区 × `MAP_SCALE`（1.8），纸张 46 × 38。
- 陆地：沿公路、铁路和城市做高斯场，再叠加两层噪声和零星小岛，用 marching squares 描海岸线和外圈等深线。
- 地貌：山脉和树林按噪声分布，避开城区和道路；河流从内陆顺着场的下降方向流向海。疫区之间用虚点画省界。
- 交通：同疫区之间是公路，中枢城市之间是铁路，疫区末端之间是海上航线（带小船）。
- 城区：每座城市有半径 `DISTRICT_R` 的街区，病毒、研究站、队员都摆在里面。
- 镜头离地图的距离按纸张宽度换算，城市在屏幕上的大小和改版前差不多；横屏再拉远 1.3 倍，竖屏不拉远。桌面道具按 `SHEET_SCALE` 等比放大，菜单构图不变；阴影相机跟着视野走。

**字体**：全部自托管（@fontsource）。
- ZCOOL XiaoWei：标题、地名。
- Noto Sans SC：正文。
- Courier Prime：数字和机读码。

---

## 5. 架构

```
games/paper-quarantine/
  engine/        纯规则引擎（TypeScript，无 DOM 依赖，带种子随机数）；tutorial.ts 是教程剧本
  sim/           AI 和批量平衡实验（Node）
  web/           游戏前端（Vite + three.js）
    src/
      app.ts       总控：模式切换、输入、行动执行、撤销、感染播放、结局
      game/        actions.ts（从引擎生成行动菜单）、save.ts（本地存档）
      scene/       stage / foldMap / props / calendar / board / standee / tokens / cameraRig
      ui/          hud / idcard / draft / actionMenu / dialog / report / rules / coach
      art/         assets.ts（加载图片和字体）、paper.ts（纸片加工）、mapArt.ts（地图绘制、城市坐标）
      tutorial/    steps.ts（教程步骤和讲解文案）、tutorial.ts（教程控制器）
      data.ts      职业、病毒株、变异的中文文案和配色
      debug.ts     开发模式专用（N 键让 AI 代打一轮；?cover 用于截封面）
    public/art/  角色、token、图标的 WebP
  art-src/       生成的原始设定图（不部署）
  tools/         切图脚本
  docs/ reports/
```

### 规则引擎（`engine/game.ts`）

- **`State`** 保存一局的全部状态：病毒（`Int8Array`）、位置、样本、研究站、牌库分段、变异位掩码、随机数状态等。
- **行动**：`legalActions()` 列出所有合法行动，`cost(a)` 计算花费，`apply(a)` 执行。
- **感染阶段分步推进**：
  - `beginInfection()` 开始，`continueInfection()` 推进。
  - 遇到玩家选择时返回 `Pending`：`mutation`（变异卡 × 可选株）或 `cancel`（本轮要感染的 3 座城市）。
  - 玩家选完后调用 `resolveMutation` / `resolveCancel`，再继续推进。
  - `endRound(chooser)` 内部就是这个流程，供模拟器同步调用。
- **事件流**：`state.events` 不为 null 时记录每一步。事件有 cube、outbreak、blocked、shielded、guarded、epidemic、intensify、mutation、named、cancelled、labExpired、round、lose。界面按顺序播放这些事件。
- **复制**：`clone()` 是给 AI 搜索用的轻量复制，不带统计；`clone(true)` 会连统计一起完整复制，用于撤销。
- **存档**：`serialize()` / `State.restore()`，带版本号。
- **测试**：`engine/game.test.ts` 共 28 项，覆盖爆发连锁、封城、突破、研究站、预判概率、分步感染、事件顺序、存档往返、教程剧本等。

### 前端数据流

```
点击立牌或身份证 → entriesFor(state, r) → 行动菜单
  → 直接执行，或进入选城市模式（board.highlight / pickCity）
  → history.push(state.clone(true)); state.apply(action)
  → refresh(): board.sync(state) + hud.render(state) + calendar.show()
  → saveGame(state)

结束行动 → state.beginInfection()
  循环：pending = continueInfection()
        playEvents(state.events) → 镜头跟到城市，逐个播放病毒落下、爆发、拦截等
        遇到 pending → 弹出 Dialog → resolveMutation / resolveCancel
  → refresh + saveGame；输赢 → Report
```

### 教程

- 剧本：`engine/tutorial.ts` 用 `State.setupScenario()` 摆出固定局面（急救队员 + 研究员，种子 1），两轮内演示移动、治疗、点名、爆发、交接、撤销、研制、流行病和变异。引擎测试会按剧本完整走一遍，确保讲解和实际结果一致。
- 步骤：`tutorial/steps.ts` 里每一步声明要显示的界面元素（`reveal`）、允许的行动（`allow`）、完成条件（`done` / `on: pan | undo | round`）或按钮。感染阶段的讲解是 `NOTES`，按事件类型匹配，各出现一次。
- 接入 `app.ts` 的位置：
  - 行动菜单只保留 `allow` 通过的项。
  - 结束行动、撤销按教程步骤放行。
  - `playEvents` 每个事件之后、`resolvePending` 之前等待讲解。
  - 教程中不写存档。
- 引导卡的位置：每步可以指定 `anchor`（DOM 元素、角色或城市）。引导卡每帧贴在目标旁边，选和顶栏、身份证、行动菜单重叠最少的一侧；没有目标时放在画面正中。
- 隐藏界面：DOM 用 `body.tut-off-<part>`（`visibility: hidden`，保留占位，镜头取景不变）；3D 用 `Board.setGroupHidden`（病毒、图钉、日历、研究站）和 `setRoleHidden`（研究员）。重新出现时有弹出动画。

### 场景

- **`Board`**：把引擎状态映射到 3D 物体：城市圆片、病毒槽位（每株 3 格，本株在城区前排，外株在两侧，带随机的呼吸和跳动）、研究站、野战实验室、感染图钉、封城路障、角色立牌（走路时跳步、翻面）。状态变化时弹出或缩回。
- **开场时间轴**：一个 0→1 的进度同时驱动地图折叠展开（`FoldMap.setFold`）、各物体按顺序弹出（`Board.setReveal`），以及界面纸片进场。
- **`CameraRig`**：在菜单俯视镜头和游戏镜头之间插值。游戏镜头的距离按顶部信息栏和底部身份证之间的空白区域计算；可以拖动平移，有边界限制，默认跟随当前角色，感染播放时跟着事件所在的城市走。
- **桌面道具**：横屏和竖屏各有一套摆放（`DeskProps.layout`）。

### 界面

- 纯 DOM 叠在 canvas 上，样式在 `styles.css`。
- 启动（`main.ts` + `loading.ts`）：加载页的样式内联在 `index.html`，在 JS 和 CSS 到达前就能显示。进度按权重累计：字体 3、每张图片 1、场景 8（`App.ready` = 地图贴图画完 + `renderer.compile`）。全部完成才淡出。
- 弹窗统一用 `Dialog`。`ActionMenu` 每帧把菜单定位到角色在屏幕上的位置旁边，靠近右边缘时翻到左侧。
- 点击城市（不在选目标时）弹出 `CityCard`：各株病毒数和离爆发还差几个、下一轮被感染的概率（`drawProbabilities`）、研究站、在场队员、相邻城市。
- "结束行动"在屏幕正中、身份证上方；点"菜单"贴纸先确认，感染结算中不能返回。
- 感染阶段逐座播放：引擎在感染每座城市前发 `infecting` 事件，镜头移过去、插图钉、顶部追加城市名，再落病毒。
- 只做中文。文案集中在 `data.ts`、`game/actions.ts`、`ui/rules.ts`。

---

## 6. 构建和部署

- 游戏是 gratin-game monorepo 的一个 npm workspace，同一个仓库里的门户页面不受影响。
  - `npm run dev -w games/paper-quarantine`：开发服务器，http://localhost:5240 ，桌面启动配置名 `paper-quarantine`。
  - `npm test -w games/paper-quarantine`：引擎测试，已加入根目录的 `test:all`。
  - `npm run build -w games/paper-quarantine`：类型检查加构建，输出到 `dist-web/`。
- `games/builds.json` 把 `paper-quarantine` 映射到 `dist-web`，根目录的 `build:all` 会把它复制到 `dist/paper-quarantine/`。推送到 `main` 后由 Cloudflare Pages 工作流部署。
- Vite 的 `base: "./"`，所有资源都用相对路径，可以部署在子目录下。
- GA 使用门户的 `VITE_GA_ID`，只在 `VITE_SITE_URL` 匹配时加载，所以本地开发不会上报。`web/.env` 提供默认值。
- 缓存：门户的 `public/_headers` 给 `/paper-quarantine/assets/*` 设置了长期缓存。
- 存档键：`paper-quarantine:save:v1`（localStorage）。门户的隐私政策已经概括说明"游戏进度保存在本地存储"。

---

## 7. 已知限制和后续方向

- 没有音效。
- 手机竖屏下地图偏小，需要多拖动；职业卡只显示精简信息。
- 浏览器标签页在后台时动画会暂停，回来后会接着播。
- 平衡上工程师偏弱，研究员和药剂师偏强，目前按用户决定维持。
- 可能的扩展：每日固定种子挑战、难度选择（流行病 3/5 张）、日文和英文。
