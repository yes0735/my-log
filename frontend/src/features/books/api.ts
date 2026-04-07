import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { UserBook, Book } from '@/types/book';

export interface BookSearchResult {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  coverImageUrl: string;
  totalPages: number | null;
  description: string;
  publishedDate: string;
}

export const bookApi = {
  search: (q: string) =>
    api.get<ApiResponse<BookSearchResult[]>>('/books/search', { params: { q } }).then((r) => r.data.data),

  create: (data: Partial<Book>) =>
    api.post<ApiResponse<Book>>('/books', data).then((r) => r.data.data),

  getMyBooks: (params: { status?: string; page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<{ content: UserBook[]; totalElements: number; totalPages: number }>>('/my/books', { params }).then((r) => r.data.data),

  addToShelf: (bookId: number, status?: string) =>
    api.post<ApiResponse<UserBook>>('/my/books', { bookId, status }).then((r) => r.data.data),

  getMyBook: (id: number) =>
    api.get<ApiResponse<UserBook>>(`/my/books/${id}`).then((r) => r.data.data),

  updateMyBook: (id: number, data: { status?: string; rating?: number; currentPage?: number }) =>
    api.patch<ApiResponse<UserBook>>(`/my/books/${id}`, data).then((r) => r.data.data),

  removeFromShelf: (id: number) =>
    api.delete(`/my/books/${id}`),

  updateBook: (bookId: number, data: { title?: string; author?: string; publisher?: string; totalPages?: number; description?: string }) =>
    api.patch<ApiResponse<Book>>(`/books/${bookId}`, data).then((r) => r.data.data),
};
