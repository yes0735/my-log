// Design Ref: §6.3 — DayPopover (자체 구현, Radix 미사용)
import { useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, differenceInCalendarDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { CalendarBar } from './types';

interface DayPopoverProps {
  date: Date | null;
  books: CalendarBar[];
  anchorCell: HTMLElement | null;
  onClose: () => void;
}

export default function DayPopover({ date, books, anchorCell, onClose }: DayPopoverProps) {
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);

  // ESC 키 → 닫기
  useEffect(() => {
    if (!date) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [date, onClose]);

  // 외부 클릭 → 닫기
  useEffect(() => {
    if (!date) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorCell &&
        !anchorCell.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    // 마이크로태스크 이후 등록 (현재 클릭이 onClose를 유발하는 것 방지)
    const tid = setTimeout(() => window.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(tid);
      window.removeEventListener('mousedown', handler);
    };
  }, [date, anchorCell, onClose]);

  // 위치 계산 + 화면 경계 flip — 스타일을 imperative하게 직접 설정 (setState 회피)
  useLayoutEffect(() => {
    const el = popoverRef.current;
    if (!date || !anchorCell || !el) return;

    const rect = anchorCell.getBoundingClientRect();
    const popRect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left;
    let top = rect.bottom + 4;

    if (left + popRect.width > vw - 8) {
      left = Math.max(8, rect.right - popRect.width);
    }
    if (top + popRect.height > vh - 8) {
      top = Math.max(8, rect.top - popRect.height - 4);
    }

    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    el.style.visibility = 'visible';
  }, [date, anchorCell, books.length]);

  if (!date) return null;

  const handleBookClick = (userBookId: number) => {
    onClose();
    navigate(`/books/${userBookId}`);
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-popover-title"
      className="fixed z-50 min-w-[240px] max-w-[320px] rounded-lg border border-border/60 bg-background shadow-lg"
      style={{ top: -9999, left: -9999, visibility: 'hidden' }}
    >
      <div className="border-b border-border/40 px-3 py-2">
        <p id="day-popover-title" className="text-sm font-semibold">
          {format(date, 'yyyy년 M월 d일 (EEE)', { locale: ko })}
        </p>
        <p className="text-[11px] text-muted">{books.length}권</p>
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {books.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted">이 날짜에는 책이 없어요</p>
        ) : (
          books.map((bar) => (
            <button
              key={bar.userBookId}
              type="button"
              onClick={() => handleBookClick(bar.userBookId)}
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
            >
              <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-secondary/50">
                {bar.book.coverImageUrl && (
                  <img src={bar.book.coverImageUrl} alt="" className="h-full w-full rounded object-contain" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="line-clamp-2 text-[13px] font-medium">{bar.book.title}</p>
                <p className="truncate text-[11px] text-muted">{bar.book.author}</p>
                <div className="flex flex-wrap items-center gap-1">
                  <span
                    className="inline-block rounded px-1 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: bar.color }}
                  >
                    {bar.isOngoing ? '읽는 중' : '완독'}
                  </span>
                  <span className="text-[11px] text-muted">
                    {format(bar.originalStartDate, 'M/d')}
                    {bar.isOngoing
                      ? ` ~ · ${differenceInCalendarDays(bar.originalEndDate, bar.originalStartDate) + 1}일째`
                      : ` ~ ${format(bar.originalEndDate, 'M/d')} · 총 ${differenceInCalendarDays(bar.originalEndDate, bar.originalStartDate) + 1}일`}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
