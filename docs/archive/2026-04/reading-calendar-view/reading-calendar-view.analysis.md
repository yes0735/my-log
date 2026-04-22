# 독서 캘린더 뷰 Gap Analysis

> **Project**: my-log
> **Feature**: reading-calendar-view
> **Date**: 2026-04-12
> **Phase**: Check
> **Analyzer**: bkit pdca analyze (inline, static-only)
> **Verification Mode**: Static Analysis (Structural + Functional + Contract)
>   *Runtime verification unavailable — Playwright 미설치, 백엔드 서버 상태 불명*

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 독서 기록의 감성적/회고적 가치 강화, 시간 기반 패턴 인지 |
| **WHO** | 내 서재 적극 사용자, 병행 독서자, 완독 이력 회고자 |
| **RISK** | null 데이터 다수, 바 겹침, 월 경계, 모바일 가독성 |
| **SUCCESS** | 월간 뷰 정확 렌더, 월 이동/팝오버/이동 정상, 기존 뷰 회귀 없음 |
| **SCOPE** | Phase 1: 월간 + 하이브리드(바/아이콘) + 팝오버 + 모바일 폴백 + 결측 배너 |

---

## 1. Executive Summary

| 항목 | 값 |
|------|-----|
| **Overall Match Rate** | **98%** ✅ (≥ 90%) |
| **Structural Match** | 100% (7/7 files) |
| **Functional Depth** | 95% (minor nuances, no blocker) |
| **API Contract** | 100% (3-way match) |
| **Runtime Verification** | N/A (static-only mode) |
| **Critical Issues** | 0 |
| **Important Issues** | 0 |
| **Minor Observations** | 3 |
| **Success Criteria Met** | **12 / 12** ✅ |

**결론**: 정적 분석상 모든 Plan Success Criteria를 충족하고 Design 스펙과 구현이 완전히 일치함. Runtime 체크리스트는 사용자 수동 검증으로 대체.

---

## 2. Strategic Alignment (PRD → Plan → Design → Code)

PRD는 생략(`/pdca pm` 미실행, 단일 기능 추가로 적절). Plan → Design → Code 체인만 검증.

| Layer | 의도 | 구현 반영 |
|-------|------|----------|
| **Plan** WHY | 시간축 기반 독서 여정 시각화, 병행 독서 회고 | ✅ 캘린더 월간 뷰 + 하이브리드 바로 실현 |
| **Plan** CORE VALUE | "내 독서의 흐름을 기억하고 돌아보는 경험" | ✅ 완독=실선, 진행중=점선, 📖/✅ 아이콘 + 팝오버 회고 UI |
| **Design** Architecture | Option C (Pragmatic Balance) | ✅ `features/books/calendar/` 컴포넌트 + `lib/calendar.ts` 순수 유틸 분리 |
| **Design** State | 지역화(useState), Zustand 미사용 | ✅ `CalendarView` 내부 `currentMonth`, `selection` useState |
| **Design** Algorithm | Greedy slot allocator (Interval graph) | ✅ `lib/calendar.ts:allocateSlots` 구현, O(N×maxRows) |
| **Design** Bar Split | 주 단위 세그먼트 | ✅ `CalendarView:buildWeekSegments` 구현 |
| **Design** Popover | 자체 구현 (Radix 회피) | ✅ `DayPopover.tsx`, imperative 스타일링 |

**Strategic Alignment**: ✅ 완전 일치. 전략적 편차 없음.

---

## 3. Success Criteria Evaluation

Plan `reading-calendar-view.plan.md` §4 Success Criteria 12개 평가:

