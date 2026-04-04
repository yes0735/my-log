import api from '@/lib/api';
import type { LevelInfo, BadgeInfo } from '@/types/gamification';

export const gamificationApi = {
  getLevel: () =>
    api.get<{ data: LevelInfo }>('/my/level').then((r) => r.data.data),
  getMyBadges: () =>
    api.get<{ data: BadgeInfo[] }>('/my/badges').then((r) => r.data.data),
  getAllBadges: () =>
    api.get<{ data: BadgeInfo[] }>('/badges').then((r) => r.data.data),
};
