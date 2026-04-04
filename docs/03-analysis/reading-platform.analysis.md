# reading-platform Gap Analysis Report

> **Feature**: reading-platform (Phase 1)
> **Date**: 2026-04-04
> **Overall Match Rate**: 77% → **90.8%** (PASS after Act-1)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 독서 기록의 분산과 독서 습관 형성의 어려움을 해결 |
| **WHO** | 독서를 즐기고 기록/공유하고 싶은 개인 사용자 (20~40대) |
| **RISK** | 외부 도서 API 의존성, 카테고리/태그 미구현, OAuth 미구현 |
| **SUCCESS** | 책 등록->기록->통계 플로우 완성 |
| **SCOPE** | Phase 1 핵심 기능만 분석 (Phase 2/3 제외) |

---

## Overall Scores

| Category | Score | Weight | Weighted |
|----------|:-----:|:------:|:--------:|
| Structural Match | 83% | 0.2 | 16.6 |
| Functional Depth | 74% | 0.4 | 29.6 |
| API Contract | 78% | 0.4 | 31.2 |
| **Overall** | | | **77.4%** |

---

## Critical Gaps (3)

| # | Gap | Severity | Impact |
|---|-----|----------|--------|
| 1 | **Category/Tag 도메인 전체 미구현** | Critical | DB 테이블은 있으나 Entity/Repository/Service/Controller 없음. BookList 필터, BookDetail 태그/카테고리 UI 불가 |
| 2 | **OAuth 소셜 로그인 미구현** | Critical | Google/GitHub/Kakao 로그인 없음, OAuthCallback 페이지 없음 |
| 3 | **Stats 페이지 미완성** | Important | 4개 API 중 2개만 구현 (genres, yearly 없음), PieChart/LineChart 없음 |

## Important Gaps (5)

| # | Gap | Severity |
|---|-----|----------|
| 4 | BookList: 그리드/리스트 토글 + 정렬 없음 | Important |
| 5 | BookDetail: 별점 0.5단위 미지원 (현재 정수만) | Important |
| 6 | Axios interceptor 토큰 갱신 로직 placeholder | Important |
| 7 | 공개 독후감 피드 FE 페이지 없음 (서버 API는 있음) | Important |
| 8 | Dashboard: 최근 독서 기록 카드 없음 | Important |

## Minor Gaps (10)

| # | Gap |
|---|-----|
| 9 | RecordList 독립 페이지 (캘린더 뷰) 없음 |
| 10 | ReviewDetail 페이지 없음 |
| 11 | ReviewEditor 미리보기 버튼 없음 |
| 12 | 알라딘 BookSearchClient 미구현 (네이버만) |
| 13 | FE types 파일 분리 (record.ts, review.ts, stats.ts) |
| 14 | components/common 추출 (StarRating, ProgressBar) |
| 15 | lib/auth.ts 토큰 관리 유틸 없음 |
| 16 | .env.example 파일 없음 |
| 17 | CustomUserDetailsService, PageResponse, QueryDslConfig |
| 18 | Dashboard 주간 차트 → 실제는 월간 차트 |

---

## Plan Success Criteria

| # | Criterion | Status | Evidence |
|---|-----------|:------:|---------|
| 1 | Phase 1 FR-01~FR-11 구현 | ⚠️ Partial | FR-01 소셜로그인 없음, FR-08 카테고리/태그 없음 |
| 2 | 책 등록->기록->독후감->통계 E2E 플로우 | ⚠️ Partial | 핵심 플로우 동작, 통계 일부 미완 |
| 3 | 회원가입/로그인 플로우 | ⚠️ Partial | 이메일만 동작, OAuth 미구현 |
| 4 | 통계 차트 실데이터 반영 | ⚠️ Partial | 월별 차트 동작, 장르/속도 차트 없음 |
| 5 | 모바일/데스크톱 반응형 | ✅ Met | Sidebar overlay + 페이지 반응형 완료 |

---

## Recommended Fix Priority

1. Category/Tag 도메인 구현 (BE + FE)
2. Stats 엔드포인트 + 차트 완성
3. BookList 토글/정렬 추가
4. 별점 0.5단위 지원
5. OAuth 소셜 로그인 (규모 큼, 별도 세션 권장)
