import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { bookApi, type BookSearchResult } from '@/features/books/api';
import toast from 'react-hot-toast';

export default function BookSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<'search' | 'manual'>('search');
  // 페이지 수 입력 팝업
  const [pendingBook, setPendingBook] = useState<BookSearchResult | null>(null);
  const [pageInput, setPageInput] = useState('');

  // Manual form state
  const [manual, setManual] = useState({ title: '', author: '', publisher: '', totalPages: '', isbn: '', coverImageUrl: '' });

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await bookApi.search(query);
      setResults(data);
    } catch {
      toast.error('검색에 실패했습니다');
    } finally {
      setSearching(false);
    }
  };

  const addMutation = useMutation({
    mutationFn: async ({ result, totalPages }: { result: BookSearchResult; totalPages?: number }) => {
      const book = await bookApi.create({
        isbn: result.isbn,
        title: result.title,
        author: result.author,
        publisher: result.publisher,
        coverImageUrl: result.coverImageUrl,
        totalPages: totalPages ?? result.totalPages ?? undefined,
        description: result.description,
      });
      await bookApi.addToShelf(book.id);
      return book;
    },
    onSuccess: () => {
      toast.success('서재에 추가되었습니다!');
      setPendingBook(null);
      setPageInput('');
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || '추가에 실패했습니다');
    },
  });

  const handleAddClick = (result: BookSearchResult) => {
    // 페이지 수가 없으면 입력 팝업 표시
    if (!result.totalPages) {
      setPendingBook(result);
      setPageInput('');
    } else {
      addMutation.mutate({ result });
    }
  };

  const handleConfirmAdd = () => {
    if (!pendingBook) return;
    addMutation.mutate({
      result: pendingBook,
      totalPages: pageInput ? parseInt(pageInput) : undefined,
    });
  };

  const manualMutation = useMutation({
    mutationFn: async () => {
      const book = await bookApi.create({
        title: manual.title,
        author: manual.author,
        publisher: manual.publisher || undefined,
        totalPages: manual.totalPages ? parseInt(manual.totalPages) : undefined,
        isbn: manual.isbn || undefined,
        coverImageUrl: manual.coverImageUrl || undefined,
      });
      await bookApi.addToShelf(book.id);
      return book;
    },
    onSuccess: () => {
      toast.success('책이 등록되고 서재에 추가되었습니다!');
      navigate('/books');
    },
    onError: () => toast.error('등록에 실패했습니다'),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">책 추가</h1>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('search')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'search' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
        >
          검색으로 추가
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'manual' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
        >
          수동 입력
        </button>
      </div>

      {tab === 'search' ? (
        <div>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="제목, 저자, ISBN으로 검색"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {searching ? '검색 중...' : '검색'}
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {results.map((r, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:gap-4 sm:p-4">
                <div className="flex h-24 w-16 shrink-0 items-center justify-center self-center rounded bg-secondary/50 sm:self-start">
                  {r.coverImageUrl ? (
                    <img src={r.coverImageUrl} alt={r.title} className="h-full object-contain rounded" />
                  ) : (
                    <span className="text-2xl">📖</span>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-medium">{r.title}</h3>
                  <p className="text-sm text-muted">{r.author} · {r.publisher}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{r.description}</p>
                </div>
                <button
                  onClick={() => handleAddClick(r)}
                  disabled={addMutation.isPending}
                  className="w-full shrink-0 self-center rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
                >
                  서재에 추가
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); manualMutation.mutate(); }}
          className="max-w-lg space-y-4"
        >
          {[
            { key: 'title', label: '제목 *', required: true },
            { key: 'author', label: '저자 *', required: true },
            { key: 'publisher', label: '출판사' },
            { key: 'totalPages', label: '총 페이지 수', type: 'number' },
            { key: 'isbn', label: 'ISBN' },
            { key: 'coverImageUrl', label: '표지 이미지 URL' },
          ].map(({ key, label, required, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium">{label}</label>
              <input
                type={type || 'text'}
                value={manual[key as keyof typeof manual]}
                onChange={(e) => setManual({ ...manual, [key]: e.target.value })}
                required={required}
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={manualMutation.isPending}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {manualMutation.isPending ? '등록 중...' : '등록 및 서재에 추가'}
          </button>
        </form>
      )}

      {/* 페이지 수 입력 팝업 */}
      {pendingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold">총 페이지 수 입력</h3>
            <p className="mt-1 text-sm text-muted">
              <strong>{pendingBook.title}</strong>의 총 페이지 수를 입력하세요.
              <br />진행률 추적에 사용됩니다. (선택사항)
            </p>
            <input
              type="number"
              min={1}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder="예: 320"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmAdd()}
              className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm
                         focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => { setPendingBook(null); setPageInput(''); }}
                className="rounded-md border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                취소
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={addMutation.isPending}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {addMutation.isPending ? '추가 중...' : pageInput ? '추가' : '페이지 수 없이 추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
