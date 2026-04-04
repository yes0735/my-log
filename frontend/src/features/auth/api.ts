// Design Ref: §4.2 — Auth API calls
import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    nickname: string;
    profileImageUrl?: string;
    provider: string;
  };
}

export interface SignupData {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export const authApi = {
  signup: (data: SignupData) =>
    api.post<ApiResponse<TokenResponse>>('/auth/signup', data).then((r) => r.data.data),

  login: (data: LoginData) =>
    api.post<ApiResponse<TokenResponse>>('/auth/login', data).then((r) => r.data.data),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<TokenResponse>>('/auth/refresh', { refreshToken }).then((r) => r.data.data),

  getMe: () =>
    api.get<ApiResponse<TokenResponse['user']>>('/auth/me').then((r) => r.data.data),
};
