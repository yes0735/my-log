// Design Ref: §3.1 — Book domain types
export type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'COMPLETED';

export interface Book {
  id: number;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  coverImageUrl?: string;
  totalPages?: number;
  description?: string;
  publishedDate?: string;
  originalCategory?: string; // 알라딘 계층형 분류 ("국내도서>소설>한국소설")
}

export interface UserBook {
  id: number;
  book: Book;
  status: ReadingStatus;
  rating?: number;
  currentPage: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}
