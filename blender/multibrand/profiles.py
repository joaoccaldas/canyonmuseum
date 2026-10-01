"""Profiles for the multibrand museum set.

Convention (source discipline mirrors the museum manifest):
  geometry.*     -> PUBLISHED geometry table (skeleton.build). Representative size per model,
                    transcribed from the brand's launched geometry for that model family.
  shapes, joints -> INFERRED tube widths / joint fractions (logged in the receipt).
  materials      -> theme contract from themes.py (PBR, never flat).
  zones          -> frame/fork member -> paint-zone material key.
  zone_mats      -> paint-zone -> material name in the contract.

This is an original design/engineering study. Geometry tables reflect each brand's published
numbers; it is not affiliated with or endorsed by any brand named.
"""
from themes import theme as theme_for

TAU = 2.0

# ------------------------------------------------------------------ published geometry tables
# skeleton.build needs (single size, mm/deg): head_tube_angle, seat_tube_angle, chainstay,
# wheelbase, fork_offset, head_tube, seat_tube + bb_height (or bb_drop). One size -> len-1 lists.

def geo(ht, st, cs, wb, off, htl, stl, bbh):
    return {'sizes': ['M'], 'head_tube_angle': [ht], 'seat_tube_angle': [st], 'chainstay': [cs],
            'wheelbase': [wb], 'fork_offset': [off], 'head_tube': [htl], 'seat_tube': [stl],
            'bb_height': [bbh]}


# Triathlon / time-trial (steep seat, long/low front, integrated)
GEO_TRI = geo(72.5, 78.0, 405, 990, 43, 108, 520, 264)
# Modern aero road (e.g. Dogma F, Tarmac, Teammachine, Foil, S5, Speed Concept road trim)
GEO_AERO = geo(73.2, 74.0, 408, 990, 43, 142, 555, 269)
# Endurance / climbing (more upright, slacker)
GEO_ENDURANCE = geo(72.8, 73.5, 408, 1004, 43, 174, 560, 269)
# Gravel (slack, tall, long)
GEO_GRAVEL = geo(71.8, 73.2, 430, 1035, 48, 158, 545, 272)
# Classic steel eras (TdF): slack angles, long stays, low-ish BB
GEO_CLASSIC = geo(72.0, 73.0, 418, 1010, 45, 150, 570, 264)

# wheel spec shared by archetype (BSD 622; road 700c)
def wheels(tyre_w, rim_depth_f, rim_depth_r, spokes=20, spacing_f=100, spacing_r=142):
    return {'bsd': 622, 'tyre_od': 622 + 2 * tyre_w, 'tyre_width': tyre_w, 'spokes': spokes,
            'flange_y': [-16.0, 16.0], 'flange_r': 38.0, 'spoke_cross': 0.35,
            'front': {'rim_depth': rim_depth_f, 'rim_width_brake': 25.0, 'rim_width_bed': 19.0,
                      'spacing_mm': spacing_f},
            'rear': {'rim_depth': rim_depth_r, 'rim_width_brake': 25.0, 'rim_width_bed': 19.0,
                     'spacing_mm': spacing_r}}

WHEELS_TRI = wheels(25, 85, 85, spokes=18)          # deep aero
WHEELS_AERO = wheels(26, 60, 65, spokes=20)
WHEELS_ENDURANCE = wheels(30, 32, 32, spokes=24)
WHEELS_GRAVEL = wheels(38, 35, 35, spokes=28)
WHEELS_CLASSIC = wheels(23, 12, 12, spokes=36, spacing_r=126)   # era steel rims

DRIVE_AERO = {'rings': [52, 36], 'ring_y': [-7.5, -11.5], 'bcd': 130.0, 'arm_len': 172.5,
              'arm_angle_deg': -12.0, 'q_half': 68.0}
DRIVE_CLASSIC = {'rings': [52, 42], 'ring_y': [-7.5, -11.5], 'bcd': 130.0, 'arm_len': 170.0,
                 'arm_angle_deg': -8.0, 'q_half': 64.0}

SEAT_STD = {'insert': 60, 'extension': 150, 'setback': 20, 'd': 27.2, 'saddle_len': 275, 'saddle_w': 143}
SEAT_AERO = {'insert': 40, 'extension': 140, 'setback': 8, 'd': 23.0, 'saddle_len': 262, 'saddle_w': 138}

