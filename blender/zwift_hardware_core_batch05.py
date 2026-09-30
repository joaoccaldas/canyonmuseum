"""Zwift Hardware Museum — Core Batch 05.

App-ready 3D assets:
- Zwift Ride V2 Smart Frame
- Zwift Ride V1 Smart Frame
- Zwift Cog V2
- Zwift Cog V1
- Zwift Click V2
- Zwift Click V1
- Zwift Play controllers
- Zwift Hub One
- Zwift Hub Classic
- Zwift RunPod

Accuracy policy
---------------
- Official dimensions/specs are hard constraints where published.
- Undocumented internal electronics are NOT reverse-engineered.
- Legacy trainer/frame silhouettes are marked provisional when exact external dimensions are unavailable.
- Exploded views follow documented setup/service interfaces, not speculative internal teardown.

Run:
  python -m pip install bpy
  python blender/zwift_hardware_core_batch05.py
"""
from __future__ import annotations
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"/"zwift-hardware"/"batch-05-core"
PREV=OUT/"previews"
OUT.mkdir(parents=True,exist_ok=True); PREV.mkdir(parents=True,exist_ok=True)
for p in OUT.glob("*.glb"): p.unlink()
for p in PREV.glob("*.jpg"): p.unlink()

bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system="METRIC"
world=bpy.data.worlds.new("ZwiftHardwareWorld");scene.world=world;world.color=(.016,.017,.020)

def mat(name,c,rough=.35,metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=(*c,1)
    b.inputs["Roughness"].default_value=rough
    b.inputs["Metallic"].default_value=metal
    return m

ZWIFT_ORANGE=mat("ZWIFT_ORANGE",(.95,.27,.02),.30,.03)
BLACK=mat("BLACK",(.015,.016,.018),.36,.10)
DARK=mat("DARK",(.055,.060,.068),.28,.60)
SILVER=mat("SILVER",(.48,.50,.54),.20,.82)
STEEL=mat("STEEL",(.28,.30,.34),.24,.78)
PLASTIC=mat("PLASTIC",(.07,.075,.08),.50,.02)
RUBBER=mat("RUBBER",(.018,.019,.020),.82,0)
SCREEN=mat("LED",(.04,.12,.15),.12,.10)
WHITE=mat("WHITE",(.86,.87,.89),.38,.02)

REPORT={"schema_version":1,"assets":{}}

def empty(name,parent=None):
    o=bpy.data.objects.new(name,None);scene.collection.objects.link(o)
    if parent:o.parent=parent
    return o

def cube(name,loc,scale,material,parent,bevel=.006):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        md=o.modifiers.new("bevel","BEVEL");md.width=bevel;md.segments=3
    o.data.materials.append(material);o.parent=parent
    return o

def cyl(name,loc,radius,depth,material,parent,rot=(0,0,0),verts=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=radius,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.data.materials.append(material);o.parent=parent
    return o

def torus(name,loc,major,minor,material,parent,rot=(math.pi/2,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major,minor_radius=minor,major_segments=64,minor_segments=12,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.data.materials.append(material);o.parent=parent
    return o

def rod(name,a,b,r,material,parent,verts=16):
    a,b=Vector(a),Vector(b);d=b-a
    o=cyl(name,(a+b)/2,r,d.length,material,parent,verts=verts)
    o.rotation_mode="QUATERNION";o.rotation_quaternion=d.to_track_quat("Z","Y")
    return o

def ring(name,outer,inner,width,material,parent,y=0):
    seg=96;verts=[];faces=[]
    for yy in (y-width/2,y+width/2):
        for rr in (outer,inner):
            for i in range(seg):
                a=2*math.pi*i/seg;verts.append((rr*math.cos(a),yy,rr*math.sin(a)))
    def idx(s,r,i):return s*(2*seg)+r*seg+(i%seg)
    for i in range(seg):
        j=i+1
        faces += [(idx(0,0,i),idx(0,0,j),idx(0,1,j),idx(0,1,i)),
                  (idx(1,0,j),idx(1,0,i),idx(1,1,i),idx(1,1,j)),
                  (idx(0,0,i),idx(1,0,i),idx(1,0,j),idx(0,0,j)),
                  (idx(0,1,j),idx(1,1,j),idx(1,1,i),idx(0,1,i))]
    me=bpy.data.meshes.new(name+"_MESH");me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);o.data.materials.append(material);o.parent=parent
    return o

def sprocket(name,teeth,radius,y,material,parent):
    n=teeth*2;verts=[];faces=[]
    root=radius-.0032;tip=radius+.0032
    for yy in (y-.0015,y+.0015):
        for i in range(n):
            a=2*math.pi*i/n;r=tip if i%2==0 else root
            verts.append((r*math.cos(a),yy,r*math.sin(a)))
    for i in range(n):
        j=(i+1)%n;faces.append((i,j,n+j,n+i))
    me=bpy.data.meshes.new(name+"_MESH");me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);o.data.materials.append(material);o.parent=parent
    return o

def descendants(root):
    out=[root];st=list(root.children)
    while st:
        o=st.pop();out.append(o);st.extend(list(o.children))
    return out

def dup(root,suffix):
    def rec(src,parent):
        if src.type=="EMPTY": dst=empty(src.name+suffix,parent)
        else:
            dst=src.copy()
            if src.data: dst.data=src.data
            scene.collection.objects.link(dst);dst.parent=parent;dst.name=src.name+suffix
        for ch in src.children:rec(ch,dst)
        return dst
    return rec(root,None)

def export_asset(aid,asm,exp):
    bpy.ops.object.select_all(action="DESELECT")
    for r in (asm,exp):
        for o in descendants(r):o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/f"{aid}.glb"),export_format="GLB",use_selection=True,export_apply=True)

