import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface CategoryInfo {
  id: number;
  name: string;
  color: string;
}

interface Props {
  userBook: UserBook;
  onDelete: (id: number) => void;
  categories?: CategoryInfo[];
}

export default function SortableBookCard({ userBook, onDelete, categories = [] }: Props) {
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
    touchAction: 'none' as const, // 모바일 스크롤 충돌 방지 (TouchSensor delay 기반 활성)
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group cursor-grab active:cursor-grabbing"
    >
      {/* Delete button — hover 시 × 기호 */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(userBook.id);
        }}
        aria-label="삭제"
        className="absolute top-1.5 right-1.5 z-20 rounded-full bg-card/90 px-1.5 text-base leading-none text-muted opacity-0 group-hover:opacity-100
                   hover:bg-red-500 hover:text-white transition-all backdrop-blur-sm"
      >
        ×
      </button>

      <Link
        to={`/books/${userBook.id}`}
        className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
      >
        <div className="h-48 shrink-0 overflow-hidden bg-secondary/50">
          {book.coverImageUrl && (
            <img src={book.coverImageUrl} alt={book.title} className="h-full w-full object-contain" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-3">
          <h3 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
            {book.title}
          </h3>
          <p className="mt-1 text-xs text-muted">{book.author}</p>
          <div className="mt-1.5 min-h-[20px] flex flex-wrap gap-1">
            {categories.map((c) => (
              <span key={c.id} className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: c.color }}>{c.name}</span>
            ))}
          </div>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
            {rating && (
              <span className="text-xs text-yellow-500">{'★'.repeat(Math.floor(rating))} {rating}</span>
            )}
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-secondary">
            {status === 'READING' && progress > 0 && (
              <div className="h-1.5 rounded-full bg-primary" style={{ width: `${progress}%` }} />
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
