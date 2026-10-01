import argparse, json
assets=[]
def add(id,type,brand,model,room,why,**kw):
    x=dict(id=id,type=type,brand=brand,model=model,room=room,why=why,representation=kw.pop('representation','geometry-study'),semantic_parts=kw.pop('semantic_parts',[]),**kw);assets.append(x)
# 20 bikes
bikes=[
('cervelo-p3c-2006-study','Cervélo','P3C 2006','atlas-against-the-clock-tri','Kona-era carbon superbike milestone','diamond'),
('cervelo-p5x-2017-study','Cervélo','P5X 2017','atlas-against-the-clock-mono','Radical non-traditional long-course architecture','monocoque'),
('trek-ttx-2009-study','Trek','Equinox TTX 2009','atlas-against-the-clock-tri','Historic Kona-era integrated TT platform','diamond'),
('specialized-shiv-2011-study','Specialized','Shiv 2011','atlas-against-the-clock-tri','Early superbike integration and hydration story','superbike'),
('felt-da-2011-study','Felt','DA 2011','atlas-against-the-clock-tri','Iconic narrow-profile triathlon machine','diamond'),
('scott-plasma-3-2012-study','Scott','Plasma 3 2012','atlas-against-the-clock-tri','Distinctive early aero frame family','superbike'),
('giant-trinity-advanced-2016-study','Giant','Trinity Advanced Pro 2016','kona','Championship-era integrated triathlon bike','superbike'),
('bmc-timemachine-tm01-2017-study','BMC','Timemachine TM01 2017','atlas-against-the-clock-tri','Swiss superbike integration study','superbike'),
('cannondale-slice-2014-study','Cannondale','Slice 2014','atlas-against-the-clock-tri','Minimalist lightweight tri-bike contrast','diamond'),
('pinarello-bolide-tr-2020-study','Pinarello','Bolide TR+ 2020','atlas-against-the-clock-tri','Italian aero design contrast','superbike'),
('ventum-one-2021-study','Ventum','One 2021','atlas-against-the-clock-mono','Beam/monocoque long-course architecture','beam'),
('quintana-roo-vpri-study','Quintana Roo','V-PRi','atlas-against-the-clock-tri','Triathlon-native modern superbike lineage','superbike'),
('cube-aerium-c68x-study','CUBE','Aerium C:68X','kona','World-championship proven integrated platform','superbike'),
('giant-trinity-advanced-sl-2027-study','Giant','Trinity Advanced SL 2027','kona','Latest integrated hydration/fueling aero platform','superbike'),
('argon18-e119-triplus-study','Argon 18','E-119 Tri+','atlas-against-the-clock-tri','Modern Canadian long-course superbike','superbike'),
('cadex-tri-study','CADEX','Tri','atlas-against-the-clock-mono','Rare boundary-pushing monocoque tri concept','monocoque'),
('ceepo-venom-study','CEEPO','Venom','atlas-against-the-clock-tri','Japanese triathlon-specific aero design','superbike'),
('wilier-turbine-study','Wilier','Turbine','atlas-against-the-clock-tri','Italian TT/tri machine with distinctive silhouette','superbike'),
('softride-powerwing-1999-study','Softride','PowerWing 1999','secret','Rare beam-bike chapter in triathlon history','beam'),
('quintana-roo-superform-1990-study','Quintana Roo','Superform 1990','atlas-kona-light-clipon','Early triathlon-specific geometry artifact','diamond'),
]
for i,(id,b,m,r,w,a) in enumerate(bikes): add(id,'bike',b,m,r,w,arch=a,variant=i%5,color=['carbon','black','blue','red','silver'][i%5],semantic_parts=['frame','rim','tyre','saddle','aerobar','fork','crank','storage'])

# 20 shoes
shoes=[
('asics-metaspeed-sky-paris-study','ASICS','METASPEED SKY PARIS'),('asics-metaspeed-edge-paris-study','ASICS','METASPEED EDGE PARIS'),('adidas-adizero-adios-pro-evo1-study','adidas','Adizero Adios Pro Evo 1'),('adidas-adizero-adios-pro4-study','adidas','Adizero Adios Pro 4'),('hoka-cielo-x1-2-study','HOKA','Cielo X1 2.0'),('hoka-rocket-x2-study','HOKA','Rocket X 2'),('saucony-endorphin-elite2-study','Saucony','Endorphin Elite 2'),('saucony-endorphin-pro4-study','Saucony','Endorphin Pro 4'),('newbalance-sc-elite-v4-study','New Balance','FuelCell SC Elite v4'),('brooks-hyperion-elite5-study','Brooks','Hyperion Elite 5'),('on-cloudboom-strike-study','On','Cloudboom Strike'),('on-cloudboom-strike-ls-study','On','Cloudboom Strike LS'),('puma-fast-r-nitro-elite3-study','PUMA','Fast-R NITRO Elite 3'),('puma-deviate-nitro-elite3-study','PUMA','Deviate NITRO Elite 3'),('mizuno-wave-rebellion-pro3-study','Mizuno','Wave Rebellion Pro 3'),('under-armour-velociti-elite2-study','Under Armour','Velociti Elite 2'),('craft-kype-pro-study','Craft','Kype Pro'),('skechers-speed-beast-study','Skechers','GO RUN Speed Beast'),('adidas-prime-x2-strung-study','adidas','Prime X 2 Strung'),('asics-superblast2-study','ASICS','Superblast 2')]
for i,(id,b,m) in enumerate(shoes): add(id,'shoe',b,m,'nike-running' if i<6 else 'bay-kona','Expands the run-leg engineering story and Race Setup choice',color=['white','orange','cyan','red','cream'][i%5],upper=['white','black','blue','red','cream'][i%5],airpods=(i%4==0),variant=i,semantic_parts=['upper','midsole','outsole','plate','laces','heel'])

