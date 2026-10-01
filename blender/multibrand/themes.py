"""Theme liveries for the multibrand museum set.

Each theme returns the material *contract* dict used by the build (web-contract names):
  paint_a, paint_b, paint_c  - frame/fork paint zones (primary, accent, decal)
  carbon, rim, tyre, tape, pad, steel, chain, hub, spoke, saddle, crank, alu_black, alu_silver, alu_dark, black
Values are RGB (sRGB 0..1) + PBR knobs passed to lib.mat. Never flat: carbon is coated,
metals are metallic, paint always carries clearcoat. Wyld matches web/src/skins/wyld.js.
"""


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))

# base component finishes (shared, realistic; not plastic)
COMPONENTS = {
    'carbon': ((0.018, 0.018, 0.02), dict(rough=.36, coat=.5, coat_rough=.12)),
    'tyre':   ((0.022, 0.022, 0.022), dict(rough=.62)),
    'tape':   ((0.02, 0.02, 0.02), dict(rough=.7)),
    'pad':    ((0.03, 0.03, 0.032), dict(rough=.85)),
    'steel':  ((0.78, 0.78, 0.80), dict(metal=1, rough=.22)),
    'chain':  ((0.62, 0.62, 0.64), dict(metal=1, rough=.3)),
    'hub':    ((0.04, 0.04, 0.045), dict(metal=.9, rough=.35)),
    'spoke':  ((0.03, 0.03, 0.03), dict(metal=.8, rough=.35)),
    'alu_black': ((0.03, 0.03, 0.035), dict(metal=.9, rough=.38)),
    'alu_silver': ((0.68, 0.69, 0.71), dict(metal=1, rough=.24)),
    'alu_dark': ((0.16, 0.165, 0.175), dict(metal=1, rough=.34)),
    'black':  ((0.02, 0.02, 0.02), dict(rough=.5)),
    'saddle': ((0.02, 0.02, 0.022), dict(rough=.45, coat=.3)),
    'crank':  ((0.03, 0.03, 0.033), dict(rough=.32, coat=.6)),
    'rim':    ((0.03, 0.03, 0.035), dict(metal=.55, rough=.32, coat=.3)),
}
COMPONENTS['bar_tape'] = COMPONENTS['tape']   # parts.py builds bars with M['bar_tape']

# hex palettes
KONA = dict(lava='#c8102e', basalt='#16110f', ash='#2b2320', decal='#f4ede2')
WYLD_MINT = dict(deep='#0e2a22', sheer='#57f5c0', soft='#12382e', decal='#eafff6')
WYLD_PINK = dict(deep='#2a0f1d', sheer='#ff5fb0', soft='#3a1226', decal='#ffe6f2')
HERITAGE = dict(canyon_white='#f2f1ec', canyon_blue='#1b3a7a', canyon_red='#c8102e',
                trek_yellow='#f6c90e', scott_yellow='#ffd200')


def _paint(rgb, metal=0.0, rough=.3, coat=1.0, coat_rough=.05, emit=None, str_=0.0):
    return (tuple(rgb), dict(metal=metal, rough=rough, coat=coat, coat_rough=coat_rough, emit=emit, strength=str_))


