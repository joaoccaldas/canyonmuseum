"""Nike Running Museum Batch 04 — Heritage Archive.

Creates app-ready historical running shoe assets with:
- assembled + exploded states
- semantic construction parts
- procedural PBR materials
- historical technology metadata
- museum QA renders

Historical accuracy policy:
- release/history facts are stored separately from geometry confidence
- geometry is a silhouette study unless official dimensional data exists
- no copied Nike logo textures are embedded in GLBs
- material microstructure is procedural and self-contained

Run:
  python -m pip install bpy
  python blender/nike_running_archive_batch04.py
"""
from __future__ import annotations
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"assets"/"nike-running-museum"/"batch-04-heritage"
PREV=OUT/"previews"
OUT.mkdir(parents=True,exist_ok=True); PREV.mkdir(parents=True,exist_ok=True)
for p in OUT.glob("*.glb"): p.unlink()
for p in PREV.glob("*.jpg"): p.unlink()

bpy.ops.wm.read_factory_settings(use_empty=True)
scene=bpy.context.scene
scene.unit_settings.system="METRIC"
world=bpy.data.worlds.new("NikeArchiveWorld"); scene.world=world; world.color=(.018,.018,.020)

def mat(name,color,rough=.45,metal=0.0,texture_kind=None):
    m=bpy.data.materials.new(name); m.use_nodes=True
    nt=m.node_tree; bsdf=nt.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value=(*color,1)
    bsdf.inputs["Roughness"].default_value=rough
    bsdf.inputs["Metallic"].default_value=metal
    if texture_kind:
        tex=nt.nodes.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value={"nylon":95,"mesh":140,"leather":38,"rubber":32,"foam":22}.get(texture_kind,60)
        tex.inputs["Detail"].default_value=2.5
        tex.inputs["Roughness"].default_value=.7
        bump=nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value={"nylon":.16,"mesh":.22,"leather":.10,"rubber":.18,"foam":.08}.get(texture_kind,.12)
        bump.inputs["Distance"].default_value=.002
        nt.links.new(tex.outputs["Fac"],bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"],bsdf.inputs["Normal"])
    return m

NYLON_BLUE=mat("NYLON_BLUE",(.12,.30,.58),.58,0,"nylon")
NYLON_ORANGE=mat("NYLON_ORANGE",(.75,.16,.045),.58,0,"nylon")
NYLON_RED=mat("NYLON_RED",(.62,.035,.04),.58,0,"nylon")
NYLON_WHITE=mat("NYLON_WHITE",(.80,.80,.78),.58,0,"nylon")
NYLON_GREY=mat("NYLON_GREY",(.34,.36,.39),.58,0,"nylon")
MESH=mat("ENGINEERED_MESH",(.68,.70,.73),.60,0,"mesh")
LEATHER_WHITE=mat("LEATHER_WHITE",(.82,.80,.74),.48,0,"leather")
LEATHER_BLUE=mat("LEATHER_BLUE",(.07,.18,.40),.48,0,"leather")
SUEDE=mat("SUEDE",(.30,.14,.065),.72,0,"leather")
FOAM_WHITE=mat("FOAM_WHITE",(.78,.77,.70),.72,0,"foam")
FOAM_GREY=mat("FOAM_GREY",(.47,.48,.46),.72,0,"foam")
RUBBER_BLACK=mat("RUBBER_BLACK",(.020,.020,.022),.84,0,"rubber")
RUBBER_GUM=mat("RUBBER_GUM",(.40,.22,.08),.80,0,"rubber")
RUBBER_RED=mat("RUBBER_RED",(.56,.04,.03),.80,0,"rubber")
AIR=mat("AIR_UNIT",(.15,.40,.66),.18,0)
CARBON=mat("CARBON_PLATE",(.015,.016,.018),.22,.22)

REPORT={"schema_version":1,"assets":{}}

def empty(name,parent=None):
    o=bpy.data.objects.new(name,None); scene.collection.objects.link(o)
    if parent:o.parent=parent
    return o

def cube(name,loc,scale,material,parent,bevel=.004):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        m=o.modifiers.new("bevel","BEVEL");m.width=bevel;m.segments=3
    o.data.materials.append(material);o.parent=parent
    return o

def cyl(name,loc,radius,depth,material,parent,rot=(0,0,0),verts=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts,radius=radius,depth=depth,location=loc,rotation=rot)
    o=bpy.context.object;o.name=name;o.data.materials.append(material);o.parent=parent
    return o

def loft(name,sections,material,parent,bevel=.006):
    verts=[];faces=[]
    for x,w,z0,z1 in sections:
        verts += [(x,-w,z0),(x,w,z0),(x,-w,z1),(x,w,z1)]
    for i in range(len(sections)-1):
        a=i*4;b=(i+1)*4
        faces += [(a,b,b+1,a+1),(a+2,a+3,b+3,b+2),(a,a+2,b+2,b),(a+1,b+1,b+3,a+3)]
    faces += [(0,1,3,2)]
    e=(len(sections)-1)*4;faces += [(e,e+2,e+3,e+1)]
    me=bpy.data.meshes.new(name+"_MESH");me.from_pydata(verts,[],faces);me.update()
    o=bpy.data.objects.new(name,me);scene.collection.objects.link(o);o.data.materials.append(material);o.parent=parent
    if bevel:
        m=o.modifiers.new("soft","BEVEL");m.width=bevel;m.segments=3
    return o

def rod(name,a,b,r,material,parent):
    a,b=Vector(a),Vector(b);d=b-a
    o=cyl(name,(a+b)/2,r,d.length,material,parent,verts=12)
    o.rotation_mode="QUATERNION";o.rotation_quaternion=d.to_track_quat("Z","Y")
    return o

def descendants(root):
    out=[root];st=list(root.children)
    while st:
        o=st.pop();out.append(o);st.extend(list(o.children))
    return out

def duplicate_tree(root,suffix):
    def rec(src,parent):
        if src.type=="EMPTY":
            dst=empty(src.name+suffix,parent)
        else:
            dst=src.copy()
            if src.data: dst.data=src.data
            scene.collection.objects.link(dst);dst.parent=parent;dst.name=src.name+suffix
        for ch in src.children: rec(ch,dst)
        return dst
    return rec(root,None)

def export_asset(aid,asm,exp):
    bpy.ops.object.select_all(action="DESELECT")
    for r in (asm,exp):
        for o in descendants(r):o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/f"{aid}.glb"),export_format="GLB",use_selection=True,export_apply=True)

