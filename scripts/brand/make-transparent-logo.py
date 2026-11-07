#!/usr/bin/env python3
"""
Builds public/brand/tuwaiq-logo-transparent.png from the official upload
public/brand/tuwaiq-logo.png — without redrawing anything:

  * keeps "Tuwaiq CLUB", the pixel mark and "Supported by Tuwaiq Academy"
  * removes "| UQU" (the university part of the tagline)
  * removes the solid purple background into a real alpha channel

Every visible pixel comes from the original image. Anti-aliased edges are
"un-blended" from the known background colour, so the logo keeps smooth
edges with no purple fringe on any background.
"""
import os
import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, 'public/brand/tuwaiq-logo.png')
DST = os.path.join(ROOT, 'public/brand/tuwaiq-logo-transparent.png')

img = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
H, W, _ = img.shape

# 1) background colour = most common colour of the plate
flat = img.reshape(-1, 3).astype(int)
vals, counts = np.unique(flat, axis=0, return_counts=True)
B = vals[counts.argmax()].astype(float)

# 2) the logo's ink colours: white lettering, the light tagline tint and the three
#    pixel-mark colours. Each is refined from the source pixels closest to it.
dist = np.linalg.norm(img - B, axis=2)
inner = np.zeros((H, W), bool)
inner[8:-8, 8:-8] = True                                   # ignore the light strip on the outer edge
strong = img[(dist > 70) & inner]
approx = np.array([[254, 253, 255],    # lettering
                   [250, 232, 255],    # tagline tint
                   [89, 227, 216],     # cyan block
                   [241, 166, 98],     # orange block
                   [156, 115, 255]],   # lavender block
                  float)
inks = []
for c in approx:
    near = strong[np.linalg.norm(strong - c, axis=1) < 22]
    inks.append(np.median(near, axis=0) if len(near) >= 20 else c)

# 3) per pixel: pick the ink that best explains it as a blend with the background,
#    alpha = how much of that ink is present (anti-aliased edges keep partial alpha)
best_res = np.full((H, W), np.inf)
alpha = np.zeros((H, W))
color = np.zeros((H, W, 3))
for F in inks:
    FB = F - B
    a = np.clip(((img - B) @ FB) / (FB @ FB), 0, 1)
    res = np.linalg.norm(img - (B + a[..., None] * FB), axis=2)
    better = res < best_res
    best_res = np.where(better, res, best_res)
    alpha = np.where(better, a, alpha)
    color[better] = F
alpha[~inner] = 0
alpha[dist < 20] = 0                                         # background noise / compression grain
# keep only real artwork: elements of at least 12 px (plus their anti-aliased rim)
lab_, n_ = ndimage.label(alpha > 0.1, structure=np.ones((3, 3)))
sizes = ndimage.sum(alpha > 0.1, lab_, range(1, n_ + 1))
real = np.isin(lab_, np.nonzero(sizes >= 12)[0] + 1)
alpha *= ndimage.binary_dilation(real, iterations=2)

# "| UQU": everything on the tagline line to the right of "Academy"
mask = alpha > 0.25
ys, xs = np.nonzero(mask)
tag_top = 405  # tagline row band (below the CLUB / pixel-mark rows)
tag_cols = np.unique(xs[ys >= tag_top])
steps = np.diff(tag_cols)
cut_x = tag_cols[np.argmax(steps) + 1] - 3             # widest gap on the line = before "|" ("Academy  | UQU")
alpha[tag_top:, cut_x:] = 0                            # remove "| UQU"

# 4) trim to the remaining artwork with a small transparent margin
yy, xx = np.nonzero(alpha > 0.02)
pad = 6
y0, y1 = max(yy.min() - pad, 0), min(yy.max() + pad + 1, H)
x0, x1 = max(xx.min() - pad, 0), min(xx.max() + pad + 1, W)
rgba = np.dstack([color, alpha * 255])[y0:y1, x0:x1]
Image.fromarray(np.round(rgba).astype(np.uint8), 'RGBA').save(DST, optimize=True)

# self-check: the kept artwork recomposited on the original purple must match the source
out = np.asarray(Image.open(DST)).astype(float)
recon = out[..., :3] * (out[..., 3:] / 255) + B * (1 - out[..., 3:] / 255)
orig = img[y0:y1, x0:x1]
keep = np.ones(recon.shape[:2], bool)
keep[max(tag_top - y0, 0):, max(cut_x - x0, 0):] = False
err = np.abs(recon - orig)[keep]
print(f'fidelity: mean |diff| {err.mean():.2f}/255, 99th pct {np.percentile(err, 99):.0f}/255')
print(f'inks {[tuple(int(v) for v in i) for i in inks]}  background {B.astype(int)}  cut "| UQU" at x={cut_x}  →  {DST}  {x1 - x0}×{y1 - y0}')
