"""Build reusable Kona heritage bike + Nike running museum assets.

Purpose
-------
Create real editable Blender geometry and browser-ready GLBs for museum prototyping.
This is intentionally a *geometry-study* layer, not a claim of CAD-exact replication.

Important
---------
- Trek Speed Concept is deliberately NOT generated here because the repo already contains
  Trek assets. Reuse them instead of duplicating.
- Brand logos / protected decal artwork are not embedded. Identification lives in museum
  metadata and can be layered separately after provenance/legal review.
- Every asset is a separate semantic object hierarchy and is also exported into one pack GLB.

Run:
  python3 -m pip install bpy
  python3 blender/kona_heritage_nike_assets.py

Outputs:
  assets/kona-heritage/pack/kona_heritage_nike_pack.glb
  assets/kona-heritage/pack/kona_heritage_nike_pack.blend
  assets/kona-heritage/bikes/<id>.glb
  assets/kona-heritage/shoes/<id>.glb
"""
from __future__ import annotations
import bpy
import math
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "kona-heritage"
BIKES_OUT = OUT / "bikes"
SHOES_OUT = OUT / "shoes"
PACK_OUT = OUT / "pack"
for p in (BIKES_OUT, SHOES_OUT, PACK_OUT):
    p.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"

world = bpy.data.worlds.new("MuseumWorld")
scene.world = world
world.color = (0.018, 0.018, 0.022)

def material(name, color, roughness=.35, metallic=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    return m

CARBON = material("MAT_CARBON", (0.025,0.028,0.032), .22, .35)
BLACK = material("MAT_BLACK", (0.01,0.012,0.014), .28, .12)
SILVER = material("MAT_SILVER", (.36,.38,.42), .22, .75)
WHITE = material("MAT_WHITE", (.78,.79,.80), .32, .04)
RED = material("MAT_RED", (.55,.025,.035), .30, .08)
BLUE = material("MAT_BLUE", (.025,.11,.38), .30, .08)
YELLOW = material("MAT_YELLOW", (.86,.55,.03), .34, .05)
TEAL = material("MAT_TEAL", (.03,.36,.38), .28, .06)
FOAM = material("MAT_ZOOMX", (.86,.84,.79), .66, 0)
AIR = material("MAT_AIR_ZOOM", (.18,.46,.72), .18, .02)
RUBBER = material("MAT_OUTSOLE", (.03,.03,.035), .72, 0)
UPPER = material("MAT_ENGINEERED_MESH", (.84,.84,.82), .50, 0)

ROOT_EMPTY = bpy.data.objects.new("KONA_HERITAGE_AND_NIKE_PACK", None)
scene.collection.objects.link(ROOT_EMPTY)

def cube(name, loc, scale, mat, parent, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new("edge", "BEVEL")
        mod.width = bevel
        mod.segments = 2
    o.data.materials.append(mat)
    o.parent = parent
    return o

def cyl_between(name, a, b, radius, mat, parent, verts=16):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=verts, radius=radius, depth=d.length, location=(a+b)/2
    )
    o = bpy.context.object
    o.name = name
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    o.data.materials.append(mat)
    o.parent = parent
    return o

def torus(name, loc, major, minor, mat, parent):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor,
        major_segments=32, minor_segments=8,
        location=loc, rotation=(math.pi/2,0,0)
    )
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    o.parent = parent
    return o

def disc(name, loc, radius, mat, parent):
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=48, radius=radius, depth=.012,
        location=loc, rotation=(math.pi/2,0,0)
    )
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    o.parent = parent
    return o

