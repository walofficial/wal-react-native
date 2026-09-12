# Migration checklist

Parity contract for the SwiftUI port. Every row is verified against the running React Native app before
its checkpoint is signed off. Status: `[ ]` open, `[x]` done + verified, `[~]` done with a documented
deviation (see "Deviations").

Legend for evidence: **U** unit test (WALCore/WALTests), **S** snapshot test, **E** XCUITest via walctl
remote, **V** manual visual comparison with the RN app.

## CP0 — Scaffold

- [x] `native/` tree, XcodeGen `project.yml` (iOS 15.1, app + NSE + Share Extension + 3 test targets) — U
- [x] WALCore SwiftPM package builds and tests on Linux (Swift 6.3.1) and macOS
- [x] OpenAPI reconstructed from `lib/api/generated` (114 operations, 147 schemas) — U `testEveryOpenAPIOperationHasAGeneratedStruct`
- [x] Swift codegen: models (snake_case ↔ camelCase, null-tolerant, unknown-enum-tolerant), operations (path/query/header/body/multipart), tokens, routes, L10n keys — U
- [x] `check:drift` fails when generated output diverges from `native/shared/**`
- [x] WALCrypto `crypto_box` wire-compatible with react-native-libsodium (URLSAFE_NO_PADDING base64) — U cross-implementation vector (tweetnacl)
- [x] L10n: i18n-js semantics (device locale → supported or `en`, fallback to `en`, `{{x}}` interpolation) — U
- [x] Route table mirrors Expo Router tree incl. presentations, params, headers, out-of-scope livekit routes — U
- [x] CI: Linux core job (drift + swift test + walctl smoke) and macOS app job (xcodebuild test)
- [x] NSE ported verbatim; Share Extension stub with expo-share-intent activation rules
- [x] App icon composited on `#000000` like Expo does; LaunchScreen = expo-splash-screen (black, 200pt icon)

## CP1 — Design system

- [ ] `Theme` resolves every `tokens.json` colour for light/dark; system scheme with dark fallback
- [ ] Text styles: sizes xs…xxl + legacy small…huge, weights 400/500/600/700, system font
- [ ] `Button` medium/large, icon-only, disabled opacity, pressable scale — S
- [ ] `UserAvatar` sizes 32/40/50/56/60/64/85/128, border 2, padding 3 — S
- [ ] Skeleton pulse, Toast stack (default/message durations, radius, icon), haptics mapping
- [ ] `BottomSheet` snap points 25/45/50/70/85 %, backdrop on index 0, blur 60 dark / 40 light, handle — S/E
- [ ] `RemoteImage` with memory+disk cache, placeholder, fade
- [ ] Ionicons → SF Symbols mapping table for every icon used in the RN app

## CP2 — Core infrastructure

- [ ] `HTTPClient`: base URL + `API_BASE_URL_OVERRIDE`, Bearer from session, `x-is-anonymous`, dynamic `Accept-Language`, location headers on `/feeds/locations`, 401 → re-read session and retry once, multipart Content-Type handling — U
- [ ] `QueryStore`: hey-api keys, stale/gc, invalidate prefix, `setQueryData`, infinite (page + cursor), `retry:false`, `refetchOnWindowFocus:false` — U
- [ ] Storage: Keychain for session/keys (`user_keys_v2`, `remote_key_{userId}`), UserDefaults for prefs (`app-locale`, …)
- [ ] `walctl --mode mock` with fixtures + scenario runner; first scenarios green on Linux

## CP3 — Auth

