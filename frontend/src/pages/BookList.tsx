import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookApi } from '@/features/books/api';
import { categoryApi, type Category } from '@/features/category/api';
import SortableBookCard from '@/features/books/SortableBookCard';
import CalendarView from '@/features/books/calendar/CalendarView';
import AdBanner from '@/components/ads/AdBanner';
import type { UserBook } from '@/types/book';
import toast from 'react-hot-toast';

import {
  DndContext, closestCenter, closestCorners, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, useDroppable,
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

type ViewMode = 'gallery' | 'table' | 'board' | 'calendar';
const VIEW_MODES: readonly ViewMode[] = ['gallery', 'table', 'board', 'calendar'] as const;

// 공용 드롭다운 훅 — 외부 클릭 / ESC로 자동 닫힘
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const tid = setTimeout(() => document.addEventListener('mousedown', onMouseDown), 0);
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(tid);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  return { open, setOpen, ref };
}

export default function BookList() {
  const qc = useQueryClient();
  // Design Ref: §6.4 — URL search params로 뷰/필터 상태 유지 (뒤로가기 시 복원)
  const [searchParams, setSearchParams] = useSearchParams();

  const status = searchParams.get('status') ?? '';
  // 태그(기존 카테고리) 멀티셀렉트. URL: `?tags=3,5,7`. 구 파라미터 `cat`은 backward compat.
  const selectedTags: number[] = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      return tagsParam.split(',').map(Number).filter((n) => Number.isFinite(n));
    }
    // 구 파라미터 `cat` backward compat
    const legacyCat = searchParams.get('cat');
    if (legacyCat) {
      const n = Number(legacyCat);
      return Number.isFinite(n) ? [n] : [];
    }
    return [];
  }, [searchParams]);
  const field = searchParams.get('field') ?? ''; // 알라딘 2-depth 분야 필터 (e.g. "국내도서>소설/시/희곡", "__none__")
  const viewModeParam = searchParams.get('view');
  const viewMode: ViewMode = VIEW_MODES.includes(viewModeParam as ViewMode)
    ? (viewModeParam as ViewMode)
    : 'gallery';

  const updateParam = useCallback((key: string, value: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
      // 구 파라미터 정리
      if (key === 'tags') next.delete('cat');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setStatus = useCallback((value: string) => updateParam('status', value), [updateParam]);
  // 단일 태그 선택/해제 토글 (AND 멀티셀렉트)
  const toggleTag = useCallback(
    (id: number) => {
      const next = selectedTags.includes(id)
        ? selectedTags.filter((t) => t !== id)
        : [...selectedTags, id];
      updateParam('tags', next.length > 0 ? next.join(',') : null);
    },
    [selectedTags, updateParam],
  );
  const setField = useCallback((value: string) => updateParam('field', value || null), [updateParam]);
  const setViewMode = useCallback(
    (value: ViewMode) => updateParam('view', value === 'gallery' ? null : value),
    [updateParam],
  );

  // 커스텀 드롭다운 — 태그(멀티), 분야(단일), 정렬(단일) 공용 훅 사용
  const tagDropdown = useDropdown();
  const fieldDropdown = useDropdown();
  const sortDropdown = useDropdown();

  const [sort, setSort] = useState(() => localStorage.getItem('mylog-book-order') ? 'custom' : 'createdAt,desc');
  // customOrder: 전역 책 순서 (ID 배열). filteredByCategory를 이 순서로 정렬.
  // localOrder(UserBook[]) 대신 ID 배열만 저장 → 필터/정렬 변경에 robust
  const [customOrder, setCustomOrder] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('mylog-book-order');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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
      setCustomOrder((prev) => prev.filter((pid) => pid !== id));
    }
  }, [deleteMutation]);

  // 데스크톱: 마우스 8px 이동 시 드래그 시작
  // 모바일: 200ms 길게 누르면 드래그 시작 (스크롤과 충돌 없음, iOS 스타일)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // 알라딘 originalCategory를 2-depth로 정규화 ("국내도서>소설/시/희곡>한국소설" → "국내도서>소설/시/희곡")
  const to2Depth = useCallback((path?: string | null): string | null => {
    if (!path) return null;
    const parts = path.split('>').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];
    return `${parts[0]}>${parts[1]}`;
  }, []);

  // 분야 드롭다운 옵션 (전체 로드된 책 기준으로 집계 + 카운트)
  const fieldOptions = useMemo(() => {
    const counts = new Map<string, number>();
    let noneCount = 0;
    for (const ub of allBooks) {
      const f = to2Depth(ub.book.originalCategory);
      if (!f) noneCount++;
      else counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return { entries: sorted, noneCount, total: allBooks.length };
  }, [allBooks, to2Depth]);

  // 태그(멀티셀렉트 AND) + 분야 AND 결합 필터
  const filteredByCategory = useMemo(() => {
    return allBooks.filter((ub) => {
      // 태그 멀티셀렉트 필터 (선택된 모든 태그를 가진 책만 — AND)
      if (selectedTags.length > 0) {
        const bookTagIds = new Set((bookCategoryMap[ub.id] ?? []).map((c) => c.id));
        if (!selectedTags.every((t) => bookTagIds.has(t))) return false;
      }
      // 알라딘 분야 필터
      if (field) {
        const ubField = to2Depth(ub.book.originalCategory);
        if (field === '__none__') {
          if (ubField !== null) return false;
        } else if (ubField !== field) {
          return false;
        }
      }
      return true;
    });
  }, [allBooks, selectedTags, bookCategoryMap, field, to2Depth]);

  // customOrder 변경 시 localStorage에 저장 (빈 배열이면 키 제거)
  useEffect(() => {
    if (customOrder.length > 0) {
      localStorage.setItem('mylog-book-order', JSON.stringify(customOrder));
    } else {
      localStorage.removeItem('mylog-book-order');
    }
  }, [customOrder]);

  // Derived: filteredByCategory를 customOrder 기준으로 재정렬 (custom sort일 때만)
  // customOrder에 없는 책(새로 추가된 책)은 뒤쪽으로 밀림
  const items = useMemo(() => {
    if (sort !== 'custom' || customOrder.length === 0) {
      return filteredByCategory;
    }
    const orderMap = new Map<number, number>();
    customOrder.forEach((id, idx) => orderMap.set(id, idx));
    return [...filteredByCategory].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });
  }, [filteredByCategory, customOrder, sort]);

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

    // 갤러리/테이블: 순서 변경 (customOrder 기반)
    if (active.id === over.id) return;
    const oldIdx = items.findIndex((ub) => ub.id === active.id);
    const newIdx = items.findIndex((ub) => ub.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reorderedVisible = arrayMove(items, oldIdx, newIdx);
    const reorderedIds = reorderedVisible.map((ub) => ub.id);
    const visibleIdSet = new Set(items.map((ub) => ub.id));

    // seed: 기존 customOrder, 비어있으면 allBooks 순서로 초기화
    const seed = customOrder.length > 0 ? customOrder : allBooks.map((b) => b.id);

    // 새 전역 순서 빌드:
    // - seed 순회하며 visible IDs는 reorderedIds 순서로 대체, non-visible은 제자리
    // - seed에 없는 책(새 책)은 allBooks 끝에 append
    const newOrder: number[] = [];
    const seen = new Set<number>();
    let vIdx = 0;

    for (const id of seed) {
      if (visibleIdSet.has(id)) {
        while (vIdx < reorderedIds.length) {
          const nid = reorderedIds[vIdx++];
          if (!seen.has(nid)) {
            newOrder.push(nid);
            seen.add(nid);
            break;
          }
        }
      } else if (!seen.has(id)) {
        newOrder.push(id);
        seen.add(id);
      }
    }
    // 남은 reorderedIds 추가 (seed에 없던 경우)
    while (vIdx < reorderedIds.length) {
      const nid = reorderedIds[vIdx++];
      if (!seen.has(nid)) {
        newOrder.push(nid);
        seen.add(nid);
      }
    }
    // 남은 allBooks 추가 (새로 로드된 책)
    for (const b of allBooks) {
      if (!seen.has(b.id)) {
        newOrder.push(b.id);
        seen.add(b.id);
      }
    }

    setCustomOrder(newOrder);
    if (sort !== 'custom') setSort('custom');
  }, [items, customOrder, allBooks, viewMode, sort, updateStatusMutation]);

  return (
    <div>
      {/* 노션 스타일 헤더 */}
      <div className="mb-1 flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">내 서재</h1>
        <span className="text-sm text-muted">{items.length}</span>
      </div>

      {/* 뷰 전환 + 필터 + 정렬 + 추가 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border/40 pb-3">
        {/* 뷰 모드 탭 (노션 스타일, 아이콘 제거) */}
        <div className="flex rounded-md border border-border/60 text-xs">
          {([
            { mode: 'gallery' as const, label: '갤러리' },
            { mode: 'table' as const, label: '테이블' },
            { mode: 'board' as const, label: '보드' },
            { mode: 'calendar' as const, label: '캘린더' },
          ]).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 transition-colors first:rounded-l-md last:rounded-r-md ${
                viewMode === mode ? 'bg-black/5 dark:bg-white/5 text-foreground font-medium' : 'text-muted hover:bg-black/[0.02]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 상태 필터 */}
        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={`rounded-md px-2 py-1 text-xs transition-colors ${
                status === f.value ? 'bg-primary text-primary-foreground' : 'text-muted hover:bg-black/[0.03]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* 태그 필터 드롭다운 (멀티셀렉트 AND) */}
          {categories && categories.length > 0 && (
            <div ref={tagDropdown.ref} className="relative">
              <button
                type="button"
                onClick={() => tagDropdown.setOpen((v) => !v)}
                aria-expanded={tagDropdown.open}
                className={`flex items-center gap-1 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
                  selectedTags.length > 0 ? 'text-foreground font-medium' : 'text-muted'
                }`}
              >
                <span>태그{selectedTags.length > 0 ? ` (${selectedTags.length})` : ''}</span>
                <span className="text-[10px] opacity-60">▾</span>
              </button>
              {tagDropdown.open && (
                <div
                  role="dialog"
                  className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-border/60 bg-background p-1 shadow-lg"
                >
                  <div className="max-h-64 overflow-y-auto">
                    {categories.map((cat) => {
                      const active = selectedTags.includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleTag(cat.id)}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                        >
                          <span
                            className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                              active ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                            }`}
                          >
                            {active && <span className="text-[9px] leading-none">✓</span>}
                          </span>
                          <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="flex-1 truncate">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedTags.length > 0 && (
                    <>
                      <div className="my-1 h-px bg-border/40" />
                      <button
                        type="button"
                        onClick={() => updateParam('tags', null)}
                        className="w-full rounded px-2 py-1.5 text-left text-[11px] text-muted hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                      >
                        전체 해제
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 알라딘 분야 필터 드롭다운 (단일 선택) */}
          {(fieldOptions.entries.length > 0 || fieldOptions.noneCount > 0) && (
            <div ref={fieldDropdown.ref} className="relative">
              <button
                type="button"
                onClick={() => fieldDropdown.setOpen((v) => !v)}
                aria-expanded={fieldDropdown.open}
                className={`flex max-w-[200px] items-center gap-1 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
                  field ? 'text-foreground font-medium' : 'text-muted'
                }`}
              >
                <span className="truncate">
                  {field === ''
                    ? '분야'
                    : field === '__none__'
                      ? '분야 없음'
                      : field.replace(/>/g, ' › ')}
                </span>
                <span className="shrink-0 text-[10px] opacity-60">▾</span>
              </button>
              {fieldDropdown.open && (
                <div
                  role="dialog"
                  className="absolute right-0 top-full z-30 mt-1 w-64 rounded-lg border border-border/60 bg-background p-1 shadow-lg"
                >
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setField(''); fieldDropdown.setOpen(false); }}
                      className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
                        field === '' ? 'bg-black/[0.04] dark:bg-white/[0.04] font-medium' : ''
                      }`}
                    >
                      <span>분야 전체</span>
                      <span className="text-[10px] text-muted">{fieldOptions.total}</span>
                    </button>
                    {fieldOptions.entries.map(([key, count]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setField(key); fieldDropdown.setOpen(false); }}
                        className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
                          field === key ? 'bg-black/[0.04] dark:bg-white/[0.04] font-medium' : ''
                        }`}
                      >
                        <span className="truncate">{key.replace(/>/g, ' › ')}</span>
                        <span className="shrink-0 text-[10px] text-muted">{count}</span>
                      </button>
                    ))}
                    {fieldOptions.noneCount > 0 && (
                      <button
                        type="button"
                        onClick={() => { setField('__none__'); fieldDropdown.setOpen(false); }}
                        className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
                          field === '__none__' ? 'bg-black/[0.04] dark:bg-white/[0.04] font-medium' : ''
                        }`}
                      >
                        <span>분야 없음</span>
                        <span className="text-[10px] text-muted">{fieldOptions.noneCount}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 정렬 드롭다운 (단일 선택) */}
          <div ref={sortDropdown.ref} className="relative">
            <button
              type="button"
              onClick={() => { if (viewMode !== 'calendar') sortDropdown.setOpen((v) => !v); }}
              disabled={viewMode === 'calendar'}
              title={viewMode === 'calendar' ? '캘린더는 날짜 기준 고정' : undefined}
              aria-expanded={sortDropdown.open}
              className="flex items-center gap-1 rounded-md border border-border/60 bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:text-muted disabled:opacity-50"
            >
              <span>{sortOptions.find((o) => o.value === sort)?.label ?? '정렬'}</span>
              <span className="text-[10px] opacity-60">▾</span>
            </button>
            {sortDropdown.open && (
              <div
                role="dialog"
                className="absolute right-0 top-full z-30 mt-1 w-44 rounded-lg border border-border/60 bg-background p-1 shadow-lg"
              >
                {sortOptions.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      setSort(o.value);
                      // customOrder는 유지 — 사용자 순서로 다시 돌아왔을 때 드래그 순서 복원 가능
                      sortDropdown.setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03] ${
                      sort === o.value ? 'bg-black/[0.04] dark:bg-white/[0.04] font-medium' : ''
                    }`}
                  >
                    <span>{o.label}</span>
                    {sort === o.value && <span className="text-[10px] opacity-60">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/books/search" className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90">
            + 새 책
          </Link>
        </div>
      </div>

      {/* 콘텐츠 */}
      {isLoading ? (
        <p className="text-sm text-muted">로딩 중...</p>
      ) : viewMode === 'calendar' ? (
        // Design Ref: §6.4 — 캘린더 뷰는 DnD/SortableContext 미사용
        <CalendarView
          books={filteredByCategory}
          statusFilter={status}
          onResetStatusFilter={() => setStatus('')}
        />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-border/60 py-16 text-muted">
          <p className="text-sm font-medium">서재가 비어있습니다</p>
          <Link to="/books/search" className="mt-2 text-xs text-primary hover:underline">첫 번째 책을 추가해보세요</Link>
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
        <div className="w-24 shrink-0 px-3 py-2 font-medium hidden md:block">태그</div>
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
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const, // 모바일 스크롤 충돌 방지 (TouchSensor delay 기반 활성)
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="flex items-center border-b border-border/30 hover:bg-black/[0.015] dark:hover:bg-white/[0.015] group transition-colors cursor-grab active:cursor-grabbing">
      <div className="w-12 shrink-0 px-3 py-2">
        <div className="h-10 w-7 overflow-hidden rounded bg-secondary/50">
          {book.coverImageUrl && <img src={book.coverImageUrl} alt="" className="h-full w-full rounded object-contain" />}
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
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(ub.id); }}
          aria-label="삭제"
          className="rounded px-1.5 text-sm leading-none text-muted opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          ×
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
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const, // 모바일 스크롤 충돌 방지
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="rounded-lg border border-border/40 bg-card p-3 transition-shadow hover:shadow-md group/card cursor-grab active:cursor-grabbing">
      <Link to={`/books/${ub.id}`} className="block">
        <div className="flex gap-2.5">
          <div className="h-16 w-11 shrink-0 overflow-hidden rounded bg-secondary/50">
            {book.coverImageUrl && <img src={book.coverImageUrl} alt="" className="h-full w-full rounded object-contain" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="line-clamp-2 text-[13px] font-medium">{book.title}</p>
            <p className="text-[11px] text-muted">{book.author}</p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(ub.id); }}
            aria-label="삭제"
            className="shrink-0 self-start rounded px-1 text-sm leading-none text-muted opacity-0 group-hover/card:opacity-100 hover:text-red-500 transition-all">
            ×
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
