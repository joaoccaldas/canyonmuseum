"""Build one multibrand bike to .blend + raw GLB, then hand off to the heritage optimiser.

Usage:
  blender -b --factory-startup --python-exit-code 1 -P blender/multibrand/build.py -- \
      <profile_id|all> <out_dir> [--quick] [--tris N]

Writes <out_dir>/<id>/bike_master.blend and <out_dir>/<id>/bike_web_raw.glb per bike,
plus a receipt JSON (geometry close, tris, theme, uncertainties).
"""
import bpy, sys, os, json, time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import generator
from profiles import PROFILES, BY_ID

argv = sys.argv[sys.argv.index('--') + 1:]
TARGET, OUT = argv[0], argv[1]
QUICK = '--quick' in argv
TRIS = 60000 if QUICK else (int(argv[argv.index('--tris') + 1]) if '--tris' in argv else 140000)

sel = PROFILES if TARGET == 'all' else [BY_ID[TARGET]]
os.makedirs(OUT, exist_ok=True)
receipts = []
for pf in sel:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    t = time.time()
    od = os.path.join(OUT, pf['id'])
    os.makedirs(od, exist_ok=True)
    stats = generator.build(pf, target_tris=TRIS)
    master = os.path.join(od, 'bike_master.blend')
    bpy.context.scene['multibrand'] = json.dumps({
        'id': pf['id'], 'brand': pf['brand'], 'model': pf['model'], 'year': pf['year'],
        'theme': pf['theme'], 'representation': 'study',
        'units': 'metres, +X forward, +Z up (Blender); glTF is Y-up',
        'source': 'Original study; published geometry table + inferred lateral widths.'})
    bpy.ops.wm.save_as_mainfile(filepath=master)
    for o in bpy.context.scene.objects:
        o.select_set(True)
    glb = os.path.join(od, 'bike_web_raw.glb')
    bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_extras=True,
                              export_yup=True, export_apply=True, export_texcoords=True, export_normals=True,
                              export_materials='EXPORT', export_cameras=False, export_lights=False)
    receipts.append({'id': pf['id'], 'brand': pf['brand'], 'model': pf['model'], 'theme': pf['theme'],
                     'seconds': round(time.time() - t, 1), 'tris': stats['tris'],
                     'stack': stats['stack'], 'reach': stats['reach'], 'wheelbase_in': stats['wheelbase_in'],
                     'glb': glb, 'blend': master,
                     'uncertainties': ['Lateral tube widths, stay spread and hub widths inferred; not visible from a side photo.',
                                        'Geometry table is a representative published size for the model family.']})
    print('[multibrand] built %s tris=%s  (%.1fs)' % (pf['id'], stats['tris'], receipts[-1]['seconds']), flush=True)

with open(os.path.join(OUT, 'receipts.json'), 'w') as f:
    json.dump(receipts, f, indent=2)
print('[multibrand] done %d bike(s)' % len(sel), flush=True)
