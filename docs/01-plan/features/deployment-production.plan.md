# 프로덕션 배포 Planning Document

> **Summary**: Vercel (FE) + Railway (BE Docker + PostgreSQL) 기반 프로덕션 배포. GitHub push → 자동 배포 파이프라인 구축
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-05
> **Status**: Draft
> **Method**: Plan Plus (Brainstorming-Enhanced)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 로컬 개발 환경에서만 실행 가능하여 외부 사용자 접근 불가. 데모/포트폴리오 목적으로도 공개 URL이 없음 |
| **Solution** | FE를 Vercel에 정적 배포 + BE를 Docker 이미지로 Railway에 배포 + Railway PostgreSQL add-on + 프로덕션 환경변수 분리 |
| **Function/UX Effect** | 공개 URL로 누구나 접속 가능, GitHub push 시 자동 배포, 프로덕션 시크릿 안전 관리 |
| **Core Value** | "로컬에서 세상으로" — 개발 완료된 서비스를 실사용자에게 제공할 수 있는 프로덕션 환경 구축 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 외부 사용자 접근 가능한 프로덕션 환경 구축 |
| **WHO** | 서비스 운영자 (배포), 실사용자 (접속) |
| **RISK** | 환경변수 누출, CORS 설정 오류, DB 마이그레이션 실패, OAuth redirect URL 불일치 |
| **SUCCESS** | Vercel URL에서 FE 정상 로드, Railway URL에서 BE API 응답, 로그인/기능 E2E 동작 |
| **SCOPE** | Dockerfile + Railway 배포 + Vercel 배포 + 프로덕션 환경변수 + CORS/Proxy 설정 |

---

## 1. User Intent Discovery

### 1.1 Core Problem
- 로컬에서만 실행 가능 → 외부 접근 불가
- 포트폴리오/데모 목적으로 공개 URL 필요
- 향후 실사용자 유입 대비 프로덕션 환경 필요

### 1.2 Target Users
- **서비스 운영자**: 배포 및 운영
- **실사용자**: 공개 URL로 서비스 이용

### 1.3 Success Criteria
- [ ] BE: Railway에 Docker 배포 + 헬스체크 200 OK
- [ ] DB: Railway PostgreSQL에 마이그레이션 정상 실행
- [ ] FE: Vercel 배포 + 빌드 성공 + 정적 페이지 로드
- [ ] FE → BE API 호출 정상 (CORS + Proxy)
- [ ] 로그인 (이메일 + OAuth) E2E 동작
- [ ] 프로덕션 환경변수 안전 관리 (Railway/Vercel 대시보드)

---

## 2. Alternatives Explored

### Approach A: Docker 기반 (Selected)
- **Pros**: 로컬 = 프로덕션 동일 환경, Railway Docker 지원 우수, 재현성 최고
- **Cons**: Dockerfile 작성 필요

### Approach B: Nixpacks 자동 (Not Selected)
- **Pros**: Dockerfile 불필요
- **Cons**: 빌드 설정 커스터마이징 제한, 로컬과 환경 차이 가능

### Approach C: 모노레포 CI/CD (Not Selected)
- **Pros**: 체계적
- **Cons**: 현재 규모에 과도

---

## 3. YAGNI Review

### Included (v1)
| Feature | Justification |
|---------|---------------|
| BE Dockerfile (multi-stage) | Docker 기반 배포 핵심 |
| Railway 프로젝트 + PostgreSQL | BE + DB 호스팅 |
| Vercel 연결 + 빌드 설정 | FE 호스팅 |
| 프로덕션 환경변수 | 시크릿 분리 필수 |
| CORS 프로덕션 도메인 추가 | FE↔BE 통신 필수 |
| application-prod.yml | 프로덕션 전용 설정 |

### Deferred (Out of Scope)
| Feature | Reason |
|---------|--------|
| 커스텀 도메인 + HTTPS | 도메인 미구매 → 추후 연결 |
| GitHub Actions CI/CD | Railway/Vercel 자동 배포로 충분 |
| 모니터링 (Sentry, Datadog) | 초기 배포 후 검토 |
| CDN 설정 | Vercel 기본 CDN 활용 |
| 로드밸런서/오토스케일링 | 현재 트래픽 수준 불필요 |

---

## 4. Scope

### 4.1 In Scope

**Module A — Backend Dockerfile**
- [ ] Multi-stage Dockerfile (build + runtime)
- [ ] Gradle build → JAR 실행
- [ ] .dockerignore 작성
- [ ] 로컬 Docker 빌드 + 실행 테스트

**Module B — Railway 배포**
- [ ] Railway 프로젝트 생성 (GitHub repo 연결)
- [ ] Railway PostgreSQL add-on 추가
- [ ] 환경변수 설정 (DATABASE_URL, JWT_SECRET, AES_SECRET_KEY, OAuth 키 등)
- [ ] Dockerfile 감지 → 자동 빌드/배포
- [ ] 헬스체크 확인

**Module C — Vercel 배포**
- [ ] Vercel 프로젝트 생성 (GitHub repo 연결)
- [ ] Root Directory: `frontend` 설정
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] 환경변수: `VITE_API_URL` (Railway BE URL)
- [ ] vercel.json API 프록시 rewrite (SPA fallback + API proxy)

