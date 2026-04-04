// Design Ref: §4.1 — API response types matching backend ApiResponse
export interface ApiResponse<T> {
  data: T;
  pagination?: PageInfo;
  error?: ApiError;
}

export interface PageInfo {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
