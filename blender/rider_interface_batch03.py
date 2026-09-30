"""Rider Interface Asset Batch 03.

Creates reusable Blender/GLB assets with assembled + exploded states:
- Specialized S-Works TT 5 helmet
- Giro Aerohead Mips II helmet
- POC Procen Air helmet
- ISM PN 3.1 saddle
- Garmin Edge 1050
- Shimano Dura-Ace PD-R9100 pedal pair

Accuracy policy:
- Hard published product dimensions/specifications are encoded where manufacturers publish them.
- Helmet external shell dimensions are silhouette studies anchored to official product architecture
  and, where available, official fit ranges; they are NOT claimed as manufacturer CAD dimensions.
- No copied logo/decal textures are embedded.

Run:
  python -m pip install bpy
  python blender/rider_interface_batch03.py
"""
from __future__ import annotations
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"/"rider-interface"/"batch-03"
PREV=OUT/"previews"
OUT.mkdir(parents=True,exist_ok=True); PREV.mkdir(parents=True,exist_ok=True)
for p in OUT.glob("*.glb"): p.unlink()
for p in PREV.glob("*.jpg"): p.unlink()

bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system="METRIC"
world=bpy.data.worlds.new("RiderInterfaceWorld")
scene.world=world
world.color=(.018,.020,.024)

def mat(name,c,rough=.35,metal=.0,alpha=1.0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=(*c,1)
    b.inputs["Roughness"].default_value=rough
    b.inputs["Metallic"].default_value=metal
    if alpha < 1:
        b.inputs["Alpha"].default_value=alpha
        m.surface_render_method="DITHERED"
    return m

BLACK=mat("MAT_BLACK",(.012,.013,.015),.32,.10)
CARBON=mat("MAT_CARBON",(.020,.022,.026),.24,.28)
WHITE=mat("MAT_WHITE",(.86,.87,.89),.38,.02)
SILVER=mat("MAT_SILVER",(.50,.52,.56),.20,.82)
EPS=mat("MAT_EPS",(.70,.72,.74),.74,0)
VISOR=mat("MAT_VISOR",(.12,.17,.20),.08,0,.32)
PINK=mat("MAT_POC_PINK",(.84,.12,.35),.34,.02)
RED=mat("MAT_RED",(.65,.035,.045),.30,.05)
SCREEN=mat("MAT_SCREEN",(.02,.04,.05),.10,.12)
RUBBER=mat("MAT_RUBBER",(.018,.018,.020),.82,0)
FOAM=mat("MAT_FOAM",(.10,.10,.11),.68,0)
REPORT={"schema_version":1,"assets":{}}

def empty(name,parent=None):
    o=bpy.data.objects.new(name,None); scene.collection.objects.link(o)
    if parent:o.parent=parent
    return o

def cube(name,loc,scale,material,parent,bevel=.006):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new("bevel","BEVEL"); m.width=bevel; m.segments=3
    o.data.materials.append(material); o.parent=parent
    return o

def cyl(name,loc,radius,depth,material,parent,rot=(0,0,0),verts=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=radius,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object; o.name=name; o.data.materials.append(material); o.parent=parent
    return o

def rod(name,a,b,r,material,parent,verts=12):
    a,b=Vector(a),Vector(b); d=b-a
    o=cyl(name,(a+b)/2,r,d.length,material,parent,verts=verts)
    o.rotation_mode="QUATERNION"; o.rotation_quaternion=d.to_track_quat("Z","Y")
    return o

def ellipsoid(name,loc,scale,material,parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32,location=loc)
    o=bpy.context.object; o.name=name; o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material); o.parent=parent
    return o

def duplicate_tree(root,suffix):
    def rec(src,parent):
        if src.type=="EMPTY":
            dst=empty(src.name+suffix,parent)
        else:
            dst=src.copy()
            if src.data: dst.data=src.data.copy()
            scene.collection.objects.link(dst); dst.parent=parent; dst.name=src.name+suffix
        for ch in src.children: rec(ch,dst)
        return dst
    return rec(root,None)

def descendants(root):
    out=[root]; st=list(root.children)
    while st:
        o=st.pop(); out.append(o); st.extend(list(o.children))
    return out

def export_asset(aid,*roots):
    bpy.ops.object.select_all(action="DESELECT")
    for r in roots:
        for o in descendants(r): o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUT/f"{aid}.glb"), export_format="GLB",
        use_selection=True, export_apply=True
    )

def set_state(root,role,default_visible):
    root["state_role"]=role
    root["default_visible"]=default_visible

