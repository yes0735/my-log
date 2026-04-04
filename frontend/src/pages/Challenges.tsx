import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { IoTrophyOutline } from 'react-icons/io5';
import { HiUserGroup } from 'react-icons/hi2';
import { challengeApi } from '@/features/challenge/api';
import type { Challenge } from '@/features/challenge/api';
import toast from 'react-hot-toast';

export default function Challenges() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetBooks: 5,
    startDate: '',
    endDate: '',
  });

  const { data: challenges, isLoading } = useQuery<Challenge[]>({
    queryKey: ['challenges'],
    queryFn: () => challengeApi.getChallenges(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      challengeApi.createChallenge({
        title: form.title,
        description: form.description || undefined,
        targetBooks: form.targetBooks,
        startDate: form.startDate,
        endDate: form.endDate,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('챌린지가 생성되었습니다');
      setShowForm(false);
      setForm({ title: '', description: '', targetBooks: 5, startDate: '', endDate: '' });
    },
    onError: () => toast.error('챌린지 생성에 실패했습니다'),
  });

  const joinMutation = useMutation({
    mutationFn: (id: number) => challengeApi.joinChallenge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('챌린지에 참가했습니다');
    },
    onError: () => toast.error('참가에 실패했습니다'),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">독서 챌린지</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
        >
          + 챌린지 만들기
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold">새 챌린지 만들기</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs text-muted">챌린지 이름 *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="챌린지 이름을 입력하세요"
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted">설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="챌린지에 대한 설명을 입력하세요"
                rows={3}
                className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-xs text-muted">목표 권수 *</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={form.targetBooks}
                  onChange={(e) => setForm({ ...form, targetBooks: parseInt(e.target.value) || 5 })}
                  className="mt-1 w-24 rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted">시작일 *</label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-muted">종료일 *</label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 rounded border border-border bg-background px-3 py-1.5 text-sm"
                />
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
      ) : challenges?.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <IoTrophyOutline className="text-5xl" />
          <p className="mt-4 text-lg">아직 챌린지가 없습니다. 첫 챌린지를 만들어보세요!</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-primary hover:underline"
          >
            챌린지 만들기
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges?.map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md"
            >
              <Link to={`/challenges/${challenge.id}`}>
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold">{challenge.title}</h3>
                  <IoTrophyOutline className="shrink-0 text-primary" />
                </div>
                {challenge.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-muted">{challenge.description}</p>
                )}
                <div className="mb-2 text-sm text-muted">
                  <span>목표: {challenge.targetBooks}권</span>
                </div>
                <div className="mb-3 text-xs text-muted">
                  {challenge.startDate} ~ {challenge.endDate}
                </div>
              </Link>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-muted">
                  <HiUserGroup />
                  {challenge.participantCount}명 참가 중
                </span>
                {challenge.isJoined ? (
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    참가 중
                  </span>
                ) : (
                  <button
                    onClick={() => joinMutation.mutate(challenge.id)}
                    disabled={joinMutation.isPending}
                    className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                  >
                    참가
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
