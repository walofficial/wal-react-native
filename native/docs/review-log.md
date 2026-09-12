# Review log

Every checkpoint is reviewed by two adversarial reviewers (independent passes, different focus: one on
behavioural parity with the RN app, one on engineering quality / correctness). Findings are listed with
their resolution before the checkpoint is presented for human sign-off.

Severity: **blocker** (must fix before sign-off), **major** (fix in this checkpoint), **minor** (fix now or
carry as a tracked item), **note** (informational).

---

## CP0 — Scaffold

Scope: `native/` tree, shared artifacts, codegen, WALCore package, XcodeGen project, CI, docs.

### Reviewer A (parity)

1. **major** `createPost` param `contentType` / missing `disableRoomCreation` — **fixed** (`content_type`, `disableRoomCreation`).
2. **major** `mediaPage` missing `recordingTime` — **fixed**.
3. **major** `/links/{username}` → undefined `profileByUsername` — **fixed**: route added; listed as a native improvement in CHECKLIST Deviations (RN inbound is `[...missing]`).
4. **major** spec 04 socket wire format — **fixed** (`temporary_id`, `recipient`, `encrypted_content`, `is_that_connected_id`; emit set corrected).
5. **major** spec 04 claimed image messages are encrypted — **fixed** (plaintext `attachments`).
6. **major** wrong endpoints in specs 03–07 — **fixed** against `sdk.gen.ts` / `openapi.json`.
7. **major** `reportUser` missing path param — **documented** in Deviations (keep RN bug until CP11).
8. **major** Info.plist usage strings vs Expo plugin overrides — **fixed** in `project.yml`.
9. **major** NSE entitlements RN does not have — **fixed** (removed).
10. **major** `commands.json` gaps — **fixed** (poke, comment like/delete, fact-check, chat `--plain`/`--attachment`/`seen`, profile-by-username, delete-account, fcm, check-username, send-public-key, `with_image_and_high_score`).
11. **minor** fabricated `impressionCooldownMs` — **removed**.
12. **minor** spec numbers vs tokens/RN — **fixed** (tokens were already correct).
13. **minor** spec strings (DOB format, share key, chat menu, 401 retry, `x-is-anonymous`) — **fixed** / listed as deviations.
14. **minor** missing routes — **added** `profileByUsername`, `createPostShareIntent`, `notFound`; `feed` gained `content_type`.
15. **minor** `NaClBox.Sealed` Codable keys — **fixed** (`encrypted_content`).
16. **minor** orientation — carried to CP8 (lightbox unlock).
17. **note** `LSApplicationQueriesSchemes` extra — accepted.

### Reviewer B (engineering)

1. **blocker** missing AppIcon/Splash PNGs — **false positive**: files are committed (`git ls-files` lists all four PNGs).
2. **blocker** macOS CI missing libsodium — **fixed** (`brew install libsodium` + `PKG_CONFIG_PATH`).
3. **blocker** Swift 6 complete concurrency on NSE/Share/snapshots — **mitigated**: extensions/tests use `targeted`; NSE `deliver()` is one-shot under a lock.
4. **major** `|| xcodebuild` silent retry — **fixed** (pipefail + xcbeautify only).
5. **major** Xcode 27 vs macos-26 — **fixed** (select `Xcode_26.6.app`).
6. **major** `camel()` ALL_CAPS → `sENT` — **fixed** (`toLowerCase` each segment) + generator test.
7. **major** EmptyResponse empty body — **fixed** (`EmptyResponse.decode` / `ResponseDecoder`).
8. **major** no generator tests — **fixed** (`camel.test.ts`); `npm test` runs in CI.
9. **major** `testDerivedPublicKeysMatchVector` did not derive — **fixed** (`crypto_scalarmult_base` vs tweetnacl vector).
10. **major** NSE double `contentHandler` — **fixed**.
11. **major** Share extension `UIApplication.open` — **fixed** (`openURL:` responder hack, `walShareKey`).
12. **major** tuples/`anyOf` → JSONValue — **accepted** for CP0 (ValidationError.loc is `[JSONValue]`); revisit if a typed tuple appears.
13. **major** `PRODUCT_NAME` with a space — **fixed** (`PRODUCT_NAME=WAL`, `CFBundleDisplayName=WAL DEV`).
14. **major** drift does not cover Kotlin — **accepted**; `gen:kotlin` stays opt-in until the Android tree exists.
15. **major** boxed init `self._name` — **fixed** (assign through the wrapper).
16–21. **minor** tools-version, error case names, `languageCode`, walctl flags, snapshot hash, multipart quoting — error cases **fixed**; others tracked for CP2/CP15.

### Human sign-off

_pending_

---

## CP1 — Design system / CP2 — Core / CP3 — Auth (headless + first screens)

Headless WALCore now owns theme resolution, QueryStore (hey-api keys, prefix invalidate, optimistic infinite pages), HTTPClient (401 once, location headers), RouterState (tabs, deep links, push-tap order), AuthRules (index gate, username/phone/DOB), and walctl (`state`, `navigate`, `like`, `scenario`, …). SwiftUI primitives live under `native/ios/WAL/DesignSystem` and `WAL/Auth`. Linux: 49 tests.

Reviewers: same findings as CP0 applied; new code is covered by `ThemeQueryRouterTests` + `AuthRulesTests`. Visual snapshot sign-off still pending (needs the macOS job / device).
