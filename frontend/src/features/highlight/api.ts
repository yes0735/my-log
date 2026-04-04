import api from '@/lib/api';

export interface Highlight {
  id: number;
  userBookId: number;
  pageNumber?: number;
  content: string;
  memo?: string;
  createdAt: string;
}

export const highlightApi = {
  getHighlights: (bookId: number) =>
    api.get<{ data: Highlight[] }>(`/my/books/${bookId}/highlights`).then(r => r.data.data),
  createHighlight: (bookId: number, data: { pageNumber?: number; content: string; memo?: string }) =>
    api.post(`/my/books/${bookId}/highlights`, data).then(r => r.data.data) as Promise<Highlight>,
  deleteHighlight: (id: number) =>
    api.delete(`/highlights/${id}`),
};
