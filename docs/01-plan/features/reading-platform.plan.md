# 독서 기록 및 관리 플랫폼 Planning Document

> **Summary**: 독서 활동을 체계적으로 기록·관리하고, AI 추천·커뮤니티·게이미피케이션으로 독서 경험을 극대화하는 웹 플랫폼
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-01
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 독서 기록이 메모앱, 엑셀, SNS에 분산되어 체계적 관리가 불가능하고, 독서 습관 형성과 커뮤니티 교류를 위한 통합 플랫폼이 부재함 |
| **Solution** | 책 등록/검색, 독서 기록, 독후감, 통계, 커뮤니티(모임/토론/팔로우), 게이미피케이션(레벨/배지/챌린지)을 제공하는 통합 독서 관리 웹 플랫폼 (AI는 추후 고도화) |
| **Function/UX Effect** | 원클릭 책 등록, 직관적 독서 진행률 추적, AI 맞춤 추천, 독서 통계 시각화, 독서 모임/토론 참여로 몰입감 있는 독서 생활 지원 |
| **Core Value** | "읽고, 기록하고, 성장하는" — 개인 독서 데이터의 축적과 커뮤니티 교류를 통한 지속적 독서 습관 형성 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 독서 기록의 분산과 독서 습관 형성의 어려움을 해결 |
| **WHO** | 독서를 즐기고 기록·공유하고 싶은 개인 사용자 (20~40대, 월 1권 이상 독서) |
| **RISK** | 외부 도서 API 의존성, 초기 커뮤니티 활성화, FE/BE 분리 배포 복잡도 |
| **SUCCESS** | 책 등록→기록→통계 플로우 완성, 커뮤니티 기본 기능 작동, 게이미피케이션 레벨/배지 시스템 작동 |
| **SCOPE** | Phase 1: 핵심(책/기록/통계) → Phase 2: 커뮤니티/게이미피케이션 → Phase 3: AI 고도화(비용 발생, 추후) |

---

## 1. Overview

### 1.1 Purpose

독서 활동(읽기 시작, 진행률, 완독, 메모, 독후감)을 하나의 플랫폼에서 체계적으로 기록하고, 독서 데이터를 기반으로 AI 추천과 통계를 제공하며, 커뮤니티를 통해 독서 경험을 공유하고 게이미피케이션으로 독서 습관을 강화하는 웹 플랫폼을 구축한다.

### 1.2 Background

- 기존 독서 기록 방식(메모앱, SNS, 엑셀)은 데이터가 분산되어 통합 관리와 분석이 불가능
- 기존 독서 앱들은 기록 기능만 제공하거나, 커뮤니티와 AI를 통합하지 못함
- 독서 습관 형성에는 진행 추적, 목표 설정, 사회적 동기부여가 핵심

### 1.3 Related Documents

- Design: `docs/02-design/features/reading-platform.design.md` (예정)
- Analysis: `docs/03-analysis/reading-platform.analysis.md` (예정)

---

## 2. Scope

### 2.1 In Scope

**Phase 1 — 핵심 기능 (MVP+)** ⚡ 비용 무료
- [ ] 회원가입/로그인 (소셜 로그인: Google, GitHub, Kakao — 무료)
- [ ] 책 등록 (ISBN 검색 via 알라딘/네이버 API 무료 티어, 수동 입력)
- [ ] 독서 상태 관리 (읽고 싶은/읽는 중/완독)
- [ ] 독서 기록 (시작일, 종료일, 현재 페이지, 진행률)
- [ ] 독후감 작성 (마크다운 에디터)
- [ ] 별점 평가 (0.5단위, 5점 만점)
- [ ] 카테고리/태그 분류
- [ ] 독서 통계 (월별/연별 독서량, 장르 분포, 페이지 수)
- [ ] 독서 목표 설정 (연간/월간 목표 권수)
- [ ] 내 서재 (책장 뷰 — 표지는 외부 URL 링크 사용)

