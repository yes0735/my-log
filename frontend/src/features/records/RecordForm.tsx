import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordApi, type RecordCreateData } from './api';
import toast from 'react-hot-toast';

interface Props {
  userBookId: number;
  onClose: () => void;
}

export default function RecordForm({ userBookId, onClose }: Props) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState<RecordCreateData>({
    readDate: today,
    pagesRead: 0,
    fromPage: undefined,
    toPage: undefined,
    memo: '',
  });

  const mutation = useMutation({
    mutationFn: (data: RecordCreateData) => recordApi.createRecord(userBookId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', userBookId] });
      qc.invalidateQueries({ queryKey: ['myBook', String(userBookId)] });
      toast.success('독서 기록이 추가되었습니다');
      onClose();
    },
    onError: () => toast.error('기록 추가에 실패했습니다'),
  });

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 font-semibold">독서 기록 추가</h3>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted">날짜</label>
            <input type="date" value={form.readDate}
              onChange={(e) => setForm({ ...form, readDate: e.target.value })}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted">읽은 페이지 수</label>
            <input type="number" min={1} value={form.pagesRead || ''}
              onChange={(e) => setForm({ ...form, pagesRead: parseInt(e.target.value) || 0 })}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted">시작 페이지</label>
            <input type="number" min={0} value={form.fromPage ?? ''}
              onChange={(e) => setForm({ ...form, fromPage: e.target.value ? parseInt(e.target.value) : undefined })}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted">종료 페이지</label>
            <input type="number" min={0} value={form.toPage ?? ''}
              onChange={(e) => setForm({ ...form, toPage: e.target.value ? parseInt(e.target.value) : undefined })}
              className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted">메모</label>
          <textarea value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
            placeholder="오늘 읽은 내용에 대한 짧은 메모..." />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={mutation.isPending}
            className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {mutation.isPending ? '저장 중...' : '저장'}
          </button>
          <button type="button" onClick={onClose}
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-secondary">취소</button>
        </div>
      </form>
    </div>
  );
}
