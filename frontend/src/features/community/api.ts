import api from '@/lib/api';
import type { Group, GroupMember, Discussion, Comment } from '@/types/community';

export const groupApi = {
  getGroups: (page = 0) =>
    api.get(`/groups?page=${page}&size=20`).then(r => r.data.data?.content ?? r.data.data),
  createGroup: (data: { name: string; description?: string; maxMembers?: number; isPublic?: boolean }) =>
    api.post('/groups', data).then(r => r.data.data) as Promise<Group>,
  getGroup: (id: number) =>
    api.get(`/groups/${id}`).then(r => r.data.data) as Promise<Group>,
  joinGroup: (id: number) =>
    api.post(`/groups/${id}/join`),
  leaveGroup: (id: number) =>
    api.delete(`/groups/${id}/leave`),
  getMembers: (id: number) =>
    api.get(`/groups/${id}/members`).then(r => r.data.data) as Promise<GroupMember[]>,
};

export const discussionApi = {
  getDiscussions: (groupId: number, page = 0) =>
    api.get(`/groups/${groupId}/discussions?page=${page}&size=20`).then(r => r.data.data?.content ?? r.data.data),
  createDiscussion: (groupId: number, data: { title: string; content: string }) =>
    api.post(`/groups/${groupId}/discussions`, data).then(r => r.data.data) as Promise<Discussion>,
  getDiscussion: (id: number) =>
    api.get(`/discussions/${id}`).then(r => r.data.data) as Promise<Discussion>,
  getComments: (discussionId: number) =>
    api.get(`/discussions/${discussionId}/comments`).then(r => r.data.data) as Promise<Comment[]>,
  createComment: (discussionId: number, data: { content: string; parentId?: number }) =>
    api.post(`/discussions/${discussionId}/comments`, data).then(r => r.data.data) as Promise<Comment>,
  deleteComment: (id: number) =>
    api.delete(`/comments/${id}`),
};