def waffle_lugs(aid,parent,length=.285,width=.095,rows=4,cols=8,z=.003):
    # raised square/diamond lugs inspired by historical waffle traction, not copied scan geometry.
    for i in range(cols):
        x=-length/2 + (i+.5)*length/cols
        taper=1.0-abs(x)/(length*.75)
        half=max(.020,width*.5*max(.35,taper))
        for j in range(rows):
            y=-half+(j+.5)*(2*half/rows)
            o=cube(f"{aid}_WAFFLE_{i:02d}_{j:02d}",(x,y,z),(.008,.006,.004),RUBBER_GUM,parent,.001)
            o.rotation_euler[2]=math.radians(45)

def make_shoe(aid,profile,upper_mat,overlay_mat,outsole_kind="flat",tech=None,year=None,history=None):
    asm=empty("ASSEMBLED_"+aid);asm["state_role"]="assembled";asm["default_visible"]=True

    # profile parameters
    L=profile["length"]; heel=profile["heel"]; fore=profile["fore"]; stack=profile["stack"]; toe=profile["toe"]
    xs=[-.50,-.36,-.18,.02,.22,.39,.50]
    sole=[]
    for u in xs:
        x=u*L
        w=(heel*(1-max(0,u+.5)*.25)) if u<0 else fore*(1-max(0,u-.18)*.60)
        w=max(.025,w)
        rocker=max(0,u-.18)*toe
        z0=.008+rocker
        z1=z0+stack*(.78+.22*(1-(u+.1)**2))
        sole.append((x,w,z0,z1))
    mid=loft(aid+"_MIDSOLE",sole,FOAM_WHITE,asm,.006)
    upper=[]
    heights=[.095,.112,.105,.088,.062,.037,.018]
    for (x,w,z0,z1),h in zip(sole,heights):
        upper.append((x,w*.82,z1-.003,z1+h))
    loft(aid+"_UPPER",upper,upper_mat,asm,.006)

    # historical overlays/heel counter
    cube(aid+"_HEEL_COUNTER",(sole[0][0]+.015,0,upper[0][3]-.030),(.025,heel*.72,.030),overlay_mat,asm,.010)
    # side overlay panel, not a copied logo
    cube(aid+"_SIDE_REINFORCEMENT",(.010,-fore*.72,upper[3][2]+.025),(.090,.003,.010),overlay_mat,asm,.004)

    # outsole
    outsole=loft(aid+"_OUTSOLE",[(x,w*.96,max(.001,z0-.006),z0+.004) for x,w,z0,z1 in sole],
                 RUBBER_BLACK if outsole_kind!="waffle" else RUBBER_GUM,asm,.004)
    if outsole_kind=="waffle":
        waffle_lugs(aid,asm,L*.92,fore*1.65,4,8,.001)
    elif outsole_kind=="herringbone":
        for i in range(10):
            x=-L*.40+i*(L*.08)
            cube(f"{aid}_TREAD_{i:02d}",(x,0,.002),(.018,fore*.65,.003),RUBBER_BLACK,asm,.001)
    elif outsole_kind=="air":
        cyl(aid+"_AIR_HEEL",(-L*.30,0,.028),.025,.070,AIR,asm,rot=(math.pi/2,0,0),verts=32)

    # upper construction details
    tongue=cube(aid+"_TONGUE",(-.070,0,upper[2][3]+.002),(.050,fore*.60,.008),upper_mat,asm,.006)
    for i,x in enumerate([-.12,-.07,-.02,.03,.08]):
        z=upper[2][2]+.075-i*.004
        rod(f"{aid}_LACE_{i+1}",(x,-fore*.55,z),(x,fore*.55,z),.0016,LEATHER_WHITE,asm)
    # heel pull/foam
    cube(aid+"_HEEL_FOAM",(sole[0][0]+.020,0,upper[0][2]+.035),(.018,heel*.54,.028),FOAM_GREY,asm,.008)

    # tech-specific construction
    if tech=="tailwind-air":
        cyl(aid+"_AIR_UNIT",(-L*.30,0,.032),.024,.065,AIR,asm,rot=(math.pi/2,0,0),verts=32)
    elif tech=="pegasus-air":
        cyl(aid+"_HEEL_AIR",(-L*.29,0,.030),.021,.060,AIR,asm,rot=(math.pi/2,0,0),verts=32)
    elif tech=="visible-air":
        cyl(aid+"_VISIBLE_AIR",(-L*.28,-fore*.64,.030),.020,.050,AIR,asm,rot=(math.pi/2,0,0),verts=32)
    elif tech=="flyknit":
        # thin heel cup and minimalist outsole segmentation
        cube(aid+"_HEEL_CUP",(-L*.34,0,upper[0][2]+.040),(.030,heel*.78,.040),overlay_mat,asm,.012)

    exp=duplicate_tree(asm,"_EXPLODED");exp.name="EXPLODED_"+aid;exp["state_role"]="exploded";exp["default_visible"]=False
    for o in descendants(exp):
        n=o.name.upper()
        if "UPPER" in n or "TONGUE" in n or "LACE_" in n or "COUNTER" in n or "SIDE_REINFORCEMENT" in n:
            o.location.z+=.10
        elif "MIDSOLE" in n:o.location.z+=.035
        elif "OUTSOLE" in n or "WAFFLE_" in n or "TREAD_" in n:o.location.z-=.06
        elif "AIR" in n:o.location.y-=.11
        elif "HEEL_FOAM" in n:o.location.x-=.10

    REPORT["assets"][aid]={
        "type":"shoe","release_year":year,"history":history,"geometry_confidence":"silhouette-study",
        "modeled_shell_length_m":round(L,3),"construction_parts":["upper","overlays","tongue/laces","midsole","outsole","heel counter"] + ([tech] if tech else []),
        "outsole_kind":outsole_kind,"tech":tech
    }
    export_asset(aid,asm,exp)
    return asm,exp