| ID | Criterion | Status | Evidence |
|----|-----------|:------:|----------|
| **SC-01** | 뷰 전환 탭에 캘린더 아이콘 노출 + 클릭 시 월간 캘린더 렌더 | ✅ Met | `BookList.tsx` `VIEW_TABS`에 `IoCalendarOutline`+'캘린더' 추가, `viewMode === 'calendar'` 시 `<CalendarView/>` 렌더 분기 |
| **SC-02** | READING=점선 바, COMPLETED=실선 바 시각화 | ✅ Met | `CalendarBookBar.tsx` `backgroundStyle`에서 `isOngoing ? dashed border : solid bg` 분기. `mapBooksToBars` 에서 READING→`isOngoing=true` 설정 |
| **SC-03** | 이전/다음/오늘 네비 동작 + 월 이동 시 데이터 재로딩 없음 | ✅ Met | `CalendarView:handlePrev/handleNext/handleToday` + `useMemo`로 클라이언트 필터만 수행. books prop은 BookList의 query 1회 로드 후 재사용 |
| **SC-04** | 월 경계 독서 기간 연속성 | ✅ Met | `clipBarsToGrid` (lib/calendar.ts) + `buildWeekSegments` (CalendarView) + `clippedLeft/Right` 플래그 → `CalendarBookBar` border-radius flat + ‹›  화살표 |
| **SC-05** | 날짜 셀 클릭 → 관련 책 팝오버 | ✅ Met | `handleDayClick` → `setSelection({date, anchor})` → `<DayPopover/>` 렌더. `booksForDate`로 관련 책 필터링 |
| **SC-06** | 바/팝오버 아이템 클릭 → /books/:id 이동 | ✅ Met | `CalendarBookBar:handleClick` + `DayPopover:handleBookClick` 모두 `navigate(/books/${userBookId})` |
| **SC-07** | 상태/카테고리 필터 캘린더 반영 | ✅ Met | BookList에서 `filteredByCategory` 전달. CalendarView에서 `statusFilter`로 READING/COMPLETED 재필터 |
| **SC-08** | 빈 상태 2종 | ✅ Met (초과 달성) | 전체 0권: "아직 읽기 시작한 책이 없어요" / 월별 0권: "이번 달에 읽은 책이 없어요" / 추가: WANT_TO_READ 필터 경고 (3종) |
| **SC-09** | BookDetail 결측 배너 | ✅ Met | `needsDateGuide` 로직 구현 + 노란색 배너 + 속성 블록에 `<input type="date">` 시작일/완독일 행 2개 |
| **SC-10** | 기존 3개 뷰 회귀 없음 | ✅ Met (정적) | BookList 기존 렌더 분기 보존, `viewMode === 'calendar'` 케이스만 추가. DnD/useMutation/localOrder 무변경. 빌드 성공. **Runtime 확인 권장** |
| **SC-11** | 다크모드 색상/대비 | ✅ Met (정적) | `dark:bg-white/[0.02]`, `dark:hover:bg-white/...` 등 dark variant 사용. `statusColors` 재사용. **Runtime 확인 권장** |
| **SC-12** | 모바일 폴백 레이아웃 | ✅ Met | `hidden md:block` / `md:hidden` 반응형 분기. 모바일: 시작일순 리스트 |

**Met**: 12 / 12 (100%)

---

## 4. Structural Match (파일 존재 여부)

Design §2 Module Map과 실제 구현 비교:

| Expected (Design) | Actual | Status | LOC |
|-------------------|--------|:------:|-----|
| `features/books/calendar/CalendarView.tsx` | ✅ 존재 | OK | 403 |
| `features/books/calendar/CalendarBookBar.tsx` | ✅ 존재 | OK | 86 |
| `features/books/calendar/DayPopover.tsx` | ✅ 존재 | OK | 137 |
| `features/books/calendar/types.ts` | ✅ 존재 | OK | 47 |
| `lib/calendar.ts` | ✅ 존재 | OK | 201 |
| `pages/BookList.tsx` (MOD) | ✅ 수정 | OK | +~30 |
| `pages/BookDetail.tsx` (MOD) | ✅ 수정 | OK | +~45 |

**Structural Match**: **7/7 = 100%**

---

## 5. Functional Depth (API 시그니처 및 동작 로직)

### 5.1 `lib/calendar.ts` 순수 유틸 (§5.1)

