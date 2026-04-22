import { Link } from 'react-router-dom';
import type { UserBook } from '@/types/book';

const statusLabels: Record<string, string> = {
  WANT_TO_READ: '읽고 싶은',
  READING: '읽는 중',
  COMPLETED: '완독',
};

const statusColors: Record<string, string> = {
  WANT_TO_READ: 'bg-blue-100 text-blue-700',
  READING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export default function BookCard({ userBook }: { userBook: UserBook }) {
  const { book, status, rating } = userBook;
  const progress = book.totalPages && userBook.currentPage
    ? Math.round((userBook.currentPage / book.totalPages) * 100)
    : 0;

  return (
    <Link
      to={`/books/${userBook.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="h-48 overflow-hidden bg-secondary/50">
        {book.coverImageUrl && (
          <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-contain" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
          {book.title}
        </h3>
        <p className="mt-1 text-xs text-muted">{book.author}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
          {rating && (
            <span className="text-xs text-yellow-500">{'★'.repeat(Math.floor(rating))} {rating}</span>
          )}
        </div>
        {status === 'READING' && progress > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </Link>
  );
}
