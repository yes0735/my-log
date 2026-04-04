import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface FeedItem {
  type: 'COMPLETED' | 'REVIEW' | 'RECORD';
  userId: number;
  nickname: string;
  profileImageUrl?: string;
  bookId: number;
  bookTitle: string;
  bookCoverUrl?: string;
  content?: string;
  createdAt: string;
}

export const feedApi = {
  getFeed: (page = 0) =>
    api.get<ApiResponse<FeedItem[]>>(`/my/feed?page=${page}&size=20`).then((r) => r.data.data),
};
