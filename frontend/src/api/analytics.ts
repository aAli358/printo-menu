import client from './client';

export interface AnalyticsData {
  period: string;
  revenue: number;
  order_count: number;
  completed_count: number;
  orders_today: number;
  sales_by_day: Array<{ date: string; revenue: number; count: number }>;
  best_sellers: Array<{ name: string; quantity: number; revenue: number }>;
  peak_hours: Array<{ hour: string; count: number }>;
  avg_prep_minutes: number | null;
  avg_rating: number | null;
  review_count: number;
  recent_reviews: Array<{
    id: number;
    rating: number;
    comment: string;
    table_number: string;
    created_at: string;
  }>;
}

export const fetchAnalytics = async (period: 'day' | 'week' | 'month' = 'week') => {
  const { data } = await client.get<AnalyticsData>('analytics/', { params: { period } });
  return data;
};
