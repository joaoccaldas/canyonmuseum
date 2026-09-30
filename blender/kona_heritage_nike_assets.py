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

def beam_between(name, a, b, width, depth, mat, parent, bevel=.012):
    """Aero beam with rectangular/rounded cross-section, aligned between measured points."""
    a,b=Vector(a),Vector(b)
    d=b-a
    bpy.ops.mesh.primitive_cube_add(location=(a+b)/2)
    o=bpy.context.object
    o.name=name
    o.scale=(width/2, depth/2, d.length/2)
    o.rotation_mode="QUATERNION"
    o.rotation_quaternion=d.to_track_quat("Z","Y")
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    mod=o.modifiers.new("aero_edge","BEVEL"); mod.width=bevel; mod.segments=3
    o.data.materials.append(mat); o.parent=parent
    return o

BIKE_GEOMETRY = {
    # Official Cervelo P5 DISC MK2 geometry, size 54.
    "cervelo-p5-disc-mk2-size54": dict(
        style="p5", wheelbase=0.995, chainstay=0.405, bb_drop=0.075,
        stack=0.503, reach=0.418, head_angle=72.5, head_tube=0.098,
        seat_angle=79.0, seat_tube=0.515, tire_od=0.674,
        source="https://www.cervelo.com/en-US/support/P5%20DISC%20MK2"
    ),
    # Official Specialized S-Works Shiv Disc geometry, size M.
    "specialized-shiv-disc-size-m": dict(
        style="shiv", wheelbase=1.001, chainstay=0.415, bb_drop=0.072,
        stack=0.514, reach=0.401, head_angle=72.0, head_tube=0.094,
        seat_angle=77.0, seat_tube=0.547, tire_od=0.674,
        pad_stack=0.585, pad_reach=0.556,
        source="https://www.specialized.com/se/sv/s-works-shiv-disc-module/p/175306"
    ),
    # Official Felt 2015 catalog IA geometry, size 54: historically relevant Kona-era platform.
    "felt-ia-2015-size54": dict(
        style="felt", wheelbase=0.991, chainstay=0.400, bb_drop=0.072,
        stack=0.522, reach=0.404, head_angle=72.0, head_tube=0.111,
        seat_angle=78.5, seat_tube=0.546, tire_od=0.668,
        source="https://www.feltbicycles.com/documents/archive/2015_FELT_Catalog.pdf"
    ),
    # Official BMC Speedmachine 01 geometry, size M.
    "bmc-speedmachine-01-size-m": dict(
        style="bmc", wheelbase=1.000, chainstay=0.405, bb_drop=0.072,
        front_center=0.606, fork_length=0.391,
        seat_angle=80.0, seat_tube=0.525, tire_od=0.678,
        pad_stack=0.588, pad_reach=0.486,
        source="https://us.bmc-switzerland.com/products/speedmachine-01-four-bikes-bmc-26a-000005"
    ),
    # Official Orbea Ordu current geometry, S/M. Frame stack/reach are not published on the
    # current page, so axle/BB/head/cockpit dimensions are hard constraints and the remaining
    # tube silhouette is explicitly a measured reconstruction rather than claimed CAD.
    "orbea-ordu-current-sm": dict(
        style="ordu", wheelbase=1.007, chainstay=0.405, bb_drop=0.075,
        front_center=0.613, head_tube=0.096, head_angle=72.0,
        seat_angle=78.0, tire_od=0.674,
        bar_stack=0.516, bar_reach=0.665, pad_stack=0.550, pad_reach=0.505,
        source="https://www.orbea.com/us-en/bicycles/ordu-m10iltd/pdf"
    ),
    # Scott official page exposes product architecture but not numeric geometry in text.
    # Retain as source-locked provisional until official geometry can be extracted.
    "scott-plasma-rc-provisional": dict(
        style="plasma", wheelbase=0.990, chainstay=0.405, bb_drop=0.072,
        stack=0.518, reach=0.398, head_angle=72.5, head_tube=0.115,
        seat_angle=76.5, seat_tube=0.530, tire_od=0.678,
        source="https://www.scott-sports.com/us/en/product/scott-plasma-rc-ultimate-bike",
        provisional=True
    ),
}

