import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookApi } from '@/features/books/api';
import { categoryApi, type Category } from '@/features/category/api';
import SortableBookCard from '@/features/books/SortableBookCard';
import AdBanner from '@/components/ads/AdBanner';
import { IoGridOutline, IoListOutline, IoTrashOutline } from 'react-icons/io5';
import type { UserBook } from '@/types/book';
import toast from 'react-hot-toast';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

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

function BookListRow({ userBook, onDelete, categories = [] }: { userBook: UserBook; onDelete: (id: number) => void; categories?: Category[] }) {
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
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-shadow hover:shadow-md group">
      <Link to={`/books/${userBook.id}`} className="flex flex-1 items-center gap-4 min-w-0">
        <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-secondary/50">
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} alt={book.title} className="h-full rounded object-contain" />
          ) : (
            <span className="text-xl">📖</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="line-clamp-1 text-sm font-medium">{book.title}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">{book.author}</span>
            {categories.map((c) => (
              <span key={c.id} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: c.color }}>{c.name}</span>
            ))}
          </div>
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
          <span className="shrink-0 text-xs text-yellow-500">{'★'.repeat(Math.floor(rating))} {rating}</span>
        ) : null}
        <span className="shrink-0 rounded-full px-2 py-0.5 text-xs text-muted">{statusLabels[status]}</span>
      </Link>
      <button
        onClick={() => onDelete(userBook.id)}
        className="shrink-0 rounded p-1.5 text-muted opacity-0 group-hover:opacity-100
                   hover:bg-red-500/10 hover:text-red-500 transition-all"
        title="서재에서 제거"
      >
        <IoTrashOutline size={16} />
      </button>
    </div>
  );
}

export default function BookList() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState('createdAt,desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [localOrder, setLocalOrder] = useState<UserBook[] | null>(null);
  const [bookCategoryMap, setBookCategoryMap] = useState<Record<number, Category[]>>({});

  const { data: categories } = useQuery({
    queryKey: ['myCategories'],
    queryFn: () => categoryApi.getCategories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['myBooks', status, page, sort],
    queryFn: () => bookApi.getMyBooks({ status: status || undefined, page, size: 100, sort: sort === 'custom' ? 'createdAt,desc' : sort }),
  });

  // 각 책의 카테고리 로드
  const allBooks = data?.content ?? [];
  useEffect(() => {
    if (!allBooks.length) return;
    const load = async () => {
      const map: Record<number, Category[]> = {};
      await Promise.all(allBooks.map(async (ub) => {
        try { map[ub.id] = await categoryApi.getBookCategories(ub.id); }
        catch { map[ub.id] = []; }
      }));
      setBookCategoryMap(map);
    };
    load();
  }, [allBooks.length]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookApi.removeFromShelf(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBooks'] });
      toast.success('서재에서 제거되었습니다');
    },
    onError: () => toast.error('제거에 실패했습니다'),
  });

  const handleDelete = useCallback((id: number) => {
    if (confirm('이 책을 서재에서 제거하시겠습니까?')) {
      deleteMutation.mutate(id);
      // 로컬 순서에서도 즉시 제거
      setLocalOrder((prev) => prev ? prev.filter((ub) => ub.id !== id) : null);
    }
  }, [deleteMutation]);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredByCategory = selectedCategory
    ? allBooks.filter((ub) => bookCategoryMap[ub.id]?.some((c) => c.id === selectedCategory))
    : allBooks;
  const items = localOrder ?? filteredByCategory;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentItems = localOrder ?? data?.content ?? [];
    const oldIndex = currentItems.findIndex((ub) => ub.id === active.id);
    const newIndex = currentItems.findIndex((ub) => ub.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(currentItems, oldIndex, newIndex);
      setLocalOrder(newOrder);
      // 사용자 정렬 모드로 자동 전환
      if (sort !== 'custom') setSort('custom');
    }
  }, [localOrder, data?.content, sort]);

  // 서버 정렬 변경 시 로컬 순서 초기화
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(0);
    if (newSort !== 'custom') setLocalOrder(null);
  };

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
              onClick={() => { setStatus(f.value); setPage(0); setLocalOrder(null); }}
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
          onChange={(e) => handleSortChange(e.target.value)}
          className="ml-auto rounded-md border border-border bg-background px-3 py-1 text-sm"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Category filters */}
      {categories && categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => { setSelectedCategory(null); setLocalOrder(null); }}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              !selectedCategory ? 'bg-foreground text-background' : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            전체 카테고리
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(selectedCategory === cat.id ? null : cat.id); setLocalOrder(null); }}
              className="rounded-full px-3 py-1 text-sm text-white transition-opacity"
              style={{
                backgroundColor: cat.color,
                opacity: selectedCategory === cat.id ? 1 : 0.6,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <p className="mb-3 text-xs text-muted">카드를 드래그하여 순서를 변경할 수 있습니다</p>

      {isLoading ? (
        <p className="text-muted">로딩 중...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <span className="text-5xl">📚</span>
          <p className="mt-4 text-lg">서재가 비어있습니다</p>
          <Link to="/books/search" className="mt-2 text-primary hover:underline">
            첫 번째 책을 추가해보세요
          </Link>
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={items.map((ub) => ub.id)}
              strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
            >
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {items.map((ub) => (
                    <SortableBookCard key={ub.id} userBook={ub} onDelete={handleDelete} categories={bookCategoryMap[ub.id] || []} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((ub) => (
                    <BookListRow key={ub.id} userBook={ub} onDelete={handleDelete} categories={bookCategoryMap[ub.id] || []} />
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>

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

      <AdBanner
        adClient="ca-pub-XXXXXXXX"
        adSlot="BOOKLIST_SLOT_ID"
        className="mt-6"
      />
    </div>
  );
}
