import { client } from '@/lib/api/generated/client.gen';
import { uploadUserPhotos } from '@/lib/api/generated/sdk.gen';
import { formDataBodySerializer } from '@/lib/utils/form-data';
import type { HausBookingStatusType } from './constants';

export type HausProfile = {
  external_user_id: string;
  invite_code: string;
  instagram_handle: string;
  age_confirmed: boolean;
  is_host: boolean;
  completed_at: string;
};

export type HausProfileGetResponse =
  | { completed: false }
  | { completed: true; profile: HausProfile };

export type HausHouse = {
  id: string;
  host_external_user_id: string;
  title: string;
  neighborhood: string;
  vibe_tag: string;
  capacity: number;
  payment_instructions: string;
  image_urls: string[];
  bathroom_note?: string | null;
  created_at: string;
};

export type HausEvent = {
  id: string;
  house_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  price_gel: number;
  spots_total: number;
  spots_taken: number;
  midnight_drop_percent: number;
  qr_activate_hours_before: number;
  created_at: string;
};

export type HausBooking = {
  id: string;
  event_id: string;
  guest_external_user_id: string;
  status: HausBookingStatusType;
  booking_code: string;
  payment_proof_url?: string | null;
  created_at: string;
  updated_at: string;
};

export type HausEventDetail = {
  event: HausEvent;
  house: HausHouse;
};

export type HausHostIncomingRow = {
  booking: HausBooking;
  event: HausEvent;
  house: HausHouse | null;
  guest_username?: string | null;
};

export type HausTicket = {
  token?: string | null;
  active: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  message?: string | null;
};

export async function hausGetProfile(): Promise<HausProfileGetResponse> {
  const { data } = await client.instance.get<HausProfileGetResponse>(
    '/haus/profile',
  );
  return data;
}

export async function hausUpsertProfile(body: {
  invite_code: string;
  instagram_handle: string;
  age_confirmed: boolean;
}): Promise<HausProfile> {
  const { data } = await client.instance.put<HausProfile>('/haus/profile', body);
  return data;
}

export async function hausListHouses(): Promise<HausHouse[]> {
  const { data } = await client.instance.get<HausHouse[]>('/haus/houses');
  return data;
}

export async function hausGetHouse(houseId: string): Promise<HausHouse> {
  const { data } = await client.instance.get<HausHouse>(
    `/haus/houses/${houseId}`,
  );
  return data;
}

export async function hausListEvents(houseId?: string): Promise<HausEvent[]> {
  const { data } = await client.instance.get<HausEvent[]>('/haus/events', {
    params: houseId ? { house_id: houseId } : undefined,
  });
  return data;
}

export async function hausGetEventDetail(
  eventId: string,
): Promise<HausEventDetail> {
  const { data } = await client.instance.get<HausEventDetail>(
    `/haus/events/${eventId}`,
  );
  return data;
}

export async function hausRequestJoin(eventId: string): Promise<HausBooking> {
  const { data } = await client.instance.post<HausBooking>(
    `/haus/events/${eventId}/request`,
  );
  return data;
}

export async function hausUploadProof(
  bookingId: string,
  proofImageUrl: string,
): Promise<HausBooking> {
  const { data } = await client.instance.post<HausBooking>(
    `/haus/bookings/${bookingId}/proof`,
    { proof_image_url: proofImageUrl },
  );
  return data;
}

export async function hausMyBookings(): Promise<HausBooking[]> {
  const { data } = await client.instance.get<HausBooking[]>(
    '/haus/bookings/me',
  );
  return data;
}

export async function hausHostIncoming(): Promise<HausHostIncomingRow[]> {
  const { data } = await client.instance.get<HausHostIncomingRow[]>(
    '/haus/host/incoming',
  );
  return data;
}

export async function hausApproveBooking(bookingId: string): Promise<HausBooking> {
  const { data } = await client.instance.post<HausBooking>(
    `/haus/bookings/${bookingId}/approve`,
  );
  return data;
}

export async function hausRejectBooking(bookingId: string): Promise<HausBooking> {
  const { data } = await client.instance.post<HausBooking>(
    `/haus/bookings/${bookingId}/reject`,
  );
  return data;
}

export async function hausGetTicket(bookingId: string): Promise<HausTicket> {
  const { data } = await client.instance.get<HausTicket>(
    `/haus/bookings/${bookingId}/ticket`,
  );
  return data;
}

export async function hausCheckIn(token: string): Promise<{ success: boolean }> {
  const { data } = await client.instance.post<{ success: boolean }>(
    '/haus/bookings/check-in',
    { token },
  );
  return data;
}

export async function hausMarkHost(isHost = true): Promise<{ success: boolean }> {
  const { data } = await client.instance.post<{ success: boolean }>(
    '/haus/profile/host',
    { is_host: isHost },
  );
  return data;
}

/** Upload a local image and return first CDN URL (reuses WAL user photo pipeline). */
export async function hausUploadProofImageUri(uri: string): Promise<string> {
  const file = {
    uri,
    name: 'haus-proof.jpg',
    type: 'image/jpeg',
  };
  const res = await uploadUserPhotos({
    ...formDataBodySerializer,
    body: { files: [file as never] },
  });
  if (res.error || !res.data?.[0]?.image_url?.[0]) {
    throw new Error('Upload failed');
  }
  return res.data[0].image_url[0];
}
