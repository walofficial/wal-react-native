# Spec: friends & contacts, profile, settings

Source files analysed: `components/friends/ContactSyncSheet.tsx`, `hooks/useFriends*.ts`,
`hooks/useContacts.ts`, `app/(tabs)/(home,user)/profile.tsx`, `app/(tabs)/(home,user)/profile-picture.tsx`,
`app/(tabs)/(user)/*` (index, settings, profile-settings, user-preferences, blocked-users),
`components/profile/*` (ProfileHeaderCard, BioEditorSheet, ProfilePhotoEditSheet, PostsGrid),
`components/settings/*`, `lib/share.ts`.

## ContactSyncSheet (snap 85 %)

- Top inset = safe area + 50; drag handle; search field height 36, font 17, bg card, radius 10,
  debounce 500 ms (`searchDebounceMs`).
- Sections in order:
  1. "მეგობრობის მოთხოვნები" — `GET /friends/requests` (polled every 30 s while open); row avatar 50,
     name 16/600, accept (primary pill) / reject (secondary) buttons 32 high.
  2. Friends — `GET /friends/list` (polled every 10 s); row → open chat (`POST /chat/create-chat-room` if none);
     long-press / kebab → "მეგობრის წაშლა" (`DELETE /friends/remove/{id}`), block, report.
  3. "იყენებენ" (contacts already on WAL) — from `POST /user/check_registered_users {phone_numbers}`;
     row has "მოთხოვნა" button → `POST /friends/request {target_user_id}`; state pending shows
     "გაგზავნილია" disabled.
  4. Contacts to invite — remaining contacts; button "მოწვევა" opens SMS with
     `https://wal.ge/links/{myUsername}`.
- Contacts fetch: `expo-contacts` pages of 30, phone numbers digit-stripped (`replace(/\D/g,'')`),
  deduped, national numbers prefixed with the default country code; permission denied → explanatory
  empty state with "Open settings".
- Search filters all sections by name/username/phone.

## Friend endpoints

| Action | Endpoint |
| --- | --- |
| send request | `POST /friends/request` `{target_user_id}` |
| list incoming | `GET /friends/requests` |
| accept / reject | `PUT /friends/request/{request_id}/accept` / `…/reject` |
| friends | `GET /friends/list` |
| remove | `DELETE /friends/remove/{friend_id}` |
| blocked | `GET /friends/blocked` |
| block / unblock | `POST /user/block/{target_id}` / `POST /user/unblock/{target_id}` |
| report | `POST /user/report/{target_id}` body `{target_id}` (hey-api generated `path?: never` — RN and native both send the literal `{target_id}` unless we deviate; see CHECKLIST) |

Optimistic updates: accept removes the request from the `friends/requests` cache and appends to
`friends/list`; remove filters `friends/list`; block filters friends + rooms. Toasts: block → "დაიბლოკა",
unblock → "განიბლოკა"; report → `Alert` "რეპორტი გამოიგზავნა". Block confirm text
`common.confirm_block_user` with `{{username}}`.

## Profile (`profile?userId=`)

- Header `ProfilePageUsername` (title `@username`, kebab: block/report or, for self, settings).
- `ProfileHeaderCard`: avatar **128** (tap → `profilePicture`), display name 22/700, username 15
  secondary, bio 14/20 max 2 lines with "მეტი" expander, stats row (posts / friends) 15,
  action button: self → "რედაქტირება", other → chat (`chatbubble-outline`) + friend state button
  (add / pending / friends) 40 high pill.
- Data: `GET /user/profile/{user_id}` (`ProfileInformationResponse`), posts grid
  `GET /user/get-verifications` 3 columns gap 2 square thumbnails with play icon for videos.
- `profilePicture`: black screen, image `contentFit: contain`, header SimpleGoBack "ფოტო", for self
  a "შეცვლა" button → `ProfilePhotoEditSheet`.

## User tab root (`/(tabs)/(user)`)

Same as profile for `user.id`, header title "პროფილი", right accessory settings gear 24 → `settings`.

## Sheets

- `BioEditorSheet` (45 %): multiline 150 chars with counter `n/150`, save → `PUT /user/update {bio}`,
  invalidate current user + profile.
- `ProfilePhotoEditSheet` (25 %): rows "კამერა", "გალერეა", "წაშლა" (if photo). Picker crops square,
  resized to **400×400 JPEG quality 0.8** → `POST /upload-photos` (multipart `files`) → `PUT /user/update
  {photos:[url]}` → invalidate.

## Settings hub (`settings`)

Header title `common.settings`. Rows (icon 22, label 16, chevron):
`settings.user_preferences` → `userPreferences`; `settings.account` → `profileSettings`;
`settings.blocked_users` (only when count > 0) → `blockedUsers`; links `https://greetai.co/terms`,
`https://greetai.co/privacy`; version footer `v{version}`; **logout** row in accent colour with confirm.

- `profileSettings`: username / DOB / gender editors (same validators as register), phone read-only,
  "ანგარიშის წაშლა" destructive row → confirm → `DELETE /user/delete`.
- `userPreferences`: preferred news feed & fact-check feed pickers
  (`GET /feeds/all`, `PUT /user/update {preferred_news_feed_id, preferred_fact_check_feed_id}`),
  preferred content language, notifications toggle (`EnableNotifications` flow), language selector
  (en 🇺🇸 / ka 🇬🇪) → `setLocale` + persist `app-locale` + `Accept-Language` header updates.
- `blockedUsers`: header title "დაბლოკილი"; list `GET /friends/blocked`, row avatar 50, name 16,
  "განბლოკვა" button → unblock.
