# Canyon 3D Museum — Caldas Studio Collection

> **Interactive 3D timeline, procedural CAD reconstruction, and virtual aerodynamic showroom of Canyon triathlon bicycles (1999–2027).**
> *Part of the Caldas Studio interactive web portfolio.*

---

## 🏛️ Live Exhibit Endpoints

When served locally via `python3 -m http.server 8744`:

| Exhibit | Era / Model | Technology & Highlights | URL |
|---|---|---|---|
| **Canyon Collection** | **1999–2027** | Full chronological collection & lineage overview | [`/Canyon_Collection.html`](http://127.0.0.1:8744/Canyon_Collection.html) |
| **Speedmax CFR AXS** | **MY2027 (Modern)** | Flagship: Aero Lab (virtual wind tunnel), Paint Studio, Rider Fit IK, Exploded view | [`/Speedmax_Museum.html`](http://127.0.0.1:8744/Speedmax_Museum.html) |
| **Speedmax CF SLX 8 Di2** | **MY2027 (Modern)** | Shimano Ultegra Di2, DT Swiss ARC 1600 65/85mm | [`/Speedmax_SLX_Museum.html`](http://127.0.0.1:8744/Speedmax_SLX_Museum.html) |
| **Speedmax Three** | **2002–2005 (Heritage)**| 7005-alu triathlon geometry, Carbotec disc, 8.75 kg | [`/Speedmax_Three_2005_Museum.html`](http://127.0.0.1:8744/Speedmax_Three_2005_Museum.html) |
| **SpeedMax 3.0** | **2006–2008 (Heritage)**| MR3 frame, Super Aero seat tube, Dura-Ace | [`/Speedmax_2007_Museum.html`](http://127.0.0.1:8744/Speedmax_2007_Museum.html) |
| **Speedmax AL 9.0** | **2009–2013 (Heritage)**| Aero-era geometry, sliding dropouts | [`/Speedmax_AL_2011_Museum.html`](http://127.0.0.1:8744/Speedmax_AL_2011_Museum.html) |
| **Speedmax CF 9.0 Pro** | **2009–2012 (Heritage)**| Canyon's first carbon Speedmax, Zipp 404/808, 7.7 kg | [`/Speedmax_CF_2011_Museum.html`](http://127.0.0.1:8744/Speedmax_CF_2011_Museum.html) |

---

## ⚡ Key Highlights & Architecture

- **Photogrammetric Accuracy:** Built from manufacturer launch photography with RANSAC wheel circle calibration (`tools/heritage_calibrate.py`) establishing scale from ISO tyre outer diameters.
- **Procedural CAD in Blender:** Carbon tubes and aerodynamic fairings extruded and remeshed via OpenVDB voxels (`blender/frame.py` and `blender/heritage_build.py`).
- **Ray-Projected Decals:** Canyon wordmarks and model insignias projected onto complex 3D surfaces via BVH tree raycasting (`blender/decals.py`).
- **Zero-Network Offline Distribution:** Minified Three.js application code and Meshopt-compressed GLBs are compiled into self-contained single-file HTML exhibits.
- **Interactive Engineering Studios:**
  - **Aero Lab:** Virtual wind tunnel with flow streamlines, apparent wind vectors, and yaw curve drag analysis.
  - **Rider Biomechanics:** 72-phase pedal stroke kinematic solver and mannequin aerodynamic contribution.
  - **Paint Studio:** Real-time PBR material customization, clearcoat/roughness sliders, and custom livery artwork uploads.

---

## 🌊 The Kona Pier — *Kona by Year*

A teak pier runs out of the apse over the Pacific (Kailua Pier is where every Kona Ironman starts). Along it, one painted canvas per October from 2014 to 2025: the **best-placed Canyon Speedmax** in that year's Kona race, with place, time, bike and sources. 2020 (cancelled) and 2021 (raced in Utah) stand as an empty bay and an empty frame. At the end, under a FINISH arch, the current Speedmax CFR turns on a basalt table.

- **Data:** `museum/kona_years.json` — results, headline and sources per year, plus the Commons credit for every canvas.
- **Paintings:** `python3 tools/paint_canvases.py` turns the credited Wikimedia Commons photos in `assets/kona-years/src/` into oil-paint canvases (Kuwahara paint patches + brush streaks that follow the picture's contours) and a matching normal map, so the museum's light rakes across real impasto. Baked once, offline — nothing is filtered on the phone. Canvases are derivatives and keep their source licence (CC BY / CC BY-SA).
- **Mobile budget:** static pier geometry is merged per material, festoon bulbs are one instanced mesh with no real lights, canvases load only when you walk toward the pier, and out on the pier the walled rooms are hidden and the shadow map is frozen.
- **Test:** `node web/pier-smoke.mjs` (phone viewport: walks out, opens 2023, reaches the finish).

## 📱 The app

- **Install from the site:** "Get the app" in the header (Android/desktop Chrome prompt; iPhone: Share → Add to Home Screen). `manifest.webmanifest` + icons in `app/icons/`.
- **Secure updates:** `node tools/build_app.mjs` seals each release — it hashes every file (SHA-256) into `app/app-manifest.json` and inlines them into `sw.js`. A new version installs only if every core file downloads intact and matches its hash; otherwise the visitor keeps the last good version. Heavy files are verified the same way on first use. Updates wait for the visitor to tap **Reload**. CI (`app-seal.yml`) fails if a change isn't re-sealed. Test: `node web/app-smoke.mjs` (install, offline reload, tampered release refused).
- **Android app:** `app/native/` is a Capacitor shell that bundles the museum (offline, native WebView). `.github/workflows/android.yml` builds it, boots it on an emulator and publishes `downloads/SpeedmaxMuseum.apk` + `app/android-version.json` (version, size, SHA-256); the installed app checks that file over HTTPS and offers the update. Add the `SPEEDMAX_KEYSTORE_*` secrets so every release carries the same signature — Android refuses updates signed with a different key.

Rebuild order: `node web/build_landing.mjs && node tools/build_app.mjs`.

---

## 📚 Essential Documentation

- 🔬 **[`ANALYSIS.md`](ANALYSIS.md):** Complete codebase evaluation, asset rendering breakdown, identified inefficiencies, and reusable template blueprint.
- 🛠️ **[`HANDOVER.md`](HANDOVER.md):** Developer operations, build instructions, and guidelines for extending the museum with new bikes.
- 📐 **[`docs/MUSEUM_WORKFLOW.md`](docs/MUSEUM_WORKFLOW.md):** Evidentiary standards, confidence ratings, and calibration protocols.
- 🎯 **[`docs/BRAND_MUSEUM_AGENT_PROMPT.md`](docs/BRAND_MUSEUM_AGENT_PROMPT.md):** Prompt template for deploying autonomous agents to construct brand museums.

---

## 🚀 Quickstart & Local Build

### 1. Prerequisites
- Blender 4.x / 5.x LTS on PATH (or in `/Applications/Blender.app`)
- Python 3.9+ and Node.js 20+

### 2. Install Dependencies
```bash
# Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-museum.txt

# Node environment
cd web && npm ci && cd ..
```

### 3. Rebuild Everything
```bash
# Rebuild modern flagship exhibit
python3 tools/build_museum.py --manifest museum/bikes/canyon-speedmax-cfr-axs-my2027-m.json --lods

# Rebuild heritage exhibits
python3 tools/build_heritage.py museum/bikes/canyon-speedmax-three-my2005.json
python3 tools/build_heritage.py museum/bikes/canyon-speedmax-3-0-my2007.json
python3 tools/build_heritage.py museum/bikes/canyon-speedmax-al-9-my2011.json
python3 tools/build_heritage.py museum/bikes/canyon-speedmax-cf-9-pro-my2011.json

# Compile collection catalog
node tools/build_collection.mjs
```

### 4. Run Test Matrix
```bash
node --test web/test/*.test.mjs
node web/smoke.mjs
```

---

## 📜 Disclaimer & Credits

*This is an unofficial design, engineering, and historical study built from Canyon's public archives and launch photography. Not affiliated with or endorsed by Canyon Bicycles GmbH.*
*Built for the Caldas Studio interactive web portfolio.*
