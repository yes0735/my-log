# 독서 캘린더 뷰 Planning Document

> **Summary**: 내 서재(BookList) 페이지에 4번째 뷰 모드로 "캘린더"를 추가하여, 독서 시작일(startDate)과 완독일(endDate)을 기준으로 독서 여정을 월간 달력에 바(bar)와 점(dot)으로 시각화한다.
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-12
> **Status**: Draft
> **Parent Plan**: [reading-platform.plan.md](./reading-platform.plan.md) (Phase 3 — UX 보강)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 내 서재는 갤러리/테이블/보드 3가지 뷰를 제공하지만, "언제부터 언제까지 이 책을 읽었는가"라는 시간축 기반의 독서 여정을 한눈에 확인할 방법이 없다. 특히 여러 권을 동시에 병행 독서하거나 완독한 책들의 패턴을 월 단위로 돌아보고 싶을 때 테이블 정렬만으로는 직관성이 부족하다. |
| **Solution** | BookList에 `calendar` 뷰 모드를 추가하고, `UserBook.startDate`/`endDate`를 소스로 월간 캘린더에 하이브리드(바 + 아이콘) 방식으로 책들을 시각화한다. 완독책은 시작→완독 바, 진행중책은 시작→오늘까지 점선 바로 표시한다. |
| **Function/UX Effect** | 월별 이전/다음 네비게이션, 날짜 셀 클릭 시 해당 날에 시작/완독/진행중인 책 목록 팝오버, 책 바 클릭 시 BookDetail 이동, 기존 상태/카테고리 필터 재사용, 모바일은 주간 스택 레이아웃으로 폴백. |
| **Core Value** | "내 독서의 흐름을 기억하고 돌아보는 경험" — 단순한 책 목록을 넘어 시간축 기반의 독서 연대기를 제공하여 내 서재를 개인화된 독서 다이어리로 승격시킨다. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 독서 기록의 감성적/회고적 가치를 강화하고, 시간 기반 패턴 인지(예: "올해 3월에 어떤 책을 완독했지?")를 가능케 함 |
| **WHO** | 내 서재를 적극 사용하는 기존 사용자, 특히 여러 권을 병행 독서하거나 완독 이력을 되돌아보는 사용자 |
| **RISK** | (1) 기존 DB에 startDate/endDate가 null인 레코드 다수 존재 가능 (2) 동시 병행 독서 시 바 겹침 레이아웃 복잡도 (3) 월 경계를 걸친 독서 기간 처리 (4) 모바일 좁은 화면 대응 |
| **SUCCESS** | 캘린더 뷰 진입 1초 이내, 월 이동 부드러움, 현재 월에 READING/COMPLETED 책이 정확히 바로 표시, 날짜 클릭 팝오버 정상 동작, 기존 3개 뷰 모드에 영향 없음, 데이터 결측 시에도 에러 없이 빈 상태 안내 |
| **SCOPE** | Phase 1: 월간 뷰 + 하이브리드 바/점 + 날짜 클릭 팝오버 + 모바일 폴백. Out: 연간 히트맵, 주간 뷰, 드래그 편집, 백엔드 마이그레이션 |

---

## 1. Overview

### 1.1 Purpose

내 서재의 독서 데이터를 시간축 기반으로 시각화하여, 사용자가 "언제 어떤 책을 읽기 시작했고 완독했는지"를 월간 달력 형태로 직관적으로 확인할 수 있게 한다. 기존 뷰 모드(갤러리/테이블/보드)에 4번째 탭 `calendar`를 추가하는 점진적 UX 보강이다.

### 1.2 Background

- **데이터 준비도 양호**: `UserBook` 엔티티에 이미 `startDate`, `endDate` 필드 존재. 별도 스키마 변경 불필요.
- **자동 날짜 세팅 이미 구현됨**: `UserBookService.updateMyBook`에서 `READING → startDate=today`, `COMPLETED → endDate=today` 자동 세팅. `addToShelf`에서 READING으로 추가 시 startDate 자동 세팅 (`UserBookService.java:58-60, 78-86`).
- **기존 뷰 패턴**: `BookList.tsx`에 `viewMode: 'gallery' | 'table' | 'board'`의 확장 가능 구조가 이미 존재 (`BookList.tsx:46`) → `'calendar'` 추가가 자연스러움.
- **상태/필터 재사용**: 상태 필터, 카테고리 필터, 정렬 UI는 캘린더 뷰에서도 그대로 사용 가능 (READING/COMPLETED만 의미 있음).

### 1.3 Related Documents

