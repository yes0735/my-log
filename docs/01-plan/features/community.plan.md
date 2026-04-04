# 커뮤니티 & 소셜 기능 Planning Document

> **Summary**: OAuth 소셜 로그인, 사용자 프로필, 팔로우, 독서 모임, 토론, 공개 리뷰 피드, 타임라인을 추가하여 독서 경험을 소셜화하는 기능
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-04
> **Status**: Draft
> **Parent Plan**: [reading-platform.plan.md](./reading-platform.plan.md) (Phase 2)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Phase 1은 개인 독서 기록에 집중했으나, 독서 습관 유지에 중요한 사회적 동기부여(공유, 교류, 피드백)가 부재함. 또한 이메일 로그인만 가능하여 가입 허들이 높음 |
| **Solution** | OAuth 소셜 로그인(Google/GitHub/Kakao) + 사용자 프로필/팔로우 + 독서 모임(CRUD/토론/댓글) + 공개 독후감 피드 + 타임라인 피드 |
| **Function/UX Effect** | 소셜 원클릭 로그인, 다른 독서가의 리뷰와 활동을 타임라인에서 확인, 독서 모임에서 주제별 토론 참여, 독후감 공개 공유로 독서 네트워크 형성 |
| **Core Value** | "함께 읽고, 함께 성장하는" -- 소셜 동기부여를 통한 독서 습관 강화와 독서 커뮤니티 형성 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 개인 독서 기록만으로는 습관 유지가 어려움 -> 사회적 교류와 동기부여 필요 |
| **WHO** | Phase 1 사용자 + 독서 모임/독서 토론에 관심 있는 신규 사용자 |
| **RISK** | 초기 커뮤니티 활성화 부족, OAuth 프로바이더별 설정 복잡도, 모더레이션/스팸 |
| **SUCCESS** | OAuth 로그인 동작, 팔로우/언팔로우 플로우, 모임 생성->토론->댓글 E2E, 타임라인 피드 정상 표시 |
| **SCOPE** | OAuth + 프로필 + 팔로우 + 모임 + 토론 + 공개 리뷰 + 타임라인 (게이미피케이션은 별도 Plan) |

---

## 1. Overview

### 1.1 Purpose

Phase 1에서 구축한 개인 독서 관리 플랫폼에 소셜 기능을 추가하여, 사용자 간 독서 경험 공유와 커뮤니티 활동을 가능하게 한다. OAuth 소셜 로그인으로 가입 허들을 낮추고, 팔로우/모임/토론을 통해 독서 커뮤니티를 형성한다.

### 1.2 Background

- Phase 1 완료 (Match Rate 90.8%): 책 관리, 독서 기록, 독후감, 통계, 목표, 카테고리/태그 동작 중
- 이메일 로그인만 가능 -> 소셜 로그인 추가로 가입률 향상 기대
- 공개 독후감 API는 백엔드에 이미 구현됨 (`GET /api/v1/reviews/public`) -> 프론트엔드 연결 필요
- Design 문서에 Phase 2 엔티티(Follow, ReadingGroup, GroupMember, Discussion, Comment)와 API가 이미 설계됨

### 1.3 Related Documents

- Parent Plan: `docs/01-plan/features/reading-platform.plan.md`
- Design (Phase 2 포함): `docs/02-design/features/reading-platform.design.md` (§4.3)
- Phase 1 Report: `docs/04-report/features/reading-platform.report.md`

---

## 2. Scope

### 2.1 In Scope

**Module A — OAuth 소셜 로그인**
- [ ] Google OAuth2 로그인/회원가입
- [ ] GitHub OAuth2 로그인/회원가입
- [ ] Kakao OAuth2 로그인/회원가입
- [ ] OAuth 콜백 처리 및 JWT 발급
- [ ] 기존 이메일 계정과 소셜 계정 연동 (동일 이메일)
- [ ] 프론트엔드 OAuthCallback 페이지

