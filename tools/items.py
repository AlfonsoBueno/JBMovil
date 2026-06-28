#!/usr/bin/env python3
"""Extrae iconos sueltos de Objetos.png (rejilla 6x3) sin sus etiquetas de texto."""
import os
from collections import deque
from PIL import Image

SRC = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Assets", "Objetos.png"))
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "items"))
os.makedirs(OUT, exist_ok=True)

COLS, ROWS = 6, 3
# (nombre, col, fila)
TARGETS = [("mobile", 0, 0), ("pan", 1, 0), ("heart", 2, 0), ("coin", 3, 0), ("gem", 1, 1)]


def kill_white(img, tol=46):
    """Flood-fill de blanco desde bordes -> transparente."""
    img = img.convert("RGBA")
    px = img.load(); w, h = img.size
    isbg = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft(); i = y * w + x
        if isbg[i]:
            continue
        r, g, b, a = px[x, y]
        if a < 16:
            isbg[i] = 1
        elif (255 - r) + (255 - g) + (255 - b) <= tol:
            isbg[i] = 1
        else:
            continue
        if x > 0: q.append((x - 1, y))
        if x < w - 1: q.append((x + 1, y))
        if y > 0: q.append((x, y - 1))
        if y < h - 1: q.append((x, y + 1))
    for y in range(h):
        for x in range(w):
            if isbg[y * w + x]:
                px[x, y] = (0, 0, 0, 0)
    return img


def largest_component_bbox(img, y_limit_frac):
    """bbox de la mayor componente conexa cuyo centro queda en la zona superior
    (asi se ignora la etiqueta de texto y posibles restos vecinos)."""
    px = img.load(); w, h = img.size
    ylim = int(h * y_limit_frac)
    seen = bytearray(w * h)
    best = None; best_cnt = 0
    for sy in range(h):
        for sx in range(w):
            if px[sx, sy][3] <= 20 or seen[sy * w + sx]:
                continue
            q = deque([(sx, sy)]); seen[sy * w + sx] = 1
            minx = maxx = sx; miny = maxy = sy; cnt = 0
            while q:
                x, y = q.popleft(); cnt += 1
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        ni = ny * w + nx
                        if px[nx, ny][3] > 20 and not seen[ni]:
                            seen[ni] = 1; q.append((nx, ny))
            cy = (miny + maxy) / 2
            if cy <= ylim and cnt > best_cnt:
                best_cnt = cnt; best = (minx, miny, maxx + 1, maxy + 1)
    return best


def main():
    sheet = Image.open(SRC).convert("RGBA")
    W, H = sheet.size
    cw, ch = W // COLS, H // ROWS
    for name, c, r in TARGETS:
        cell = sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        cell = kill_white(cell)
        bb = largest_component_bbox(cell, y_limit_frac=0.72)  # excluye la etiqueta inferior
        icon = cell.crop(bb)
        icon.save(os.path.join(OUT, f"{name}.png"))
        print(f"  {name}.png  {icon.size}")


if __name__ == "__main__":
    main()
