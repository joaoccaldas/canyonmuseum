"""Generic multi-brand performance-bike generator for the museum.

Driven by a plain profile dict (see profiles.py). Reuses the website's proven build
modules verbatim — skeleton (geometry table -> frame skeleton), frame_tubes (zone-aware
tube sweeps + voxel fuse), parts (wheels / drivetrain / cockpit / saddle). No photo trace:
geometry comes from published tables; lateral widths are INFERRED and logged in the receipt.

Blender world: metres, +X forward, +Z up, +Y rider's left, drive -Y, BB at x=0, ground z=0.
"""
import os, sys, math
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
HERITAGE = os.path.join(os.path.dirname(HERE), 'heritage')
for _p in (os.path.dirname(HERE), HERITAGE):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from lib import mat, MM, catmull
import skeleton as SK
import frame_tubes as FT
import parts as P

TAU = 2 * math.pi
st = FT.station


def build_materials(pf):
    """Turn the theme contract (name -> (rgb, knobs)) into real Blender materials."""
    M = {}
    for name, spec in pf['materials'].items():
        rgb, k = spec
        M[name] = mat('mb_%s_%s' % (pf['id'], name), tuple(rgb), metal=k.get('metal', 0.0),
                      rough=k.get('rough', .5), coat=k.get('coat', 0.0), coat_rough=k.get('coat_rough', .05),
                      emit=k.get('emit'), strength=k.get('strength', 0.0))
    return M


def _size(pf):
    g = pf['geometry']
    return g.get('size') or g['geometry']['sizes'][0]


def _frame_tubes(pf, sk):
    """Drive triangle + stays + (via extra) BB shell & dropouts, as zoned tube stations (mm)."""
    spec = pf['geometry']
    geo = spec['geometry']
    i = geo['sizes'].index(_size(pf))
    S = pf['shapes']
    Z = pf['zones']
    st_len = geo['seat_tube'][i]
    ht_len = geo['head_tube'][i]
    BB, AXR = sk['BB'], sk['AX_R']
    up, sdir = sk['STEER_UP'], sk['SEAT_DIR']

    def ht_at(f): return sk['HT_TOP'] - up * (ht_len * f)
    def st_at(f): return BB + sdir * (st_len * f)

    tt_seat, tt_head = st_at(pf['joints']['tt_on_seat']), ht_at(pf['joints']['tt_on_head'])
    dt_head = ht_at(pf['joints']['dt_on_head'])
    ss_top = st_at(pf['joints']['ss_on_seat'])
    rear = spec['wheels']['rear']['spacing_mm']
    drop_ss = AXR + Vector((4, 0, 14))
    drop_cs = AXR + Vector((10, 0, 2))

    def sec(key):
        return S[key][0] / 2, S[key][1] / 2, S.get('section', 'ellipse')

    tubes = {}
    a, b, sh = sec('head_tube')
    tubes['head_tube'] = [st(sk['HT_BOT'], a, b, sh, Z['head_tube']),
                          st(sk['HT_TOP'], a, b, sh, Z['head_tube'])]
    a, b, sh = sec('top_tube')
    tubes['top_tube'] = [st(tt_seat, a, b, sh, Z['top_tube']),
                         st(tt_seat.lerp(tt_head, .5), a, b, sh, Z['top_tube']),
                         st(tt_head, a, b * S.get('tt_head_drop', .9), sh, Z.get('top_tube_head', Z['top_tube']))]
    aw, ad, ash = sec('down_tube')
    tubes['down_tube'] = [st(BB + (dt_head - BB).normalized() * 20, aw, 30, ash, Z['down_tube']),
                          st(BB.lerp(dt_head, .3), aw, ad, ash, Z['down_tube']),
                          st(BB.lerp(dt_head, .78), aw, ad, ash, Z.get('down_tube_accent', Z['down_tube'])),
                          st(dt_head, aw * .95, ad * .8, ash, Z.get('down_tube_head', Z['down_tube']))]
    a, b, sh = sec('seat_tube')
    tubes['seat_tube'] = [st(BB, a, b + 2, sh, Z['seat_tube']),
                          st(sk['ST_TOP'], a * .92, b * .9, sh, Z['seat_tube'])]
    for sgn, side in ((-1, 'R'), (1, 'L')):
        y_drop = sgn * (rear / 2 - 6)
        aw2, ad2, ash2 = sec('chain_stay')
        tubes['chain_stay_' + side] = [
            st(drop_cs + Vector((0, y_drop, 0)), aw2 * .8, ad2 * .85, ash2, Z['chain_stay']),
            st(drop_cs.lerp(BB, .55) + Vector((0, sgn * 44, 0)), aw2, ad2 * .9, ash2, Z['chain_stay']),
            st(BB + (drop_cs - BB).normalized() * 16 + Vector((0, sgn * 27, 0)), aw2, ad2, ash2, Z['chain_stay'])]
        bw, bd, bsh = sec('seat_stay')
        tubes['seat_stay_' + side] = [
            st(drop_ss + Vector((0, y_drop, 0)), bw, bd * .85, bsh, Z['seat_stay']),
            st(drop_ss.lerp(ss_top, .6) + Vector((0, sgn * 33, 0)), bw, bd, bsh, Z['seat_stay']),
            st(ss_top + (drop_ss - ss_top).normalized() * 12 + Vector((0, sgn * 10, 0)), bw, bd, bsh, Z['seat_stay'])]

    extra = []
    shell = P.lathe([(0.1, -spec['bb_shell_mm'] / 2), (spec['bb_shell_r'], -spec['bb_shell_mm'] / 2),
                     (spec['bb_shell_r'], spec['bb_shell_mm'] / 2), (0.1, spec['bb_shell_mm'] / 2)], 40, BB, closed_prof=True)
    extra.append((shell, Z['bb'], [BB + Vector((0, y, 0)) for y in (-30, 0, 30)]))
    for sgn in (-1, 1):
        c = AXR + Vector((4, sgn * (rear / 2 - 3), 7))
        extra.append((P.box(c, (44, 5, 38), round_e=2.6), Z['dropout'], [c]))
    return tubes, extra


