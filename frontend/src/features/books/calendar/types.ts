// Design Ref: §4.1 — Frontend calendar types
import type { Book } from '@/types/book';

/** 바 레이어 레이아웃 상수 (CalendarView와 CalendarBookBar가 공유) */
export const CALENDAR_BAR_METRICS = {
  BAR_HEIGHT: 18,
  BAR_GAP: 2,
  HEADER_HEIGHT: 22,
} as const;

/** 한 권의 책을 캘린더에 표시하기 위한 정규화된 바 */
export interface CalendarBar {
  userBookId: number;
  book: Book;
  status: 'READING' | 'COMPLETED';
  /** 표시용 시작일 (월 그리드로 클리핑됐을 수 있음) */
  startDate: Date;
  /** 표시용 종료일 (COMPLETED: 실제 완독일, READING: 오늘, 클리핑됐을 수 있음) */
  endDate: Date;
  /** 원본 시작일 (클리핑 전). 툴팁/기간 계산용 */
  originalStartDate: Date;
  /** 원본 종료일 (클리핑 전). READING이면 "오늘" */
  originalEndDate: Date;
  isOngoing: boolean; // true=점선, false=실선
  color: string; // statusColors
}

/** 월 그리드의 단일 날짜 셀 */
export interface DaySlot {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/** 월 그리드 전체 (6행 × 7열 = 42 셀) */
export interface MonthGrid {
  year: number;
  month: number; // 0~11
  days: DaySlot[]; // 42개
  firstDay: Date;
  lastDay: Date;
}

/** Greedy 슬롯 배정 결과 */
export interface BarLayoutRow {
  bar: CalendarBar;
  row: number; // 0부터 시작, 같은 row끼리는 겹치지 않음
}

/** 오버플로 카운트 (key: "YYYY-MM-DD") */
export type OverflowMap = Record<string, number>;
