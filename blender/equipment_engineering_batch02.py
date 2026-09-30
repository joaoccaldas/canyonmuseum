"""Engineering Asset Batch 02: reusable, measured triathlon equipment with exploded views.

Run:
  python -m pip install bpy
  python blender/equipment_engineering_batch02.py

Outputs:
  assets/equipment-engineering/batch-02/<asset-id>.glb
  assets/equipment-engineering/batch-02/engineering_batch02.blend
  assets/equipment-engineering/batch-02/build-report.json
  assets/equipment-engineering/batch-02/previews/*.jpg

Each GLB contains two top-level collections:
  ASSEMBLED_<asset-id>
  EXPLODED_<asset-id>

No copied logo textures are embedded. Geometry is dimension-driven where official specs publish dimensions.
"""
from __future__ import annotations
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "equipment-engineering" / "batch-02"
PREV = OUT / "previews"
OUT.mkdir(parents=True, exist_ok=True)
PREV.mkdir(parents=True, exist_ok=True)

for p in OUT.glob("*.glb"): p.unlink()
for p in PREV.glob("*.jpg"): p.unlink()

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
world = bpy.data.worlds.new("EngineeringWorld"); scene.world = world; world.color=(.018,.020,.024)

def mat(name,c,rough=.35,metal=.0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=(*c,1)
    b.inputs["Roughness"].default_value=rough
    b.inputs["Metallic"].default_value=metal
    return m

CARBON=mat("MAT_CARBON",(0.018,.020,.023),.24,.26)
BLACK=mat("MAT_BLACK",(.012,.013,.015),.34,.08)
DARK=mat("MAT_DARK_METAL",(.055,.060,.068),.24,.68)
SILVER=mat("MAT_SILVER",(.52,.54,.58),.20,.82)
TITANIUM=mat("MAT_TITANIUM",(.34,.35,.38),.28,.62)
ALU=mat("MAT_ANODIZED_ALU",(.16,.17,.19),.26,.72)
BLUE=mat("MAT_TECH_BLUE",(.03,.18,.55),.28,.12)
WHITE=mat("MAT_WHITE",(.86,.87,.89),.38,.02)
RUBBER=mat("MAT_RUBBER",(.012,.012,.013),.80,0)

REPORT={"schema_version":1,"assets":{}}

def empty(name,parent=None):
    o=bpy.data.objects.new(name,None); scene.collection.objects.link(o)
    if parent:o.parent=parent
    return o

def cube(name,loc,scale,material,parent,bevel=.003):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new("bevel","BEVEL");m.width=bevel;m.segments=2
    o.data.materials.append(material);o.parent=parent
    return o

def cyl(name,loc,radius,depth,material,parent,rot=(0,0,0),verts=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=radius,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.data.materials.append(material);o.parent=parent
    return o

def torus(name,loc,major,minor,material,parent,rot=(math.pi/2,0,0),segments=64):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=segments,minor_segments=12,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.data.materials.append(material);o.parent=parent
    return o

def rod(name,a,b,r,material,parent,verts=12):
    a,b=Vector(a),Vector(b);d=b-a
    o=cyl(name,(a+b)/2,r,d.length,material,parent,verts=verts)
    o.rotation_mode="QUATERNION";o.rotation_quaternion=d.to_track_quat("Z","Y")
    return o

def ring_mesh(name,loc,outer_r,inner_r,width,material,parent,segments=96):
    verts=[];faces=[]
    for y in (-width/2,width/2):
        for r in (outer_r,inner_r):
            for i in range(segments):
                a=2*math.pi*i/segments
                verts.append((loc[0]+r*math.cos(a),loc[1]+y,loc[2]+r*math.sin(a)))
    def idx(side,ring,i):return side*(2*segments)+ring*segments+(i%segments)
    for i in range(segments):
        j=i+1
        faces += [
            (idx(0,0,i),idx(0,0,j),idx(0,1,j),idx(0,1,i)),
            (idx(1,0,j),idx(1,0,i),idx(1,1,i),idx(1,1,j)),
            (idx(0,0,i),idx(1,0,i),idx(1,0,j),idx(0,0,j)),
            (idx(0,1,j),idx(1,1,j),idx(1,1,i),idx(0,1,i)),
        ]
    me=bpy.data.meshes.new(name+"_MESH");me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);o.data.materials.append(material);o.parent=parent
    return o

def sprocket(name,teeth,pitch_radius,y,material,parent):
    # alternate root/tip radii approximates tooth silhouette while preserving tooth count.
    n=teeth*2
    verts=[];faces=[]
    root=max(.014,pitch_radius-.0045);tip=pitch_radius+.0045
    for yy in (y-.0012,y+.0012):
        for i in range(n):
            a=2*math.pi*i/n;r=tip if i%2==0 else root
            verts.append((r*math.cos(a),yy,r*math.sin(a)))
    for i in range(n):
        j=(i+1)%n
        faces.append((i,j,n+j,n+i))
    me=bpy.data.meshes.new(name+"_MESH");me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);o.data.materials.append(material);o.parent=parent
    return o

