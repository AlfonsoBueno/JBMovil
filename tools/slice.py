#!/usr/bin/env python3
"""Recorta los sprite-sheets en tiras de animacion uniformes para Phaser.

- Detecta el color de fondo y construye una mascara de primer plano.
- Detecta bandas horizontales (filas); descarta bandas finas (texto de etiquetas).
- Dentro de cada banda etiqueta componentes conexas y fusiona las que se solapan
  en X (partes sueltas de un mismo sprite). Asi separa sprites contiguos sin
  partir un sprite con huecos internos.
- Recorta cada frame y lo pega en una celda uniforme alineando los pies.
- Exporta una tira horizontal por animacion + JSON de metadatos.
"""
import os, json
from collections import deque
from PIL import Image

SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Assets"))
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "sprites"))
os.makedirs(OUT, exist_ok=True)


def load_rgba(path):
    return Image.open(path).convert("RGBA")


def make_transparent(img, bg, tol):
    """Borra SOLO el fondo conectado a los bordes (flood-fill), preservando los
    pixeles oscuros del interior del sprite. Aplica un feather de 1px en el borde."""
    px = img.load()
    w, h = img.size
    br, bgc, bb = bg
    isbg = bytearray(w * h)  # 1 = fondo conectado al borde

    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            q.append((x, y))
    while q:
        x, y = q.popleft()
        i = y * w + x
        if isbg[i]:
            continue
        r, g, b, a = px[x, y]
        if abs(r - br) + abs(g - bgc) + abs(b - bb) > tol:
            continue  # pertenece al sprite, frena el relleno
        isbg[i] = 1
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if isbg[i]:
                continue
            r, g, b, a = px[x, y]
            # feather: si toca el fondo, suaviza el alpha del borde
            edge = ((x > 0 and isbg[i - 1]) or (x < w - 1 and isbg[i + 1]) or
                    (y > 0 and isbg[i - w]) or (y < h - 1 and isbg[i + w]))
            if edge:
                d = abs(r - br) + abs(g - bgc) + abs(b - bb)
                op[x, y] = (r, g, b, min(a, int(a * min(1.0, d / (tol * 1.6)))))
            else:
                op[x, y] = (r, g, b, a)
    return out


def fg_mask(img, bg, tol):
    px = img.load()
    w, h = img.size
    br, bgc, bb = bg
    mask = bytearray(w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 24:
                continue
            if abs(r - br) + abs(g - bgc) + abs(b - bb) > tol:
                mask[row + x] = 1
    return mask, w, h


def row_bands(mask, w, h, min_count, min_gap, min_band_h):
    counts = [sum(mask[y * w:(y + 1) * w]) for y in range(h)]
    bands, start, gap = [], None, 0
    for y in range(h):
        if counts[y] >= min_count:
            if start is None:
                start = y
            gap = 0
        else:
            if start is not None:
                gap += 1
                if gap > min_gap:
                    bands.append((start, y - gap + 1))
                    start = None
    if start is not None:
        bands.append((start, h))
    return [(a, b) for a, b in bands if (b - a) >= min_band_h]


def components_in_band(mask, w, y0, y1):
    seen = bytearray(w * (y1 - y0))
    boxes = []
    for sy in range(y0, y1):
        base = (sy - y0) * w
        for sx in range(w):
            if not mask[sy * w + sx] or seen[base + sx]:
                continue
            q = deque([(sx, sy)])
            seen[base + sx] = 1
            minx = maxx = sx
            miny = maxy = sy
            cnt = 0
            while q:
                x, y = q.popleft()
                cnt += 1
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and y0 <= ny < y1:
                        ni = (ny - y0) * w + nx
                        if mask[ny * w + nx] and not seen[ni]:
                            seen[ni] = 1
                            q.append((nx, ny))
            boxes.append([minx, miny, maxx + 1, maxy + 1, cnt])
    return boxes


def merge_overlapping(boxes, max_gap):
    boxes = sorted(boxes, key=lambda b: b[0])
    merged = []
    for b in boxes:
        if merged and b[0] <= merged[-1][2] + max_gap:
            m = merged[-1]
            m[0] = min(m[0], b[0]); m[1] = min(m[1], b[1])
            m[2] = max(m[2], b[2]); m[3] = max(m[3], b[3]); m[4] += b[4]
        else:
            merged.append(b[:])
    return merged


def slice_sheet(name, path, bg, tol, rows_spec, min_band_h, flood_tol=55, dbg=False):
    img = load_rgba(path)
    clean = make_transparent(img, bg, flood_tol)
    mask, w, h = fg_mask(img, bg, tol)
    bands = row_bands(mask, w, h, max(8, w // 120), 14, min_band_h)
    if dbg:
        print(f"[{name}] bandas: {[(a,b,b-a) for a,b in bands]}")

    frames = {}
    for (key, _exp), (y0, y1) in zip(rows_spec, bands):
        band_h = y1 - y0
        comps = components_in_band(mask, w, y0, y1)
        # descarta ruido pequeno (texto residual, motas)
        comps = [c for c in comps if c[4] >= 200 and (c[3] - c[1]) >= band_h * 0.35]
        boxes = merge_overlapping(comps, max_gap=max(6, band_h // 12))
        # filtra cajas finales por tamano de sprite
        boxes = [b for b in boxes if (b[2] - b[0]) >= 30 and (b[3] - b[1]) >= 40]
        frames[key] = boxes
        if dbg:
            print(f"   {key}: {len(boxes)} -> {[(b[2]-b[0], b[3]-b[1]) for b in boxes]}")
    return clean, frames


def export(name, img, frames, pad=10):
    all_boxes = [b for v in frames.values() for b in v]
    cw = max(b[2] - b[0] for b in all_boxes) + pad * 2
    ch = max(b[3] - b[1] for b in all_boxes) + pad * 2
    meta = {"cellW": cw, "cellH": ch, "anims": {}}
    for key, boxes in frames.items():
        if not boxes:
            continue
        strip = Image.new("RGBA", (cw * len(boxes), ch), (0, 0, 0, 0))
        for i, b in enumerate(boxes):
            frame = img.crop((b[0], b[1], b[2], b[3]))
            fw, fh = frame.size
            ox = i * cw + (cw - fw) // 2
            oy = ch - pad - fh
            strip.alpha_composite(frame, (ox, oy))
        strip.save(os.path.join(OUT, f"{name}_{key}.png"))
        meta["anims"][key] = len(boxes)
        print(f"  {name}_{key}.png  ({len(boxes)} frames, celda {cw}x{ch})")
    return meta


def main():
    meta = {}
    img, fb = slice_sheet(
        "tigre", os.path.join(SRC, "tigre-sprite.png"),
        bg=(43, 43, 47), tol=90,
        rows_spec=[("idle", 5), ("right", 7), ("left", 7), ("jump", 7), ("claw", 7)],
        min_band_h=70, dbg=True)
    meta["tigre"] = export("tigre", img, fb)

    img, fb = slice_sheet(
        "bea", os.path.join(SRC, "Bea-Sprites.png"),
        bg=(255, 255, 255), tol=60,
        rows_spec=[("idle", 4), ("right", 6), ("left", 6), ("jump", 4)],
        min_band_h=70, dbg=True)
    meta["bea"] = export("bea", img, fb)

    with open(os.path.join(OUT, "sprites.json"), "w") as f:
        json.dump(meta, f, indent=2)
    print("\nMETA:", json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
