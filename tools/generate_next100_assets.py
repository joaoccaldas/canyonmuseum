import argparse, json, math, os, hashlib
from pathlib import Path
import numpy as np
import trimesh
from trimesh.transformations import rotation_matrix

PALETTE = {
    'carbon':[35,38,42,255], 'black':[20,22,25,255], 'rubber':[18,18,19,255],
    'white':[232,232,228,255], 'silver':[150,155,160,255], 'orange':[232,71,28,255],
    'cyan':[30,180,185,255], 'red':[185,35,45,255], 'blue':[45,80,160,255],
    'gold':[196,153,70,255], 'green':[60,135,90,255], 'purple':[105,65,150,255],
    'cream':[220,210,190,255]
}

def color(mesh, name):
    mesh.visual.face_colors = np.array(PALETTE.get(name, PALETTE['silver']), dtype=np.uint8)
    return mesh

def move(mesh, xyz):
    mesh.apply_translation(xyz); return mesh

def rot(mesh, axis, angle):
    mesh.apply_transform(rotation_matrix(angle, axis)); return mesh

def box(ext, pos=(0,0,0), c='silver'):
    m=trimesh.creation.box(extents=ext); move(m,pos); return color(m,c)

def cyl(r,h,pos=(0,0,0),axis='z',c='silver',sections=24):
    m=trimesh.creation.cylinder(radius=r,height=h,sections=sections)
    if axis=='x': rot(m,[0,1,0],math.pi/2)
    elif axis=='y': rot(m,[1,0,0],math.pi/2)
    move(m,pos); return color(m,c)

def sph(r,pos=(0,0,0),c='silver',sub=2):
    m=trimesh.creation.icosphere(subdivisions=sub,radius=r); move(m,pos); return color(m,c)

def torus(R,r,pos=(0,0,0),axis='y',c='rubber',major_sections=32,minor_sections=10):
    m=trimesh.creation.torus(major_radius=R,minor_radius=r,major_sections=major_sections,minor_sections=minor_sections)
    if axis=='y': rot(m,[1,0,0],math.pi/2)
    elif axis=='x': rot(m,[0,1,0],math.pi/2)
    move(m,pos); return color(m,c)

def capsule_between(a,b,r,c='carbon',sections=12):
    a=np.array(a,float); b=np.array(b,float); d=b-a; L=np.linalg.norm(d)
    if L<1e-6:return sph(r,a,c)
    m=trimesh.creation.cylinder(radius=r,height=L,sections=sections)
    z=np.array([0,0,1.]); u=d/L; v=np.cross(z,u); s=np.linalg.norm(v); cc=float(np.dot(z,u))
    if s>1e-8:
        vx=np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]])
        R=np.eye(3)+vx+vx@vx*((1-cc)/(s*s))
        T=np.eye(4);T[:3,:3]=R;m.apply_transform(T)
    elif cc<0: rot(m,[1,0,0],math.pi)
    move(m,(a+b)/2)
    return color(m,c)

def combine(parts):
    return trimesh.util.concatenate([p for p in parts if p is not None])

def bike(spec):
    wb=1.0+spec.get('variant',0)*0.005
    rear=np.array([-wb*.46,0,.34]); front=np.array([wb*.54,0,.34]); bb=np.array([0,0,.26])
    seat=np.array([-.18,0,.82]); head=np.array([.35,0,.78]); saddle=np.array([-.24,0,1.02]); bar=np.array([.55,0,.85])
    parts=[torus(.335,.018,rear,'y','rubber'),torus(.335,.018,front,'y','rubber')]
    for p in (rear,front):
        parts.append(torus(.305,.018,p,'y','carbon'))
        parts.append(cyl(.03,.08,p,'y','silver',16))
    framec=spec.get('color','carbon'); arch=spec.get('arch','superbike')
    if arch=='beam':
        parts += [capsule_between(bb,head,.045,framec),capsule_between(head,seat+np.array([-.05,0,.07]),.04,framec),capsule_between(seat+np.array([-.05,0,.07]),rear,.025,framec),capsule_between(bb,rear,.025,framec)]
    elif arch=='monocoque':
        parts += [box((.48,.055,.20),(.12,0,.55),framec),capsule_between(np.array([-.10,0,.60]),seat,.05,framec),capsule_between(bb,rear,.025,framec),capsule_between(seat,rear,.025,framec)]
    else:
        parts += [capsule_between(bb,seat,.04,framec),capsule_between(seat,head,.035,framec),capsule_between(head,bb,.045,framec),capsule_between(bb,rear,.022,framec),capsule_between(seat,rear,.022,framec)]
    parts += [capsule_between(head,front,.028,framec),capsule_between(head+np.array([0,.06,0]),front+np.array([0,.06,0]),.018,framec),capsule_between(seat,saddle,.023,'carbon'),capsule_between(head,bar,.025,'carbon')]
    parts += [box((.24,.055,.018),saddle+np.array([-.02,0,.02]),'black'),box((.11,.42,.022),bar,'carbon')]
    for side in (-1,1):
        parts.append(capsule_between(bar+np.array([-.03,side*.06,.03]),bar+np.array([.30,side*.06,.08]),.012,'carbon'))
    parts += [cyl(.09,.012,bb+np.array([0,-.055,0]),'y','silver',32),box((.18,.06,.06),(.08,0,.78),framec)]
    return combine(parts)

