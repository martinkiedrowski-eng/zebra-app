from PIL import Image, ImageDraw

VOID = (11, 14, 19, 255)      # #0B0E13
BLUE = (30, 95, 217, 255)     # #1E5FD9

def draw_z(size, margin_ratio, bg=VOID, fg=BLUE, bg_shape="square"):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if bg_shape == "rounded":
        radius = int(size * 0.22)
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=bg)
    else:
        d.rectangle([0, 0, size - 1, size - 1], fill=bg)

    m = int(size * margin_ratio)
    x0, y0, x1, y1 = m, m, size - m, size - m
    t = max(int((x1 - x0) * 0.22), 6)  # Strichstärke der Z-Form

    # Oberer Balken
    d.rectangle([x0, y0, x1, y0 + t], fill=fg)
    # Unterer Balken
    d.rectangle([x0, y1 - t, x1, y1], fill=fg)
    # Diagonale
    d.line(
        [(x1 - t * 0.5, y0 + t), (x0 + t * 0.5, y1 - t)],
        fill=fg,
        width=t,
        joint="curve",
    )
    # Enden der Diagonale sauber abrunden, damit keine spitzen Kanten entstehen
    r = t / 2
    d.ellipse([x1 - t * 0.5 - r, y0 + t - r, x1 - t * 0.5 + r, y0 + t + r], fill=fg)
    d.ellipse([x0 + t * 0.5 - r, y1 - t - r, x0 + t * 0.5 + r, y1 - t + r], fill=fg)

    return img

# Standard-Icons: eigener dezent abgerundeter Hintergrund, großzügiger Rand
draw_z(192, margin_ratio=0.24, bg_shape="rounded").save("/home/claude/zebra-app/public/icons/icon-192.png")
draw_z(512, margin_ratio=0.24, bg_shape="rounded").save("/home/claude/zebra-app/public/icons/icon-512.png")

# Maskable: voller Bleed-Hintergrund, groesserer Sicherheitsabstand (Safe Zone)
draw_z(512, margin_ratio=0.32, bg_shape="square").save("/home/claude/zebra-app/public/icons/icon-maskable-512.png")

# Apple Touch Icon: iOS rundet selbst, daher voller Bleed-Hintergrund
draw_z(180, margin_ratio=0.24, bg_shape="square").save("/home/claude/zebra-app/public/icons/apple-touch-icon.png")

# Favicon (klein, reduzierte Marge, damit die Form bei 32px erkennbar bleibt)
draw_z(32, margin_ratio=0.16, bg_shape="square").save("/home/claude/zebra-app/public/icons/favicon-32.png")

print("done")
