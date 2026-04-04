# 보안 강화 & 인증 개선 & AdSense Planning Document

> **Summary**: 개인정보 AES 암호화, JWT 환경변수화, Refresh Token, 라우트 가드, 로그아웃, Google AdSense를 통합 구현하여 보안·인증·수익화 기반을 완성
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-04
> **Status**: Draft
> **Method**: Plan Plus (Brainstorming-Enhanced)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 개인정보(이메일)가 평문 저장, JWT 시크릿 하드코딩, Refresh Token 미구현(자동 갱신 불가), 미인증 사용자가 보호 라우트 접근 가능, 로그아웃 UI 없음, 수익화 수단 없음 |
| **Solution** | AES-256-GCM 암호화 + JWT/OAuth 환경변수 분리 + Refresh Token DB 관리 + ProtectedRoute 컴포넌트 + 로그아웃 API/UI + Google AdSense 광고 배치 |
| **Function/UX Effect** | 개인정보 안전 저장, 토큰 만료 시 끊김 없는 자동 갱신, 미인증 접근 시 자동 로그인 리다이렉트(returnUrl 보존), Sidebar 로그아웃 버튼, 페이지 내 비침습적 광고 |
| **Core Value** | "안전하고, 끊김 없고, 지속 가능한" — 보안 기반 위에 사용자 경험과 수익 모델을 동시에 확보 |

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

## 1. User Intent Discovery

### 1.1 Core Problem
- 개인정보(이메일) 평문 저장 → 보안 취약
- JWT 시크릿 application.yml 하드코딩 → 소스코드 유출 시 토큰 위조 가능
- Refresh Token 미구현 → Access Token 만료 시 강제 로그아웃 (UX 저하)
- 보호 라우트 가드 없음 → URL 직접 입력으로 접근 가능 (API는 401이지만 빈 페이지)
- 로그아웃 UI 없음 → 사용자가 로그아웃 불가
- 수익화 수단 없음 → 서비스 운영 비용 충당 필요

### 1.2 Target Users
- **모든 사용자**: 보안·인증·라우트 가드
- **서비스 운영자**: AdSense 수익

### 1.3 Success Criteria
- [ ] User.email이 DB에 AES 암호화되어 저장되는지 확인
- [ ] JWT_SECRET, AES_SECRET_KEY가 환경변수로만 주입되는지 확인
- [ ] Access Token 만료 → Refresh Token으로 자동 갱신 → 요청 재시도
- [ ] 미인증 상태에서 /dashboard 접근 시 /login?returnUrl=/dashboard로 리다이렉트
- [ ] 로그인 후 returnUrl로 자동 이동
- [ ] 로그아웃 버튼 클릭 → Refresh Token 무효화 → /login 이동
- [ ] AdSense 스크립트 로드 + 광고 슬롯 렌더링

---

## 2. Alternatives Explored

### Approach A: 통합 구현 (Selected)
- **Pros**: 보안+인증이 서로 연관, 한 번에 정합성 확보. AdSense는 독립 추가.
- **Cons**: 변경 범위가 넓음 (BE+FE 동시)
- **Best for**: 현재 상황 — 보안·인증 기반이 전반적으로 미흡

### Approach B: 보안/인증 분리 + AdSense 별도 (Not Selected)
- **Pros**: 각 Plan을 독립 배포 가능
- **Cons**: 보안과 인증이 서로 의존 (Refresh Token ↔ 로그아웃), 분리 비효율

### Approach C: 개별 Plan 4개 (Not Selected)
- **Pros**: 세밀한 추적
- **Cons**: 기능 간 의존성으로 PDCA 문서 과다

---

## 3. YAGNI Review

### Included (v1)
| Feature | Justification |
|---------|---------------|
| 개인정보 AES 암호화 | 보안 필수 — 이메일 평문 저장 불가 |
| JWT 시크릿 환경변수화 | 보안 필수 — 하드코딩 위험 |
| Refresh Token (DB) | 인증 UX 필수 — 현재 TODO 상태 |
| BE 로그아웃 API | Refresh Token과 세트 — 무효화 필요 |
| FE 라우트 가드 | 인증 UX 필수 — 빈 페이지 방지 |
| 로그아웃 UI | 기본 기능 — 현재 불가능 |
| Google AdSense | 수익화 기반 — 조기 설정이 승인에 유리 |