- [ ] index gate: session && `preferred_news_feed_id` → home; loading → splash; else sign-in — U/E
- [ ] Landing: DASH video `…/f2897541-…/manifest.mpd`, "WAL" 36 bold, CTA `#efefef` radius 12 padding 16 — S
- [ ] Login sheet 45 %; phone input bg `#222`/`#f8f8f8` radius 8 minHeight 56, flag `flagcdn w80` 24×18, default GE +995, per-country length rules — S/E
- [ ] Supabase `signInWithOtp` / `verifyOtp` (sms, 6 digits), 10 s resend, focused cell border `#004cb0` — U/E
- [ ] Register: title "რეგისტრაცია", username 3–20 debounce 500 ms, borders `#737373`/`#d1d5db`, invalid `#ef4444`, checking `#3b82f6`; DOB button 58/radius 12, default 01/02/2000, min 1940-02-01, max today−12y — S/E
- [ ] `isUserRegistered = !!date_of_birth && !!gender` gating; logout clears session + keys

## CP4 — Shell & navigation

- [ ] 3 tabs, icons 24, active `#FFFFFF`/`#121212`, inactive `#777777`/`#999999`, focused scale 1.15 (home/user), no labels — S
- [ ] user tab press → dismissAll + navigate `/(tabs)/(user)`; `backBehavior initialRoute`
- [ ] Presentations: modal (200 ms slide_from_bottom), formSheet (350 ms), fade, transparent headers — E
- [ ] Deep links `wal://`, `https://wal.ge/status/{id}`, `/links/{username}` — U/E
- [ ] Push-tap routing table order poke → new_message → feedId → verification_like → friend_request_sent — U
- [ ] DevServer in debug builds + `walctl --mode remote` (state, navigate, back, tab, ui) — E

## CP5 — Home feed

- [ ] Collapsing header `opacity=(1-mode)^2`, translateY −headerHeight, spring overshootClamping — V
- [ ] Search overlay, content-type tabs, `HorizontalAnonList`
- [ ] Feed list pagination 10/page, `onEndReachedThreshold 0.5`, pull-to-refresh, `initialNumToRender 2`, `windowSize 6` semantics — U/E
- [ ] FAB, locations formSheet (slide_from_bottom 350 ms) with `feeds_at_location` / `nearest_feeds` + location headers — E

## CP6 — Feed item

- [ ] Card: avatar 50 radius 35, name 15/600, time 15 secondary, borders from tokens — S
- [ ] Media layouts, video visibility 50 %/250 ms, link preview, `ExpandableText` 250 chars "მეტი"
- [ ] Like: heart 27 (large 30) `#ff3b30`, spring 1.1→0.9→1, haptic Medium, optimistic `setQueryData` + invalidate — U/E
- [ ] Comment icon 20/23; menu (delete/report); NewsCardItem; fact-check badge/box/circle thresholds; factCheck 70 % & newsSources 50 % sheets — S

## CP7 — Post detail

- [ ] verification/status screens, PostHeader, markdown rendering
- [ ] Comments: avatar 32, borders `rgba(31,41,55,0.5)`/`rgba(229,231,235,0.8)`, input 120 max / 1000 chars, reactions love/laugh/wow/sad/dislike, TOP love/sad/wow/dislike, popup radius 28 / button 36 / emoji 22 — S/E
- [ ] delete/report flows, `focusComment` param

## CP8 — Lightbox

- [ ] open 200 ms, fly-away 150 ms, zoom 2, decay velocity 200, spring stiffness 700 damping 50, header/footer, orientation — V/E

## CP9 — Chat list

- [ ] Title "ჩათი", add-circle 40, stories 72 w/ 60 avatar, request chips, ChatItem avatar 60 name 20/600, timestamps Now/{n}m/{n}h/weekday/M/D — S
- [ ] Empty state, refresh, prefetch, decrypted previews, `joinChat` — E
- [ ] No unread badges / typing indicator (parity with RN)

## CP10 — Chat room

