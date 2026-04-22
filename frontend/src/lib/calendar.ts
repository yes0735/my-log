// Design Ref: §5 — Pure calendar utilities
// 순수 함수만 포함. UI/상태 의존성 없음 → 단위 테스트 및 재사용 가능.
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isWeekend,
  parseISO,
  isValid,
  isWithinInterval,
  format,
  max as dateMax,
  min as dateMin,
  isBefore,
  isAfter,
} from 'date-fns';
import type { UserBook } from '@/types/book';
import type {
  CalendarBar,
  DaySlot,
  MonthGrid,
  BarLayoutRow,
  OverflowMap,
} from '@/features/books/calendar/types';

const STATUS_COLORS = {
  READING: '#eab308',
  COMPLETED: '#22c55e',
} as const;

/** YYYY-MM-DD 키 생성 */
// Design Ref: §5.1 — dateKey helper
export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * 6x7 월 그리드 생성.
 * - 주 시작: 일요일 (한국 관행)
 * - 이전/다음 달 overflow 포함
 */
// Design Ref: §5.1 — buildMonthGrid
export function buildMonthGrid(year: number, month: number): MonthGrid {
  const monthAnchor = new Date(year, month, 1);
  const firstDayOfMonth = startOfMonth(monthAnchor);
  const lastDayOfMonth = endOfMonth(monthAnchor);
  const gridStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });
  const today = new Date();

  const rawDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // 항상 42 셀 보장 (6주 × 7일)
  const days: DaySlot[] = [];
  for (let i = 0; i < 42; i++) {
    const d = rawDays[i] ?? new Date(gridEnd.getTime() + (i - rawDays.length + 1) * 86400000);
    days.push({
      date: d,
      dayNumber: d.getDate(),
      isCurrentMonth: d.getMonth() === month && d.getFullYear() === year,
      isToday: isSameDay(d, today),
      isWeekend: isWeekend(d),
    });
  }

  return {
    year,
    month,
    days,
    firstDay: days[0].date,
    lastDay: days[41].date,
  };
}

/**
 * UserBook[] → CalendarBar[] 변환.
 * - status ∈ {READING, COMPLETED} 만 포함
 * - startDate == null 제외
 * - READING: endDate = 오늘
 * - COMPLETED: endDate 없으면 startDate 당일 처리
 * - endDate < startDate 제외 (손상 데이터)
 */
// Design Ref: §5.1 — mapBooksToBars
export function mapBooksToBars(books: UserBook[], today: Date = new Date()): CalendarBar[] {
  const bars: CalendarBar[] = [];
  for (const ub of books) {
    if (ub.status !== 'READING' && ub.status !== 'COMPLETED') continue;
    if (!ub.startDate) continue;

    const startDate = parseISO(ub.startDate);
    if (!isValid(startDate)) continue;

    let endDate: Date;
    if (ub.status === 'READING') {
      endDate = today;
    } else {
      // COMPLETED
      if (ub.endDate) {
        const parsed = parseISO(ub.endDate);
        endDate = isValid(parsed) ? parsed : startDate;
      } else {
        endDate = startDate;
      }
    }

    // 손상 데이터 제외 (warn)
    if (isBefore(endDate, startDate)) {
      console.warn(`[calendar] UserBook ${ub.id}: endDate(${ub.endDate}) < startDate(${ub.startDate}). Skipped.`);
      continue;
    }

    bars.push({
      userBookId: ub.id,
      book: ub.book,
      status: ub.status,
      startDate,
      endDate,
      originalStartDate: startDate,
      originalEndDate: endDate,
      isOngoing: ub.status === 'READING',
      color: STATUS_COLORS[ub.status],
    });
  }

  // startDate 오름차순 정렬 (greedy allocator 전제)
  bars.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return bars;
}

/**
 * 월 그리드 범위로 바를 클리핑.
 * - 그리드 범위 밖 바 제외
 * - 시작이 그리드 앞이면 clipped.startDate = grid.firstDay
 * - 끝이 그리드 뒤면 clipped.endDate = grid.lastDay
 * - 추가 플래그로 원본 범위 정보 유지 가능하지만 Phase 1은 단순화
 */
// Design Ref: §5.1 — clipBarsToGrid
export function clipBarsToGrid(bars: CalendarBar[], grid: MonthGrid): CalendarBar[] {
  const result: CalendarBar[] = [];
  for (const bar of bars) {
    // 그리드 범위와 전혀 겹치지 않음
    if (isBefore(bar.endDate, grid.firstDay) || isAfter(bar.startDate, grid.lastDay)) {
      continue;
    }
    const clippedStart = dateMax([bar.startDate, grid.firstDay]);
    const clippedEnd = dateMin([bar.endDate, grid.lastDay]);
    result.push({
      ...bar,
      startDate: clippedStart,
      endDate: clippedEnd,
    });
  }
  return result;
}

/**
 * Greedy slot allocator — 겹침 회피.
 * - 입력은 startDate 오름차순으로 정렬되어 있어야 함
 * - 각 row의 최종 종료일을 추적하며, 새 바가 기존 row와 겹치지 않으면 배치
 * - maxRows 초과 시 OverflowMap에 날짜별 카운트 누적
 */
// Design Ref: §5.2 — Greedy slot allocator
export function allocateSlots(
  bars: CalendarBar[],
  maxRows: number,
): { layout: BarLayoutRow[]; overflow: OverflowMap } {
  const rowsEndTime: number[] = new Array(maxRows).fill(-Infinity);
  const layout: BarLayoutRow[] = [];
  const overflow: OverflowMap = {};

  for (const bar of bars) {
    let placed = false;
    for (let row = 0; row < maxRows; row++) {
      if (bar.startDate.getTime() > rowsEndTime[row]) {
        rowsEndTime[row] = bar.endDate.getTime();
        layout.push({ bar, row });
        placed = true;
        break;
      }
    }
    if (!placed) {
      // 오버플로: 해당 기간의 모든 날짜에 +1
      const days = eachDayOfInterval({ start: bar.startDate, end: bar.endDate });
      for (const d of days) {
        const key = dateKey(d);
        overflow[key] = (overflow[key] ?? 0) + 1;
      }
    }
  }

  return { layout, overflow };
}

/** 주어진 날짜에 "관련된" 책(시작·진행중·완독일이 해당 날짜를 포함) 목록 반환 */
// Design Ref: §5.1 — booksForDate
export function booksForDate(bars: CalendarBar[], date: Date): CalendarBar[] {
  return bars.filter((bar) =>
    isWithinInterval(date, { start: bar.startDate, end: bar.endDate })
  );
}
