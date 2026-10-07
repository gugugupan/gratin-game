# Token 提示词（纸上防疫）

和角色立绘用同一种画风生成游戏里的 token。生成好的图片和角色立绘一样处理：抠白底、加白色卡纸描边、切图、转 WebP，再接入游戏。

## Token 清单

### 一、地图上的 token（必需）

| # | 文件名 | 名称 | 用途 | 摆放方式 | 数量 |
|---|---|---|---|---|---|
| 1 | `station.webp` | 研究站 | 永久研究站，可研制解药、快速转移 | 立牌（立在城市旁） | 最多 3 |
| 2 | `field_lab.webp` | 野战实验室 | 工程师部署，持续 2 轮 | 立牌 | 1 |
| 3 | `lockdown.webp` | 封城路障 | 警察驻守封城，跟着警察移动 | 立牌（立在警察脚边） | 1 |
| 4 | `virus_red.webp` | 赤株病毒 | 城市里的病毒，一个城市最多叠 3 个 | 平放，可叠放 | 16 |
| 5 | `virus_blue.webp` | 苍株病毒 | 同上 | 平放，可叠放 | 16 |
| 6 | `virus_gold.webp` | 金株病毒 | 同上 | 平放，可叠放 | 16 |
| 7 | `outbreak.webp` | 爆发标记 | 城市爆发时弹出的特效贴纸，片刻后消失 | 平放 | 特效 |
| 8 | `named_pin.webp` | 点名图钉 | 本轮被点名的城市插一枚小旗图钉 | 立牌（小） | 3 |

数量列是同时可能出现的上限，同一张图会重复使用，每种只需要生成一张。

### 二、界面和身份证上的图标（建议同一批生成，风格统一）

| # | 文件名 | 名称 | 用途 |
|---|---|---|---|
| 9 | `sample_red.webp` | 赤株样本管 | 身份证上的样本数量、交接动画 |
| 10 | `sample_blue.webp` | 苍株样本管 | 同上 |
| 11 | `sample_gold.webp` | 金株样本管 | 同上 |
| 12 | `cure_red.webp` | 赤株解药瓶 | 顶部的解药进度；研制成功时的动画 |
| 13 | `cure_blue.webp` | 苍株解药瓶 | 同上 |
| 14 | `cure_gold.webp` | 金株解药瓶 | 同上 |
| 15 | `mut_breach.webp` | 突破 | 变异徽章：每轮无视 1 次封城 |
| 16 | `mut_resistant.webp` | 耐药 | 变异徽章：研制多需 1 个样本 |
| 17 | `mut_virulent.webp` | 烈性 | 变异徽章：已有病毒的城市被点名时放 2 个 |
| 18 | `mut_stubborn.webp` | 顽固 | 变异徽章：全清效果无效 |
| 19 | `mut_acute.webp` | 急性 | 变异徽章：2 个病毒就会爆发 |
| 20 | `epidemic.webp` | 流行病 | 流行病发生时弹出的卡片插图 |

**图里不放文字，汉字由游戏代码叠加。**原因是生成工具写中文经常出错，代码里改文字也更方便。根除印章、行动中印章这类带字的东西都由代码绘制，不在清单里。

## 用法

和立绘一样，推荐一次生成整张设定图，再切成单张。

1. **地图 token**：「A. 风格总述」+「B1. 地图 token 设定表」→ 一张 2×4 的图，8 个物件。
2. **图标**：「A」+「B2. 图标设定表」→ 一张 3×4 的图，12 个物件。
3. 物件之间要留足白色间距，切图脚本按空白来分割。
4. 某个物件不满意时，用「A」+「C」里对应的单条描述单独重画。
5. 反向提示词用「D」。

## 交付规格

| 项 | 要求 |
|---|---|
| 设定图 | 横版 16:9 或更宽，物件之间留白不少于物件宽度的 1/3 |
| 平放 token | 俯视角，正上方看下去，物件撑满一个近似圆形或方形的范围 |
| 立牌 token | 正面略带俯视（约 15°），底边平整，好让它"站"在地图上 |
| 背景 | 纯白（#FFFFFF），没有地面阴影 |
| 顺序 | 从左到右、从上到下，和设定表的编号一致 |
| 放置 | 原图放 `art-src/`，告诉我文件名 |

---

## A. 风格总述（每次都放在最前面）

```
Semi-realistic hand-painted illustration of a single small object, game token
art. Gouache and colored pencil rendering with visible brush texture, as if
printed on matte cardstock, subtle paper grain. Soft even studio lighting from
the upper left, gentle form shading, no dramatic shadows. Muted, earthy,
slightly desaturated palette matching kraft paper: brick red #C4472F,
deep navy #34466E, moss green #5B7D4A, ochre #C9951A, teal #3D7A7A,
plum #7A5A8C, warm cream #F5F1E8. Clean, readable silhouette suitable for a
die-cut paper token. Plain pure white background, no ground shadow,
no text, no letters, no numbers, no frame, no scenery.
```

## B1. 地图 token 设定表（2 行 × 4 列）

