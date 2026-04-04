import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HiUserGroup, HiChatBubbleLeftRight } from 'react-icons/hi2';
import { groupApi, discussionApi } from '@/features/community/api';
import type { Group, Discussion, Comment as CommentType } from '@/types/community';
import toast from 'react-hot-toast';

function DiscussionComments({ discussionId }: { discussionId: number }) {
  const qc = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; nickname: string } | null>(null);

  const { data: comments, isLoading } = useQuery<CommentType[]>({
    queryKey: ['comments', discussionId],
    queryFn: () => discussionApi.getComments(discussionId),
  });

  const createComment = useMutation({
    mutationFn: () =>
      discussionApi.createComment(discussionId, {
        content: commentText,
        parentId: replyTo?.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', discussionId] });
      qc.invalidateQueries({ queryKey: ['discussions'] });
      setCommentText('');
      setReplyTo(null);
      toast.success('댓글이 작성되었습니다');
    },
    onError: () => toast.error('댓글 작성에 실패했습니다'),
  });

  const deleteComment = useMutation({
    mutationFn: (id: number) => discussionApi.deleteComment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', discussionId] });
      qc.invalidateQueries({ queryKey: ['discussions'] });
      toast.success('댓글이 삭제되었습니다');
    },
  });

  if (isLoading) return <p className="py-2 text-sm text-muted">댓글 로딩 중...</p>;

  return (
    <div className="mt-3 border-t border-border pt-3">
      {comments && comments.length > 0 && (
        <div className="mb-3 space-y-2">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded p-2 text-sm ${c.parentId ? 'ml-6 bg-secondary/50' : 'bg-secondary/30'}`}
            >
              <div className="flex items-center gap-2">
                {c.authorProfileImageUrl ? (
                  <img
                    src={c.authorProfileImageUrl}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                    {c.authorNickname[0]}
                  </div>
                )}
                <span className="font-medium">{c.authorNickname}</span>
                <span className="text-xs text-muted">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1">{c.content}</p>
              <div className="mt-1 flex gap-2">
                <button
                  onClick={() => setReplyTo({ id: c.id, nickname: c.authorNickname })}
                  className="text-xs text-primary hover:underline"
                >
                  답글
                </button>
                <button
                  onClick={() => deleteComment.mutate(c.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!commentText.trim()) return;
          createComment.mutate();
        }}
        className="flex gap-2"
      >
        <div className="flex-1">
          {replyTo && (
            <div className="mb-1 flex items-center gap-1 text-xs text-muted">
              <span>@{replyTo.nickname}에게 답글</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-destructive hover:underline"
              >
                취소
              </button>
            </div>
          )}
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글 작성..."
            className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={createComment.isPending || !commentText.trim()}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
        >
          작성
        </button>
      </form>
    </div>
  );
}

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const groupId = Number(id);

  const [activeTab, setActiveTab] = useState<'discussions' | 'members'>('discussions');
  const [expandedDiscussion, setExpandedDiscussion] = useState<number | null>(null);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  const [discussionForm, setDiscussionForm] = useState({ title: '', content: '' });

  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: ['group', groupId],
    queryFn: () => groupApi.getGroup(groupId),
    enabled: !!groupId,
  });

  const { data: discussions, isLoading: discussionsLoading } = useQuery<Discussion[]>({
    queryKey: ['discussions', groupId],
    queryFn: () => discussionApi.getDiscussions(groupId),
    enabled: !!groupId && activeTab === 'discussions',
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', groupId],
    queryFn: () => groupApi.getMembers(groupId),
    enabled: !!groupId && activeTab === 'members',
  });

  const joinMutation = useMutation({
    mutationFn: () => groupApi.joinGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', groupId] });
      qc.invalidateQueries({ queryKey: ['members', groupId] });
      toast.success('모임에 참가했습니다');
    },
    onError: () => toast.error('참가에 실패했습니다'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupApi.leaveGroup(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['group', groupId] });
      qc.invalidateQueries({ queryKey: ['members', groupId] });
      toast.success('모임에서 탈퇴했습니다');
    },
    onError: () => toast.error('탈퇴에 실패했습니다'),
  });

  const createDiscussion = useMutation({
    mutationFn: () =>
      discussionApi.createDiscussion(groupId, {
        title: discussionForm.title,
        content: discussionForm.content,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussions', groupId] });
      toast.success('토론이 작성되었습니다');
      setShowNewDiscussion(false);
      setDiscussionForm({ title: '', content: '' });
    },
    onError: () => toast.error('토론 작성에 실패했습니다'),
  });

  if (groupLoading) return <p className="text-muted">로딩 중...</p>;
  if (!group) return <p className="text-muted">모임을 찾을 수 없습니다.</p>;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/community')}
          className="mb-3 text-sm text-muted hover:text-foreground"
        >
          &larr; 모임 목록
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="mt-1 text-sm text-muted">{group.description}</p>
            )}
            <div className="mt-2 flex items-center gap-3 text-sm text-muted">
              <span className="flex items-center gap-1">
                <HiUserGroup />
                {group.memberCount} / {group.maxMembers}명
              </span>
              <span>by {group.creatorNickname}</span>
            </div>
          </div>
          <div>
            {group.isMember ? (
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                className="rounded border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                탈퇴
              </button>
            ) : (
              <button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              >
                참가
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex border-b border-border">
        <button
          onClick={() => setActiveTab('discussions')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'discussions'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <HiChatBubbleLeftRight className="mr-1 inline" />
          토론
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'members'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted hover:text-foreground'
          }`}
        >
          <HiUserGroup className="mr-1 inline" />
          멤버
        </button>
      </div>

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              onClick={() => setShowNewDiscussion(!showNewDiscussion)}
              className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              + 새 토론 작성
            </button>
          </div>

          {showNewDiscussion && (
            <div className="mb-4 rounded-lg border border-border bg-card p-4">
              <h3 className="mb-3 font-semibold">새 토론 작성</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createDiscussion.mutate();
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs text-muted">제목 *</label>
                  <input
                    type="text"
                    required
                    value={discussionForm.title}
                    onChange={(e) =>
                      setDiscussionForm({ ...discussionForm, title: e.target.value })
                    }
                    placeholder="토론 제목을 입력하세요"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted">내용 *</label>
                  <textarea
                    required
                    rows={4}
                    value={discussionForm.content}
                    onChange={(e) =>
                      setDiscussionForm({ ...discussionForm, content: e.target.value })
                    }
                    placeholder="토론 내용을 작성하세요"
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createDiscussion.isPending}
                    className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
                  >
                    작성
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewDiscussion(false)}
                    className="rounded border border-border px-4 py-1.5 text-sm"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {discussionsLoading ? (
            <p className="text-muted">로딩 중...</p>
          ) : discussions?.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted">
              <HiChatBubbleLeftRight className="text-4xl" />
              <p className="mt-3">아직 토론이 없습니다. 첫 토론을 시작해보세요!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {discussions?.map((d) => (
                <div key={d.id} className="rounded-lg border border-border bg-card p-4">
                  <button
                    onClick={() =>
                      setExpandedDiscussion(expandedDiscussion === d.id ? null : d.id)
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{d.title}</h4>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                          {d.authorProfileImageUrl ? (
                            <img
                              src={d.authorProfileImageUrl}
                              alt=""
                              className="h-4 w-4 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[8px] font-bold text-primary">
                              {d.authorNickname[0]}
                            </div>
                          )}
                          <span>{d.authorNickname}</span>
                          <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <HiChatBubbleLeftRight />
                        {d.commentCount}
                      </span>
                    </div>
                  </button>

                  {expandedDiscussion === d.id && (
                    <div className="mt-3">
                      <p className="whitespace-pre-wrap text-sm">{d.content}</p>
                      <DiscussionComments discussionId={d.id} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {membersLoading ? (
            <p className="text-muted">로딩 중...</p>
          ) : members?.length === 0 ? (
            <p className="py-8 text-center text-muted">멤버가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {members?.map((m) => (
                <Link
                  key={m.userId}
                  to={`/profile/${m.userId}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md"
                >
                  {m.profileImageUrl ? (
                    <img
                      src={m.profileImageUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                      {m.nickname[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.nickname}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs ${
                          m.role === 'CREATOR'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-secondary text-muted'
                        }`}
                      >
                        {m.role === 'CREATOR' ? '방장' : '멤버'}
                      </span>
                    </div>
                    <p className="text-xs text-muted">
                      {new Date(m.joinedAt).toLocaleDateString()} 참가
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