**Module D — 프로덕션 설정**
- [ ] application-prod.yml (프로덕션 전용 Spring 설정)
- [ ] CORS: Vercel 도메인 추가
- [ ] OAuth redirect-base: Vercel URL로 설정
- [ ] Flyway: 프로덕션 DB에 마이그레이션 자동 실행
- [ ] FE: 환경별 API URL 분기

### 4.2 Out of Scope
- 커스텀 도메인 + SSL → 도메인 구매 후 별도 작업
- CI/CD 파이프라인 (GitHub Actions) → Railway/Vercel 자동 배포 활용
- 모니터링/알림 → 초기 배포 후 검토

---

## 5. Requirements

### 5.1 Functional Requirements

| ID | Requirement | Priority | Module |
|----|-------------|----------|--------|
| FR-D01 | Multi-stage Dockerfile (build + runtime) | High | A |
| FR-D02 | .dockerignore (node_modules, .git 등 제외) | Medium | A |
| FR-D03 | Railway PostgreSQL add-on + DATABASE_URL | High | B |
| FR-D04 | Railway 환경변수 (JWT, AES, OAuth) | High | B |
| FR-D05 | Vercel Root Directory = frontend | High | C |
| FR-D06 | Vercel VITE_API_URL = Railway URL | High | C |
| FR-D07 | vercel.json SPA fallback + API rewrite | High | C |
| FR-D08 | application-prod.yml (DB URL, CORS) | High | D |
| FR-D09 | CORS: Vercel 프로덕션 도메인 허용 | High | D |
| FR-D10 | OAuth redirect-base: Vercel URL | High | D |

---

## 6. Technical Details

### 6.1 Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Build
FROM gradle:8.12-jdk17 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true
COPY src ./src
RUN gradle bootJar --no-daemon

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
```

### 6.2 application-prod.yml

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    # Railway PostgreSQL auto-provisions DATABASE_URL
  jpa:
    hibernate:
      ddl-auto: update

# CORS: Vercel production domain
cors:
  allowed-origins: ${CORS_ALLOWED_ORIGINS:https://my-log-*.vercel.app}

oauth:
  redirect-base: ${OAUTH_REDIRECT_BASE}
```

### 6.3 vercel.json

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://RAILWAY_URL/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 6.4 Railway 환경변수

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | (auto) | Railway PostgreSQL add-on |
| `JWT_SECRET` | (랜덤 64자) | 수동 생성 |
| `AES_SECRET_KEY` | (Base64 32-byte) | 수동 생성 |
| `OAUTH_REDIRECT_BASE` | https://my-log-xxx.vercel.app | Vercel URL |
| `GOOGLE_CLIENT_ID` | (OAuth 앱) | Google Console |
| `GOOGLE_CLIENT_SECRET` | (OAuth 앱) | Google Console |
| `GITHUB_CLIENT_ID` | (OAuth 앱) | GitHub Settings |
| `GITHUB_CLIENT_SECRET` | (OAuth 앱) | GitHub Settings |
| `KAKAO_CLIENT_ID` | (OAuth 앱) | Kakao Developers |
| `KAKAO_CLIENT_SECRET` | (OAuth 앱) | Kakao Developers |
| `CORS_ALLOWED_ORIGINS` | https://my-log-xxx.vercel.app | Vercel URL |
| `PORT` | 8081 | Railway |

---

## 7. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Railway 무료 플랜 제한 ($5 credit) | Medium | 사용량 모니터링, 필요 시 유료 전환 |
| OAuth redirect URL 불일치 | High | Vercel URL 확정 후 OAuth 앱 설정 업데이트 |
| CORS 에러 | High | application-prod.yml에 Vercel 도메인 명시 |
| DB 마이그레이션 실패 | High | ddl-auto: update로 안전하게, Flyway baseline 확인 |
| 환경변수 누출 | Critical | Railway/Vercel 대시보드에서만 관리, .env 파일 커밋 금지 |

---

## 8. Module Implementation Order

| Order | Module | Dependencies | Estimated |
|:-----:|--------|-------------|:---------:|
| 1 | A: Dockerfile | 없음 | ~3 files |
| 2 | D: 프로덕션 설정 | 없음 | ~3 files |
| 3 | B: Railway 배포 | A, D | 대시보드 설정 |
| 4 | C: Vercel 배포 | B (Railway URL 필요) | 대시보드 + 2 files |

**Total: ~8 files + 플랫폼 설정**

---

## 9. Brainstorming Log

| Phase | Decision | Rationale |
|-------|----------|-----------|
| Phase 1 | 우선 데모 배포, 도메인은 추후 | 빠른 공개 URL 확보 우선 |
| Phase 2 | Approach A: Docker 기반 | 로컬=프로덕션 동일 환경 보장 |
| Phase 3 | 도메인/CI-CD/모니터링 제외 | YAGNI — 초기 배포에 불필요 |
| Phase 4 | Multi-stage Dockerfile | 빌드 이미지와 런타임 분리로 이미지 크기 최소화 |

---

## 10. Next Steps

1. [ ] Design 문서 (`/pdca design deployment-production`)
2. [ ] Dockerfile + 프로덕션 설정 구현
3. [ ] Railway + Vercel 배포
4. [ ] E2E 테스트 (공개 URL에서 로그인/기능 동작 확인)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-05 | Plan Plus initial — Docker + Railway + Vercel | kyungheelee |
