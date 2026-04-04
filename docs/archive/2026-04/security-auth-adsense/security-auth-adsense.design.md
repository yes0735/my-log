# 보안 강화 & 인증 개선 & AdSense Design Document

> **Summary**: Option C 실용적 균형 — JPA @Converter 투명 암호화, RefreshToken 별도 도메인, ProtectedRoute, AdSense
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-04
> **Status**: Draft
> **Planning Doc**: [security-auth-adsense.plan.md](../../01-plan/features/security-auth-adsense.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 개인정보 보호 의무 이행 + 인증 UX 완성 + 수익화 기반 마련 |
| **WHO** | 모든 사용자 (기존 + 신규) |
| **RISK** | AES 키 유출 시 전체 개인정보 노출, Refresh Token 탈취 시 세션 하이재킹, AdSense 승인 지연 |
| **SUCCESS** | 이메일 DB 암호화 확인, 토큰 자동 갱신 동작, 미인증 리다이렉트 동작, 로그아웃 동작, AdSense 광고 노출 |
| **SCOPE** | AES 암호화 + JWT 환경변수 + Refresh Token + 라우트 가드 + 로그아웃 + AdSense |

---

## 1. Architecture Decision

**Selected**: Option C — Pragmatic Balance

- AES 암호화: JPA `@Converter` 기반 투명 암호화 (서비스 레이어는 암호화 무관)
- Refresh Token: 별도 entity + repository (auth 도메인 내)
- 라우트 가드: `ProtectedRoute` 래퍼 컴포넌트
- AdSense: 재사용 가능한 `AdBanner` 컴포넌트

---

## 2. Data Model

### 2.1 User 엔티티 변경

```java
@Entity @Table(name = "users")
public class User extends BaseEntity {
    Long id;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(nullable = false)
    String email;               // DB에 AES-256-GCM 암호화 저장

    @Column(name = "email_hash", nullable = false, unique = true, length = 64)
    String emailHash;           // SHA-256 해시 (검색용, unique)

    String password;            // BCrypt (기존 유지)
    String nickname;
    String profileImageUrl;
    String provider;            // LOCAL, GOOGLE, GITHUB, KAKAO
    String providerId;
}
```

**변경점**: `email` 컬럼 unique 제약 제거 → `email_hash` 컬럼으로 이전. 암호화된 값은 매번 다를 수 있으므로 (GCM IV) unique 제약 불가.

### 2.2 RefreshToken 엔티티 (신규)

```java
@Entity @Table(name = "refresh_tokens")
public class RefreshToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", nullable = false)
    Long userId;

    @Column(nullable = false, unique = true, length = 36)
    String token;               // UUID v4

    @Column(name = "expires_at", nullable = false)
    LocalDateTime expiresAt;    // 7 days from creation

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    LocalDateTime createdAt = LocalDateTime.now();
}
```

### 2.3 DB Migration

```sql
-- V3__security_enhancements.sql

-- 1. email_hash 컬럼 추가
ALTER TABLE users ADD COLUMN email_hash VARCHAR(64);

-- 2. 기존 이메일로 해시 생성 (마이그레이션 후 Java 코드에서 암호화 실행)
-- Note: 실제 해시는 애플리케이션 시작 시 DataMigrationRunner에서 처리

-- 3. refresh_tokens 테이블
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
```

### 2.4 Data Migration Runner (일회성)

```java
@Component @RequiredArgsConstructor
public class DataMigrationRunner implements ApplicationRunner {
    // 1. email_hash가 NULL인 사용자 조회
    // 2. 각 사용자의 email을 SHA-256 해시 → email_hash 저장
    // 3. 각 사용자의 email을 AES 암호화 → email 업데이트
    // 4. 완료 후 email_hash NOT NULL + UNIQUE 제약 추가 (수동 또는 V4 마이그레이션)
}
```

---

## 3. API Specification

### 3.1 POST /api/v1/auth/refresh (기존 개선)

**Before**: JWT 토큰 자체를 검증만 함
**After**: DB에 저장된 Refresh Token UUID 검증

| Field | Before | After |
|-------|--------|-------|
| Request Body | `{ "refreshToken": "<jwt>" }` | `{ "refreshToken": "<uuid>" }` |
| Validation | JWT 서명 검증만 | DB 존재 + 만료 체크 |
| Response | `{ accessToken, refreshToken }` | `{ accessToken, refreshToken }` (새 UUID) |
| Side Effect | 없음 | 기존 토큰 삭제 + 새 토큰 저장 (Token Rotation) |

```
POST /api/v1/auth/refresh
Content-Type: application/json

{ "refreshToken": "550e8400-e29b-41d4-a716-446655440000" }

→ 200: { "data": { "accessToken": "eyJ...", "refreshToken": "new-uuid" } }
→ 401: { "error": "REFRESH_TOKEN_EXPIRED" }
```

### 3.2 DELETE /api/v1/auth/logout (신규)

```
DELETE /api/v1/auth/logout
Authorization: Bearer <accessToken>

→ 200: { "data": null }
```

**동작**: 해당 사용자의 모든 Refresh Token 삭제 (전체 세션 로그아웃)

### 3.3 기존 login/signup 변경

**login**: 기존 `findByEmail` → `findByEmailHash(sha256(email))` 로 변경
**signup**: `email` 저장 시 `emailHash` 도 함께 저장. 중복 체크 → `existsByEmailHash`
**login/signup response**: Refresh Token을 JWT 대신 UUID로 반환 + DB 저장

---

## 4. Backend Structure

### 4.1 신규 파일

```
global/
├── security/
│   ├── AesEncryptor.java              # AES-256-GCM 유틸
│   └── EncryptedStringConverter.java  # JPA @Converter (투명 암호화)
│
domain/user/
├── entity/RefreshToken.java           # Refresh Token 엔티티
├── repository/RefreshTokenRepository.java
```

### 4.2 수정 파일

```
domain/user/
├── entity/User.java                   # email @Convert 추가, emailHash 필드 추가
├── repository/UserRepository.java     # findByEmailHash, existsByEmailHash 추가
├── service/UserService.java           # login/signup: emailHash 기반, RefreshToken DB 관리
├── controller/AuthController.java     # logout endpoint 추가

global/
├── auth/JwtTokenProvider.java         # createRefreshToken 제거 (UUID로 대체)
├── config/SecurityConfig.java         # /api/v1/auth/logout permitAll → authenticated 확인

resources/
├── application.yml                    # jwt.secret → ${JWT_SECRET}, security.aes 추가
├── db/migration/V3__security_enhancements.sql

(일회성)
├── DataMigrationRunner.java           # 기존 이메일 암호화 마이그레이션
```

**BE 파일 수**: 신규 4 + 수정 8 + 마이그레이션 2 = **~14**

---

## 5. AES-256-GCM 설계

### 5.1 AesEncryptor

```java
@Component
public class AesEncryptor {
    @Value("${security.aes.secret-key}")  // AES_SECRET_KEY 환경변수
    private String secretKeyBase64;

    private SecretKey secretKey;

    @PostConstruct
    public void init() {
        byte[] decodedKey = Base64.getDecoder().decode(secretKeyBase64);
        this.secretKey = new SecretKeySpec(decodedKey, "AES");
    }

    public String encrypt(String plainText) {
        // 1. 랜덤 12바이트 IV 생성
        // 2. AES-GCM 암호화
        // 3. IV + cipherText + authTag → Base64 인코딩
        // return: Base64(IV || cipherText || authTag)
    }

    public String decrypt(String cipherText) {
        // 1. Base64 디코딩
        // 2. IV 분리 (앞 12바이트)
        // 3. AES-GCM 복호화
        // return: plainText
    }

    public static String sha256(String input) {
        // SHA-256 해시 → hex string (64자)
        // 이메일 검색용 (복호화 불필요)
    }
}
```

### 5.2 EncryptedStringConverter (JPA)

```java
@Converter
@RequiredArgsConstructor
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    private final AesEncryptor aesEncryptor;

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return attribute == null ? null : aesEncryptor.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return dbData == null ? null : aesEncryptor.decrypt(dbData);
    }
}
```

**투명 동작**: User.getEmail() 호출 시 자동 복호화, save() 시 자동 암호화.

---

## 6. Refresh Token Flow

### 6.1 Login/Signup Flow

```
Client                    Server
  |--- POST /auth/login --→|
  |                         | 1. findByEmailHash(sha256(email))
  |                         | 2. BCrypt 검증
  |                         | 3. Access Token (JWT) 생성
  |                         | 4. Refresh Token (UUID) 생성 → DB 저장
  |←-- { accessToken,      |
  |      refreshToken } ---|
  |                         |
  | localStorage에 저장     |
```

### 6.2 Token Refresh Flow (자동)

```
Client                    Server
  |--- API 요청 -----------→|
  |←-- 401 Unauthorized ----|
  |                         |
  |--- POST /auth/refresh --→|
  |    { refreshToken }     | 1. DB에서 토큰 조회
  |                         | 2. 만료 여부 체크
  |                         | 3. 기존 토큰 삭제 (Rotation)
  |                         | 4. 새 Access + Refresh Token 생성
  |←-- { accessToken,      |
  |      refreshToken } ---|
  |                         |
  | 원래 요청 재시도         |
```

### 6.3 Logout Flow

```
Client                    Server
  |--- DELETE /auth/logout -→|
  |    Authorization: Bearer | 1. userId 추출
  |                         | 2. 해당 사용자 모든 RefreshToken 삭제
  |←-- 200 OK --------------|
  |                         |
  | localStorage 정리       |
  | → /login 이동           |
```

---

## 7. application.yml 변경

```yaml
# Before (하드코딩)
jwt:
  secret: mylog-jwt-secret-key-must-be-at-least-256-bits-long-for-hs256

oauth:
  redirect-base: http://localhost:5173

# After (환경변수)
jwt:
  secret: ${JWT_SECRET:dev-secret-key-must-be-at-least-256-bits-long-for-hs256}
  access-token-expiration: 1800000
  refresh-token-expiration: 604800000

oauth:
  redirect-base: ${OAUTH_REDIRECT_BASE:http://localhost:5173}

security:
  aes:
    secret-key: ${AES_SECRET_KEY:ZGV2LWFlcy1zZWNyZXQta2V5LTMyYnl0ZXMhIQ==}
    # dev default: Base64("dev-aes-secret-key-32bytes!!")
```

---

## 8. Frontend Structure

### 8.1 신규 파일

```
frontend/src/
├── components/
│   ├── ProtectedRoute.tsx             # 인증 가드 래퍼
│   └── ads/
│       └── AdBanner.tsx               # Google AdSense 배너 컴포넌트
```

### 8.2 수정 파일

```
frontend/src/
├── lib/api.ts                         # 401 인터셉터 → Refresh Token 자동 갱신
├── stores/authStore.ts                # logout → BE API 호출 추가
├── App.tsx                            # ProtectedRoute 래핑
├── components/layout/Sidebar.tsx      # 로그아웃 버튼 추가
├── pages/Login.tsx                    # returnUrl 파라미터 처리
├── index.html                         # AdSense 스크립트 태그
├── pages/Dashboard.tsx                # AdBanner 배치
├── pages/BookList.tsx                 # AdBanner 배치
```

**FE 파일 수**: 신규 2 + 수정 7 = **~9**

---

## 9. Frontend 상세 설계

### 9.1 ProtectedRoute

```tsx
// components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}
```

### 9.2 App.tsx 변경

```tsx
// Before: <Route element={<AppLayout />}>
// After:
<Route element={
  <ProtectedRoute>
    <AppLayout />
  </ProtectedRoute>
}>
  <Route path="/dashboard" element={<Dashboard />} />
  {/* ... 기존 보호 라우트 유지 ... */}
</Route>
```

### 9.3 api.ts — Token Refresh Interceptor

```typescript
// 401 응답 인터셉터 개선
let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 다른 요청이 이미 갱신 중 → 큐에 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken }
        );

        const newAccessToken = data.data.accessToken;
        const newRefreshToken = data.data.refreshToken;
        localStorage.setItem('accessToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 대기 중인 요청들 처리
        failedQueue.forEach(({ resolve }) => resolve(newAccessToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

### 9.4 authStore.ts — Logout with BE API

```typescript
logout: async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      await axios.delete(`${baseURL}/auth/logout`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch {
    // 실패해도 로컬 정리 진행
  }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  set({ user: null, isAuthenticated: false });
},
```

### 9.5 Sidebar 로그아웃 버튼

```tsx
// NavList 하단에 추가
<hr className="my-2 border-border" />
<button
  onClick={async () => {
    await useAuthStore.getState().logout();
    window.location.href = '/login';
  }}
  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted
             hover:bg-red-500/10 hover:text-red-500 transition-colors"
>
  <IoLogOutOutline className="h-5 w-5 shrink-0" />
  {!collapsed && <span>로그아웃</span>}
</button>
```

### 9.6 Login.tsx — returnUrl 처리

```tsx
// 로그인 성공 후:
const searchParams = new URLSearchParams(location.search);
const returnUrl = searchParams.get('returnUrl') || '/dashboard';
navigate(returnUrl, { replace: true });
```

### 9.7 AdBanner 컴포넌트

```tsx
// components/ads/AdBanner.tsx
import { useEffect } from 'react';

interface AdBannerProps {
  adClient: string;        // ca-pub-XXXXXXXX
  adSlot: string;          // 광고 슬롯 ID
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export default function AdBanner({ adClient, adSlot, format = 'auto', className }: AdBannerProps) {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense 스크립트 미로드 시 무시
    }
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
```

### 9.8 index.html — AdSense 스크립트

```html
<!-- <head> 내부 -->
<script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXX"
  crossorigin="anonymous"
></script>
```

**AdSense 배치 위치**:
- Dashboard: 콘텐츠 하단 (1개)
- BookList: 목록 중간 또는 사이드바 (1개)
- 로그인/회원가입 페이지: 미배치

---

## 10. SecurityConfig 변경

```java
// logout endpoint 추가 (인증 필요)
.requestMatchers(
    "/api/v1/auth/signup",
    "/api/v1/auth/login",
    "/api/v1/auth/oauth/**",
    "/api/v1/auth/refresh"    // refresh는 토큰 없이 접근 가능 유지
).permitAll()
// /api/v1/auth/logout은 .authenticated()에 포함 (기존 /api/** 규칙)
```

---

## 11. Implementation Guide

### 11.1 Module Map

| Key | Module | BE Files | FE Files | Dependencies |
|-----|--------|:--------:|:--------:|-------------|
| `module-B` | JWT 환경변수 | 2 (yml, JwtTokenProvider) | 0 | 없음 |
| `module-A` | AES 암호화 | 6 (Encryptor, Converter, User, UserRepo, Migration, Runner) | 0 | module-B |
| `module-C` | Refresh Token | 4 (Entity, Repo, UserService, AuthController) | 0 | module-B |
| `module-D` | 로그아웃 | 1 (AuthController) | 2 (authStore, Sidebar) | module-C |
| `module-E` | 라우트 가드 | 0 | 3 (ProtectedRoute, App, Login) | 없음 |
| `module-F` | AdSense | 0 | 4 (AdBanner, index.html, Dashboard, BookList) | 없음 |

### 11.2 Implementation Order

1. **module-B**: application.yml 환경변수화 + JwtTokenProvider 정리
2. **module-A**: AesEncryptor + Converter + User 엔티티 변경 + Migration + Runner
3. **module-C**: RefreshToken 엔티티/레포 + UserService 로직 변경
4. **module-D**: AuthController logout + FE authStore + Sidebar 버튼
5. **module-E**: ProtectedRoute + App.tsx + Login returnUrl
6. **module-F**: AdBanner + index.html + 페이지 배치

### 11.3 Session Guide

| Session | Modules | Command | Estimated |
|:-------:|---------|---------|-----------|
| 1 | B + A | `--scope module-B,module-A` | BE ~8 (환경변수 + 암호화 코어) |
| 2 | C + D | `--scope module-C,module-D` | BE ~5, FE ~2 (토큰 + 로그아웃) |
| 3 | E + F | `--scope module-E,module-F` | FE ~7 (가드 + 광고) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-04 | Initial design — Option C selected |