def duplicate_tree(root,name_suffix,parent=None):
    mapping={}
    def rec(src,p):
        if src.type=="EMPTY":
            dst=empty(src.name+name_suffix,p)
        else:
            dst=src.copy()
            if src.data: dst.data=src.data.copy()
            scene.collection.objects.link(dst);dst.parent=p;dst.name=src.name+name_suffix
        mapping[src]=dst
        for ch in src.children: rec(ch,dst)
        return dst
    return rec(root,parent)

def descendants(root):
    out=[root];stack=list(root.children)
    while stack:
        o=stack.pop();out.append(o);stack.extend(list(o.children))
    return out

def export_roots(asset_id,*roots):
    bpy.ops.object.select_all(action="DESELECT")
    for r in roots:
        for o in descendants(r):o.select_set(True)
    path=OUT/f"{asset_id}.glb"
    bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",use_selection=True,export_apply=True)
    return path

def make_dt_wheel(asset_id,kind="front",disc_wheel=False):
    # Official ARC 1100 DICUT DB 80: 700C, 80 mm rim height, 20 mm inner, 32 mm outer.
    # Front 12x100; rear 12x142. Disc wheel: 20 mm inner, 27 mm outer, 12x142.
    asm=empty("ASSEMBLED_"+asset_id)
    rim_outer=.317
    rim_depth=.080 if not disc_wheel else .305
    rim_inner=rim_outer-rim_depth if not disc_wheel else .034
    rim_width=.032 if not disc_wheel else .027
    hub_width=.100 if kind=="front" else .142
    axle_d=.012
    if disc_wheel:
        ring_mesh(asset_id+"_CARBON_DISC",(0,0,0),rim_outer,rim_inner,rim_width,CARBON,asm,128)
    else:
        ring_mesh(asset_id+"_RIM",(0,0,0),rim_outer,rim_inner,rim_width,CARBON,asm,128)
        hub=cyl(asset_id+"_HUB",(0,0,0),.026,hub_width,DARK,asm,rot=(math.pi/2,0,0),verts=32)
        spoke_count=24
        for i in range(spoke_count):
            a=2*math.pi*i/spoke_count
            side=-1 if i%2==0 else 1
            y=side*(hub_width/2-.010)
            p=(rim_inner*math.cos(a),0,rim_inner*math.sin(a))
            rod(f"{asset_id}_SPOKE_{i+1:02d}",(0,y,0),p,.00135,SILVER,asm,8)
    cyl(asset_id+"_THRU_AXLE",(0,0,0),axle_d/2,hub_width+.020,ALU,asm,rot=(math.pi/2,0,0),verts=32)
    # Centerlock rotor, not on rim-brake variants.
    rotor_y=-(hub_width/2+.006)
    ring_mesh(asset_id+"_ROTOR",(0,rotor_y,0),.080,.026,.002,SILVER,asm,64)
    if kind=="rear":
        # freehub body
        cyl(asset_id+"_FREEHUB",(0,hub_width/2+.025,0),.020,.050,ALU,asm,rot=(math.pi/2,0,0),verts=24)
    exp=duplicate_tree(asm,"_EXPLODED")
    exp.name="EXPLODED_"+asset_id
    # spread by semantic class along Y
    for o in descendants(exp):
        n=o.name.upper()
        if "ROTOR" in n:o.location.y-=.12
        elif "THRU_AXLE" in n:o.location.y-=.065
        elif "FREEHUB" in n:o.location.y+=.12
        elif "HUB" in n:o.location.y+=.035
        elif "SPOKE" in n:o.location.y+=.0
        elif "RIM" in n or "DISC" in n:o.location.y+=.0
    REPORT["assets"][asset_id]={
        "type":"wheel","rim_diameter":"700C / 29in","rim_height_mm":"disc" if disc_wheel else 80,
        "inner_width_mm":20,"outer_width_mm":27 if disc_wheel else 32,
        "axle_mm":"12x100" if kind=="front" else "12x142",
        "brake":"Center Lock disc","hub":"180 / Ratchet EXP 36" if kind=="rear" else "180",
        "exploded_parts":["rim/disc","hub","spokes" if not disc_wheel else "monocoque disc","centerlock rotor","thru axle"]+([] if kind=="front" else ["freehub body"])
    }
    export_roots(asset_id,asm,exp)
    return asm,exp

