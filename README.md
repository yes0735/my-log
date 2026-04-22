# MyLog - 독서 기록 플랫폼

나만의 독서 여정을 기록하고, 통계로 되돌아보고, 커뮤니티와 함께 성장하는 독서 플랫폼.

## 주요 기능

### 내 서재
- **4가지 뷰 모드**: 갤러리 / 테이블 / 보드(칸반) / 캘린더
- **드래그 앤 드롭**: 책 순서 변경 (데스크톱 + 모바일 길게 누르기)
- **독서 캘린더**: 월간 달력에서 독서 시작일~완독일을 바(bar)로 시각화
- **태그 & 분야 필터**: 멀티셀렉트 태그(AND) + 알라딘 분야 2-depth 드롭다운
- **URL 상태 유지**: 뷰/필터/월이 URL 쿼리에 영속화 (뒤로가기 시 복원)

### 독서 관리
- **책 검색**: 알라딘 TTB Open API (페이지 수 자동 채우기)
- **독서 상태**: 읽고 싶은 → 읽는 중 → 완독 (시작일/완독일 자동 설정)
- **독서 기록**: 날짜별 읽은 페이지, 메모
- **독후감**: 리치 텍스트 에디터 (Tiptap), 공개/비공개
- **하이라이트**: 페이지 번호 + 인용 + 메모
- **독서 타이머**: 실시간 독서 시간 측정

### 통계 & 목표
- **대시보드**: 완독 권수, 총 페이지, 평균 별점, 월별 독서량 차트
- **연간/월간 통계**: 독서 패턴 분석
- **독서 목표**: 연간/월간 목표 설정 + 달성률 추적

### 커뮤니티
- **타임라인**: 팔로우한 사용자의 독서 활동 피드
- **독서 모임**: 그룹 생성/참가, 토론, 댓글
- **챌린지**: 독서 챌린지 참여 + 랭킹
- **리더보드**: XP 기반 전체 순위
- **배지 시스템**: 독서 성취 배지 (첫 완독, 연속 독서, 리뷰어 등)

### 인증
- 이메일 로그인/회원가입
- OAuth 소셜 로그인 (Google / GitHub / Kakao)

---

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19 | UI 프레임워크 |
| TypeScript | 5.9 | 타입 안정성 |
| Vite | 8 | 번들러 + HMR |
| Tailwind CSS | 4 | 스타일링 |
| React Router | 7 | 라우팅 |
| TanStack Query | 5 | 서버 상태 관리 |
| Zustand | 5 | 클라이언트 상태 관리 |
| @dnd-kit | 6 | 드래그 앤 드롭 |
| date-fns | 3 | 날짜 유틸리티 |
| Tiptap | 3 | 리치 텍스트 에디터 |
| Recharts | 3 | 차트 |

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Spring Boot | 3.4 | 웹 프레임워크 |
| Java | 17 | 런타임 |
| PostgreSQL | - | 데이터베이스 |
| Flyway | 10 | DB 마이그레이션 |
| Spring Security | 6 | 인증/인가 |
| Spring OAuth2 Client | - | 소셜 로그인 |
| JWT (jjwt) | 0.12 | 토큰 인증 |
| SpringDoc OpenAPI | 2.8 | API 문서 |

### 외부 API
| 서비스 | 용도 |
|--------|------|
| 알라딘 TTB Open API | 도서 검색 + 메타데이터 (페이지 수, 분야) |

### 배포
| 서비스 | 용도 |
|--------|------|
| Vercel | 프론트엔드 호스팅 |
| Railway | 백엔드 + PostgreSQL |

---

## 프로젝트 구조

