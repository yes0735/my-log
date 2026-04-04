import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewApi } from '@/features/reviews/api';
import ReviewEditor from '@/features/reviews/ReviewEditor';
import toast from 'react-hot-toast';

export default function ReviewEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: reviews } = useQuery({
    queryKey: ['myReviews'],
    queryFn: () => reviewApi.getMyReviews(),
  });

  const review = reviews?.find((r) => r.id === Number(id));

  const mutation = useMutation({
    mutationFn: (data: { title: string; content: string; isPublic: boolean }) =>
      reviewApi.update(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myReviews'] });
      toast.success('독후감이 수정되었습니다');
      navigate('/reviews');
    },
    onError: () => toast.error('수정에 실패했습니다'),
  });

  if (!review) return <p className="text-muted">독후감을 찾을 수 없습니다</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold">독후감 수정</h1>
      <ReviewEditor
        initialTitle={review.title}
        initialContent={review.content}
        initialIsPublic={review.isPublic}
        onSave={(data) => mutation.mutate(data)}
        onCancel={() => navigate('/reviews')}
        saving={mutation.isPending}
      />
    </div>
  );
}