### Deferred (Out of Scope)
| Feature | Reason |
|---------|--------|
| 로그인 시도 제한 (5회/15분) | 보안 강화이나 v1에서 필수 아님, 추후 추가 |
| IP 기반 차단 | 운영 단계에서 검토 |
| 감사 로그 (Audit Log) | 규모 확대 시 도입 |
| GDPR 관련 (데이터 삭제 요청) | 한국 서비스 우선, 글로벌 확장 시 |

---

## 4. Scope

### 4.1 In Scope

**Module A — 개인정보 암호화**
- [ ] AesEncryptor 유틸 클래스 (AES-256-GCM, Base64 인코딩)
- [ ] AES_SECRET_KEY 환경변수에서 읽기
- [ ] User 엔티티: email 필드 암호화 저장 (@Convert 또는 서비스 레이어)
- [ ] 기존 사용자 email 마이그레이션 (평문 → 암호화)
- [ ] 이메일 검색을 위한 email_hash 컬럼 추가 (SHA-256)

**Module B — JWT & 환경변수**
- [ ] JWT_SECRET → 환경변수 (application.yml에서 ${JWT_SECRET})
- [ ] OAUTH_REDIRECT_BASE → 환경변수
- [ ] application.yml에서 하드코딩 제거

**Module C — Refresh Token**
- [ ] RefreshToken 엔티티 (token, userId, expiresAt, createdAt)
- [ ] RefreshTokenRepository
- [ ] AuthService.login() → Refresh Token DB 저장
- [ ] POST /api/v1/auth/refresh → DB 검증 + 새 Access Token 발급
- [ ] OAuth2SuccessHandler → Refresh Token DB 저장

**Module D — 로그아웃**
- [ ] DELETE /api/v1/auth/logout → Refresh Token DB 삭제
- [ ] FE: Sidebar에 로그아웃 버튼
- [ ] FE: logout() → BE API 호출 → localStorage 정리 → /login 이동

**Module E — 라우트 가드**
- [ ] ProtectedRoute 컴포넌트 (authStore.isAuthenticated 체크)
- [ ] 미인증 → /login?returnUrl={currentPath} 리다이렉트
- [ ] LoginForm: 로그인 성공 시 returnUrl로 이동 (없으면 /dashboard)
- [ ] App.tsx: 보호 라우트를 ProtectedRoute로 래핑

**Module F — Google AdSense**
- [ ] index.html에 AdSense 스크립트 태그 추가
- [ ] AdBanner 컴포넌트 (data-ad-client, data-ad-slot props)
- [ ] 반응형 광고 유닛 (responsive)
- [ ] Dashboard, BookList 등 주요 페이지에 광고 슬롯 배치
- [ ] 로그인/회원가입 페이지에는 광고 미배치

### 4.2 Out of Scope
- 로그인 시도 제한 → 추후 별도 구현
- 2FA (이중 인증)
- 데이터 삭제 요청 (GDPR)
- 감사 로그

---

## 5. Requirements

### 5.1 Functional Requirements

| ID | Requirement | Priority | Module |
|----|-------------|----------|--------|
| FR-S01 | 이메일 AES-256-GCM 암호화 저장 | High | A |
| FR-S02 | email_hash (SHA-256) 컬럼으로 이메일 검색 | High | A |
| FR-S03 | 기존 사용자 이메일 마이그레이션 | High | A |
| FR-S04 | JWT 시크릿 환경변수 분리 | High | B |
| FR-S05 | OAuth redirect-base 환경변수 분리 | Medium | B |
| FR-S06 | Refresh Token DB 저장 + 검증 | High | C |
| FR-S07 | Access Token 만료 시 자동 갱신 (FE) | High | C |
| FR-S08 | BE 로그아웃 API (Refresh Token 무효화) | High | D |
| FR-S09 | FE 로그아웃 UI + 동작 | High | D |
| FR-S10 | FE ProtectedRoute (미인증 리다이렉트) | High | E |
| FR-S11 | returnUrl 보존 (로그인 후 원래 페이지) | Medium | E |
| FR-S12 | AdSense 스크립트 + 광고 컴포넌트 | Medium | F |
| FR-S13 | 주요 페이지 광고 슬롯 배치 | Medium | F |

