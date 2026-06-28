# Haus integration contract (WAL)

## Booking statuses (`haus_bookings.status`)

Aligned with `wal-server` `ment_api/models/haus.py` enum `HausBookingStatus`:

| Value | Meaning |
| --- | --- |
| `requested` | Reserved for future use (MVP uses `payment_pending` after join). |
| `payment_pending` | Guest should transfer and upload proof. |
| `proof_uploaded` | Host should review proof. |
| `approved` | Guest can fetch QR ticket (when time window allows). |
| `rejected` | Host declined. |
| `waitlisted` | Event was full at request; host can approve when space opens. |
| `checked_in` | Host scanned / submitted ticket at door. |

## Expo push `data` payload

All Haus pushes include:

- `type`: one of `haus_join_request`, `haus_payment_proof`, `haus_booking_approved`, `haus_booking_rejected`, `haus_checked_in`
- `bookingId`: Mongo id string
- `eventId`: Mongo id string
- `houseId`: Mongo id string

Mobile routing (`useNotificationHandler`):

- `haus_join_request`, `haus_payment_proof` → Host inbox (`/(tabs)/(haus)/host-queue`)
- `haus_booking_approved`, `haus_booking_rejected`, `haus_checked_in` → Event detail (`/(tabs)/(haus)/event/[eventId]`)

## In-app notifications

`NotificationType` includes matching `haus_*` values; documents may set `haus_booking_id`, `haus_event_id`, `haus_house_id` (ObjectIds).

Unread badge count (`GET /notifications/unread-count`) includes Haus types.

## REST surface (`/haus/*`)

See `wal-server` `ment_api/routes/haus.py` for authoritative paths and bodies.

After changing routes, regenerate the OpenAPI client in this app:

`npm run generate:api` (server must expose `openapi.json`).

Until then, the hand-written client in `lib/haus/api.ts` is the source of truth for the app.
