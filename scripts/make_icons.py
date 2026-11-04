"""Draws the Tasklane app icons. Run from the public/ folder: python ../scripts/make_icons.py"""
from PIL import Image, ImageDraw

SS = 4  # supersampling for smooth edges


def gradient(size):
    img = Image.new("RGB", (size, size))
    px = img.load()
    a, b = (115, 132, 255), (66, 86, 240)
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            px[x, y] = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
    return img


def draw_icon(size, maskable):
    big = size * SS
    base = gradient(big)
    d = ImageDraw.Draw(base)
    # glyph lives inside the central 60% so a circular mask never clips it
    scale = 0.60 if maskable else 0.68
    w = int(big * scale)
    x0 = (big - w) // 2
    y0 = (big - w) // 2
    card_r = int(w * 0.2)
    d.rounded_rectangle([x0, y0, x0 + w, y0 + w], radius=card_r, fill=(255, 255, 255))
    # three rows: first checked, other two open
    row_h = w / 3
    for i in range(3):
        cy = y0 + row_h * (i + 0.5)
        cx = x0 + w * 0.22
        r = w * 0.085
        if i == 0:
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(66, 86, 240))
            lw = int(r * 0.34)
            pts = [(cx - r * 0.5, cy + r * 0.02), (cx - r * 0.1, cy + r * 0.42), (cx + r * 0.55, cy - r * 0.38)]
            d.line(pts, fill=(255, 255, 255), width=lw, joint="curve")
        else:
            d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(66, 86, 240), width=int(r * 0.3))
        bar_x0 = x0 + w * 0.36
        bar_x1 = x0 + w * (0.82 if i != 1 else 0.7)
        bh = w * 0.055
        d.rounded_rectangle([bar_x0, cy - bh, bar_x1, cy + bh], radius=int(bh), fill=(205, 211, 255) if i else (66, 86, 240))
    img = base.resize((size, size), Image.LANCZOS)
    if not maskable:
        # rounded corners for the normal icons
        mask = Image.new("L", (big, big), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, big, big], radius=int(big * 0.22), fill=255)
        mask = mask.resize((size, size), Image.LANCZOS)
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)
        return out
    return img.convert("RGBA")


draw_icon(192, False).save("icons/icon-192.png")
draw_icon(512, False).save("icons/icon-512.png")
draw_icon(512, True).save("icons/maskable-512.png")
# iOS wants a square, no transparency
draw_icon(180, True).convert("RGB").save("icons/apple-touch-icon.png")
print("icons written")
