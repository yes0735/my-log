import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface StatsSummary {
  totalBooks: number;
  completedBooks: number;
  readingBooks: number;
  wantToReadBooks: number;
  totalPagesRead: number;
  totalRecords: number;
  averageRating: number;
}

export interface MonthlyStats {
  month: number;
  booksCompleted: number;
  pagesRead: number;
  recordCount: number;
}

export interface GenreStats {
  name: string;
  count: number;
}

export interface YearlyStats {
  totalBooks: number;
  completedBooks: number;
  totalPagesRead: number;
  averageRating: number;
}

export interface GoalResponse {
  id: number;
  targetYear: number;
  targetMonth: number | null;
  targetBooks: number;
  completedBooks: number;
  progressPercent: number;
}

export const statsApi = {
  getSummary: () =>
    api.get<ApiResponse<StatsSummary>>('/my/stats/summary').then((r) => r.data.data),

  getMonthly: (year?: number) =>
    api.get<ApiResponse<MonthlyStats[]>>('/my/stats/monthly', { params: { year } }).then((r) => r.data.data),

  getGenres: () =>
    api.get<ApiResponse<GenreStats[]>>('/my/stats/genres').then((r) => r.data.data),

  getYearly: (year: number) =>
    api.get<ApiResponse<YearlyStats>>(`/my/stats/yearly?year=${year}`).then((r) => r.data.data),
};

export const goalApi = {
  getGoals: (year?: number) =>
    api.get<ApiResponse<GoalResponse[]>>('/my/goals', { params: { year } }).then((r) => r.data.data),

  create: (data: { targetYear: number; targetMonth?: number; targetBooks: number }) =>
    api.post<ApiResponse<GoalResponse>>('/my/goals', data).then((r) => r.data.data),

  update: (id: number, data: { targetYear: number; targetMonth?: number; targetBooks: number }) =>
    api.put<ApiResponse<GoalResponse>>(`/my/goals/${id}`, data).then((r) => r.data.data),

  delete: (id: number) =>
    api.delete(`/my/goals/${id}`),
};
