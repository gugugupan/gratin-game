# 角色立绘提示词（纸上防疫）

用同一套提示词生成 8 名队员的立绘，保证风格统一。生成好的图片放进 `web/public/art/` 后，再由我接入游戏（接入方式见文末）。

> v2（2026-10-07）：v1 的 Q 版结果太可爱，改成写实人体比例的半写实手绘插画。

## 用法

1. **一次出全套**：把「A. 风格总述」和「B. 角色设定表」拼在一起，作为一条提示词，生成一张 8 人设定图。风格一致性最好，适合先定调。
2. **单张精修**：确定风格后，用「A. 风格总述」加「C. 单角色描述」中的一条，逐个生成高清单图。工具支持风格参考或种子的话，就固定同一张参考图（比如第 1 步的设定图）或同一个种子。
3. **反向提示词**：工具支持的话，把「D」放进反向提示词栏；不支持就把它接在提示词末尾，写成 "Avoid: ..."。
4. 如果结果还是偏卡通，可以换成「A2」（剪纸拼贴写实版）或「A3」（照片写实版）再试。

## 交付规格

| 项 | 要求 |
|---|---|
| 比例 | 竖版 1:2，单图建议 1024×2048；工具不支持时用 2:3 |
| 构图 | 全身、正面略带一点角度、自然站立；人物居中，脚底在画面高度约 95% 处，头顶留白约 4% |
| 背景 | 纯白（#FFFFFF）或透明 PNG，不要地面阴影 |
| 统一 | 写实成人比例（约 7.5 头身），8 人的身高、光线方向、画风一致 |
| 文件名 | `medic.png` `researcher.png` `police.png` `epidemiologist.png` `engineer.png` `logistics.png` `officer.png` `pharmacist.png` |
| 放置 | `web/public/art/` |

---

## A. 风格总述（推荐，每次都放在最前面）

```
Semi-realistic hand-painted illustration of an adult professional, full body,
standing naturally, front view with a slight three-quarter turn, centered.
Realistic human anatomy and proportions (about 7.5 heads tall), believable
face with natural features and a calm, competent expression, realistic hands.
Gouache and colored pencil rendering with visible brush texture, as if
printed on matte cardstock, subtle paper grain. Soft even studio lighting from
the upper left, gentle form shading, no dramatic shadows. Muted, earthy,
slightly desaturated palette that sits well on kraft paper: brick red #C4472F,
deep navy #34466E, moss green #5B7D4A, ochre #C9951A, teal #3D7A7A,
plum #7A5A8C, warm cream #F5F1E8. Realistic work clothing with fabric folds
and believable materials. Clean, readable silhouette suitable for a die-cut
paper standee. Plain pure white background, no ground shadow, no text,
no frame, no scenery.
```

### A2. 备选：剪纸拼贴写实版

想保留更多纸艺感时用：

```
Realistic adult figure built as a layered cut-paper collage, full body,
standing naturally, front view, centered. Realistic human proportions
(about 7.5 heads tall) and natural facial features. Each garment and body
part is a separately cut piece of real textured paper (card stock, kraft,
tissue, printed paper), with thin soft shadows between layers and visible
paper fibers. Muted earthy palette (brick red, deep navy, moss green, ochre,
teal, plum, warm cream). Soft studio light. Plain pure white background,
no ground shadow, no text.
```

### A3. 备选：照片写实版

想要接近真人照片时用：

```
Photorealistic full-body studio photo of an adult professional standing
naturally, front view, centered, realistic proportions, natural skin texture,
realistic work uniform with fabric detail, soft even studio lighting,
shot on a 50mm lens at eye level, muted color grading. Isolated on a plain
pure white seamless background, no ground shadow, no text.
```

## B. 角色设定表（一次生成 8 人时，接在 A 后面）

年龄和性别是建议，可以自由改动。

```
A lineup of 8 different adult professionals standing side by side in two
rows of four, same scale, same lighting, evenly spaced with clear white space
between them so each can be cut out individually:
1. Paramedic, man in his 30s: white rescue helmet with a small red cross,
   white and red paramedic jacket with reflective silver-and-yellow bands,
   stethoscope around the neck, dark navy cargo trousers, work boots,
   carrying a red first-aid bag with a white cross.
2. Lab researcher, woman in her 40s: short black bob, safety goggles pushed
   up on the forehead, knee-length white lab coat over a moss-green shirt and
   dark green tie, pens in the breast pocket, nitrile gloves, holding a glass
   Erlenmeyer flask with green liquid.
3. Police officer, man in his 30s: navy peaked cap with a gold badge, navy
   uniform with epaulettes and a gold star badge, duty belt, white gloves,
   right hand raised palm-out in a calm "stop" gesture.
4. Epidemiologist, woman in her 30s: brown hair in a low ponytail, thin round
   glasses, plum cardigan over a cream blouse, staff ID badge on a red
   lanyard, a pencil tucked behind the ear, holding a clipboard with a chart.
5. Field engineer, man in his 50s: yellow hard hat, orange high-visibility
   vest with silver reflective stripes over a blue work shirt, leather tool
   belt, denim work trousers, holding a large steel wrench.
6. Logistics officer, man in his 20s: teal baseball cap, teal zip-up work
   jacket, khaki cargo trousers, carrying a taped cardboard box with
   "this side up" arrows in both hands.
7. Public health officer, woman in her 50s: plum beret with a small gold pin,
   chin-length auburn hair, burgundy blazer with gold buttons over a white
   shirt and red tie, white armband with a red cross, holding a megaphone.
8. Pharmacist, woman in her 20s: dark hair in a neat bun, light blue pharmacy
   coat with a name tag, holding an amber medicine bottle with a white label
   in one hand and a capsule in the other.
```