def make_crank():
    aid="shimano-fc-r9200-54-40-170"
    asm=empty("ASSEMBLED_"+aid)
    crank_len=.170
    q=.148
    axle_len=.110
    axle=cyl(aid+"_AXLE",(0,0,0),.012,axle_len,DARK,asm,rot=(math.pi/2,0,0),verts=32)
    # right and left arms
    rod(aid+"_RIGHT_ARM",(0,q/2,0),(crank_len,q/2,0),.014,ALU,asm,16)
    rod(aid+"_LEFT_ARM",(0,-q/2,0),(-crank_len,-q/2,0),.014,ALU,asm,16)
    # 110 PCD spider, 4 arms
    pcd=.110
    for i in range(4):
        a=math.radians(45+i*90)
        rod(f"{aid}_SPIDER_{i+1}",(0,q/2,0),(.055*math.cos(a),q/2,.055*math.sin(a)),.008,ALU,asm,12)
    # ring pitch radii approx from 12.7 mm chain pitch / 2pi
    def chainring(teeth,y,material,name):
        pr=teeth*.0127/(2*math.pi)
        sprocket(name,teeth,pr,y,material,asm)
    chainring(54,q/2+.004,DARK,aid+"_OUTER_54T")
    chainring(40,q/2-.003,ALU,aid+"_INNER_40T")
    # four fixing bolts at PCD/2 radius
    for i in range(4):
        a=math.radians(45+i*90)
        cyl(f"{aid}_BOLT_{i+1}",(.055*math.cos(a),q/2+.008,.055*math.sin(a)),.004,.012,SILVER,asm,rot=(math.pi/2,0,0),verts=16)
    exp=duplicate_tree(asm,"_EXPLODED");exp.name="EXPLODED_"+aid
    for o in descendants(exp):
        n=o.name.upper()
        if "LEFT_ARM" in n:o.location.y-=.12
        elif "RIGHT_ARM" in n:o.location.y+=.10
        elif "OUTER_54T" in n:o.location.y+=.20
        elif "INNER_40T" in n:o.location.y+=.15
        elif "BOLT_" in n:o.location.y+=.26
        elif "AXLE" in n:o.location.y-=.02
    REPORT["assets"][aid]={
        "type":"crankset","rear_speeds":12,"chainline_mm":44.5,"pcd_mm":110,"spider_arms":4,
        "chainrings":"54-40T","q_factor_mm":148,"crank_length_mm":170,
        "materials":{"crank_arm":"aluminum","axle":"steel","outer_ring":"aluminum/CFRP","inner_ring":"aluminum"},
        "exploded_parts":["left crank arm","axle","right crank/spider","54T outer ring","40T inner ring","4 fixing bolts"]
    }
    export_roots(aid,asm,exp)
    return asm,exp