def set_state(root,role,visible):
    root["state_role"]=role;root["default_visible"]=visible

def ride_frame(aid,v2=True):
    asm=empty("ASSEMBLED_"+aid);set_state(asm,"assembled",True)
    # V2 hard external constraints: 1.34m product length, 0.602m width, 0.73m stepover,
    # 0.42m handlebar width, 245x160mm saddle.
    L=1.34;W=.602
    rear=(.39,0,.34);bb=(.66,0,.31);front=(1.15,0,.34)
    # floor/base
    rod(aid+"_FRONT_LEG",(.98,-W/2,.04),(.98,W/2,.04),.025,DARK,asm)
    cube(aid+"_RISER_FOOT",(1.12,0,.055),(.085,.10,.055),RUBBER,asm,.018)
    # steel main frame
    rod(aid+"_CHAINSTAY",rear,bb,.038,DARK,asm)
    rod(aid+"_MAIN_BEAM",bb,(.82,0,.69),.050,DARK,asm)
    rod(aid+"_TOP_BEAM",(.82,0,.69),(1.04,0,.69),.045,DARK,asm)
    rod(aid+"_FRONT_MAST",(1.04,0,.69),(1.04,0,.98 if v2 else 1.02),.040,DARK,asm)
    rod(aid+"_SEAT_MAST",(.78,0,.60),(.70,0,.93),.038,DARK,asm)

    # drivetrain interfaces
    cyl(aid+"_BB",bb,.040,.075,SILVER,asm,rot=(math.pi/2,0,0),verts=32)
    crank=.175 if v2 else .170
    for side in (-1,1):
        rod(aid+("_CRANK_L" if side<0 else "_CRANK_R"),bb,(bb[0]+crank,side*.055,bb[2]),.011,BLACK,asm)
        cube(aid+("_PEDAL_L" if side<0 else "_PEDAL_R"),(bb[0]+crank,side*.070,bb[2]),(.028,.040,.008),BLACK,asm,.004)

    # current Ride includes adjustable crank arms; make visible indexed insert
    if v2:
        for x in (.160,.165,.170,.1725,.175):
            # semantic markers only, not separate functional holes
            cyl(f"{aid}_CRANK_INDEX_{int(x*1000)}",(bb[0]+x,0,bb[2]),.0025,.078,ZWIFT_ORANGE,asm,rot=(math.pi/2,0,0),verts=12)

    # saddle and post
    seat_z=.865 if v2 else .88
    rod(aid+"_SEATPOST",(.70,0,.86),(.70,0,seat_z),.022,BLACK,asm)
    cube(aid+"_SADDLE",(.70,0,seat_z+.025),(.1225,.080,.020),BLACK,asm,.020)
    if v2:
        cube(aid+"_MULTIRAIL_CLAMP",(.70,0,seat_z),(.050,.035,.018),SILVER,asm,.008)
        cube(aid+"_FOREAFT_SLIDER",(.70,0,seat_z-.015),(.060,.025,.012),DARK,asm,.005)

    # smart handlebar/controller assembly
    bar_z=.93 if v2 else .96
    rod(aid+"_HANDLEBAR",(1.04,-.21,bar_z),(1.04,.21,bar_z),.016 if v2 else .014,BLACK,asm)
    for side in (-1,1):
        cube(aid+("_CTRL_L" if side<0 else "_CTRL_R"),(1.04,side*.175,bar_z-.020),(.032,.028,.050),PLASTIC,asm,.010)
        cube(aid+("_BUTTON_L" if side<0 else "_BUTTON_R"),(1.025,side*.205,bar_z-.005),(.012,.004,.016),ZWIFT_ORANGE,asm,.003)
    cube(aid+"_FRAME_KEY_DOCK",(.75,-.035,.49),(.030,.010,.055),ZWIFT_ORANGE,asm,.006)

    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "HANDLEBAR" in n or "CTRL_" in n or "BUTTON_" in n:o.location.z+=.20
        elif "SADDLE" in n or "CLAMP" in n or "SLIDER" in n:o.location.z+=.16
        elif "CRANK" in n or "PEDAL" in n:o.location.y += .14 if "_R" in n else -.14
        elif "RISER" in n:o.location.x+=.16
        elif "FRONT_LEG" in n:o.location.z-=.10
        elif "FRAME_KEY" in n:o.location.y-=.18

    row={
        "type":"smart_frame","generation":"V2" if v2 else "V1","geometry_confidence":"official-spec-driven" if v2 else "legacy-silhouette-study",
        "exploded_parts":["frame","front leg/riser","seatpost/saddle","handlebar","left/right controllers","cranks","pedals","frame key"]
    }
    if v2:
        row.update({"product_length_mm":1340,"product_width_mm":602,"product_weight_kg":35.5,
                    "rider_fit_cm":[146,198],"saddle_height_mm":[571,865],"stepover_mm":730,
                    "handlebar_width_mm":420,"handlebar_height_mm":[822,1021],
                    "crank_lengths_mm":[160,165,170,172.5,175],"saddle_mm":[245,160]})
    else:
        row.update({"known_min_handlebar_stack_mm":606,"crank_length_mm":170,
                    "note":"V1 exact product envelope not asserted; support/forum confirmation used for min stack and prior fixed-crank architecture."})
    REPORT["assets"][aid]=row
    export_asset(aid,asm,exp)
    return asm,exp

