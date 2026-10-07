import numpy as np, sys, os
# 依赖：pillow numpy scipy。用法：python tools/cut_lineup.py <设定图.png> <输出目录> [名字1,名字2,...]（按从左到右、从上到下的顺序），之后用 cwebp 转 webp。
from PIL import Image
from scipy import ndimage as ndi

src, outdir = sys.argv[1], sys.argv[2]
keys = sys.argv[3].split(",") if len(sys.argv) > 3 else ["medic","researcher","police","epidemiologist","engineer","logistics","officer","pharmacist"]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
H, W, _ = im.shape
mn = im.min(axis=2); mx = im.max(axis=2)
white = (mn > 236) & ((mx - mn) < 20)
lab, n = ndi.label(white)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
border.discard(0)
bg = np.isin(lab, list(border))
sizes = ndi.sum(np.ones_like(mn), lab, index=np.arange(1, n + 1))
means = ndi.mean(mn, lab, index=np.arange(1, n + 1))
for i, (sz, m) in enumerate(zip(sizes, means), start=1):
    if i not in border and sz > 1200 and m > 248.5:
        bg |= lab == i
fg = ~bg
fg = ndi.binary_opening(fg, iterations=1)
lab2, n2 = ndi.label(fg)
sz2 = ndi.sum(np.ones_like(mn), lab2, index=np.arange(1, n2 + 1))
keep = np.isin(lab2, [i + 1 for i, s in enumerate(sz2) if s > 120])
alpha = ndi.gaussian_filter(keep.astype(np.float32), 0.9)
alpha = np.clip((alpha - 0.15) / 0.7, 0, 1)
a3 = alpha[..., None]
rgb = np.where(a3 > 0.02, (im - (1 - a3) * 255) / np.maximum(a3, 0.02), im)
rgb = np.clip(rgb, 0, 255)

grown = ndi.binary_dilation(keep, iterations=int(sys.argv[4]) if len(sys.argv) > 4 else 16)
glab, gn = ndi.label(grown)
items = []
for sl_i, sl in enumerate(ndi.find_objects(glab), start=1):
    region = (glab[sl] == sl_i) & keep[sl]
    if region.sum() < 3000:
        continue
    ys, xs = np.where(region)
    y0, y1 = sl[0].start + ys.min(), sl[0].start + ys.max() + 1
    x0, x1 = sl[1].start + xs.min(), sl[1].start + xs.max() + 1
    items.append((y0, y1, x0, x1, sl_i))
items.sort(key=lambda it: (it[0] + it[1]) / 2)
rows, cur = [], []
for it in items:
    cy = (it[0] + it[1]) / 2
    if cur and abs(cy - np.mean([(c[0] + c[1]) / 2 for c in cur])) > H * 0.15:
        rows.append(cur); cur = []
    cur.append(it)
if cur: rows.append(cur)
ordered = [it for row in rows for it in sorted(row, key=lambda it: it[2])]
print(len(ordered), "items")
m = 10
for k, (y0, y1, x0, x1, li) in enumerate(ordered):
    cy0, cy1, cx0, cx1 = max(0, y0 - m), min(H, y1 + m), max(0, x0 - m), min(W, x1 + m)
    mask = (glab[cy0:cy1, cx0:cx1] == li)
    a_crop = alpha[cy0:cy1, cx0:cx1] * mask
    out = np.dstack([rgb[cy0:cy1, cx0:cx1], a_crop * 255]).astype(np.uint8)
    name = keys[k] if k < len(keys) else f"extra{k}"
    Image.fromarray(out, "RGBA").save(os.path.join(outdir, name + ".png"))
    print(name, out.shape)