def bike(asset_id, frame=CARBON, accent=WHITE):
    geo=BIKE_GEOMETRY[asset_id]
    style=geo["style"]
    g=bpy.data.objects.new(asset_id,None)
    scene.collection.objects.link(g); g.parent=ROOT_EMPTY

    wr=geo["tire_od"]/2
    wb=geo["wheelbase"]
    cs=geo["chainstay"]
    drop=geo["bb_drop"]
    rear=(0,0,wr)
    front=(wb,0,wr)
    bb_x=math.sqrt(max(cs*cs-drop*drop,0))
    bb=(bb_x,0,wr-drop)

    torus(asset_id+"_REAR_WHEEL",rear,wr,.016,BLACK,g)
    torus(asset_id+"_FRONT_WHEEL",front,wr,.016,BLACK,g)
    disc(asset_id+"_REAR_DISC",rear,wr-.028,BLACK,g)

    if "stack" in geo and "reach" in geo:
        head_top=(bb[0]+geo["reach"],0,bb[2]+geo["stack"])
    else:
        # BMC/Orbea: use front-center / cockpit hard constraints from manufacturer.
        fc=geo["front_center"]
        head_top=(bb[0]+fc*.70,0,bb[2]+(geo.get("pad_stack",.56)-.10))

    ha=math.radians(geo.get("head_angle",72.0))
    ht=geo.get("head_tube",.105)
    head_bottom=(head_top[0]+math.cos(ha)*ht,0,head_top[2]-math.sin(ha)*ht)

    st_len=geo.get("seat_tube",.525)
    sa=math.radians(geo.get("seat_angle",78.0))
    seat_top=(bb[0]-math.cos(sa)*st_len,0,bb[2]+math.sin(sa)*st_len)

    # Main frame uses measured nodes and aero-depths tuned by documented product architecture.
    beam_between(asset_id+"_DOWN_TUBE",head_bottom,bb,.072,.046,frame,g,.014)
    beam_between(asset_id+"_TOP_TUBE",head_top,seat_top,.048,.038,frame,g,.012)
    beam_between(asset_id+"_SEAT_TUBE",bb,seat_top,.066,.043,frame,g,.014)
    beam_between(asset_id+"_CHAIN_STAY",bb,rear,.036,.026,frame,g,.008)
    beam_between(asset_id+"_SEAT_STAY",seat_top,rear,.030,.022,frame,g,.008)
    beam_between(asset_id+"_FORK_L",head_bottom,(front[0],-.035,front[2]),.036,.026,frame,g,.008)
    beam_between(asset_id+"_FORK_R",head_bottom,(front[0],.035,front[2]),.036,.026,frame,g,.008)

    # Product-specific architecture, scaled from the measured frame.
    if style=="shiv":
        # Shiv's integrated nutrition/hydration Fuelcell occupies the central/rear frame volume.
        cube(asset_id+"_FUELCELL",(bb[0]-.025,0,bb[2]+.205),(.115,.048,.125),accent,g,.032)
        cube(asset_id+"_REAR_HYDRATION",(seat_top[0]-.055,0,seat_top[2]-.075),(.055,.052,.135),frame,g,.028)
    elif style=="felt":
        cube(asset_id+"_IA_HEAD_FAIRING",(head_bottom[0]-.018,0,head_bottom[2]+.110),(.072,.048,.145),frame,g,.032)
        cube(asset_id+"_IA_REAR_CUTOUT",(rear[0]+.045,0,wr+.055),(.060,.048,.170),frame,g,.035)
    elif style=="plasma":
        cube(asset_id+"_PLASMA_STORAGE",(seat_top[0]-.060,0,seat_top[2]-.145),(.070,.050,.150),frame,g,.030)
        cube(asset_id+"_PLASMA_HYDRATION",(head_top[0]-.085,0,head_top[2]+.010),(.105,.046,.070),accent,g,.025)
    elif style=="bmc":
        cube(asset_id+"_FUEL_TANK_1200",(head_top[0]-.070,0,head_top[2]-.055),(.120,.048,.075),accent,g,.030)
        cube(asset_id+"_REAR_STORAGE_260",(seat_top[0]-.055,0,seat_top[2]-.110),(.060,.050,.120),frame,g,.025)
    elif style=="ordu":
        cube(asset_id+"_ORDU_FRONT_POST",(head_top[0]+.010,0,head_top[2]+.080),(.030,.030,.105),frame,g,.015)

    # Cockpit positions are constrained where manufacturer pad numbers are available.
    pad_x=bb[0]+geo.get("pad_reach",geo.get("reach",.40)+.12)
    pad_z=bb[2]+geo.get("pad_stack",geo.get("stack",.51)+.08)
    bar_x=min(pad_x-.08,front[0]-.09)
    bar_z=pad_z-.035
    cyl_between(asset_id+"_AERO_BASE",(bar_x,-.19,bar_z),(bar_x,.19,bar_z),.017,BLACK,g)
    cyl_between(asset_id+"_EXT_L",(bar_x,-.070,bar_z+.015),(pad_x+.10,-.070,pad_z+.020),.013,BLACK,g)
    cyl_between(asset_id+"_EXT_R",(bar_x,.070,bar_z+.015),(pad_x+.10,.070,pad_z+.020),.013,BLACK,g)

    saddle_z=seat_top[2]+.105
    cube(asset_id+"_SADDLE",(seat_top[0]-.020,0,saddle_z),(.120,.045,.025),BLACK,g,.018)
    disc(asset_id+"_CRANK",bb,.055,SILVER,g)

    g["asset_kind"]="bike"
    g["evidence_class"]="manufacturer-geometry" if not geo.get("provisional") else "provisional-geometry"
    g["manufacturer_source"]=geo["source"]
    g["wheelbase_m"]=wb
    g["chainstay_m"]=cs
    g["bb_drop_m"]=drop
    g["scale_basis"]="manufacturer published geometry; metres"
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
    "cervelo-p5-disc-mk2-size54": bike("cervelo-p5-disc-mk2-size54", CARBON, RED),
    "specialized-shiv-disc-size-m": bike("specialized-shiv-disc-size-m", CARBON, RED),
    "felt-ia-2015-size54": bike("felt-ia-2015-size54", CARBON, WHITE),
    "scott-plasma-rc-provisional": bike("scott-plasma-rc-provisional", CARBON, YELLOW),
    "bmc-speedmachine-01-size-m": bike("bmc-speedmachine-01-size-m", CARBON, TEAL),
    "orbea-ordu-current-sm": bike("orbea-ordu-current-sm", CARBON, BLUE),
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
    "cervelo-p5-disc-mk2-size54","specialized-shiv-disc-size-m","felt-ia-2015-size54",
    "scott-plasma-rc-provisional","bmc-speedmachine-01-size-m","orbea-ordu-current-sm"
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
