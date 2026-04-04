export interface UserProfile {
  id: number;
  nickname: string;
  profileImageUrl?: string;
  stats: {
    totalBooks: number;
    completedBooks: number;
    followerCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  recentBooks: Array<{
    id: number;
    title: string;
    coverImageUrl?: string;
  }>;
}

export interface FollowUser {
  userId: number;
  nickname: string;
  profileImageUrl?: string;
  followedAt: string;
}