**Phase 2 — 커뮤니티 & 게이미피케이션** ⚡ 비용 무료
- [ ] 사용자 프로필 및 팔로우/팔로잉
- [ ] 독서 모임 생성/참여
- [ ] 모임 내 토론 게시판 (글/댓글)
- [ ] 리뷰/독후감 공개 공유
- [ ] 타임라인 피드 (팔로우한 사용자의 독서 활동)
- [ ] 독서 레벨 시스템 (XP 기반)
- [ ] 배지/업적 시스템 (첫 완독, 연속 7일 독서 등)
- [ ] 독서 챌린지 (기간별 목표, 참가자 경쟁)
- [ ] 리더보드 (주간/월간 랭킹)
- [ ] 하이라이트/인용구 관리
- [ ] 독서 타이머 (세션별 독서 시간 기록)
- [ ] 알림 시스템 (목표 리마인더, 모임 알림)

**Phase 3 — 고도화 (추후 예정, 비용 발생)** 💰
- [ ] AI 책 추천 (독서 이력 기반) — LLM API 비용
- [ ] AI 독후감 요약/분석 — LLM API 비용
- [ ] AI 독서 패턴 분석 (선호 장르, 독서 속도 트렌드) — LLM API 비용
- [ ] 이미지 직접 업로드 (표지 사진 등) — 스토리지 비용

### 2.2 Out of Scope

- 전자책 리더기 (ePub/PDF 뷰어)
- 오프라인 서점/도서관 연동
- 결제/과금 시스템
- 네이티브 모바일 앱 (반응형 웹으로 대체)
- 다국어 지원 (한국어 우선, 추후 확장)
- AI 기능 전체 (Phase 3 고도화로 이동)
- 이미지 직접 업로드 (Phase 3 고도화로 이동)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Phase | Status |
|----|-------------|----------|-------|--------|
| FR-01 | 이메일/소셜(Google, GitHub, Kakao) 회원가입 및 로그인 | High | 1 | Pending |
| FR-02 | ISBN 바코드/번호로 책 검색 및 자동 정보 입력 (알라딘/네이버 도서 API) | High | 1 | Pending |
| FR-03 | 수동 책 등록 (제목, 저자, 출판사, 페이지수, 표지 이미지) | High | 1 | Pending |
| FR-04 | 독서 상태 변경 (읽고 싶은 → 읽는 중 → 완독) | High | 1 | Pending |
| FR-05 | 독서 기록 입력 (날짜, 읽은 페이지, 메모) | High | 1 | Pending |
| FR-06 | 독후감 작성/수정/삭제 (마크다운 지원) | High | 1 | Pending |
| FR-07 | 별점 평가 (0.5단위) | Medium | 1 | Pending |
| FR-08 | 카테고리/태그 생성 및 책에 할당 | Medium | 1 | Pending |
| FR-09 | 독서 통계 대시보드 (월별/연별 차트) | High | 1 | Pending |
| FR-10 | 독서 목표 설정 및 진행률 추적 | Medium | 1 | Pending |
| FR-11 | 내 서재 뷰 (그리드/리스트 전환) | Medium | 1 | Pending |
| FR-12 | 사용자 프로필 및 팔로우/팔로잉 | High | 2 | Pending |
| FR-13 | 독서 모임 CRUD 및 참가/탈퇴 | High | 2 | Pending |
| FR-14 | 모임 내 토론 게시판 (글/댓글) | Medium | 2 | Pending |
| FR-15 | 독후감 공개 공유 및 타임라인 피드 | Medium | 2 | Pending |
| FR-16 | 독서 레벨/XP 시스템 | Medium | 2 | Pending |
| FR-17 | 배지/업적 시스템 (자동 달성 감지) | Medium | 2 | Pending |
| FR-18 | 독서 챌린지 (생성/참가/진행/완료) | Medium | 2 | Pending |
| FR-19 | 리더보드 (주간/월간 랭킹) | Low | 2 | Pending |
| FR-20 | 하이라이트/인용구 저장 및 관리 | Low | 2 | Pending |
| FR-21 | 독서 타이머 (세션별 독서 시간 기록) | Low | 2 | Pending |
| FR-22 | 알림 시스템 (목표 리마인더, 모임 알림) | Low | 2 | Pending |
| FR-23 | AI 기반 맞춤 책 추천 | High | 3 (고도화) | Deferred 💰 |
| FR-24 | AI 독후감 요약 및 핵심 인사이트 추출 | Medium | 3 (고도화) | Deferred 💰 |
| FR-25 | AI 독서 패턴 분석 리포트 | Medium | 3 (고도화) | Deferred 💰 |
| FR-26 | 이미지 직접 업로드 (표지 사진) | Low | 3 (고도화) | Deferred 💰 |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 페이지 로딩 < 2s, API 응답 < 500ms | Lighthouse, Spring Actuator |
| Security | Spring Security JWT, CSRF 보호, SQL Injection 방지 (JPA) | OWASP 체크리스트 |
| Accessibility | WCAG 2.1 AA 준수 (키보드 네비게이션, 스크린리더) | axe-core 자동 검사 |
| Scalability | 동시 사용자 1,000명 처리 | Spring Boot + HikariCP 커넥션 풀 |
| SEO | react-helmet 메타태그, OG 이미지, 크롤러 대응 | Google Search Console |
| Responsiveness | 모바일/태블릿/데스크톱 반응형 | Chrome DevTools |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Phase 1 전체 기능 요구사항(FR-01~FR-11) 구현 완료
- [ ] 책 등록 → 독서 기록 → 독후감 → 통계 확인 E2E 플로우 동작
- [ ] 회원가입/로그인 플로우 정상 동작
- [ ] 독서 통계 차트가 실제 데이터 반영
- [ ] 모바일/데스크톱 반응형 레이아웃 동작
- [ ] Phase 2 AI 추천 및 커뮤니티 기본 기능 동작
- [ ] Phase 3 게이미피케이션 레벨/배지 시스템 동작

