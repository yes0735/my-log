# 보안 강화 & 인증 개선 & AdSense Completion Report

> **Feature**: security-auth-adsense
> **Project**: my-log
> **Date**: 2026-04-04
> **Author**: kyungheelee
> **Status**: Completed
> **PDCA Cycle**: Plan Plus → Design → Do (3 Sessions) → Check → Report

---

## Executive Summary

### 1.1 Project Overview

| Item | Value |
|------|-------|
| **Feature** | 보안 강화 & 인증 개선 & Google AdSense |
| **Started** | 2026-04-04 |
| **Completed** | 2026-04-04 |
| **Duration** | 1 session (3 Do sub-sessions) |
| **PDCA Iterations** | 0 (first-pass 99.6%) |
| **Planning Method** | Plan Plus (Brainstorming-Enhanced) |

### 1.2 Results Summary

| Metric | Value |
|--------|-------|
| **Match Rate** | 99.6% |
| **API Endpoints** | 2/2 (100%) |
| **BE Files** | 14 (6 new + 8 modified) |
| **FE Files** | 9 (2 new + 7 modified) |
| **Success Criteria** | 7/7 Met (100%) |
| **Gaps Found** | 0 Critical, 0 Important, 3 Minor |

### 1.3 Value Delivered

| Perspective | Content |
|-------------|---------|
| **Problem** | 이메일 평문 저장, JWT 시크릿 하드코딩, Refresh Token 미구현, 라우트 가드 없음, 로그아웃 불가, 수익화 수단 없음 |
| **Solution** | AES-256-GCM 투명 암호화(@Converter) + 환경변수 분리(3개) + UUID Refresh Token(DB, Token Rotation) + ProtectedRoute + BE/FE 로그아웃 + AdSense 배너 |
| **Function/UX Effect** | DB 이메일 암호화 저장, 401 시 자동 토큰 갱신(큐 처리), 미인증 자동 리다이렉트(returnUrl 보존), Sidebar 로그아웃 버튼, Dashboard/BookList 광고 |
| **Core Value** | "안전하고, 끊김 없고, 지속 가능한" — 보안 기반 위에 인증 UX와 수익 모델을 동시에 확보 |

---

## 2. PDCA Cycle Summary

### 2.1 Plan Plus Phase

- **Document**: `docs/01-plan/features/security-auth-adsense.plan.md`
- **Method**: Brainstorming-Enhanced (Phase 0~5)
- **Original Request**: 5개 항목 → SEO 제외 → 4개 통합
- **YAGNI**: 로그인 시도 제한 제외 (v1에서 불필요)
- **Scope**: 6 modules, 13 functional requirements, 2 API endpoints

### 2.2 Design Phase

- **Document**: `docs/02-design/features/security-auth-adsense.design.md`
- **Architecture**: Option C — Pragmatic Balance
- **Key Decisions**:
  - JPA `@Converter` 투명 암호화 (서비스 레이어 무관)
  - `email_hash` SHA-256 컬럼 (암호화된 이메일 검색 해결)
  - UUID Refresh Token + DB 저장 (JWT 대체)
  - Token Rotation (refresh 시 기존 삭제 + 새 발급)

### 2.3 Do Phase (3 Sessions)

| Session | Modules | Files | Key Work |
|:-------:|---------|:-----:|----------|
| 1 | B + A | BE 8 | application.yml 환경변수화, AesEncryptor, @Converter, User 엔티티 변경, email_hash, Migration, DataMigrationRunner |
| 2 | C + D | BE 5, FE 2 | RefreshToken 엔티티/레포, UserService Token Rotation, logout API, api.ts 자동 갱신, Sidebar 로그아웃 |
| 3 | E + F | FE 7 | ProtectedRoute, App.tsx 래핑, returnUrl, AdBanner, index.html, Dashboard/BookList 배치 |

### 2.4 Check Phase

- **Document**: `docs/03-analysis/security-auth-adsense.analysis.md`
- **Match Rate**: 99.6%
- **Iteration**: 0회

---

## 3. Key Decisions & Outcomes

| Phase | Decision | Followed? | Outcome |
|-------|----------|:---------:|---------|
| Plan Plus | SEO 제외 (SPA 한계) | ✅ | 범위 집중, 추후 별도 검토 |
| Plan Plus | 로그인 시도 제한 YAGNI | ✅ | v1 보안 기반 확보 우선 |
| Plan Plus | 통합 구현 (Approach A) | ✅ | 보안+인증 정합성 한 번에 확보 |
| Design | Option C Pragmatic | ✅ | @Converter 투명 + RefreshToken 분리 |
| Design | email_hash SHA-256 | ✅ | 암호화 + 검색 성능 모두 해결 |
| Design | Token Rotation | ✅ | refresh 시 기존 토큰 삭제 → 탈취 대응 |
| Design | 전체 세션 로그아웃 | ✅ | deleteByUserId → 모든 디바이스 로그아웃 |

---

## 4. Success Criteria Final Status

