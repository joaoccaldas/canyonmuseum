"""Original-geometry luxury chronograph study for the Breitling room (gate G9).

Not a copy of any Breitling model: an original case, dial, bezel and bracelet built
procedurally with the same lib/parts helpers the bikes use. No logo, no wordmark.
Units: metres world; watch faces +Y (front). Built around a 44 mm study case.

Usage:
  blender -b --factory-startup --python-exit-code 1 -P blender/multibrand/watch.py -- <out_dir>
"""
import bpy, sys, os, math
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
for _p in (os.path.dirname(HERE), HERE, os.path.join(os.path.dirname(HERE), 'heritage')):
    if _p not in sys.path:
        sys.path.insert(0, _p)
from lib import mesh, mat, lathe, box, sweep, superellipse, MM

TAU = 2 * math.pi


def W(v):
    return Vector(v) * MM


def build(out_dir):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    case_r, case_h = 22.0, 13.0
    # materials: brushed titanium + black dial + luminous cream indices (PBR, not plastic)
    Ti = mat('watch_titanium', (0.55, 0.57, 0.60), metal=1.0, rough=.28, coat=.3)
    TiDark = mat('watch_titanium_dark', (0.32, 0.33, 0.36), metal=1.0, rough=.34)
    dial = mat('watch_dial', (0.04, 0.05, 0.07), metal=.2, rough=.5, coat=.6)
    lume = mat('watch_lume', (0.92, 0.94, 0.86), rough=.4, coat=.2, emit=(0.92, 0.94, 0.86), strength=.2)
    accent = mat('watch_accent', (0.78, 0.06, 0.18), metal=.3, rough=.3, coat=.8)
    subdial = mat('watch_subdial', (0.02, 0.02, 0.03), metal=.1, rough=.35)

    # case: lathe stepped ring around the dial axis (Y)
    prof = [(case_r + 1.5, -case_h / 2), (case_r + 2.0, -case_h / 6), (case_r + 1.8, case_h / 6),
            (case_r + 1.0, case_h / 2 - 1), (case_r - 2, case_h / 2), (case_r - 3.5, case_h / 2),
            (case_r - 3.5, -case_h / 2), (0.1, -case_h / 2)]
    V, F, _ = lathe(prof, 96, Vector((0, 0, 0)), closed_prof=True)
    mesh('case', V, F, Ti, sharp=40, part='case')

    # bezel ring (slightly proud, darker)
    prof = [(case_r + 1.9, case_h / 2 - 1), (case_r + 0.5, case_h / 2 + 2.4), (case_r - 2.5, case_h / 2 + 2.4),
            (case_r - 2.5, case_h / 2 - 1)]
    V, F, _ = lathe(prof, 96, Vector((0, 0, 0)), closed_prof=True)
    mesh('bezel', V, F, TiDark, sharp=35, part='bezel')

    # dial face (disc at case top)
    prof = [(0.1, case_h / 2 - 1), (case_r - 3.5, case_h / 2 - 1)]
    V, F, _ = lathe(prof, 96, Vector((0, 0, 0)), axis='Y')
    mesh('dial', V, F, dial, sharp=None, part='dial')

    # indices: 12 batons around the dial, lume-filled
    for k in range(12):
        a = k / 12 * TAU
        cx, cz = (case_r - 8) * math.cos(a), (case_r - 8) * math.sin(a)
        g = box(Vector((cx, case_h / 2 - 0.6, cz)), (1.6, 0.6, 6.0) if k % 3 else (2.6, 0.8, 7.0), round_e=0.4)
        # rotate baton tangentially around Y
        from lib import xform
        from mathutils import Matrix
        g = xform(g, Matrix.Translation(W(Vector((0, 0, 0)))) @ Matrix.Rotation(-a, 4, 'Y'))
        mesh('idx_%02d' % k, g[0], g[1], lume, sharp=None, part='dial')

    # subdials (3-6-9)
    for k, a in enumerate((math.pi * 0.25, math.pi * 0.75, math.pi * 1.5)):
        cx, cz = 8.5 * math.cos(a), 8.5 * math.sin(a)
        prof = [(0.1, 0.15), (5.2, 0.15), (5.2, -0.4), (0.1, -0.4)]
        V, F, _ = lathe(prof, 48, Vector((cx, case_h / 2 - 0.4, cz)), closed_prof=True, axis='Y')
        mesh('sub_%d' % k, V, F, subdial, sharp=30, part='dial')

    # hands: hour/minute/seconds — original geometry, accent on the seconds hand
    def hand(a, length, width, m, hub=False):
        tip = Vector(((length) * math.cos(a), case_h / 2 + 0.6, (length) * math.sin(a)))
        base = Vector((-4 * math.cos(a), case_h / 2 + 0.6, -4 * math.sin(a)))
        prof = [superellipse(width, width, 2.4, 12), superellipse(width * 0.5, width * 0.5, 2.4, 12)]
        V, F, _ = sweep([W(base), W(tip)], prof, lat=Vector((0, 1, 0)))
        mesh('hand', V, F, m, sharp=None, part='hands')
    hand(math.radians(305), 12.5, 2.2, lume)   # hour
    hand(math.radians(35), 16.5, 1.8, lume)    # minute
    hand(math.radians(150), 18.0, 0.8, accent)  # chronograph seconds
    prof = [(0.1, -0.2), (2.8, -0.2), (2.8, 0.9), (0.1, 0.9)]
    V, F, _ = lathe(prof, 40, Vector((0, case_h / 2 + 0.6, 0)), closed_prof=True, axis='Y')
    mesh('cannon_pinion', V, F, TiDark, sharp=None, part='hands')

    # crown + pushers (right flank, original geometry)
    for y, r, n in ((0, 4.0, 'crown'), (11, 2.6, 'pusher_chrono'), (-11, 2.6, 'pusher_reset')):
        prof = [(0.1, 0), (r, 0), (r, 3.5), (r * 0.8, 5.2), (0.1, 5.2)]
        V, F, _ = lathe(prof, 32, Vector((case_r + 1.8, y, 0)), closed_prof=True, axis='X')
        mesh(n, V, F, TiDark, sharp=30, part='case')

    # bracelet links (titanium, brushed) top + bottom of the case
    for sgn in (1, -1):
        for i in range(4):
            z0 = (case_r - 4) + i * 4.6
            if sgn < 0:
                z0 = -z0
            g = box(Vector((0, 19 + i * 1.2, z0)), (16 - i * 0.7, 2.4, 4.2), round_e=1.2)
            mesh('link', g[0], g[1], Ti if i % 2 else TiDark, sharp=None, part='bracelet')

    os.makedirs(out_dir, exist_ok=True)
    bpy.context.scene['multibrand'] = '{"id":"breitling-chronograph-study","kind":"watch","representation":"original study, not a Breitling product"}'
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, 'watch_master.blend'))
    for o in bpy.context.scene.objects:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(out_dir, 'watch_web_raw.glb'), export_format='GLB',
                              use_selection=True, export_extras=True, export_yup=True, export_apply=True,
                              export_materials='EXPORT', export_cameras=False, export_lights=False)
    tri = sum(sum(len(q.vertices) - 2 for q in o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH')
    print('[breitling] built watch tris=%s -> %s' % (tri, out_dir), flush=True)


if __name__ == '__main__':
    build(sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'assets/multibrand/breitling-watch')
