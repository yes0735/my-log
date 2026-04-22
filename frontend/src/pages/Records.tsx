import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { bookApi } from '@/features/books/api';
import { recordApi, type ReadingRecord } from '@/features/records/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RecordWithBook extends ReadingRecord {
  bookTitle: string;
  bookAuthor: string;
  coverImageUrl?: string;
  userBookId: number;
}

export default function Records() {
  const [allRecords, setAllRecords] = useState<RecordWithBook[]>([]);
  const [loading, setLoading] = useState(true);

  const { data } = useQuery({
    queryKey: ['myBooks', '', 0, 'createdAt,desc'],
    queryFn: () => bookApi.getMyBooks({ page: 0, size: 100, sort: 'createdAt,desc' }),
  });

  const allBooks = data?.content ?? [];

  // 모든 책의 독서 기록을 로드
  useEffect(() => {
    if (!allBooks.length) { setLoading(false); return; }

    const load = async () => {
      const records: RecordWithBook[] = [];
      await Promise.all(
        allBooks.map(async (ub) => {
          try {
            const bookRecords = await recordApi.getRecords(ub.id);
            bookRecords.forEach((r) => {
              records.push({
                ...r,
                bookTitle: ub.book.title,
                bookAuthor: ub.book.author,
                coverImageUrl: ub.book.coverImageUrl,
                userBookId: ub.id,
              });
            });
          } catch { /* skip */ }
        })
      );
      // 최신순 정렬
      records.sort((a, b) => new Date(b.readDate).getTime() - new Date(a.readDate).getTime());
      setAllRecords(records);
      setLoading(false);
    };
    load();
  }, [allBooks.length]);

  const deleteMutation = useMutation({
    mutationFn: ({ userBookId, recordId }: { userBookId: number; recordId: number }) =>
      recordApi.deleteRecord(userBookId, recordId),
    onSuccess: (_data, { recordId }) => {
      setAllRecords((prev) => prev.filter((r) => r.id !== recordId));
      toast.success('기록이 삭제되었습니다');
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">독서 기록</h1>

      {loading ? (
        <p className="text-muted">로딩 중...</p>
      ) : allRecords.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border/60 py-16 text-muted">
          <p className="text-sm font-medium">아직 독서 기록이 없습니다</p>
          <Link to="/books" className="mt-2 text-xs text-primary hover:underline">
            서재에서 책을 선택하고 기록을 추가해보세요
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {allRecords.map((r) => (
            <div key={r.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  {/* 책 표지 */}
                  <Link to={`/books/${r.userBookId}`} className="shrink-0">
                    <div className="h-16 w-11 overflow-hidden rounded bg-secondary/50">
                      {r.coverImageUrl && (
                        <img src={r.coverImageUrl} alt={r.bookTitle} className="h-full w-full rounded object-contain" />
                      )}
                    </div>
                  </Link>
                  <div>
                    <Link to={`/books/${r.userBookId}`} className="font-semibold hover:text-primary">
                      {r.bookTitle}
                    </Link>
                    <p className="text-xs text-muted">{r.bookAuthor}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(r.readDate)}
                      <span className="ml-2 font-medium text-foreground">{r.pagesRead}페이지 읽음</span>
                      {r.fromPage != null && r.toPage != null && (
                        <span className="ml-1">(p.{r.fromPage}~{r.toPage})</span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate({ userBookId: r.userBookId, recordId: r.id })}
                  className="text-xs text-destructive hover:underline"
                >
                  삭제
                </button>
              </div>
              {r.memo && (
                <p className="mt-2 ml-14 text-sm text-muted">{r.memo}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
