"""Extract individual product photo tiles from the black-canvas collages.

Pure-PIL (no numpy/scipy). Strategy:
  1. Build a coarse content mask (block grid) where a block is "content" if any
     pixel in it is brighter than the near-black canvas.
  2. Dilate the block mask so fragments of one photo merge.
  3. Label connected components (8-connectivity) with an iterative flood fill.
  4. For each large component, recompute a tight pixel bbox from the fine mask
     and crop the original image (no black borders).
"""

import sys
from pathlib import Path
from PIL import Image

BLOCK = 4          # coarse block size in px
DILATE = 2         # blocks to grow the mask (merges nearby fragments)
BG_THRESHOLD = 28  # max channel value considered "black canvas"
MIN_W = 60         # min tile width in px
MIN_H = 45         # min tile height in px


def is_content(px):
    r, g, b = px[0], px[1], px[2]
    return max(r, g, b) > BG_THRESHOLD


def build_block_mask(img):
    w, h = img.size
    px = img.load()
    bw, bh = (w + BLOCK - 1) // BLOCK, (h + BLOCK - 1) // BLOCK
    mask = [[False] * bw for _ in range(bh)]
    for by in range(bh):
        for bx in range(bw):
            hit = False
            for y in range(by * BLOCK, min((by + 1) * BLOCK, h)):
                for x in range(bx * BLOCK, min((bx + 1) * BLOCK, w)):
                    if is_content(px[x, y]):
                        hit = True
                        break
                if hit:
                    break
            mask[by][bx] = hit
    return mask, bw, bh


def dilate(mask, bw, bh, radius):
    out = [[False] * bw for _ in range(bh)]
    for y in range(bh):
        for x in range(bw):
            if not mask[y][x]:
                continue
            for dy in range(-radius, radius + 1):
                for dx in range(-radius, radius + 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < bh and 0 <= nx < bw:
                        out[ny][nx] = True
    return out


def components(mask, bw, bh):
    seen = [[False] * bw for _ in range(bh)]
    comps = []
    for sy in range(bh):
        for sx in range(bw):
            if not mask[sy][sx] or seen[sy][sx]:
                continue
            stack = [(sy, sx)]
            seen[sy][sx] = True
            cells = []
            while stack:
                y, x = stack.pop()
                cells.append((y, x))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < bh and 0 <= nx < bw and mask[ny][nx] and not seen[ny][nx]:
                            seen[ny][nx] = True
                            stack.append((ny, nx))
            comps.append(cells)
    return comps


def tight_bbox(img, x0, y0, x1, y1):
    """Shrink a region to the actual (non-black) content pixels."""
    px = img.load()
    minx, miny, maxx, maxy = x1, y1, x0, y0
    found = False
    for y in range(y0, y1):
        for x in range(x0, x1):
            if is_content(px[x, y]):
                found = True
                if x < minx: minx = x
                if y < miny: miny = y
                if x > maxx: maxx = x
                if y > maxy: maxy = y
    if not found:
        return None
    return (minx, miny, maxx + 1, maxy + 1)


def extract(src_path, out_dir, prefix):
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    mask, bw, bh = build_block_mask(img)
    mask = dilate(mask, bw, bh, DILATE)
    comps = components(mask, bw, bh)

    boxes = []
    for cells in comps:
        ys = [c[0] for c in cells]
        xs = [c[1] for c in cells]
        x0 = max(0, min(xs) * BLOCK)
        y0 = max(0, min(ys) * BLOCK)
        x1 = min(w, (max(xs) + 1) * BLOCK)
        y1 = min(h, (max(ys) + 1) * BLOCK)
        bbox = tight_bbox(img, x0, y0, x1, y1)
        if not bbox:
            continue
        bx0, by0, bx1, by1 = bbox
        if (bx1 - bx0) < MIN_W or (by1 - by0) < MIN_H:
            continue
        boxes.append(bbox)

    # Sort top-to-bottom, then left-to-right (reading order).
    boxes.sort(key=lambda b: (round(b[1] / 40), b[0]))

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    saved = []
    for i, (x0, y0, x1, y1) in enumerate(boxes, 1):
        crop = img.crop((x0, y0, x1, y1))
        name = f"{prefix}-{i:02d}.png"
        crop.save(out_dir / name)
        saved.append((name, x1 - x0, y1 - y0))
    return saved


if __name__ == "__main__":
    src = sys.argv[1]
    out = sys.argv[2]
    prefix = sys.argv[3]
    for name, cw, ch in extract(src, out, prefix):
        print(f"{name}\t{cw}x{ch}")
