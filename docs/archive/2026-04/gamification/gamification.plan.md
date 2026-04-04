# 게이미피케이션 & 유틸리티 Planning Document

> **Summary**: 독서 레벨/XP, 배지/업적, 챌린지, 리더보드 + 하이라이트/인용구 + 독서 타이머를 추가하여 독서 동기부여를 극대화하고 Phase 2를 완성하는 기능
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-04
> **Status**: Draft
> **Parent Plan**: [reading-platform.plan.md](./reading-platform.plan.md) (Phase 2 마무리)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 독서를 지속하는 가장 큰 장벽은 동기부여 부족. 커뮤니티(Phase 2a)로 소셜 동기를 추가했지만, 개인 성취감과 경쟁 요소가 아직 없음 |
| **Solution** | XP 기반 레벨 시스템 + 자동 달성 배지 + 독서 챌린지(기간별 경쟁) + 리더보드 + 하이라이트/인용구 관리 + 독서 타이머 |
| **Function/UX Effect** | 독서 활동마다 XP 획득 → 레벨업 → 배지 팝업, 챌린지 참가로 다른 사용자와 경쟁, 인상 깊은 구절 저장, 독서 세션 시간 측정 |
| **Core Value** | "성취하고, 경쟁하고, 기록하는" -- 게이미피케이션으로 독서를 게임처럼 몰입하게 만들기 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 개인 성취감과 경쟁 요소로 독서 지속 동기부여 강화 |
| **WHO** | 기존 사용자 (독서 기록 중인 사용자, 커뮤니티 활동 사용자) |
| **RISK** | XP 밸런싱 어려움, 배지 달성 조건 자동화 복잡도, 챌린지 참가자 부족 |
| **SUCCESS** | 독서 활동 시 XP 획득 + 레벨업, 배지 자동 달성, 챌린지 생성->참가->완료, 리더보드 랭킹, 하이라이트 CRUD, 타이머 시작->종료 |
| **SCOPE** | 레벨/XP + 배지 + 챌린지 + 리더보드 + 하이라이트 + 타이머 (Phase 2 완성) |

---

## 1. Overview

### 1.1 Purpose

Phase 2의 나머지 기능을 구현하여 독서 관리 플랫폼을 완성한다. 게이미피케이션(레벨/배지/챌린지/리더보드)으로 독서 습관을 강화하고, 하이라이트와 독서 타이머로 독서 경험을 더 풍부하게 만든다.

### 1.2 Background

- Phase 1 완료 (90.8%): 핵심 독서 관리 기능
- Phase 2a 커뮤니티 완료 (90.2%): OAuth, 팔로우, 모임, 토론, 피드
- DB 테이블이 이미 존재: user_levels, badges, user_badges, challenges, challenge_participants, highlights, reading_sessions
- Design 문서에 Phase 2 API가 이미 설계됨 (§4.3 Gamification, Highlights & Timer)

---

## 2. Scope

### 2.1 In Scope

**Module F — 레벨 & XP 시스템**
- [ ] UserLevel 엔티티 (레벨, 총 XP, 현재 레벨 XP, 다음 레벨 XP)
- [ ] XP 부여 규칙: 완독 +100XP, 리뷰 작성 +50XP, 독서 기록 +10XP, 챌린지 완료 +200XP
- [ ] 레벨업 로직 (XP 임계값: Lv1=100, Lv2=250, Lv3=500, Lv4=1000, Lv5+=N*500)
- [ ] 내 레벨/XP 조회 API
- [ ] Dashboard + Profile에 레벨/XP 표시

**Module G — 배지/업적 시스템**
- [ ] Badge 정의 테이블 (코드, 이름, 설명, 아이콘, XP 보상)
- [ ] 자동 달성 감지 (이벤트 기반): 첫 완독, 연속 7일 독서, 10권 완독, 50권 완독 등
- [ ] 배지 획득 시 UserBadge 생성 + XP 보상
- [ ] 내 배지 목록, 전체 배지 목록 (달성/미달성 구분)
- [ ] 배지 획득 알림 (toast)

**Module H — 독서 챌린지**
- [ ] 챌린지 CRUD (제목, 설명, 목표 권수, 시작/종료일)
- [ ] 챌린지 참가/탈퇴
- [ ] 참가자별 달성 현황 추적
- [ ] 챌린지 목록/상세 페이지

**Module I — 리더보드**
- [ ] 주간/월간 랭킹 (완독 수, 독서 페이지 수 기준)
- [ ] 리더보드 페이지

**Module J — 하이라이트/인용구**
- [ ] 책별 하이라이트 CRUD (페이지번호, 인용구 텍스트, 메모)
- [ ] BookDetail 하이라이트 탭 연동

**Module K — 독서 타이머**
- [ ] 독서 세션 시작/종료 (시작시간, 종료시간, 독서시간(분), 읽은페이지)
- [ ] BookDetail에 타이머 UI (시작/정지/종료)
- [ ] 세션 기록 목록

### 2.2 Out of Scope

