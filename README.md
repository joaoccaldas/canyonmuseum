# KONA

Race the version of yourself.

A local-first triathlon app for athlete identity, equipment, race-week context, immersive discovery and personal progress. An account is optional; browser installation is the day-one app route.

## Start here

- [Launch readiness](docs/launch/READINESS.md)
- [Product](docs/PRODUCT.md), [architecture](docs/ARCHITECTURE.md), [data model](docs/DATA_MODEL.md)
- [Brand system](docs/BRAND_SYSTEM.md), [security and privacy](docs/SECURITY_PRIVACY.md)
- [Repository cleanup review](docs/launch/REPOSITORY_REVIEW.md)
- [Later PR roadmap](docs/launch/LATER_PRS.md)

## Local development

Run from a repository checkout:

```sh
npm ci --ignore-scripts --prefix web
node tools/build_pages.mjs
node tools/build_app.mjs
bash tools/stage_site.sh
python3 -m http.server 8744 --directory _site
```

Open `http://127.0.0.1:8744/`.

## Verification

```sh
npm test --prefix web
node tools/validate-bikes.mjs
node tools/validate_integration_contract.mjs
node tools/repo-hygiene.mjs
node tools/brand-hygiene.mjs
node tools/scan_private_data.mjs
```

Existing browser audits use `CHROME_PATH` pointing to a local Chromium browser. Generated pages, bundles and worker hashes must match the source build. Test the staged artifact, then compare the deployed receipt to the approved commit.

## Naming and compatibility

KONA owns display branding, page metadata, share captions, packages and native application identity. Existing hosting paths, published exhibit URLs, source identifiers and legacy storage aliases remain compatibility contracts. Blind renaming would break inbound links or strand saved progress. New storage uses `kona.*` through the adapter.

## Privacy and rights

Never commit credentials, personal profiles, correspondence, test recipients or local-machine paths. Documentation uses roles without personal attribution or implementation-provider disclosure. Preserve required source and licensing attribution in canonical content records. Native binaries and browser captures belong in release/CI artifacts.

Landing previews come from the full eligible bike catalog. Secret entries have anonymous silhouettes. When adding a public bike, run `node tools/render_entry_art.mjs --catalog`, then the normal page/seal builds; the build rejects a missing preview.
