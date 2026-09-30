"""Zwift Hardware Accessories Batch 06.

Creates app-ready Blender/GLB assets for official Zwift accessory/replacement products:
- Ride Tablet Holder
- Ride Adjustable Crank Arms
- Ride V2 Multi-Rail Saddle Clamp
- Ride V1 Adjustable Saddle Clamp + Seatpost
- Smart Frame Replacement Saddle
- Smart Handlebar Y Cable
- Click Strap & Bar Mount
- Training Mat

Accuracy policy:
- Published dimensions/functional limits are hard constraints.
- Where Zwift does not publish external dimensions, geometry is an installation/silhouette study.
- No speculative internal electronics.

Run:
  python -m pip install bpy
  python blender/zwift_hardware_accessories_batch06.py
"""
from __future__ import annotations
import bpy,math,json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"/"zwift-hardware"/"batch-06-accessories"
PREV=OUT/"previews"
OUT.mkdir(parents=True,exist_ok=True);PREV.mkdir(parents=True,exist_ok=True)
for p in OUT.glob("*.glb"):p.unlink()
for p in PREV.glob("*.jpg"):p.unlink()

bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene;scene.unit_settings.system="METRIC"
world=bpy.data.worlds.new("ZwiftAccessoryWorld");scene.world=world;world.color=(.018,.019,.022)

def mat(name,c,rough=.4,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=(*c,1);b.inputs["Roughness"].default_value=rough;b.inputs["Metallic"].default_value=metal
    return m
BLACK=mat("BLACK",(.015,.016,.018),.36,.12)
DARK=mat("DARK",(.05,.055,.062),.30,.55)
SILVER=mat("SILVER",(.50,.52,.56),.20,.82)
ORANGE=mat("ZWIFT_ORANGE",(.95,.27,.02),.30,.03)
RUBBER=mat("RUBBER",(.02,.02,.022),.82,0)
PVC=mat("PVC",(.04,.04,.045),.76,0)
FOAM=mat("FOAM",(.08,.08,.085),.68,0)

REPORT={"schema_version":1,"assets":{}}

def empty(name,parent=None):
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o)
    if parent:o.parent=parent
    return o
def cube(name,loc,scale,material,parent,bevel=.006):
    bpy.ops.mesh.primitive_cube_add(location=loc);o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        md=o.modifiers.new("bevel","BEVEL");md.width=bevel;md.segments=3
    o.data.materials.append(material);o.parent=parent;return o
def cyl(name,loc,radius,depth,material,parent,rot=(0,0,0),verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=radius,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.data.materials.append(material);o.parent=parent;return o
def rod(name,a,b,r,material,parent,verts=12):
    a,b=Vector(a),Vector(b);d=b-a;o=cyl(name,(a+b)/2,r,d.length,material,parent,verts=verts)
    o.rotation_mode="QUATERNION";o.rotation_quaternion=d.to_track_quat("Z","Y");return o
def descendants(root):
    out=[root];st=list(root.children)
    while st:o=st.pop();out.append(o);st.extend(list(o.children))
    return out
def dup(root,suffix):
    def rec(src,parent):
        if src.type=="EMPTY":dst=empty(src.name+suffix,parent)
        else:
            dst=src.copy()
            if src.data:dst.data=src.data
            scene.collection.objects.link(dst);dst.parent=parent;dst.name=src.name+suffix
        for ch in src.children:rec(ch,dst)
        return dst
    return rec(root,None)
def export_asset(aid,asm,exp):
    bpy.ops.object.select_all(action="DESELECT")
    for r in (asm,exp):
        for o in descendants(r):o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/f"{aid}.glb"),export_format="GLB",use_selection=True,export_apply=True)
def states(asm,exp):
    asm["state_role"]="assembled";asm["default_visible"]=True
    exp["state_role"]="exploded";exp["default_visible"]=False

