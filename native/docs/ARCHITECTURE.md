# WAL native architecture

Greenfield native ports of the WAL Expo/React Native app. iOS (SwiftUI) first, Android (Kotlin) next,
built so both can be worked on, tested and reviewed at the same time.

## Sharing model: mirrored native cores + language-neutral artifacts

```
native/
  shared/                      language-neutral, the single source of truth for both platforms
    api/openapi.json           reconstructed from lib/api/generated (114 operations, 147 schemas)
    design/tokens.json         colours, spacing, radii, font sizes, metrics, sheet snap points
    navigation/routes.json     route table mirrored from the Expo Router tree (presentation, params, headers)
    cli/commands.json          walctl command vocabulary shared by both cores
    fixtures/                  canned API responses + scenario scripts
    codegen/                   TypeScript generators: extract-openapi, gen-swift, gen-kotlin, check-drift
  ios/
    WALCore/                   SwiftPM package, builds & tests on Linux and macOS
      Sources/WALAPI           generated DTOs + operations, tiny runtime (JSONValue, APIOperation, Multipart)
      Sources/WALCrypto        libsodium crypto_box (wire-compatible with react-native-libsodium)
      Sources/WALCore          headless app core: HTTP client, QueryStore, auth, feature stores, Router model, L10n
      Sources/walctl           CLI driving the core (mock / live) or the running app (remote)
    WAL/                       SwiftUI app (iOS 15.1+), UIKit-hosted navigation
    WALNotificationService/    NSE (ported verbatim from targets/notification-service)
    WALShareExtension/         share extension (expo-share-intent replacement)
    WALTests/ WALSnapshotTests/ WALUITests/
    project.yml                XcodeGen spec (WAL.xcodeproj is not committed)
  android/                     Kotlin core lands here; gen-kotlin.ts already emits its parity catalogue
  docs/                        this file, CHECKLIST.md, review-log.md, spec/*.md
```

Both cores implement the same *behaviour contract*: same type names, property names, operationIds,
route ids, token names, command vocabulary, fixtures and scenarios. That contract is what is shared —
not binaries. Kotlin/Swift interop (Swift export in Kotlin 2.4) stays an option but is not a dependency.

## Layering (iOS)

```
SwiftUI screens  ──▶  Stores (ObservableObject, one per feature)  ──▶  WALCore services
   WAL target            WALCore (headless)                              HTTPClient, QueryStore,
                                                                         SocketClient, Storage, Router
```

- **UI never talks to the network.** Screens read published state and call store methods. Everything a
  screen can do, `walctl` can do headlessly, which is how agents inspect state and drive scenarios.
- **QueryStore** replicates the TanStack Query semantics the RN app depends on: hey-api-shaped query keys,
  stale/gc times, `invalidateQueries` prefix matching, `setQueryData` optimistic updates, infinite
  queries (page-number and cursor). Defaults mirror `lib/queryClient.ts`
  (`retry: false, refetchOnWindowFocus: false, structuralSharing: false`).
- **Router model** is a plain value type (`Route`, `RouteDescriptor`) generated from `routes.json`. The
  UIKit host (`UINavigationController` / `UITabBarController` + `UIHostingController` per screen) renders
  it with the same presentation semantics react-native-screens used (`modal`, `formSheet`, `fade`,
  `slide_from_bottom`, transparent headers). Tab press on the user tab resets its stack; `backBehavior`
  is `initialRoute`.
- **iOS 15.1 constraints**: `ObservableObject` / `@Published` (no `@Observable`), custom `BottomSheet`
  replicating Gorhom snap points, custom `RemoteImage` cache, no `NavigationStack`.

## Generated code

`npm run gen` in `native/shared/codegen`:

| Input | Output | Notes |
| --- | --- | --- |
| `lib/api/generated/*.gen.ts` | `shared/api/openapi.json` | TS compiler API rebuilds the FastAPI OpenAPI 3.1 doc |
| `openapi.json` | `WALAPI/Generated/Models.swift`, `Operations.swift` | Codable structs w/ explicit CodingKeys, extensible string enums, `Operations.X: APIOperation` |
| `design/tokens.json` | `WALCore/Generated/Tokens.swift` | pure data, no UIKit |
| `navigation/routes.json` | `WALCore/Generated/Routes.swift` | `Route` enum with typed params, descriptors, deep-link and push routing tables |
| `locales/*.json` | `WALCore/Generated/L10nKeys.swift` + copied bundles | i18n-js semantics incl. fallback to `en` |

`npm run check:drift` regenerates in memory and fails CI if committed output differs.

## Test strategy

1. **Linux (`swift test`)** — WALCore unit tests, fixture decoding, scenario runner, crypto vectors,
   drift. Runs on every PR in seconds; the Kotlin core will run in the same job.
2. **macOS (`xcodebuild test`)** — app unit tests, pixel snapshot tests (iPhone 17 @3x, light + dark),
   XCUITests driven through `walctl --mode remote` against the DevServer inside the debug app.
3. **Visual parity** — each checkpoint records screenshots of the RN app and the SwiftUI app for the
   same fixture state; differences are logged in `CHECKLIST.md`.

## Checkpoint process (Shopify Helix style)

Every checkpoint (CP0…CP15) must: pass automated tests; match the running RN app visually for its
screens; survive two adversarial reviewer passes (findings + resolutions recorded in `review-log.md`);
update `CHECKLIST.md`; be a single commit on the migration branch; then wait for human sign-off.