# 12 helmets
helmets=[('giro-aerohead-mips-study','Giro','Aerohead MIPS'),('oakley-aro7-study','Oakley','ARO7'),('met-drone-widebody-study','MET','Drone Wide Body'),('poc-cerebel-study','POC','Cerebel'),('kask-mistral-study','KASK','Mistral'),('rudy-wingdream-study','Rudy Project','Wingdream'),('hjc-adwatt-15-study','HJC','Adwatt 1.5'),('lazer-volante-study','Lazer','Volante'),('specialized-sworks-tt5-study','Specialized','S-Works TT 5'),('limar-air-king-evo-study','Limar','Air King Evo'),('ekoi-aerodinamica-study','EKOÏ','Aerodinamica'),('sweet-tucker-2vi-study','Sweet Protection','Tucker 2Vi')]
for i,(id,b,m) in enumerate(helmets): add(id,'helmet',b,m,'atlas-kona-light-tunnel','Fills missing aero-helmet engineering layer in setup and museum',color=['white','black','orange','blue'][i%4],tail=.12+.015*(i%5),semantic_parts=['shell','visor','vents','retention'])

# 12 trisuits
suits=[('castelli-free-sanremo3-study','Castelli','Free Sanremo 3 Suit'),('roka-gen2-elite-aero-study','ROKA','Gen II Elite Aero II'),('zone3-aeroforce-x2-study','Zone3','Aeroforce-X II'),('huub-anemoi2-study','HUUB','Anemoi 2'),('zoot-ultra-tri-aero-study','Zoot','Ultra Tri Aero'),('orca-athlex-aero-study','Orca','Athlex Aero Race Suit'),('2xu-light-speed-trisuit-study','2XU','Light Speed Front Zip'),('sailfish-aerosuit-study','sailfish','Aerosuit'),('fusion-tempo-one-study','Fusion','TEMPO! ONE Suit'),('trimtex-aero3-study','Trimtex','Aero 3.0 Tri Suit'),('kiwami-spider-ld-aero-study','Kiwami','Spider LD Aero'),('santini-redux-tri-study','Santini','Redux Tri Suit')]
for i,(id,b,m) in enumerate(suits): add(id,'trisuit',b,m,'kona','Makes athlete identity and championship-room mannequins tangible',color=['black','blue','red','white'][i%4],accent=['orange','cyan','gold','red'][i%4],semantic_parts=['torso','sleeves','legs','zipper','paneling'])

# 12 medals
medals=[('kona-medal-1980s-study','KONA Archive','Finisher Medal · 1980s'),('kona-medal-1990s-study','KONA Archive','Finisher Medal · 1990s'),('kona-medal-2000s-study','KONA Archive','Finisher Medal · 2000s'),('kona-medal-2010-study','KONA Archive','Finisher Medal · 2010'),('kona-medal-2015-study','KONA Archive','Finisher Medal · 2015'),('kona-medal-2019-study','KONA Archive','Finisher Medal · 2019'),('stgeorge-703wc-2022-medal-study','Race Archive','70.3 WC St. George 2022 Medal'),('nice-703wc-2019-medal-study','Race Archive','70.3 WC Nice 2019 Medal'),('kona-medal-2022-study','KONA Archive','Finisher Medal · 2022'),('kona-medal-2024-study','KONA Archive','Finisher Medal · 2024'),('kona-medal-2025-study','KONA Archive','Finisher Medal · 2025'),('champions-gold-medal-original','KONA Original','Champions Gold Token')]
for i,(id,b,m) in enumerate(medals): add(id,'medal',b,m,'pier' if i not in (6,7,11) else ['bay-st-george','bay-nice','kona'][[6,7,11].index(i)],'Adds collectible race-memory objects and timeline decoration',color=['gold','silver','orange'][i%3],ribbon=['red','blue','black','orange'][i%4],sides=[10,12,16][i%3],rarity='rare' if i<10 else 'epic',semantic_parts=['medallion','ribbon','relief'])