def _fork_tubes(pf, sk):
    spec = pf['geometry']
    front = spec['wheels']['front']['spacing_mm']
    crown, up, AXF = sk['CROWN'], sk['STEER_UP'], sk['AX_F']
    fw = pf['shapes']['fork_blade'][0] / 2
    fd = pf['shapes']['fork_blade'][1] / 2
    fshape = pf['shapes'].get('fork_section', 'teardrop')
    fz = pf['zones']['fork']
    fa = pf['zones'].get('fork_accent', fz)
    tk = {'steer_stub': [st(crown - up * 4, 13, 13, 'ellipse', fz), st(crown + up * 6, 13, 13, 'ellipse', fz)],
          'crown': [st(crown + Vector((4, -42, -8)), 14, 19, 'ellipse', fz),
                    st(crown + Vector((4, 42, -8)), 14, 19, 'ellipse', fz)]}
    fk_y = front / 2 - 5
    for sgn in (-1, 1):
        top = crown + Vector((4, sgn * 40, -10))
        bot = AXF + Vector((0, sgn * fk_y, 8))
        tk['blade_%s' % ('R' if sgn < 0 else 'L')] = [st(top, fw + 2, fd, fshape, fz),
                                                        st(top.lerp(bot, .35), fw, fd * .92, fshape, fa),
                                                        st(bot, fw * .8, fd * .7, fshape, fa)]
    extra = []
    for sgn in (-1, 1):
        c = AXF + Vector((0, sgn * (front / 2 - 2), 6))
        extra.append((P.box(c, (22, 4, 30), round_e=2.6), fa, [c]))
    return tk, extra


