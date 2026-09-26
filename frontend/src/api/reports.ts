import client from './client';

export const downloadAnalyticsReport = async (
  period: 'day' | 'week' | 'month',
  format: 'pdf' | 'xlsx',
) => {
  const response = await client.get('reports/export/', {
    params: { period, format },
    responseType: 'blob',
  });
  return response.data as Blob;
};