```
my-log/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── components/          # 공용 컴포넌트 (layout, ads)
│   │   ├── features/            # 도메인별 모듈
│   │   │   ├── books/           # 서재 (api, 카드, 캘린더)
│   │   │   │   └── calendar/    # 캘린더 뷰 모듈
│   │   │   ├── records/         # 독서 기록
│   │   │   ├── reviews/         # 독후감
│   │   │   ├── highlight/       # 하이라이트
│   │   │   ├── timer/           # 독서 타이머
│   │   │   ├── stats/           # 통계/목표
│   │   │   ├── gamification/    # 배지/레벨
│   │   │   ├── category/        # 태그 (카테고리)
│   │   │   └── auth/            # 인증
│   │   ├── pages/               # 라우트 페이지
│   │   ├── lib/                 # 유틸리티 (calendar, api, utils)
│   │   ├── stores/              # Zustand 스토어
│   │   └── types/               # TypeScript 타입
│   └── vercel.json              # Vercel 배포 설정
│
├── backend/                     # Spring Boot
│   └── src/main/java/com/mylog/
│       ├── domain/              # 도메인 레이어
│       │   ├── book/            # 책/서재 (entity, dto, service, controller, repository)
│       │   ├── record/          # 독서 기록
│       │   ├── review/          # 독후감
│       │   ├── highlight/       # 하이라이트
│       │   ├── timer/           # 독서 타이머
│       │   ├── stats/           # 통계
│       │   ├── follow/          # 팔로우
│       │   ├── group/           # 독서 모임
│       │   ├── challenge/       # 챌린지
│       │   ├── gamification/    # XP/배지/리더보드
│       │   ├── category/        # 태그 (카테고리)
│       │   └── auth/            # 인증/OAuth
│       ├── infra/
│       │   └── booksearch/      # 알라딘 API 클라이언트
│       └── global/              # 공통 (예외, 보안, 설정)
│
└── docs/                        # PDCA 문서
    ├── 01-plan/features/        # Plan 문서
    ├── 02-design/features/      # Design 문서
    ├── 03-analysis/             # Gap Analysis
    ├── 04-report/features/      # 완료 보고서
    └── archive/                 # 아카이브된 PDCA 문서
```

---

## 로컬 개발 환경 설정

### 사전 요구사항
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- 알라딘 TTB Key ([발급](https://blog.aladin.co.kr/openapi/manage))

### 1. 데이터베이스 설정

```bash
# PostgreSQL에 데이터베이스 생성
createdb mylog
```

### 2. 백엔드 설정

```bash
cd backend

# 알라딘 TTB Key 설정 (application-local.yml)
# src/main/resources/application-local.yml 파일 편집:
# aladin:
#   ttb-key: ttb발급받은키

# 서버 실행 (포트 8081)
./gradlew bootRun
```

> `application-local.yml`은 `.gitignore`에 포함되어 git에 커밋되지 않음.

### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (포트 5173)
npm run dev
```

### 4. 접속

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:8081/api/v1
- API 문서 (Swagger): http://localhost:8081/swagger-ui.html

---

## 환경 변수

### 백엔드 (`application-local.yml`)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `aladin.ttb-key` | 알라딘 TTB API Key | (필수) |
| `spring.datasource.url` | PostgreSQL URL | `jdbc:postgresql://localhost:5432/mylog` |
| `jwt.secret` | JWT 시크릿 키 | 개발용 기본값 |
| OAuth 관련 | Google/GitHub/Kakao Client ID/Secret | placeholder |

### 프로덕션 (Railway 환경변수)

| 변수 | 설명 |
|------|------|
| `ALADIN_TTB_KEY` | 알라딘 TTB API Key |
| `JWT_SECRET` | JWT 시크릿 (256비트 이상) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth |
| `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` | Kakao OAuth |
| `DATABASE_URL` | PostgreSQL 연결 URL |

---

## 빌드

```bash
# 프론트엔드 빌드
cd frontend && npm run build

# 백엔드 빌드
cd backend && ./gradlew build
```

---

## 디자인 원칙

- **노션 스타일 미니멀**: 장식용 이모지/아이콘 최소화, 타이포 중심 hierarchy
- **기능 아이콘**: 사이드바 메뉴 14px + opacity 50% (리니어 스타일)
- **빈 상태**: dashed border box + 텍스트 (이모지 없음)
- **삭제 버튼**: hover 시 `×` 기호
- **데이터 카드**: 큰 숫자 `text-3xl` 중심
- **다크모드**: 완전 지원 (Tailwind dark variant)

---

## 라이선스

Private
