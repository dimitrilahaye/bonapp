#!/usr/bin/env python3
"""
generate_assets.py
Génère les icônes PWA et les splash screens Safari pour BonApp.
Dépendance : Pillow (installée automatiquement si absente).
"""

import os
import sys
import subprocess

# ── Installation de Pillow si nécessaire ──────────────────────────────────────

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Installation de Pillow…")
    subprocess.check_call([sys.executable, "-m", "pip", "install",
                           "Pillow", "--break-system-packages", "-q"])
    from PIL import Image, ImageDraw

# ── Couleurs ──────────────────────────────────────────────────────────────────

ORANGE   = (232, 145, 74, 255)   # --accent  #E8914A  (fond de l'icône)
BG_COLOR = (247, 245, 240, 255)  # --bg      #F7F5F0  (fond des splashscreens)
WHITE    = (255, 255, 255, 255)

# ── Utilitaires de dessin ─────────────────────────────────────────────────────

def rounded_rect(draw, x1, y1, x2, y2, r, color):
    """Dessine un rectangle aux coins arrondis."""
    # Clamp radius to half the smallest dimension
    r = min(r, (x2 - x1) / 2, (y2 - y1) / 2)
    if r <= 0:
        draw.rectangle([x1, y1, x2, y2], fill=color)
        return
    draw.rectangle([x1 + r, y1,     x2 - r, y2    ], fill=color)
    draw.rectangle([x1,     y1 + r, x2,     y2 - r], fill=color)
    draw.ellipse([x1,        y1,        x1 + 2*r, y1 + 2*r], fill=color)
    draw.ellipse([x2 - 2*r, y1,        x2,        y1 + 2*r], fill=color)
    draw.ellipse([x1,        y2 - 2*r, x1 + 2*r,  y2],       fill=color)
    draw.ellipse([x2 - 2*r, y2 - 2*r, x2,         y2],       fill=color)


def draw_fork_spoon(draw, size, color=WHITE):
    """
    Dessine une fourchette (gauche) et une cuillère (droite)
    à l'échelle de `size` px.
    Le design est calé sur une grille 100×100.
    """
    s = size / 100.0

    # ── Fourchette ────────────────────────────────────────────────────────────
    # 3 dents
    for tx in [22, 31, 40]:
        rounded_rect(draw, tx*s, 14*s, (tx+5)*s, 44*s, 2.5*s, color)
    # Barre de jonction des dents
    rounded_rect(draw, 22*s, 40*s, 45*s, 46*s, 2*s, color)
    # Manche
    rounded_rect(draw, 29*s, 44*s, 38*s, 86*s, 4*s, color)

    # ── Cuillère ─────────────────────────────────────────────────────────────
    # Bol (ellipse)
    draw.ellipse([57*s, 14*s, 79*s, 41*s], fill=color)
    # Col
    rounded_rect(draw, 64*s, 39*s, 72*s, 50*s, 3*s, color)
    # Manche
    rounded_rect(draw, 64*s, 48*s, 72*s, 86*s, 4*s, color)


# ── Génération de l'icône ─────────────────────────────────────────────────────

def create_icon(size, square=False):
    """
    Crée l'icône BonApp.

    Args:
        size:   Dimension en pixels (carré)
        square: True → fond carré orange (maskable) | False → cercle sur transparent
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if square:
        draw.rectangle([0, 0, size, size], fill=ORANGE)
    else:
        draw.ellipse([0, 0, size, size], fill=ORANGE)

    draw_fork_spoon(draw, size)
    return img


# ── Génération des splash screens ─────────────────────────────────────────────

def create_splash(width, height):
    """
    Crée un splash screen Safari aux dimensions données.
    Fond clair --bg, icône centrée (200 px ou 15 % de la petite dimension).
    """
    img = Image.new("RGB", (width, height), BG_COLOR[:3])
    icon_size = max(160, int(min(width, height) * 0.20))
    icon = create_icon(icon_size, square=False)

    x = (width  - icon_size) // 2
    y = (height - icon_size) // 2 - int(height * 0.04)

    img.paste(icon, (x, y), icon)
    return img


# ── Chemins de sortie ─────────────────────────────────────────────────────────

ICONS_DIR  = os.path.join(os.path.dirname(__file__), "public", "icons")
SPLASH_DIR = os.path.join(os.path.dirname(__file__), "public", "splash")
os.makedirs(ICONS_DIR,  exist_ok=True)
os.makedirs(SPLASH_DIR, exist_ok=True)

# ── Icônes ────────────────────────────────────────────────────────────────────

ICONS = [
    ("icon-192.png",        192, False),
    ("icon-512.png",        512, True),   # maskable → carré
    ("apple-touch-icon.png", 180, True),  # iOS → carré orange
]

for filename, size, square in ICONS:
    path = os.path.join(ICONS_DIR, filename)
    create_icon(size, square).save(path, "PNG")
    print(f"✓  {path}")

# ── Splash screens ─────────────────────────────────────────────────────────────

SPLASHES = [
    ("splash-1290x2796.png", 1290, 2796),  # iPhone 16 Pro Max
    ("splash-1179x2556.png", 1179, 2556),  # iPhone 16 Pro
    ("splash-1284x2778.png", 1284, 2778),  # iPhone 15 Plus / 14 Plus
    ("splash-1170x2532.png", 1170, 2532),  # iPhone 15 / 14
    ("splash-750x1334.png",   750, 1334),  # iPhone SE 3e gen
    ("splash-1125x2436.png", 1125, 2436),  # iPhone 13/12 mini
]

for filename, w, h in SPLASHES:
    path = os.path.join(SPLASH_DIR, filename)
    create_splash(w, h).save(path, "PNG")
    print(f"✓  {path}")

print("\n✅  Tous les assets ont été générés.")
