# Google Play Readiness — KONA

Date: 1 October 2026  
Scope: Android phone app in `app/native/`.  
Goal: distinguish “builds on Android” from “can be submitted to Google Play today.”

## Release rule

A Play release is ready only when all four layers are true on one release candidate:

1. **Runtime** — KONA passes the same responsive, interaction, security and release gates as the web app.
2. **Android package** — signed Android App Bundle, stable package identity, versioning and emulator/device proof.
3. **Policy** — privacy, data safety, account deletion, content rating, target audience and reviewer access are complete.
4. **Store** — listing, screenshots, icon, feature graphic, developer verification and testing-track requirements are complete.

Passing CI alone is not a Play launch.

## Current scorecard

| Requirement | Current KONA state | Status | Action |
|---|---|---:|---|
| Target Android API | `targetSdkVersion = 36`, `compileSdkVersion = 36` | PASS | Keep on API 36+ |
| Minimum Android | API 24 | PASS | Product choice, not a Play blocker |
| Cleartext traffic | Disabled | PASS | Keep |
| Dangerous permissions | INTERNET only | PASS | Re-audit when native capabilities are added |
| Release signing support | CI accepts a stable keystore from secrets | PARTIAL | Confirm/upload key and Play App Signing |
| Android App Bundle | CI currently builds `assembleRelease` APK | BLOCKER | Add `bundleRelease` and preserve APK only for emulator/sideload smoke |
| Package identity | `com.caldasstudio.speedmaxmuseum` | DECISION | Decide before first Play publication; package ID becomes permanent |
| Privacy policy | No canonical KONA public privacy policy found | BLOCKER | Publish policy and link it in-app + Play Console |
| Data safety | No Play Console declaration can be evidenced from repo | BLOCKER | Inventory data flows and submit accurate Data safety answers |
| Local data deletion | Settings exports/deletes app-owned local state | PASS | Keep |
| Cloud/account deletion | Account creation exists; no self-service account deletion found | BLOCKER | Add in-app deletion + external deletion page + backend deletion |
| Content rating | Console questionnaire, not repo evidence | CONSOLE | Complete before review |
| Target audience | Console declaration, not repo evidence | CONSOLE | Choose intended age groups; avoid children unless intentionally supported |
| Ads declaration | No ad SDK found in current runtime | CONSOLE | Declare accurately in Play Console |
| Reviewer app access | Sign-in is optional | LIKELY PASS | Document any restricted/admin paths if review needs them |
| Store icon | 512px KONA asset exists in app/PWA set | VERIFY | Export/verify exact Play listing PNG constraints |
| Screenshots | Automated mobile screenshots exist | PARTIAL | Select current exact-SHA screenshots that represent real app UI |
| Feature graphic | No Play-specific 1024×500 asset found | BLOCKER | Produce one from canonical KONA brand |
| Short/full description | Product copy exists, no Play listing source file | BLOCKER | Add controlled store-listing copy to repo |
| Testing requirement | Depends on developer-account type/date | UNKNOWN | If affected personal account: 12 opted-in closed testers for 14 continuous days |
| Developer verification | Play Console/account state is external | UNKNOWN | Confirm verified developer/contact information |
| Physical Android proof | CI emulator exists | PARTIAL | Add at least one physical-device install/upgrade/smoke receipt |
| Play production rollout | No Play deployment workflow | NOT YET | Add only after first manual Console setup is understood |

## Google requirements verified for this audit

### Target API

From 31 August 2026, new phone/tablet apps and updates submitted to Google Play must target Android 16 / API 36 or higher.

KONA already targets API 36.

Source: Google Play Console Help, “Target API level requirements for Google Play apps”.

### Android App Bundle

New Google Play apps must publish using Android App Bundles (`.aab`).

KONA's current Android CI produces an APK, so the native project is buildable but not yet using the required new-app publication artifact.

Source: Android Developers, “About Android App Bundles”; Google Play Console Help, “Inspect app versions on the Latest releases and bundles page”.

### Play App Signing

A new Play app uses Play App Signing. The developer signs the uploaded bundle with an upload key; Google protects the app signing key and signs device-specific APKs distributed to users.

KONA already has environment-driven keystore support, which is a good base. The release workflow must distinguish **upload key** from the Play-managed **app signing key**.

Source: Google Play Console Help, “Use Play App Signing”.

### Privacy policy and Data safety

Google Play requires every app to provide a privacy policy in Play Console and in the app. The policy must accurately describe collection, use, sharing, security, retention and deletion. Every app must also complete the Data safety section.

KONA currently has local-first behavior and no analytics declaration in Settings, but it also has optional Supabase authentication/cloud state. The policy and Data safety answers therefore need to describe the actual authenticated data path rather than simply saying “no data.”

Source: Google Play Developer Program Policy / User data policy.

### Account deletion

If an app allows account creation in the app, users must be able to request deletion:
- from within the app; and
- from an external web resource whose URL is supplied to Play Console.

Deleting only local browser/app state is not enough. Associated cloud account data must also be deleted, subject to any clearly disclosed legitimate retention.

KONA currently has account creation/sign-in but only local “Delete everything.” This is a Play blocker.