def cog(aid,v2=True):
    asm=empty("ASSEMBLED_"+aid);set_state(asm,"assembled",True)
    outer=.0515 if v2 else .050
    width=.042 if v2 else .040
    ring(aid+"_HOUSING",outer,.029,width,PLASTIC,asm)
    sprocket(aid+"_SPROCKET",14,.028,0,STEEL,asm)
    ring(aid+"_LOCKRING",.026,.017,.008,ZWIFT_ORANGE,asm,y=-width/2-.005)
    if v2:
        # 10 alignment positions represented as indexing ring/notches.
        for i in range(10):
            y=-width/2 + (i+.5)*(width/10)
            ring(f"{aid}_ALIGN_{i+1}",.031,.029,.0015,ZWIFT_ORANGE,asm,y=y)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "LOCKRING" in n:o.location.y-=.08
        elif "SPROCKET" in n:o.location.y+=.04
        elif "HOUSING" in n:o.location.y+=.10
        elif "ALIGN_" in n:o.location.y+=.14
    REPORT["assets"][aid]={
        "type":"virtual_shift_cog","generation":"V2" if v2 else "V1",
        "dimensions_mm":[103,42] if v2 else None,"weight_g":140 if v2 else None,
        "teeth":14,"alignment_positions":10 if v2 else None,
        "materials":["plastic housing","plastic lockring","steel sprocket"],
        "accuracy":"official dimensions/specs" if v2 else "legacy silhouette study",
        "exploded_parts":["housing","steel sprocket","lockring"]+(["10-position alignment mechanism"] if v2 else [])
    }
    export_asset(aid,asm,exp)
    return asm,exp