def shoe(spec):
    c=spec.get('color','white'); parts=[]
    sole=box((.31,.105,.035),(.02,0,.03),spec.get('sole','cream')); rot(sole,[0,1,0],-.07);parts.append(sole)
    mid=box((.29,.10,.055),(0,0,.065),c); rot(mid,[0,1,0],-.05);parts.append(mid)
    heel=box((.09,.095,.095),(-.105,0,.125),c); rot(heel,[0,1,0],-.15);parts.append(heel)
    upper=trimesh.creation.icosphere(subdivisions=2,radius=1); upper.apply_scale([.16,.057,.075]); upper.apply_translation([.035,0,.145]); color(upper,spec.get('upper','white'));parts.append(upper)
    toe=trimesh.creation.icosphere(subdivisions=2,radius=1); toe.apply_scale([.12,.055,.045]); toe.apply_translation([.14,0,.11]); color(toe,spec.get('upper','white'));parts.append(toe)
    parts.append(box((.255,.006,.008),(.015,0,.062),'carbon'))
    for i in range(5):
        parts.append(capsule_between((-.015,-.045,.17+i*.004),(.075,.045,.165+i*.004),.003,'silver',8))
    if spec.get('airpods'):
        parts += [cyl(.022,.075,(.11,-.032,.065),'y','orange',16),cyl(.022,.075,(.11,.032,.065),'y','orange',16)]
    return combine(parts)

def helmet(spec):
    c=spec.get('color','white')
    shell=trimesh.creation.icosphere(subdivisions=3,radius=1); shell.apply_scale([.155,.12,.115]); shell.apply_translation([0,0,.13]); color(shell,c)
    parts=[shell]; tail=spec.get('tail',.18)
    parts.append(box((tail,.16,.065),(-.11-tail/2,0,.12),c))
    visor=box((.13,.19,.012),(.08,0,.12),'black'); rot(visor,[0,1,0],-.25); parts.append(visor)
    for y in (-.055,0,.055): parts.append(box((.07,.018,.008),(.0,y,.238),'black'))
    return combine(parts)

def trisuit(spec):
    c=spec.get('color','black'); accent=spec.get('accent','orange'); parts=[]
    torso=trimesh.creation.capsule(radius=.14,height=.34,count=[16,16]); torso.apply_scale([1,.65,1]); torso.apply_translation([0,0,.42]); color(torso,c);parts.append(torso)
    parts += [cyl(.065,.05,(0,0,.64),'z','black',20)]
    for s in (-1,1):
        parts.append(capsule_between((0,s*.10,.55),(.02,s*.23,.47),.045,c))
        parts.append(capsule_between((-.05,s*.07,.29),(-.03,s*.09,.08),.065,c))
    parts.append(box((.015,.19,.30),(.135,0,.42),accent))
    parts.append(box((.02,.20,.035),(.14,0,.56),accent))
    return combine(parts)

def medal(spec):
    c=spec.get('color','gold'); sides=spec.get('sides',12)
    body=trimesh.creation.cylinder(radius=.055,height=.009,sections=sides); color(body,c); rot(body,[1,0,0],math.pi/2); move(body,(0,0,.08))
    parts=[body,torus(.042,.003,(0,-.006,.08),'y','black',24,8),capsule_between((0,0,.13),(-.035,0,.24),.008,spec.get('ribbon','red')),capsule_between((0,0,.13),(.035,0,.24),.008,spec.get('ribbon','red')),cyl(.018,.012,(0,-.006,.08),'y','silver',24)]
    return combine(parts)