Source: Google Play User data policy, Account Deletion Requirement.

### Store assets

For the Play store listing:
- app icon: 512×512 PNG, max 1024 KB;
- feature graphic: 1024×500 JPEG or 24-bit PNG;
- at least two screenshots are required across supported device types, with dimensions between 320px and 3840px and aspect constraints.

KONA's visual-evidence pipeline can become the screenshot source once the candidate SHA is frozen.

Source: Google Play Console Help, “Add preview assets to showcase your app”.

### App content declarations

Before review, Play Console requires app-content information such as:
- privacy policy;
- ads declaration;
- app access instructions;
- target audience;
- content rating questionnaire;
- any sensitive-permission declarations that apply.

KONA currently requests only INTERNET, which keeps the permission story simple.

Source: Google Play Console Help, “Prepare your app for review” and content-rating guidance.

### Testing for newer personal accounts

For personal developer accounts created after 13 November 2023, Google currently requires a closed test with at least 12 testers opted in continuously for at least 14 days before production access can be requested.

This requirement depends on the actual Play developer account, so repository code cannot prove or remove it.

Source: Google Play Console Help, “App testing requirements for new personal developer accounts”.

## KONA data-flow inventory for Play declarations

Current first-party flows visible in the repository:

### Local-first state
Stored on-device:
- profile and avatar choices;
- race identity;
- race history;
- equipment / garage state;
- progression, finds and collection state;
- settings and feed/travel preferences.

Settings supports export and local deletion.

### Optional account/cloud state
When the user chooses sign-in:
- email is submitted to Supabase Auth for magic-link authentication;
- an authenticated user/session is created;
- KONA can back up the versioned app state to `public.user_app_state`, scoped by RLS to the authenticated user.

Before Play submission, confirm the exact production behavior and translate it into the Data safety form and privacy policy.

### External content
Kona Now retrieves public RSS/Atom and YouTube feeds through the bounded companion service. Story links open the original publishers.

Travel can open external providers for current flight/traffic information.

These should be described accurately, without implying KONA itself owns or verifies third-party services beyond the documented source checks.

## Minimal technical plan

### GP-1 — Play build artifact

**Why:** Play cannot accept the current APK-only new-app publication path.

Actions:
- keep `assembleRelease` for emulator / downloadable APK smoke testing;
- add `bundleRelease`;
- produce `app-release.aab`;
- verify signing;
- upload AAB as CI artifact;
- record versionCode, versionName and SHA-256;
- do not auto-upload to Play yet.

Outcome: a reproducible Play-uploadable binary.

### GP-2 — Privacy and deletion

**Why:** optional account creation makes deletion policy launch-critical.

Actions:
- create canonical KONA privacy policy;
- expose it from Settings/About;
- add authenticated “Delete account & cloud data” flow;
- delete `user_app_state` plus the app account server-side;
- create external account-deletion web page;
- add tests proving local-only delete and cloud-account delete are distinct and explicit.

Outcome: policy-complete user control instead of a local-only delete button.

### GP-3 — Store package

**Why:** Play submission needs artifacts and declarations outside the executable.

Actions:
- decide final package ID before first upload;
- add repo-owned short/full store descriptions;
- add 512×512 listing icon validation;
- add 1024×500 feature graphic;
- select exact-SHA phone screenshots from visual evidence;
- document category, contact/support URL, target audience, ads declaration and reviewer access.

Outcome: repeatable store listing rather than one-off Console typing.

### GP-4 — Release proof

**Why:** emulator success is necessary but not physical-device proof.

Actions:
- physical Android install from signed release;
- sign-in/callback test;
- local → cloud backup/restore test;
- offline/reconnect test;
- update-from-previous-version test;
- responsive portrait + short-landscape proof;
- thermal/memory sanity on a real phone.

Outcome: one release receipt connecting source SHA → AAB → device proof.

## Package-ID decision

Current ID: `com.caldasstudio.speedmaxmuseum`.

It is technically valid but reflects the product KONA replaced.

**Make this decision before the first Play publication.** Google Play package identity is effectively permanent for that listing and users/updates bind to it.

Do not rename it casually if a production Play listing or installed update lineage already depends on it. If this is truly the first Play publication, use the long-term KONA identity now rather than carrying “speedmaxmuseum” indefinitely.

## What can happen today

If the Play developer account has no mandatory 14-day closed-test wait and all Console verification is already complete, the repo can be brought to **upload-ready** today by finishing GP-1 through GP-3.

If the account is subject to the 12-testers / 14-days rule, no code change can make public production availability happen today. The correct “today” milestone is:
- exact-SHA runtime green;
- signed AAB produced;
- privacy/deletion complete;
- store listing complete;
- closed test started.

That is still a real launch milestone: everything under our control is ready while the external clock runs.

## Go / no-go

**Current Play production status: NO-GO.**

The blockers are concrete rather than architectural:
1. AAB build path;
2. privacy policy;
3. cloud account deletion + external deletion page;
4. store listing assets/copy;
5. Play Console declarations;
6. account-dependent testing/verification;
7. current #141 release candidate must first become green on one exact SHA.

Do not solve these by weakening the existing release gates.
