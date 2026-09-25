import client from './client';

export interface ExperienceReviewInput {
  rating: number;
  comment?: string;
  table_number?: string;
}

export const submitExperienceReview = async (payload: ExperienceReviewInput) => {
  const { data } = await client.post('experience-reviews/', payload);
  return data;
};
