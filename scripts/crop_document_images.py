#!/usr/bin/env python3
"""Lifts usable pictures out of the kit's reference PNGs into assets/media/doc/.

The user approved using images from the documents. Baked-in interface (desktop icons, the
notification, the Meet speaking dot) is painted out so nothing fake stays clickable-looking.
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REF, OUT = os.path.join(ROOT, 'references'), os.path.join(ROOT, 'assets', 'media', 'doc')
os.makedirs(OUT, exist_ok=True)


def load(name):
    return Image.open(os.path.join(REF, name)).convert('RGB')


def fill(arr, box, iterations=1400):
    """Diffuse the surrounding pixels into a hole. Soft wallpaper tolerates this well."""
    x0, y0, x1, y1 = box
    a = arr.astype('float32')
    hole = np.zeros(a.shape[:2], bool)
    hole[y0:y1, x0:x1] = True
    # Start from the column-wise blend of the edges, then relax.
    for c in range(3):
        top, bottom = a[y0 - 1, x0:x1, c], a[min(y1, a.shape[0] - 1), x0:x1, c]
        t = np.linspace(0, 1, y1 - y0)[:, None]
        a[y0:y1, x0:x1, c] = top * (1 - t) + bottom * t
    for _ in range(iterations):
        n = (np.roll(a, 1, 0) + np.roll(a, -1, 0) + np.roll(a, 1, 1) + np.roll(a, -1, 1)) / 4
        a[hole] = n[hole]
    return a.astype('uint8')


def wallpaper():
    src = np.asarray(load('02-desktop-notification.png'))[:874]
    scale = src.shape[1] / 1672
    box = lambda *v: tuple(int(n * scale) for n in v)
    arr = src.copy()
    arr = fill(arr, box(0, 0, 118, 530), 900)
    arr = fill(arr, box(1248, 646, 1668, 873), 1800)
    Image.fromarray(arr).resize((1920, 1004), Image.LANCZOS).save(os.path.join(OUT, 'wallpaper.jpg'), quality=90)


def amina():
    src = load('06-meet.png')
    s = src.width / 1672
    tile = np.asarray(src.crop((int(124 * s), int(157 * s), int(1389 * s), int(716 * s)))).copy()
    t = tile.shape[1] / 1265
    tile = fill(tile, (int(1205 * t), int(8 * t), int(1262 * t), int(62 * t)), 500)
    Image.fromarray(tile).save(os.path.join(OUT, 'amina_tile.jpg'), quality=92)
    face = src.crop((int(575 * s), int(150 * s), int(975 * s), int(550 * s)))
    face.resize((240, 240), Image.LANCZOS).save(os.path.join(OUT, 'amina_face.jpg'), quality=90)
    face.save(os.path.join(OUT, 'amina_avatar.jpg'), quality=93)


def tape():
    src = load('04-shared-folder.png')
    s = src.width / 1672
    src.crop((int(1300 * s), int(352 * s), int(1638 * s), int(570 * s))).save(os.path.join(OUT, 'microcassette.jpg'), quality=92)


def logos():
    a = load('15-handover.png')
    s = a.width / 1672
    a.crop((int(34 * s), int(96 * s), int(290 * s), int(152 * s))).save(os.path.join(OUT, 'lab_logo.png'))
    c = load('03-chat.png')
    s = c.width / 1672
    c.crop((int(84 * s), int(108 * s), int(134 * s), int(158 * s))).save(os.path.join(OUT, 'chat_logo.png'))
    d = load('04-shared-folder.png')
    s = d.width / 1672
    d.crop((int(20 * s), int(108 * s), int(76 * s), int(160 * s))).save(os.path.join(OUT, 'drive_logo.png'))


def desktop_icons():
    """Key each icon off the pale wallpaper behind it so it can sit anywhere."""
    src = load('02-desktop-notification.png')
    s = src.width / 1672
    boxes = {'folder': (26, 10, 90, 66), 'ftk': (24, 114, 92, 176), 'npp': (24, 220, 92, 282), 'gimp': (24, 330, 96, 390), 'audacity': (24, 434, 96, 494)}
    for name, b in boxes.items():
        crop = np.asarray(src.crop(tuple(int(v * s) for v in b))).astype('float32')
        h, w = crop.shape[:2]
        # Background estimated per row from the crop's own left and right edges.
        left, right = crop[:, :3].mean(axis=1), crop[:, -3:].mean(axis=1)
        t = np.linspace(0, 1, w)[None, :, None]
        bg = left[:, None, :] * (1 - t) + right[:, None, :] * t
        dist = np.sqrt(((crop - bg) ** 2).sum(axis=2))
        alpha = np.clip((dist - 12) / 26, 0, 1)
        rgba = np.dstack([crop, alpha * 255]).astype('uint8')
        Image.fromarray(rgba, 'RGBA').resize((w * 2, h * 2), Image.LANCZOS).save(os.path.join(OUT, f'icon_{name}.png'))


if __name__ == '__main__':
    wallpaper()
    amina()
    tape()
    logos()
    desktop_icons()
    print(sorted(os.listdir(OUT)))