## C. 单角色描述（单张精修时，接在 A 后面，任选一条）

```
Single character only. Paramedic, man in his 30s: white rescue helmet with a small red cross, white and red paramedic jacket with reflective silver-and-yellow bands, stethoscope around the neck, dark navy cargo trousers, black work boots, carrying a red first-aid bag with a white cross in his right hand.
```
```
Single character only. Lab researcher, woman in her 40s: short black bob, safety goggles pushed up on the forehead, knee-length white lab coat over a moss-green shirt and dark green tie, blue and red pens in the breast pocket, blue nitrile gloves, dark green trousers, holding a glass Erlenmeyer flask with green liquid.
```
```
Single character only. Police officer, man in his 30s: navy peaked cap with a gold badge and black visor, navy uniform with epaulettes and a gold star badge, black duty belt with a radio, white gloves, right hand raised palm-out in a calm "stop" gesture, steady expression.
```
```
Single character only. Epidemiologist, woman in her 30s: brown hair in a low ponytail, thin round glasses, plum cardigan over a cream blouse, staff ID badge on a red lanyard, a yellow pencil tucked behind the ear, holding a clipboard with a printed line chart.
```
```
Single character only. Field engineer, man in his 50s with a short grey beard: yellow hard hat, orange high-visibility vest with two silver reflective stripes over a blue work shirt, leather tool belt with pouches, denim work trousers, boots, holding a large steel wrench.
```
```
Single character only. Logistics officer, man in his 20s: teal baseball cap, teal zip-up work jacket with a darker collar, khaki cargo trousers with side pockets, sneakers, carrying a taped cardboard box with "this side up" arrows in both hands in front of his body.
```
```
Single character only. Public health officer, woman in her 50s: plum beret with a small gold pin, chin-length auburn hair, burgundy blazer with gold buttons over a white shirt and red tie, white armband with a red cross on the left arm, holding a cream megaphone in her right hand.
```
```
Single character only. Pharmacist, woman in her 20s: dark hair in a neat bun, light blue pharmacy coat with a small name tag, holding an amber medicine bottle with a white label and a green cross, a red-and-white capsule in the other hand.
```

## D. 反向提示词

```
chibi, cute, kawaii, big head, oversized eyes, cartoon, anime, manga, toy, figurine,
3D render, glossy plastic, black outlines, comic line art, exaggerated proportions,
childlike adult, harsh shadows, ground shadow, background scenery, text, letters, logo,
watermark, frame, border, multiple views, cropped feet, cut off head, extra fingers,
deformed hands, scary, gore, mask covering face
```

---

## 中文版风格总述（给即梦、通义万相等中文模型）

```
半写实手绘插画，一位成年职业人士的全身像，自然站立，正面略带一点侧身角度，居中。
真实的人体结构和比例（约 7.5 头身），五官自然真实，神情沉着专业，手部结构正确。
水粉加彩铅的质感，能看到笔触，像印在哑光卡纸上，带细微纸纹。
左上方柔和的影棚光，轻微体积感，没有强烈阴影。
低饱和、偏大地色的配色，适合放在牛皮纸上：砖红、深海军蓝、苔绿、赭黄、青绿、梅紫、暖米白。
职业服装写实，有布料褶皱和真实材质。轮廓清晰，适合做成模切纸片立牌。
纯白背景，没有地面阴影，没有文字，没有边框，没有场景。
```

中文反向提示词：

```
Q版，卡通，二次元，动漫，大头，大眼睛，可爱风，玩偶，3D 渲染，塑料质感，黑色描边，
夸张比例，地面阴影，背景场景，文字，水印，边框，多视图，脚被裁掉，头被裁掉，手指畸形
```

角色部分可以直接翻译「B」或「C」的英文描述。中文模型对"一张图里 8 个人"的理解通常比较弱，建议用「C」逐个生成。

## 接入时会做的处理（图片到位后实现）

- 白底会自动抠掉，人物外面加一圈白色卡纸描边，生成牛皮纸背面。
- 身份证的证件照和地图上的纸片立牌都用同一张图。
- 写实比例的人物更瘦高，立牌的宽高比和证件照的裁切会相应调整。
- 立牌高度按头顶到脚底的距离自动缩放，各图的人物大小稍有不同也没关系。
