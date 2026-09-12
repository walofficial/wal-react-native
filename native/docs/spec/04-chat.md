# Spec: chat list, chat room, E2E crypto, sockets

Source files analysed: `app/(tabs)/(chat-list)/*`, `app/(chat)/[roomId]/*`, `components/chat/*`
(ChatItem, ChatFriendsStories, ChatTopbar, MessageBubble, Composer, ChatImage), `lib/chat/*`,
`lib/services/ProtocolService.ts`, `lib/services/SocketService.ts`, `hooks/useChat*.ts`,
`hooks/useMessages.ts`, `lib/state/chat*.ts`.

## Chat list

- Header: `SimpleGoBack` without back, title "ჩათი", right accessory `add-circle` 40 → opens
  `ContactSyncSheet` (friends spec).
- `ChatFriendsStories`: horizontal row, item width 72, spacing 12, avatar 60; pending friend requests
  render first as chips (avatar 40 in 48 ring with primary border) — tap accepts/rejects via alert.
- `ChatItem`: avatar 60, name 20/600, preview 15 secondary single line, timestamp 13 secondary right:
  `"Now"` < 1 min, `"{n}m"` < 60 min, `"{n}h"` < 24 h, weekday short < 7 d, else `M/D`.
  **No unread badge, no typing indicator** (parity: RN has none).
- Data: `GET /chat/rooms?page&page_size=15` infinite; previews are decrypted client-side
  (`fetchDecryptedChatRooms.ts`) using `remote_key_{otherUserId}`; failures show
  "🔒 Encrypted message".
- Pull-to-refresh; empty state icon `chatbubbles-outline` 64 + locale text.
- Prefetch: on item press the first page of messages is prefetched before push (`joinChat`), which also
  emits `check_user_connection` and requests `user_public_key` if missing.

## Chat room (`[roomId]`)

- `ChatTopbar`: back chevron 28, avatar 40 with **online dot 12 `#22c55e`** (border 2 background),
  name 24/600 (tap → `chatProfile`), kebab → action sheet title "რა გსურთ?" with "უჯიკე" (poke),
  "მეგობრად დამატება" / "მეგობრის წაშლა" depending on friendship, "დაბლოკვა", "რეპორტი".
- Presence: emit `check_user_connection {userId}` every **1000 ms** while the room is open; server
  answers `user_connection_status {userId, isOnline}`.
- Messages: `GET /chat/rooms/{room_id}/messages?cursor&limit=15` infinite (cursor based), inverted list,
  `onEndReachedThreshold 0.3`, auto-scroll to bottom when within 100 px (`chatAutoScrollDistance`),
  date separators 12 secondary.
- `MessageBubble`: max width 80 %, padding 8 vertical / 12 horizontal, radius 10 with the tail corner 0:
  sent → TL/BL 10, TR/BR 0, bg `#3A76F0` (dark) / `#107896` (light), text white 16;
  received → TR/BR 10, TL/BL 0, bg `#333333` (dark) / `#E9E9EB` (light), text theme text 16.
  Time 11 inside bubble bottom-right; "seen" check when `state == READ`.
- Images: `chatImageMaxWidthPercent 70`, max height 300, radius 12, tap → lightbox; uploaded through
  `POST /chat/upload-attachment` (multipart `file`) then sent as an encrypted message whose plaintext is
  the JSON `{type:"image", url, width, height}`.
- Composer: bg `#1E1E1E` dark / `#e0e0e0` light, radius 20, max height 180, placeholder "მესიჯი",
  camera icon 24 left (opens `record?chatMode=true&roomId&recipientId`), send button 40 circle radius 20
  primary with `ArrowUp` 20; send disabled while empty. Haptic light on send.
- Sending flow: encrypt → optimistic append (`state: SENT`, temp id) → `socket.emit('private_message',
  {roomId, recipientId, encryptedContent, nonce, messageType, clientMessageId})` → ack replaces temp id;
  failure marks `FAILED` with retry on tap.
- Incoming `private_message` while in another screen → toast (avatar 32, name 14/600, preview 13) tapping
  navigates to the room. `notify_single_message_seen {messageId}` updates state to `READ`.
- `force_logout` event → clear session and navigate to sign-in.

## Socket.IO

- URL = API base; transports `['websocket']` only; `auth: {userId, publicKey, deviceId}`;
  heartbeat emit every 25 s; `reconnectionAttempts 10`, `reconnectionDelay 1000`.
- Connect on app foreground when a session exists; disconnect on background after 5 s.
- Events consumed: `private_message`, `user_connection_status`, `user_public_key`,
  `notify_single_message_seen`, `force_logout`. Emitted: `private_message`, `check_user_connection`,
  `heartbeat`, `join_room`, `message_seen`.
- `user_public_key {userId, publicKey}` → `storeRemotePublicKey` (`remote_key_{userId}`).

## Crypto (ProtocolService)

- libsodium `crypto_box_easy` / `crypto_box_open_easy` (X25519 + XSalsa20-Poly1305), 24-byte random nonce.
- Base64 variant **URLSAFE_NO_PADDING** (react-native-libsodium default) for keys, nonce, ciphertext.
- Key pair generated on first launch, stored as `user_keys_v2` `{publicKey, privateKey, registrationId
  ∈ [1,16383]}`; public key is uploaded with the socket auth payload and `PUT /user/update {public_key}`.
- Decrypt failures are non-fatal (preview shows the lock placeholder).

## Dead / deliberately absent behaviour kept for parity

- `assets/sounds/message_sent.mp3` is bundled but never played.
- No read receipts in the list, no typing indicator, no message deletion UI (state `DELETED` is rendered
  as "message deleted" if the server sends it).
- Friend-request "cancel" has no API; the UI does not offer it.