# 12 rare artifacts
arts=[
('artifact-kona-vintage-bib','Race Archive','Vintage Kona race bib','bib','pier','Personal race-history object'),
('artifact-transition-rack-tag','Race Archive','Transition rack tag','racktag','kona','Makes transition choreography tangible'),
('artifact-timing-chip-vintage','Race Archive','Vintage timing chip','chip','secret','Hidden race-tech collectible'),
('artifact-queen-k-windsock','KONA Original','Queen K windsock','windsock','atlas-kona-light-queen-k','Visualizes crosswind as a physical object'),
('artifact-swim-buoy-miniature','KONA Original','Kailua Bay buoy miniature','buoy','atlas-kona-light-bay','Adds swim-course identity'),
('artifact-carbon-layup-coupon','Engineering Archive','Carbon layup coupon','carbon','atlas-kona-light-tunnel','Explains material engineering'),
('artifact-prototype-aero-fork','Engineering Archive','Prototype aero fork','fork','atlas-kona-light-tunnel','Makes iteration/prototyping visible'),
('artifact-aero-hourglass-3d','KONA Original','Aero hourglass','hourglass','secret','Turns existing legendary relic into a physical exhibit'),
('artifact-vintage-aero-bottle','Engineering Archive','Vintage aero bottle','bottle','atlas-against-the-clock-tri','Shows hydration evolution'),
('artifact-race-week-wristband','Race Archive','Race-week wristband','chip','pier','Small human-scale race-week memory'),
('artifact-course-marker-pin','Race Archive','Course marker pin','chip','bay-kona','Collectible place marker'),
('artifact-prototype-tag','Engineering Archive','Prototype test tag','racktag','secret','Physicalizes the existing prototype relic')]
for i,(id,b,m,form,r,w) in enumerate(arts): add(id,'artifact',b,m,r,w,form=form,color=['orange','red','gold','cyan','blue','carbon'][i%6],rarity=['uncommon','rare','epic'][i%3],semantic_parts=['body','detail'])

# 12 gear
gear=[
('gear-deep-front-wheel-study','KONA Original','Deep front wheel','wheel','atlas-against-the-clock-tri','Wheel depth comparison'),
('gear-rear-disc-wheel-study','KONA Original','Rear disc wheel','wheel','atlas-against-the-clock-tri','Canonical TT silhouette object'),
('gear-between-arms-hydration-study','KONA Original','Between-arms hydration','hydration','atlas-kona-light-tunnel','Race setup hydration story'),
('gear-aero-bottle-study','KONA Original','Aero frame bottle','bottle','atlas-kona-light-tunnel','Integrated storage story'),
('gear-openwater-goggles-study','KONA Original','Open-water goggles','goggle','atlas-kona-light-bay','Adds swim leg equipment'),
('gear-gps-watch-study','KONA Original','Multisport GPS watch','watch','kona','Completes athlete setup silhouette'),
('gear-carbon-pedal-study','KONA Original','Carbon tri pedal','pedal','atlas-kona-light-tunnel','Small engineering collectible'),
('gear-splitnose-saddle-study','KONA Original','Split-nose tri saddle','saddle','atlas-against-the-clock-tri','Tri-specific fit story'),
('gear-aerobar-extension-study','KONA Original','Aero extension pair','aerobar','atlas-kona-light-clipon','Shows cockpit evolution'),
('gear-transition-bottle-study','KONA Original','Transition bottle','bottle','kona','Race-day setup prop'),
('gear-swimskin-study','KONA Original','Race swimskin','bib','atlas-kona-light-bay','Adds swim-to-bike clothing layer'),
('gear-visor-study','KONA Original','Aero helmet visor','goggle','atlas-kona-light-tunnel','Completes helmet/accessory ecosystem')]
for i,(id,b,m,form,r,w) in enumerate(gear): add(id,'gear',b,m,r,w,form=form,color=['carbon','black','cyan','orange','blue','gold'][i%6],semantic_parts=['body','mount'])

assert len(assets)==100,len(assets)

src={
'cube-aerium-c68x-study':'https://www.cube.eu/bikes/road/triathlon-time-trial/aerium/aerium-c-68x',
'giant-trinity-advanced-sl-2027-study':'https://www.giant-bicycles.com/se/trinity-advanced-sl-1-2027',
'asics-metaspeed-sky-paris-study':'https://corp.asics.com/en/press/article/asics-launches-metaspeedtm-sky-paris-and-metaspeedtm-edge-paris-helping-elite-runners-achieve-new-level-of-performance',
'asics-metaspeed-edge-paris-study':'https://corp.asics.com/en/press/article/asics-launches-metaspeedtm-sky-paris-and-metaspeedtm-edge-paris-helping-elite-runners-achieve-new-level-of-performance',
'oakley-aro7-study':'https://www.oakley.com/en-se/product/99468'
}
for a in assets:
    if a['id'] in src: a['source']=src[a['id']]
    a['status']='planned-generated-unwired';a['lod']='mobile-first';a['target_bytes']=350000;a['target_tris']=12000

ap=argparse.ArgumentParser(); ap.add_argument('--out',default='museum/assets/next100-v1.json'); args=ap.parse_args()
from pathlib import Path
Path(args.out).parent.mkdir(parents=True,exist_ok=True)
json.dump({'schema_version':1,'name':'Canyon Museum next 100 3D assets','note':'Additive, unwired, geometry-study assets. Existing assets remain authoritative and untouched. Promotion requires provenance and visual QA.','assets':assets},open(args.out,'w'),indent=2)
print(len(assets))
