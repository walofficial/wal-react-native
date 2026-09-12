# Spec: camera, media page, uploads, create post, share intent

Source files analysed: `app/(camera)/record.tsx`, `app/(camera)/mediapage.tsx`,
`app/(tabs)/(home,user)/create-post.tsx`, `components/camera/*` (CaptureButton, ModeSwitcher,
ZoomControls), `lib/media/*` (compression, upload), `components/UploadingToast.tsx`,
`hooks/usePublishPost.ts`, `hooks/useShareIntent*.ts`, `lib/constants.ts`.

## Camera (`record`)

- Params: `feedId?`, `chatMode?`, `roomId?`, `recipientId?`.
- Constants: `CONTENT_SPACING 15`, `CAPTURE_BUTTON_SIZE 78`, `CONTROL_BUTTON_SIZE 40`,
  `MAX_ZOOM_FACTOR 10`, format 1080×1920 @30 fps, `videoCodec h264`, container mp4, audio on.
- Modes: Video (default) / Photo (/ LIVE — LiveKit, out of scope: mode shown disabled).
- Capture button: outer ring border **3.9** in video mode, **7.8** in photo mode; press → photo;
  long-press / tap in video mode → record with red progress ring; max **30 000 ms** auto-stop,
  min **500 ms** (shorter discards); timer 00:SS 16/600 above.
- Controls (40): close ×, flip camera, flash (photo only), pinch zoom 1–10 with slider on right,
  gallery picker bottom-left (`expo-image-picker`, videos ≤ 30 s).
- Permissions: camera + microphone requested on mount; denied → explanatory view with settings link.
- Result → `mediaPage(path, type, feedId?, chatMode?, roomId?, recipientId?)`.

## Media page (`mediapage`)

- Full-screen preview (video loops muted with sound toggle), close ×, caption input max **150**
  chars with counter, keyboard-avoiding.
- Submit button height 52, bg `#007AFF`, text white 17/600, radius 12; disabled while submitting.
- `chatMode`: upload via `POST /chat/upload-attachment` then send as encrypted image/video message and
  pop back to the room.
- Otherwise: dismiss the camera stack immediately and show `UploadingToast` (progress bar, thumbnail 40)
  at the top while uploading in the background:
  - photo → `POST /verify-photos/upload-to-location` multipart `photo_file`, `feed_id`
  - video → `POST /verify-videos/upload-to-location` multipart `video_file`, query
    `feed_id`, `recording_time`, `text_content`
- Compression before upload (`react-native-compressor`): video bitrate 3 Mbps, max dimension 1920,
  only when file ≥ 25 MB; photo max 2000×2000 / 1 MB (`POST_IMG_MAX`).
- Success → invalidate the feed queries; toast "გამოქვეყნდა"; failure toast with retry.

## Create post (`create-post`, modal)

- Params: `feedId`, `contentType?`, `disableImagePicker?`, `sharedContent?`, `sharedImages?`.
- Sheet-style modal (`slide_from_bottom` 200 ms), header: cancel × left, title from locale, publish pill
  right (radius 20, primary bg, text 15/600, disabled until text or image present).
- Text area 17/24, placeholder from locale, max **1500** chars, counter appears after 1400.
- Image picker row: up to **3** images, cells 112×112 radius 8 gap 8 with × remove badge 20; `+` cell.
- Publish: `POST /feeds/publish-post` multipart `feed_id`, `content`, `files[]` →
  `LocationFeedPost`; optimistic prepend to page 0 of the feed infinite query (all content filters),
  then `invalidateQueries` for the feed; dismiss on success; error keeps the modal with toast.
- Supported MIME types: `SUPPORTED_MIME_TYPES` (jpeg, png, heic, webp, mp4, mov).

## Share intent (expo-share-intent)

- Activation rules: web URL (1), web page (1), text, images (≤ 10).
- App group payload key `ShareKey`; host opened via `wal://dataUrl=ShareKey`.
- `ShareIntentProvider` reads the payload on foreground; if signed in navigates to
  `createPost(feedId: preferred_news_feed_id, sharedContent, sharedImages)`, else stores it until after
  login.