- Parent Plan: `docs/01-plan/features/reading-platform.plan.md`
- Parent Design: `docs/02-design/features/reading-platform.design.md`
- Backend entity: `backend/src/main/java/com/mylog/domain/book/entity/UserBook.java`
- Backend service: `backend/src/main/java/com/mylog/domain/book/service/UserBookService.java`
- Frontend page: `frontend/src/pages/BookList.tsx`

---

## 2. Scope

### 2.1 In Scope

**Module A — 캘린더 뷰 모드 통합**
- [ ] `BookList.tsx`의 `ViewMode` 타입에 `'calendar'` 추가
- [ ] 뷰 전환 탭에 캘린더 아이콘 + "캘린더" 라벨 추가
- [ ] `calendar` 선택 시 필터 UI는 유지하되 정렬 옵션은 비활성화(캘린더는 날짜축 고정)
- [ ] READING/COMPLETED 외 상태는 캘린더에서 자동 제외

**Module B — 월간 캘린더 그리드**
- [ ] `CalendarView.tsx` 신규 컴포넌트 (월 단위 6x7 그리드)
- [ ] 이전/다음 월 네비게이션 + "오늘로" 버튼
- [ ] 현재 월 헤더 (YYYY년 M월, 한국어)
- [ ] 일(日) 행 헤더 + 주말 색상 구분
- [ ] 오늘 날짜 셀 하이라이트
- [ ] 월 경계 외(prev/next month overflow) 날짜는 흐리게 표시