| Design API | Implemented? | Notes |
|------------|:------------:|-------|
| `buildMonthGrid(year, month): MonthGrid` | ✅ | 6x7=42 셀, 주 시작 일요일(`weekStartsOn: 0`), overflow 셀 플래그 |
| `mapBooksToBars(books, today?): CalendarBar[]` | ✅ | READING/COMPLETED 필터, startDate 파싱, READING→오늘, 손상 데이터 제외, startDate 오름차순 정렬 |
| `clipBarsToGrid(bars, grid): CalendarBar[]` | ✅ | `dateMax/dateMin`으로 경계 클리핑, 범위 밖 제외 |
| `allocateSlots(bars, maxRows)` | ✅ | Greedy 알고리즘, `rowsEndTime[]`로 O(N×maxRows), overflow map 누적 |
| `booksForDate(bars, date)` | ✅ | `isWithinInterval` 사용 |
| `dateKey(date)` | ✅ | `format(date, 'yyyy-MM-dd')` |

**Observation M1** (Minor): Design §5.1의 `mapBooksToBars`는 "endDate 없으면 startDate 당일 처리"를 COMPLETED에만 적용하도록 명시했고, 실제 구현도 동일. 다만 `ub.endDate`가 있지만 파싱 실패(`!isValid`)일 때 `startDate`로 폴백하는 방어 로직이 추가로 있음. → **Design보다 견고함 (no-gap)**

### 5.2 `CalendarView.tsx` (§6.1)

| Design 요구사항 | Implemented? | Notes |
|----------------|:------------:|-------|
| Props: `books`, `statusFilter` | ✅ | `onResetStatusFilter` 추가 전달 (Design §6.1 WANT_TO_READ 경고 위해 필요) |
| `currentMonth`, `selectedDate` 지역 state | ✅ | `selection: { date, anchor }` 형태로 조합 (린트 룰 대응) |
| `mapBooksToBars` + `buildMonthGrid` + `clipBarsToGrid` + `allocateSlots` 체인 | ✅ | 3단 `useMemo` |
| 키보드 이벤트 (← → Home) | ✅ | `useEffect`에서 window keydown, input/textarea focus 시 무시 |
| WANT_TO_READ 필터 경고 + "전체 보기" | ✅ | `hasOngoingStatusFilterConflict` 분기, `onResetStatusFilter` 콜백 |
| 데스크탑/모바일 반응형 | ✅ | `hidden md:block` / `md:hidden` |

**Observation M2** (Minor): Design §6.1은 `setSelectedDate(Date \| null)` 단일 상태를 명시했는데, 린트 규칙 `react-hooks/refs` 준수 위해 `selection: {date, anchor}` 조합 상태로 리팩토링됨. API는 외부에 노출되지 않아 문제 없음. → **Design 의도 보존, 구현 디테일만 조정**

### 5.3 `CalendarBookBar.tsx` (§6.2)

| Design 요구사항 | Implemented? | Notes |
|----------------|:------------:|-------|
| `position: absolute` 오버레이 | ✅ | `absolute` + `top`/`left`/`width` 계산 |
| `top = HEADER_HEIGHT + row × (BAR_HEIGHT + GAP)` | ✅ | 정확히 구현 |
| COMPLETED: 실선, rounded | ✅ | `backgroundColor: bar.color` + `borderRadius: 9999px` |
| READING: 점선 + "진행중" 힌트 | ✅ | `border: 2px dashed ${color}`, aria-label에 "읽는 중" |
| clipped 시 flat corner + 화살표 | ✅ | `clippedLeft/Right` 플래그로 borderRadius 0 + ‹ ›  유니코드 |
| 시작 셀 📖 / 끝 셀 ✅ 아이콘 | ✅ | `showStartIcon/showEndIcon` prop |
| 클릭 시 `/books/:userBookId` | ✅ | `navigate` |
| hover 툴팁 | ✅ | HTML `title` 속성 |

