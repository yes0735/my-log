import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookApi } from '@/features/books/api';
import { categoryApi, type Category } from '@/features/category/api';
import SortableBookCard from '@/features/books/SortableBookCard';
import AdBanner from '@/components/ads/AdBanner';
import { IoGridOutline, IoListOutline, IoTrashOutline, IoAppsOutline } from 'react-icons/io5';
import type { UserBook } from '@/types/book';
import toast from 'react-hot-toast';

import {
  DndContext, closestCenter, closestCorners, PointerSensor, useSensor, useSensors, type DragEndEvent, useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const statusLabels: Record<string, string> = {
  WANT_TO_READ: '읽고 싶은',
  READING: '읽는 중',
  COMPLETED: '완독',
};

const statusColors: Record<string, string> = {
  WANT_TO_READ: '#3b82f6',
  READING: '#eab308',
  COMPLETED: '#22c55e',
};

const statusFilters = [
  { value: '', label: '전체' },
  { value: 'WANT_TO_READ', label: '읽고 싶은' },
  { value: 'READING', label: '읽는 중' },
  { value: 'COMPLETED', label: '완독' },
];

const sortOptions = [
  { value: 'custom', label: '사용자 순서' },
  { value: 'createdAt,desc', label: '최신순' },
  { value: 'title,asc', label: '제목순' },
  { value: 'rating,desc', label: '별점순' },
];

type ViewMode = 'gallery' | 'table' | 'board';

export default function BookList() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sort, setSort] = useState(() => localStorage.getItem('mylog-book-order') ? 'custom' : 'createdAt,desc');
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [localOrder, setLocalOrder] = useState<UserBook[] | null>(null);
  const [bookCategoryMap, setBookCategoryMap] = useState<Record<number, Category[]>>({});

  const { data: categories } = useQuery({
    queryKey: ['myCategories'],
    queryFn: () => categoryApi.getCategories(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['myBooks', status, 0, sort],
    queryFn: () => bookApi.getMyBooks({ status: status || undefined, page: 0, size: 200, sort: sort === 'custom' ? 'createdAt,desc' : sort }),
  });

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

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => bookApi.updateMyBook(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myBooks'] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => bookApi.removeFromShelf(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBooks'] });
      toast.success('서재에서 제거되었습니다');
    },
  });

  const handleDelete = useCallback((id: number) => {
    if (confirm('이 책을 서재에서 제거하시겠습니까?')) {
      deleteMutation.mutate(id);
      setLocalOrder((prev) => prev ? prev.filter((ub) => ub.id !== id) : null);
    }
  }, [deleteMutation]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredByCategory = selectedCategory
    ? allBooks.filter((ub) => bookCategoryMap[ub.id]?.some((c) => c.id === selectedCategory))
    : allBooks;

  // localStorage에서 저장된 순서 복원
  useEffect(() => {
    if (!allBooks.length || localOrder) return;
    try {
      const saved = localStorage.getItem('mylog-book-order');
      if (saved) {
        const ids: number[] = JSON.parse(saved);
        const ordered = ids.map((id) => allBooks.find((ub) => ub.id === id)).filter(Boolean) as UserBook[];
        // 새로 추가된 책은 뒤에 붙이기
        const remaining = allBooks.filter((ub) => !ids.includes(ub.id));
        if (ordered.length > 0) setLocalOrder([...ordered, ...remaining]);
      }
    } catch { /* ignore */ }
  }, [allBooks.length]);

  // localOrder 변경 시 localStorage에 저장
  useEffect(() => {
    if (localOrder) {
      localStorage.setItem('mylog-book-order', JSON.stringify(localOrder.map((ub) => ub.id)));
    }
  }, [localOrder]);

  const items = localOrder ?? filteredByCategory;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // 보드 뷰: 컬럼에 드롭 → 상태 변경
    if (viewMode === 'board' && String(over.id).startsWith('column-')) {
      const newStatus = String(over.id).replace('column-', '');
      const draggedBook = items.find((ub) => ub.id === active.id);
      if (draggedBook && draggedBook.status !== newStatus) {
        updateStatusMutation.mutate({ id: Number(active.id), status: newStatus });
      }
      return;
    }

    // 보드 뷰: 다른 카드 위에 드롭 → 해당 카드의 상태로 변경
    if (viewMode === 'board') {
      const draggedBook = items.find((ub) => ub.id === active.id);
      const targetBook = items.find((ub) => ub.id === over.id);
      if (draggedBook && targetBook && draggedBook.status !== targetBook.status) {
        updateStatusMutation.mutate({ id: Number(active.id), status: targetBook.status });
        return;
      }
    }

    // 갤러리/테이블: 순서 변경
    if (active.id === over.id) return;
    const currentItems = localOrder ?? filteredByCategory;
    const oldIndex = currentItems.findIndex((ub) => ub.id === active.id);
    const newIndex = currentItems.findIndex((ub) => ub.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setLocalOrder(arrayMove(currentItems, oldIndex, newIndex));
      if (sort !== 'custom') setSort('custom');
    }
  }, [localOrder, filteredByCategory, viewMode, items, updateStatusMutation]);

  return (
    <div>
      {/* 노션 스타일 헤더 */}
      <div className="mb-1 flex items-center gap-2">
        <span className="text-2xl">📚</span>
        <h1 className="text-2xl font-bold">내 서재</h1>
        <span className="ml-1 text-sm text-muted">{items.length}</span>
      </div>

      {/* 뷰 전환 + 필터 + 정렬 + 추가 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border/40 pb-3">
        {/* 뷰 모드 탭 (노션 스타일) */}
        <div className="flex rounded-md border border-border/60 text-xs">
          {([
            { mode: 'gallery' as const, icon: IoGridOutline, label: '갤러리' },
            { mode: 'table' as const, icon: IoListOutline, label: '테이블' },
            { mode: 'board' as const, icon: IoAppsOutline, label: '보드' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); setLocalOrder(null); }}
              className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md ${
                viewMode === mode ? 'bg-black/5 dark:bg-white/5 text-foreground font-medium' : 'text-muted hover:bg-black/[0.02]'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setLocalOrder(null); }}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                status === f.value ? 'bg-primary text-primary-foreground' : 'text-muted hover:bg-black/[0.03]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 카테고리 필터 */}
        {categories && categories.length > 0 && (
          <div className="flex gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(selectedCategory === cat.id ? null : cat.id); setLocalOrder(null); }}
                className="rounded-md px-2 py-1 text-xs text-white transition-opacity"
                style={{ backgroundColor: cat.color, opacity: selectedCategory === cat.id ? 1 : 0.5 }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); if (e.target.value !== 'custom') { setLocalOrder(null); localStorage.removeItem('mylog-book-order'); } }}
            className="rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
          >
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <Link to="/books/search" className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90">
            + 새 책
          </Link>
        </div>
      </div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <p className="text-sm text-muted">로딩 중...</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted">
          <span className="text-5xl">📚</span>
          <p className="mt-4">서재가 비어있습니다</p>
          <Link to="/books/search" className="mt-2 text-sm text-primary hover:underline">첫 번째 책을 추가해보세요</Link>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={viewMode === 'board' ? closestCorners : closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((ub) => ub.id)} strategy={viewMode === 'gallery' ? rectSortingStrategy : verticalListSortingStrategy}>
            {viewMode === 'gallery' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {items.map((ub) => (
                  <SortableBookCard key={ub.id} userBook={ub} onDelete={handleDelete} categories={bookCategoryMap[ub.id] || []} />
                ))}
              </div>
            ) : viewMode === 'table' ? (
              <TableView items={items} bookCategoryMap={bookCategoryMap} onDelete={handleDelete} />
            ) : (
              <BoardView items={items} bookCategoryMap={bookCategoryMap} onDelete={handleDelete} />
            )}
          </SortableContext>
        </DndContext>
      )}

      <AdBanner adClient="ca-pub-XXXXXXXX" adSlot="BOOKLIST_SLOT_ID" className="mt-6" />
    </div>
  );
}

