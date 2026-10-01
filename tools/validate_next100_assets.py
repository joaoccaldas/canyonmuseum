import argparse, json, sys
from pathlib import Path
import trimesh

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--registry',required=True);args=ap.parse_args()
    r=json.load(open(args.registry)); assets=r.get('assets',[])
    errs=[]; ids=set(); total=0
    if len(assets)!=100: errs.append(f'expected 100 assets, got {len(assets)}')
    for a in assets:
        if a['id'] in ids: errs.append(f'duplicate id {a["id"]}')
        ids.add(a['id']); p=Path(a['asset'])
        if not p.exists(): errs.append(f'missing {p}'); continue
        size=p.stat().st_size; total+=size
        if size>350000: errs.append(f'{a["id"]} exceeds 350KB: {size}')
        try:
            m=trimesh.load(p,force='scene')
            tris=sum(len(g.faces) for g in m.geometry.values() if hasattr(g,'faces'))
            if tris>12000: errs.append(f'{a["id"]} exceeds 12k tris: {tris}')
            if tris<=0: errs.append(f'{a["id"]} has no triangles')
        except Exception as e: errs.append(f'{a["id"]} invalid GLB: {e}')
        if not p.with_name('build-meta.json').exists(): errs.append(f'missing metadata for {a["id"]}')
    if total>20_000_000: errs.append(f'total next100 payload exceeds 20MB: {total}')
    print(json.dumps({'ok':not errs,'count':len(assets),'total_bytes':total,'errors':errs},indent=2))
    if errs: sys.exit(1)

if __name__=='__main__': main()
