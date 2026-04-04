import api from '@/lib/api';

export interface Challenge {
  id: number;
  title: string;
  description?: string;
  creatorId: number;
  creatorNickname: string;
  targetBooks: number;
  startDate: string;
  endDate: string;
  participantCount: number;
  isJoined: boolean;
  createdAt: string;
}

export interface Participant {
  userId: number;
  nickname: string;
  profileImageUrl?: string;
  completedBooks: number;
  joinedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  nickname: string;
  profileImageUrl?: string;
  completedBooks: number;
  pagesRead: number;
}

export const challengeApi = {
  getChallenges: (page = 0) =>
    api.get(`/challenges?page=${page}&size=20`).then(r => r.data.data?.content ?? r.data.data),
  createChallenge: (data: { title: string; description?: string; targetBooks: number; startDate: string; endDate: string }) =>
    api.post('/challenges', data).then(r => r.data.data) as Promise<Challenge>,
  getChallenge: (id: number) =>
    api.get(`/challenges/${id}`).then(r => r.data.data) as Promise<Challenge>,
  joinChallenge: (id: number) =>
    api.post(`/challenges/${id}/join`),
  getParticipants: (id: number) =>
    api.get(`/challenges/${id}/participants`).then(r => r.data.data) as Promise<Participant[]>,
  getLeaderboard: (period: 'week' | 'month') =>
    api.get(`/leaderboard?period=${period}`).then(r => r.data.data) as Promise<LeaderboardEntry[]>,
};
