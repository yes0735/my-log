import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface ReadingRecord {
  id: number;
  userBookId: number;
  readDate: string;
  pagesRead: number;
  fromPage: number | null;
  toPage: number | null;
  memo: string | null;
  createdAt: string;
}

export interface RecordCreateData {
  readDate: string;
  pagesRead: number;
  fromPage?: number;
  toPage?: number;
  memo?: string;
}

export const recordApi = {
  getRecords: (bookId: number) =>
    api.get<ApiResponse<ReadingRecord[]>>(`/my/books/${bookId}/records`).then((r) => r.data.data),

  createRecord: (bookId: number, data: RecordCreateData) =>
    api.post<ApiResponse<ReadingRecord>>(`/my/books/${bookId}/records`, data).then((r) => r.data.data),

  updateRecord: (bookId: number, recordId: number, data: RecordCreateData) =>
    api.put<ApiResponse<ReadingRecord>>(`/my/books/${bookId}/records/${recordId}`, data).then((r) => r.data.data),

  deleteRecord: (bookId: number, recordId: number) =>
    api.delete(`/my/books/${bookId}/records/${recordId}`),
};
