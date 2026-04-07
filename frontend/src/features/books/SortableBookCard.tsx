import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { IoTrashOutline } from 'react-icons/io5';
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

interface Props {
  userBook: UserBook;
  onDelete: (id: number) => void;
}

export default function SortableBookCard({ userBook, onDelete }: Props) {
  const { book, status, rating } = userBook;
  const progress = book.totalPages && userBook.currentPage
    ? Math.round((userBook.currentPage / book.totalPages) * 100)
    : 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: userBook.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Drag handle — 카드 상단 */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-0 left-0 right-0 h-8 z-10 cursor-grab active:cursor-grabbing
                   flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <span className="text-xs text-muted bg-card/80 rounded px-2 py-0.5 backdrop-blur-sm">⠿</span>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(userBook.id);
        }}
        className="absolute top-2 right-2 z-20 rounded-full bg-card/80 p-1.5 opacity-0 group-hover:opacity-100
                   hover:bg-red-500 hover:text-white transition-all backdrop-blur-sm"
        title="서재에서 제거"
      >
        <IoTrashOutline size={14} />
      </button>

      <Link
        to={`/books/${userBook.id}`}
        className="flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
      >
        <div className="flex h-48 items-center justify-center bg-secondary/50">
          {book.coverImageUrl ? (
            <img src={book.coverImageUrl} alt={book.title} className="h-full object-contain" />
          ) : (
            <span className="text-4xl">📖</span>
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
    </div>
  );
}