def tablet_holder():
    aid="zwift-ride-tablet-holder";asm=empty("ASSEMBLED_"+aid)
    # Device envelope hard limits: 326 x 215 x 10 mm. Holder itself is silhouette study.
    cube(aid+"_BACKPLATE",(0,0,.10),(.175,.012,.125),BLACK,asm,.020)
    cube(aid+"_BOTTOM_LIP",(0,-.025,-.015),(.175,.030,.018),DARK,asm,.008)
    for x in (-.17,.17):cube(aid+("_SIDE_L" if x<0 else "_SIDE_R"),(x,-.010,.10),(.012,.020,.115),DARK,asm,.008)
    cube(aid+"_STRAP",(0,-.035,.10),(.160,.006,.018),ORANGE,asm,.006)
    rod(aid+"_MOUNT_ARM",(0,.02,-.02),(0,.18,-.18),.014,DARK,asm)
    cyl(aid+"_BAR_CLAMP",(0,.20,-.20),.026,.035,BLACK,asm,rot=(math.pi/2,0,0))
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;states(asm,exp)
    for o in descendants(exp):
        n=o.name.upper()
        if "STRAP" in n:o.location.y-=.08
        elif "SIDE_" in n:o.location.x += -.06 if "_L" in n else .06
        elif "ARM" in n:o.location.z-=.10
        elif "CLAMP" in n:o.location.y+=.10
    REPORT["assets"][aid]={"type":"tablet_holder","weight_kg":.41,"max_device_height_mm":215,"max_device_length_mm":326,"max_device_thickness_mm":10,"max_tablet_weight_kg":1,"accuracy":"published device limits + silhouette study","parts":["backplate","side supports","bottom lip","adjustable strap","mount arm","bar clamp"]}
    export_asset(aid,asm,exp);return asm,exp

def adjustable_cranks():
    aid="zwift-ride-adjustable-crank-arms";asm=empty("ASSEMBLED_"+aid)
    lengths=[.160,.165,.170,.1725,.175]
    for side in (-1,1):
        tag="L" if side<0 else "R";y=side*.040
        rod(f"{aid}_{tag}_ARM",(0,y,0),(.175,y,0),.013,BLACK,asm)
        # bear-claw adjustment head and five indexed pedal positions
        cube(f"{aid}_{tag}_BEAR_CLAW",(.170,y,0),(.028,.018,.030),DARK,asm,.010)
        for i,L in enumerate(lengths):
            cyl(f"{aid}_{tag}_INDEX_{str(L).replace('.','_')}",(L,y,0),.004,.020,ORANGE,asm,rot=(math.pi/2,0,0),verts=16)
        cyl(f"{aid}_{tag}_CRANK_BOLT",(0,y,0),.009,.022,SILVER,asm,rot=(math.pi/2,0,0),verts=24)
        cyl(f"{aid}_{tag}_CAP",(0,y+side*.013,0),.010,.003,BLACK,asm,rot=(math.pi/2,0,0),verts=24)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;states(asm,exp)
    for o in descendants(exp):
        n=o.name.upper()
        if "_L_" in n:o.location.y-=.08
        elif "_R_" in n:o.location.y+=.08
        if "BOLT" in n:o.location.x-=.05
        elif "CAP" in n:o.location.x-=.09
    REPORT["assets"][aid]={"type":"crank_upgrade","material":"aluminum","crank_lengths_mm":[160,165,170,172.5,175],"contents":["left arm","right arm","2 crank bolts","2 caps"],"mechanism":"bear claw adjustment system","accuracy":"official length/material/contents specs; arm silhouette study"}
    export_asset(aid,asm,exp);return asm,exp

def clamp(aid,v2=True,with_post=False):
    asm=empty("ASSEMBLED_"+aid)
    if with_post:
        rod(aid+"_SEATPOST",(0,0,-.20),(0,0,.18),.020,DARK,asm)
    cube(aid+"_LOWER_CARRIAGE",(0,0,.04),(.060,.030,.018),DARK,asm,.008)
    cube(aid+"_SLIDER",(0,0,.075),(.075,.024,.012),SILVER,asm,.006)
    cube(aid+"_UPPER_CLAMP",(0,0,.10),(.045,.026,.018),BLACK,asm,.008)
    for y in (-.020,.020):
        cyl(aid+("_RAIL_L" if y<0 else "_RAIL_R"),(0,y,.115),.004,.10,SILVER,asm,rot=(0,math.pi/2,0),verts=16)
    cyl(aid+"_BOLT",(-.025,0,.092),.006,.045,SILVER,asm,rot=(math.pi/2,0,0),verts=24)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;states(asm,exp)
    for o in descendants(exp):
        n=o.name.upper()
        if "UPPER" in n:o.location.z+=.08
        elif "RAIL" in n:o.location.z+=.12
        elif "SLIDER" in n:o.location.x+=.10
        elif "BOLT" in n:o.location.y-=.08
        elif "SEATPOST" in n:o.location.z-=.10
    REPORT["assets"][aid]={"type":"saddle_clamp","generation":"V2" if v2 else "V1 upgrade","compatibility":"Ride V2" if v2 else "Ride V1 only","fore_aft_adjustment":"expanded / published qualitatively; exact clamp dimensions not published","accuracy":"documented assembly architecture + silhouette study","parts":["lower carriage","fore/aft slider","upper rail clamp","rails proxy","bolt"]+(["seatpost"] if with_post else [])}
    export_asset(aid,asm,exp);return asm,exp