- [ ] Topbar avatar 40, online dot 12 `#22c55e`, name 24/600, menu "რა გსურთ?" / "უჯიკე" / "მეგობრად დამატება" / "მეგობრის წაშლა" — S
- [ ] Socket.IO (`websocket` only, auth `{userId, publicKey, deviceId}`, heartbeat 25 s, 10 reconnects / 1000 ms), events `private_message`, `check_user_connection`, `user_connection_status`, `user_public_key`, `notify_single_message_seen`, `force_logout` — U (mock transport)
- [ ] Pages of 15, bubbles `#3A76F0`/`#107896` sent, `#E9E9EB`/`#333333` received, radii TL/BL 10 TR/BR 0 (mirrored), 80 % width, padding 8/12, text 16 — S
- [ ] Composer placeholder "მესიჯი", bg `#e0e0e0`/`#1E1E1E`, send 40 radius 20 ArrowUp 20; presence emit 1000 ms
- [ ] crypto_box send/receive, incoming toasts, force_logout, chat camera upload `/chat/upload-attachment`

## CP11 — Friends

- [ ] ContactSyncSheet 85 %, top inset safe+50, search 36/17, sections (requests "მეგობრობის მოთხოვნები", friends, "იყენებენ", invite) — S
- [ ] Contacts page 30, digit-strip dedupe → `POST /user/check_registered_users`; SMS invite `https://wal.ge/links/{username}`
- [ ] `/friends/request`, `/friends/requests`, `/friends/request/{id}/accept|reject`, `/friends/list`, `/friends/remove/{id}`, `/friends/blocked`; polling intervals from tokens — U/E
- [ ] Block "დაიბლოკა" / unblock "განიბლოკა" toasts, report alert "რეპორტი გამოიგზავნა"

## CP12 — Profile & settings

- [ ] Profile avatar 128, bio 14/20 max 2 lines, bio sheet 45 % / 150 chars, photo sheet 25 % 400×400 JPEG 0.8 → `/upload-photos` → `updateUser` — S/E
- [ ] Settings rows (user_preferences, account, blocked_users if > 0, logout accent), terms/policy links, delete account confirm "ანგარიშის წაშლა"
- [ ] Language selector en 🇺🇸 / ka 🇬🇪 persisted `app-locale`

## CP13 — Camera & create post

- [ ] AVFoundation camera: CONTENT_SPACING 15, capture 78, control 40, max zoom 10, 1080×1920, Video/Photo modes, borders 3.9/7.8, 30 s max / 500 ms min, h264 mp4 — V/E
- [ ] mediapage caption 150, submit 52 `#007AFF`; uploads `/verify-photos/upload-to-location`, `/verify-videos/upload-to-location`, compression 3 Mbps/1920/≥25 MB, UploadingToast
- [ ] create-post modal: 1500 chars, 3 images 112 radius 8 gap 8, publish pill radius 20, `POST /feeds/publish-post` multipart, optimistic prepend + invalidate — E
- [ ] Share Extension → createPost with `sharedContent` / `sharedImages`

## CP14 — Push

- [ ] APNs token → Expo push token (`exp.host/--/api/v2/push/getExpoPushToken`) → `PUT /user/upsert-fcm {expo_push_token}`; `DELETE /user/delete-fcm` on logout — U
- [ ] EnableNotifications flow, NSE verified on device, tap routing per table — E

## CP15 — Hardening

- [ ] Light/dark audit of every screen, Dynamic Type sanity, VoiceOver labels
- [ ] Performance pass (scroll at 60/120 Hz, image cache limits)
- [ ] Final walk-through of this checklist with evidence links; review-log summary; README

## Deviations (intentional differences from the RN app)

| Area | RN behaviour | Native behaviour | Reason |
| --- | --- | --- | --- |
| Friend accept optimistic update | filter compares request object to id (no-op) | filter by `request.id` | RN bug; intended behaviour restored |
| `notify_single_message_seen` | reads `page.data` on infinite pages | reads the page's `messages` array | RN bug (wrong key), messages never marked seen locally |
| Send button colour | compares to `#FFFFFF` while theme bg is `#efefef` | uses theme token | RN bug; intended contrast restored |
| Key storage | AsyncStorage (plaintext) | Keychain | Security; same key names/format |
| Live (LiveKit) | createSpace, scheduleSpace, livestream, LivePulseIcon | routes exist, screens show "not available" | Out of scope by request |
