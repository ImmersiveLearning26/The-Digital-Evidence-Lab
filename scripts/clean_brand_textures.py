#!/usr/bin/env python3
"""Removes brand marks from the supplied models' textures, so no real company's name or logo appears.

Usage: python3 scripts/clean_brand_textures.py <folder of textures exported from workstation.blend>
Writes assets/models/tex/clean/*.png, which build_workstation.py swaps in by image name.
Each mark is painted out with the colour of its own surroundings; the cassette gets a plain evidence label.
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'models', 'tex', 'clean')
FONT = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'


def load(name):
    return Image.open(os.path.join(SRC, name.replace('.', '_') + '.png')).convert('RGB')


def surround(img, box, pad=6):
    """The median colour of a thin ring just outside a box."""
    a = np.asarray(img).astype(int)
    x0, y0, x1, y1 = box
    ring = np.concatenate([a[max(0, y0 - pad):y0, x0:x1].reshape(-1, 3), a[y1:y1 + pad, x0:x1].reshape(-1, 3),
                           a[y0:y1, max(0, x0 - pad):x0].reshape(-1, 3), a[y0:y1, x1:x1 + pad].reshape(-1, 3)])
    return tuple(int(c) for c in np.median(ring, axis=0))


def paint(img, boxes):
    d = ImageDraw.Draw(img)
    for box in boxes:
        d.rectangle(box, fill=surround(img, box))
    return img


def paint_bar(img, centre, angle, length, thick, sample):
    """A rotated strip, for lettering engraved along the headphones' diagonal bar."""
    cx, cy = centre
    ux, uy = np.cos(np.radians(angle)), np.sin(np.radians(angle))
    vx, vy = -uy, ux
    pts = [(cx + sx * ux * length / 2 + sy * vx * thick / 2, cy + sx * uy * length / 2 + sy * vy * thick / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    ImageDraw.Draw(img).polygon(pts, fill=img.getpixel(sample))
    return img


def evidence_label(img, box, window, side):
    """A plain cream label, drawn mirror-image as the cassette's mapping expects."""
    x0, y0, x1, y1 = box
    keep = img.crop(window)
    w, h = x1 - x0, y1 - y0
    label = Image.new('RGB', (w, h), (232, 226, 210))
    d = ImageDraw.Draw(label)
    d.rectangle((6, 6, w - 7, h - 7), outline=(120, 112, 96), width=2)
    big, small = ImageFont.truetype(FONT, 26), ImageFont.truetype(FONT, 15)
    d.text((22, 14), f'CASE 0417  ·  SIDE {side}', font=big, fill=(40, 36, 30))
    d.text((22, h - 34), 'Witness statement · Sealed evidence', font=small, fill=(70, 64, 54))
    d.rectangle((w - 70, h - 40, w - 22, h - 16), outline=(160, 40, 36), width=2)
    d.text((w - 60, h - 38), side, font=small, fill=(160, 40, 36))
    img.paste(label.transpose(Image.FLIP_LEFT_RIGHT), (x0, y0))
    img.paste(keep, window[:2])
    return img


os.makedirs(OUT, exist_ok=True)
jobs = {
    # Cassette deck and audio interface: names are printed in the colour map and embossed through the others,
    # which share its layout, so every map is cleaned in the same places (below).
    # Cassette: band artwork on both labels becomes a plain evidence label.
    'Image_19': lambda i: evidence_label(evidence_label(i, (44, 136, 508, 338), (128, 182, 422, 254), 'B'), (44, 506, 508, 712), (128, 552, 422, 622), 'A'),
    # Monitor panel: the operating system's wallpaper. Never shown, since the live desktop covers it.
    'Image_3.001': lambda i: Image.new('RGB', i.size, (4, 6, 9)),
}
# Cassette deck: the maker's name on the case and handle, and the model line.
for n in ('Image_0.002', 'Image_1.002', 'Image_2.002', 'Image_3.002'):
    jobs[n] = lambda i: paint(i, [(688, 368, 732, 452), (484, 568, 518, 648), (552, 592, 598, 708)])
# Audio interface: the maker's name on the red case and black panel, the model name, the serial sticker.
for n in ('Image_0.003', 'Image_1.003', 'Image_2.003', 'Image_3.003'):
    jobs[n] = lambda i: paint(i, [(105, 100, 300, 150), (165, 300, 258, 338), (168, 436, 242, 464), (503, 352, 532, 428), (646, 296, 674, 382)])
# Headphones: the model name in raised letters and engraved on each earcup's bar, across all their maps.
for name, bar in (('Image_13.001', False), ('Image_14.001', True), ('Image_15.001', True), ('Image_16.001', False), ('Image_17.001', True)):
    jobs[name] = (lambda b: lambda i: (paint_bar(i, (572, 562), -26, 250, 42, (452, 630)) if b else i) and paint(i, [(115, 680, 455, 764)]))(bar)

for name, job in jobs.items():
    out = job(load(name))
    out.save(os.path.join(OUT, name.replace('.', '_') + '.png'))
    print('cleaned', name)