def saddle():
    aid="zwift-smart-frame-replacement-saddle";asm=empty("ASSEMBLED_"+aid)
    # Ride V2 official saddle 245 x 160 mm
    cube(aid+"_BASE",(0,0,.020),(.1225,.080,.012),BLACK,asm,.050)
    cube(aid+"_FOAM",(0,0,.038),(.118,.076,.016),FOAM,asm,.050)
    for y in (-.025,.025):rod(aid+("_RAIL_L" if y<0 else "_RAIL_R"),(-.075,y,.005),(.075,y,-.040),.0035,SILVER,asm)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;states(asm,exp)
    for o in descendants(exp):
        if "FOAM" in o.name:o.location.z+=.07
        elif "BASE" in o.name:o.location.z+=.02
        elif "RAIL" in o.name:o.location.z-=.08
    REPORT["assets"][aid]={"type":"saddle","dimensions_mm":[245,160],"accuracy":"official Ride V2 saddle envelope","parts":["foam/top","base","rails"]}
    export_asset(aid,asm,exp);return asm,exp

def y_cable():
    aid="zwift-smart-handlebar-y-cable";asm=empty("ASSEMBLED_"+aid)
    # No published cable length; topology only.
    split=(0,0,0)
    rod(aid+"_TRUNK",(0,0,-.20),split,.004,BLACK,asm)
    rod(aid+"_LEFT",split,(-.18,0,.12),.004,BLACK,asm)
    rod(aid+"_RIGHT",split,(.18,0,.12),.004,BLACK,asm)
    for name,loc in [("TRUNK_CONN",(0,0,-.22)),("LEFT_CONN",(-.20,0,.14)),("RIGHT_CONN",(.20,0,.14))]:
        cube(aid+"_"+name,loc,(.018,.010,.008),DARK,asm,.004)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;states(asm,exp)
    for o in descendants(exp):
        if "LEFT" in o.name:o.location.x-=.08
        elif "RIGHT" in o.name:o.location.x+=.08
        elif "TRUNK" in o.name:o.location.z-=.08
    REPORT["assets"][aid]={"type":"cable","topology":"Y cable","accuracy":"official replacement-product identity; lengths not asserted","parts":["trunk","left branch","right branch","3 connectors"]}
    export_asset(aid,asm,exp);return asm,exp

def click_mount():
    aid="zwift-click-strap-bar-mount";asm=empty("ASSEMBLED_"+aid)
    ring_outer=.021; ring_inner=.014
    # clamp study sized to typical handlebars; Click compatibility is handlebar-mounted.
    cyl(aid+"_BAR_MOUNT",(0,0,0),ring_outer,.020,BLACK,asm,rot=(math.pi/2,0,0),verts=32)
    cyl(aid+"_BAR_VOID",(0,0,0),ring_inner,.023,RUBBER,asm,rot=(math.pi/2,0,0),verts=32)
    cube(aid+"_CLICK_CRADLE",(0,-.018,.032),(.030,.012,.022),DARK,asm,.008)
    cube(aid+"_STRAP",(0,.020,.032),(.038,.006,.010),RUBBER,asm,.005)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;states(asm,exp)
    for o in descendants(exp):
        if "CRADLE" in o.name:o.location.y-=.06
        elif "STRAP" in o.name:o.location.y+=.06
        elif "MOUNT" in o.name or "VOID" in o.name:o.location.z-=.03
    REPORT["assets"][aid]={"type":"mount","accuracy":"replacement product silhouette study","parts":["bar mount","rubber interface","Click cradle","strap"]}
    export_asset(aid,asm,exp);return asm,exp

