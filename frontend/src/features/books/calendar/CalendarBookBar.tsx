// Design Ref: §6.2 — CalendarBookBar
import { useNavigate } from 'react-router-dom';
import type { CalendarBar } from './types';
import { CALENDAR_BAR_METRICS } from './types';
import { format, differenceInCalendarDays } from 'date-fns';

interface CalendarBookBarProps {
  bar: CalendarBar;
  row: number;
  startCol: number; // 0~6 (주 내 시작 요일)
  spanCols: number; // 1~7
  clippedLeft: boolean;
  clippedRight: boolean;
}

const { BAR_HEIGHT, BAR_GAP, HEADER_HEIGHT } = CALENDAR_BAR_METRICS;

export default function CalendarBookBar({
  bar,
  row,
  startCol,
  spanCols,
  clippedLeft,
  clippedRight,
}: CalendarBookBarProps) {
  const navigate = useNavigate();

  const top = HEADER_HEIGHT + row * (BAR_HEIGHT + BAR_GAP);
  const leftPct = (startCol / 7) * 100;
  const widthPct = (spanCols / 7) * 100;

  // 원본 날짜(클리핑 전)로 기간 계산 — 월 경계를 걸친 책도 정확
  const durationDays = differenceInCalendarDays(bar.originalEndDate, bar.originalStartDate) + 1;
  const startDateStr = format(bar.originalStartDate, 'yyyy/M/d');
  const endDateStr = format(bar.originalEndDate, 'yyyy/M/d');

  // 바 전체 툴팁 (hover 시 시작·완독·기간 정보)
  const title = bar.isOngoing
    ? `${bar.book.title}\n시작일: ${startDateStr} · 읽은 지 ${durationDays}일째`
    : `${bar.book.title}\n시작일: ${startDateStr} → 완독일: ${endDateStr}\n총 ${durationDays}일`;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/books/${bar.userBookId}`);
  };

  // Plan SC: SC-02, SC-04 — 실선/점선 + 월 경계 flat corner
  const borderRadius = [
    !clippedLeft ? '9999px' : '0',
    !clippedRight ? '9999px' : '0',
    !clippedRight ? '9999px' : '0',
    !clippedLeft ? '9999px' : '0',
  ].join(' ');

  const backgroundStyle = bar.isOngoing
    ? {
        backgroundColor: 'transparent',
        border: `2px dashed ${bar.color}`,
      }
    : {
        backgroundColor: bar.color,
      };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      aria-label={
        bar.isOngoing
          ? `《${bar.book.title}》 읽는 중. ${format(bar.originalStartDate, 'yyyy년 M월 d일')} 시작, 읽은 지 ${durationDays}일째`
          : `《${bar.book.title}》 완독. ${format(bar.originalStartDate, 'yyyy년 M월 d일')} 시작, ${format(bar.originalEndDate, 'yyyy년 M월 d일')} 완독, 총 ${durationDays}일`
      }
      className="absolute flex items-center gap-0.5 overflow-hidden px-1 text-[10px] font-medium text-white shadow-sm transition-opacity hover:opacity-80"
      style={{
        top: `${top}px`,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        height: `${BAR_HEIGHT}px`,
        borderRadius,
        color: bar.isOngoing ? bar.color : '#ffffff',
        ...backgroundStyle,
      }}
    >
      {clippedLeft && <span aria-hidden="true" className="shrink-0 text-[11px] opacity-70">‹</span>}

      <span className="min-w-0 flex-1 truncate text-left">{bar.book.title}</span>

      {clippedRight && <span aria-hidden="true" className="shrink-0 text-[11px] opacity-70">›</span>}
    </button>
  );
}
