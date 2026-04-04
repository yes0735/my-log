import api from '@/lib/api';
import type { UserProfile, FollowUser } from '@/types/follow';
import type { ApiResponse } from '@/types/api';

export const followApi = {
  getProfile: (userId: number) =>
    api.get<ApiResponse<UserProfile>>(`/users/${userId}/profile`).then((r) => r.data.data),

  updateProfile: (data: { nickname?: string; profileImageUrl?: string }) =>
    api.put<ApiResponse<UserProfile>>('/my/profile', data).then((r) => r.data.data),

  follow: (userId: number) =>
    api.post(`/users/${userId}/follow`),

  unfollow: (userId: number) =>
    api.delete(`/users/${userId}/follow`),

  getFollowers: (userId: number, page = 0) =>
    api
      .get<ApiResponse<{ content: FollowUser[]; totalPages: number }>>(
        `/users/${userId}/followers?page=${page}`
      )
      .then((r) => r.data.data),

  getFollowing: (userId: number, page = 0) =>
    api
      .get<ApiResponse<{ content: FollowUser[]; totalPages: number }>>(
        `/users/${userId}/following?page=${page}`
      )
      .then((r) => r.data.data),
};