def bike(asset_id, style, frame=CARBON, accent=WHITE):
    g = bpy.data.objects.new(asset_id, None)
    scene.collection.objects.link(g)
    g.parent = ROOT_EMPTY

    rear=(-.50,0,.335); front=(.50,0,.335)
    torus(asset_id+"_REAR_WHEEL", rear, .335, .018, BLACK, g)
    torus(asset_id+"_FRONT_WHEEL", front, .335, .018, BLACK, g)
    disc(asset_id+"_REAR_DISC", rear, .305, BLACK, g)

    bb=(-.07,0,.36); head=(.36,0,.66); seat=(-.24,0,.72)
    if style == "p5x":
        cyl_between(asset_id+"_LOWER_MONO", bb, head, .055, frame, g)
        cyl_between(asset_id+"_BEAM", head, (-.26,0,.78), .065, frame, g)
        cyl_between(asset_id+"_FORK", head, front, .034, frame, g)
        cyl_between(asset_id+"_STAY", bb, rear, .035, frame, g)
    else:
        cyl_between(asset_id+"_DOWN_TUBE", head, bb, .060 if style in {"shiv","plasma","bmc"} else .052, frame, g)
        cyl_between(asset_id+"_TOP_TUBE", head, seat, .042, frame, g)
        cyl_between(asset_id+"_SEAT_TUBE", bb, seat, .052, frame, g)
        cyl_between(asset_id+"_CHAIN_STAY", bb, rear, .030, frame, g)
        cyl_between(asset_id+"_SEAT_STAY", seat, rear, .027, frame, g)
        cyl_between(asset_id+"_FORK", head, front, .033, frame, g)
        if style == "shiv":
            cube(asset_id+"_FUELCELL", (-.05,0,.56), (.11,.045,.10), accent, g, .028)
        elif style == "felt":
            cube(asset_id+"_IA_FAIRING", (.05,0,.50), (.13,.05,.12), frame, g, .03)
        elif style == "plasma":
            cube(asset_id+"_PLASMA_HEAD", (.31,0,.63), (.08,.05,.12), frame, g, .025)
        elif style == "bmc":
            cube(asset_id+"_SPEEDMACHINE_STORAGE", (-.28,0,.59), (.08,.05,.14), accent, g, .025)
        elif style == "ordu":
            cube(asset_id+"_ORDU_NOTCH", (.20,0,.57), (.08,.045,.10), accent, g, .025)

    cyl_between(asset_id+"_AERO_BASE", (.30,-.18,.74), (.30,.18,.74), .018, BLACK, g)
    cyl_between(asset_id+"_EXT_L", (.30,-.075,.75), (.57,-.075,.79), .014, BLACK, g)
    cyl_between(asset_id+"_EXT_R", (.30,.075,.75), (.57,.075,.79), .014, BLACK, g)
    cube(asset_id+"_SADDLE", (-.30,0,.83), (.11,.045,.025), BLACK, g, .02)
    disc(asset_id+"_CRANK", bb, .055, SILVER, g)

    g["asset_kind"] = "bike"
    g["evidence_class"] = "geometry-study"
    return g

def loft_mesh(name, sections, mat, parent):
    """Create a smooth closed shoe-like volume from x/width/z_low/z_high sections."""
    verts, faces = [], []
    for x, half_w, z0, z1 in sections:
        verts += [(x,-half_w,z0),(x,half_w,z0),(x,-half_w,z1),(x,half_w,z1)]
    for i in range(len(sections)-1):
        a=i*4; b=(i+1)*4
        faces += [(a,b,b+1,a+1),(a+2,a+3,b+3,b+2),(a,a+2,b+2,b),(a+1,b+1,b+3,a+3)]
    faces += [(0,1,3,2)]
    e=(len(sections)-1)*4
    faces += [(e,e+2,e+3,e+1)]
    me=bpy.data.meshes.new(name+"_MESH")
    me.from_pydata(verts, [], faces); me.update()
    o=bpy.data.objects.new(name, me)
    scene.collection.objects.link(o)
    o.data.materials.append(mat); o.parent=parent
    bev=o.modifiers.new("soft_form","BEVEL"); bev.width=.012; bev.segments=3
    return o

