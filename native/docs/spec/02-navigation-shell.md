# Spec: navigation, shell, providers

Source files analysed: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/(home,user)/_layout.tsx`,
`app/(tabs)/(chat-list)/_layout.tsx`, `app/(chat)/_layout.tsx`, `app/(camera)/_layout.tsx`,
`components/headers/*`, `lib/constants.ts`, `lib/theme.tsx`, `lib/useColorScheme.tsx`,
`hooks/useNotificationObserver.ts`, `lib/queryClient.ts`.

## Provider order (root)

`Sentry.wrap → OnboardingProvider → KeyboardProvider → QueryClientProvider → LightboxStateProvider →
NavigationThemeProvider → ThemeProvider → ToastProviderWithViewport → jotai Provider → AppLocaleGate →
LocationProvider → AuthLayer → GestureHandlerRootView → ShareIntentProvider → Stack`
plus `AppStateHandler`, `StatusBarRenderer`, `Lightbox`, `PortalHost`.

- Navigation theme: dark = `NAV_THEME.dark` with background `#000`; light = `DefaultTheme` with
  background `#efefef`.
- QueryClient defaults: `refetchOnWindowFocus: false`, `structuralSharing: false`, `retry: false`.
- Splash: `expo-splash-screen` duration 1000 ms, fade; hidden once the index gate resolves.
- Colour scheme: system, fallback `dark`; theme context default dark.

## Root stack (`initialRouteName: index`, all `headerShown: false`)

| Screen | Options |
| --- | --- |
| `index` | gate |
| `(auth)` | `animation: fade`, `contentStyle.backgroundColor: #000` |
| `(tabs)` | default |
| `(chat)` | default push |
| `(camera)` | default push |
| `status/[verificationId]` | push, SimpleGoBack header "ფოსტი" |

## Tabs (`app/(tabs)/_layout.tsx`)

- Three tabs, `tabBarShowLabel: false`, `backBehavior: "initialRoute"`, bar background theme
  background, no top border in dark.
- `TAB_COLORS`: active `#FFFFFF` (dark) / `#121212` (light); inactive `#777777` / `#999999`.
- Icons (Ionicons, size 24): home `location` / `location-outline` (focused scale 1.15);
  chat `chatbubble` / `chatbubble-outline`; user `person-circle` (focused scale 1.15).
- Home tab centre icon replaced by `LivePulseIcon` when a live is active (LiveKit — out of scope; the
  native app renders the plain icon).
- User tab `tabPress`: `dismissAll()` then `navigate('/(tabs)/(user)')` → always lands on profile root.
- Tab bar hidden on: feed when the header collapses? **No** — it stays. Hidden on chat room / camera because
  those live outside the tabs navigator.

## Shared `(home,user)` group

Routes that can be pushed on either the home or the user stack: `profile`, `profile-picture`,
`verification/[verificationId]`, `create-post` (modal, `slide_from_bottom`, 200 ms), `fact-checks`.
Expo Router resolves them onto the *active* tab stack; native does the same via the active
`UINavigationController`.

## Presentations (react-native-screens → UIKit)

| RN option | UIKit |
| --- | --- |
| `presentation: modal` + `slide_from_bottom` 200 ms | `modalPresentationStyle = .pageSheet`/`.fullScreen` (create-post: full height, non-dismissable by drag while uploading), custom duration |
| `presentation: formSheet`, `slide_from_bottom` 350 ms | `.formSheet` with `UISheetPresentationController` detents medium/large |
| `animation: fade` | `CATransition` fade, 250 ms |
| `headerTransparent`, `headerBlurEffect` | `UINavigationBarAppearance` transparent + `UIBlurEffect` |

## Headers

- `SimpleGoBackHeader`: height `HEADER_HEIGHT` (= window.height × 0.1, jotai atom), title 18/600 centred,
  chevron-back 28 left, optional right accessory; `withInsets` adds safe area top.
- `ProfileHeader` (feed + user root): collapsible; see home-feed spec.
- `ChatTopbar`: see chat spec.

## Deep links & push routing

- Scheme `wal://`, universal links `https://wal.ge/status/{verificationId}` → `status`,
  `https://wal.ge/links/{username}` → resolve via `GET /user/profile/username/{username}` → `profile(userId)`.
- `useNotificationObserver` → `handleNotificationNavigation(data)` evaluated in order:
  1. `type == poke` && `verificationId` → `verification`
  2. `type == new_message` && `roomId` → `chatRoom`
  3. `feedId` → `feed`
  4. `type == verification_like` && `verificationId` → `status`
  5. `type == friend_request_sent` → `chatList`
- Cold-start taps are replayed after the tabs mount (`lastNotificationResponse`).

## Status bar

`StatusBarRenderer`: style `light` on dark theme, `dark` on light, except camera / lightbox (always light)
and hidden while the lightbox is open.
