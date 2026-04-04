import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HiUserGroup } from 'react-icons/hi2';
import { groupApi } from '@/features/community/api';
import type { Group } from '@/types/community';
import toast from 'react-hot-toast';

export default function Community() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    maxMembers: 50,
    isPublic: true,
  });

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: () => groupApi.getGroups(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      groupApi.createGroup({
        name: form.name,
        description: form.description || undefined,
        maxMembers: form.maxMembers,
        isPublic: form.isPublic,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success('모임이 생성되었습니다');
      setShowForm(false);
      setForm({ name: '', description: '', maxMembers: 50, isPublic: true });
    },
    onError: () => toast.error('모임 생성에 실패했습니다'),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">독서 모임</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
        >
          + 모임 만들기
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold">새 모임 만들기</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-muted">모임 이름 *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="모임 이름을 입력하세요"
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted">설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="모임에 대한 설명을 입력하세요"
                rows={3}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs text-muted">최대 인원</label>
                <input
                  type="number"
                  min={2}
                  max={500}
                  value={form.maxMembers}
                  onChange={(e) => setForm({ ...form, maxMembers: parseInt(e.target.value) || 50 })}
                  className="mt-1 w-24 rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isPublic}
                    onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  공개 모임
                </label>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
              >
                만들기
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded border border-border px-4 py-1.5 text-sm"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted">로딩 중...</p>
      ) : groups?.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <HiUserGroup className="text-5xl" />
          <p className="mt-4 text-lg">아직 모임이 없습니다. 첫 모임을 만들어보세요!</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-primary hover:underline"
          >
            모임 만들기
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups?.map((group) => (
            <Link
              key={group.id}
              to={`/community/groups/${group.id}`}
              className="block rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold">{group.name}</h3>
                {!group.isPublic && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted">비공개</span>
                )}
              </div>
              {group.description && (
                <p className="mb-3 line-clamp-2 text-sm text-muted">{group.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="flex items-center gap-1">
                  <HiUserGroup />
                  {group.memberCount} / {group.maxMembers}명
                </span>
                <span>by {group.creatorNickname}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
