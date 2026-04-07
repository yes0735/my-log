import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookApi } from '@/features/books/api';
import { categoryApi, type Category } from '@/features/category/api';
import RecordList from '@/features/records/RecordList';
import { IoArrowBackOutline, IoCreateOutline, IoCheckmarkOutline, IoCloseOutline, IoAddOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';

const statusLabels: Record<string, string> = {
  WANT_TO_READ: '읽고 싶은',
  READING: '읽는 중',
  COMPLETED: '완독',
};

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    publisher: '',
    totalPages: '',
    description: '',
  });

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

  const addCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => categoryApi.addCategoryToBook(Number(id), categoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookCategories', id] }),
  });

  const removeCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => categoryApi.removeCategoryFromBook(Number(id), categoryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookCategories', id] }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => categoryApi.createCategory({ name }),
    onSuccess: async (cat) => {
      qc.invalidateQueries({ queryKey: ['myCategories'] });
      await categoryApi.addCategoryToBook(Number(id), cat.id);
      qc.invalidateQueries({ queryKey: ['bookCategories', id] });
      setNewCategoryName('');
      setShowCategoryAdd(false);
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: (data: { title?: string; author?: string; publisher?: string; totalPages?: number; description?: string }) =>
      bookApi.updateBook(userBook!.book.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBook', id] });
      qc.invalidateQueries({ queryKey: ['myBooks'] });
      toast.success('책 정보가 수정되었습니다');
      setEditing(false);
    },
    onError: () => toast.error('수정에 실패했습니다'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status?: string; rating?: number }) =>
      bookApi.updateMyBook(Number(id), data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myBook', id] });
    },
  });

  const startEditing = () => {
    if (!userBook) return;
    setEditForm({
      title: userBook.book.title,
      author: userBook.book.author,
      publisher: userBook.book.publisher || '',
      totalPages: userBook.book.totalPages?.toString() || '',
      description: userBook.book.description || '',
    });
    setEditing(true);
  };

  const handleSave = () => {
    updateBookMutation.mutate({
      title: editForm.title || undefined,
      author: editForm.author || undefined,
      publisher: editForm.publisher || undefined,
      totalPages: editForm.totalPages ? parseInt(editForm.totalPages) : undefined,
      description: editForm.description || undefined,
    });
  };

  if (isLoading) return <p className="text-muted">로딩 중...</p>;
  if (!userBook) return <p className="text-muted">책을 찾을 수 없습니다</p>;

  const { book, status, rating } = userBook;
  const progress = book.totalPages && userBook.currentPage
    ? Math.round((userBook.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/records')}
        className="mb-4 flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <IoArrowBackOutline /> 독서 기록 목록
      </button>

      {/* Book Info */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <div className="flex h-48 w-32 shrink-0 items-center justify-center self-center rounded-lg bg-secondary/50 sm:self-start">
            {book.coverImageUrl ? (
              <img src={book.coverImageUrl} alt={book.title} className="h-full rounded-lg object-contain" />
            ) : (
              <span className="text-6xl">📖</span>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              /* Edit Mode */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted">제목</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted">저자</label>
                  <input
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-muted">출판사</label>
                    <input
                      value={editForm.publisher}
                      onChange={(e) => setEditForm({ ...editForm, publisher: e.target.value })}
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div className="w-28">
                    <label className="block text-xs text-muted">총 페이지</label>
                    <input
                      type="number"
                      value={editForm.totalPages}
                      onChange={(e) => setEditForm({ ...editForm, totalPages: e.target.value })}
                      className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted">설명</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded border border-border bg-background px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={updateBookMutation.isPending}
                    className="flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <IoCheckmarkOutline /> 저장
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-sm hover:bg-secondary"
                  >
                    <IoCloseOutline /> 취소
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">{book.title}</h1>
                    <p className="mt-1 text-muted">{book.author}</p>
                    {book.publisher && <p className="text-sm text-muted">{book.publisher}</p>}
                    {book.totalPages && <p className="text-sm text-muted">{book.totalPages}페이지</p>}
                  </div>
                  <button
                    onClick={startEditing}
                    className="flex items-center gap-1 rounded border border-border px-2.5 py-1.5 text-sm text-muted hover:bg-secondary hover:text-foreground"
                  >
                    <IoCreateOutline size={16} /> 책정보 수정
                  </button>
                </div>

                {book.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted">{book.description}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">상태:</span>
                    <select
                      value={status}
                      onChange={(e) => updateStatusMutation.mutate({ status: e.target.value })}
                      className="rounded border border-border bg-background px-2 py-1 text-sm"
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">별점:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          onClick={() => updateStatusMutation.mutate({ rating: v })}
                          className={`text-lg ${rating && rating >= v ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    {rating && <span className="text-sm text-muted">{rating}</span>}
                  </div>
                </div>

                {status === 'READING' && book.totalPages && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">진행률</span>
                      <span className="font-medium">{userBook.currentPage}/{book.totalPages} ({progress}%)</span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                {/* Categories */}
                <div className="mt-4">
                  <span className="text-sm font-medium">카테고리:</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {bookCategories.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.name}
                        <button
                          onClick={() => removeCategoryMutation.mutate(cat.id)}
                          className="ml-0.5 hover:opacity-70"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {/* 기존 카테고리에서 추가 */}
                    {allCategories.filter((c) => !bookCategories.some((bc) => bc.id === c.id)).length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addCategoryMutation.mutate(Number(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        className="rounded-full border border-dashed border-border bg-background px-2 py-1 text-xs"
                        defaultValue=""
                      >
                        <option value="" disabled>+ 카테고리 추가</option>
                        {allCategories
                          .filter((c) => !bookCategories.some((bc) => bc.id === c.id))
                          .map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        }
                      </select>
                    )}

                    {/* 새 카테고리 생성 */}
                    {showCategoryAdd ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && newCategoryName.trim() && createCategoryMutation.mutate(newCategoryName.trim())}
                          placeholder="새 카테고리명"
                          autoFocus
                          className="w-24 rounded border border-border bg-background px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => newCategoryName.trim() && createCategoryMutation.mutate(newCategoryName.trim())}
                          className="rounded bg-primary px-1.5 py-1 text-xs text-primary-foreground"
                        >
                          <IoCheckmarkOutline size={12} />
                        </button>
                        <button
                          onClick={() => { setShowCategoryAdd(false); setNewCategoryName(''); }}
                          className="rounded border border-border px-1.5 py-1 text-xs"
                        >
                          <IoCloseOutline size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCategoryAdd(true)}
                        className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-1 text-xs text-muted hover:bg-secondary"
                      >
                        <IoAddOutline size={12} /> 새 카테고리
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reading Records */}
      <div className="mt-6">
        <RecordList userBookId={Number(id)} />
      </div>
    </div>
  );
}