**Module C — 독서 바/점 레이어 (하이브리드 시각화)**
- [ ] `lib/calendar.ts` 유틸: `buildMonthGrid(date)`, `mapBooksToDateRange(books, gridRange)`, `calculateBarLayout(bars)` (겹침 회피 y축 슬롯 배정)
- [ ] `CalendarBookBar.tsx`: 완독(COMPLETED) → 시작→완독 실선 바, 진행중(READING) → 시작→오늘 점선 바
- [ ] 바 시작 셀에 📖 아이콘, 완독 셀에 ✅ 아이콘
- [ ] 바 색상: READING=노랑(#eab308), COMPLETED=초록(#22c55e) — 기존 `statusColors`와 통일
- [ ] 월 경계를 걸친 바는 연속 처리 (예: 3월 28일 시작 → 4월 5일 완독 = 3월 뷰에서는 28~31일, 4월 뷰에서는 1~5일)
- [ ] 한 셀에 최대 3권 표시 후 "+N권" 뱃지

**Module D — 인터랙션**
- [ ] 날짜 셀 클릭 → 해당 날짜에 "시작했거나 완독했거나 진행중이던" 책 목록 팝오버 (shadcn Popover 없음 → 경량 자체 구현)
- [ ] 바 또는 팝오버 내 책 아이템 클릭 → `/books/:id` 이동
- [ ] 팝오버 외부 클릭/ESC로 닫기
- [ ] 키보드 네비게이션 (← → 월 이동, Home 오늘로)

**Module E — 반응형 & 빈 상태**
- [ ] 데스크탑(≥md): 월간 6x7 그리드
- [ ] 모바일(<md): 같은 월의 READING/COMPLETED 책을 시작일순 리스트로 폴백 (또는 가로 스크롤 유지, 구현자 재량)
- [ ] 해당 월에 책 0권: "이번 달에 읽은 책이 없어요" + "내 서재 보기" CTA
- [ ] 전체 서재에 startDate 있는 책 0권: "아직 읽기 시작한 책이 없어요" + "책 추가" CTA

**Module F — 데이터 결측 가이드 (비침투적)**
- [ ] `BookDetail.tsx`에 기존 READING/COMPLETED인데 startDate/endDate 누락 시 "📅 날짜를 입력해 캘린더에서 확인하세요" 인라인 안내 배너
- [ ] 캘린더 뷰 상단에 "날짜 누락된 책 N권 보기" 링크 → 필터로 이동 (누락 책 리스트)

### 2.2 Out of Scope (Phase 2 후속)

- ❌ 연간 히트맵 (GitHub contribution 스타일)
- ❌ 주간 캘린더 뷰
- ❌ 드래그로 startDate/endDate 변경
- ❌ 백엔드 데이터 백필 마이그레이션 (`updatedAt` 기반 자동 추정)
- ❌ 독서 진행 % 캘린더 내 표시 (이미 table/board에 있음)
- ❌ 캘린더 공유/내보내기 (PDF/이미지)
- ❌ iCal 연동

### 2.3 Assumptions

- 백엔드 API 변경 없음 — 기존 `GET /api/v1/user-books?size=200` 응답의 `startDate`/`endDate`를 그대로 사용
- 사용자는 대개 수백 권 이하의 서재 보유 → 클라이언트 사이드 필터링 충분
- 월당 동시 진행 책은 일반적으로 ≤ 10권 → 겹침 레이아웃은 최대 5 슬롯까지 지원, 초과분은 "+N" 뱃지

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | 내 서재 페이지에 `calendar` 뷰 모드를 추가하고 탭 전환이 가능해야 한다 | P0 |
| FR-02 | 현재 월을 기본으로 월간 캘린더 그리드(6행 × 7열)를 렌더링해야 한다 | P0 |
| FR-03 | `COMPLETED` 책은 `startDate → endDate` 실선 바로 표시되어야 한다 | P0 |
| FR-04 | `READING` 책은 `startDate → 오늘` 점선 바로 표시되고 "진행중" 힌트가 있어야 한다 | P0 |
| FR-05 | 월 경계(prev/next month)를 걸친 독서 기간은 뷰 전환 시 연속성을 유지해야 한다 | P0 |
| FR-06 | 이전/다음 월 네비게이션과 "오늘" 버튼이 동작해야 한다 | P0 |
| FR-07 | 날짜 셀 클릭 시 그 날짜에 관련된(시작/완독/진행중) 책 목록 팝오버가 열려야 한다 | P1 |
| FR-08 | 바 또는 팝오버 내 책 아이템 클릭 시 `/books/:id`로 이동해야 한다 | P0 |
| FR-09 | 상태 필터(READING/COMPLETED/전체)와 카테고리 필터는 캘린더 뷰에서도 동작해야 한다 | P1 |
| FR-10 | 해당 월 또는 전체 데이터가 비어있을 때 적절한 빈 상태 UI를 보여줘야 한다 | P1 |
| FR-11 | `BookDetail`에 startDate/endDate 누락 안내 배너를 추가해야 한다 | P2 |
| FR-12 | 키보드로 월 이동(← →)과 오늘 이동(Home)이 가능해야 한다 | P2 |
| FR-13 | 모바일 화면(<768px)에서 캘린더 그리드가 읽을 수 있는 폴백 레이아웃으로 전환되어야 한다 | P1 |

### 3.2 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | 캘린더 뷰 초기 렌더 시간 | < 1초 (책 300권 기준) |
| NFR-02 | 월 이동 애니메이션 프레임 드랍 없음 | 60fps 유지 |
| NFR-03 | 번들 크기 증가 | < 30KB gzip (date-fns tree-shake 기준) |
| NFR-04 | 접근성 | 키보드 네비게이션, ARIA labels, 포커스 관리 |
| NFR-05 | 다크모드 호환 | 기존 `statusColors` 및 Tailwind 토큰 재사용 |

### 3.3 Data Requirements

- **입력**: `UserBook[]` (기존 `GET /api/v1/user-books?size=200` 응답 재사용)
  - 필수 필드: `id`, `status`, `startDate`, `endDate`, `book.title`, `book.coverImageUrl`
- **필터링 기준**: `status ∈ {READING, COMPLETED}` AND `startDate != null`
- **유효성**: `endDate < startDate`인 경우 "데이터 오류" 뱃지 + 개별 처리 (캘린더에서 제외)

---

## 4. Success Criteria

- [ ] **SC-01**: 내 서재 → 뷰 전환 탭에 "캘린더" 아이콘 노출 + 클릭 시 월간 캘린더 렌더
- [ ] **SC-02**: 현재 월 기준으로 READING 책은 점선 바, COMPLETED 책은 실선 바로 정확히 시각화
- [ ] **SC-03**: 이전/다음/오늘 네비게이션 동작 + 월 이동 시 데이터 재로딩 없음(클라이언트 필터)
- [ ] **SC-04**: 월 경계를 걸친 독서 기간이 이전/다음 월 뷰에서 연속적으로 표시
- [ ] **SC-05**: 날짜 셀 클릭 → 해당 날짜 관련 책 팝오버 정상 동작
- [ ] **SC-06**: 책 바/팝오버 아이템 클릭 → `/books/:id` 정상 이동
- [ ] **SC-07**: 상태/카테고리 필터가 캘린더 뷰에도 반영
- [ ] **SC-08**: 빈 상태 2종(월 내 0권 / 전체 startDate 0권) UI 정상 노출
- [ ] **SC-09**: 데이터 결측 배너가 BookDetail에서 READING/COMPLETED인데 날짜 null일 때만 노출
- [ ] **SC-10**: 기존 갤러리/테이블/보드 뷰에 회귀 없음
- [ ] **SC-11**: 다크모드에서 색상/대비 정상
- [ ] **SC-12**: 모바일 화면에서 폴백 레이아웃 정상 동작

---

## 5. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 기존 DB에 startDate/endDate null 레코드 다수 | Medium | High | 캘린더는 null 레코드를 자동 제외 + BookDetail에 입력 유도 배너로 비침투적 해결 |
| 월 경계를 걸친 바의 시각적 연속성 구현 복잡 | Medium | Medium | `mapBooksToDateRange`에서 월 그리드 범위로 클리핑 후 시작/끝 여부 플래그로 rounded corner 제어 |
| 동시 병행 독서 시 바 겹침 레이아웃 | Medium | Medium | greedy 슬롯 할당 알고리즘 + 최대 3~5 슬롯 후 "+N권" 처리 |
| 모바일에서 6x7 그리드 가독성 저하 | High | High | `<md` 브레이크포인트에서 리스트 폴백 레이아웃 강제 |
| date-fns 번들 크기 | Low | Low | ESM + tree-shake + 필요한 함수만 import (`format`, `startOfMonth`, `eachDayOfInterval` 등) |
| `endDate < startDate` 손상 데이터 | Low | Low | 해당 책은 캘린더에서 제외 + console.warn (사용자 UI 방해 없음) |
| 기존 BookList 코드량 증가로 유지보수성 저하 | Medium | Medium | 캘린더 관련 코드는 `features/books/calendar/` 하위로 분리하여 BookList는 뷰 선택만 담당 |

---

## 6. Dependencies

### 6.1 Internal
- `UserBook` 엔티티 (변경 없음)
- `UserBookService` (변경 없음 — 자동 날짜 세팅 이미 구현됨)
- `bookApi.getMyBooks` (변경 없음)
- 기존 `statusColors`, `statusLabels` (`BookList.tsx:20-30`) 재사용
- 기존 `ViewMode` 타입 확장

### 6.2 External
- **date-fns** (신규 추가, ^3.x) — 월 그리드 계산, 날짜 포맷, 한국어 로케일
  - 대안: `dayjs` (더 작지만 plugin 의존)
  - 추천: **date-fns** (tree-shakable, 유지보수 활발)
- **react-icons** (이미 설치) — `IoCalendarOutline` 아이콘 추가 사용

### 6.3 Upstream
- `reading-platform.plan.md` Phase 1 (책/서재/상태 기능) 완료 ✅

---

## 7. Timeline Estimate

| Phase | Duration | Outputs |
|-------|----------|---------|
| Design | 0.5일 | `reading-calendar-view.design.md` (3 아키텍처 옵션, 컴포넌트 트리, 레이아웃 알고리즘 의사코드) |
| Do — Module A (뷰 통합) | 0.3일 | BookList.tsx 수정 + 탭 추가 |
| Do — Module B (그리드) | 0.7일 | CalendarView, CalendarMonthGrid |
| Do — Module C (바/점 레이어) | 1.0일 | lib/calendar.ts + CalendarBookBar + 레이아웃 알고리즘 |
| Do — Module D (인터랙션) | 0.5일 | 날짜 클릭 팝오버 + 키보드 네비 |
| Do — Module E (반응형/빈상태) | 0.3일 | 모바일 폴백 + 빈 상태 3종 |
| Do — Module F (결측 가이드) | 0.2일 | BookDetail 배너 |
| Check (Gap 분석 + E2E) | 0.5일 | analysis 문서 + Playwright 테스트 |
| **Total** | **~4일** | |

> ⚠️ 예상치일 뿐, 실제 진행은 구현 중 재평가.

---

## 8. Open Questions

답변 완료 — 사용자가 추천안 전체 수용:

| Q | 결정 |
|---|------|
| Q1 시각화 방식 | **C 하이브리드** (바 + 아이콘) |
| Q2 READING 종료점 | **(a) 오늘까지 점선 바** |
| Q3 데이터 결측 처리 | **(a)+(c)** 마이그레이션 없음 + BookDetail 안내 배너 |
| Q4 상태 변경 시 자동 날짜 | 백엔드에 **이미 구현됨** — 추가 작업 불필요 |
| Q5 캘린더 편집 | **(b) 날짜 클릭 → 책 목록 팝오버** (읽기 전용) |
| Q6 뷰 범위 | **(a) 월간만** (Phase 1), 연간 히트맵은 Phase 2 |
| Q7 빈 상태 | 월 내 0권 / 전체 0권 / 데이터 결측 3종 안내 |

추가로 Design 단계에서 확정할 사항:
- 바 레이아웃 알고리즘 세부 (greedy vs interval scheduling)
- 모바일 폴백의 정확한 형태 (리스트 vs 가로 스크롤 축소 그리드)
- 팝오버 구현 방식 (자체 vs Radix UI 신규 설치)

---

## 9. Approval

| Role | Name | Status | Date |
|------|------|--------|------|
| Author | kyungheelee | Pending | 2026-04-12 |
| Reviewer | - | - | - |

---

*Generated by bkit PDCA Plan skill*
