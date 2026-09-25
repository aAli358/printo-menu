import client from './client';

export interface Reservation {
  id: number;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reserved_at: string;
  table_number: string;
  status: string;
  notes: string;
  whatsapp_link?: string | null;
}

export interface WaitlistEntry {
  id: number;
  customer_name: string;
  customer_phone: string;
  party_size: number;
  status: string;
  notes: string;
  created_at: string;
}

export const fetchReservations = async () => {
  const { data } = await client.get<Reservation[]>('reservations/');
  return data;
};

export const confirmReservation = async (id: number) => {
  const { data } = await client.post<Reservation>(`reservations/${id}/confirm/`);
  return data;
};

export const createPublicReservation = async (payload: {
  customer_name: string;
  customer_phone: string;
  party_size: number;
  reserved_at: string;
  notes?: string;
}) => {
  const { data } = await client.post<Reservation>('reservations/', payload);
  return data;
};

export const fetchWaitlist = async () => {
  const { data } = await client.get<WaitlistEntry[]>('waitlist/');
  return data;
};

export const seatWaitlistEntry = async (id: number) => {
  const { data } = await client.post<WaitlistEntry>(`waitlist/${id}/seat/`);
  return data;
};

export const createPublicWaitlist = async (payload: {
  customer_name: string;
  customer_phone: string;
  party_size: number;
  notes?: string;
}) => {
  const { data } = await client.post<WaitlistEntry>('waitlist/', payload);
  return data;
};