def shoe(asset_id, kind, accent):
    """Museum v0.2 shoe study: lofted forms replace the original box blockout."""
    g=bpy.data.objects.new(asset_id,None)
    scene.collection.objects.link(g); g.parent=ROOT_EMPTY

    if kind=="vaporfly4pct":
        sole=[(-.155,.050,.012,.030),(-.115,.057,.010,.040),(-.055,.061,.010,.050),(.015,.062,.012,.060),(.080,.060,.015,.066),(.135,.052,.020,.060),(.175,.032,.026,.048)]
        upper_h=[.120,.135,.130,.115,.092,.070,.045]
    elif kind=="vaporflynext":
        sole=[(-.158,.050,.012,.035),(-.118,.058,.010,.048),(-.055,.063,.010,.062),(.015,.064,.012,.071),(.082,.061,.017,.072),(.140,.052,.022,.062),(.178,.031,.030,.050)]
        upper_h=[.125,.140,.136,.120,.096,.072,.046]
    elif kind=="alphafly1":
        sole=[(-.160,.052,.014,.050),(-.118,.061,.012,.070),(-.050,.066,.012,.080),(.020,.068,.015,.086),(.085,.067,.022,.090),(.145,.056,.032,.078),(.182,.033,.038,.056)]
        upper_h=[.132,.150,.148,.132,.105,.078,.048]
    else:
        sole=[(-.160,.053,.012,.048),(-.120,.061,.010,.067),(-.055,.066,.010,.078),(.015,.068,.013,.085),(.082,.068,.020,.090),(.143,.058,.028,.079),(.182,.034,.035,.058)]
        upper_h=[.128,.147,.145,.130,.105,.078,.048]

    loft_mesh(asset_id+"_MIDSOLE", sole, FOAM, g)
    upper_sections=[]
    for (x,w,z0,z1),h in zip(sole,upper_h):
        base=z1-.004
        upper_sections.append((x,max(.025,w*.82),base,base+h))
    loft_mesh(asset_id+"_UPPER", upper_sections, UPPER, g)
    loft_mesh(asset_id+"_OUTSOLE", [(x,w*.96,max(0,z0-.006),z0+.006) for x,w,z0,z1 in sole], RUBBER, g)
    loft_mesh(asset_id+"_CARBON_FLYPLATE", [(x,min(.056,w*.90),z0+(z1-z0)*.55,z0+(z1-z0)*.55+.004) for x,w,z0,z1 in sole], CARBON, g)

    if kind in {"alphafly1","alphafly3"}:
        for idx,yy in enumerate((-.032,.032)):
            bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.027,depth=.050,location=(.095,yy,.062),rotation=(math.pi/2,0,0))
            a=bpy.context.object; a.name=f"{asset_id}_AIRZOOM_{idx+1}"; a.scale.x=1.10
            a.data.materials.append(AIR); a.parent=g

    cube(asset_id+"_HEEL_COUNTER",(-.145,0,upper_sections[0][3]-.020),(.030,.047,.050),accent,g,.018)
    cube(asset_id+"_COLLAR_VOID",(-.105,0,upper_sections[1][3]-.018),(.030,.030,.020),BLACK,g,.020)
    cube(asset_id+"_MUSEUM_ID_PANEL",(.035,-.066,.145),(.070,.004,.012),accent,g,.004)

    g["asset_kind"]="shoe"
    g["evidence_class"]="geometry-study-v0.2"
    g["public_status"]="prototype-not-cad-exact"
    return g

ASSETS = {
    "cervelo-p5x-kona-study": bike("cervelo-p5x-kona-study", "p5x", CARBON, RED),
    "specialized-shiv-disc-kona-study": bike("specialized-shiv-disc-kona-study", "shiv", CARBON, RED),
    "felt-ia-kona-study": bike("felt-ia-kona-study", "felt", CARBON, WHITE),
    "scott-plasma-kona-study": bike("scott-plasma-kona-study", "plasma", CARBON, YELLOW),
    "bmc-speedmachine-kona-study": bike("bmc-speedmachine-kona-study", "bmc", CARBON, TEAL),
    "orbea-ordu-kona-study": bike("orbea-ordu-kona-study", "ordu", CARBON, BLUE),
    "nike-vaporfly-4pct-study": shoe("nike-vaporfly-4pct-study", "vaporfly4pct", RED),
    "nike-vaporfly-next-study": shoe("nike-vaporfly-next-study", "vaporflynext", BLUE),
    "nike-alphafly-next-study": shoe("nike-alphafly-next-study", "alphafly1", TEAL),
    "nike-alphafly-3-study": shoe("nike-alphafly-3-study", "alphafly3", YELLOW),
}