/* ─── 테이블 뷰 (노션 스프레드시트 스타일 — div 기반 sortable) ─── */
function TableView({ items, bookCategoryMap, onDelete }: {
  items: UserBook[]; bookCategoryMap: Record<number, Category[]>; onDelete: (id: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center border-b border-border/40 bg-black/[0.02] dark:bg-white/[0.02] text-xs text-muted">
        <div className="w-12 shrink-0 px-3 py-2"></div>
        <div className="flex-1 px-3 py-2 font-medium">제목</div>
        <div className="w-24 shrink-0 px-3 py-2 font-medium hidden sm:block">저자</div>
        <div className="w-20 shrink-0 px-3 py-2 font-medium">상태</div>
        <div className="w-24 shrink-0 px-3 py-2 font-medium hidden md:block">카테고리</div>
        <div className="w-24 shrink-0 px-3 py-2 font-medium hidden sm:block">진행률</div>
        <div className="w-16 shrink-0 px-3 py-2 font-medium hidden md:block">별점</div>
        <div className="w-8 shrink-0"></div>
      </div>
      {/* Rows */}
      <div>
        {items.map((ub) => <SortableTableRow key={ub.id} ub={ub} cats={bookCategoryMap[ub.id] || []} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

function SortableTableRow({ ub, cats, onDelete }: { ub: UserBook; cats: Category[]; onDelete: (id: number) => void }) {
  const { book, status, rating } = ub;
  const progress = book.totalPages && ub.currentPage ? Math.round((ub.currentPage / book.totalPages) * 100) : 0;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ub.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className="flex items-center border-b border-border/30 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] group transition-colors">
      <div {...listeners} className="w-12 shrink-0 px-3 py-2 cursor-grab active:cursor-grabbing">
        <div className="flex h-10 w-7 items-center justify-center rounded bg-secondary/50">
          {book.coverImageUrl ? <img src={book.coverImageUrl} alt="" className="h-full rounded object-contain" /> : <span className="text-sm">📖</span>}
        </div>
      </div>
      <div className="flex-1 px-3 py-2 min-w-0">
        <Link to={`/books/${ub.id}`} className="text-[13px] font-medium hover:text-primary hover:underline line-clamp-1">{book.title}</Link>
      </div>
      <div className="w-24 shrink-0 px-3 py-2 text-[13px] text-muted hidden sm:block truncate">{book.author}</div>
      <div className="w-20 shrink-0 px-3 py-2">
        <span className="inline-block rounded px-1.5 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: statusColors[status] }}>{statusLabels[status]}</span>
      </div>
      <div className="w-24 shrink-0 px-3 py-2 hidden md:block">
        <div className="flex flex-wrap gap-1">
          {cats.map((c) => <span key={c.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: c.color }}>{c.name}</span>)}
        </div>
      </div>
      <div className="w-24 shrink-0 px-3 py-2 hidden sm:block">
        {status === 'READING' && book.totalPages ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-12 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
            <span className="text-[11px] text-muted">{progress}%</span>
          </div>
        ) : <span className="text-[13px] text-muted">—</span>}
      </div>
      <div className="w-16 shrink-0 px-3 py-2 hidden md:block">
        {rating ? <span className="text-yellow-500 text-xs">★ {rating}</span> : <span className="text-[13px] text-muted">—</span>}
      </div>
      <div className="w-8 shrink-0 px-1">
        <button onClick={() => onDelete(ub.id)}
          className="rounded p-1 text-muted opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all">
          <IoTrashOutline size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── 보드 뷰 (노션 칸반 스타일 — sortable) ─── */
function BoardView({ items, bookCategoryMap, onDelete }: {
  items: UserBook[]; bookCategoryMap: Record<number, Category[]>; onDelete: (id: number) => void;
}) {
  const columns: { key: string; label: string; color: string }[] = [
    { key: 'WANT_TO_READ', label: '읽고 싶은', color: statusColors.WANT_TO_READ },
    { key: 'READING', label: '읽는 중', color: statusColors.READING },
    { key: 'COMPLETED', label: '완독', color: statusColors.COMPLETED },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <DroppableColumn key={col.key} id={`column-${col.key}`} color={col.color} label={col.label}>
          {items.filter((ub) => ub.status === col.key).map((ub) => (
            <SortableBoardCard key={ub.id} ub={ub} cats={bookCategoryMap[ub.id] || []} onDelete={onDelete} />
          ))}
          {items.filter((ub) => ub.status === col.key).length === 0 && (
            <p className="py-8 text-center text-xs text-muted">여기에 드래그하여 상태 변경</p>
          )}
        </DroppableColumn>
      ))}
    </div>
  );
}

function DroppableColumn({ id, color, label, children }: { id: string; color: string; label: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef}
      className={`w-72 shrink-0 rounded-lg p-2 transition-colors ${isOver ? 'bg-primary/5 ring-2 ring-primary/30' : 'bg-black/[0.02] dark:bg-white/[0.02]'}`}>
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      <div className="min-h-[100px] space-y-2">{children}</div>
    </div>
  );
}