def theme(theme, accent_override=None):
    """Return material contract dict for a theme name.
    accent_override: optional hex for customizable paint_b."""
    C = dict(COMPONENTS)
    if theme == 'kona':
        # lava accent over basalt-black gloss frame; keep paint_b hot but small-area
        lava = hex_rgb(KONA['lava'])
        C['paint_a'] = _paint((0.04, 0.035, 0.036), metal=.1, rough=.24, coat=1.0, coat_rough=.03)
        C['paint_b'] = _paint(lava, metal=.3, rough=.22, coat=1.0, coat_rough=.04, emit=lava, str_=.08)
        C['paint_c'] = _paint(hex_rgb(KONA['decal']), rough=.4, coat=.2)
        C['rim'] = _paint((0.02, 0.02, 0.022), metal=.6, rough=.3, coat=.3)
    elif theme == 'wyld-mint':
        C['paint_a'] = _paint(hex_rgb(WYLD_MINT['deep']), rough=.22, coat=1.0, coat_rough=.03)
        C['paint_b'] = _paint(hex_rgb(WYLD_MINT['sheer']), metal=.4, rough=.18, coat=1.0, coat_rough=.03,
                              emit=hex_rgb(WYLD_MINT['sheer']), str_=.35)
        C['paint_c'] = _paint(hex_rgb(WYLD_MINT['decal']), rough=.35, coat=.3)
        C['rim'] = _paint((0.02, 0.02, 0.022), metal=.55, rough=.32, coat=.4)
    elif theme == 'wyld-pink':
        C['paint_a'] = _paint(hex_rgb(WYLD_PINK['deep']), rough=.22, coat=1.0, coat_rough=.03)
        C['paint_b'] = _paint(hex_rgb(WYLD_PINK['sheer']), metal=.4, rough=.18, coat=1.0, coat_rough=.03,
                              emit=hex_rgb(WYLD_PINK['sheer']), str_=.35)
        C['paint_c'] = _paint(hex_rgb(WYLD_PINK['decal']), rough=.35, coat=.3)
        C['rim'] = _paint((0.02, 0.02, 0.022), metal=.55, rough=.32, coat=.4)
    elif theme == 'heritage-canyon':
        C['paint_a'] = _paint(hex_rgb(HERITAGE['canyon_white']), rough=.3, coat=1.0)
        C['paint_b'] = _paint(hex_rgb(HERITAGE['canyon_blue']), rough=.3, coat=1.0)
        C['paint_c'] = _paint(hex_rgb(HERITAGE['canyon_red']), rough=.35, coat=.4)
        C['rim'] = _paint(hex_rgb(HERITAGE['canyon_white']), metal=.55, rough=.3, coat=.3)
    elif theme == 'heritage-trek':
        C['paint_a'] = _paint(hex_rgb(HERITAGE['trek_yellow']), rough=.3, coat=1.0)
        C['paint_b'] = _paint((0.05, 0.05, 0.06), rough=.3, coat=1.0)
        C['paint_c'] = _paint((0.95, 0.95, 0.95), rough=.4, coat=.2)
        C['rim'] = _paint((0.05, 0.05, 0.06), metal=.55, rough=.3, coat=.3)
    elif theme == 'heritage-scott':
        C['paint_a'] = _paint(hex_rgb(HERITAGE['scott_yellow']), rough=.3, coat=1.0)
        C['paint_b'] = _paint((0.06, 0.06, 0.07), rough=.3, coat=1.0)
        C['paint_c'] = _paint((0.9, 0.9, 0.9), rough=.4, coat=.2)
        C['rim'] = _paint((0.06, 0.06, 0.07), metal=.55, rough=.3, coat=.3)
    elif theme == 'splatter':
        C['paint_a'] = _paint((0.04, 0.05, 0.07), rough=.32, coat=.9)
        C['paint_b'] = _paint(hex_rgb('#ff2f6d'), metal=.3, rough=.28, coat=1.0)
        C['paint_c'] = _paint(hex_rgb('#00e0d0'), rough=.35, coat=.6)
        C['rim'] = _paint((0.02, 0.02, 0.022), metal=.5, rough=.32, coat=.3)
    elif theme == 'pearl':
        C['paint_a'] = _paint((0.93, 0.94, 0.96), metal=.15, rough=.25, coat=1.0, coat_rough=.06)
        C['paint_b'] = _paint((0.7, 0.78, 0.9), metal=.5, rough=.25, coat=1.0)
        C['paint_c'] = _paint((0.1, 0.12, 0.2), rough=.4, coat=.3)
        C['rim'] = _paint((0.85, 0.86, 0.88), metal=.6, rough=.3, coat=.3)
    elif theme == 'chrome':
        C['paint_a'] = _paint((0.6, 0.62, 0.66), metal=1.0, rough=.18, coat=.5, coat_rough=.1)
        C['paint_b'] = _paint((0.1, 0.12, 0.16), metal=.8, rough=.25, coat=.8)
        C['paint_c'] = _paint((0.9, 0.9, 0.92), rough=.4, coat=.2)
        C['rim'] = _paint((0.6, 0.62, 0.66), metal=1.0, rough=.2, coat=.4)
    elif theme == 'moss':
        C['paint_a'] = _paint(hex_rgb('#2c3a26'), rough=.34, coat=.8)
        C['paint_b'] = _paint(hex_rgb('#6f8a4e'), rough=.32, coat=.8)
        C['paint_c'] = _paint((0.92, 0.92, 0.9), rough=.4, coat=.2)
        C['rim'] = _paint((0.03, 0.03, 0.032), metal=.55, rough=.32, coat=.3)
    elif theme == 'desert':
        C['paint_a'] = _paint(hex_rgb('#8a6a4a'), rough=.34, coat=.8)
        C['paint_b'] = _paint(hex_rgb('#d8b98a'), rough=.34, coat=.8)
        C['paint_c'] = _paint((0.06, 0.05, 0.04), rough=.4, coat=.3)
        C['rim'] = _paint(hex_rgb('#d8b98a'), metal=.4, rough=.35, coat=.3)
    elif theme == 'night':
        C['paint_a'] = _paint((0.02, 0.02, 0.028), rough=.24, coat=1.0, coat_rough=.04)
        C['paint_b'] = _paint(hex_rgb(KONA['lava']), metal=.3, rough=.22, coat=1.0, emit=hex_rgb(KONA['lava']), str_=.2)
        C['paint_c'] = _paint((0.9, 0.88, 0.86), rough=.4, coat=.3)
        C['rim'] = _paint((0.02, 0.02, 0.022), metal=.6, rough=.3, coat=.3)
    else:  # customizable -> clear tri-tone the Studio sliders can re-tint
        a = hex_rgb('#3a4a6b')
        b = hex_rgb(accent_override or '#c8d4e8')
        C['paint_a'] = _paint(a, rough=.3, coat=1.0)
        C['paint_b'] = _paint(b, rough=.3, coat=1.0)
        C['paint_c'] = _paint((0.94, 0.94, 0.95), rough=.35, coat=.3)
        C['rim'] = _paint((0.03, 0.03, 0.035), metal=.55, rough=.32, coat=.3)
    return C