### 4.2 Quality Criteria

- [ ] TypeScript strict mode, 타입 에러 0건 (Frontend)
- [ ] ESLint/Prettier 위반 0건 (Frontend)
- [ ] Checkstyle 위반 0건 (Backend)
- [ ] Lighthouse Performance 점수 > 80
- [ ] 빌드 성공 (FE: `vite build`, BE: `./gradlew build` 에러 없음)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 외부 도서 API 장애/제한 | High | Medium | 알라딘 + 네이버 API 이중화, 수동 입력 폴백, 검색 결과 캐싱 |
| AI API 비용 증가 | High | Medium | AI Gateway 비용 추적, 요청 제한(일 50회/사용자), 캐싱 |
| 초기 커뮤니티 활성화 부족 | Medium | High | 챌린지/배지로 참여 유도, 시드 콘텐츠 준비 |
| JPA 엔티티 복잡도 | Medium | Medium | 도메인별 엔티티 분리, Flyway 마이그레이션 관리 |
| 이미지 스토리지 비용 | Low | Medium | S3/Cloudinary 사용, 이미지 리사이징, 용량 제한 |
| 프론트/백엔드 분리 배포 | Medium | Low | CORS 설정, API 버전 관리, 환경별 URL 분리 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| 전체 프로젝트 | New Project | 신규 프로젝트이므로 기존 리소스 영향 없음 |

### 6.2 Current Consumers

신규 프로젝트이므로 기존 소비자 없음.

### 6.3 Verification