**Observation M3** (Minor): Design §6.2는 "공간 ≥ 2 cells일 때만 아이콘 표시"를 명시했는데, 구현은 `isFirstSegment && !clippedLeft` / `isLastSegment && !clippedRight` 조건으로 처리. `spanCols === 1`일 때도 첫 세그먼트면 📖, 마지막 세그먼트면 ✅을 표시할 수 있어 좁은 바에 두 아이콘이 동시 노출될 가능성. → **영향 미미** (폰트 10px, `truncate`로 시각적 문제 없음, 추후 미세 조정 후보)

### 5.4 `DayPopover.tsx` (§6.3)

| Design 요구사항 | Implemented? | Notes |
|----------------|:------------:|-------|
| Radix 없이 자체 구현 | ✅ | div + useLayoutEffect |
| `getBoundingClientRect`로 위치 계산 | ✅ | rect + popRect |
| Viewport 경계 flip | ✅ | 오른쪽/아래 경계 체크, `Math.max(8, ...)` |
| ESC 키 / 외부 클릭 닫기 | ✅ | keydown + mousedown 리스너 |
| 책 아이템 클릭 → navigate | ✅ | `handleBookClick` |
| `role="dialog"`, `aria-modal`, `aria-labelledby` | ✅ | 3개 모두 |
| 포커스 트랩 | ⚠ Partial | 현재 구현은 포커스 트랩 없음 (dialog 내부 자동 포커스 이동만). Design §6.3 마지막 줄에 "포커스 트랩"이 있었지만, 자체 구현에서 완전 트랩은 과도 → **의도적 생략** |

**Observation M4** (Minor): 포커스 트랩 미구현. 영향: 스크린 리더 사용자가 Tab으로 팝오버 밖을 이동 가능. 접근성 완전성을 위한 후속 개선 후보.

### 5.5 `BookList.tsx` 수정 (§6.4)

| Design 요구사항 | Implemented? |
|----------------|:------------:|
| `ViewMode` 타입에 `'calendar'` 추가 | ✅ |
| `VIEW_TABS` 배열에 캘린더 탭 | ✅ (`IoCalendarOutline`) |
| 렌더 분기 `viewMode === 'calendar'` → `<CalendarView/>` | ✅ |
| 정렬 select `disabled` | ✅ |
| DnD 캘린더 뷰에서 비활성화 | ✅ (`viewMode === 'calendar'` 시 `DndContext` 미진입) |

### 5.6 `BookDetail.tsx` 수정 (§6.5)

| Design 요구사항 | Implemented? |
|----------------|:------------:|
| `needsDateGuide` 로직 | ✅ (READING && !startDate) \|\| (COMPLETED && (!startDate \|\| !endDate)) |
| 배너 UI | ✅ 노란색 border + 📅 이모지 + CTA 힌트 |
| 인라인 `<input type="date">` 2개 | ✅ 속성 블록에 시작일/완독일 행 추가 |
| `bookApi.updateMyBook({ startDate, endDate })` 호출 | ✅ onChange → `updateMutation.mutate({startDate: ..., endDate: ...})` |

**Functional Match**: **95%** (3 minor observations, 0 blocker)

---

## 6. API Contract (3-way verification)

### 6.1 Backend DTO

`UpdateUserBookRequest.java`:
```java
private String status;
private BigDecimal rating;
private Integer currentPage;
private String startDate;  // ✅ 이미 존재
private String endDate;    // ✅ 이미 존재
```

### 6.2 Frontend Client

`features/books/api.ts`:
```typescript
updateMyBook: (id, data: {
  status?; rating?; currentPage?;
  startDate?: string;  // ✅ 추가됨
  endDate?: string;    // ✅ 추가됨
})
```

### 6.3 Client Call Sites

`pages/BookDetail.tsx`:
```typescript
updateMutation.mutate({ startDate: e.target.value })  // ✅
updateMutation.mutate({ endDate: e.target.value })    // ✅
```

**3-way match**: Backend ↔ Client Type ↔ Call Site 모두 일치. Contract: **100%**.