COCKPIT_AERO = {'kind': 'aero', 'clamp_fwd': 40, 'clamp_up': 40, 'stem_len': 90, 'stem_rise_deg': 6,
                'spacer_h': 25, 'tip_rel': (300, 20), 'width': 400, 'pad_rel': (20, 95),
                'ext_tip_rel': (300, 128), 'spread': 190}
COCKPIT_DROP = {'kind': 'drop', 'clamp_fwd': 62, 'clamp_up': 18, 'stem_len': 110, 'stem_rise_deg': -7,
                'spacer_h': 25, 'width': 420, 'reach': 80, 'drop': 126}
COCKPIT_CLASSIC = {'kind': 'drop', 'clamp_fwd': 60, 'clamp_up': 30, 'stem_len': 100, 'stem_rise_deg': -6,
                   'spacer_h': 18, 'width': 400, 'reach': 92, 'drop': 140}

# tube section shapes (INFERRED) per archetype: (width_mm, depth_mm)
def shapes(aero=False, classic=False):
    if classic:
        return {'head_tube': (32, 32), 'top_tube': (28, 28), 'down_tube': (30, 30),
                'seat_tube': (28, 28), 'chain_stay': (18, 22), 'seat_stay': (14, 17),
                'fork_blade': (16, 30), 'section': 'ellipse', 'fork_section': 'teardrop'}
    if aero:
        return {'head_tube': (44, 58), 'top_tube': (36, 44), 'down_tube': (50, 78),
                'seat_tube': (40, 64), 'chain_stay': (26, 40), 'seat_stay': (20, 34),
                'fork_blade': (26, 66), 'section': 'ellipse', 'fork_section': 'teardrop'}
    return {'head_tube': (40, 46), 'top_tube': (34, 34), 'down_tube': (44, 62),
            'seat_tube': (34, 46), 'chain_stay': (24, 36), 'seat_stay': (18, 30),
            'fork_blade': (24, 42), 'section': 'ellipse', 'fork_section': 'teardrop'}

JOINTS_MODERN = {'tt_on_seat': 0.86, 'tt_on_head': 0.10, 'dt_on_head': 0.86, 'ss_on_seat': 0.82}


def _mk(id, brand, model, year, theme, geo, wh, drive, seat, cockpit, shp, joints=JOINTS_MODERN,
        accent=None, bb_shell_mm=90, voxel=1.2):
    mats = theme_for(theme, accent_override=accent)
    # map member zones -> theme paints (paint_a primary, paint_b accent, paint_c decal)
    zones = {'head_tube': 'paint_a', 'top_tube': 'paint_a', 'top_tube_head': 'paint_b',
             'down_tube': 'paint_a', 'down_tube_accent': 'paint_b', 'seat_tube': 'paint_a',
             'chain_stay': 'paint_a', 'seat_stay': 'paint_a', 'bb': 'paint_a', 'dropout': 'paint_b',
             'fork': 'paint_a', 'fork_accent': 'paint_b'}
    return {
        'id': id, 'brand': brand, 'model': model, 'year': year, 'theme': theme, 'accent': accent,
        'materials': mats, 'zones': zones, 'zone_mats': {z: z for z in zones.values()},
        'geometry': {'geometry': geo, 'headset_lower': 12.0, 'headset_upper': 17.0,
                     'axle_crown': 370.0, 'bb_shell_mm': bb_shell_mm, 'bb_shell_r': 22.0,
                     'wheels': wh, 'drivetrain': drive, 'cockpit': cockpit, 'seat': seat},
        'shapes': shp, 'joints': joints, 'voxel_mm': voxel,
    }