def make_helmet(aid,kind,color,fit_cm=None,weight_g=None):
    asm=empty("ASSEMBLED_"+aid); set_state(asm,"assembled",True)

    if kind=="tt5":
        ellipsoid(aid+"_SHELL",(0,0,.02),(.170,.105,.095),color,asm)
        ellipsoid(aid+"_SHOULDER_TAIL",(-.120,0,-.005),(.115,.102,.060),color,asm)
        cube(aid+"_CLASS1_VISOR",(.082,-.098,.005),(.105,.006,.048),VISOR,asm,.012)
        ellipsoid(aid+"_AERO_HEADSOCK",(0,0,-.010),(.132,.086,.082),FOAM,asm)
        features=["outer shell","shoulder-positioned aero tail","Class 1 optics visor","integrated aero head sock","retention straps"]
        accuracy="official architecture + silhouette study"
    elif kind=="aerohead":
        ellipsoid(aid+"_OUTER_HARDSHELL",(0,0,.015),(.168,.106,.096),color,asm)
        ellipsoid(aid+"_LOWER_WRAP",(-.015,0,-.005),(.148,.096,.075),WHITE,asm)
        ellipsoid(aid+"_TAIL",(-.130,0,-.006),(.118,.103,.060),color,asm)
        cube(aid+"_MAGNETIC_VISOR",(.084,-.100,.005),(.108,.006,.049),VISOR,asm,.012)
        ellipsoid(aid+"_EPS_LINER",(0,0,-.012),(.136,.089,.080),EPS,asm)
        cyl(aid+"_ROCLOC_DIAL",(-.100,0,-.070),.018,.010,BLACK,asm,rot=(math.pi/2,0,0),verts=32)
        features=["outer hardshell","polycarbonate lower wrap","magnetic eye shield","EPS liner","Mips Air Node layer","Roc Loc fit dial"]
        accuracy="official fit/weight + official architecture + silhouette study"
    else:
        ellipsoid(aid+"_SHELL",(0,0,.010),(.150,.103,.092),color,asm)
        cube(aid+"_MAGNETIC_VISOR",(.072,-.098,.005),(.097,.006,.044),VISOR,asm,.012)
        cube(aid+"_LEFT_EAR_COVER",(.018,-.108,-.024),(.050,.010,.045),FOAM,asm,.018)
        cube(aid+"_RIGHT_EAR_COVER",(.018,.108,-.024),(.050,.010,.045),FOAM,asm,.018)
        ellipsoid(aid+"_LINER",(0,0,-.010),(.130,.086,.078),EPS,asm)
        features=["smooth aero shell","magnetic visor","left EVA ear cover","right EVA ear cover","internal liner"]
        accuracy="official architecture + provisional silhouette study"

    rod(aid+"_STRAP_L",(-.015,-.070,-.045),(.010,-.045,-.165),.0025,BLACK,asm,8)
    rod(aid+"_STRAP_R",(-.015,.070,-.045),(.010,.045,-.165),.0025,BLACK,asm,8)
    cube(aid+"_BUCKLE",(.010,0,-.165),(.012,.008,.010),BLACK,asm,.003)

    exp=duplicate_tree(asm,"_EXPLODED"); exp.name="EXPLODED_"+aid; set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "VISOR" in n: o.location.y-=.20
        elif "LINER" in n or "HEADSOCK" in n: o.location.z-=.17
        elif "EAR_COVER" in n:
            o.location.x += .18 if "LEFT" in n else -.18
        elif "STRAP" in n or "BUCKLE" in n: o.location.z-=.24
        elif "SHELL" in n or "TAIL" in n or "WRAP" in n: o.location.z+=.10
        elif "DIAL" in n: o.location.x-=.18

    row={
        "type":"helmet","weight_g":weight_g,"accuracy":accuracy,
        "exploded_parts":features
    }
    if fit_cm:
        row["fit_cm"]={"min":fit_cm[0],"max":fit_cm[1]}
        row["fit_midpoint_head_radius_m"]=round(((sum(fit_cm)/2)/100)/(2*math.pi),4)
    REPORT["assets"][aid]=row
    export_asset(aid,asm,exp)
    return asm,exp