profiles={
"cortez":dict(length=.285,heel=.055,fore=.060,stack=.026,toe=.020),
"oregon":dict(length=.283,heel=.052,fore=.058,stack=.022,toe=.014),
"waffle":dict(length=.286,heel=.056,fore=.061,stack=.027,toe=.016),
"premontreal":dict(length=.280,heel=.050,fore=.056,stack=.020,toe=.012),
"tailwind":dict(length=.289,heel=.058,fore=.063,stack=.032,toe=.018),
"sting":dict(length=.278,heel=.049,fore=.055,stack=.019,toe=.011),
"pegasus":dict(length=.290,heel=.060,fore=.064,stack=.032,toe=.020),
"airmax1":dict(length=.292,heel=.061,fore=.065,stack=.036,toe=.021),
"flyknit":dict(length=.286,heel=.054,fore=.060,stack=.025,toe=.023),
}

roots=[]
roots += list(make_shoe("nike-cortez-1972",profiles["cortez"],NYLON_WHITE,LEATHER_BLUE,"herringbone",None,1972,"Early Nike running icon; full-length cushioning and sponge-rubber layer lineage."))
roots += list(make_shoe("nike-oregon-waffle-1973",profiles["oregon"],NYLON_BLUE,LEATHER_WHITE,"waffle",None,1973,"Commercial evolution of Bowerman's waffle experiments."))
roots += list(make_shoe("nike-waffle-trainer-1975",profiles["waffle"],NYLON_BLUE,LEATHER_WHITE,"waffle",None,1975,"Nike's first blockbuster running success; early waffle-traction landmark."))
roots += list(make_shoe("nike-pre-montreal-1975",profiles["premontreal"],NYLON_ORANGE,SUEDE,"waffle",None,1975,"Racing flat associated with Steve Prefontaine-era design ahead of Montreal 1976."))
roots += list(make_shoe("nike-tailwind-1978",profiles["tailwind"],NYLON_GREY,SUEDE,"air","tailwind-air",1978,"First Nike running shoe to introduce Air cushioning."))
roots += list(make_shoe("nike-sting-1978",profiles["sting"],NYLON_BLUE,SUEDE,"waffle",None,1978,"Suede-and-nylon racing flat referenced by Nike as an early racing icon."))
roots += list(make_shoe("nike-pegasus-1-1983",profiles["pegasus"],NYLON_GREY,LEATHER_BLUE,"air","pegasus-air",1983,"Original Pegasus: heel Air, EVA/Tomilite, waffle outsole."))
roots += list(make_shoe("nike-air-max-1-1987",profiles["airmax1"],MESH,LEATHER_WHITE,"air","visible-air",1987,"Running-origin Air Max platform with visible Air architecture."))
roots += list(make_shoe("nike-flyknit-racer-2012",profiles["flyknit"],MESH,BLACK if 'BLACK' in globals() else RUBBER_BLACK,"flat","flyknit",2012,"Flyknit Racer debuted Nike's digitally engineered knit upper at the 2012 London Games."))

