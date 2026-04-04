import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface Review {
  id: number;
  userBookId: number;
  userId: number;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCreateData {
  title: string;
  content: string;
  isPublic?: boolean;
}

export const reviewApi = {
  getByBook: (bookId: number) =>
    api.get<ApiResponse<Review[]>>(`/my/books/${bookId}/reviews`).then((r) => r.data.data),

  getMyReviews: () =>
    api.get<ApiResponse<Review[]>>('/my/reviews').then((r) => r.data.data),

  create: (bookId: number, data: ReviewCreateData) =>
    api.post<ApiResponse<Review>>(`/my/books/${bookId}/reviews`, data).then((r) => r.data.data),

  update: (reviewId: number, data: ReviewCreateData) =>
    api.put<ApiResponse<Review>>(`/reviews/${reviewId}`, data).then((r) => r.data.data),

  delete: (reviewId: number) =>
    api.delete(`/reviews/${reviewId}`),

  getPublicReviews: (page = 0, size = 20) =>
    api
      .get<ApiResponse<{ content: Review[]; totalPages: number; totalElements: number }>>(`/reviews/public?page=${page}&size=${size}`)
      .then((r) => r.data.data),
};
