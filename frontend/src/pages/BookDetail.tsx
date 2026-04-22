import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookApi } from '@/features/books/api';
import { categoryApi } from '@/features/category/api';
import RecordList from '@/features/records/RecordList';
import { reviewApi } from '@/features/reviews/api';
import ReviewEditor from '@/features/reviews/ReviewEditor';
import { highlightApi } from '@/features/highlight/api';
import { timerApi } from '@/features/timer/api';
import type { ReadingSession } from '@/features/timer/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusLabels: Record<string, string> = {
  WANT_TO_READ: '읽고 싶은',
  READING: '읽는 중',
  COMPLETED: '완독',
};

type Tab = 'records' | 'reviews' | 'highlights' | 'info';

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('records');
  const [showReviewEditor, setShowReviewEditor] = useState(false);

  // Highlight state
  const [hlPage, setHlPage] = useState('');
  const [hlContent, setHlContent] = useState('');
  const [hlMemo, setHlMemo] = useState('');

  // Timer state
  const [activeSession, setActiveSession] = useState<ReadingSession | null>(null);
  const [elapsed, setElapsed] = useState(0);


  // 카테고리 상태
  const [showCategoryAdd, setShowCategoryAdd] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { data: userBook, isLoading } = useQuery({
    queryKey: ['myBook', id],
    queryFn: () => bookApi.getMyBook(Number(id)),
    enabled: !!id,
  });

  const { data: bookCategories = [] } = useQuery({
    queryKey: ['bookCategories', id],
    queryFn: () => categoryApi.getBookCategories(Number(id)),
    enabled: !!id,
  });

  const { data: allCategories = [] } = useQuery({
    queryKey: ['myCategories'],
    queryFn: () => categoryApi.getCategories(),
  });

  const updateBookInfoMutation = useMutation({
    mutationFn: (data: { title?: string; author?: string; publisher?: string; totalPages?: number; description?: string }) =>
      bookApi.updateBook(userBook!.book.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBook', id] });
      qc.invalidateQueries({ queryKey: ['myBooks'] });
    },
  });

  const addCatMutation = useMutation({
    mutationFn: (categoryId: number) => categoryApi.addCategoryToBook(Number(id), categoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookCategories', id] }),
  });

  const removeCatMutation = useMutation({
    mutationFn: (categoryId: number) => categoryApi.removeCategoryFromBook(Number(id), categoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookCategories', id] }),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (categoryId: number) => categoryApi.deleteCategory(categoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myCategories'] });
      qc.invalidateQueries({ queryKey: ['bookCategories', id] });
    },
  });

  const [showCatDropdown, setShowCatDropdown] = useState(false);

  const CATEGORY_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#0ea5e9', '#10b981', '#a855f7', '#d946ef', '#64748b',
  ];

  const createCatLock = useRef(false);
  const createCatMutation = useMutation({
    mutationFn: async (name: string) => {
      if (createCatLock.current) throw new Error('duplicate');
      createCatLock.current = true;
      const color = CATEGORY_COLORS[(allCategories.length) % CATEGORY_COLORS.length];
      return categoryApi.createCategory({ name, color });
    },
    onSuccess: async (cat) => {
      qc.invalidateQueries({ queryKey: ['myCategories'] });
      await categoryApi.addCategoryToBook(Number(id), cat.id);
      qc.invalidateQueries({ queryKey: ['bookCategories', id] });
      setNewCategoryName('');
      setShowCategoryAdd(false);
    },
    onSettled: () => { createCatLock.current = false; },
  });

  const handleCreateCategory = useCallback((name: string) => {
    if (!name.trim() || createCatLock.current) return;
    createCatMutation.mutate(name.trim());
  }, [createCatMutation]);


  const { data: reviews } = useQuery({
    queryKey: ['bookReviews', id],
    queryFn: () => reviewApi.getByBook(Number(id)),
    enabled: tab === 'reviews',
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; rating?: number; currentPage?: number; startDate?: string; endDate?: string }) =>
      bookApi.updateMyBook(Number(id), data),
    onSuccess: (_data, variables) => {
      if ('currentPage' in variables && Object.keys(variables).length === 1) {
        // 진행률만 변경 → 캐시 직접 업데이트 (refetch 없이)
        qc.setQueryData(['myBook', id], (old: any) =>
          old ? { ...old, currentPage: variables.currentPage } : old
        );
      } else {
        qc.invalidateQueries({ queryKey: ['myBook', id] });
        qc.invalidateQueries({ queryKey: ['myBooks'] });
      }
    },
  });

  // 진행률 슬라이더 debounce — 드래그 중에는 로컬 상태만 변경, 멈추면 API 호출
  const [localPage, setLocalPage] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePageChange = useCallback((value: number) => {
    setLocalPage(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      updateMutation.mutate({ currentPage: value }, {
        onSettled: () => setLocalPage(null),
      });
    }, 500);
  }, [updateMutation]);

  const deleteMutation = useMutation({
    mutationFn: () => bookApi.removeFromShelf(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBooks'] });
      toast.success('서재에서 제거되었습니다');
      navigate('/books');
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (data: { title: string; content: string; isPublic: boolean }) =>
      reviewApi.create(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookReviews', id] });
      toast.success('독후감이 작성되었습니다');
      setShowReviewEditor(false);
    },
    onError: () => toast.error('작성에 실패했습니다'),
  });

  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: number) => reviewApi.delete(reviewId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookReviews', id] });
      toast.success('독후감이 삭제되었습니다');
    },
  });

  // — Highlight queries & mutations —
  const { data: highlights } = useQuery({
    queryKey: ['highlights', id],
    queryFn: () => highlightApi.getHighlights(Number(id)),
    enabled: tab === 'highlights',
  });

  const createHighlightMutation = useMutation({
    mutationFn: (data: { pageNumber?: number; content: string; memo?: string }) =>
      highlightApi.createHighlight(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['highlights', id] });
      toast.success('하이라이트가 추가되었습니다');
      setHlPage('');
      setHlContent('');
      setHlMemo('');
    },
    onError: () => toast.error('하이라이트 추가에 실패했습니다'),
  });

  const deleteHighlightMutation = useMutation({
    mutationFn: (highlightId: number) => highlightApi.deleteHighlight(highlightId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['highlights', id] });
      toast.success('하이라이트가 삭제되었습니다');
    },
  });

  // — Timer queries & mutations —
  const { data: sessions } = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => timerApi.getSessions(Number(id)),
    enabled: !!id,
  });

  const startSessionMutation = useMutation({
    mutationFn: () => timerApi.startSession(Number(id)),
    onSuccess: (session) => {
      setActiveSession(session);
      setElapsed(0);
      toast.success('독서 타이머를 시작합니다');
    },
    onError: () => toast.error('타이머 시작에 실패했습니다'),
  });

  const stopSessionMutation = useMutation({
    mutationFn: (data: { sessionId: number; pagesRead?: number }) =>
      timerApi.stopSession(Number(id), data.sessionId, { pagesRead: data.pagesRead }),
    onSuccess: () => {
      setActiveSession(null);
      setElapsed(0);
      qc.invalidateQueries({ queryKey: ['sessions', id] });
      toast.success('독서 기록이 저장되었습니다');
    },
    onError: () => toast.error('타이머 종료에 실패했습니다'),
  });

  // Timer tick
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const startMs = new Date(activeSession.startTime).getTime();
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStopSession = useCallback(() => {
    if (!activeSession) return;
    const input = window.prompt('읽은 페이지 수를 입력하세요 (선택사항)');
    const pagesRead = input ? parseInt(input, 10) : undefined;
    stopSessionMutation.mutate({
      sessionId: activeSession.id,
      pagesRead: pagesRead && !isNaN(pagesRead) ? pagesRead : undefined,
    });
  }, [activeSession, stopSessionMutation]);

  const handleSubmitHighlight = useCallback(() => {
    if (!hlContent.trim()) {
      toast.error('하이라이트 내용을 입력하세요');
      return;
    }
    createHighlightMutation.mutate({
      pageNumber: hlPage ? parseInt(hlPage, 10) : undefined,
      content: hlContent.trim(),
      memo: hlMemo.trim() || undefined,
    });
  }, [hlPage, hlContent, hlMemo, createHighlightMutation]);

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 인라인 편집 — blur 시 자동 저장 (Hook은 early return 위에 선언)
  const handleInlineSave = useCallback((field: string, value: string) => {
    if (!userBook) return;
    const current = userBook.book as any;
    if (current[field] === value) return;
    const data: any = {};
    if (field === 'totalPages') {
      const num = parseInt(value);
      if (isNaN(num) && !value) return;
      data[field] = num || undefined;
    } else {
      data[field] = value || undefined;
    }
    updateBookInfoMutation.mutate(data);
  }, [userBook, updateBookInfoMutation]);

  if (isLoading) return <p className="text-muted">로딩 중...</p>;
  if (!userBook) return <p className="text-muted">책을 찾을 수 없습니다</p>;

  const { book, status, rating, currentPage, startDate, endDate } = userBook;
  const displayPage = localPage ?? currentPage;
  // Plan SC: SC-09 — 결측 배너 조건 (READING이면 startDate, COMPLETED면 둘 다)
  const needsDateGuide =
    (status === 'READING' && !startDate) ||
    (status === 'COMPLETED' && (!startDate || !endDate));
  const progress = book.totalPages && displayPage
    ? Math.round((displayPage / book.totalPages) * 100)
    : 0;

  const statusColorMap: Record<string, string> = {
    WANT_TO_READ: '#3b82f6', READING: '#eab308', COMPLETED: '#22c55e',
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* 뒤로가기 */}
      <button onClick={() => navigate(-1)} className="mb-3 text-[13px] text-muted hover:text-foreground">
        ← 이전 페이지
      </button>

      {/* Plan SC: SC-09 — 결측 날짜 가이드 배너 */}
      {needsDateGuide && (
        <div className="mb-3 flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-[13px]">
          <span className="flex-1">
            {status === 'READING'
              ? '읽기 시작일을 입력하면 캘린더 뷰에서 이 책을 확인할 수 있어요.'
              : '시작일/완독일을 입력하면 캘린더 뷰에서 이 책의 독서 여정을 확인할 수 있어요.'}
          </span>
          <span className="text-xs text-muted">↓ 아래에서 입력</span>
        </div>
      )}

      {/* 노션 커버 영역 */}
      <div className="relative mb-16 flex h-36 items-end rounded-xl bg-gradient-to-br from-primary/10 via-secondary/30 to-primary/5 sm:h-44">
        <div className="absolute -bottom-12 left-6 h-32 w-[5.5rem] overflow-hidden rounded-lg border border-border/40 bg-secondary/30 shadow-lg sm:h-40 sm:w-28">
          {book.coverImageUrl && (
            <img src={book.coverImageUrl} alt={book.title} className="h-full w-full rounded-lg object-contain" />
          )}
        </div>
        <div className="absolute right-4 top-4">
          <button onClick={() => { if (confirm('이 책을 서재에서 제거하시겠습니까?')) deleteMutation.mutate(); }}
            className="rounded-md bg-card/80 px-2.5 py-1 text-[11px] text-destructive backdrop-blur-sm hover:bg-card">제거</button>
        </div>
      </div>

      {/* 제목 — 인라인 편집 */}
      <input
        defaultValue={book.title}
        onBlur={(e) => handleInlineSave('title', e.target.value)}
        className="w-full border-none bg-transparent text-2xl font-bold outline-none placeholder:text-muted focus:bg-secondary/30 rounded px-1 -ml-1"
        placeholder="제목"
      />

      {/* 노션 프로퍼티 블록 */}
      <div className="mt-4 space-y-0 divide-y divide-border/30 rounded-lg border border-border/40 bg-black/[0.01] dark:bg-white/[0.01]">
        {/* 저자 */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 text-xs text-muted">저자</span>
          <input defaultValue={book.author} onBlur={(e) => handleInlineSave('author', e.target.value)}
            className="flex-1 border-none bg-transparent text-[13px] outline-none focus:bg-secondary/30 rounded px-1 -ml-1" />
        </div>
        {/* 출판사 */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 text-xs text-muted">출판사</span>
          <input defaultValue={book.publisher || ''} onBlur={(e) => handleInlineSave('publisher', e.target.value)}
            placeholder="없음" className="flex-1 border-none bg-transparent text-[13px] outline-none focus:bg-secondary/30 rounded px-1 -ml-1" />
        </div>
        {/* 알라딘 분야 — 읽기 전용, > 구분자를 시각적 chevron으로 변환 */}
        {book.originalCategory && (
          <div className="flex items-center gap-4 px-4 py-2.5">
            <span className="w-20 shrink-0 text-xs text-muted">분야</span>
            <div className="flex flex-1 flex-wrap items-center gap-1 text-[13px] text-muted">
              {book.originalCategory.split('>').map((segment, i, arr) => (
                <span key={i} className="flex items-center gap-1">
                  <span>{segment.trim()}</span>
                  {i < arr.length - 1 && <span className="text-muted/50">›</span>}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* 총 페이지 */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 text-xs text-muted">페이지</span>
          <input type="number" defaultValue={book.totalPages || ''} onBlur={(e) => handleInlineSave('totalPages', e.target.value)}
            placeholder="0" className="w-24 border-none bg-transparent text-[13px] outline-none focus:bg-secondary/30 rounded px-1 -ml-1" />
        </div>
        {/* 상태 */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 text-xs text-muted">상태</span>
          <select value={status} onChange={(e) => updateMutation.mutate({ status: e.target.value })}
            className="rounded border-none bg-transparent text-[13px] font-medium outline-none" style={{ color: statusColorMap[status] }}>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {/* Plan SC: SC-09 — 읽기 시작일 */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 text-xs text-muted">시작일</span>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => updateMutation.mutate({ startDate: e.target.value })}
            className="rounded border-none bg-transparent text-[13px] outline-none focus:bg-secondary/30 px-1 -ml-1"
          />
        </div>
        {/* Plan SC: SC-09 — 완독일 */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 text-xs text-muted">완독일</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => updateMutation.mutate({ endDate: e.target.value })}
            className="rounded border-none bg-transparent text-[13px] outline-none focus:bg-secondary/30 px-1 -ml-1"
          />
        </div>
        {/* 별점 */}
        <div className="flex items-center gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 text-xs text-muted">별점</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => updateMutation.mutate({ rating: v })}
                className={`text-lg transition-colors ${rating && rating >= v ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}>★</button>
            ))}
            {rating && <span className="ml-1 self-center text-xs text-muted">{rating}</span>}
          </div>
        </div>
        {/* 태그 (구: 카테고리 — 내부 식별자/API는 Category 유지) */}
        <div className="flex items-start gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 pt-0.5 text-xs text-muted">태그</span>
          <div className="flex flex-1 flex-wrap items-center gap-1.5">
            {bookCategories.map((cat) => (
              <span key={cat.id} className="group/cat inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-white"
                style={{ backgroundColor: cat.color }}>
                {cat.name}
                <button onClick={() => removeCatMutation.mutate(cat.id)}
                  className="opacity-0 group-hover/cat:opacity-100 hover:opacity-70 transition-opacity">×</button>
              </span>
            ))}
            {showCatDropdown && <div className="fixed inset-0 z-20" onClick={() => setShowCatDropdown(false)} />}
            <div className="relative">
              <button type="button" onClick={() => setShowCatDropdown(!showCatDropdown)}
                className="rounded border border-dashed border-border px-1.5 py-0.5 text-[11px] text-muted hover:bg-secondary">+ 추가</button>
              {showCatDropdown && (
                <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-lg border border-border bg-card p-1 shadow-lg">
                  {allCategories.map((c) => {
                    const on = bookCategories.some((bc) => bc.id === c.id);
                    return (
                      <div key={c.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-secondary">
                        <button type="button" onClick={() => { if (!on) addCatMutation.mutate(c.id); }}
                          className={`flex items-center gap-1.5 text-[11px] ${on ? 'text-muted' : ''}`}>
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />{c.name}{on && ' ✓'}
                        </button>
                        <button type="button" onClick={() => { if (confirm(`"${c.name}" 삭제?`)) deleteCatMutation.mutate(c.id); }}
                          className="text-[10px] text-destructive hover:underline">삭제</button>
                      </div>
                    );
                  })}
                  <button type="button" onClick={() => setShowCatDropdown(false)}
                    className="mt-1 w-full rounded px-2 py-1 text-[11px] text-muted hover:bg-secondary">닫기</button>
                </div>
              )}
            </div>
            {showCategoryAdd ? (
              <div className="flex items-center gap-1">
                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(newCategoryName); } }}
                  placeholder="새 태그" autoFocus className="w-24 rounded border border-border bg-background px-1.5 py-0.5 text-[11px]" />
                <button type="button" disabled={createCatMutation.isPending} onClick={() => handleCreateCategory(newCategoryName)}
                  className="text-[11px] text-primary">확인</button>
                <button type="button" onClick={() => { setShowCategoryAdd(false); setNewCategoryName(''); }}
                  className="text-[11px] text-muted">취소</button>
              </div>
            ) : (
              <button onClick={() => setShowCategoryAdd(true)} className="text-[11px] text-muted hover:text-foreground">+ 새로 만들기</button>
            )}
          </div>
        </div>
        {/* 진행률 */}
        {status === 'READING' && book.totalPages && (
          <div className="flex items-center gap-4 px-4 py-2.5">
            <span className="w-20 shrink-0 text-xs text-muted">진행률</span>
            <div className="flex flex-1 items-center gap-3">
              <input type="range" min={0} max={book.totalPages} value={displayPage || 0}
                onChange={(e) => handlePageChange(parseInt(e.target.value))} className="h-1.5 flex-1" />
              <span className="text-[12px] text-muted">{displayPage}/{book.totalPages} ({progress}%)</span>
            </div>
          </div>
        )}
        {/* 책 소개 */}
        <div className="flex items-start gap-4 px-4 py-2.5">
          <span className="w-20 shrink-0 pt-1 text-xs text-muted">책 소개</span>
          <textarea defaultValue={book.description || ''} onBlur={(e) => handleInlineSave('description', e.target.value)}
            rows={5} placeholder="책 소개를 입력하세요..." className="flex-1 border-none bg-transparent text-[13px] outline-none resize-none focus:bg-secondary/30 rounded px-1 -ml-1" />
        </div>
      </div>

      {/* 타이머 */}
      {status === 'READING' && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border/40 bg-black/[0.01] px-4 py-3">
          {activeSession ? (
            <>
              <span className="font-mono text-lg font-semibold text-primary">{formatElapsed(elapsed)}</span>
              <button onClick={handleStopSession} disabled={stopSessionMutation.isPending}
                className="rounded bg-destructive px-3 py-1 text-xs text-white hover:bg-destructive/90">독서 종료</button>
            </>
          ) : (
            <button onClick={() => startSessionMutation.mutate()} disabled={startSessionMutation.isPending}
              className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90">독서 시작</button>
          )}
          {sessions && sessions.length > 0 && (
            <div className="ml-auto flex gap-3 text-[11px] text-muted">
              {sessions.slice(0, 3).map((s) => (
                <span key={s.id}>{formatDate(s.startTime)} {s.durationMinutes != null && `${s.durationMinutes}분`}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 노션 스타일 탭 */}
      {<>
      <div className="mt-8 flex gap-1 border-b border-border/40">
        {([['records', '독서 기록'], ['reviews', '독후감'], ['highlights', '하이라이트'], ['info', '책 정보']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-3 py-2 text-[13px] transition-colors ${
              tab === key ? 'border-b-2 border-foreground text-foreground font-medium' : 'text-muted hover:text-foreground'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'records' && <RecordList userBookId={Number(id)} />}

        {tab === 'reviews' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">독후감</h3>
              <button onClick={() => setShowReviewEditor(!showReviewEditor)}
                className="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90">+ 독후감 작성</button>
            </div>
            {showReviewEditor && (
              <div className="mb-4">
                <ReviewEditor onSave={(data) => createReviewMutation.mutate(data)} onCancel={() => setShowReviewEditor(false)} saving={createReviewMutation.isPending} />
              </div>
            )}
            {reviews?.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted">작성한 독후감이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {reviews?.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border/40 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium">{r.title}</h4>
                        <p className="text-[11px] text-muted">{formatDate(r.createdAt)}
                          {r.isPublic && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">공개</span>}
                        </p>
                      </div>
                      <button onClick={() => deleteReviewMutation.mutate(r.id)} className="text-[11px] text-destructive hover:underline">삭제</button>
                    </div>
                    <div className="mt-2 line-clamp-3 text-[13px] text-muted" dangerouslySetInnerHTML={{ __html: r.content }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'highlights' && (
          <div>
            <div className="mb-4 rounded-lg border border-border/40 p-4">
              <h3 className="mb-3 text-sm font-semibold">새 하이라이트</h3>
              <div className="space-y-2">
                <input type="number" placeholder="페이지 번호 (선택)" value={hlPage} onChange={(e) => setHlPage(e.target.value)}
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-[13px]" />
                <textarea placeholder="하이라이트 내용 *" value={hlContent} onChange={(e) => setHlContent(e.target.value)} rows={3}
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-[13px]" />
                <textarea placeholder="메모 (선택)" value={hlMemo} onChange={(e) => setHlMemo(e.target.value)} rows={2}
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-[13px]" />
                <button onClick={handleSubmitHighlight} disabled={createHighlightMutation.isPending}
                  className="rounded bg-primary px-4 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50">추가</button>
              </div>
            </div>
            {highlights?.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-muted">저장된 하이라이트가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {[...(highlights || [])].sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0)).map((hl) => (
                  <div key={hl.id} className="rounded-lg border border-border/40 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {hl.pageNumber != null && <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium">p.{hl.pageNumber}</span>}
                          <span className="text-[11px] text-muted">{formatDate(hl.createdAt)}</span>
                        </div>
                        <p className="mt-1 text-[13px]">{hl.content}</p>
                        {hl.memo && <p className="mt-1 text-[12px] italic text-muted">{hl.memo}</p>}
                      </div>
                      <button onClick={() => deleteHighlightMutation.mutate(hl.id)} className="text-[11px] text-destructive hover:underline">삭제</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'info' && book.description && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">책 소개</h3>
            <p className="text-[13px] leading-relaxed text-muted">{book.description}</p>
          </div>
        )}
      </div></>}
    </div>
  );
}