REPORT["sources"]={
    "cortez":"https://www.nike.com/gb/a/cortez-history",
    "moon_waffle":"https://about.nike.com/en/magazine/nike-moon-shoe-waffle-iron-true-history",
    "pegasus":"https://about.nike.com/en/magazine/how-nike-created-the-pegasus-running-shoe",
    "tailwind":"https://about.nike.com/en-GB/magazine/nike-pegasus-the-origin-of-a-running-workhorse",
    "pre_montreal_sting":"https://about.nike.com/en/newsroom/releases/nike-international-running-pack-official-images",
    "flyknit":"https://about.nike.com/en/newsroom/releases/next-generation-flyknit-footwear-official-images"
}
(OUT/"build-report.json").write_text(json.dumps(REPORT,indent=2)+"\n")
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/"nike_running_archive_batch04.blend"))

# QA scene
scene.render.engine="CYCLES";scene.cycles.device="CPU";scene.cycles.samples=8
scene.render.resolution_x=1000;scene.render.resolution_y=560;scene.render.resolution_percentage=100
scene.render.image_settings.file_format="JPEG";scene.render.image_settings.quality=82
qa=empty("QA_ROOT")
cube("QA_FLOOR",(0,0,-.22),(3.8,1.1,.025),mat("MAT_FLOOR",(.065,.065,.070),.80),qa,.003)
bpy.ops.object.camera_add(location=(0,-7.8,1.9));cam=bpy.context.object;scene.camera=cam
cam.rotation_euler=(Vector((0,0,.08))-cam.location).to_track_quat("-Z","Y").to_euler()
for loc,en,size in [((0,-2,4.5),1800,6),((3,-1,2.5),700,4),((-3,1,2.5),700,4)]:
    bpy.ops.object.light_add(type="AREA",location=loc);l=bpy.context.object;l.data.energy=en;l.data.size=size

def hide_tree(root,v):
    for o in descendants(root):o.hide_render=v

pairs=[(roots[i],roots[i+1]) for i in range(0,len(roots),2)]
for _,exp in pairs:hide_tree(exp,True)
for i,(asm,_) in enumerate(pairs):asm.location=(-3.0+i*.75,0,0)
scene.render.filepath=str(PREV/"heritage-lineup.jpg");bpy.ops.render.render(write_still=True)

# per asset
for asm,exp in pairs:
    aid=asm.name.replace("ASSEMBLED_","")
    for a,e in pairs: hide_tree(a,True);hide_tree(e,True)
    asm.location=(0,0,0);exp.location=(0,0,0)
    hide_tree(asm,False)
    cam.location=(.30,-1.40,.48);cam.rotation_euler=(Vector((0,0,.08))-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(PREV/f"{aid}-assembled.jpg");bpy.ops.render.render(write_still=True)
    hide_tree(asm,True);hide_tree(exp,False)
    cam.location=(.45,-1.65,.70);cam.rotation_euler=(Vector((0,0,.04))-cam.location).to_track_quat("-Z","Y").to_euler()
    scene.render.filepath=str(PREV/f"{aid}-exploded.jpg");bpy.ops.render.render(write_still=True)

print("built",len(REPORT["assets"]),"heritage Nike Running assets")