- 알림 시스템 (Push/Email) -> 향후 별도 구현
- AI 기능 (Phase 3)
- 실시간 리더보드 (WebSocket) -> 폴링으로 대체

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Module |
|----|-------------|----------|--------|
| FR-G01 | 독서 활동 시 XP 자동 부여 | High | F |
| FR-G02 | 레벨업 로직 (XP 임계값 기반) | High | F |
| FR-G03 | 내 레벨/XP 조회 API + UI | High | F |
| FR-G04 | 배지 정의 데이터 (시드) | High | G |
| FR-G05 | 자동 배지 달성 감지 (이벤트 후크) | High | G |
| FR-G06 | 배지 목록 (달성/미달성) | Medium | G |
| FR-G07 | 챌린지 CRUD | High | H |
| FR-G08 | 챌린지 참가/탈퇴 + 달성 추적 | High | H |
| FR-G09 | 리더보드 (주간/월간) | Medium | I |
| FR-G10 | 하이라이트 CRUD (책별) | Medium | J |
| FR-G11 | 독서 타이머 시작/종료/기록 | Medium | K |
| FR-G12 | Dashboard에 레벨/배지 위젯 | Medium | F, G |

### 3.2 API Endpoints (기존 Design §4.3 참조)

**Gamification (8 endpoints)**:
- GET `/api/v1/my/level`, GET/POST `/api/v1/my/badges`, GET `/api/v1/badges`
- GET `/api/v1/leaderboard?period={week|month}`
- GET/POST `/api/v1/challenges`, GET/POST `/api/v1/challenges/{id}[/join]`

**Highlights & Timer (6 endpoints)**:
- GET/POST/DELETE `/api/v1/my/books/{bookId}/highlights`
- POST `/api/v1/my/books/{bookId}/sessions/start|stop`
- GET `/api/v1/my/books/{bookId}/sessions`

**Total: 14 endpoints**

---

## 4. Success Criteria

- [ ] 독서 기록/완독/리뷰 시 XP 자동 부여 + 레벨업
- [ ] 최소 5개 배지 시드 데이터 + 자동 달성 감지
- [ ] 챌린지 생성->참가->달성 E2E 플로우
- [ ] 리더보드에 사용자 랭킹 표시
- [ ] 하이라이트 CRUD + BookDetail 탭 연동
- [ ] 타이머 시작->종료->세션 기록

---

## 5. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| XP 밸런싱 어려움 | Medium | 초기 간단한 규칙, 추후 조정 가능하도록 설정 테이블 분리 |
| 배지 자동 감지 복잡도 | Medium | 이벤트 후크 패턴: 완독/리뷰 등 핵심 이벤트에서만 배지 체크 |
| 챌린지 참가자 부족 | Low | 커뮤니티 모임과 연계, 공개 챌린지 목록 |

---

## 6. Module Implementation Order

| Order | Module | Dependencies | Estimated |
|:-----:|--------|-------------|:---------:|
| 1 | F: 레벨/XP | 없음 (독립) | BE ~6, FE ~3 |
| 2 | G: 배지 | 레벨/XP (XP 보상 연동) | BE ~8, FE ~3 |
| 3 | H: 챌린지 | 없음 (독립) | BE ~8, FE ~4 |
| 4 | I: 리더보드 | 없음 (독립) | BE ~3, FE ~2 |
| 5 | J: 하이라이트 | 없음 (독립) | BE ~5, FE ~2 |
| 6 | K: 타이머 | 없음 (독립) | BE ~5, FE ~2 |

**Total: BE ~35, FE ~16 = ~51 files**

---

## 7. XP & Level Design

### 7.1 XP Rules

| Action | XP | Trigger |
|--------|:--:|---------|
| 독서 기록 추가 | +10 | POST /records |
| 완독 (상태 COMPLETED) | +100 | PATCH /my/books/{id} status=COMPLETED |
| 독후감 작성 | +50 | POST /reviews |
| 챌린지 목표 달성 | +200 | 자동 감지 |
| 배지 획득 보상 | +badge.xpReward | 자동 |

### 7.2 Level Thresholds

| Level | Required XP | Cumulative |
|:-----:|:-----------:|:----------:|
| 1 | 0 | 0 |
| 2 | 100 | 100 |
| 3 | 250 | 350 |
| 4 | 500 | 850 |
| 5 | 1,000 | 1,850 |
| 6+ | N * 500 | progressive |

### 7.3 Badge Definitions (시드 데이터)

| Code | Name | Condition | XP Reward |
|------|------|-----------|:---------:|
| FIRST_COMPLETE | 첫 완독 | 완독 1권 | 20 |
| BOOKWORM_10 | 다독가 | 완독 10권 | 50 |
| BOOKWORM_50 | 독서왕 | 완독 50권 | 100 |
| STREAK_7 | 7일 연속 | 연속 7일 독서 기록 | 30 |
| STREAK_30 | 30일 연속 | 연속 30일 독서 기록 | 100 |
| REVIEWER | 리뷰어 | 독후감 5편 작성 | 30 |
| SOCIAL | 소셜 독서가 | 팔로우 10명 이상 | 20 |
| CHALLENGER | 챌린저 | 챌린지 1회 완료 | 50 |

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design gamification`)
2. [ ] Module F~K 순차 구현 (3 session 권장)
3. [ ] Gap Analysis (`/pdca analyze gamification`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial draft -- 6 modules (게이미피케이션 4 + 하이라이트 + 타이머) | kyungheelee |
