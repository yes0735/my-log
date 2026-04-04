import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bookApi } from '@/features/books/api';
import BookCard from '@/features/books/BookCard';
import AdBanner from '@/components/ads/AdBanner';
import { IoGridOutline, IoListOutline } from 'react-icons/io5';
import type { UserBook } from '@/types/book';

const statusFilters = [
  { value: '', label: '전체' },
  { value: 'WANT_TO_READ', label: '읽고 싶은' },
  { value: 'READING', label: '읽는 중' },
  { value: 'COMPLETED', label: '완독' },
];

const sortOptions = [
  { value: 'createdAt,desc', label: '최신순' },
  { value: 'title,asc', label: '제목순' },
  { value: 'rating,desc', label: '별점순' },
];

type ViewMode = 'grid' | 'list';

function BookListRow({ userBook }: { userBook: UserBook }) {
  const { book, status, rating } = userBook;
  const progress = book.totalPages && userBook.currentPage
    ? Math.round((userBook.currentPage / book.totalPages) * 100)
    : 0;

  const statusLabels: Record<string, string> = {
    WANT_TO_READ: '읽고 싶은',
    READING: '읽는 중',
    COMPLETED: '완독',
  };

  return (
    <Link
      to={`/books/${userBook.id}`}
      className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md"
    >
      <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-secondary/50">
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} alt={book.title} className="h-full rounded object-contain" />
        ) : (
          <span className="text-xl">📖</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="line-clamp-1 text-sm font-medium">{book.title}</p>
        <p className="text-xs text-muted">{book.author}</p>
      </div>
      {status === 'READING' && (
        <div className="hidden w-32 sm:block">
          <div className="h-1.5 w-full rounded-full bg-secondary">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-0.5 text-xs text-muted text-right">{progress}%</p>
        </div>
      )}
      {rating ? (
        <span className="shrink-0 text-xs text-yellow-500">{'★'.repeat(Math.floor(rating))}{rating % 1 >= 0.5 ? '½' : ''} {rating}</span>
      ) : null}
      <span className="shrink-0 rounded-full px-2 py-0.5 text-xs text-muted">{statusLabels[status]}</span>
    </Link>
  );
}

export default function BookList() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('createdAt,desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data, isLoading } = useQuery({
    queryKey: ['myBooks', status, page, sort],
    queryFn: () => bookApi.getMyBooks({ status: status || undefined, page, size: 20, sort }),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">내 서재</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded p-1.5 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted hover:bg-secondary'}`}
            title="그리드 보기"
          >
            <IoGridOutline size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded p-1.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted hover:bg-secondary'}`}
            title="리스트 보기"
          >
            <IoListOutline size={18} />
          </button>
          <Link
            to="/books/search"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            + 책 추가
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(0); }}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                status === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(0); }}
          className="ml-auto rounded-md border border-border bg-background px-3 py-1 text-sm"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted">로딩 중...</p>
      ) : data?.content?.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <span className="text-5xl">📚</span>
          <p className="mt-4 text-lg">서재가 비어있습니다</p>
          <Link to="/books/search" className="mt-2 text-primary hover:underline">
            첫 번째 책을 추가해보세요
          </Link>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data?.content?.map((ub) => (
                <BookCard key={ub.id} userBook={ub} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.content?.map((ub) => (
                <BookListRow key={ub.id} userBook={ub} />
              ))}
            </div>
          )}
          {data && data.totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded border px-3 py-1 text-sm disabled:opacity-30"
              >
                이전
              </button>
              <span className="px-3 py-1 text-sm text-muted">
                {page + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages - 1}
                className="rounded border px-3 py-1 text-sm disabled:opacity-30"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {/* AdSense — Design Ref: §9.8 */}
      <AdBanner
        adClient="ca-pub-XXXXXXXX"
        adSlot="BOOKLIST_SLOT_ID"
        className="mt-6"
      />
    </div>
  );
}
