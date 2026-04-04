import api from '@/lib/api';

export interface ReadingSession {
  id: number;
  userBookId: number;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  pagesRead?: number;
}

export const timerApi = {
  startSession: (bookId: number) =>
    api.post<{ data: ReadingSession }>(`/my/books/${bookId}/sessions/start`).then(r => r.data.data),
  stopSession: (bookId: number, sessionId: number, data?: { pagesRead?: number }) =>
    api.post(`/my/books/${bookId}/sessions/${sessionId}/stop`, data || {}).then(r => r.data.data) as Promise<ReadingSession>,
  getSessions: (bookId: number) =>
    api.get<{ data: ReadingSession[] }>(`/my/books/${bookId}/sessions`).then(r => r.data.data),
};
