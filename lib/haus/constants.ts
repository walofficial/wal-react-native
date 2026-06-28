/**
 * Haus booking state machine + push notification `data.type` values.
 * Keep in sync with wal-server: ment_api/models/haus.py + haus routes push payloads.
 */
export const HausBookingStatus = {
  REQUESTED: 'requested',
  PAYMENT_PENDING: 'payment_pending',
  PROOF_UPLOADED: 'proof_uploaded',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  WAITLISTED: 'waitlisted',
  CHECKED_IN: 'checked_in',
} as const;

export type HausBookingStatusType =
  (typeof HausBookingStatus)[keyof typeof HausBookingStatus];

/** Expo push `data.type` for deep linking */
export const HausPushType = {
  JOIN_REQUEST: 'haus_join_request',
  PAYMENT_PROOF: 'haus_payment_proof',
  BOOKING_APPROVED: 'haus_booking_approved',
  BOOKING_REJECTED: 'haus_booking_rejected',
  CHECKED_IN: 'haus_checked_in',
} as const;

export const hausQueryKeys = {
  profile: ['haus', 'profile'] as const,
  houses: ['haus', 'houses'] as const,
  events: (houseId?: string) => ['haus', 'events', houseId ?? 'all'] as const,
  eventDetail: (eventId: string) => ['haus', 'event', eventId] as const,
  myBookings: ['haus', 'bookings', 'me'] as const,
  hostIncoming: ['haus', 'host', 'incoming'] as const,
  ticket: (bookingId: string) => ['haus', 'ticket', bookingId] as const,
};