- [x] 신규 프로젝트 — 기존 영향도 없음

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites, portfolios | ☐ |
| **Dynamic** | Feature-based modules, BaaS/DB integration | Web apps with backend, SaaS MVPs | ☑ |
| **Enterprise** | Strict layer separation, microservices | High-traffic systems | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| **Frontend** | Next.js / React / Vue | **React (Vite)** | 사용자 지정, SPA 아키텍처, 빠른 빌드 |
| **Backend** | Spring Boot / Express / NestJS | **Java Spring Boot 3** | 사용자 지정, 안정적 엔터프라이즈 프레임워크, 강력한 생태계 |
| ORM | JPA / MyBatis / jOOQ | **Spring Data JPA + Hibernate** | Spring Boot 표준, 관계형 매핑 용이, QueryDSL 확장 |
| Database | PostgreSQL / MySQL / MongoDB | **PostgreSQL** | 관계형 데이터 구조에 적합, JSON 지원, 확장성 |
| Authentication | Spring Security / Keycloak | **Spring Security + JWT + OAuth2** | Spring 생태계 통합, 소셜 로그인 지원 |
| State Management | Context / Zustand / Redux | **Zustand** | 경량, 간단한 API, 서버 상태는 TanStack Query로 분리 |
| API Client | fetch / axios / react-query | **TanStack Query + Axios** | 캐싱, 재시도, 낙관적 업데이트, Axios 인터셉터 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS + shadcn/ui** | 빠른 개발, 일관된 디자인 시스템 |
| Charts | Chart.js / Recharts / Nivo | **Recharts** | React 네이티브, 가벼움, 커스터마이징 용이 |
| AI Integration | Spring AI / OpenAI SDK | **Spring AI** (Phase 3 고도화) | 비용 발생으로 추후 구현 예정 |
| Markdown Editor | MDX / Tiptap / Milkdown | **Tiptap** | WYSIWYG + 마크다운 전환, 확장성 |
| Build Tool (FE) | Webpack / Vite | **Vite** | 빠른 HMR, 간단한 설정, 플러그인 생태계 |
| Testing (FE) | Jest / Vitest / Playwright | **Vitest + Playwright** | 빠른 유닛 테스트 + E2E |
| Testing (BE) | JUnit / TestContainers | **JUnit 5 + Mockito + TestContainers** | Spring Boot 표준, 통합 테스트 |
| API Docs | Swagger / SpringDoc | **SpringDoc OpenAPI** | 자동 API 문서화, Swagger UI |
| Deployment (FE) | Vercel / Netlify / S3 | **Vercel** | SPA 배포 최적화, Preview URL |
| Deployment (BE) | AWS EC2 / Railway / Render | **Railway** (추천) | 간편한 Spring Boot 배포, PostgreSQL 포함, 무료 티어 |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic (Frontend + Backend 분리)

─── Frontend (React + Vite) ─────────────────────────
┌─────────────────────────────────────────────────────┐
│ my-log-frontend/                                    │
│ ├── src/                                            │
│ │   ├── components/         # 공통 UI 컴포넌트       │
│ │   │   ├── ui/             # shadcn/ui             │
│ │   │   ├── books/          # 책 관련 컴포넌트       │
│ │   │   ├── records/        # 기록 관련 컴포넌트     │
│ │   │   ├── charts/         # 차트 컴포넌트         │
│ │   │   └── layout/         # 레이아웃 컴포넌트      │
│ │   ├── features/           # 기능별 모듈            │
│ │   │   ├── auth/           # 인증 (로그인/회원가입)  │
│ │   │   ├── books/          # 책 관리 로직          │
│ │   │   ├── records/        # 독서 기록 로직        │
│ │   │   ├── reviews/        # 독후감 로직           │
│ │   │   ├── stats/          # 통계/대시보드 로직     │
│ │   │   ├── ai/             # AI 기능               │
│ │   │   ├── community/      # 커뮤니티 로직         │
│ │   │   └── gamification/   # 게이미피케이션 로직    │
│ │   ├── hooks/              # 커스텀 React 훅       │
│ │   ├── lib/                # API 클라이언트, 유틸   │
│ │   │   ├── api.ts          # Axios 인스턴스        │
│ │   │   ├── auth.ts         # 토큰 관리             │
│ │   │   └── utils.ts        # 공통 유틸             │
│ │   ├── pages/              # React Router 페이지    │
│ │   ├── stores/             # Zustand 스토어        │
│ │   ├── types/              # TypeScript 타입 정의   │
│ │   ├── App.tsx             # 라우팅 설정            │
│ │   └── main.tsx            # 엔트리포인트           │
│ ├── public/                 # 정적 파일             │
│ └── index.html                                      │
└─────────────────────────────────────────────────────┘

