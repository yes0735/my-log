import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '@/features/stats/api';
import toast from 'react-hot-toast';

export default function Goals() {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ targetBooks: 12, targetMonth: 0 });

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', year],
    queryFn: () => goalApi.getGoals(year),
  });

  const createMutation = useMutation({
    mutationFn: () => goalApi.create({
      targetYear: year,
      targetMonth: form.targetMonth || undefined,
      targetBooks: form.targetBooks,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', year] });
      toast.success('목표가 설정되었습니다');
      setShowForm(false);
    },
    onError: () => toast.error('목표 설정에 실패했습니다'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => goalApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals', year] });
      toast.success('목표가 삭제되었습니다');
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">독서 목표</h1>
        <div className="flex gap-2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm">
            {[currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <button onClick={() => setShowForm(!showForm)}
            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
            + 새 목표
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 font-semibold">새 목표 설정</h3>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-muted">유형</label>
              <select value={form.targetMonth}
                onChange={(e) => setForm({ ...form, targetMonth: Number(e.target.value) })}
                className="mt-1 rounded border border-border bg-background px-3 py-1.5 text-sm">
                <option value={0}>연간 목표</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}월 목표</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted">목표 권수</label>
              <input type="number" min={1} value={form.targetBooks}
                onChange={(e) => setForm({ ...form, targetBooks: parseInt(e.target.value) || 1 })}
                className="mt-1 w-24 rounded border border-border bg-background px-3 py-1.5 text-sm" />
            </div>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={createMutation.isPending}
                className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
                설정
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="rounded border border-border px-4 py-1.5 text-sm">취소</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted">로딩 중...</p>
      ) : goals?.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <span className="text-5xl">🎯</span>
          <p className="mt-4 text-lg">설정된 목표가 없습니다</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-primary hover:underline">
            첫 번째 독서 목표를 설정해보세요
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals?.map((g) => (
            <div key={g.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    {g.targetMonth ? `${g.targetYear}년 ${g.targetMonth}월` : `${g.targetYear}년 연간`} 목표
                  </h3>
                  <p className="text-sm text-muted">
                    {g.completedBooks} / {g.targetBooks}권 달성
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">{g.progressPercent}%</span>
                  <button onClick={() => deleteMutation.mutate(g.id)}
                    className="text-xs text-destructive hover:underline">삭제</button>
                </div>
              </div>
              <div className="mt-3 h-3 w-full rounded-full bg-secondary">
                <div className="h-3 rounded-full bg-primary transition-all"
                  style={{ width: `${g.progressPercent}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