function SortableBoardCard({ ub, cats, onDelete }: { ub: UserBook; cats: Category[]; onDelete: (id: number) => void }) {
  const { book, rating } = ub;
  const progress = book.totalPages && ub.currentPage ? Math.round((ub.currentPage / book.totalPages) * 100) : 0;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ub.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="rounded-lg border border-border/40 bg-card p-3 transition-shadow hover:shadow-md group/card cursor-grab active:cursor-grabbing">
      <Link to={`/books/${ub.id}`} className="block">
        <div className="flex gap-2.5">
          <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-secondary/50">
            {book.coverImageUrl ? <img src={book.coverImageUrl} alt="" className="h-full rounded object-contain" /> : <span className="text-lg">📖</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="line-clamp-2 text-[13px] font-medium">{book.title}</p>
            <p className="text-[11px] text-muted">{book.author}</p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(ub.id); }}
            className="shrink-0 self-start rounded p-0.5 text-muted opacity-0 group-hover/card:opacity-100 hover:text-red-500 transition-all">
            <IoTrashOutline size={12} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {cats.map((c) => <span key={c.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: c.color }}>{c.name}</span>)}
          {rating && <span className="text-[11px] text-yellow-500">★ {rating}</span>}
        </div>
        {ub.status === 'READING' && progress > 0 && (
          <div className="mt-2">
            <div className="h-1 w-full rounded-full bg-secondary">
              <div className="h-1 rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-0.5 text-right text-[10px] text-muted">{progress}%</p>
          </div>
        )}
      </Link>
    </div>
  );
}
