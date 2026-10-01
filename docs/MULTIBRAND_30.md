# Canyonmuseum — bike evaluation + 30-bike expansion (kona · wyld · customizable)

**Reuse / extend / build new:** **extend.** No new pipeline. We reuse the proven heritage/modern
Blender generators (`blender/heritage_build.py`, `blender/frame.py`, `blender/components.py`),
the brand-agnostic `blender/heritage/skeleton.py` (geometry-table → frame skeleton),
`blender/heritage/frame_tubes.py` (zone-aware tube sweeps + voxel fuse) and
`blender/heritage/parts.py` (period wheels / drivetrain / cockpit / saddle). The 30 new bikes are
driven by one generic generator (`blender/multibrand/`) that reuses exactly those modules and
exports the same GLB contract (`export_yup`, meshopt-optimised, PBR metallic/clearcoat). No
photo-tracing for the expansion set — geometry comes from published tables + honest inferred
lateral widths (same source discipline the manifest `uncertainties` record demands).

---

## 1. What is in canyonmuseum today

Canonical repo: github.com/joaoccaldas/canyonmuseum
(Pages live at https://joaoccaldas.github.io/canyonmuseum/). Local serve: `python3 -m http.server 8744`.

### Modelled (reference-study, GLB + viewer)
| Bike | Era | Adapter | Notes |
|---|---|---|---|
| Speedmax CFR AXS MY2027 | Flagship aero | `blender/frame.py` + `components.py` (photo-trace + voxel) | Aero Lab, Paint Studio, exploded |
| Speedmax CF SLX 8 Di2 MY2027 | Flagship aero | same modern pipeline | DT Swiss 65/85 |
| Speedmax Three MY2005 | 2002–2005 heritage | `heritage_speedmax-three-2005-photo-v1` | 7005 alu, Carbotec disc |
| SpeedMax 3.0 MY2007 | 2006–2008 heritage | `heritage-speedmax-2007-photo-v1` | MR3, Super-Aero seat tube |
| Speedmax AL 9.0 MY2011 | 2009–2013 heritage | `heritage-speedmax-al-2011-photo-v1` | 75–78° sliding dropout |
| Speedmax CF 9.0 Pro MY2011 | 2009–2012 heritage | `heritage-speedmax-cf-2011-photo-v1` | first carbon Speedmax, Zipp 404/808, 7.7 kg |
| Trek Equinox 9 MY2004 | first non-Canyon | `trek-equinox-alphasl-2004-tubes-v1` | geometry-table skeleton + tube zones |
| Trek Speed Concept SLR 9 AXS MY2027 | modern aero | `trek-speed-concept-slr-gen3-pillow-v1` | pillow-surface monocoque |

### In catalogue, `status: not-modelled` (honest gaps, never invented)
- Canyon: Speedmax CFR Di2 2027, CF SLX 8 AXS, CF SLX 7 Di2, CF 8 Di2 Race, CF 7 Di2, CFR LTD 2027.
- Heritage: Speedmax 1000/2000/3000 (1999–2001), SpeedMax TT Pro 9.0 (2007), Speedmax CF concept (2012–2015).

**Read:** 6 Canyon + 2 Trek are fully modelled; the rest are documented `not-modelled` cards. The
expansion set adds **30** new bikes across **7 brands**, all driven by the same generator.

---

## 2. The 30 proposed bikes (brand × theme)

`GEN` = generation archetype (drive triangle/tube shapes): `classic-round` (round tubes, rim-era),
`aero-monocoque` (deep Kammtail, disc), `tri-integration` (storage + bayonet fork), `gravel`,
`endurance`. Theme = paint/livery treatment baked into PBR material zones.

| # | Bike | Brand | GEN | Theme |
|---|------|-------|-----|-------|
| 1 | Speedmax CFR "Kona Lava" | Canyon | tri-integration | **kona** (lava red→basalt fade) |
| 2 | Speedmax CFR "Wyld Mint" | Canyon | tri-integration | **wyld** (sheer mint gloss) |
| 3 | Speedmax CFR "Customizable" | Canyon | tri-integration | **customizable** (3-zone paint pickable) |
| 4 | Speedmax CF 9.0 "Heritage Carbon" | Canyon | aero-monocoque | heritage carbon + white pinstripe |
| 5 | Aeroad CFR "Wyld Pink" | Canyon | aero-monocoque | **wyld** (pink sheer) |
| 6 | Ultimate CF SLX "Basalt" | Canyon | endurance | matte basalt + gloss logo |
| 7 | Grail CF "Dust" | Canyon | gravel | sand splatter on charcoal |
| 8 | Speed Concept SLR "Kona Hibiscus" | Trek | tri-integration | **kona** (hibiscus magenta fade) |
| 9 | Speed Concept SLR "Wyld Aurora" | Trek | tri-integration | **wyld** (aurora sheer) |
| 10 | Madone SLR "Splatter 92" | Trek | aero-monocoque | retro 90s splatter |
| 11 | Domane SL "Endure Chrome" | Trek | endurance | brushed chrome + clear |
| 12 | Checkpoint SLR "Desert" | Trek | gravel | desert sand fade |
| 13 | Tarmac SL8 "Kona" | Specialized | aero-monocoque | **kona** lava |
| 14 | Tarmac SL8 "Wyld" | Specialized | aero-monocoque | **wyld** mint |
| 15 | Shiv "Customizable" | Specialized | tri-integration | customizable 3-zone |
| 16 | Roubaix SL8 "Pearl" | Specialized | endurance | pearl white + opal flake |
| 17 | Diverge "Moss" | Specialized | gravel | moss green + black |
| 18 | Dogma F "Wyld" | Pinarello | aero-monocoque | **wyld** pink |
| 19 | Bolide F "Kona Night" | Pinarello | tri-integration | **kona** night lava |
| 20 | Bolide F "Customizable" | Pinarello | tri-integration | customizable |
| 21 | F  "Italia Splatter" | Pinarello | aero-monocoque | tricolore splatter |
| 22 | Teammachine SLR01 "Wyld" | BMC | aero-monocoque | **wyld** |
| 23 | Timemachine 01 "Kona" | BMC | tri-integration | **kona** |
| 24 | Roadmachine "Customizable" | BMC | endurance | customizable |
| 25 | Foil RC "Heritage SCOTT" | Scott | aero-monocoque | heritage SCOTT yellow |
| 26 | Foil RC "Wyld" | Scott | aero-monocoque | **wyld** mint |
| 27 | Plasma RC "Kona" | Scott | tri-integration | **kona** |
| 28 | P-Series "Wyld" | Cervélo | tri-integration | **wyld** |
| 29 | S5 "Splatter" | Cervélo | aero-monocoque | 90s splatter |
| 30 | R5 "Customizable" | Cervélo | endurance | customizable |

Brand tally: Canyon 7, Trek 5, Specialized 5, Pinarello 4, BMC 3, Scott 3, Cervélo 3.
Theme tally: kona 7, wyld 8, customizable 6, heritage 3, splatter 3, fade/pearl/moss/desert 6.

---

## 3. Themes (baked as PBR material zones, not recolour masks)

- **kona** — lava-red → basalt-black vertical fade on frame, gloss clearcoat, white Kona-era decals,
  black components. Evokes Kona Ironman volcanic night.
- **wyld** — sheer translucent gloss (mint `wyldSheer` / pink `wyldDark`→`wyldAlpha`) over a dark base,
  high clearcoat, low roughness. Matches the web Paint Studio wyld skin (`web/src/skins/wyld.js`).
- **customizable** — three clearly separated paint zones (`paint_a` frame base, `paint_b` accent,
  `paint_c` decals) with distinct hues so the Studio slider/livery system can re-tint live; shipped
  default is a neutral tri-tone.
- **heritage** — period factory paint (Canyon white-blue, Trek yellow, SCOTT yellow) + era decals.
- **splatter** — retro 90s multi-fleck on a dark base (procedural fleck texture baked to base colour).
- **fade / pearl / chrome / moss / desert** — single-hue statements with realistic PBR (metallic flake,
  clearcoat, brushed metal) — read as paint/carbon/metal, **not plastic**.

Materials use `lib.mat` (Principled BSDF: `Base Color`, `Metallic`, `Roughness`, `Coat Weight`,
`Coat Roughness`). Carbon stays `carbon_*` (near-black, coat .5, rough .34) — never flat plastic.

---

## 4. Efficiency budget (web-ready)

- One fused frame mesh per bike via `frame_tubes.voxel_fuse` → `target≤140 000` tris/frame, whole bike ≤~500 k tris.
- Wheels: `lathe` rims/tyres at 160 seg, bladed spokes; shared across bikes of same wheel spec.
- Export `bpy.ops.export_scene.gltf(GLB, export_yup)` → `gltf-transform optimize --compress meshopt` (same as heritage).
- One multi-material object per part keeps GLB node count low; PBR only, no runtime textures (fast first paint).
- Cycles stills (hero/side) at 64 samples, Metal GPU — same museum_scene rig, reused.

## 5. Process (identical to the live site)

1. `blender --background --factory-startup -P blender/multibrand/build.py -- profile.json OUTDIR master.blend`
2. geometry → skeleton → fused frame (zones) → fork → wheels → drivetrain → cockpit → saddle → decals.
3. save `.blend` → export raw GLB → `gltf-transform optimize --compress meshopt` → `assets/multibrand/<id>/`.
4. Cycles hero/side renders via `museum_scene.py` rig.
5. JSON receipt (tris, zones, theme, material contract, uncertainties).
