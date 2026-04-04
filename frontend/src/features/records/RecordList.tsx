import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordApi } from './api';
import RecordForm from './RecordForm';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function RecordList({ userBookId }: { userBookId: number }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: records, isLoading } = useQuery({
    queryKey: ['records', userBookId],
    queryFn: () => recordApi.getRecords(userBookId),
  });

  const deleteMutation = useMutation({
    mutationFn: (recordId: number) => recordApi.deleteRecord(userBookId, recordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['records', userBookId] });
      toast.success('기록이 삭제되었습니다');
    },
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">독서 기록</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90">
          + 기록 추가
        </button>
      </div>

      {showForm && <RecordForm userBookId={userBookId} onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="text-sm text-muted">로딩 중...</p>
      ) : records?.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">독서 기록이 없습니다</p>
      ) : (
        <div className="mt-3 space-y-2">
          {records?.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded border border-border p-3">
              <div>
                <span className="text-sm font-medium">{formatDate(r.readDate)}</span>
                <span className="ml-2 text-sm text-muted">
                  {r.pagesRead}페이지 읽음
                  {r.fromPage && r.toPage && ` (p.${r.fromPage}~${r.toPage})`}
                </span>
                {r.memo && <p className="mt-1 text-xs text-muted">{r.memo}</p>}
              </div>
              <button onClick={() => deleteMutation.mutate(r.id)}
                className="text-xs text-destructive hover:underline">삭제</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