```
A sheet of 8 separate game token objects arranged in a grid of two rows and
four columns, same lighting, generous white space between every object so each
can be cut out individually, numbered left to right, top to bottom:
1. A small field clinic building, front view from slightly above: cream walls,
   brick-red gabled roof, a white door and a small red cross sign above it,
   flat base.
2. A compact field laboratory tent, front view from slightly above: moss-green
   canvas tent with the front flap tied open, a folding table inside with
   test tubes and a microscope, guy ropes and pegs, flat base.
3. A short police barricade, front view: a wooden sawhorse barrier with
   diagonal yellow-and-black stripes and a small red warning lamp on top,
   flat base.
4. A single virus particle seen from directly above: round spiky sphere with
   short club-shaped protein spikes, brick red #C4472F with lighter highlights,
   fills a circle.
5. The same virus particle design seen from directly above, deep blue-teal
   #2F6D8C.
6. The same virus particle design seen from directly above, ochre gold
   #C9951A.
7. An outbreak burst seen from above: a jagged starburst splash of brick red
   and ochre with small flying droplets, like a torn paper explosion.
8. A map pushpin with a tiny triangular brick-red pennant flag, front view
   from slightly above, the pin standing upright.
```

## B2. 图标设定表（3 行 × 4 列）

```
A sheet of 12 separate game icon objects arranged in a grid of three rows and
four columns, same scale, same lighting, generous white space between every
object so each can be cut out individually, numbered left to right, top to
bottom, each object upright and seen from the front:
1. A small corked glass sample test tube half filled with brick red liquid.
2. The same sample test tube with deep blue-teal liquid.
3. The same sample test tube with ochre gold liquid.
4. A small glass vaccine vial with a metal crimp cap and a blank paper label,
   brick red liquid.
5. The same vaccine vial with deep blue-teal liquid.
6. The same vaccine vial with ochre gold liquid.
7. A round paper badge showing a broken chain link.
8. A round paper badge showing a capsule pill behind a small shield.
9. A round paper badge showing two small virus particles with a flame.
10. A round paper badge showing a virus particle gripping onto a small anchor.
11. A round paper badge showing a lightning bolt over a virus particle.
12. An illustrated card showing a map with spreading red circles and an
    alarm bell, portrait orientation, cream card stock with rounded corners.
```

## C. 单项描述（单独重画时，接在 A 后面）

```
Single object only. A small field clinic building, front view from slightly above: cream walls, brick-red gabled roof, a white door and a small red cross sign above it, flat base.
```
```
Single object only. A compact field laboratory tent, front view from slightly above: moss-green canvas tent with the front flap tied open, a folding table inside with test tubes and a microscope, guy ropes and pegs, flat base.
```
```
Single object only. A short police barricade, front view: a wooden sawhorse barrier with diagonal yellow-and-black stripes and a small red warning lamp on top, flat base.
```
```
Single object only. A single virus particle seen from directly above: round spiky sphere with short club-shaped protein spikes, brick red #C4472F with lighter highlights, centered, fills a circle. (Change the color to #2F6D8C or #C9951A for the other two strains.)
```
```
Single object only. An outbreak burst seen from above: a jagged starburst splash of brick red and ochre with small flying droplets, like a torn paper explosion, centered.
```
```
Single object only. A map pushpin with a tiny triangular brick-red pennant flag, front view from slightly above, the pin standing upright.
```
```
Single object only. A small corked glass sample test tube half filled with brick red liquid, upright, front view. (Change the liquid to deep blue-teal or ochre gold for the other two.)
```
```
Single object only. A small glass vaccine vial with a metal crimp cap and a blank paper label, brick red liquid, upright, front view. (Change the liquid to deep blue-teal or ochre gold for the other two.)
```
```
Single object only. A round cream paper badge with a thin brick-red rim, showing [a broken chain link | a capsule pill behind a small shield | two small virus particles with a flame | a virus particle gripping onto a small anchor | a lightning bolt over a virus particle], front view, centered.
```
```
Single object only. An illustrated game card, portrait orientation, cream card stock with rounded corners, showing a small map with spreading red circles and an alarm bell, front view.
```

## D. 反向提示词

```
chibi, cute, kawaii, cartoon, anime, 3D render, glossy plastic, neon, black outlines,
comic line art, harsh shadows, ground shadow, background scenery, text, letters,
numbers, logo, watermark, frame, border, multiple objects merged together,
overlapping objects, cropped object
```

---

## 中文版风格总述（给即梦、通义万相等中文模型）

```
半写实手绘插画，单个小物件，桌游 token 美术。水粉加彩铅的质感，能看到笔触，
像印在哑光卡纸上，带细微纸纹。左上方柔和的影棚光，轻微体积感，没有强烈阴影。
低饱和、偏大地色的配色，适合放在牛皮纸上：砖红、深海军蓝、苔绿、赭黄、青绿、梅紫、暖米白。
轮廓清晰，适合做成模切纸片。纯白背景，没有地面阴影，没有文字、字母、数字，没有边框，没有场景。
```

中文模型通常不擅长在一张图里排列很多物件，建议用「C」逐个生成。

## 接入时会做的处理（图片到位后实现）

- 用 `tools/cut_lineup.py` 抠白底、按空白切图，例如：

  ```
  python tools/cut_lineup.py art-src/tokens-map.png web/public/art station,field_lab,lockdown,virus_red,virus_blue,virus_gold,outbreak,named_pin
  ```

- 平放 token 做成带白边的薄纸片，叠放时每层错开一点角度。
- 立牌 token 和角色一样加白边、纸背，也会被风吹得轻轻摇晃。
- 爆发标记做成弹出再淡出的特效；点名图钉在每轮点名时插下去。
