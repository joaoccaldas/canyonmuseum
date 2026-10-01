"""Render a hero + side still of one built bike using the museum exhibition rig.

Usage:
  blender -b <master.blend> --python-exit-code 1 -P blender/multibrand/render.py -- <out_dir> [samples]
"""
import bpy, sys, os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]
SAMPLES = int(argv[1]) if len(argv) > 1 else 64
os.makedirs(OUT, exist_ok=True)

sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'
sc.unit_settings.scale_length = 1.0
sc.render.engine = 'CYCLES'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'METAL'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = (d.type == 'METAL')
    sc.cycles.device = 'GPU'
except Exception:
    sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'AgX'
sc.view_settings.look = 'AgX - Medium High Contrast'
sc.render.resolution_x = 1600
sc.render.resolution_y = 1000
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'

# world + floor (matches museum_scene.py)
world = bpy.data.worlds.new('Study ambient')
sc.world = world
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.20, 0.25, 0.32, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.18


def area(name, loc, target, power, size, color):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy, d.shape, d.size, d.color = power, 'RECTANGLE', size, color
    o = bpy.data.objects.new(name, d)
    sc.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = (Vector(target) - o.location).to_track_quat('-Z', 'Y').to_euler()


area('Key', (0, -2.4, 3.1), (0.15, 0, 0.5), 240, 3.5, (1, .95, .87))
area('Edge', (0.7, 1.7, 2.1), (0.2, 0, 0.6), 300, 3.2, (.72, .84, 1))
area('Front card', (2.4, -0.7, 1.3), (0.2, 0, 0.6), 80, 1.5, (1, 1, 1))
area('Fill', (-2, -0.4, 1.1), (-0.2, 0, 0.5), 65, 1.8, (.82, .89, 1))
area('Top', (0, 0, 3.6), (0, 0, 0.5), 170, 4, (1, .96, .91))

bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.0012))
floor = bpy.context.object
fm = bpy.data.materials.new('Floor')
bs = fm.node_tree.nodes['Principled BSDF']
bs.inputs['Base Color'].default_value = (0.016, 0.021, 0.027, 1)
bs.inputs['Roughness'].default_value = 0.30
bs.inputs['Metallic'].default_value = 0.15
floor.data.materials.append(fm)

views = {'hero': ((1.48, -3.35, 1.30), (0.10, 0, 0.54), 62),
         'side': ((0.094, -4.0, 0.53), (0.094, 0, 0.53), 64)}
for name, (pos, tgt, lens) in views.items():
    d = bpy.data.cameras.new('cam_' + name)
    o = bpy.data.objects.new('cam_' + name, d)
    sc.collection.objects.link(o)
    o.location = pos
    o.rotation_euler = (Vector(tgt) - o.location).to_track_quat('-Z', 'Y').to_euler()
    d.lens = lens
    if name == 'side':
        d.type = 'ORTHO'
        d.ortho_scale = 2.08
    sc.camera = o
    sc.render.filepath = os.path.join(OUT, 'render_%s.png' % name)
    bpy.ops.render.render(write_still=True)
print('[multibrand render] wrote renders to %s' % OUT)