def mat_asset():
    aid="zwift-training-mat";asm=empty("ASSEMBLED_"+aid)
    # 36 x 80 in, 6 mm
    W=.9144;L=2.032;T=.006
    cube(aid+"_PVC",(0,0,T/2),(L/2,W/2,T/2),PVC,asm,.012)
    # embossed center stripe / logo proxy without copied mark
    cube(aid+"_CENTER_STRIPE",(0,0,T+.0008),(L*.32,.010,.0008),ORANGE,asm,.001)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;states(asm,exp)
    # exploded material layers: visual educational decomposition of a 6mm PVC mat
    for o in descendants(exp):
        if "PVC" in o.name:o.location.z+=.04
        elif "STRIPE" in o.name:o.location.z+=.08
    REPORT["assets"][aid]={"type":"training_mat","dimensions_mm":[2032,914.4,6],"material":"6P-free PVC","properties":["water/sweat resistant","noise/vibration damping","floor protection"],"accuracy":"official dimensions/material"}
    export_asset(aid,asm,exp);return asm,exp

roots=[]
roots+=list(tablet_holder())
roots+=list(adjustable_cranks())
roots+=list(clamp("zwift-ride-v2-multi-rail-saddle-clamp",True,False))
roots+=list(clamp("zwift-ride-v1-adjustable-saddle-clamp-seatpost",False,True))
roots+=list(saddle())
roots+=list(y_cable())
roots+=list(click_mount())
roots+=list(mat_asset())

REPORT["sources"]={
"tablet_holder":"https://eu.zwift.com/products/zwift-ride-tablet-holder",
"adjustable_cranks":"https://eu.zwift.com/products/zwift-ride-adjustable-crank-arms",
"v1_saddle_upgrade":"https://us.zwift.com/products/zwift-ride-v1-adjustable-saddle-clamp-and-seatpost",
"ride_setup":"https://eu.zwift.com/pages/zwift-ride-setup",
"replacement_parts":"https://eu.zwift.com/collections/replacement-parts",
"training_mat":"https://eu.zwift.com/products/zwift-training-mat"
}
(OUT/"build-report.json").write_text(json.dumps(REPORT,indent=2)+"\n")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"zwift_hardware_accessories_batch06.blend"))

# QA closeups
scene.render.engine="CYCLES";scene.cycles.device="CPU";scene.cycles.samples=8
scene.render.resolution_x=900;scene.render.resolution_y=520;scene.render.resolution_percentage=100
scene.render.image_settings.file_format="JPEG";scene.render.image_settings.quality=82
qa=empty("QA_ROOT");cube("QA_FLOOR",(0,0,-.30),(2.6,1.1,.025),mat("QA_FLOOR_MAT",(.07,.07,.075),.80),qa,.003)
bpy.ops.object.camera_add(location=(.45,-2.8,1.05));cam=bpy.context.object;scene.camera=cam
for loc,en,size in [((0,-2,5),1800,6),((3,-1,2),600,3),((-3,1,2),600,3)]:
    bpy.ops.object.light_add(type="AREA",location=loc);li=bpy.context.object;li.data.energy=en;li.data.size=size
def hide(r,v):
    for o in descendants(r):o.hide_render=v
pairs=[(roots[i],roots[i+1]) for i in range(0,len(roots),2)]
for asm,exp in pairs:
    aid=asm.name.replace("ASSEMBLED_","")
    for a,e in pairs:hide(a,True);hide(e,True)
    asm.location=(0,0,0);exp.location=(0,0,0);hide(asm,False)
    target=Vector((0,0,.05));dist=3.2 if "training-mat" in aid else 1.8
    cam.location=(.45,-dist,.75);cam.rotation_euler=(target-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(PREV/f"{aid}-assembled.jpg");bpy.ops.render.render(write_still=True)
    hide(asm,True);hide(exp,False)
    cam.location=(.65,-dist*1.15,.95);cam.rotation_euler=(target-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(PREV/f"{aid}-exploded.jpg");bpy.ops.render.render(write_still=True)
print("built",len(REPORT["assets"]),"Zwift accessory assets")