def click(aid,v2=True):
    asm=empty("ASSEMBLED_"+aid);set_state(asm,"assembled",True)
    if v2:w=.050;h=.050;d=.018
    else:w=.047;h=.047;d=.013
    cube(aid+"_BODY",(0,0,0),(w/2,d/2,h/2),PLASTIC,asm,.010)
    cube(aid+"_UP_BUTTON",(0,-d/2-.002,h*.17),(w*.30,.003,h*.19),ZWIFT_ORANGE,asm,.006)
    cube(aid+"_DOWN_BUTTON",(0,-d/2-.002,-h*.17),(w*.30,.003,h*.19),BLACK,asm,.006)
    cyl(aid+"_CR2032",(0,d/2+.003,0),.010,.003,SILVER,asm,rot=(math.pi/2,0,0),verts=32)
    cube(aid+"_BAR_STRAP",(0,d/2+.010,0),(w*.36,.006,h*.42),RUBBER,asm,.006)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "BUTTON" in n:o.location.y-=.05
        elif "CR2032" in n:o.location.y+=.05
        elif "STRAP" in n:o.location.y+=.09
        elif "BODY" in n:o.location.z+=.02
    REPORT["assets"][aid]={
        "type":"wireless_controller","generation":"V2" if v2 else "V1",
        "dimensions_mm":[50,50] if v2 else [47,47,13],
        "weight_g":58.2 if v2 else 51,
        "power":"CR2032","battery_life_hours_gt":100,"communication":"Bluetooth",
        "accuracy":"official specs",
        "exploded_parts":["body","up/down controls","CR2032 battery","bar strap"]
    }
    export_asset(aid,asm,exp)
    return asm,exp

def play():
    aid="zwift-play"
    asm=empty("ASSEMBLED_"+aid);set_state(asm,"assembled",True)
    for side in (-1,1):
        tag="L" if side<0 else "R";x=side*.070
        cube(f"{aid}_{tag}_BODY",(x,0,0),(.045,.0475,.050),PLASTIC,asm,.020)
        cube(f"{aid}_{tag}_PAD",(x,-.050,.008),(.032,.005,.030),RUBBER,asm,.008)
        cube(f"{aid}_{tag}_ORANGE",(x,-.052,.028),(.014,.004,.010),ZWIFT_ORANGE,asm,.004)
        cyl(f"{aid}_{tag}_BATTERY",(x,.020,-.010),.018,.040,DARK,asm,rot=(0,0,0),verts=32)
        cube(f"{aid}_{tag}_CLAMP",(x,.050,-.010),(.025,.012,.032),BLACK,asm,.009)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "_L_" in n:o.location.x-=.10
        if "_R_" in n:o.location.x+=.10
        if "BATTERY" in n:o.location.y+=.10
        elif "CLAMP" in n:o.location.y+=.16
        elif "PAD" in n or "ORANGE" in n:o.location.y-=.08
    REPORT["assets"][aid]={
        "type":"handlebar_controllers","dimensions_mm_each":[100,95,95],
        "battery_mAh":"1350-1400","communication":"Bluetooth","handlebar_diameter_mm":[25,35],
        "accuracy":"official dimensions/specs; boxed weight excluded from geometry",
        "exploded_parts":["left/right housing","button pads","battery volumes","handlebar clamps"]
    }
    export_asset(aid,asm,exp)
    return asm,exp

