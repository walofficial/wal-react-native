# Spec: authentication & registration

Source files analysed: `app/index.tsx`, `app/(auth)/_layout.tsx`, `app/(auth)/sign-in.tsx`,
`app/(auth)/register.tsx`, `components/auth/*` (LoginSheet, PhoneInput, OtpInput, CountryPicker),
`lib/supabase.ts`, `lib/phoneValidation.ts`, `lib/countries.ts`, `lib/api/config.ts`,
`app/(tabs)/_layout.tsx` (gating), `components/AuthLayer.tsx`.

## Session & gating

- Supabase phone OTP. `signInWithOtp({ phone })`, then `verifyOtp({ phone, token, type: 'sms' })`.
  OTP is 6 digits; resend allowed after a 10 s countdown ("Wait {{timer}} seconds").
- Access token is sent as `Authorization: Bearer <jwt>`; anonymous requests carry `x-is-anonymous: true`.
  On 401 the client re-reads the Supabase session and retries **once**.
- `app/index.tsx` redirect gate:
  - session present **and** `user.preferred_news_feed_id` → `/(tabs)/(home)`
  - user query loading → splash (black, 200 pt icon)
  - otherwise → `/(auth)/sign-in`
- `app/(tabs)/_layout.tsx`: no session → sign-in; `userIsLoading` → `FullScreenLoader`;
  `!isUserRegistered(user)` (`!!date_of_birth && !!gender`) → `/(auth)/register`.
- `AuthLayer` subscribes to Supabase auth state; `SIGNED_OUT` clears react-query cache, `user_keys_v2`,
  remote keys and navigates to sign-in. Logout also calls `DELETE /user/delete-fcm`.
- Auth stack: `presentation: fade`, black background, `headerShown: false`.

## Landing page (`sign-in.tsx`)

- Full-screen background video: DASH `https://cdn.wal.ge/video-verifications/transcoded/f2897541-6768-4ae2-ab28-1894d3e96e5f/manifest.mpd`, muted, looping, `contentFit: cover`.
- Title "WAL" 36 / bold / white. Subtitle from locale.
- CTA button: background `#efefef`, text `#000`, radius 12, padding 16, full width minus 24 horizontal;
  opens the login sheet.
- Language toggle (en 🇺🇸 / ka 🇬🇪) persisted under `app-locale`.

## Login sheet (Gorhom, snap 45 %)

- Backdrop appears on index 0; blur intensity 60 dark / 40 light; handle 40×4.
- Phone input container: bg `#222` (dark) / `#f8f8f8` (light), radius 8, minHeight 56, padding 12.
- Country picker: flag `https://flagcdn.com/w80/{iso}.png` at 24×18, dial code text 16, chevron.
  Default country GE (+995). Per-country national number lengths from `lib/phoneValidation.ts`
  (GE 9, US 10, FR 9, …); submit disabled until valid. Helper text
  "Enter without {{countryCode}}".
- Sending state shows an `ActivityIndicator` in the button; errors surface as toast.
- OTP step: 6 cells 44×52 radius 8, border `#333`/`#ddd`, **focused border `#004cb0`**, text 20/600,
  auto-advance, paste fills all, auto-submit on 6th digit; resend link disabled for 10 s.

## Register (`register.tsx`)

- Header: SimpleGoBack, title "რეგისტრაცია", **back = logout** (`headerLogoutOnBack`), header with insets.
- Username field: 3–20 chars `[a-z0-9_.]`, availability check `GET /user/check-username/{username}`
  debounced 500 ms. Border default `#737373` (dark) / `#d1d5db` (light), invalid `#ef4444`, checking
  `#3b82f6`, valid green `#22c55e`. Inline status text 12.
- Gender segmented control (male / female / other) using theme primary.
- Date of birth: button 58 high, radius 12, default **01/02/2000**, min **1940-02-01**,
  max **today − 12 years**, native date picker in a sheet.
- Submit `PUT /user/update` with `{ username, date_of_birth (YYYY-MM-DD), gender }`, then invalidate the
  current-user query; navigation falls out of the tabs gate.
- Delete account (settings): confirm alert "ანგარიშის წაშლა" → `DELETE /user/delete` → logout.

## Storage keys

| Key | Store | Content |
| --- | --- | --- |
| `sb-<ref>-auth-token` | AsyncStorage (→ Keychain) | Supabase session |
| `user_keys_v2` | AsyncStorage (→ Keychain) | `{publicKey, privateKey, registrationId}` base64url |
| `remote_key_{userId}` | AsyncStorage (→ Keychain) | `{publicKey}` |
| `app-locale` | AsyncStorage (→ UserDefaults) | `en` / `ka` |
| `API_BASE_URL_OVERRIDE` | AsyncStorage (→ UserDefaults) | dev override |
