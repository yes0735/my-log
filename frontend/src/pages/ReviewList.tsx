import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { reviewApi } from '@/features/reviews/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ReviewList() {
  const qc = useQueryClient();
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['myReviews'],
    queryFn: () => reviewApi.getMyReviews(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reviewApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myReviews'] });
      toast.success('독후감이 삭제되었습니다');
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">내 독후감</h1>

      {isLoading ? (
        <p className="text-muted">로딩 중...</p>
      ) : reviews?.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <span className="text-5xl">✍️</span>
          <p className="mt-4 text-lg">아직 작성한 독후감이 없습니다</p>
          <Link to="/books" className="mt-2 text-primary hover:underline">
            서재에서 책을 선택하고 독후감을 작성해보세요
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews?.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{r.title}</h2>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(r.createdAt)}
                    {r.isPublic && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-green-700">공개</span>}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/reviews/${r.id}/edit`}
                    className="text-xs text-primary hover:underline">수정</Link>
                  <button onClick={() => deleteMutation.mutate(r.id)}
                    className="text-xs text-destructive hover:underline">삭제</button>
                </div>
              </div>
              <div className="mt-2 line-clamp-3 text-sm text-muted"
                dangerouslySetInnerHTML={{ __html: r.content }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
