export interface Group {
  id: number;
  name: string;
  description?: string;
  creatorId: number;
  creatorNickname: string;
  maxMembers: number;
  isPublic: boolean;
  memberCount: number;
  isMember: boolean;
  createdAt: string;
}

export interface GroupMember {
  userId: number;
  nickname: string;
  profileImageUrl?: string;
  role: string;
  joinedAt: string;
}

export interface Discussion {
  id: number;
  groupId: number;
  userId: number;
  authorNickname: string;
  authorProfileImageUrl?: string;
  title: string;
  content: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  discussionId: number;
  userId: number;
  authorNickname: string;
  authorProfileImageUrl?: string;
  content: string;
  parentId?: number;
  createdAt: string;
}