**Module B — 사용자 프로필 & 팔로우**
- [ ] 사용자 공개 프로필 페이지 (닉네임, 프로필 이미지, 독서 통계, 최근 활동)
- [ ] 내 프로필 수정 (닉네임, 프로필 이미지 URL)
- [ ] 팔로우/언팔로우
- [ ] 팔로워/팔로잉 목록 조회

**Module C — 독서 모임**
- [ ] 모임 생성 (이름, 설명, 최대 인원, 공개/비공개)
- [ ] 모임 목록 조회 (공개 모임)
- [ ] 모임 상세 조회
- [ ] 모임 참가/탈퇴
- [ ] 모임 멤버 목록

**Module D — 토론 게시판**
- [ ] 모임 내 토론 글 작성/목록/상세
- [ ] 토론 댓글 작성/목록
- [ ] 대댓글 (1depth)

**Module E — 피드 & 공개 리뷰**
- [ ] 타임라인 피드 (팔로우한 사용자의 독서 활동: 완독, 리뷰, 기록)
- [ ] 공개 독후감 피드 페이지 (이미 BE 구현됨, FE만 필요)

### 2.2 Out of Scope

- 게이미피케이션 (레벨, 배지, 챌린지, 리더보드) -> 별도 Plan: `gamification`
- 하이라이트/인용구 관리 -> 별도 Plan 또는 Phase 3
- 독서 타이머 -> 별도 Plan
- 알림 시스템 (Push/Email) -> 별도 Plan
- 실시간 채팅 (WebSocket) -> Out of scope
- 모임 관리자 기능 (추방, 역할 변경) -> 향후 확장
- 신고/차단/모더레이션 -> 향후 확장

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Module | Status |
|----|-------------|----------|--------|--------|
| FR-C01 | Google OAuth2 로그인 (Spring Security OAuth2 Client) | High | A | Pending |
| FR-C02 | GitHub OAuth2 로그인 | High | A | Pending |
| FR-C03 | Kakao OAuth2 로그인 | High | A | Pending |
| FR-C04 | OAuth 콜백 → JWT 발급 → 프론트 리다이렉트 | High | A | Pending |
| FR-C05 | 소셜 계정 - 이메일 자동 연동 (동일 이메일이면 기존 계정에 연결) | Medium | A | Pending |
| FR-C06 | 사용자 공개 프로필 페이지 | High | B | Pending |
| FR-C07 | 내 프로필 수정 API + UI | Medium | B | Pending |
| FR-C08 | 팔로우/언팔로우 토글 | High | B | Pending |
| FR-C09 | 팔로워/팔로잉 목록 (페이지네이션) | Medium | B | Pending |
| FR-C10 | 독서 모임 CRUD (생성/조회/상세/수정/삭제) | High | C | Pending |
| FR-C11 | 모임 참가/탈퇴 | High | C | Pending |
| FR-C12 | 모임 멤버 목록 조회 | Medium | C | Pending |
| FR-C13 | 토론 글 CRUD | High | D | Pending |
| FR-C14 | 토론 댓글 작성/목록/삭제 | High | D | Pending |
| FR-C15 | 대댓글 (1depth) | Medium | D | Pending |
| FR-C16 | 타임라인 피드 (팔로우한 사용자의 활동) | High | E | Pending |
| FR-C17 | 공개 독후감 피드 페이지 | Medium | E | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| Performance | 타임라인 피드 조회 < 500ms (최근 50건) |
| Security | OAuth2 state 파라미터로 CSRF 방지, 팔로우/모임 참가 시 인증 필수 |
| Scalability | 팔로우 관계 인덱싱, 피드 쿼리 최적화 (N+1 방지) |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Google/GitHub/Kakao 소셜 로그인으로 가입+로그인 성공
- [ ] 사용자 A가 사용자 B를 팔로우 -> B의 활동이 A 타임라인에 표시
- [ ] 독서 모임 생성 -> 참가 -> 토론 글 작성 -> 댓글 E2E 플로우 동작
- [ ] 공개 독후감 피드에서 다른 사용자의 독후감 목록 표시
- [ ] 모바일/데스크톱 반응형 유지

### 4.2 Quality Criteria