def hub(aid,one=True):
    asm=empty("ASSEMBLED_"+aid);set_state(asm,"assembled",True)
    # Exact external dimensions unavailable in current official support; silhouette study.
    # Documented service interface: drive-side adapter -> cassette/cog -> freehub body.
    cube(aid+"_BASE",(0,0,.04),(.29,.22,.035),DARK,asm,.020)
    rod(aid+"_LEFT_LEG",(-.18,-.17,.04),(-.32,-.30,.02),.026,DARK,asm)
    rod(aid+"_RIGHT_LEG",(-.18,.17,.04),(-.32,.30,.02),.026,DARK,asm)
    cyl(aid+"_FLYWHEEL",(0,.02,.25),.155,.055,DARK,asm,rot=(math.pi/2,0,0),verts=64)
    cyl(aid+"_HUB_BODY",(0,-.08,.25),.055,.155,BLACK,asm,rot=(math.pi/2,0,0),verts=48)
    cyl(aid+"_FREEHUB",(0,-.18,.25),.022,.060,SILVER,asm,rot=(math.pi/2,0,0),verts=32)
    if one:
        sprocket(aid+"_COG",14,.028,-.22,STEEL,asm)
        ring(aid+"_COG_GUIDE",.050,.030,.040,PLASTIC,asm,y=-.22)
    else:
        # cassette silhouette stack, not a brand-specific cassette.
        for i,t in enumerate([11,13,15,17,19,21,24,28]):
            sprocket(f"{aid}_CASSETTE_{t}T",t,.015+t*.0012,-.205-i*.003,STEEL,asm)
    cyl(aid+"_DRIVE_ADAPTER",(0,-.255,.25),.025,.020,DARK,asm,rot=(math.pi/2,0,0),verts=24)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "DRIVE_ADAPTER" in n:o.location.y-=.15
        elif "COG" in n or "CASSETTE" in n:o.location.y-=.10
        elif "FREEHUB" in n:o.location.y-=.05
        elif "FLYWHEEL" in n:o.location.y+=.08
        elif "LEG" in n:o.location.z-=.10
    REPORT["assets"][aid]={
        "type":"direct_drive_trainer","generation":"Hub One" if one else "Hub Classic",
        "sale_status":"discontinued","geometry_confidence":"legacy silhouette study",
        "documented_service_interface":["drive-side adapter","cog/cassette","freehub body"],
        "exploded_parts":["base/legs","flywheel","hub body","freehub body","Zwift Cog" if one else "cassette","drive-side adapter"]
    }
    export_asset(aid,asm,exp)
    return asm,exp

