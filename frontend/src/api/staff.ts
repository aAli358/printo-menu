import client from './client';

export type StaffRole = 'waiter' | 'kitchen' | 'cashier';

export interface StaffMember {
  id: number;
  user_id: number;
  username: string;
  role: StaffRole;
  tenant: number;
}

export const fetchStaff = async () => {
  const { data } = await client.get<StaffMember[]>('staff/');
  return data;
};

export const addStaff = async (username: string, role: StaffRole) => {
  const { data } = await client.post<StaffMember>('staff/', { username, role });
  return data;
};

export const removeStaff = async (id: number) => {
  await client.delete(`staff/${id}/`);
};