- [ ] TypeScript strict mode, 타입 에러 0건
- [ ] 빌드 성공 (FE: vite build, BE: gradlew build)
- [ ] OAuth 콜백 보안: state 파라미터 검증, HTTPS 강제

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OAuth 프로바이더별 설정 차이 | Medium | High | Google 먼저 구현 후 패턴 확립, GitHub/Kakao 적용 |
| 초기 커뮤니티 활성화 부족 | Medium | High | 공개 리뷰 피드로 콘텐츠 노출, 모임은 추후 시드 콘텐츠 |
| 타임라인 피드 쿼리 성능 | Medium | Medium | 팔로우 인덱스, 활동 이벤트 테이블 비정규화 고려 |
| Kakao OAuth 한국 전용 | Low | Low | 선택적 프로바이더, 없어도 서비스 이용 가능 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| SecurityConfig.java | Modify | OAuth2 Client 설정 추가 |
| AuthController.java | Modify | OAuth 콜백 엔드포인트 추가 |
| User Entity | Modify | provider/providerId 필드 이미 있음 (활용) |
| App.tsx | Modify | 커뮤니티 라우트 추가 (/community, /profile) |
| Sidebar.tsx | Modify | 커뮤니티 메뉴 활성화 (이미 링크 있음) |

### 6.2 New Resources

| Resource | Type | Description |
|----------|------|-------------|
| Follow domain (BE) | New | Entity, Repository, Service, Controller |
| ReadingGroup domain (BE) | New | Entity, GroupMember, Repository, Service, Controller |
| Discussion/Comment domain (BE) | New | Entity, Repository, Service, Controller |
| Feed Service (BE) | New | 타임라인 피드 집계 서비스 |
| 5+ FE pages | New | Profile, Community, GroupDetail, Feed, OAuthCallback |

---

## 7. Architecture Considerations

### 7.1 기존 아키텍처 활용

- Phase 1과 동일한 도메인 패키지 구조: `domain/{name}/entity|repository|service|controller|dto`
- 동일한 ApiResponse 래퍼, JWT 인증 패턴
- DB 테이블은 Design 문서의 Phase 2 마이그레이션 SQL에 이미 정의됨

### 7.2 신규 결정 필요

| Decision | Options | Recommendation |
|----------|---------|---------------|
| OAuth2 구현 방식 | Spring Security OAuth2 Client / 수동 구현 | Spring Security OAuth2 Client (표준, 보안) |
| 타임라인 피드 구현 | Fan-out on write / Fan-out on read | Fan-out on read (초기 사용자 적음, 단순) |
| 피드 이벤트 소스 | Activity Event 테이블 / 직접 쿼리 | 직접 쿼리 (MVP, 추후 Event 테이블로 전환 가능) |

### 7.3 API Endpoints (Design §4.3 참조)

이미 Design 문서에 정의됨:
- Profile & Follow: 7개 엔드포인트
- Groups & Discussions: 8개 엔드포인트
- Feed: 1개 엔드포인트
- OAuth: 1개 엔드포인트 (기존 Design §4.2)
- **Total: 17개 신규 엔드포인트**

---

## 8. Module Implementation Order

| Order | Module | Dependencies | Estimated Files |
|:-----:|--------|-------------|:---------------:|
| 1 | A: OAuth 소셜 로그인 | SecurityConfig 수정 | BE ~5, FE ~3 |
| 2 | B: 프로필 & 팔로우 | OAuth 완료 후 | BE ~8, FE ~4 |
| 3 | C: 독서 모임 | Follow 도메인 | BE ~8, FE ~3 |
| 4 | D: 토론 게시판 | ReadingGroup 도메인 | BE ~8, FE ~3 |
| 5 | E: 피드 & 공개 리뷰 | Follow + Review | BE ~3, FE ~3 |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design community`) -- 기존 reading-platform.design.md Phase 2 섹션 참조
2. [ ] Module A (OAuth) 구현 시작
3. [ ] Module B~E 순차 구현
4. [ ] Gap Analysis 수행 (`/pdca analyze community`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial draft -- 커뮤니티 + OAuth 범위 정의 | kyungheelee |