def make_cassette():
    aid="shimano-cs-r9200-11-30"
    asm=empty("ASSEMBLED_"+aid)
    teeth=[11,12,13,14,15,16,17,19,21,24,27,30]
    pitch=.0127
    y0=-.022
    for i,t in enumerate(teeth):
        pr=t*pitch/(2*math.pi)
        material=TITANIUM if i>=7 else SILVER
        sprocket(f"{aid}_{t}T",t,pr,y0+i*.0034,material,asm)
    # two spider carriers behind larger clusters
    cyl(aid+"_SPIDER_A",(0,y0+8*.0034,0),.035,.004,ALU,asm,rot=(math.pi/2,0,0),verts=24)
    cyl(aid+"_SPIDER_B",(0,y0+10*.0034,0),.043,.004,ALU,asm,rot=(math.pi/2,0,0),verts=24)
    ring_mesh(aid+"_LOCKRING",(0,y0-.004,0),.022,.014,.004,ALU,asm,48)
    exp=duplicate_tree(asm,"_EXPLODED");exp.name="EXPLODED_"+aid
    for o in descendants(exp):
        # derive exploded order from sprocket tooth name
        moved=False
        for idx,t in enumerate(teeth):
            if f"_{t}T" in o.name:
                o.location.y += idx*.012
                moved=True;break
        if "SPIDER_A" in o.name:o.location.y+=.12
        if "SPIDER_B" in o.name:o.location.y+=.16
        if "LOCKRING" in o.name:o.location.y-=.06
    REPORT["assets"][aid]={
        "type":"cassette","rear_speeds":12,"type_name":"HYPERGLIDE+","combination":"11-30T",
        "teeth":teeth,"steel_gears":7,"titanium_gears":5,"aluminum_spider_arms":2,"weight_g":223,
        "exploded_parts":["lockring","11T","12T","13T","14T","15T","16T","17/19T unit","21/24/27/30T unit","spider carriers"]
    }
    export_roots(aid,asm,exp)
    return asm,exp

def make_extensions():
    aid="profile-design-43asc-400"
    asm=empty("ASSEMBLED_"+aid)
    # 400 mm extension, 43 degree terminal angle, 107 mm total rise, 16 mm total offset, OD 22.2.
    length=.400; od=.0222; rise=.107; off=.016
    # polyline centerline approximates manufacturer dimensions.
    left=[(-.20,-.060,0),(.050,-.060,.010),(.145,-.052,.035),(.190,-.052,.107)]
    right=[(x,-y,z) for x,y,z in left]
    def curve_tube(name,pts):
        cu=bpy.data.curves.new(name+"_CURVE","CURVE");cu.dimensions="3D";cu.bevel_depth=od/2;cu.bevel_resolution=3
        sp=cu.splines.new("POLY");sp.points.add(len(pts)-1)
        for p,co in zip(sp.points,pts):p.co=(*co,1)
        o=bpy.data.objects.new(name,cu);scene.collection.objects.link(o);o.data.materials.append(CARBON);o.parent=asm
        return o
    curve_tube(aid+"_LEFT",left);curve_tube(aid+"_RIGHT",right)
    # 22.2 mm clamp zones
    for y in (-.060,.060):
        cyl(aid+("_LEFT_CLAMP" if y<0 else "_RIGHT_CLAMP"),(-.145,y,0),od/2,.100,DARK,asm,rot=(0,math.pi/2,0),verts=24)
    exp=duplicate_tree(asm,"_EXPLODED");exp.name="EXPLODED_"+aid
    for o in descendants(exp):
        if "LEFT" in o.name:o.location.y-=.09
        elif "RIGHT" in o.name:o.location.y+=.09
    REPORT["assets"][aid]={
        "type":"aerobar_extensions","extension_length_mm":400,"min_length_from_front_clamp_mm":290,
        "angle_deg":43,"rise_mm":107,"offset_total_mm":16,"outer_diameter_mm":22.2,"inner_diameter_mm":18.8,
        "construction":"carbon","weight_pair_g":232,
        "exploded_parts":["left extension","right extension","22.2 mm clamp zones"]
    }
    export_roots(aid,asm,exp)
    return asm,exp

