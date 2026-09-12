# Spec: home feed, feed item, post detail, lightbox

Source files analysed: `app/(tabs)/(home)/index.tsx`, `app/(tabs)/(home)/[feedId].tsx`,
`app/(tabs)/(home)/locations.tsx`, `components/feed/*` (FeedList, FeedItem, FeedActions, FeedMedia,
NewsCardItem, HorizontalAnonList, ContentTypeTabs, SearchOverlay, FAB), `components/headers/ProfileHeader.tsx`,
`components/ui/FactualityBadge.tsx`, `components/ui/FactCheckBox.tsx`, `components/FactualityCircle.tsx`,
`components/ExpandableText.tsx`, `app/(tabs)/(home,user)/verification/[verificationId].tsx`,
`app/status/[verificationId].tsx`, `components/comments/*`, `lib/lightbox/*`, `lib/reactionsOverlay/*`,
`hooks/useFeed*.ts`, `hooks/useLike*.ts`, `lib/constants.ts`.

## Home root

- `/(tabs)/(home)` redirects to `/(tabs)/(home)/{user.preferred_news_feed_id}`.
- Feed screen `[feedId]`: `animation: fade`, `ProfileHeader` with tabs (`headerShowTabs`).

## Collapsing header (`ProfileHeader`)

- `mode ∈ [0,1]` driven by scroll offset; `opacity = (1 - mode)^2`, `translateY = -headerHeight * mode`.
- Spring with `overshootClamping: true`; snaps open/closed when scroll stops; visible threshold from
  `Tokens.Metrics.headerCollapseVisibleThreshold`.
- Contains: feed title (20/700), location subtitle (13 secondary), search icon (opens `SearchOverlay`),
  `ContentTypeTabs` (`ContentTypeFilter`: `last24h`, `youtube_only`, `social_media_only`,
  `with_image_and_high_score`), `HorizontalAnonList` (anon items 56 wide, gap 12).

## Feed list

- `GET /feeds/{feed_id}/posts?page=N&page_size=10[&content_type=…]` infinite query, page-number based.
- FlatList: `initialNumToRender 2`, `windowSize 6`, `onEndReachedThreshold 0.5`, `removeClippedSubviews`,
  pull-to-refresh (`RefreshControl`, theme text colour), footer spinner while fetching next page,
  `ListEmptyComponent` with skeletons (3 cards) on first load.
- Video autoplay: item ≥ 50 % visible for 250 ms (`videoVisibilityPercent`, `videoMinimumViewTimeMs`);
  only one plays; muted by default, tap toggles sound.
- Impressions: `POST /feeds/impressions` batched, per-post cooldown 60 s.
- FAB: 56 circle, icon 28, bottom 24 above tab bar, right 16; opens camera `record?feedId=`.
- Locations sheet: `presentation: formSheet`, `slide_from_bottom` 350 ms; lists
  `GET /feeds/locations` with headers `x-user-location-latitude/longitude` and query `category_id`;
  response `{feeds_at_location, nearest_feeds}`; tap → `router.replace(feed(feedId))`.

## FeedItem card

- Background `feedItem.background`, bottom border `feedItem.border` 1 px, padding 12 / 16.
- Header: `UserAvatar` 50 (radius 35 incl. 3 padding + 2 border), name 15/600, `@username` and relative
  time 15 `feedItem.secondaryText`, kebab menu (own post: delete; others: report).
- Text: `ExpandableText` 16/22, limit **250 chars**, expander label "მეტი" in primary.
- Media: one image → 4:5 max, radius 12; two → side by side gap 4; three → 1 + 2 grid; video → 9:16
  player with mute button 32 bottom-right; link preview card (image 16:9, title 15/600, host 13).
- `FeedActions` row: heart 27 (large variant 30), colour `#ff3b30` when liked, otherwise
  `feedItem.text`; like count 14; comment icon 20 (large 23) + count; share icon 22.
- Like animation: scale 1 → 1.1 → 0.9 → 1 spring (`stiffness 300, damping 15`), haptic
  `impactAsync(Medium)`.
- Like mutation: `POST /feeds/verifications/{id}/like` / `DELETE …/like`; optimistic
  `setQueryData` on every cached infinite feed page + the single-post query (toggle `is_liked`,
  `likes_count ± 1`); on settle `invalidateQueries` for the feed list and the post.
- NewsCardItem (generated news): title 17/700, source row with favicon 16, `FactualityBadge`, sources
  button opens `NewsSourcesSheet` (50 %).

## Fact checking UI

- `FactualityBadge` thresholds: truth ≥ 0.75, needsContext ≥ 0.5, else misleading; palette in
  `Tokens.Factuality.Badge`.
- `FactCheckBox` statuses: verified ≥ 0.75 `#10b981`, needsContext ≥ 0.5 `#1877F2`, misleading ≥ 0.25
  `#ff6666`, else falseHarmful `#FF0000`; backgrounds use alpha suffixes `33/26` dark, `59/40` light,
  borders `40/80`; light-mode text overrides `#008c5f`, `#0057c2`.
- `FactualityCircle`: rendered only when score > 0.7; ≥ 0.7 green `#22c55e`, ≥ 0.4 amber `#f59e0b`,
  else red `#ef4444`; track `#374151`; size 40, r 16, stroke 3, label 11/700.
- `FactCheckSheet` (70 %): rating stars, references list, `GET /fact-checks/{id}`,
  `GET /fact-checks/{id}/ratings-count`, `POST /fact-checks/{id}/rate`.

## Post detail (`verification/[verificationId]`, `status/[verificationId]`)

- Header `SimpleGoBackPost` (title "ფოსტი", share right accessory).
- `PostHeader` = FeedItem in large variant; markdown body (`react-native-markdown-display`) with theme
  colours, links in primary.
- `CommentsList`: `GET /feeds/verifications/{id}/comments?page&page_size=10`, newest first, avatar 32,
  name 14/600, body 15/20, time 12 secondary, separators `rgba(31,41,55,0.5)` dark /
  `rgba(229,231,235,0.8)` light; long-press → reactions overlay.
- Reactions: `ReactionType` love / laugh / wow / sad / dislike (angry & like exist in the enum, unused);
  `TOP_REACTIONS` order love, sad, wow, dislike; popup radius 28, buttons 36, emoji font 22;
  `POST /comments/{id}/reactions`, `DELETE …`; counts shown as emoji + number 12.
- `CommentInput`: multiline max height 120, 1000 chars, placeholder from locale, radius 20, send
  button 36 primary (disabled while empty); `focusComment` param autofocuses; posting
  `POST /feeds/verifications/{id}/comments` → optimistic insert with temp id, then invalidate.
- Menu: own comment → delete (`DELETE /comments/{id}`); others → report; tagging `@username` with
  autocomplete from friends (`CommentTag`).

## Lightbox (`lib/lightbox`)

- Open transition 200 ms from the tapped image frame; dismiss on vertical drag with fly-away 150 ms
  when velocity > 200 or offset > 150; pinch zoom 1–2 (double-tap toggles); pan with decay
  (`velocityFactor 200`), springs `stiffness 700, damping 50`.
- Header: close 28 left, index "n / m" centre; footer: caption 14, share; both fade with drag progress.
- Status bar hidden; landscape allowed only inside the lightbox.