def runpod():
    aid="zwift-runpod"
    asm=empty("ASSEMBLED_"+aid);set_state(asm,"assembled",True)
    cube(aid+"_POD",(0,0,.012),(.027,.018,.012),PLASTIC,asm,.012)
    cube(aid+"_SHOE_CLIP",(0,.024,0),(.025,.006,.010),BLACK,asm,.005)
    cyl(aid+"_CR2032",(0,-.018,.012),.010,.003,SILVER,asm,rot=(math.pi/2,0,0),verts=32)
    cube(aid+"_PCB_PROXY",(0,0,.012),(.020,.012,.002),DARK,asm,.003)
    exp=dup(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;set_state(exp,"exploded",False)
    for o in descendants(exp):
        n=o.name.upper()
        if "CLIP" in n:o.location.y+=.06
        elif "CR2032" in n:o.location.y-=.06
        elif "PCB" in n:o.location.z+=.04
        elif "POD" in n:o.location.z+=.015
    REPORT["assets"][aid]={
        "type":"footpod","release_year":2018,"weight_g":13,"power":"CR2032","communication":"Bluetooth",
        "measures":["speed","cadence","distance"],"geometry_confidence":"silhouette study; weight/spec official",
        "exploded_parts":["outer pod housing","shoe-lace clip","CR2032 battery","electronics proxy"],
        "mount_guidance":"Zwift historical guidance: around 3rd eyelet for low-drop shoes, 2nd for high-drop shoes."
    }
    export_asset(aid,asm,exp)
    return asm,exp

roots=[]
roots += list(ride_frame("zwift-ride-v2",True))
roots += list(ride_frame("zwift-ride-v1",False))
roots += list(cog("zwift-cog-v2",True))
roots += list(cog("zwift-cog-v1",False))
roots += list(click("zwift-click-v2",True))
roots += list(click("zwift-click-v1",False))
roots += list(play())
roots += list(hub("zwift-hub-one",True))
roots += list(hub("zwift-hub-classic",False))
roots += list(runpod())

REPORT["sources"]={
    "ride_v2":"https://eu.zwift.com/products/zwift-ride-smart-frame",
    "ride_setup":"https://eu.zwift.com/pages/zwift-ride-setup",
    "ride_faq":"https://support.zwift.com/de_eu/zwift-ride-faq-ByTCtW8SA",
    "cog_click":"https://eu.zwift.com/products/zwift-cog-and-click-upgrade-kit",
    "play":"https://uk.zwift.com/pages/zwift-play-setup",
    "hub_service":"https://support.zwift.com/en_us/inspecting-the-cassette-and-freehub-body-on-your-zwift-hub-S1tROG9h1g",
    "hub_discontinued":"https://support.zwift.com/en_us/zwift-hub-classic-faq-BJGQszTC5",
    "hub_one_release":"https://news.zwift.com/en-WW/230494-zwift-s-new-hub-one-trainer-makes-it-easier-to-jump-into-zwift/",
    "runpod":"https://www.zwift.com/eu-it/news/12538-the-zwift-runpod-your-gateway-to-zwift-running"
}
(OUT/"build-report.json").write_text(json.dumps(REPORT,indent=2)+"\n")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"zwift_hardware_core_batch05.blend"))

# QA
scene.render.engine="CYCLES";scene.cycles.device="CPU";scene.cycles.samples=8
scene.render.resolution_x=1200;scene.render.resolution_y=650;scene.render.resolution_percentage=100
scene.render.image_settings.file_format="JPEG";scene.render.image_settings.quality=82
qa=empty("QA_ROOT")
cube("QA_FLOOR",(0,0,-.32),(4.5,1.3,.025),mat("QA_FLOOR_MAT",(.07,.07,.075),.80),qa,.003)
bpy.ops.object.camera_add(location=(0,-10.0,3.2));cam=bpy.context.object;scene.camera=cam
cam.rotation_euler=(Vector((0,0,.25))-cam.location).to_track_quat("-Z","Y").to_euler()
for loc,en,size in [((0,-2,6),1900,7),((4,-1,3),700,4),((-4,1,3),700,4)]:
    bpy.ops.object.light_add(type="AREA",location=loc);l=bpy.context.object;l.data.energy=en;l.data.size=size

def hide(root,v):
    for o in descendants(root):o.hide_render=v
pairs=[(roots[i],roots[i+1]) for i in range(0,len(roots),2)]

# per asset closeups only, more useful than one mismatched-scale lineup
for asm,exp in pairs:
    aid=asm.name.replace("ASSEMBLED_","")
    for a,e in pairs:hide(a,True);hide(e,True)
    asm.location=(0,0,0);exp.location=(0,0,0)

    hide(asm,False)
    target=Vector((.65,0,.38)) if "ride-" in aid else Vector((0,0,.10))
    dist=3.0 if "ride-" in aid else (2.2 if "hub" in aid else 1.25)
    cam.location=(target.x+.55,-dist,target.z+.75)
    cam.rotation_euler=(target-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(PREV/f"{aid}-assembled.jpg");bpy.ops.render.render(write_still=True)

    hide(asm,True);hide(exp,False)
    cam.location=(target.x+.80,-dist*1.15,target.z+1.00)
    cam.rotation_euler=(target-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(PREV/f"{aid}-exploded.jpg");bpy.ops.render.render(write_still=True)

print("built",len(REPORT["assets"]),"Zwift hardware core assets")
