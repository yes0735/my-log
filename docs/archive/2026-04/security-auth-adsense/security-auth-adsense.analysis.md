# 보안 강화 & 인증 개선 & AdSense Gap Analysis

> **Feature**: security-auth-adsense
> **Date**: 2026-04-04
> **Phase**: Check (Gap Analysis)
> **Design Doc**: [security-auth-adsense.design.md](../02-design/features/security-auth-adsense.design.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 개인정보 보호 의무 이행 + 인증 UX 완성 + 수익화 기반 마련 |
| **WHO** | 모든 사용자 (기존 + 신규) |
| **RISK** | AES 키 유출, Refresh Token 탈취, AdSense 승인 지연 |
| **SUCCESS** | 이메일 암호화, 토큰 자동 갱신, 미인증 리다이렉트, 로그아웃, AdSense 노출 |
| **SCOPE** | 6 modules (B→A→C→D→E→F) |

---

## 1. Structural Match

### 1.1 Backend — New Files

| Design Spec | File | Status |
|-------------|------|:------:|
| `global/security/AesEncryptor.java` | ✅ 존재 | ✅ |
| `global/security/EncryptedStringConverter.java` | ✅ 존재 | ✅ |
| `global/security/DataMigrationRunner.java` | ✅ 존재 | ✅ |
| `domain/user/entity/RefreshToken.java` | ✅ 존재 | ✅ |
| `domain/user/repository/RefreshTokenRepository.java` | ✅ 존재 | ✅ |
| `db/migration/V3__security_enhancements.sql` | ✅ 존재 | ✅ |

### 1.2 Backend — Modified Files

| Design Spec | Change | Status |
|-------------|--------|:------:|
| `User.java` — `@Convert` + `emailHash` | ✅ `@Convert(converter=EncryptedStringConverter.class)` + `emailHash` 필드 | ✅ |
| `UserRepository.java` — `findByEmailHash`, `existsByEmailHash` | ✅ 2개 메서드 추가 | ✅ |
| `UserService.java` — emailHash 기반 + RefreshToken DB + logout | ✅ signup/login emailHash, UUID refresh, logout() | ✅ |
| `AuthController.java` — `DELETE /auth/logout` | ✅ `@DeleteMapping("/logout")` | ✅ |
| `OAuth2SuccessHandler.java` — `userService.createTokenResponse()` | ✅ DB-managed token 사용 | ✅ |
| `CustomOAuth2UserService.java` — emailHash 기반 조회 | ✅ `findByEmailHash` + `emailHash` 설정 | ✅ |
| `application.yml` — `${JWT_SECRET}`, `${AES_SECRET_KEY}`, `${OAUTH_REDIRECT_BASE}` | ✅ 3개 환경변수화 | ✅ |

### 1.3 Frontend — New Files

| Design Spec | File | Status |
|-------------|------|:------:|
| `components/ProtectedRoute.tsx` | ✅ 존재 | ✅ |
| `components/ads/AdBanner.tsx` | ✅ 존재 | ✅ |

### 1.4 Frontend — Modified Files

| Design Spec | Change | Status |
|-------------|--------|:------:|
| `api.ts` — Token refresh interceptor | ✅ `isRefreshing` + `failedQueue` + `processQueue` + `_retry` | ✅ |
| `authStore.ts` — BE logout API 호출 | ✅ `axios.delete('/auth/logout')` | ✅ |
| `App.tsx` — `ProtectedRoute` 래핑 | ✅ `<ProtectedRoute><AppLayout /></ProtectedRoute>` | ✅ |
| `Sidebar.tsx` — 로그아웃 버튼 | ✅ `IoLogOutOutline` + logout 호출 | ✅ |
| `LoginForm.tsx` — returnUrl 처리 | ✅ `searchParams.get('returnUrl')` | ✅ |
| `index.html` — AdSense 스크립트 | ✅ `adsbygoogle.js` 태그 | ✅ |
| `Dashboard.tsx` — AdBanner 배치 | ✅ AdBanner import + 배치 | ✅ |
| `BookList.tsx` — AdBanner 배치 | ✅ AdBanner import + 배치 | ✅ |

**Structural Match: 23/23 → 100%**

---

## 2. Functional Depth

### 2.1 Module B: JWT 환경변수

| Requirement | Status | Details |
|-------------|:------:|---------|
| `jwt.secret` → `${JWT_SECRET}` | ✅ | dev default 포함 |
| `oauth.redirect-base` → `${OAUTH_REDIRECT_BASE}` | ✅ | dev default 포함 |
| `security.aes.secret-key` → `${AES_SECRET_KEY}` | ✅ | Base64 dev default |

**Module B: 100%**

### 2.2 Module A: AES 암호화

| Requirement | Status | Details |
|-------------|:------:|---------|
| AES-256-GCM encrypt/decrypt | ✅ | 12-byte IV + GCM tag + Base64 |
| SHA-256 해시 (email search) | ✅ | `sha256()` static method, hex output |
| JPA `@Converter` 투명 암호화 | ✅ | `EncryptedStringConverter` |
| User.email `@Convert` | ✅ | 자동 암호화/복호화 |
| User.emailHash 필드 | ✅ | SHA-256, length=64 |
| UserRepo: emailHash 기반 조회 | ✅ | `findByEmailHash`, `existsByEmailHash` |
| V3 migration (email_hash, refresh_tokens) | ✅ | email unique 제약 제거 포함 |
| DataMigrationRunner | ✅ | 기존 사용자 마이그레이션 |
| signup: emailHash 저장 | ✅ | `AesEncryptor.sha256()` + builder |
| login: emailHash 기반 조회 | ✅ | `findByEmailHash` |
| OAuth2: emailHash 기반 조회 | ✅ | CustomOAuth2UserService 수정 |

**Module A: 100%**

### 2.3 Module C: Refresh Token

| Requirement | Status | Details |
|-------------|:------:|---------|
| RefreshToken 엔티티 (UUID, expiresAt) | ✅ | `isExpired()` 포함 |
| RefreshTokenRepository | ✅ | findByToken, deleteByUserId, deleteByToken |
| login/signup → UUID Refresh Token + DB 저장 | ✅ | `createTokenResponse()` |
| POST /auth/refresh → DB 검증 | ✅ | 존재 + 만료 체크 |
| Token Rotation (기존 삭제 + 새 발급) | ✅ | `refreshTokenRepository.delete(stored)` |
| OAuth2 → DB-managed refresh token | ✅ | `userService.createTokenResponse(user)` |

**Module C: 100%**

### 2.4 Module D: 로그아웃

| Requirement | Status | Details |
|-------------|:------:|---------|
| DELETE /api/v1/auth/logout | ✅ | AuthController, auth required |
| 전체 세션 로그아웃 (모든 RefreshToken 삭제) | ✅ | `deleteByUserId` |
| FE: authStore logout → BE API 호출 | ✅ | `axios.delete` + localStorage 정리 |
| FE: Sidebar 로그아웃 버튼 | ✅ | IoLogOutOutline, red hover |
| FE: logout 후 /login 이동 | ✅ | `window.location.href = '/login'` |

**Module D: 100%**

### 2.5 Module E: 라우트 가드

| Requirement | Status | Details |
|-------------|:------:|---------|
| ProtectedRoute 컴포넌트 | ✅ | `isAuthenticated` 체크 |
| 미인증 → `/login?returnUrl=...` 리다이렉트 | ✅ | `encodeURIComponent(pathname + search)` |
| App.tsx: AppLayout을 ProtectedRoute로 래핑 | ✅ | 확인 |
| LoginForm: returnUrl 파라미터 처리 | ✅ | `searchParams.get('returnUrl')` |
| 로그인 후 returnUrl 이동 | ✅ | `navigate(returnUrl, { replace: true })` |

**Module E: 100%**

### 2.6 Module F: AdSense

| Requirement | Status | Details |
|-------------|:------:|---------|
| index.html AdSense 스크립트 | ✅ | `adsbygoogle.js` 태그 |
| AdBanner 컴포넌트 (반응형) | ✅ | `data-full-width-responsive="true"` |
| Dashboard 광고 배치 | ✅ | 하단 AdBanner |
| BookList 광고 배치 | ✅ | 하단 AdBanner |
| 로그인/회원가입에 광고 미배치 | ✅ | Login/Signup 수정 없음 |
| ca-pub-XXXXXXXX placeholder | ⚠️ | 실제 AdSense ID로 교체 필요 (사용자 작업) |

**Module F: 95%** (placeholder ID — 정상, 사용자가 실제 ID 교체 필요)

---

## 3. API Contract

| Endpoint | Design §3 | Controller | FE Client | Match |
|----------|:---------:|:----------:|:---------:|:-----:|
| POST /api/v1/auth/refresh (개선) | ✅ | ✅ UUID 기반 | ✅ api.ts interceptor | ✅ |
| DELETE /api/v1/auth/logout (신규) | ✅ | ✅ auth required | ✅ authStore.logout() | ✅ |

**API Contract: 2/2 → 100%**

---

## 4. Gap List

| # | Severity | Module | Gap | Confidence |
|---|----------|--------|-----|:----------:|
| G-01 | **Minor** | F | AdSense `ca-pub-XXXXXXXX` placeholder — 사용자가 실제 Google AdSense ID로 교체 필요 | 100% |
| G-02 | **Minor** | A | email 컬럼 unique 제약 제거는 V3 마이그레이션에 포함되나, email_hash에 UNIQUE 제약은 DataMigrationRunner 완료 후 V4로 별도 추가 필요 | 85% |
| G-03 | **Minor** | C | JwtTokenProvider의 `createRefreshToken()` 메서드가 아직 존재 — UUID로 대체했으므로 dead code. 제거 권장 | 80% |

---

## 5. Plan Success Criteria Evaluation

| Criteria | Status | Evidence |
|----------|:------:|---------|
| User.email DB AES 암호화 저장 | ✅ Met | `@Convert(converter=EncryptedStringConverter.class)` on User.java:23 |
| JWT_SECRET, AES_SECRET_KEY 환경변수 | ✅ Met | application.yml: `${JWT_SECRET}`, `${AES_SECRET_KEY}` |
| Access Token 만료 → Refresh Token 자동 갱신 → 요청 재시도 | ✅ Met | api.ts: `isRefreshing` + `failedQueue` + `_retry` pattern |
| 미인증 /dashboard → /login?returnUrl=/dashboard | ✅ Met | ProtectedRoute.tsx + App.tsx wrapping |
| 로그인 후 returnUrl 이동 | ✅ Met | LoginForm.tsx: `searchParams.get('returnUrl')` |
| 로그아웃 → Refresh Token 무효화 → /login | ✅ Met | AuthController.logout + authStore.logout + Sidebar button |
| AdSense 스크립트 + 광고 슬롯 렌더링 | ✅ Met | index.html script + AdBanner in Dashboard/BookList |

**Success Criteria: 7/7 Met (100%)**

---

## 6. Match Rate

| Axis | Score | Weight |
|------|:-----:|:------:|
| Structural Match | 100% | 0.20 |
| Functional Depth | 99% | 0.40 |
| API Contract | 100% | 0.40 |

**Overall Match Rate (Static): (100 × 0.2) + (99 × 0.4) + (100 × 0.4) = 20 + 39.6 + 40 = 99.6%**

---

## 7. Recommendation

Match Rate **99.6% (>= 90%)** — Report 단계로 진행 가능.

### Minor 개선 권장 (선택적):
1. **G-01**: `ca-pub-XXXXXXXX`를 실제 AdSense ID로 교체 (사용자 작업)
2. **G-02**: email_hash UNIQUE 제약 추가 V4 마이그레이션
3. **G-03**: JwtTokenProvider.createRefreshToken() dead code 제거

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-04 | Initial gap analysis — static only |
