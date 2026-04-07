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
import { IoCreateOutline, IoCheckmarkOutline, IoCloseOutline, IoAddOutline } from 'react-icons/io5';

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

  // 책 정보 수정 상태
  const [editingBook, setEditingBook] = useState(false);
  const [editBookForm, setEditBookForm] = useState({ title: '', author: '', publisher: '', totalPages: '', description: '' });

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
      toast.success('책 정보가 수정되었습니다');
      setEditingBook(false);
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

  const createCatMutation = useMutation({
    mutationFn: (name: string) => categoryApi.createCategory({ name }),
    onSuccess: async (cat) => {
      qc.invalidateQueries({ queryKey: ['myCategories'] });
      await categoryApi.addCategoryToBook(Number(id), cat.id);
      qc.invalidateQueries({ queryKey: ['bookCategories', id] });
      setNewCategoryName('');
      setShowCategoryAdd(false);
    },
  });

  const startEditBook = () => {
    if (!userBook) return;
    setEditBookForm({
      title: userBook.book.title,
      author: userBook.book.author,
      publisher: userBook.book.publisher || '',
      totalPages: userBook.book.totalPages?.toString() || '',
      description: userBook.book.description || '',
    });
    setEditingBook(true);
  };

  const saveBookEdit = () => {
    updateBookInfoMutation.mutate({
      title: editBookForm.title || undefined,
      author: editBookForm.author || undefined,
      publisher: editBookForm.publisher || undefined,
      totalPages: editBookForm.totalPages ? parseInt(editBookForm.totalPages) : undefined,
      description: editBookForm.description || undefined,
    });
  };

  const { data: reviews } = useQuery({
    queryKey: ['bookReviews', id],
    queryFn: () => reviewApi.getByBook(Number(id)),
    enabled: tab === 'reviews',
  });

  const updateMutation = useMutation({
    mutationFn: (data: { status?: string; rating?: number; currentPage?: number }) =>
      bookApi.updateMyBook(Number(id), data),
    onSuccess: (_data, variables) => {
      if ('currentPage' in variables && Object.keys(variables).length === 1) {
        // 진행률만 변경 → 캐시 직접 업데이트 (refetch 없이)
        qc.setQueryData(['myBook', id], (old: any) =>
          old ? { ...old, currentPage: variables.currentPage } : old
        );
      } else {
        qc.invalidateQueries({ queryKey: ['myBook', id] });
        toast.success('업데이트되었습니다');
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

  if (isLoading) return <p className="text-muted">로딩 중...</p>;
  if (!userBook) return <p className="text-muted">책을 찾을 수 없습니다</p>;

  const { book, status, rating, currentPage } = userBook;
  const displayPage = localPage ?? currentPage;
  const progress = book.totalPages && displayPage
    ? Math.round((displayPage / book.totalPages) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => editingBook ? setEditingBook(false) : navigate(-1)}
        className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        ← {editingBook ? '상세 페이지' : '이전 페이지'}
      </button>

      {/* Book info header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
        <div className="flex h-48 w-32 shrink-0 items-center justify-center self-center rounded-lg bg-secondary/50 sm:h-64 sm:w-44 sm:self-start">
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} alt={book.title} className="h-full rounded-lg object-contain" />
          ) : (
            <span className="text-6xl">📖</span>
          )}
        </div>

        <div className="flex-1">
          {editingBook ? (
            /* 책 정보 수정 모드 */
            <div className="space-y-3">
              {/* 카테고리 — 제목 위 */}
              <div>
                <label className="block text-xs text-muted">카테고리</label>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {bookCategories.map((cat) => (
                    <span key={cat.id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: cat.color }}>
                      {cat.name}
                      <button onClick={() => removeCatMutation.mutate(cat.id)} className="ml-0.5 hover:opacity-70">×</button>
                    </span>
                  ))}
                  {allCategories.filter((c) => !bookCategories.some((bc) => bc.id === c.id)).length > 0 && (
                    <select onChange={(e) => { if (e.target.value) { addCatMutation.mutate(Number(e.target.value)); e.target.value = ''; } }}
                      className="rounded-full border border-dashed border-border bg-background px-2 py-1 text-xs" defaultValue="">
                      <option value="" disabled>+ 추가</option>
                      {allCategories.filter((c) => !bookCategories.some((bc) => bc.id === c.id)).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                  {showCategoryAdd ? (
                    <div className="flex items-center gap-1">
                      <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && newCategoryName.trim() && createCatMutation.mutate(newCategoryName.trim())}
                        placeholder="새 카테고리" autoFocus className="w-24 rounded border border-border bg-background px-2 py-1 text-xs" />
                      <button onClick={() => newCategoryName.trim() && createCatMutation.mutate(newCategoryName.trim())}
                        className="rounded bg-primary px-1.5 py-1 text-xs text-primary-foreground"><IoCheckmarkOutline size={12} /></button>
                      <button onClick={() => { setShowCategoryAdd(false); setNewCategoryName(''); }}
                        className="rounded border border-border px-1.5 py-1 text-xs"><IoCloseOutline size={12} /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowCategoryAdd(true)}
                      className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-1 text-xs text-muted hover:bg-secondary">
                      <IoAddOutline size={12} /> 새 카테고리
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted">제목</label>
                <input value={editBookForm.title} onChange={(e) => setEditBookForm({ ...editBookForm, title: e.target.value })}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-muted">저자</label>
                <input value={editBookForm.author} onChange={(e) => setEditBookForm({ ...editBookForm, author: e.target.value })}
                  className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-muted">출판사</label>
                  <input value={editBookForm.publisher} onChange={(e) => setEditBookForm({ ...editBookForm, publisher: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm" />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-muted">총 페이지</label>
                  <input type="number" value={editBookForm.totalPages} onChange={(e) => setEditBookForm({ ...editBookForm, totalPages: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted">설명</label>
                <textarea value={editBookForm.description} onChange={(e) => setEditBookForm({ ...editBookForm, description: e.target.value })}
                  rows={3} className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={() => { if (confirm('이 책을 서재에서 제거하시겠습니까?')) deleteMutation.mutate(); }}
                    className="flex items-center gap-1 rounded border border-destructive px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                    서재에서 제거
                  </button>
                  <button onClick={() => setEditingBook(false)}
                    className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm hover:bg-secondary">
                    <IoCloseOutline /> 취소
                  </button>
                </div>
                <button onClick={saveBookEdit} disabled={updateBookInfoMutation.isPending}
                  className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  <IoCheckmarkOutline /> 저장
                </button>
              </div>
            </div>
          ) : (
            /* 책 정보 표시 모드 */
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{book.title}</h1>
                  <p className="mt-1 text-muted">{book.author}</p>
                  {book.publisher && <p className="text-sm text-muted">{book.publisher}</p>}
                  {book.totalPages && <p className="text-sm text-muted">{book.totalPages}페이지</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { if (confirm('이 책을 서재에서 제거하시겠습니까?')) deleteMutation.mutate(); }}
                    className="flex items-center gap-1 rounded border border-destructive px-2.5 py-1.5 text-sm text-destructive hover:bg-destructive/10">
                    서재에서 제거
                  </button>
                  <button onClick={startEditBook}
                    className="flex items-center gap-1 rounded border border-border px-2.5 py-1.5 text-sm text-muted hover:bg-secondary hover:text-foreground">
                    <IoCreateOutline size={16} /> 책정보 수정
                  </button>
                </div>
              </div>

              {/* 카테고리 배지 */}
              {bookCategories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {bookCategories.map((cat) => (
                    <span key={cat.id} className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: cat.color }}>{cat.name}</span>
                  ))}
                </div>
              )}
            </>
          )}

          {!editingBook && (
            <>
              <div className="mt-4 flex items-center gap-3">
                <label className="text-sm font-medium">상태:</label>
                <select value={status}
                  onChange={(e) => updateMutation.mutate({ status: e.target.value })}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-sm">
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <label className="text-sm font-medium">별점:</label>
                <div className="flex flex-wrap gap-1">
                  {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((v) => (
                    <button key={v}
                      onClick={() => updateMutation.mutate({ rating: v })}
                      className={`rounded px-2 py-0.5 text-xs border ${
                        rating === v ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-secondary'
                      }`}>
                      {v}★
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {!editingBook && status === 'READING' && book.totalPages && (
            <div className="mt-3">
              <label className="text-sm font-medium">진행률: {displayPage}/{book.totalPages} ({progress}%)</label>
              <input type="range" min={0} max={book.totalPages} value={displayPage || 0}
                onChange={(e) => handlePageChange(parseInt(e.target.value))}
                className="mt-1 w-full" />
            </div>
          )}

          {/* Timer widget — only when READING */}
          {!editingBook && status === 'READING' && (
            <div className="mt-4 rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                {activeSession ? (
                  <>
                    <span className="font-mono text-lg font-semibold text-primary">
                      {formatElapsed(elapsed)}
                    </span>
                    <button
                      onClick={handleStopSession}
                      disabled={stopSessionMutation.isPending}
                      className="rounded bg-destructive px-3 py-1 text-sm text-white hover:bg-destructive/90 disabled:opacity-50">
                      독서 종료
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startSessionMutation.mutate()}
                    disabled={startSessionMutation.isPending}
                    className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    독서 시작
                  </button>
                )}
              </div>
              {/* Recent sessions */}
              {sessions && sessions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-muted">최근 독서 기록</p>
                  {sessions.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs text-muted">
                      <span>{formatDate(s.startTime)}</span>
                      {s.durationMinutes != null && <span>{s.durationMinutes}분</span>}
                      {s.pagesRead != null && <span>· {s.pagesRead}쪽</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Tabs — 수정 모드에서는 숨김 */}
      {!editingBook && <>
      <div className="mt-8 flex gap-4 border-b border-border">
        {([['records', '독서 기록'], ['reviews', '독후감'], ['highlights', '하이라이트'], ['info', '책 정보']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium ${tab === key ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {tab === 'records' && <RecordList userBookId={Number(id)} />}

        {tab === 'reviews' && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">독후감</h3>
              <button onClick={() => setShowReviewEditor(!showReviewEditor)}
                className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90">
                + 독후감 작성
              </button>
            </div>

            {showReviewEditor && (
              <div className="mb-4">
                <ReviewEditor
                  onSave={(data) => createReviewMutation.mutate(data)}
                  onCancel={() => setShowReviewEditor(false)}
                  saving={createReviewMutation.isPending}
                />
              </div>
            )}

            {reviews?.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">작성한 독후감이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {reviews?.map((r) => (
                  <div key={r.id} className="rounded-lg border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{r.title}</h4>
                        <p className="text-xs text-muted">{formatDate(r.createdAt)}
                          {r.isPublic && <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-green-700">공개</span>}
                        </p>
                      </div>
                      <button onClick={() => deleteReviewMutation.mutate(r.id)}
                        className="text-xs text-destructive hover:underline">삭제</button>
                    </div>
                    <div className="mt-2 line-clamp-3 text-sm text-muted"
                      dangerouslySetInnerHTML={{ __html: r.content }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'highlights' && (
          <div>
            {/* New highlight form */}
            <div className="mb-4 rounded-lg border border-border p-4">
              <h3 className="mb-3 font-semibold">새 하이라이트</h3>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="페이지 번호 (선택)"
                  value={hlPage}
                  onChange={(e) => setHlPage(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="하이라이트 내용 *"
                  value={hlContent}
                  onChange={(e) => setHlContent(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="메모 (선택)"
                  value={hlMemo}
                  onChange={(e) => setHlMemo(e.target.value)}
                  rows={2}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button
                  onClick={handleSubmitHighlight}
                  disabled={createHighlightMutation.isPending}
                  className="rounded bg-primary px-4 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                  추가
                </button>
              </div>
            </div>

            {/* Highlights list */}
            {highlights?.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted">저장된 하이라이트가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {[...(highlights || [])]
                  .sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0))
                  .map((hl) => (
                    <div key={hl.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {hl.pageNumber != null && (
                              <span className="inline-block rounded bg-secondary px-2 py-0.5 text-xs font-medium">
                                p.{hl.pageNumber}
                              </span>
                            )}
                            <span className="text-xs text-muted">{formatDate(hl.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-sm">{hl.content}</p>
                          {hl.memo && (
                            <p className="mt-1 text-xs italic text-muted">{hl.memo}</p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteHighlightMutation.mutate(hl.id)}
                          className="shrink-0 text-xs text-destructive hover:underline">
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {tab === 'info' && book.description && (
          <div>
            <h3 className="mb-2 font-semibold">책 소개</h3>
            <p className="text-sm leading-relaxed text-muted">{book.description}</p>
          </div>
        )}
      </div></>}
    </div>
  );
}