─── Backend (Java Spring Boot 3) ────────────────────
┌─────────────────────────────────────────────────────┐
│ my-log-backend/                                     │
│ ├── src/main/java/com/mylog/                        │
│ │   ├── config/             # Spring 설정            │
│ │   │   ├── SecurityConfig  # Spring Security + JWT  │
│ │   │   ├── CorsConfig      # CORS 설정             │
│ │   │   └── SwaggerConfig   # OpenAPI 설정           │
│ │   ├── domain/             # 엔티티 + 리포지토리     │
│ │   │   ├── book/           # Book 엔티티            │
│ │   │   ├── record/         # ReadingRecord 엔티티   │
│ │   │   ├── review/         # Review 엔티티          │
│ │   │   ├── user/           # User 엔티티            │
│ │   │   ├── community/      # Group, Discussion      │
│ │   │   └── gamification/   # Level, Badge, Challenge│
│ │   ├── service/            # 비즈니스 로직           │
│ │   ├── controller/         # REST API 컨트롤러      │
│ │   ├── dto/                # 요청/응답 DTO          │
│ │   ├── exception/          # 예외 처리              │
│ │   └── util/               # 유틸리티               │
│ ├── src/main/resources/                              │
│ │   ├── application.yml     # 설정 파일              │
│ │   └── db/migration/       # Flyway 마이그레이션    │
│ └── src/test/               # 테스트                 │
└─────────────────────────────────────────────────────┘
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [ ] `CLAUDE.md` — 생성 예정
- [ ] ESLint — Frontend (Vite 기본 설정)
- [ ] Prettier — Frontend 프로젝트 루트에 설정
- [ ] TypeScript — Frontend strict mode
- [ ] Checkstyle — Backend 코드 스타일 검사
- [ ] Spring Boot application.yml — Backend 설정

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming (FE)** | Missing | 컴포넌트: PascalCase, 파일: kebab-case, 훅: use* | High |
| **Naming (BE)** | Missing | 클래스: PascalCase, 메서드: camelCase, DB 컬럼: snake_case | High |
| **Folder structure** | Missing | FE/BE 분리 구조 (위 7.3 참조) | High |
| **Import order (FE)** | Missing | React → 외부 → 내부 → 타입 → 스타일 | Medium |
| **Environment variables** | Missing | FE: `.env` (VITE_ prefix), BE: `application.yml` | Medium |
| **Error handling** | Missing | FE: Error Boundary + toast, BE: @RestControllerAdvice + 커스텀 예외 | Medium |
| **API 규칙** | Missing | REST 명명: `/api/v1/{resource}`, 응답 형식 통일 | High |

### 8.3 Environment Variables Needed

**Backend (application.yml)**

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `SPRING_DATASOURCE_URL` | PostgreSQL 연결 URL | Server | ☑ |
| `SPRING_DATASOURCE_USERNAME` | DB 사용자명 | Server | ☑ |
| `SPRING_DATASOURCE_PASSWORD` | DB 비밀번호 | Server | ☑ |
| `JWT_SECRET` | JWT 토큰 서명 키 | Server | ☑ |
| `JWT_EXPIRATION` | JWT 만료 시간 | Server | ☑ |
| `GOOGLE_CLIENT_ID` | Google OAuth | Server | ☑ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Server | ☑ |
| `GITHUB_CLIENT_ID` | GitHub OAuth | Server | ☑ |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | Server | ☑ |
| `KAKAO_CLIENT_ID` | Kakao OAuth | Server | ☑ |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth Secret | Server | ☑ |
| `ALADIN_API_KEY` | 알라딘 도서 API | Server | ☑ |
| `NAVER_CLIENT_ID` | 네이버 도서 검색 API | Server | ☑ |
| `NAVER_CLIENT_SECRET` | 네이버 API Secret | Server | ☑ |
| `CORS_ALLOWED_ORIGINS` | 프론트엔드 URL 허용 | Server | ☑ |
| `OPENAI_API_KEY` | AI 기능 (Phase 3 고도화) | Server | ☐ (추후) |

**Frontend (.env)**

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `VITE_API_URL` | 백엔드 API URL | Client | ☑ |
| `VITE_APP_URL` | 프론트엔드 URL | Client | ☑ |

### 8.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 1 (Schema) | ☐ | `docs/01-plan/schema.md` | `/phase-1-schema` |
| Phase 2 (Convention) | ☐ | `docs/01-plan/conventions.md` | `/phase-2-convention` |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design reading-platform`)
2. [ ] DB 스키마 설계 (Prisma schema)
3. [ ] Phase 1 구현 시작
4. [ ] Gap Analysis 수행 (`/pdca analyze reading-platform`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-01 | Initial draft — 풀 기능 범위 (3 Phase) 정의 | kyungheelee |
| 0.2 | 2026-04-01 | 기술 스택 변경: Java Spring Boot(BE) + React Vite(FE) 분리 아키텍처 | kyungheelee |
| 0.3 | 2026-04-01 | AI 기능(비용 발생)을 Phase 3 고도화로 이동, Phase 재구성 | kyungheelee |
