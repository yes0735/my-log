# 독서 캘린더 뷰 Design Document

> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-12
> **Status**: Draft
> **Architecture**: **Option C — Pragmatic Balance**
> **Parent Plan**: [reading-calendar-view.plan.md](../../01-plan/features/reading-calendar-view.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 독서 기록의 감성적/회고적 가치 강화, 시간 기반 패턴 인지 |
| **WHO** | 내 서재 적극 사용자, 병행 독서자, 완독 이력 회고자 |
| **RISK** | null 데이터 다수, 바 겹침, 월 경계, 모바일 가독성 |
| **SUCCESS** | 월간 뷰 정확 렌더, 월 이동·팝오버·이동 정상, 기존 뷰 회귀 없음 |
| **SCOPE** | Phase 1: 월간 + 하이브리드(바/아이콘) + 팝오버 + 모바일 폴백 + 결측 배너. Out: 연간 히트맵, 주간, 드래그 편집, DB 백필 |

---

## 1. Overview

### 1.1 Goal

`BookList` 페이지에 4번째 뷰 모드 `calendar`를 추가하여, `UserBook.startDate`/`endDate`를 기반으로 독서 여정을 월간 달력에 시각화한다.

### 1.2 Architecture Decision

**Option C — Pragmatic Balance** 선택. 컴포넌트는 `features/books/calendar/`로 분리하되, 월/팝오버 상태는 `CalendarView` 내 `useState`로 지역화한다. 순수 유틸은 `lib/calendar.ts`로 분리하여 단위 테스트 및 재사용(Phase 2 연간 히트맵)을 준비한다.

**고려했지만 채택하지 않은 안**:
- **Option A (Minimal)**: `BookList.tsx`가 이미 425줄 → 비대화 위험으로 기각
- **Option B (Clean)**: `hooks/` 3개, 12개 신규 파일은 YAGNI 위반 (연간 뷰 추가 전 과분리)

### 1.3 Key Principles

1. **순수/불순 분리**: 날짜 계산·레이아웃은 순수 함수(`lib/calendar.ts`), UI/상태는 컴포넌트
2. **상태 지역화**: 월 네비/팝오버 상태는 `CalendarView` 내부에만, BookList와 결합하지 않음
3. **기존 데이터 재사용**: `bookApi.getMyBooks` 그대로, 백엔드 변경 없음
4. **점진적 통합**: 기존 뷰 모드 탭 구조(`gallery|table|board`) 확장만, 기존 로직 수정 최소

---

## 2. Module Map

```
frontend/src/
├── features/books/calendar/                    ← 신규 모듈
│   ├── CalendarView.tsx         [NEW] 컨테이너. 월 상태·팝오버 상태·데이터 필터링
│   ├── CalendarBookBar.tsx      [NEW] 단일 책 바 (완독=실선, 진행중=점선)
│   ├── DayPopover.tsx           [NEW] 날짜 클릭 팝오버
│   └── types.ts                 [NEW] CalendarBar, DaySlot, MonthGrid, BarLayoutRow
│
├── lib/
│   └── calendar.ts              [NEW] 순수 유틸: buildMonthGrid, mapBooksToBars, allocateSlots
│
├── pages/
│   ├── BookList.tsx             [MOD] ViewMode에 'calendar' 추가, <CalendarView/> 위임
│   └── BookDetail.tsx           [MOD] startDate/endDate 결측 시 안내 배너
│
├── types/book.ts                (무변경)
└── features/books/api.ts        (무변경)
```

**영향 범위**: 신규 5 파일, 수정 2 파일.

---

## 3. Component Tree

```
<BookList>
  ├─ <ViewModeTabs> (기존 + Calendar 탭 추가)
  ├─ <StatusFilters> (기존)
  ├─ <CategoryFilters> (기존)
  │
  ├─ viewMode === 'gallery'  → <GalleryView/>   (기존)
  ├─ viewMode === 'table'    → <TableView/>     (기존)
  ├─ viewMode === 'board'    → <BoardView/>     (기존)
  └─ viewMode === 'calendar' → <CalendarView books={items} status={status} />
       │
       ├─ <CalendarHeader>
       │   ├─ <MonthNav>  (prev / today / next)
       │   └─ <MonthTitle> (YYYY년 M월)
       │
       ├─ [Desktop ≥md]
       │   └─ <MonthGrid>                      ← CalendarView 내부 인라인
       │       ├─ <WeekdayHeader/>
       │       └─ <DayCell day={d}>            ← 셀 하나
       │           ├─ <DayNumber/>
       │           ├─ <CalendarBookBar*/>     ← 겹침 슬롯별로 N개
       │           └─ <OverflowBadge count/>   ← "+N권"
       │
       ├─ [Mobile <md]
       │   └─ <MobileMonthList>                ← 리스트 폴백
       │       └─ <BookRow/>                   ← 시작일순 정렬
       │
       ├─ <DayPopover open={selectedDate}>     ← 날짜 클릭 시
       │   └─ <BookListItem* → /books/:id>
       │
       └─ <EmptyState/>                         ← 월 내 0권 또는 전체 0권
```

*`<CalendarBookBar>`와 `<BookListItem>`은 반복 렌더*

---

## 4. Data Model

### 4.1 Frontend Types (`features/books/calendar/types.ts`)

```typescript
import type { UserBook } from '@/types/book';

/** 한 권의 책을 캘린더에 표시하기 위한 정규화된 바 */
export interface CalendarBar {
  userBookId: number;
  book: UserBook['book'];                // title, author, coverImageUrl
  status: 'READING' | 'COMPLETED';
  startDate: Date;                        // 파싱된 Date
  endDate: Date;                          // COMPLETED=endDate, READING=오늘
  isOngoing: boolean;                     // true=점선, false=실선
  color: string;                          // statusColors
}

/** 월 그리드의 단일 날짜 셀 */
export interface DaySlot {
  date: Date;
  dayNumber: number;                      // 1~31
  isCurrentMonth: boolean;                // prev/next month overflow 플래그
  isToday: boolean;
  isWeekend: boolean;
}

/** 월 그리드 전체 (6행 × 7열 = 42 셀) */
export interface MonthGrid {
  year: number;
  month: number;                          // 0~11
  days: DaySlot[];                        // 42개
  firstDay: Date;                         // 그리드 시작 (이전달 포함)
  lastDay: Date;                          // 그리드 끝 (다음달 포함)
}

/**
 * 겹침 회피를 위한 레이아웃 결과.
 * 각 bar에 "row" (y축 슬롯 번호)가 배정된다.
 */
export interface BarLayoutRow {
  bar: CalendarBar;
  row: number;                            // 0부터 시작, 같은 row는 겹치지 않음
}

/** 최대 표시 슬롯 초과 시 셀별 오버플로 카운트 */
export type OverflowMap = Record<string, number>; // key: "YYYY-MM-DD"
```

### 4.2 Backend (변경 없음)

`UserBookResponse`:
```json
{
  "id": 42,
  "book": { "id": 7, "title": "...", "coverImageUrl": "..." },
  "status": "COMPLETED",
  "startDate": "2026-03-28",
  "endDate": "2026-04-05",
  ...
}
```

---

## 5. Pure Utilities (`lib/calendar.ts`)

### 5.1 API

```typescript
import { addDays, differenceInDays, eachDayOfInterval, endOfMonth,
         isSameDay, isWeekend, startOfMonth, startOfWeek, endOfWeek,
         parseISO, isValid, max as dateMax, min as dateMin } from 'date-fns';
import type { UserBook } from '@/types/book';
import type { CalendarBar, DaySlot, MonthGrid, BarLayoutRow, OverflowMap } from
  '@/features/books/calendar/types';

/**
 * 6x7 월 그리드 생성.
 * - 주 시작: 일요일 (한국 관행)
 * - 이전/다음 달 overflow 포함하여 항상 42 셀
 */
export function buildMonthGrid(year: number, month: number): MonthGrid;

/**
 * UserBook[] → CalendarBar[] 변환.
 * - status ∈ {READING, COMPLETED} 만 포함
 * - startDate == null 제외
 * - READING: endDate = 오늘
 * - COMPLETED: endDate 없으면 startDate 당일 처리
 * - endDate < startDate 제외 (손상 데이터)
 */
export function mapBooksToBars(books: UserBook[], today?: Date): CalendarBar[];

/**
 * 월 그리드 범위로 바를 클리핑.
 * - 그리드 범위 밖 바 제외
 * - 시작이 그리드 앞이면 clipped.startDate = grid.firstDay
 * - 끝이 그리드 뒤면 clipped.endDate = grid.lastDay
 */
export function clipBarsToGrid(bars: CalendarBar[], grid: MonthGrid): CalendarBar[];

/**
 * Greedy slot allocator — 겹침 회피.
 * - 각 row는 종료 날짜를 저장, 새 바가 들어올 때 첫 번째 비어있는 row에 배치
 * - maxRows 초과 시 제외되고 OverflowMap에 집계
 * - 입력은 startDate 오름차순으로 정렬되어야 함
 */
export function allocateSlots(
  bars: CalendarBar[],
  maxRows: number,
): { layout: BarLayoutRow[]; overflow: OverflowMap };

/**
 * 주어진 날짜에 "관련된" 책을 추출 (시작, 완독, 또는 진행중)
 * DayPopover용.
 */
export function booksForDate(bars: CalendarBar[], date: Date): CalendarBar[];

/** YYYY-MM-DD 키 헬퍼 */
export function dateKey(date: Date): string;
```

### 5.2 Algorithm: `allocateSlots` (Greedy)

```
Input:  bars (startDate 오름차순), maxRows
Output: layout[], overflow{}

rowsEndDate = array of length maxRows, init all = -Infinity
layout = []
overflow = {}

for bar in bars:
  placed = false
  for row in 0..maxRows-1:
    if bar.startDate > rowsEndDate[row]:
      rowsEndDate[row] = bar.endDate
      layout.push({ bar, row })
      placed = true
      break
  if not placed:
    for each day d in bar range:
      overflow[dateKey(d)] = (overflow[dateKey(d)] ?? 0) + 1

return { layout, overflow }
```

**복잡도**: O(N × maxRows) — N ≤ 300, maxRows = 3 → 무시 가능.

**성질**:
- startDate 정렬 전제로 greedy 최적 (Interval Graph Coloring)
- maxRows 낮을수록 오버플로 증가 → Phase 1은 3 권장

### 5.3 Month Boundary Handling

월 경계를 걸친 바의 시각적 처리:

| 상황 | 처리 |
|------|------|
| 시작 < 그리드 시작 | 바 왼쪽 끝 flat (rounded 없음), 왼쪽에 "←" 힌트 아이콘 |
| 끝 > 그리드 끝 | 바 오른쪽 끝 flat, 오른쪽에 "→" 힌트 |
| 시작이 이전달(overflow 셀) | 해당 overflow 셀부터 그려 연속성 유지 |
| 끝이 다음달(overflow 셀) | overflow 셀까지 연장 |

---

## 6. Component Specifications

### 6.1 `CalendarView.tsx`

**Props**:
```typescript
interface CalendarViewProps {
  books: UserBook[];          // BookList에서 내려받음 (이미 필터 적용된 상태)
  statusFilter: string;       // '' | 'READING' | 'COMPLETED' | 'WANT_TO_READ'
}
```

**Local State**:
```typescript
const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
const [selectedDate, setSelectedDate] = useState<Date | null>(null);
```

**Responsibilities**:
1. `books` → `CalendarBar[]` 변환 (`mapBooksToBars` + status 재필터)
2. `currentMonth` → `MonthGrid` 빌드 (`buildMonthGrid`)
3. `clipBarsToGrid` → `allocateSlots` (maxRows=3)
4. 데스크탑/모바일 분기 렌더
5. 키보드 이벤트 바인딩 (← → Home)
6. `selectedDate` 변경 시 `DayPopover` 열기

**Derived memoization**: `useMemo`로 `monthGrid`, `bars`, `layout` 캐시 (`currentMonth`, `books` 변경 시에만 재계산).

**WANT_TO_READ 필터 처리**: 사용자가 `status=WANT_TO_READ` 필터를 건 상태로 캘린더 탭에 진입하면 "캘린더는 읽는중/완독 책만 표시합니다" 안내 + "전체 보기" 원클릭 버튼.

### 6.2 `CalendarBookBar.tsx`

**Props**:
```typescript
interface CalendarBookBarProps {
  bar: CalendarBar;
  row: number;              // y축 슬롯 (0,1,2...)
  startCol: number;         // 0~6 (해당 주 내 시작 요일)
  spanCols: number;         // 1~7 (해당 주 내 길이)
  clippedLeft: boolean;     // 왼쪽이 월/주 경계로 잘렸는가
  clippedRight: boolean;
  onBarClick: (bar: CalendarBar) => void;
}
```

**렌더**:
- `position: absolute`로 셀 위에 오버레이
- 상단 오프셋: `top = headerHeight + row × (barHeight + gap)`
- width = `spanCols × cellWidth - (padding × 2)`
- 스타일:
  - `COMPLETED`: `bg-[#22c55e]`, rounded-full (양쪽), 실선
  - `READING`: `bg-[#eab308]`, `border-dashed border-2`, "진행중" 마이크로 라벨
  - 좌/우 clipped 시 해당 쪽 `rounded-none` + 화살표
- 시작 셀에 📖, 끝 셀에 ✅ (공간 ≥ 2 cells일 때만)
- 클릭 → `onBarClick(bar)` → `/books/:userBookId` 이동 (React Router `navigate`)
- hover 시 title 툴팁 (책 제목, 기간 "3/28 → 4/5")

**주 단위 분할**: 한 바가 여러 주에 걸치면 주별로 세그먼트 분리 (각 주마다 별도 `<CalendarBookBar/>` 렌더). 렌더링 측면에서 가장 단순.

### 6.3 `DayPopover.tsx`

**Props**:
```typescript
interface DayPopoverProps {
  date: Date | null;       // null이면 닫힘
  books: CalendarBar[];    // booksForDate 결과
  anchorCell: HTMLElement | null;
  onClose: () => void;
}
```

**구현**:
- Radix UI 없이 자체 구현 (불필요한 의존성 회피)
- `position: fixed` + anchor cell의 `getBoundingClientRect()`로 위치 계산
- 화면 경계 감지 (오른쪽 끝 셀이면 왼쪽 flip)
- ESC 키 / 외부 클릭 → `onClose`
- 각 책 아이템:
  - 표지(32×48px) + 제목 + 상태 뱃지 + 기간 "3/28 ~ 4/5" (진행중은 "3/28 ~")
  - 클릭 → `navigate('/books/' + userBookId)`
- 접근성: `role="dialog"`, `aria-labelledby`, 포커스 트랩

### 6.4 `BookList.tsx` 수정 사항

**Before (현재 425줄)**:
```typescript
type ViewMode = 'gallery' | 'table' | 'board';
```

**After**:
```typescript
type ViewMode = 'gallery' | 'table' | 'board' | 'calendar';

const VIEW_TABS = [
  { mode: 'gallery', icon: IoGridOutline, label: '갤러리' },
  { mode: 'table', icon: IoListOutline, label: '테이블' },
  { mode: 'board', icon: IoAppsOutline, label: '보드' },
  { mode: 'calendar', icon: IoCalendarOutline, label: '캘린더' },  // NEW
] as const;
```

**렌더 분기 추가**:
```tsx
{viewMode === 'gallery' ? ( ... )
  : viewMode === 'table' ? <TableView .../>
  : viewMode === 'board' ? <BoardView .../>
  : <CalendarView books={filteredByCategory} statusFilter={status} />}
```

**캘린더 뷰에서 정렬 UI 처리**: `viewMode === 'calendar'` 일 때 `<select sort>`를 `disabled` (날짜축 고정) + 시각적 회색 처리. DnD 센서도 캘린더 뷰에서는 비활성화.

### 6.5 `BookDetail.tsx` 수정 사항

READING 또는 COMPLETED인데 `startDate == null || endDate == null` (완독인데 endDate 없음)인 경우:

```tsx
{needsDateGuide && (
  <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm">
    <span>📅 </span>
    <span className="font-medium">날짜를 입력하면 캘린더 뷰에서 이 책의 독서 여정을 확인할 수 있어요.</span>
    <button onClick={() => setShowDateEditor(true)} className="ml-2 text-primary underline">
      지금 입력하기
    </button>
  </div>
)}
```

인라인 `<input type="date">` 2개 + 저장 버튼 → `bookApi.updateMyBook({ startDate, endDate })`.

---

## 7. Interaction Flow

### 7.1 월 이동

```
User clicks "다음" button
  → setCurrentMonth(addMonths(currentMonth, 1))
  → useMemo 재계산 (monthGrid, bars, layout)
  → Month Grid 재렌더 (데이터 재로딩 없음 — 클라이언트 필터)
```

### 7.2 날짜 클릭 → 팝오버

```
User clicks day cell
  → setSelectedDate(cell.date)
  → DayPopover open={true}, books={booksForDate(bars, selectedDate)}
User clicks book item
  → navigate('/books/' + userBookId)
User presses ESC or clicks outside
  → setSelectedDate(null)
```

### 7.3 바 직접 클릭

```
User clicks CalendarBookBar (not the cell)
  → e.stopPropagation() (팝오버 open 방지)
  → navigate('/books/' + bar.userBookId)
```

### 7.4 키보드 네비게이션

```
← : setCurrentMonth(subMonths(currentMonth, 1))
→ : setCurrentMonth(addMonths(currentMonth, 1))
Home : setCurrentMonth(new Date())
ESC : setSelectedDate(null)
```

### 7.5 빈 상태

```
if bars.length === 0 && books with startDate === 0:
  → 전체 빈 상태: "아직 읽기 시작한 책이 없어요" + "책 추가" CTA
else if clippedBars in current month === 0:
  → 월별 빈 상태: "이번 달 읽은 책이 없어요" + 주변 월로 이동 힌트
```

---

## 8. Test Plan

### 8.1 Unit Tests (`lib/calendar.test.ts`)

```typescript
describe('buildMonthGrid', () => {
  it('generates 42 days starting from Sunday of first week');
  it('marks current month vs overflow days correctly');
  it('handles February in leap year');
});

describe('mapBooksToBars', () => {
  it('filters out WANT_TO_READ');
  it('filters out books without startDate');
  it('sets endDate=today for READING books');
  it('excludes books with endDate < startDate (corrupted)');
});

describe('clipBarsToGrid', () => {
  it('clips bar starting before grid range');
  it('clips bar ending after grid range');
  it('preserves bars fully inside grid');
  it('excludes bars fully outside grid');
});

describe('allocateSlots', () => {
  it('places non-overlapping bars in row 0');
  it('moves overlapping bars to row 1, 2, ...');
  it('counts overflow when exceeding maxRows');
  it('handles single-day bar');
});

describe('booksForDate', () => {
  it('returns bars where date is within [startDate, endDate]');
});
```

### 8.2 Component Tests (Optional, Phase 1에서는 생략 가능)

Vitest + React Testing Library:
- `<CalendarView/>` 렌더 시 현재 월 표시
- 월 네비 버튼 클릭 시 currentMonth 변경
- `<DayPopover/>` 외부 클릭으로 닫힘

### 8.3 E2E (Playwright, `tests/e2e/reading-calendar-view.spec.ts`)

**L1 — 뷰 전환**:
- `/books` 진입 → 캘린더 탭 클릭 → MonthGrid 렌더 확인
- 탭 전환이 데이터 재로딩 없이 즉시

**L2 — 월 네비게이션**:
- "이전" 클릭 → 월 제목 변경
- "오늘" 클릭 → 오늘이 포함된 월로 이동

**L3 — 책 표시**:
- 사전 조건: 3월 28일 시작 → 4월 5일 완독 책 1권 (시드)
- 3월 뷰: 28~31일에 바 표시 (우측 연속 힌트)
- 4월 뷰: 1~5일에 바 표시 (좌측 연속 힌트)

**L4 — 날짜 클릭 팝오버**:
- 해당 책 기간 내 날짜 클릭 → 팝오버 노출 → 책 제목 보임
- 책 아이템 클릭 → `/books/:id` 이동

**L5 — 빈 상태**:
- startDate 없는 계정으로 → 전체 빈 상태 메시지

**L6 — 필터 조합**:
- 상태=READING 필터 → 완독 바 미노출, 진행중 바만 노출

**L7 — 모바일**:
- viewport 375×667 → 리스트 폴백 레이아웃 렌더

### 8.4 Manual Verification Checklist

- [ ] 다크모드에서 바 색상/대비 정상
- [ ] 월 경계 바가 이전/다음 월에서 연속 표시
- [ ] 병행 3권 이상일 때 슬롯 겹침 없음
- [ ] 4권 이상일 때 "+N권" 뱃지 표시
- [ ] 오늘 날짜 셀 하이라이트
- [ ] READING/COMPLETED 전환 시 바 스타일 정확
- [ ] 키보드 네비게이션 동작
- [ ] 400+권 서재에서 렌더 < 1초

---

## 9. Performance Considerations

### 9.1 Memoization

```typescript
const bars = useMemo(() => mapBooksToBars(books), [books]);
const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
const layout = useMemo(
  () => allocateSlots(clipBarsToGrid(bars, grid), 3),
  [bars, grid]
);
```

### 9.2 Computed Cost

- `books` ~300권 기준
- `mapBooksToBars`: O(N) = 300 연산 → < 1ms
- `buildMonthGrid`: O(42) → < 0.1ms
- `clipBarsToGrid`: O(N) = 300 → < 1ms
- `allocateSlots`: O(N × 3) = 900 → < 1ms
- 합계: < 5ms → NFR-01 충족 (여유)

### 9.3 Bundle Impact

- `date-fns` v3, tree-shaken imports:
  - `startOfMonth`, `endOfMonth`, `startOfWeek`, `endOfWeek`
  - `eachDayOfInterval`, `addMonths`, `subMonths`
  - `parseISO`, `isValid`, `isSameDay`, `differenceInDays`, `format`
- 예상 추가: ~20KB gzip → NFR-03 충족
- 대안: 직접 Date 계산 구현 시 ~5KB 절약 가능하지만 유지보수 비용 ↑

---

## 10. Accessibility

- 월 그리드: `role="grid"`, 주 = `role="row"`, 셀 = `role="gridcell"`
- 포커스 가능 셀: `tabIndex={0}` + Enter/Space로 팝오버 open
- `aria-label` 예: "2026년 4월 5일, 2권 관련"
- 월 네비 버튼: `aria-label="이전 달" / "다음 달" / "오늘로 이동"`
- 팝오버: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- 바: `aria-label` "《제목》 3월 28일 시작, 완독" 형식
- 색상 정보만으로 상태 구분하지 않음 (실선/점선 + 아이콘 병행)

---

## 11. Implementation Guide

### 11.1 Dependency Installation

```bash
cd frontend
npm install date-fns@^3
```

### 11.2 Implementation Order

**Phase 1 — 순수 유틸 (의존성 없음, 먼저 작성)**
1. `features/books/calendar/types.ts`
2. `lib/calendar.ts` + 5.1 API 전체 (순수 함수)
3. (권장) `lib/calendar.test.ts` 단위 테스트 — L1 Unit

**Phase 2 — 컴포넌트 (데스크탑 MVP)**
4. `CalendarView.tsx` 스켈레톤 (월 상태 + 그리드 렌더만)
5. `CalendarBookBar.tsx` 기본 렌더
6. `CalendarView.tsx`에 바 레이어 통합
7. `DayPopover.tsx`
8. `CalendarView.tsx`에 팝오버 연결 + 키보드 이벤트

**Phase 3 — BookList 통합**
9. `BookList.tsx`: `ViewMode`, `VIEW_TABS`, 탭 버튼, 렌더 분기, 캘린더 탭에서 정렬 비활성화

**Phase 4 — 엣지 처리**
10. 빈 상태 3종 (전체 0권 / 월별 0권 / WANT_TO_READ 필터 경고)
11. 모바일 폴백 (리스트 레이아웃)
12. 월 경계 시각 힌트 (화살표, flat corner)

**Phase 5 — 결측 가이드**
13. `BookDetail.tsx` 안내 배너 + 인라인 날짜 입력

**Phase 6 — 검증**
14. 수동 체크리스트 통과
15. (옵션) Playwright E2E

### 11.3 Session Guide

**Module Map** (for `/pdca do reading-calendar-view --scope module-N`):

| Module | Name | Scope | Files | Est. LOC |
|--------|------|-------|-------|----------|
| **module-1** | Pure Utils | `lib/calendar.ts` + `types.ts` + unit tests | 3 | ~250 |
| **module-2** | Calendar Components | CalendarView, CalendarBookBar, DayPopover | 3 | ~400 |
| **module-3** | BookList Integration | BookList.tsx 수정 (뷰 탭, 렌더 분기) | 1 | ~30 |
| **module-4** | Edge Cases | 빈 상태, 모바일 폴백, WANT_TO_READ 경고 | CalendarView 내부 | ~80 |
| **module-5** | Missing Data Guide | BookDetail.tsx 배너 + 날짜 편집 | 1 | ~60 |
| **module-6** | Verification | 수동 QA + 옵션 Playwright | tests/ | ~150 |

**Recommended Session Plan**:
- **Session 1**: module-1 + module-2 (핵심 로직 + 컴포넌트, ~650 LOC)
- **Session 2**: module-3 + module-4 (통합 + 엣지, ~110 LOC)
- **Session 3**: module-5 + module-6 (결측 가이드 + 검증, ~210 LOC)

단일 세션 전체 구현도 가능 (~4시간 예상).

### 11.4 Code Comment Convention

Design 참조 주석 예시:

```typescript
// Design Ref: §5.2 — Greedy slot allocator
export function allocateSlots(...) { ... }

// Design Ref: §6.2 — CalendarBookBar clipped handling
// Plan SC: SC-04 월 경계 연속성
<CalendarBookBar clippedLeft={isStartBeforeGrid} ... />
```

### 11.5 Definition of Done

- [ ] 모든 Success Criteria SC-01 ~ SC-12 통과
- [ ] `npm run build` 에러 없음
- [ ] `npm run lint` 에러 없음
- [ ] `lib/calendar.test.ts` 단위 테스트 통과 (작성한 경우)
- [ ] 수동 체크리스트 8.4 통과
- [ ] 다크모드 시각 확인
- [ ] 모바일 뷰포트 확인
- [ ] BookList.tsx 회귀 테스트 (기존 3개 뷰 정상)

---

## 12. Risks Revisited (Design-level)

| Risk | 완화 전략 (Design) |
|------|-------------------|
| `BookList.tsx` 비대화 | `<CalendarView/>` 위임만 — BookList 변경은 ~30 LOC로 제한 |
| 바 겹침 복잡도 | Greedy O(N×maxRows), maxRows=3 고정, 초과는 "+N" 뱃지 |
| 월 경계 처리 누락 | 주 단위 세그먼트 분할 + `clippedLeft/Right` 플래그로 명시화 |
| 팝오버 위치 버그 | `getBoundingClientRect` + viewport 경계 감지, 화살표로 flip |
| date-fns 번들 크기 | Named imports만 사용 (default import 금지) |
| 모바일 가독성 | `<md` 브레이크포인트에서 리스트 폴백 강제 (Phase 1) |
| WANT_TO_READ 필터 모순 | 탭 진입 시 안내 배너 + "전체 보기" 원클릭 |

---

## 13. Open Design Questions (Do 단계에서 확정)

- [ ] `maxRows=3`이 실제 사용에서 적절한가? (사용자 피드백 후 조정 가능)
- [ ] 모바일 폴백 레이아웃을 "리스트"로 할지 "가로 스크롤 그리드"로 할지 (기본: 리스트)
- [ ] 바 세그먼트 분할을 주 단위(매주 쪼갬)로 할지, 월 경계만 쪼갤지 (기본: 주 단위 — 구현 단순)
- [ ] 인터랙티브 호버 시 같은 책의 다른 주 세그먼트도 동시 하이라이트할지 (Phase 2 고려)

---

## 14. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Author | kyungheelee | Pending | 2026-04-12 |
| Reviewer | - | - | - |

---

*Generated by bkit PDCA Design skill — Architecture: Option C (Pragmatic Balance)*