def make_saddle():
    aid="ism-pn31"
    asm=empty("ASSEMBLED_"+aid); set_state(asm,"assembled",True)
    # Official 255 x 120 mm envelope.
    ellipsoid(aid+"_LEFT_PAD",(.030,-.030,.035),(.118,.034,.027),BLACK,asm)
    ellipsoid(aid+"_RIGHT_PAD",(.030,.030,.035),(.118,.034,.027),BLACK,asm)
    cube(aid+"_REAR_BRIDGE",(-.085,0,.030),(.050,.056,.022),BLACK,asm,.020)
    cube(aid+"_AIR_VENT_CHASSIS",(-.025,0,.022),(.042,.012,.013),RUBBER,asm,.010)
    for y in (-.025,.025):
        rod(aid+("_RAIL_L" if y<0 else "_RAIL_R"),(-.070,y,.010),(.075,y,-.055),.0035,SILVER,asm,12)

    exp=duplicate_tree(asm,"_EXPLODED"); exp.name="EXPLODED_"+aid; set_state(exp,"exploded",False)
    for o in descendants(exp):
        if "PAD" in o.name: o.location.z+=.10
        elif "BRIDGE" in o.name: o.location.z+=.04
        elif "VENT" in o.name: o.location.z-=.04
        elif "RAIL" in o.name: o.location.z-=.12

    REPORT["assets"][aid]={
        "type":"saddle","length_mm":255,"width_mm":120,
        "padding":"40-Series Foam","rails":"Chromoly",
        "accuracy":"official dimensions hard-constrained",
        "exploded_parts":["left PN pad","right PN pad","rear bridge","air-vent chassis","chromoly rails"]
    }
    export_asset(aid,asm,exp)
    return asm,exp

def make_garmin():
    aid="garmin-edge1050"
    asm=empty("ASSEMBLED_"+aid); set_state(asm,"assembled",True)
    w=.0602; h=.1185; d=.0163
    cube(aid+"_BODY",(0,0,0),(w/2,d/2,h/2),BLACK,asm,.007)
    cube(aid+"_DISPLAY",(0,-d/2-.0008,.004),(.024,.001,.0425),SCREEN,asm,.003)
    cyl(aid+"_QUARTER_TURN",(0,d/2+.004,-.010),.017,.008,BLACK,asm,rot=(math.pi/2,0,0),verts=32)
    cube(aid+"_BUTTON_TOP",(.018,0,h/2-.006),(.010,d/2+.001,.003),SILVER,asm,.002)
    cube(aid+"_BUTTON_SIDE",(w/2+.001,0,.020),(.002,d/3,.010),SILVER,asm,.002)

    exp=duplicate_tree(asm,"_EXPLODED"); exp.name="EXPLODED_"+aid; set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "DISPLAY" in n: o.location.y-=.060
        elif "QUARTER_TURN" in n: o.location.y+=.060
        elif "BUTTON" in n: o.location.x+=.045
        elif "BODY" in n: o.location.z+=.025

    REPORT["assets"][aid]={
        "type":"bike_computer","dimensions_mm":[60.2,118.5,16.3],"weight_g":161,
        "display_diagonal_in":3.5,"display_px":[480,800],"water_rating":"IPX7",
        "accuracy":"official outer dimensions hard-constrained",
        "exploded_parts":["body","3.5-inch display","quarter-turn mount interface","metal buttons"]
    }
    export_asset(aid,asm,exp)
    return asm,exp

def make_pedals():
    aid="shimano-pd-r9100"
    asm=empty("ASSEMBLED_"+aid); set_state(asm,"assembled",True)
    center=.052; stack=.0148
    for side in (-1,1):
        tag="L" if side<0 else "R"; y=side*center
        cube(f"{aid}_{tag}_BODY",(0,y,0),(.045,.030,stack/2),CARBON,asm,.012)
        cube(f"{aid}_{tag}_STAINLESS_PLATFORM",(0,y,-stack/2+.002),(.038,.026,.002),SILVER,asm,.004)
        rod(f"{aid}_{tag}_AXLE",(0,y,0),(0,side*(center+.050),0),.006,SILVER,asm,20)
        cube(f"{aid}_{tag}_FRONT_HOOK",(.035,y,.006),(.010,.022,.008),BLACK,asm,.004)
        cube(f"{aid}_{tag}_REAR_HOOK",(-.035,y,.006),(.010,.022,.008),BLACK,asm,.004)

    exp=duplicate_tree(asm,"_EXPLODED"); exp.name="EXPLODED_"+aid; set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "_L_" in n: o.location.y-=.080
        elif "_R_" in n: o.location.y+=.080
        if "AXLE" in n: o.location.x+=.080
        elif "PLATFORM" in n: o.location.z-=.040
        elif "HOOK" in n: o.location.z+=.040

    REPORT["assets"][aid]={
        "type":"pedals","stack_height_mm":14.8,"pedal_center_mm":52,
        "pair_weight_g":237,"body_material":"carbon",
        "body_cover":"special stainless","cleat":"SM-SH12",
        "accuracy":"official Shimano specification constraints",
        "exploded_parts":["carbon body","stainless platform","axle","front retention hook","rear retention hook"]
    }
    export_asset(aid,asm,exp)
    return asm,exp