def artifact(spec):
    k=spec.get('form','chip'); c=spec.get('color','orange')
    if k=='bib':
        return combine([box((.18,.006,.13),(0,0,.07),'white'),box((.13,.008,.018),(0,-.006,.07),c),cyl(.004,.015,(-.08,0,.13),'y','silver',8),cyl(.004,.015,(.08,0,.13),'y','silver',8)])
    if k=='buoy': return combine([sph(.07,(0,0,.08),c,2),cyl(.012,.16,(0,0,.18),'z','black',12)])
    if k=='windsock': return combine([cyl(.008,.35,(0,0,.18),'z','silver',10),box((.22,.01,.07),(.10,0,.32),c)])
    if k=='fork': return combine([capsule_between((0,-.05,.05),(0,-.05,.35),.018,'carbon'),capsule_between((0,.05,.05),(0,.05,.35),.018,'carbon'),capsule_between((0,-.05,.35),(0,.05,.35),.02,c)])
    if k=='bottle': return combine([cyl(.035,.19,(0,0,.10),'z',c,18),cyl(.027,.025,(0,0,.215),'z','black',16)])
    if k=='goggle': return combine([torus(.035,.006,(-.04,0,.07),'y',c,24,8),torus(.035,.006,(.04,0,.07),'y',c,24,8),capsule_between((-.01,0,.07),(.01,0,.07),.004,c),capsule_between((-.075,0,.07),(.075,0,.07),.003,'black')])
    if k=='watch': return combine([box((.04,.012,.05),(0,0,.08),'black'),capsule_between((0,0,.02),(0,0,.14),.012,c)])
    if k=='wheel': return combine([torus(.17,.012,(0,0,.18),'y','rubber',32,10),torus(.145,.03,(0,0,.18),'y',c,32,8),cyl(.02,.06,(0,0,.18),'y','silver',16)])
    if k=='aerobar': return combine([capsule_between((-.18,-.06,.08),(.18,-.06,.12),.012,c),capsule_between((-.18,.06,.08),(.18,.06,.12),.012,c),box((.14,.18,.016),(-.10,0,.10),'black')])
    if k=='pedal': return combine([box((.09,.07,.012),(0,0,.06),c),cyl(.012,.08,(0,0,.06),'y','silver',12)])
    if k=='saddle':
        m=trimesh.creation.icosphere(subdivisions=2,radius=1); m.apply_scale([.12,.06,.035]); color(m,c); return m
    if k=='hydration': return combine([box((.08,.055,.20),(0,0,.12),c),cyl(.008,.25,(.02,0,.32),'z','black',8)])
    if k=='racktag': return combine([box((.13,.01,.065),(0,0,.07),'white'),torus(.018,.003,(.065,0,.12),'y',c,16,6)])
    if k=='carbon': return combine([box((.12,.004,.12),(0,0,.06),'carbon'),box((.08,.006,.008),(0,-.004,.06),'silver')])
    if k=='hourglass': return combine([cyl(.045,.01,(0,0,.02),'z','gold',24),cyl(.045,.01,(0,0,.18),'z','gold',24),capsule_between((-.03,0,.03),(.03,0,.17),.008,'silver'),capsule_between((.03,0,.03),(-.03,0,.17),.008,'silver')])
    if k=='chip': return combine([box((.055,.012,.04),(0,0,.04),c),capsule_between((-.04,0,.04),(.04,0,.04),.006,'black')])
    return sph(.06,(0,0,.06),c,2)

def make(spec):
    t=spec['type']
    if t=='bike': return bike(spec)
    if t=='shoe': return shoe(spec)
    if t=='helmet': return helmet(spec)
    if t=='trisuit': return trisuit(spec)
    if t=='medal': return medal(spec)
    return artifact(spec)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--spec',required=True);ap.add_argument('--out',required=True);ap.add_argument('--registry',required=True);args=ap.parse_args()
    data=json.load(open(args.spec)); out=Path(args.out); out.mkdir(parents=True,exist_ok=True)
    registry=[]
    for s in data['assets']:
        d=out/s['type']/s['id']; d.mkdir(parents=True,exist_ok=True)
        mesh=make(s)
        mesh.apply_translation(-mesh.centroid); mesh.apply_translation([0,0,-mesh.bounds[0][2]])
        glb=mesh.export(file_type='glb')
        path=d/'model.glb'; path.write_bytes(glb)
        sha=hashlib.sha256(glb).hexdigest(); tris=int(len(mesh.faces))
        meta={k:s.get(k) for k in ('id','type','brand','model','representation','room','why','rarity','source') if s.get(k) is not None}
        meta.update({'schema_version':1,'generator':'trimesh-parametric-v1','generated_at':'deterministic','tris':tris,'bytes':len(glb),'sha256':sha,'asset':str(path).replace('\\','/'),'semantic_parts':s.get('semantic_parts',[]),'status':'generated-unwired','mobile_budget':{'target_bytes':350000,'target_tris':12000}})
        (d/'build-meta.json').write_text(json.dumps(meta,indent=2)+'\n')
        registry.append(meta)
    Path(args.registry).parent.mkdir(parents=True,exist_ok=True)
    Path(args.registry).write_text(json.dumps({'schema_version':1,'generated_from':args.spec,'asset_count':len(registry),'assets':registry},indent=2)+'\n')
    print(f'generated {len(registry)} assets; total bytes={sum(x["bytes"] for x in registry)}; max={max(x["bytes"] for x in registry)}')

if __name__=='__main__': main()
