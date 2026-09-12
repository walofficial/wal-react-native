# Spec: push notifications, location, app state, misc services

Source files analysed: `hooks/useNotifications.ts`, `components/EnableNotifications.tsx`,
`hooks/useNotificationObserver.ts`, `targets/notification-service/*`, `lib/context/LocationProvider.tsx`,
`components/AppStateHandler.tsx`, `lib/analytics.ts`, `lib/device-id.ts`, `lib/haptics.ts`,
`lib/clipboard.ts`, `lib/share.ts`, `lib/app-info.ts`.

## Push registration

- Expo push tokens (`Notifications.getExpoPushTokenAsync({projectId})`). Native equivalent: obtain the APNs
  device token and exchange it at `POST https://exp.host/--/api/v2/push/getExpoPushToken`
  `{type:"apns", deviceId, development, appId, deviceToken, projectId: a9de94ea-576e-4767-ae3f-085bfe155f96}`
  so the backend contract stays `PUT /user/upsert-fcm {expo_push_token}`.
- Register after login and on every cold start when permission is granted; `DELETE /user/delete-fcm` on
  logout; `GET /user/get-fcm` used by settings to show the enabled state.
- `EnableNotifications` card (user preferences + first chat open): explains, requests permission
  (`provisional: false`, alert+badge+sound), on denial links to Settings.
- Foreground presentation: show banner + sound (`shouldShowAlert: true`), badge untouched.
- Android channel `default` (n/a on iOS).

## Notification Service Extension

Ported verbatim (`native/ios/WALNotificationService/NotificationService.swift`):
- image attachment from `data.body._richContent.image`, `data.body.richContent.image`, `data.mediaUrl`,
  `senderAvatarUrl`, top-level `richContent.image`, `mediaUrl`, `body._richContent.image`;
- Communication Notification upgrade (`INSendMessageIntent`, sender avatar) when
  `roomId|conversationId`, `senderId|authorId`, `senderDisplayName|senderName` are present;
- `serviceExtensionTimeWillExpire` delivers best attempt.
Entitlements: `com.apple.developer.usernotifications.communication`, app group; `NSUserActivityTypes`
includes `INSendMessageIntent`.

## Location

- `LocationProvider`: `requestForegroundPermissionsAsync` lazily when the locations sheet or camera opens;
  `getCurrentPositionAsync({accuracy: Balanced})`, cached 5 min; exposes `{latitude, longitude, status}`.
- Headers `x-user-location-latitude` / `x-user-location-longitude` are attached only to
  `GET /feeds/locations`. `PUT /user/location` posts coordinates after login when permitted.
- No background location (`isIosBackgroundLocationEnabled: false`).

## App state

- `AppStateHandler`: on `active` → reconnect socket, refetch current user, replay pending share intent /
  notification; on `background` → disconnect socket after 5 s.
- Query defaults mean nothing refetches on focus by itself; screens call `refetch` explicitly where the RN
  code does (chat list, friend requests).

## Misc services

- `device-id`: UUID generated once, stored `device_id` (→ Keychain) — part of socket auth.
- `haptics`: `impactAsync(Light)` taps, `Medium` like, `notificationAsync(Success/Error)` after
  mutations.
- `clipboard`: copy username / link with toast "კოპირებულია".
- `share`: `Share.share({url: https://wal.ge/status/{id}})` for posts, `/links/{username}` for profiles.
- `analytics`: Sentry only (no product analytics); native uses `sentry-cocoa` with the same DSN env.
- `app-info`: version from `package.json` (1.0.33) shown in settings footer; native reads
  `CFBundleShortVersionString` (kept in sync via `MARKETING_VERSION`).