def P(id, brand, model, year, theme, arch, accent=None):
    """arch: 'tri' | 'aero' | 'endurance' | 'gravel' | 'classic'."""
    if arch == 'tri':
        g, w = GEO_TRI, WHEELS_TRI; seat, ck, shp = SEAT_AERO, COCKPIT_AERO, shapes(aero=True)
    elif arch == 'aero':
        g, w = GEO_AERO, WHEELS_AERO; seat, ck, shp = SEAT_STD, COCKPIT_DROP, shapes(aero=True)
    elif arch == 'gravel':
        g, w = GEO_GRAVEL, WHEELS_GRAVEL; seat, ck, shp = SEAT_STD, COCKPIT_DROP, shapes()
    elif arch == 'endurance':
        g, w = GEO_ENDURANCE, WHEELS_ENDURANCE; seat, ck, shp = SEAT_STD, COCKPIT_DROP, shapes()
    else:  # classic era steel
        g, w = GEO_CLASSIC, WHEELS_CLASSIC; seat, ck, shp = SEAT_STD, COCKPIT_CLASSIC, shapes(classic=True)
    return _mk(id, brand, model, year, theme, g, w, DRIVE_CLASSIC if arch == 'classic' else DRIVE_AERO,
               seat, ck, shp, accent=accent)


# ------------------------------------------------------------------ the set
# Trek (focus)         Pinarello            Felt
PROFILES = [
    # --- Trek ---
    P('trek-speed-concept-kona', 'Trek', 'Speed Concept "Kona"', 2027, 'kona', 'tri'),
    P('trek-madone-wyld', 'Trek', 'Madone SLR "Wyld"', 2025, 'wyld-pink', 'aero'),
    P('trek-domane-custom', 'Trek', 'Domane SL "Customizable"', 2024, 'customizable', 'endurance'),
    P('trek-checkpoint-desert', 'Trek', 'Checkpoint SLR "Desert"', 2023, 'desert', 'gravel'),
    P('trek-us-postal-2004', 'Trek', '5500 OCLV "US Postal"', 2004, 'heritage-trek', 'classic'),

    # --- Pinarello ---
    P('pinarello-bolide-kona', 'Pinarello', 'Bolide F "Kona Night"', 2024, 'night', 'tri'),
    P('pinarello-dogma-wyld', 'Pinarello', 'Dogma F "Wyld"', 2024, 'wyld-pink', 'aero'),
    P('pinarello-bolide-custom', 'Pinarello', 'Bolide F "Customizable"', 2024, 'customizable', 'tri'),
    P('pinarello-dogma-splatter', 'Pinarello', 'Dogma "Splatter"', 1993, 'splatter', 'aero'),

    # --- Felt ---
    P('felt-ia-kona', 'Felt', 'IA FRD "Kona"', 2022, 'kona', 'tri'),
    P('felt-ia-wyld', 'Felt', 'IA "Wyld Mint"', 2022, 'wyld-mint', 'tri'),
    P('felt-ia-custom', 'Felt', 'IA "Customizable"', 2022, 'customizable', 'tri'),

    # --- Canyon (kona / wyld / customizable per the original brief) ---
    P('canyon-speedmax-kona', 'Canyon', 'Speedmax CFR "Kona Lava"', 2027, 'kona', 'tri'),
    P('canyon-speedmax-wyld', 'Canyon', 'Speedmax CFR "Wyld Mint"', 2027, 'wyld-mint', 'tri'),
    P('canyon-speedmax-custom', 'Canyon', 'Speedmax CFR "Customizable"', 2027, 'customizable', 'tri'),

    # --- Tour de France eras (history room) ---
    P('tdf-steel-1937', 'Tour de France', '"La Course" steel', 1937, 'heritage-canyon', 'classic'),
    P('tdf-molteni-1972', 'Tour de France', 'Era classic (Molteni style)', 1972, 'splatter', 'classic'),
    P('tdf-aero-1989', 'Tour de France', 'Final-stage aero era', 1989, 'heritage-trek', 'classic'),
    P('tdf-carbon-1999', 'Tour de France', 'Early carbon era', 1999, 'heritage-trek', 'classic'),
    P('tdf-aero-2013', 'Tour de France', 'Modern aero era', 2013, 'moss', 'aero'),
    P('tdf-monocoque-2022', 'Tour de France', 'Current monocoque', 2022, 'pearl', 'aero'),
    P('tdf-2027-wyld', 'Tour de France', '"2027" aero study', 2027, 'wyld-mint', 'aero'),
    P('tdf-2027-kona', 'Tour de France', '"2027" tri study', 2027, 'kona', 'tri'),
]

BY_ID = {p['id']: p for p in PROFILES}
