import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface Category {
  id: number;
  name: string;
  color: string;
}

export const categoryApi = {
  getCategories: () =>
    api.get<ApiResponse<Category[]>>('/my/categories').then((r) => r.data.data),
  createCategory: (data: { name: string; color?: string }) =>
    api.post<ApiResponse<Category>>('/my/categories', data).then((r) => r.data.data),
  updateCategory: (id: number, data: { name: string; color?: string }) =>
    api.put<ApiResponse<Category>>(`/my/categories/${id}`, data).then((r) => r.data.data),
  deleteCategory: (id: number) =>
    api.delete(`/my/categories/${id}`),

  // Book-Category associations
  getBookCategories: (userBookId: number) =>
    api.get<ApiResponse<Category[]>>(`/my/books/${userBookId}/categories`).then((r) => r.data.data),
  addCategoryToBook: (userBookId: number, categoryId: number) =>
    api.post(`/my/books/${userBookId}/categories/${categoryId}`),
  removeCategoryFromBook: (userBookId: number, categoryId: number) =>
    api.delete(`/my/books/${userBookId}/categories/${categoryId}`),
};
