#!/usr/bin/env python3
"""Deterministic synthetic evidence for The Digital Evidence Lab.

Produces:
  assets/media/cctv_source.jpg      4000 x 3000 CCTV still: the generated photograph in
                                    assets/media/source/cctv_generated.jpg when present
                                    (GPT Image 2.5, see CREDITS.md), else a scene drawn here
  assets/media/cctv_thumb.jpg       Drive preview of the same still
  assets/media/cctv_source.json     plate/character/sky geometry measured from the JPEG
  assets/media/audio/*.wav          level-matched reference and degraded comparisons
  assets/media/audio/manifest.json  measured facts behind the comparison text

The number plate is always drawn here, so its colours are exact. The speech is macOS `say`.
Run with `image` or `audio` to rebuild one part only. The buzzer is synthesised with harmonics to 10 kHz.
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, 'assets', 'media')
W, H = 4000, 3000
PLATE_BG, PLATE_FG = (250, 210, 20), (15, 15, 15)
SKY_RECT = (260, 180, 620, 340)
FONT = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
PLATE_FONT = '/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf'
BOX = (1875, 1890, 250, 150)  # the plate area the tasks sample, crop and compare
PHOTO = os.path.join(MEDIA, 'source', 'cctv_generated.jpg')
PHOTO_PLATE_SEARCH = (1420, 1480, 1760, 1660)  # around the car in that photograph, clear of yellow planting
# A light camera grade, cooler and flatter, which also settles the photo's sky on the sky target.
PHOTO_GRADE = (0.91, 0.965, 0.935)
rng = np.random.default_rng(417)


def vgrad(w, h, stops):
    ys = np.linspace(0, 1, h)
    pos = [s[0] for s in stops]
    out = np.stack([np.interp(ys, pos, [s[1][c] for s in stops]) for c in range(3)], axis=1)
    return Image.fromarray(np.repeat(out[:, None, :], w, axis=1).astype('uint8'), 'RGB')


def rpoly(base, pts, fill, r=24):
    """Straight-edged panel with rounded corners: blur the mask, then threshold it."""
    xs, ys = zip(*pts)
    m = r * 3
    box = (int(min(xs)) - m, int(min(ys)) - m, int(max(xs)) + m, int(max(ys)) + m)
    w, h = box[2] - box[0], box[3] - box[1]
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).polygon([(x - box[0], y - box[1]) for x, y in pts], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(r)).point(lambda v: 255 if v > 127 else 0).filter(ImageFilter.GaussianBlur(1.1))
    layer = fill if isinstance(fill, Image.Image) else Image.new('RGB', (w, h), fill)
    if layer.size != (w, h):
        layer = layer.resize((w, h))
    base.paste(layer, box[:2], mask)


def foliage(canvas, cx, cy, sx, sy, count, base=96):
    """Thousands of small leaf clusters, lit from the upper left."""
    d = ImageDraw.Draw(canvas)
    pts = np.clip(rng.normal(0, 1, (count, 2)), -1.9, 1.9)
    order = np.argsort(pts[:, 1] * -1 + rng.normal(0, .3, count))
    for i in order:
        x, y = cx + pts[i, 0] * sx, cy + pts[i, 1] * sy
        lit = np.clip(.62 - pts[i, 1] * .24 - pts[i, 0] * .12 + rng.normal(0, .17), .12, 1.1)
        g = base * (.35 + lit)
        r = rng.uniform(9, 26)
        d.ellipse((x - r, y - r * .8, x + r, y + r * .8), fill=(int(g * .62), int(g), int(g * .44)))


def poly(base, pts, fill, blur=0):
    xs, ys = zip(*pts)
    box = (int(min(xs)) - 8, int(min(ys)) - 8, int(max(xs)) + 9, int(max(ys)) + 9)
    w, h = box[2] - box[0], box[3] - box[1]
    mask = Image.new('L', (w * 2, h * 2), 0)
    ImageDraw.Draw(mask).polygon([((x - box[0]) * 2, (y - box[1]) * 2) for x, y in pts], fill=255)
    mask = mask.resize((w, h), Image.LANCZOS)
    if blur:
        mask = mask.filter(ImageFilter.GaussianBlur(blur))
    layer = fill if isinstance(fill, Image.Image) else Image.new('RGB', (w, h), fill)
    if layer.size != (w, h):
        layer = layer.resize((w, h))
    base.paste(layer, box[:2], mask)


def smooth(points, steps=14):
    """Catmull-Rom through a closed outline, so car panels are not faceted."""
    p = np.array(points, float)
    out = []
    for i in range(len(p)):
        p0, p1, p2, p3 = p[i - 1], p[i], p[(i + 1) % len(p)], p[(i + 2) % len(p)]
        for t in np.linspace(0, 1, steps, endpoint=False):
            out.append(tuple(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t ** 2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3)))
    return out


def mirror(pts, cx=2000):
    return pts + [(2 * cx - x, y) for x, y in reversed(pts)]


def background():
    img = vgrad(W, 1340, [(0, (129, 186, 234)), (.45, (138, 192, 236)), (.8, (170, 208, 236)), (1, (196, 216, 232))])
    canvas = Image.new('RGB', (W, H), (70, 72, 76))
    canvas.paste(img, (0, 0))
    # Soft cumulus, kept away from the sky sampling window at top left.
    cloud = Image.new('L', (W, 1340), 0)
    d = ImageDraw.Draw(cloud)
    for cx, cy, s in [(2500, 330, 1.4), (3350, 560, 1.1), (1400, 690, .8), (3700, 200, .8)]:
        for _ in range(26):
            x, y = cx + rng.normal(0, 330 * s), cy + rng.normal(0, 70 * s)
            r = rng.uniform(70, 190) * s
            d.ellipse((x - r, y - r * .6, x + r, y + r * .6), fill=int(rng.uniform(70, 150)))
    cloud = cloud.filter(ImageFilter.GaussianBlur(46))
    canvas.paste(Image.new('RGB', (W, 1340), (246, 248, 250)), (0, 0), cloud)
    d = ImageDraw.Draw(canvas)
    # City blocks with window grids.
    blocks = [(150, 900, 620, 1300, (176, 172, 164)), (560, 760, 900, 1300, (154, 160, 168)), (980, 980, 1420, 1300, (190, 184, 170)),
              (2500, 860, 2860, 1300, (168, 172, 176)), (2830, 1000, 3320, 1300, (186, 178, 166)), (3460, 900, 3920, 1300, (160, 166, 172))]
    for x0, y0, x1, y1, c in blocks:
        d.rectangle((x0, y0, x1, y1), fill=c)
        for wy in range(y0 + 24, y1, 44):
            for wx in range(x0 + 20, x1 - 24, 36):
                shade = int(rng.uniform(60, 120))
                d.rectangle((wx, wy, wx + 20, wy + 26), fill=(shade, shade + 14, shade + 28))
    # A round office tower.
    tower = vgrad(280, 760, [(0, (116, 134, 150)), (1, (150, 164, 176))])
    canvas.paste(tower, (3120, 540))
    d.ellipse((3120, 510, 3400, 570), fill=(136, 150, 164))
    for wy in range(590, 1300, 34):
        d.line((3120, wy, 3400, wy), fill=(92, 106, 120), width=8)
    # Median planting.
    for x in range(-80, 4120, 170):
        foliage(canvas, x + rng.uniform(-50, 50), rng.uniform(1190, 1250), 120, 62, 420)
    for x in (420, 1220, 2940, 3700):
        d.rectangle((x - 13, 800, x + 13, 1300), fill=(84, 74, 62))
        foliage(canvas, x, 730, 210, 112, 3400)
    # Road, kerb and lane paint.
    road = vgrad(W, H - 1300, [(0, (106, 108, 112)), (.5, (84, 86, 90)), (1, (66, 68, 72))])
    canvas.paste(road, (0, 1300))
    noise = rng.normal(0, 8, (H - 1300, W)).astype('int16')
    arr = np.asarray(canvas).astype('int16')
    arr[1300:] = np.clip(arr[1300:] + noise[..., None], 0, 255)
    canvas = Image.fromarray(arr.astype('uint8'), 'RGB')
    kerb = [(0, 1760), (1380, 1300), (1450, 1300), (0, 1960)]
    poly(canvas, kerb, (182, 182, 176))
    for i in range(9):
        t0, t1 = i / 9, (i + .5) / 9
        a = lambda t: (1380 * t ** 1.8, 1760 - 460 * t ** 1.8)
        b = lambda t: (1450 * t ** 1.8, 1960 - 660 * t ** 1.8)
        poly(canvas, [a(t0), a(t1), b(t1), b(t0)], (34, 34, 36))
    for y0, y1 in [(1340, 1420), (1520, 1680), (1880, 2200), (2520, 3000)]:
        s0, s1 = (y0 - 1300) / 1700, (y1 - 1300) / 1700
        poly(canvas, [(3250 - 1000 * (1 - s0), y0), (3330 - 1000 * (1 - s0) + 120 * s0, y0), (3330 - 1000 * (1 - s1) + 120 * s1, y1), (3250 - 1000 * (1 - s1), y1)], (214, 212, 204))
    return canvas.filter(ImageFilter.GaussianBlur(5))


def car(canvas):
    # Contact shadow on the road.
    shadow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(shadow).ellipse((1120, 2230, 2880, 2440), fill=190)
    shadow = shadow.filter(ImageFilter.GaussianBlur(34))
    canvas.paste(Image.new('RGB', (W, H), (20, 21, 24)), (0, 0), shadow)
    d = ImageDraw.Draw(canvas)
    for x0, x1 in [(1296, 1510), (2490, 2704)]:
        d.rounded_rectangle((x0, 1990, x1, 2346), 46, fill=(24, 24, 26))
        d.rounded_rectangle((x0 + 12, 2100, x1 - 12, 2338), 30, fill=(32, 32, 35))
    # Wing mirrors.
    for sgn in (-1, 1):
        pts = [(2000 + sgn * 640, 1560), (2000 + sgn * 712, 1516), (2000 + sgn * 822, 1500), (2000 + sgn * 830, 1600), (2000 + sgn * 700, 1618)]
        rpoly(canvas, pts, (146, 149, 154), 12)
    # Cabin.
    cabin = mirror([(1442, 1660), (1520, 1400), (1612, 1160), (1700, 1076), (1860, 1056)])
    rpoly(canvas, cabin, vgrad(1120, 660, [(0, (216, 219, 223)), (.5, (190, 193, 198)), (1, (168, 171, 176))]), 22)
    glass = mirror([(1566, 1608), (1610, 1400), (1680, 1200), (1740, 1130), (1880, 1112)])
    rpoly(canvas, glass, vgrad(880, 510, [(0, (120, 142, 158)), (.35, (70, 84, 96)), (1, (40, 46, 54))]), 14)
    # Seats and a soft reflection, drawn inside the glass.
    for cx in (1760, 2240):
        poly(canvas, smooth([(cx - 96, 1590), (cx - 84, 1380), (cx - 40, 1320), (cx + 40, 1320), (cx + 84, 1380), (cx + 96, 1590)], 8), (32, 37, 44))
    poly(canvas, [(1660, 1190), (1860, 1124), (1790, 1370), (1620, 1400)], (112, 136, 152), blur=26)
    # Body shell.
    body = mirror([(1238, 2196), (1226, 1880), (1248, 1720), (1300, 1632), (1470, 1596), (1880, 1578)])
    shell = vgrad(1660, 720, [(0, (220, 223, 227)), (.2, (201, 204, 209)), (.46, (180, 183, 189)), (.72, (160, 163, 169)), (1, (124, 127, 132))])
    rpoly(canvas, body, shell, 26)
    # Boot lid crease and panel gaps.
    d = ImageDraw.Draw(canvas)
    d.line([(1330, 1672), (1640, 1648), (2360, 1648), (2670, 1672)], fill=(236, 238, 241), width=10)
    d.line([(1620, 1660), (1600, 1860), (1660, 1900), (2340, 1900), (2400, 1860), (2380, 1660)], fill=(112, 115, 120), width=5)
    # Tail lamps.
    for sgn in (-1, 1):
        lamp = [(2000 + sgn * 404, 1684), (2000 + sgn * 700, 1672), (2000 + sgn * 754, 1726), (2000 + sgn * 744, 1846), (2000 + sgn * 450, 1852)]
        rpoly(canvas, lamp, vgrad(440, 280, [(0, (168, 28, 34)), (.5, (126, 16, 24)), (1, (86, 10, 16))]), 14)
        poly(canvas, [(2000 + sgn * 520, 1716), (2000 + sgn * 690, 1706), (2000 + sgn * 700, 1740), (2000 + sgn * 524, 1752)], (214, 76, 76), blur=9)
    # Chrome garnish and emblem.
    poly(canvas, smooth(mirror([(1610, 1800), (1640, 1774), (1900, 1770)]) + [(2360, 1812), (1640, 1812)], 6), vgrad(800, 60, [(0, (244, 246, 248)), (.5, (160, 164, 170)), (1, (226, 229, 232))]))
    d = ImageDraw.Draw(canvas)
    d.ellipse((1948, 1696, 2052, 1760), outline=(226, 229, 233), width=8)
    d.ellipse((1982, 1696, 2018, 1760), outline=(226, 229, 233), width=5)
    badge = ImageFont.truetype(FONT, 24)
    d.text((1420, 1928), 'TOYOTA', font=badge, fill=(214, 217, 221))
    # Dealer sticker on the boot, as in a real rear view.
    d.rounded_rectangle((2470, 1930, 2626, 1984), 6, fill=(238, 238, 234))
    d.text((2484, 1942), 'NBI MOTORS', font=ImageFont.truetype(FONT, 18), fill=(150, 34, 40))
    # Plate recess.
    d.rounded_rectangle((1846, 1868, 2154, 2062), 14, fill=(92, 95, 100))
    # Bumper and reflectors.
    rpoly(canvas, mirror([(1262, 2116), (1262, 2214), (1340, 2262), (1900, 2272)]), vgrad(1560, 240, [(0, (66, 68, 73)), (1, (28, 29, 32))]), 16)
    for sgn in (-1, 1):
        ImageDraw.Draw(canvas).rounded_rectangle((2000 + sgn * 560 - 70, 2130, 2000 + sgn * 560 + 70, 2156), 8, fill=(112, 22, 26))
    return canvas


def plate(canvas):
    """The plate is drawn last so its colours stay exact and measurable."""
    px, py, pw, ph = 1875, 1890, 250, 150
    d = ImageDraw.Draw(canvas)
    d.rectangle((px, py, px + pw - 1, py + ph - 1), fill=PLATE_BG)
    d.rectangle((px + 3, py + 3, px + pw - 4, py + ph - 4), outline=PLATE_FG, width=3)
    font = ImageFont.truetype(FONT, 58)
    for text, cy in (('KDA', py + 44), ('417Q', py + 106)):
        box = d.textbbox((0, 0), text, font=font)
        d.text((px + (pw - (box[2] - box[0])) / 2 - box[0], cy - (box[3] - box[1]) / 2 - box[1]), text, font=font, fill=PLATE_FG)
    return (px, py, pw, ph)


def photo_scene():
    """The photograph, scaled so its blank plate is exactly 250 px wide and centred in the plate box."""
    img = Image.open(PHOTO).convert('RGB')
    x0, y0, x1, y1 = PHOTO_PLATE_SEARCH
    a = np.asarray(img).astype('int16')[y0:y1, x0:x1]
    ys, xs = np.nonzero((a[..., 0] > 170) & (a[..., 1] > 140) & (a[..., 2] < 110))
    px, py, pw, ph = x0 + xs.min(), y0 + ys.min(), xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    s = BOX[2] / pw
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    h = round(ph * s)
    top = BOX[1] + (BOX[3] - h) // 2
    left, up = round(px * s) - BOX[0], round(py * s) - top
    img = img.crop((left, up, left + W, up + H))
    arr = np.asarray(img).astype('float32') * np.array(PHOTO_GRADE, 'float32')
    return Image.fromarray(np.clip(arr, 0, 255).astype('uint8'), 'RGB'), (BOX[0], top, BOX[2], h)


def single_plate(canvas, rect):
    """A one-line Kenyan rear plate over the blank one, softened only at its edge like the rest of the frame."""
    px, py, pw, ph = rect
    layer = Image.new('RGB', (pw, ph), PLATE_BG)
    ImageDraw.Draw(layer).rectangle((2, 2, pw - 3, ph - 3), outline=PLATE_FG, width=3)
    font = ImageFont.truetype(PLATE_FONT, round(ph * .9))
    box = font.getbbox('KDA 417Q')
    text = Image.new('L', (box[2] - box[0], box[3] - box[1]), 0)
    ImageDraw.Draw(text).text((-box[0], -box[1]), 'KDA 417Q', font=font, fill=255)
    if text.width > pw - 28:
        text = text.resize((pw - 28, text.height), Image.LANCZOS)
    layer.paste(Image.new('RGB', text.size, PLATE_FG), ((pw - text.width) // 2, (ph - text.height) // 2), text)
    canvas.paste(layer, (px, py))
    edge = (px - 3, py - 3, px + pw + 3, py + ph + 3)
    canvas.paste(canvas.crop(edge).filter(ImageFilter.GaussianBlur(.6)), edge[:2])
    return rect


def build_image():
    photo = os.path.exists(PHOTO)
    if photo:
        canvas, rect = photo_scene()
        rect = single_plate(canvas, rect)
    else:
        canvas = car(background())
        canvas = canvas.filter(ImageFilter.GaussianBlur(.9))
        rect = plate(canvas)
    # Sensor noise, plus a mild vignette on the drawn scene; the plate receives none so its colour holds.
    arr = np.asarray(canvas).astype('float32')
    yy, xx = np.mgrid[0:H, 0:W]
    mask = np.ones((H, W), 'float32')
    px, py, pw, ph = rect
    mask[py - 4:py + ph + 4, px - 4:px + pw + 4] = 0
    x0, y0, x1, y1 = SKY_RECT
    if not photo:
        vig = 1 - .16 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
        arr = arr * (1 - mask[..., None] + mask[..., None] * vig[..., None])
    arr += rng.normal(0, 1.6 if photo else 2.2, (H, W, 1)) * mask[..., None]
    if not photo:
        # The clear-sky band is pulled to the target over a wide feather, so no patch is visible.
        feather = np.clip(1 - np.maximum(np.maximum(x0 - xx, xx - x1), np.maximum(y0 - yy, yy - y1)).clip(0) / 420, 0, 1)[..., None] ** 2
        arr = arr * (1 - feather) + (np.array((135, 190, 235), 'float32') + rng.normal(0, 1.2, (H, W, 1))) * feather
    canvas = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'), 'RGB')
    d = ImageDraw.Draw(canvas)
    small = ImageFont.truetype(FONT, 44)
    d.text((70, 2890), 'CAM 07  NAIROBI  SYNTHETIC TRAINING IMAGE', font=small, fill=(244, 244, 240), stroke_width=3, stroke_fill=(20, 20, 20))
    out = os.path.join(MEDIA, 'cctv_source.jpg')
    canvas.save(out, 'JPEG', quality=96, subsampling=0, dpi=(72, 72))
    canvas.resize((960, 720), Image.LANCZOS).save(os.path.join(MEDIA, 'cctv_thumb.jpg'), 'JPEG', quality=86)

    # Measure from the saved JPEG: this is what the running app will decode.
    final = np.asarray(Image.open(out).convert('RGB')).astype('int16')
    region = final[py:py + ph, px:px + pw]
    dark = (region.sum(axis=2) < 120)
    flat = (np.abs(region - np.array(PLATE_BG)).max(axis=2) <= 6)
    # A character pixel whose 5 x 5 neighbourhood is entirely stroke, and a plate pixel whose 7 x 7 is entirely plate.
    char = next(((px + x, py + y) for y in range(8, ph - 8) for x in range(12, pw - 12) if dark[y - 2:y + 3, x - 2:x + 3].all()), None)
    bg = next(((px + x, py + y) for y in range(8, ph - 8) for x in range(8, pw - 8) if flat[y - 3:y + 4, x - 3:x + 4].all()), None)
    sky = ((x0 + x1) // 2, (y0 + y1) // 2)
    meta = dict(width=W, height=H, plate=dict(zip('xywh', BOX)), samples=dict(plate=bg, character=char, sky=sky), skyRect=SKY_RECT,
                measured=dict(plate=final[bg[1], bg[0]].tolist(), character=final[char[1], char[0]].tolist(), sky=final[sky[1], sky[0]].tolist()))
    json.dump(meta, open(os.path.join(MEDIA, 'cctv_source.json'), 'w'), indent=1, default=int)
    print('image', os.path.getsize(out), meta['measured'])


# --- Audio -----------------------------------------------------------------

SR = 44100


def say(text, voice='Daniel', rate=148):
    with tempfile.TemporaryDirectory() as tmp:
        aiff, wav_path = os.path.join(tmp, 'a.aiff'), os.path.join(tmp, 'a.wav')
        subprocess.run(['say', '-v', voice, '-r', str(rate), '-o', aiff, text], check=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', aiff, '-ac', '1', '-ar', str(SR), '-sample_fmt', 's16', wav_path], check=True)
        with wave.open(wav_path) as w:
            return np.frombuffer(w.readframes(w.getnframes()), 'int16').astype('float64') / 32768


def buzzer(seconds):
    t = np.arange(int(seconds * SR)) / SR
    tone = sum(np.sin(2 * np.pi * 1000 * n * t) * (0.4 + n / 16) / n ** .5 for n in range(1, 11))
    tone *= (0.72 + 0.28 * np.sign(np.sin(2 * np.pi * 96 * t)))
    tone /= np.abs(tone).max()
    ramp = np.minimum(1, np.minimum(t, seconds - t) / .012)
    return tone * ramp


def resample_fft(x, new_len):
    """Bandlimited resampling: dropping bins above the new Nyquist is the anti-alias filter."""
    spec = np.fft.rfft(x)
    keep = new_len // 2 + 1
    out = np.zeros(keep, complex)
    n = min(keep, len(spec))
    out[:n] = spec[:n]
    # Taper the top of the band to avoid ringing at the cutoff.
    taper = int(n * .04)
    out[n - taper:n] *= np.cos(np.linspace(0, np.pi / 2, taper)) ** 2
    return np.fft.irfft(out, new_len) * (new_len / len(x))


def write_wav(path, x, rate, bits):
    x = np.clip(x, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setframerate(rate)
        if bits == 8:
            w.setsampwidth(1)
            w.writeframes((np.round(x * 127) + 128).astype('uint8').tobytes())
        else:
            w.setsampwidth(2)
            w.writeframes(np.round(x * 32767).astype('int16').tobytes())


def band_db(x, rate, lo, hi):
    spec = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
    f = np.fft.rfftfreq(len(x), 1 / rate)
    sel = (f >= lo) & (f <= hi)
    return float(10 * np.log10(spec[sel].sum() / len(x) + 1e-12)) if sel.any() else None


def rms(x):
    return float(np.sqrt(np.mean(x ** 2)))


def build_audio():
    out = os.path.join(MEDIA, 'audio')
    first = say('I heard the door buzzer just after nine.')
    second = say('He told me to say nothing, and to send the money before noon.')
    n = 10 * SR
    speech = np.zeros(n)
    a, b = int(.5 * SR), int(5.25 * SR)
    speech[a:a + len(first)] = first[:n - a]
    speech[b:b + len(second)] = second[:n - b]
    speech = speech / rms(speech[speech != 0]) * 10 ** (-30 / 20)
    buzz = np.zeros(n)
    bs, be = int(3.45 * SR), int(4.75 * SR)
    buzz[bs:be] = buzzer((be - bs) / SR) * 10 ** (-7 / 20)
    # Tape hiss: white noise shaped to the band of a microcassette recorder.
    hiss = np.random.default_rng(417).normal(0, 1, n)
    spec = np.fft.rfft(hiss)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec *= 1 / (1 + (f / 11000) ** 6)
    hiss = np.fft.irfft(spec, n)
    hiss = hiss / rms(hiss) * 10 ** (-58 / 20)
    ref = speech + buzz + hiss
    fade = np.minimum(1, np.minimum(np.arange(n), n - 1 - np.arange(n)) / (.02 * SR))
    ref *= fade

    seg = np.zeros(n, bool)
    seg[a:a + len(first)] = True
    seg[b:b + len(second)] = True
    target = rms(ref[seg])

    def level(x, rate):
        m = seg[(np.arange(len(x)) * (SR / rate)).astype(int).clip(0, n - 1)]
        return x * (target / rms(x[m]))

    versions = {}
    write_wav(os.path.join(out, 'reference_44100_16.wav'), ref, SR, 16)
    versions['reference_44100_16'] = (ref, SR, 16)
    for rate in (8000, 16000):
        low = level(resample_fft(ref, 10 * rate), rate)
        write_wav(os.path.join(out, f'sample_{rate}_16.wav'), low, rate, 16)
        versions[f'sample_{rate}_16'] = (low, rate, 16)
    # 8-bit quantisation at the reference's level: 256 levels, no dither, no gain trick.
    q = np.round(ref * 127) / 127
    write_wav(os.path.join(out, 'quantised_44100_8.wav'), ref, SR, 8)
    versions['quantised_44100_8'] = (q, SR, 8)

    def facts(x, rate):
        sb, se = int(3.5 * rate), int(4.7 * rate)
        return dict(rate=rate, buzzerUpper_6to10kHz_dB=band_db(x[sb:se], rate, 6000, 10000), buzzerMid_2to4kHz_dB=band_db(x[sb:se], rate, 2000, 3900))
    report = {k: {**facts(v[0], v[1]), 'bits': v[2], 'file': k + '.wav'} for k, v in versions.items()}
    sil = (np.arange(n) > 2.6 * SR) & (np.arange(n) < 3.3 * SR)
    report['reference_44100_16']['noiseFloor_dBFS'] = 20 * np.log10(rms(ref[sil]))
    report['quantised_44100_8']['noiseFloor_dBFS'] = 20 * np.log10(rms(q[sil]) + 1e-9)
    # Share of quiet speech samples that fall on the three levels nearest zero at 8-bit.
    report['quantised_44100_8']['speechSamplesWithin3Levels'] = float(np.mean(np.abs(np.round(ref[seg] * 127)) <= 3))
    report['quantised_44100_8']['errorInSpeech_dB'] = 20 * np.log10(rms((q - ref)[seg]) / rms(ref[seg]))
    json.dump(dict(durationSeconds=10, buzzerSeconds=[3.45, 4.75], speechSeconds=[[.5, .5 + len(first) / SR], [5.25, 5.25 + len(second) / SR]], versions=report), open(os.path.join(out, 'manifest.json'), 'w'), indent=1)
    for k, v in report.items():
        print(k, {a: (round(b, 2) if isinstance(b, float) else b) for a, b in v.items() if a != 'file'})


if __name__ == '__main__':
    os.makedirs(os.path.join(MEDIA, 'audio'), exist_ok=True)
    parts = sys.argv[1:] or ['image', 'audio']
    if 'image' in parts:
        build_image()
    if 'audio' in parts:
        build_audio()