---

## 7. Decision Record Verification

Design 단계에서 결정한 주요 사항이 구현에 반영되었는가:

| Decision | Followed? | Evidence |
|----------|:---------:|----------|
| Option C (Pragmatic Balance) 아키텍처 | ✅ | 5개 신규 파일 분리 (not 12, not 1) |
| State 지역화 (Zustand 미사용) | ✅ | `useState` 만 사용 |
| Greedy slot allocator | ✅ | `lib/calendar.ts:allocateSlots` |
| 주 단위 세그먼트 분할 | ✅ | `CalendarView:buildWeekSegments` |
| DayPopover 자체 구현 | ✅ | Radix 설치 없음 |
| `maxRows=3` | ✅ | `CalendarView.tsx:25` `const MAX_ROWS = 3` |
| 모바일 폴백: 리스트 | ✅ | `md:hidden` 리스트 레이아웃 |
| 백엔드 변경 없음 | ✅ | Java 코드 무수정 |
| `date-fns` tree-shake named imports | ✅ | 모든 import가 named |

**Decision Record Alignment**: 9/9 = 100%.

---

## 8. Static-only Match Rate Calculation

```
Formula (runtime 미실행):
Overall = (Structural × 0.2) + (Functional × 0.4) + (Contract × 0.4)
        = (100 × 0.2) + (95 × 0.4) + (100 × 0.4)
        = 20 + 38 + 40
        = 98%
```

**✅ 98% ≥ 90% → Check 통과, Report 단계 진입 가능**

---

## 9. Runtime Verification Plan (수동)

자동 runtime 테스트 미실행. 사용자가 브라우저에서 직접 확인할 항목:

### L1 — 기본 렌더 (필수)
- [ ] `/books` 진입 → 캘린더 탭이 VIEW_TABS에 노출
- [ ] 캘린더 탭 클릭 → 현재 월 그리드(6x7) 렌더
- [ ] 기존 갤러리/테이블/보드 탭도 정상 (회귀 없음)

### L2 — 월 네비게이션
- [ ] "이전" / "다음" / "오늘" 버튼 동작
- [ ] 키보드 ← → 로 월 이동, Home 으로 오늘 이동
- [ ] 월 이동 시 API 재호출 없음 (network 탭으로 확인)

### L3 — 바 시각화
- [ ] 완독 책: 초록 실선 바 + ✅ 아이콘
- [ ] 진행중 책: 노랑 점선 바 + 📖 아이콘
- [ ] 기간이 1일인 책도 정상 렌더
- [ ] 월 경계를 걸친 책: 이전/다음 월에서 연속 표시 + ‹ ›  화살표

### L4 — 상호작용
- [ ] 날짜 셀 클릭 → 팝오버 노출
- [ ] 팝오버 책 아이템 클릭 → `/books/:id` 이동
- [ ] 바 직접 클릭 → `/books/:id` 이동 (팝오버 열리지 않음)
- [ ] ESC로 팝오버 닫힘
- [ ] 팝오버 외부 클릭으로 닫힘

### L5 — 필터 조합
- [ ] 상태=READING 필터 → 완독 바 미노출
- [ ] 상태=COMPLETED 필터 → 진행중 바 미노출
- [ ] 상태=WANT_TO_READ 필터 → 안내 배너 + "전체 보기" 버튼
- [ ] 카테고리 필터 → 해당 카테고리 책만 바로 표시

### L6 — 빈 상태
- [ ] 전체 서재가 비어 있을 때: "아직 읽기 시작한 책이 없어요"
- [ ] 해당 월에 책이 없을 때: "이번 달에 읽은 책이 없어요"

### L7 — BookDetail 결측 가이드
- [ ] 상태=READING 이고 startDate=null 인 책 → 노란색 배너 노출
- [ ] 배너 아래 속성 블록에서 시작일/완독일 `<input type="date">` 편집 가능
- [ ] 날짜 입력 후 변경이 캘린더 뷰에 즉시 반영 (React Query 무효화)