roots=[]
roots += list(make_dt_wheel("dt-swiss-arc1100-db80-front","front",False))
roots += list(make_dt_wheel("dt-swiss-arc1100-db80-rear","rear",False))
roots += list(make_dt_wheel("dt-swiss-arc1100-disc-rear","rear",True))
roots += list(make_crank())
roots += list(make_cassette())
roots += list(make_extensions())

# combined editable source and archive pack
blend=OUT/"engineering_batch02.blend"
bpy.ops.wm.save_as_mainfile(filepath=str(blend))

# Measurement report
REPORT["sources"]={
    "dt_swiss_arc_80_front":"https://www.dtswiss.com/en/support/product-support?matnr=WARC110AIDXCA12557",
    "dt_swiss_arc_80_rear":"https://www.dtswiss.com/en/support/product-support?matnr=WARC110NIDJCA12558",
    "dt_swiss_disc":"https://www.dtswiss.com/en/wheels/wheels-road/aero/arc-1100-dicut-disc",
    "shimano_fc_r9200":"https://productinfo.shimano.com/pdfs/product/archive/2025-2026_Specifications_v035_en.pdf",
    "shimano_fc_exploded":"https://dassets.shimano.com/content/dam/global/cg1SHICCycling/final/ev/ev/EV-FC-R9200-P-4810.pdf",
    "shimano_cs_r9200":"https://productinfo.shimano.com/pdfs/product/archive/2025-2026_Specifications_v035_en.pdf",
    "shimano_cs_exploded":"https://dassets.shimano.com/content/dam/global/cg1SHICCycling/final/ev/ev/EV-CS-R9200-4808.pdf",
    "profile_43asc":"https://profile-design.com/products/43-asc-carbon-extensions"
}
(OUT/"build-report.json").write_text(json.dumps(REPORT,indent=2)+"\n")

# QA display scene
scene.render.engine="CYCLES";scene.cycles.device="CPU";scene.cycles.samples=8
scene.render.resolution_x=1000;scene.render.resolution_y=560;scene.render.resolution_percentage=100
scene.render.image_settings.file_format="JPEG";scene.render.image_settings.quality=82
floor=cube("QA_FLOOR",(0,0,-.37),(2.9,1.0,.025),mat("MAT_FLOOR",(.07,.07,.075),.78),empty("QA_ROOT"),.003)
bpy.ops.object.camera_add(location=(0,-7.0,2.7));cam=bpy.context.object;scene.camera=cam
cam.rotation_euler=(Vector((0,0,.15))-cam.location).to_track_quat("-Z","Y").to_euler()
for loc,en,size in [((0,-2,5),1800,6),((3,-1,2.5),700,4),((-3,1,2.5),700,4)]:
    bpy.ops.object.light_add(type="AREA",location=loc);l=bpy.context.object;l.data.energy=en;l.data.size=size

assembled=[r for r in roots if r.name.startswith("ASSEMBLED_")]
exploded=[r for r in roots if r.name.startswith("EXPLODED_")]
positions=[(-2.25,0,0),(-1.35,0,0),(-.45,0,0),(.45,0,0),(1.35,0,0),(2.25,0,0)]
for r,pos in zip(assembled,positions):r.location=pos
for r in exploded:r.hide_render=True
scene.render.filepath=str(PREV/"assembled-qa.jpg");bpy.ops.render.render(write_still=True)

for r in assembled:r.hide_render=True
for r,pos in zip(exploded,positions):
    r.hide_render=False;r.location=(pos[0],0,0)
scene.render.filepath=str(PREV/"exploded-qa.jpg");bpy.ops.render.render(write_still=True)

print("built",len(REPORT["assets"]),"engineering assets")
for p in sorted(OUT.glob("*.glb")): print(p.name,p.stat().st_size)
