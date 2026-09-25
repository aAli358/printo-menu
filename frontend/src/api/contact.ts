import client from './client';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
}

export const submitEnterpriseContact = async (payload: ContactPayload) => {
  const { data } = await client.post<{ success: boolean; message: string; id: number }>('contact/', {
    ...payload,
    plan: 'enterprise',
  });
  return data;
};