scene["asset_pack"] = "Kona Heritage Bikes + Nike Running Museum"
scene["duplicate_policy"] = "Trek Speed Concept omitted: reuse existing repo asset."
scene["asset_contract"] = "Geometry-study assets; no trademark decal textures embedded."

def descendants(root):
    found = [root]
    stack = list(root.children)
    while stack:
        o = stack.pop()
        found.append(o)
        stack.extend(list(o.children))
    return found

def export_asset(asset_id, root_obj):
    bpy.ops.object.select_all(action="DESELECT")
    for o in descendants(root_obj):
        o.select_set(True)
    root_obj.select_set(True)
    out_dir = SHOES_OUT if root_obj["asset_kind"] == "shoe" else BIKES_OUT
    path = out_dir / f"{asset_id}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
    )
    return path

for asset_id, obj in ASSETS.items():
    export_asset(asset_id, obj)


PREVIEW_OUT = OUT / "previews"
PREVIEW_OUT.mkdir(parents=True, exist_ok=True)

def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()

def ensure_preview_rig():
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = 8
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 820
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    bpy.ops.object.camera_add(location=(0,-8.8,3.3))
    cam=bpy.context.object
    cam.name="QA_CAMERA"
    look_at(cam,(0,0,.72))
    scene.camera=cam
    for name,loc,energy,size in [
        ("QA_KEY",(0,-2.5,6.2),1800,7.5),
        ("QA_FILL",(4.0,-1.0,3.8),700,4.5),
        ("QA_RIM",(-4.0,1.0,3.5),900,4.0),
    ]:
        bpy.ops.object.light_add(type="AREA", location=loc)
        l=bpy.context.object
        l.name=name
        l.data.energy=energy
        l.data.shape="DISK"
        l.data.size=size
    floor_mat=material("MAT_QA_FLOOR",(.055,.055,.060),.82,.0)
    cube("QA_FLOOR",(0,0,-.045),(5.8,1.5,.04),floor_mat,ROOT_EMPTY,.004)
    return cam

def render_preview(filename, visible_ids, positions, target=(0,0,.72), camera=(0,-8.8,3.3)):
    for aid,obj in ASSETS.items():
        hidden = aid not in visible_ids
        obj.hide_render = hidden
        obj.hide_viewport = hidden
    for aid,loc in positions.items():
        ASSETS[aid].location=loc
    cam=scene.camera or ensure_preview_rig()
    cam.location=camera
    look_at(cam,target)
    scene.render.filepath=str(PREVIEW_OUT/filename)
    bpy.ops.render.render(write_still=True)

ensure_preview_rig()
bike_ids=[
    "cervelo-p5x-kona-study","specialized-shiv-disc-kona-study","felt-ia-kona-study",
    "scott-plasma-kona-study","bmc-speedmachine-kona-study","orbea-ordu-kona-study"
]
render_preview(
    "bikes-v0.2.png",
    bike_ids,
    {aid:((-4.25+i*1.70),0,0) for i,aid in enumerate(bike_ids)},
    target=(0,0,.48),
    camera=(0,-8.6,3.1),
)
shoe_ids=[
    "nike-vaporfly-4pct-study","nike-vaporfly-next-study",
    "nike-alphafly-next-study","nike-alphafly-3-study"
]
render_preview(
    "nike-shoes-v0.2.png",
    shoe_ids,
    {aid:((-1.80+i*1.20),0,.04) for i,aid in enumerate(shoe_ids)},
    target=(0,0,.13),
    camera=(0,-5.1,1.55),
)
for obj in ASSETS.values():
    obj.hide_render=False
    obj.hide_viewport=False

pack_blend = PACK_OUT / "kona_heritage_nike_pack.blend"
pack_glb = PACK_OUT / "kona_heritage_nike_pack.glb"
bpy.ops.wm.save_as_mainfile(filepath=str(pack_blend))
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=str(pack_glb),
    export_format="GLB",
    use_selection=True,
    export_apply=True,
)

print(f"built {len(ASSETS)} assets")
for p in sorted(OUT.rglob("*.glb")):
    print(p.relative_to(ROOT), p.stat().st_size)
print(pack_blend.relative_to(ROOT), pack_blend.stat().st_size)