### 5.2 API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/refresh` | Refresh Token으로 새 Access Token 발급 (기존 개선) | No |
| DELETE | `/api/v1/auth/logout` | 로그아웃 (Refresh Token 무효화) | Required |

**Total: 기존 1개 개선 + 1개 신규 = 2 endpoints**

---

## 6. Technical Details

### 6.1 AES-256-GCM 암호화 설계

```java
@Component
public class AesEncryptor {
    // 환경변수에서 키 로드
    @Value("${security.aes.secret-key}")  // AES_SECRET_KEY
    private String secretKey;

    public String encrypt(String plainText);   // → Base64 encoded
    public String decrypt(String cipherText);  // → plain text
}
```

**이메일 검색 문제 해결**:
- 암호화된 이메일은 LIKE 검색 불가
- `email_hash` 컬럼 추가 (SHA-256 해시)
- 로그인 시: `WHERE email_hash = SHA256(입력이메일)` → 매칭된 row의 email 복호화 검증

### 6.2 Refresh Token 엔티티

```java
@Entity @Table(name = "refresh_tokens")
public class RefreshToken {
    Long id;
    Long userId;
    String token;         // UUID
    LocalDateTime expiresAt;  // 7 days
    LocalDateTime createdAt;
}
```

### 6.3 FE Token 자동 갱신 (api.ts 개선)

```typescript
// 401 응답 시 → refreshToken으로 재발급 시도
// 재발급 성공 → 원래 요청 재시도
// 재발급 실패 → logout() + /login 리다이렉트
```

### 6.4 ProtectedRoute 컴포넌트

```tsx
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${location.pathname}`} replace />;
  }
  return children;
}
```

---

## 7. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| AES 키 유출 → 전체 이메일 노출 | Critical | 환경변수 관리, 키 로테이션 절차 수립 |
| 기존 데이터 마이그레이션 실패 | High | 마이그레이션 스크립트 + 롤백 SQL 준비 |
| Refresh Token 탈취 | High | DB 저장 + 로그아웃 시 무효화 + httpOnly 고려 |
| AdSense 승인 지연/거절 | Low | 충분한 콘텐츠 확보 후 신청, 거절 시 대안 검토 |

---

## 8. Module Implementation Order

| Order | Module | Dependencies | Estimated |
|:-----:|--------|-------------|:---------:|
| 1 | B: JWT 환경변수 | 없음 (독립) | BE ~2 |
| 2 | A: AES 암호화 | 환경변수 (B) | BE ~5 |
| 3 | C: Refresh Token | JWT (B) | BE ~5 |
| 4 | D: 로그아웃 | Refresh Token (C) | BE ~2, FE ~2 |
| 5 | E: 라우트 가드 | 없음 (독립) | FE ~3 |
| 6 | F: AdSense | 없음 (독립) | FE ~3 |

**Total: BE ~14, FE ~8 = ~22 files (신규+수정)**

---

## 9. Brainstorming Log

| Phase | Decision | Rationale |
|-------|----------|-----------|
| Phase 1 | 5개 요청 → SEO 제외, 4개 통합 | 사용자 결정: SEO는 SPA 한계로 추후 검토 |
| Phase 2 | Approach A (통합) 선택 | 보안·인증이 서로 의존, 한 번에 정합성 확보 |
| Phase 3 | 로그인 시도 제한 제외 | YAGNI — v1 보안 기반 확보 후 추가 |
| Phase 3 | 보안 수준: 중간 | AES 암호화 + 환경변수 + Refresh Token |
| Phase 4 | AES-256-GCM + email_hash 패턴 | 암호화와 검색 성능 모두 확보 |

---

## 10. Next Steps

1. [ ] Design 문서 작성 (`/pdca design security-auth-adsense`)
2. [ ] Module B→A→C→D→E→F 순차 구현
3. [ ] Gap Analysis (`/pdca analyze security-auth-adsense`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Plan Plus initial — 7 features across 6 modules | kyungheelee |