def build(pf, target_tris=140000):
    """Build one bike from its profile dict. Returns a stats dict for the receipt."""
    spec = pf['geometry']
    size = _size(pf)
    M = build_materials(pf)
    tyre_od = spec['wheels']['tyre_od']
    sk = SK.build(spec, size, tyre_od, spec['headset_lower'], spec['headset_upper'], spec['axle_crown'])
    BB, AXF = sk['BB'], sk['AX_F']

    tubes, extra = _frame_tubes(pf, sk)
    zm = {z: M[k] for z, k in pf['zone_mats'].items()}
    voxel = pf.get('voxel_mm', 1.2)
    FT.build_fused('frame', tubes, extra, zm, voxel_mm=voxel, target=target_tris, part='frame', explode=[0, 0, 0])
    ftk, fextra = _fork_tubes(pf, sk)
    FT.build_fused('fork', ftk, fextra, zm, voxel_mm=voxel, target=int(target_tris * .3), part='fork', explode=[.12, 0, 0])

    for which, C in (('front', AXF), ('rear', sk['AX_R'])):
        w = dict(spec['wheels'][which])
        w.update(dict(bsd=spec['wheels']['bsd'], tyre_od=tyre_od, tyre_width=spec['wheels']['tyre_width'],
                      spokes=spec['wheels']['spokes'], old=w['spacing_mm'], flange_y=spec['wheels']['flange_y'],
                      flange_r=spec['wheels']['flange_r'], spoke_cross=spec['wheels'].get('spoke_cross', 0.0),
                      rim_material='rim'))
        P.build_wheel(M, C, which, w)

    dt = spec['drivetrain']
    P.build_crankset(M, BB, dt['rings'], dt['ring_y'], dt['bcd'], dt['arm_len'],
                     dt.get('arm_angle_deg', -12.0), q_half=dt.get('q_half', 70.0))

    ck = spec['cockpit']
    _, clamp = P.build_steerer_stem(M, sk['HT_TOP'], sk['STEER_TOP'], sk['STEER_UP'],
                                    ck['stem_len'], ck['stem_rise_deg'], ck['spacer_h'])
    clamp = clamp / MM if max(clamp.x, clamp.y, clamp.z) < 10 else clamp   # parts returns metres
    if ck['kind'] == 'aero':
        P.build_bullhorn(M, clamp, ck['tip_rel'], ck['width'])
        P.build_clipons(M, clamp, ck['pad_rel'], ck['ext_tip_rel'], ck['spread'])
    else:
        _build_dropbar(M, clamp, ck['width'], ck['reach'], ck['drop'])

    sp = spec['seat']
    _, head = P.build_seatpost(M, sk['ST_TOP'], sk['SEAT_DIR'], sp['insert'], sp['extension'], sp['setback'],
                               d=sp.get('d', 27.2))
    P.build_saddle(M, head, sp['saddle_len'], sp['saddle_w'])

    tri = sum(sum(len(q.vertices) - 2 for q in o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')
    return {'stack': round(sk['derived']['stack'], 1), 'reach': round(sk['derived']['reach'], 1),
            'wheelbase_in': spec['geometry']['wheelbase'][spec['geometry']['sizes'].index(size)],
            'tris': tri}


def _build_dropbar(M, clamp, width, reach, drop):
    """Compact road drop bar swept from the stem clamp (all mm)."""
    pb = P.PB()
    hw = width / 2
    for sgn in (-1, 1):
        pts = [clamp + Vector((0, sgn * hw * .9, 0)), clamp + Vector((reach * .5, sgn * hw, -6)),
               clamp + Vector((reach, sgn * hw, -10)), clamp + Vector((reach * .92, sgn * hw * .92, -drop * .55)),
               clamp + Vector((reach * .6, sgn * hw * .8, -drop))]
        path = catmull(pts, 5)
        prof = [P.ellipse_prof(14, 14, 16)] + [P.ellipse_prof(11, 11, 16)] * (len(path) - 1)
        pb.add(P.swept_tube(path, prof), M['tape'])
    pb.build('dropbar', sharp=None, part='dropbar', explode=[.12, 0, .08])