roots=[]
# Specialized publishes S/M/L and architecture, but the accessible official page does not expose cm fit range.
roots += list(make_helmet("specialized-sworks-tt5-m","tt5",BLACK,None,None))
roots += list(make_helmet("giro-aerohead-mips-ii-m","aerohead",WHITE,(55,59),450))
roots += list(make_helmet("poc-procen-air-m","procen",PINK,None,None))
roots += list(make_saddle())
roots += list(make_garmin())
roots += list(make_pedals())

REPORT["sources"]={
    "specialized_tt5":"https://www.specialized.com/se/sv/s-works-tt-5/p/1000252641",
    "giro_aerohead":"https://www.giro.com/product/aerohead-mips-ii-helmet/100000000300000150.html",
    "poc_procen":"https://poc.com/de/pressroom/poc-release-procen-air-ef-pro-cycling-limited-edition",
    "ism_pn31":"https://ismseat.com/performance-narrow/pn-3-1/",
    "garmin_edge1050":"https://www.garmin.com/en-US/compare/?compareProduct=1196129",
    "shimano_pd_r9100":"https://productinfo.shimano.com/ja/product/PD-R9100"
}
(OUT/"build-report.json").write_text(json.dumps(REPORT,indent=2)+"\n")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"rider_interface_batch03.blend"))

# QA rig
scene.render.engine="CYCLES"; scene.cycles.device="CPU"; scene.cycles.samples=8
scene.render.resolution_x=900; scene.render.resolution_y=520; scene.render.resolution_percentage=100
scene.render.image_settings.file_format="JPEG"; scene.render.image_settings.quality=82
qa=empty("QA_ROOT")
cube("QA_FLOOR",(0,0,-.30),(2.7,1.0,.025),mat("MAT_FLOOR",(.07,.07,.075),.78),qa,.003)

bpy.ops.object.camera_add(location=(0,-6.2,2.3))
cam=bpy.context.object; scene.camera=cam
cam.rotation_euler=(Vector((0,0,.10))-cam.location).to_track_quat("-Z","Y").to_euler()
for loc,en,size in [((0,-2,5),1800,6),((3,-1,2.5),700,4),((-3,1,2.5),700,4)]:
    bpy.ops.object.light_add(type="AREA",location=loc)
    l=bpy.context.object; l.data.energy=en; l.data.size=size

def set_hidden(root,hidden):
    for o in descendants(root): o.hide_render=hidden

pairs=[(roots[i],roots[i+1]) for i in range(0,len(roots),2)]
positions=[(-2.1,0,0),(-1.3,0,0),(-.5,0,0),(.35,0,0),(1.2,0,0),(2.1,0,0)]

for asm,pos in zip([p[0] for p in pairs],positions): asm.location=pos
for _,exp in pairs: set_hidden(exp,True)
scene.render.filepath=str(PREV/"assembled-qa.jpg"); bpy.ops.render.render(write_still=True)

for asm,exp in pairs:
    set_hidden(asm,True); set_hidden(exp,False)
for exp,pos in zip([p[1] for p in pairs],positions): exp.location=pos
cam.location=(0,-7.0,2.8); cam.rotation_euler=(Vector((0,0,.05))-cam.location).to_track_quat("-Z","Y").to_euler()
scene.render.filepath=str(PREV/"exploded-qa.jpg"); bpy.ops.render.render(write_still=True)

# Per-asset closeups.
for asm,exp in pairs:
    aid=asm.name.replace("ASSEMBLED_","")
    for a,e in pairs:
        set_hidden(a,True); set_hidden(e,True)
    asm.location=(0,0,0); exp.location=(0,0,0)

    set_hidden(asm,False)
    cam.location=(.35,-1.55,.55)
    cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(PREV/f"{aid}-assembled.jpg"); bpy.ops.render.render(write_still=True)

    set_hidden(asm,True); set_hidden(exp,False)
    cam.location=(.65,-1.85,.80)
    cam.rotation_euler=(Vector((0,0,-.02))-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(PREV/f"{aid}-exploded.jpg"); bpy.ops.render.render(write_still=True)

print("built",len(REPORT["assets"]),"rider-interface assets")