| # | Criteria | Status | Evidence |
|---|----------|:------:|---------|
| SC-1 | User.email DB AES 암호화 저장 | ✅ Met | `@Convert(converter=EncryptedStringConverter.class)` — User.java:23 |
| SC-2 | JWT_SECRET, AES_SECRET_KEY 환경변수 | ✅ Met | application.yml: `${JWT_SECRET}`, `${AES_SECRET_KEY}`, `${OAUTH_REDIRECT_BASE}` |
| SC-3 | Access Token 만료 → 자동 갱신 → 재시도 | ✅ Met | api.ts: `isRefreshing` + `failedQueue` + `_retry` pattern |
| SC-4 | 미인증 /dashboard → /login?returnUrl | ✅ Met | ProtectedRoute.tsx + App.tsx wrapping |
| SC-5 | 로그인 후 returnUrl 이동 | ✅ Met | LoginForm.tsx: `searchParams.get('returnUrl')` |
| SC-6 | 로그아웃 → Refresh Token 무효화 → /login | ✅ Met | AuthController.logout + authStore.logout + Sidebar button |
| SC-7 | AdSense 스크립트 + 광고 렌더링 | ✅ Met | index.html script + AdBanner in Dashboard/BookList |

**Overall: 7/7 Met (100%)**

---

## 5. Open Gaps (Deferred)

| # | Severity | Description | Action |
|---|----------|-------------|--------|
| G-01 | Minor | AdSense `ca-pub-XXXXXXXX` placeholder | 사용자가 실제 Google AdSense ID로 교체 |
| G-02 | Minor | email_hash UNIQUE 제약 미적용 | V4 마이그레이션으로 DataMigrationRunner 실행 후 추가 |
| G-03 | Minor | JwtTokenProvider.createRefreshToken() dead code | 미사용 메서드 제거 |

---

## 6. Implementation Summary

### 6.1 New Files (8)

| File | Module | Purpose |
|------|--------|---------|
| `global/security/AesEncryptor.java` | A | AES-256-GCM encrypt/decrypt + SHA-256 |
| `global/security/EncryptedStringConverter.java` | A | JPA @Converter 투명 암호화 |
| `global/security/DataMigrationRunner.java` | A | 기존 사용자 email_hash 마이그레이션 |
| `domain/user/entity/RefreshToken.java` | C | UUID Refresh Token 엔티티 |
| `domain/user/repository/RefreshTokenRepository.java` | C | Refresh Token 레포지토리 |
| `db/migration/V3__security_enhancements.sql` | A,C | email_hash + refresh_tokens DDL |
| `frontend/components/ProtectedRoute.tsx` | E | 인증 가드 래퍼 |
| `frontend/components/ads/AdBanner.tsx` | F | AdSense 배너 컴포넌트 |

### 6.2 Modified Files (15)

| File | Module | Changes |
|------|--------|---------|
| `application.yml` | B | JWT_SECRET, AES_SECRET_KEY, OAUTH_REDIRECT_BASE 환경변수화 |
| `User.java` | A | @Convert + emailHash 필드 |
| `UserRepository.java` | A | findByEmailHash, existsByEmailHash |
| `UserService.java` | A,C,D | emailHash 기반 조회, UUID RefreshToken, logout |
| `AuthController.java` | D | DELETE /auth/logout endpoint |
| `CustomOAuth2UserService.java` | A | emailHash 기반 조회/생성 |
| `OAuth2SuccessHandler.java` | C | userService.createTokenResponse() |
| `api.ts` | C | Token Refresh interceptor + 동시 요청 큐 |
| `authStore.ts` | D | logout → BE API + localStorage 정리 |
| `Sidebar.tsx` | D | 로그아웃 버튼 |
| `App.tsx` | E | ProtectedRoute 래핑 |
| `LoginForm.tsx` | E | returnUrl 처리 |
| `index.html` | F | AdSense 스크립트 + 타이틀 |
| `Dashboard.tsx` | F | AdBanner 배치 |
| `BookList.tsx` | F | AdBanner 배치 |

---

## 7. Lessons Learned

| Topic | Insight |
|-------|---------|
| **Plan Plus** | Brainstorming(Phase 1~5)으로 SEO 제외 + YAGNI 결정을 사전에 확정. 구현 중 scope creep 방지에 효과적 |
| **JPA @Converter** | 투명 암호화가 가장 깔끔 — 서비스 레이어 코드 변경 최소화. 단, email 검색을 위해 email_hash 패턴 필수 |
| **Token Rotation** | Refresh 시 기존 토큰 삭제 → 탈취 대응. 단, 동시 요청 시 경쟁 조건 가능 — FE에서 큐 패턴으로 해결 |
| **Session 분할** | 6모듈을 3세션(BE→BE+FE→FE)으로 분할하여 의존성 순서대로 구현. Session Guide가 효과적 |
| **환경변수화** | 가장 먼저 수행(Module B)하여 이후 모든 모듈이 환경변수 기반으로 동작 |

---

## 8. Next Steps

1. **G-01**: Google AdSense 계정에서 실제 `ca-pub-XXXXXXXX` ID 발급 → 코드 교체
2. **G-02**: DataMigrationRunner 실행 확인 후 V4 마이그레이션으로 email_hash UNIQUE 제약 추가
3. **G-03**: JwtTokenProvider.createRefreshToken() dead code 정리
4. **추후 보안 강화**: 로그인 시도 제한 (YAGNI에서 제외), 감사 로그, 2FA

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-04 | Initial completion report |
