# 프로덕션 배포 Design Document

> **Summary**: Docker multi-stage build + Railway (BE+DB) + Vercel (FE) + 프로덕션 환경변수/CORS 설정
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-05
> **Status**: Draft
> **Planning Doc**: [deployment-production.plan.md](../../01-plan/features/deployment-production.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 외부 사용자 접근 가능한 프로덕션 환경 구축 |
| **WHO** | 서비스 운영자 (배포), 실사용자 (접속) |
| **RISK** | 환경변수 누출, CORS 오류, DB 마이그레이션 실패, OAuth redirect 불일치 |
| **SUCCESS** | Vercel FE 로드, Railway BE API 응답, 로그인/기능 E2E 동작 |
| **SCOPE** | Dockerfile + Railway + Vercel + 프로덕션 설정 |

---

## 1. Architecture

```
GitHub Repository (my-log/)
├── backend/               → Railway (Docker deploy)
│   ├── Dockerfile          (multi-stage: gradle build → JRE runtime)
│   ├── .dockerignore
│   └── application-prod.yml
│
├── frontend/              → Vercel (auto deploy)
│   ├── vercel.json         (API rewrite → Railway URL)
│   └── .env.production     (VITE_API_URL)
│
└── Railway PostgreSQL     (add-on, auto DATABASE_URL)
```

**Flow**: `git push` → Railway rebuilds Docker image → Vercel rebuilds FE → both auto-deploy

---

## 2. Module A: Backend Dockerfile

### 2.1 Dockerfile (multi-stage)

```dockerfile
# Stage 1: Build
FROM gradle:8.12-jdk17 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### 2.2 .dockerignore

```
.git
.gradle
build
node_modules
*.md
docs
frontend
```

### 2.3 Railway 설정

Railway는 `backend/` 디렉토리의 Dockerfile을 감지. Root Directory를 `backend`로 설정.

**Railway Start Command**: 불필요 (Dockerfile ENTRYPOINT 사용)

**Railway 환경변수로 Spring Profile 활성화**:
```
SPRING_PROFILES_ACTIVE=prod
```

---

## 3. Module D: 프로덕션 설정

### 3.1 application-prod.yml

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
  jpa:
    hibernate:
      ddl-auto: update
    properties:
      hibernate:
        format_sql: false
  flyway:
    enabled: true

server:
  port: ${PORT:8081}

logging:
  level:
    com.mylog: INFO
    org.hibernate.SQL: WARN
```

**핵심**: Railway가 `DATABASE_URL`과 `PORT`를 자동 주입. `DATABASE_URL` 형식은 `jdbc:postgresql://...`가 아닌 `postgresql://user:pass@host:port/db` (Railway 형식).

### 3.2 DATABASE_URL 파싱 문제

Railway PostgreSQL은 `DATABASE_URL=postgresql://user:pass@host:port/db` 형식을 주입합니다. Spring은 `jdbc:postgresql://` 형식이 필요하므로 변환이 필요합니다.

**해결**: application-prod.yml에서 개별 필드로 분리하거나, `JDBC_DATABASE_URL` 활용.

```yaml
# application-prod.yml — Railway PostgreSQL 호환
spring:
  datasource:
    url: jdbc:postgresql://${PGHOST}:${PGPORT}/${PGDATABASE}
    username: ${PGUSER}
    password: ${PGPASSWORD}
```

Railway PostgreSQL add-on은 `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`를 개별 변수로도 제공합니다.

### 3.3 CorsConfig 수정

```java
// 프로덕션 도메인을 환경변수에서 읽기
@Value("${cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
private String allowedOrigins;

config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
```

---

## 4. Module B: Railway 배포 절차

### 4.1 Railway 대시보드 설정

1. https://railway.app → New Project → Deploy from GitHub Repo
2. Select `my-log` repository
3. **Root Directory**: `backend`
4. Railway가 Dockerfile 자동 감지 → 빌드 시작
5. **Add PostgreSQL**: + New → Database → PostgreSQL
6. PostgreSQL 연결 → 환경변수 자동 주입 (`PGHOST`, `PGPORT` 등)

### 4.2 Railway 환경변수 설정

| Variable | Value | Note |
|----------|-------|------|
| `SPRING_PROFILES_ACTIVE` | `prod` | prod yml 활성화 |
| `PORT` | `8081` | Railway 포트 |
| `JWT_SECRET` | `(랜덤 64자)` | `openssl rand -hex 32` |
| `AES_SECRET_KEY` | `(Base64 32-byte)` | `openssl rand -base64 32` |
| `OAUTH_REDIRECT_BASE` | `https://my-log-xxx.vercel.app` | Vercel 배포 후 설정 |
| `CORS_ALLOWED_ORIGINS` | `https://my-log-xxx.vercel.app` | Vercel 도메인 |
| `GOOGLE_CLIENT_ID` | (OAuth 앱 값) | 사용자 보유 |
| `GOOGLE_CLIENT_SECRET` | (OAuth 앱 값) | |
| `GITHUB_CLIENT_ID` | (OAuth 앱 값) | |
| `GITHUB_CLIENT_SECRET` | (OAuth 앱 값) | |
| `KAKAO_CLIENT_ID` | (OAuth 앱 값) | |
| `KAKAO_CLIENT_SECRET` | (OAuth 앱 값) | |

> `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`는 PostgreSQL add-on이 자동 설정

---

## 5. Module C: Vercel 배포

### 5.1 Vercel 프로젝트 설정

1. https://vercel.com → Import Git Repository → `my-log`
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### 5.2 Vercel 환경변수

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://mylog-backend-production.up.railway.app/api/v1` |

### 5.3 vercel.json (API Proxy + SPA Fallback)

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://RAILWAY_BE_URL/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**중요**: `RAILWAY_BE_URL`은 Railway 배포 후 확정되는 URL로 교체 필요.

### 5.4 FE 환경별 API URL 분기

현재 `api.ts`의 `baseURL`은 이미 환경변수 기반:
```typescript
const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
```

- **로컬**: `VITE_API_URL=/api/v1` (Vite proxy → localhost:8081)
- **프로덕션**: `VITE_API_URL` 미설정 → `/api/v1` (vercel.json rewrite → Railway)

따라서 Vercel에서 `VITE_API_URL`을 설정하지 않고 vercel.json rewrite를 사용하는 것이 더 깔끔합니다.

---

## 6. Implementation Guide

### 6.1 Module Map

| Key | Module | New Files | Modified Files | Platform |
|-----|--------|:---------:|:--------------:|----------|
| `module-A` | Dockerfile | 2 (Dockerfile, .dockerignore) | 0 | Local |
| `module-D` | 프로덕션 설정 | 1 (application-prod.yml) | 1 (CorsConfig) | Local |
| `module-B` | Railway 배포 | 0 | 0 | Railway 대시보드 |
| `module-C` | Vercel 배포 | 1 (vercel.json) | 0 | Vercel 대시보드 |

### 6.2 Implementation Order

1. **module-A**: Dockerfile + .dockerignore 작성, 로컬 Docker 빌드 테스트
2. **module-D**: application-prod.yml + CorsConfig 환경변수화
3. **GitHub push**: 코드 커밋 + 푸시
4. **module-B**: Railway 프로젝트 생성 + PostgreSQL + 환경변수 (사용자 대시보드 작업)
5. **module-C**: Vercel 프로젝트 생성 + vercel.json + Railway URL 설정 (사용자 대시보드 작업)
6. **E2E 테스트**: 공개 URL에서 로그인/기능 동작 확인

### 6.3 Session Guide

| Session | Modules | Work |
|:-------:|---------|------|
| 1 | A + D | Dockerfile + .dockerignore + application-prod.yml + CorsConfig (코드 작성) |
| 2 | B + C | Railway + Vercel 배포 (대시보드 설정 가이드 + vercel.json) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-05 | Initial design — Docker + Railway + Vercel |