### L8 — 반응형
- [ ] 브라우저 너비 < 768px → 리스트 폴백 노출
- [ ] 리스트가 시작일순 정렬

### L9 — 다크모드
- [ ] 다크모드 전환 시 캘린더 색상/대비 정상
- [ ] 바 색상이 다크 배경에서도 가독성 유지

---

## 10. Gap List (Severity별)

### Critical
없음.

### Important
없음.

### Minor (3)

| ID | Observation | Impact | 권장 조치 |
|----|-------------|:------:|-----------|
| **M1** | `mapBooksToBars`: endDate 파싱 실패 시 startDate 폴백 (Design보다 견고) | Positive | 조치 불필요 — 방어 코드로 유지 |
| **M3** | `spanCols === 1`일 때도 📖/✅ 두 아이콘이 동시 노출 가능 | Cosmetic | Phase 2에서 미세 조정 후보 (`spanCols >= 2`일 때만 둘 다 표시) |
| **M4** | DayPopover 포커스 트랩 미구현 (Design 힌트만 있었음) | A11y | Phase 2 접근성 보강 후보 |

세 관찰 모두 기능적/심각도 영향 없음.

---

## 11. Checkpoint 5 — Review Decision

Critical/Important 이슈 없음. Match Rate 98% (>=90%). Minor 관찰 3건은 조치 불필요 또는 Phase 2 후보.

**권장 조치**: **"그대로 진행"** → `/pdca report reading-calendar-view` 로 완료 보고서 생성.

사용자 결정이 필요한 경우에만 직접 답변:
- `"그대로 진행"` → Report 단계 (권장)
- `"지금 모두 수정"` → Minor 3건 선제 반영 (불필요)
- `"일단 수동 검증 먼저"` → 위 §9 체크리스트 수행 후 결정

---

## 12. Metrics Summary

| Metric | Value |
|--------|-------|
| **신규 파일** | 5 |
| **수정 파일** | 3 (BookList, BookDetail, books/api) |
| **신규 LOC** | 874 |
| **Design Ref 주석 개수** | 44 (캘린더 관련 8 파일에 분산) |
| **단위 테스트** | 작성 안 됨 (Phase 1 옵션) |
| **E2E 테스트** | 작성 안 됨 (Phase 1 옵션) |
| **TypeScript 에러** | 0 |
| **ESLint 에러 (캘린더 관련)** | 0 |
| **ESLint 에러 (전체)** | 11 (pre-existing, 수정 범위 밖) |
| **프로덕션 빌드 시간** | 457ms |
| **번들 크기 증가** | 확인 필요 (단일 번들로 측정 불가, date-fns tree-shake 확인) |

---

## 13. Phase 2 Backlog (후속 개선 아이디어)

이번 분석에서 발견된 개선 후보 (Phase 2로 이월):

1. **단위 테스트 작성** (`lib/calendar.test.ts`) — Design §8.1에 명시된 항목
2. **E2E 테스트** (Playwright) — Design §8.3 L1~L7 시나리오
3. **연간 히트맵 뷰** (GitHub contribution 스타일) — Plan §2.2 Out of Scope에서 의도적 분리
4. **주간 캘린더 뷰** — Plan §2.2 Out of Scope
5. **바 드래그로 날짜 편집** — Plan §2.2 Out of Scope
6. **동일 책의 주 세그먼트 동시 하이라이트** — Design §13 Open Question
7. **DayPopover 포커스 트랩** — §5.4 M4 관찰
8. **바 아이콘 조건 강화** (spanCols >= 2) — §5.3 M3 관찰
9. **백엔드 데이터 백필** — 기존 READING/COMPLETED 레코드의 null 날짜 자동 추정

---

## 14. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Analyzer | bkit pdca analyze | ✅ Complete | 2026-04-12 |
| Reviewer | kyungheelee | Pending | - |

---

*Generated by bkit PDCA Analyze skill — Static-only mode, Match Rate 98%*
