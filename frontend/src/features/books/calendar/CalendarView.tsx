// Design Ref: §6.1 — CalendarView container
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addMonths, subMonths, format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { UserBook } from '@/types/book';
import type { CalendarBar } from './types';
import {
  buildMonthGrid,
  mapBooksToBars,
  clipBarsToGrid,
  allocateSlots,
  booksForDate,
  dateKey,
} from '@/lib/calendar';
import CalendarBookBar from './CalendarBookBar';
import DayPopover from './DayPopover';
import type { BarLayoutRow } from './types';
import { CALENDAR_BAR_METRICS } from './types';

interface CalendarViewProps {
  books: UserBook[];
  statusFilter: string; // '' | 'WANT_TO_READ' | 'READING' | 'COMPLETED'
  onResetStatusFilter: () => void;
}

const MAX_ROWS = 3;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// Design Ref: §6.1 — Main container
export default function CalendarView({ books, statusFilter, onResetStatusFilter }: CalendarViewProps) {
  // Design Ref: §6.1 — URL search params로 currentMonth 유지 (뒤로가기 시 복원)
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get('month');
  const currentMonth = useMemo(() => {
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  }, [monthParam]);

  const setCurrentMonth = useCallback((date: Date) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const today = new Date();
      const isCurrentMonth =
        date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
      if (isCurrentMonth) next.delete('month');
      else next.set('month', format(date, 'yyyy-MM'));
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // ref를 통해 키보드 핸들러가 항상 최신 currentMonth 참조
  const currentMonthRef = useRef(currentMonth);
  useEffect(() => {
    currentMonthRef.current = currentMonth;
  }, [currentMonth]);

  // Design Ref: §6.3 — selection holds date + anchor element from click event
  const [selection, setSelection] = useState<{ date: Date; anchor: HTMLElement } | null>(null);

  // Plan SC: SC-01, SC-02 — books → CalendarBar[]
  // statusFilter가 특정 상태(READING/COMPLETED)인 경우 재필터
  const filteredBooks = useMemo(() => {
    if (statusFilter === 'READING' || statusFilter === 'COMPLETED') {
      return books.filter((b) => b.status === statusFilter);
    }
    return books;
  }, [books, statusFilter]);

  const allBars = useMemo(() => mapBooksToBars(filteredBooks), [filteredBooks]);

  // Plan SC: SC-04 — 월 그리드
  const grid = useMemo(
    () => buildMonthGrid(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  // Plan SC: SC-04 — 그리드로 클리핑 후 슬롯 배정
  const { layout, overflow } = useMemo(() => {
    const clipped = clipBarsToGrid(allBars, grid);
    return allocateSlots(clipped, MAX_ROWS);
  }, [allBars, grid]);

  // 키보드 네비게이션
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // input/textarea 포커스 중에는 무시
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        setCurrentMonth(subMonths(currentMonthRef.current, 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentMonth(addMonths(currentMonthRef.current, 1));
      } else if (e.key === 'Home') {
        setCurrentMonth(new Date());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCurrentMonth]);

  const handlePrev = useCallback(
    () => setCurrentMonth(subMonths(currentMonth, 1)),
    [currentMonth, setCurrentMonth],
  );
  const handleNext = useCallback(
    () => setCurrentMonth(addMonths(currentMonth, 1)),
    [currentMonth, setCurrentMonth],
  );
  const handleToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelection(null);
  }, [setCurrentMonth]);

  const handleDayClick = useCallback((date: Date, anchor: HTMLElement) => {
    setSelection((prev) => (prev && isSameDay(prev.date, date) ? null : { date, anchor }));
  }, []);

  const handlePopoverClose = useCallback(() => setSelection(null), []);

  // 주 단위로 layout을 세그먼트 분할 (월 경계 + 주 경계)
  // Design Ref: §6.2 — "주 단위 세그먼트 분할"
  const weekSegments = useMemo(() => buildWeekSegments(layout, grid.days), [layout, grid.days]);

  // 날짜별 시작/완독 이벤트 맵 — day 셀에 bold + dot 강조에 사용
  // key: "YYYY-MM-DD", value: 해당 날짜에 시작하거나 완독한 고유 바 목록
  const dateHighlights = useMemo(() => {
    const map = new Map<string, CalendarBar[]>();
    const addBar = (date: Date, bar: CalendarBar) => {
      const key = dateKey(date);
      const arr = map.get(key);
      if (!arr) map.set(key, [bar]);
      else if (!arr.includes(bar)) arr.push(bar);
    };
    for (const bar of allBars) {
      addBar(bar.originalStartDate, bar);
      if (!bar.isOngoing) addBar(bar.originalEndDate, bar);
    }
    return map;
  }, [allBars]);

  // 빈 상태 계산
  const totalBooksWithDates = allBars.length;
  const currentMonthBars = layout.length;
  const hasOngoingStatusFilterConflict = statusFilter === 'WANT_TO_READ';

  // 모바일 폴백용 — 현재 월과 겹치는 책만, 시작일순
  // Design Ref: §2.1 Module E — MobileMonthList
  const mobileList = useMemo(() => {
    return layout
      .slice()
      .sort((a, b) => a.bar.startDate.getTime() - b.bar.startDate.getTime())
      .map((l) => l.bar);
  }, [layout]);

  const selectedDateBooks = selection ? booksForDate(allBars, selection.date) : [];

  // 빈 상태 렌더
  if (hasOngoingStatusFilterConflict) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border/60 p-10 text-center">
        <p className="text-sm font-medium">캘린더는 읽는 중·완독 책만 표시해요</p>
        <p className="mt-1 text-xs text-muted">현재 "읽고 싶은" 필터가 적용되어 있어요.</p>
        <button
          onClick={onResetStatusFilter}
          className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90"
        >
          전체 보기
        </button>
      </div>
    );
  }

  if (totalBooksWithDates === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-border/60 p-10 text-center">
        <p className="text-sm font-medium">아직 읽기 시작한 책이 없어요</p>
        <p className="mt-1 text-xs text-muted">책 상태를 "읽는 중" 또는 "완독"으로 변경하면 캘린더에 표시돼요.</p>
      </div>
    );
  }

  return (
    <div className="select-none">
      {/* 헤더: 월 네비 + 제목 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center rounded-md border border-border/50 text-xs">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="이전 달"
            className="px-2.5 py-1 text-muted transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={handleToday}
            aria-label="오늘로 이동"
            className="border-x border-border/50 px-2.5 py-1 text-muted transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          >
            오늘
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="다음 달"
            className="px-2.5 py-1 text-muted transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          >
            ›
          </button>
        </div>
        <h2 className="text-base font-semibold">
          {format(currentMonth, 'yyyy년 M월', { locale: ko })}
        </h2>
        <div className="text-xs text-muted">{currentMonthBars}권</div>
      </div>

      {/* 월별 빈 상태 */}
      {currentMonthBars === 0 && (
        <div className="mb-3 rounded-md border border-dashed border-border/50 px-4 py-6 text-center text-xs text-muted">
          이번 달에 읽은 책이 없어요. 이전/다음 달을 확인해보세요.
        </div>
      )}

      {/* 데스크탑 그리드 */}
      <div className="hidden md:block">
        <div
          role="grid"
          aria-label={`${format(currentMonth, 'yyyy년 M월', { locale: ko })} 독서 캘린더`}
          className="overflow-hidden rounded-lg border border-border/40"
        >
          {/* 요일 헤더 */}
          <div role="row" className="grid grid-cols-7 border-b border-border/40 bg-black/[0.02] dark:bg-white/[0.02]">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                role="columnheader"
                className={`px-2 py-1.5 text-center text-[11px] font-medium ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          {/* 6주 그리드 */}
          {Array.from({ length: 6 }).map((_, weekIdx) => {
            const weekDays = grid.days.slice(weekIdx * 7, weekIdx * 7 + 7);
            const segmentsInWeek = weekSegments.filter((s) => s.weekIdx === weekIdx);

            return (
              <div key={weekIdx} className="relative grid grid-cols-7 border-b border-border/30 last:border-b-0">
                {/* 날짜 셀 */}
                {weekDays.map((day) => {
                  const key = dateKey(day.date);
                  const overflowCount = overflow[key] ?? 0;
                  const isSelected = selection && isSameDay(selection.date, day.date);
                  const eventBars = dateHighlights.get(key) ?? [];
                  const hasEvent = eventBars.length > 0 && day.isCurrentMonth;
                  const dotColors = eventBars.slice(0, 3).map((b) => b.color);

                  const numberColorClass = !day.isCurrentMonth
                    ? 'text-muted/50'
                    : day.isToday
                    ? 'rounded-full bg-primary px-1.5 text-primary-foreground'
                    : day.isWeekend
                    ? day.date.getDay() === 0
                      ? 'text-red-500'
                      : 'text-blue-500'
                    : 'text-foreground';

                  return (
                    <div
                      key={key}
                      role="gridcell"
                      tabIndex={0}
                      aria-label={`${format(day.date, 'M월 d일', { locale: ko })}${booksForDate(allBars, day.date).length > 0 ? `, ${booksForDate(allBars, day.date).length}권 관련` : ''}`}
                      onClick={(e) => handleDayClick(day.date, e.currentTarget)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleDayClick(day.date, e.currentTarget);
                        }
                      }}
                      className={`relative min-h-[96px] cursor-pointer border-r border-border/30 px-1.5 py-1 transition-colors last:border-r-0 hover:bg-black/[0.015] focus:outline-none focus:ring-2 focus:ring-primary/40 dark:hover:bg-white/[0.015] ${
                        !day.isCurrentMonth ? 'bg-black/[0.015] dark:bg-white/[0.015]' : ''
                      } ${isSelected ? 'ring-2 ring-primary/60' : ''}`}
                    >
                      {/* 날짜 숫자 + 시작/완독 dot (우측 정렬) */}
                      <div className="flex items-center justify-end gap-1">
                        {hasEvent && !day.isToday && (
                          <div className="flex items-center gap-0.5" aria-hidden="true">
                            {dotColors.map((color, i) => (
                              <span
                                key={i}
                                className="h-1 w-1 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        )}
                        <span
                          className={`text-[11px] ${numberColorClass} ${
                            hasEvent && !day.isToday && day.isCurrentMonth ? 'font-bold' : ''
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                      </div>
                      {overflowCount > 0 && (
                        <div
                          className="absolute bottom-1 right-1 rounded bg-primary/10 px-1 text-[9px] font-medium text-primary"
                          style={{
                            top: `${CALENDAR_BAR_METRICS.HEADER_HEIGHT + MAX_ROWS * (CALENDAR_BAR_METRICS.BAR_HEIGHT + CALENDAR_BAR_METRICS.BAR_GAP) + 2}px`,
                            bottom: 'auto',
                          }}
                        >
                          +{overflowCount}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 바 오버레이 레이어 */}
                <div className="pointer-events-none absolute inset-0">
                  {segmentsInWeek.map((seg, i) => (
                    <div key={i} className="pointer-events-auto">
                      <CalendarBookBar
                        bar={seg.bar}
                        row={seg.row}
                        startCol={seg.startCol}
                        spanCols={seg.spanCols}
                        clippedLeft={seg.clippedLeft}
                        clippedRight={seg.clippedRight}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 모바일 리스트 폴백 */}
      {/* Design Ref: §2.1 Module E — 모바일 폴백 */}
      <div className="md:hidden">
        {mobileList.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/50 p-6 text-center text-xs text-muted">
            이번 달에 읽은 책이 없어요
          </div>
        ) : (
          <div className="space-y-2">
            {mobileList.map((bar) => (
              <a
                key={bar.userBookId}
                href={`/books/${bar.userBookId}`}
                className="flex items-start gap-2 rounded-lg border border-border/40 bg-card p-2.5 transition-colors hover:border-border"
              >
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-secondary/50">
                  {bar.book.coverImageUrl && (
                    <img src={bar.book.coverImageUrl} alt="" className="h-full w-full rounded object-contain" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="line-clamp-1 text-[13px] font-medium">{bar.book.title}</p>
                  <p className="truncate text-[11px] text-muted">{bar.book.author}</p>
                  <div className="mt-1 flex items-center gap-1">
                    <span
                      className="inline-block rounded px-1 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: bar.color }}
                    >
                      {bar.isOngoing ? '읽는 중' : '완독'}
                    </span>
                    <span className="text-[11px] text-muted">
                      {format(bar.startDate, 'M/d')}
                      {bar.isOngoing ? ' ~' : ` ~ ${format(bar.endDate, 'M/d')}`}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 팝오버 */}
      <DayPopover
        date={selection?.date ?? null}
        books={selectedDateBooks}
        anchorCell={selection?.anchor ?? null}
        onClose={handlePopoverClose}
      />
    </div>
  );
}

/* ─── 주 단위 세그먼트 빌더 ─── */
// Design Ref: §6.2 — 주 단위 세그먼트 분할로 월/주 경계 처리
interface WeekSegment {
  bar: BarLayoutRow['bar'];
  row: number;
  weekIdx: number; // 0~5
  startCol: number; // 0~6
  spanCols: number; // 1~7
  clippedLeft: boolean; // 원본 bar의 시작 이전(주 경계 또는 그리드 경계로 잘림)
  clippedRight: boolean;
  isFirstSegment: boolean; // 이 세그먼트가 원본 bar의 최초 세그먼트인지
  isLastSegment: boolean;
}

function buildWeekSegments(
  layout: BarLayoutRow[],
  gridDays: { date: Date }[],
): WeekSegment[] {
  const segments: WeekSegment[] = [];
  // 날짜 → 그리드 인덱스 맵
  const idxMap = new Map<string, number>();
  gridDays.forEach((d, i) => {
    idxMap.set(d.date.toDateString(), i);
  });

  for (const { bar, row } of layout) {
    const startIdx = idxMap.get(bar.startDate.toDateString());
    const endIdx = idxMap.get(bar.endDate.toDateString());
    if (startIdx === undefined || endIdx === undefined) continue;

    // 주 단위로 분할
    let cursor = startIdx;
    while (cursor <= endIdx) {
      const weekIdx = Math.floor(cursor / 7);
      const weekEnd = weekIdx * 7 + 6;
      const segEnd = Math.min(endIdx, weekEnd);
      const startCol = cursor % 7;
      const spanCols = segEnd - cursor + 1;

      const isFirstSegment = cursor === startIdx;
      const isLastSegment = segEnd === endIdx;

      segments.push({
        bar,
        row,
        weekIdx,
        startCol,
        spanCols,
        clippedLeft: !isFirstSegment,
        clippedRight: !isLastSegment,
        isFirstSegment,
        isLastSegment,
      });

      cursor = segEnd + 1;
    }
  }

  return segments;
}

