# 독서 기록 및 관리 플랫폼 Design Document

> **Summary**: React(Vite) + Spring Boot 3 분리 아키텍처 기반 독서 기록·관리·커뮤니티·게이미피케이션 플랫폼
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-01
> **Status**: Draft
> **Planning Doc**: [reading-platform.plan.md](../../01-plan/features/reading-platform.plan.md)

### Pipeline References

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A |
| Phase 2 | Coding Conventions | N/A |
| Phase 3 | Mockup | N/A |
| Phase 4 | API Spec | Included below (§4) |

---

## Context Anchor

> Copied from Plan document.

| Key | Value |
|-----|-------|
| **WHY** | 독서 기록의 분산과 독서 습관 형성의 어려움을 해결 |
| **WHO** | 독서를 즐기고 기록·공유하고 싶은 개인 사용자 (20~40대, 월 1권 이상 독서) |
| **RISK** | 외부 도서 API 의존성, 초기 커뮤니티 활성화, FE/BE 분리 배포 복잡도 |
| **SUCCESS** | 책 등록→기록→통계 플로우 완성, 커뮤니티 기본 기능 작동, 게이미피케이션 레벨/배지 시스템 작동 |
| **SCOPE** | Phase 1: 핵심(책/기록/통계) → Phase 2: 커뮤니티/게이미피케이션 → Phase 3: AI 고도화(추후) |

---

## 1. Overview

### 1.1 Design Goals

- FE/BE 완전 분리: 독립 개발·배포·스케일링 가능
- 도메인별 응집: 각 도메인(book, record, review, user)이 자체 Entity+Repo+Service+Controller+DTO 보유
- Phase별 점진적 확장: Phase 1 구조가 Phase 2/3 추가에 자연스럽게 확장
- 외부 API 추상화: 도서 검색 API를 infra 계층에 격리, 프로바이더 교체 용이

### 1.2 Design Principles

- **도메인 응집**: 관련 코드를 도메인 패키지 안에 모아 변경 영향 최소화
- **의존성 방향**: Controller → Service → Repository 단방향, 순환 의존 금지
- **외부 격리**: 외부 API(알라딘/네이버)는 infra 패키지에 격리, 인터페이스로 추상화
- **API 우선**: Backend API 설계 먼저 → Frontend는 API 계약에 맞춰 구현

---

## 2. Architecture Options (v1.7.0)

### 2.0 Architecture Comparison

| Criteria | Option A: 미니멀 | Option B: 클린(DDD) | Option C: 실용적 균형 |
|----------|:-:|:-:|:-:|
| **Approach** | Flat 구조, 빠른 셋업 | Hexagonal, 완벽 분리 | 도메인별 패키지 + 계층형 |
| **New Files (Phase 1)** | ~40 | ~80 | ~55 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Low (coupled) | Low (clean) | Low (balanced) |
| **Recommendation** | 프로토타입 | 대규모 시스템 | **기본 선택** |

**Selected**: Option C — **Rationale**: 도메인별 응집력과 실용적 개발 속도의 균형. Phase 2/3 확장 시에도 도메인 패키지 추가로 자연스럽게 대응 가능.

### 2.1 Component Diagram

```
┌─────────────────────┐          ┌──────────────────────────────────┐
│   Frontend (React)  │          │     Backend (Spring Boot 3)      │
│   Vercel SPA        │  REST    │     Railway / Local              │
│                     │ ──────▶  │                                  │
│  ┌───────────────┐  │  JSON    │  ┌────────┐  ┌─────────┐       │
│  │ React Router  │  │ ◀──────  │  │Controller│→│ Service │       │
│  │ TanStack Query│  │          │  └────────┘  └────┬────┘       │
│  │ Zustand       │  │          │                   │             │
│  │ shadcn/ui     │  │          │            ┌──────▼──────┐     │
│  └───────────────┘  │          │            │ Repository  │     │
│                     │          │            └──────┬──────┘     │
└─────────────────────┘          │            ┌──────▼──────┐     │
                                 │            │ PostgreSQL  │     │
                                 │            └─────────────┘     │
                                 │                                │
                                 │  ┌─────────────────────┐       │
                                 │  │ infra/               │       │
                                 │  │  BookSearchClient    │       │
                                 │  │  (알라딘/네이버 API)  │       │
                                 │  └─────────────────────┘       │
                                 └──────────────────────────────────┘
```

### 2.2 Data Flow

```
[사용자 입력] → [React Component] → [TanStack Query / Axios]
    → [Spring Controller] → [Validation] → [Service]
    → [Repository / JPA] → [PostgreSQL]
    → [Response DTO] → [JSON] → [React State Update] → [UI 렌더링]
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Frontend | Backend REST API | 데이터 CRUD, 인증 |
| Backend | PostgreSQL | 데이터 영속화 |
| Backend (infra) | 알라딘 API, 네이버 API | 도서 검색 |
| Frontend | Vercel | SPA 호스팅 |
| Backend | Railway (or Docker) | 서버 호스팅 |

---

## 3. Data Model

### 3.1 Entity Definition

```java
// ===== Phase 1 Entities =====

// User (사용자)
@Entity
public class User {
    Long id;                    // PK
    String email;               // 이메일 (unique)
    String password;            // 암호화된 비밀번호 (nullable - 소셜 로그인)
    String nickname;            // 닉네임
    String profileImageUrl;     // 프로필 이미지 URL
    String provider;            // LOCAL / GOOGLE / GITHUB / KAKAO
    String providerId;          // 소셜 로그인 provider ID
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

// Book (책)
@Entity
public class Book {
    Long id;                    // PK
    String isbn;                // ISBN (nullable, unique if present)
    String title;               // 제목
    String author;              // 저자
    String publisher;           // 출판사
    String coverImageUrl;       // 표지 이미지 URL (외부 링크)
    Integer totalPages;         // 총 페이지 수
    String description;         // 책 소개
    LocalDate publishedDate;    // 출판일
    Long createdByUserId;       // 등록한 사용자 (FK)
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

// UserBook (사용자-책 연결 = 내 서재)
@Entity
public class UserBook {
    Long id;                    // PK
    Long userId;                // FK → User
    Long bookId;                // FK → Book
    ReadingStatus status;       // WANT_TO_READ / READING / COMPLETED
    Double rating;              // 별점 (0.5~5.0, nullable)
    Integer currentPage;        // 현재 읽은 페이지
    LocalDate startDate;        // 읽기 시작일
    LocalDate endDate;          // 완독일
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

enum ReadingStatus {
    WANT_TO_READ, READING, COMPLETED
}

// ReadingRecord (독서 기록 — 날짜별)
@Entity
public class ReadingRecord {
    Long id;                    // PK
    Long userBookId;            // FK → UserBook
    LocalDate readDate;         // 독서 날짜
    Integer pagesRead;          // 읽은 페이지 수
    Integer fromPage;           // 시작 페이지
    Integer toPage;             // 종료 페이지
    String memo;                // 짧은 메모
    LocalDateTime createdAt;
}

// Review (독후감)
@Entity
public class Review {
    Long id;                    // PK
    Long userBookId;            // FK → UserBook
    Long userId;                // FK → User (빠른 조회용)
    String title;               // 독후감 제목
    String content;             // 마크다운 본문
    Boolean isPublic;           // 공개 여부
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

// Category (카테고리)
@Entity
public class Category {
    Long id;
    Long userId;                // FK → User (사용자별 카테고리)
    String name;                // 카테고리명
    String color;               // 표시 색상 (hex)
}

// Tag (태그)
@Entity
public class Tag {
    Long id;
    Long userId;                // FK → User
    String name;                // 태그명
}

// BookTag (책-태그 연결)
@Entity
public class BookTag {
    Long id;
    Long userBookId;            // FK → UserBook
    Long tagId;                 // FK → Tag
}

// BookCategory (책-카테고리 연결)
@Entity
public class BookCategory {
    Long id;
    Long userBookId;            // FK → UserBook
    Long categoryId;            // FK → Category
}

// ReadingGoal (독서 목표)
@Entity
public class ReadingGoal {
    Long id;
    Long userId;                // FK → User
    Integer targetYear;         // 목표 연도
    Integer targetMonth;        // 목표 월 (nullable → 연간 목표)
    Integer targetBooks;        // 목표 권수
    Integer completedBooks;     // 달성 권수 (비정규화, 조회 성능)
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

// ===== Phase 2 Entities (커뮤니티/게이미피케이션) =====

// Follow (팔로우)
@Entity
public class Follow {
    Long id;
    Long followerId;            // FK → User
    Long followingId;           // FK → User
    LocalDateTime createdAt;
}

// ReadingGroup (독서 모임)
@Entity
public class ReadingGroup {
    Long id;
    String name;                // 모임 이름
    String description;         // 모임 소개
    Long creatorId;             // FK → User (방장)
    Integer maxMembers;         // 최대 인원
    Boolean isPublic;           // 공개 여부
    LocalDateTime createdAt;
}

// GroupMember (모임 멤버)
@Entity
public class GroupMember {
    Long id;
    Long groupId;               // FK → ReadingGroup
    Long userId;                // FK → User
    GroupRole role;              // CREATOR / ADMIN / MEMBER
    LocalDateTime joinedAt;
}

// Discussion (토론 게시글)
@Entity
public class Discussion {
    Long id;
    Long groupId;               // FK → ReadingGroup
    Long userId;                // FK → User
    String title;
    String content;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

// Comment (댓글)
@Entity
public class Comment {
    Long id;
    Long discussionId;          // FK → Discussion
    Long userId;                // FK → User
    String content;
    Long parentId;              // FK → Comment (대댓글, nullable)
    LocalDateTime createdAt;
}

// UserLevel (사용자 레벨)
@Entity
public class UserLevel {
    Long id;
    Long userId;                // FK → User (unique)
    Integer level;              // 현재 레벨
    Integer totalXp;            // 총 경험치
    Integer currentLevelXp;     // 현재 레벨 내 경험치
    Integer nextLevelXp;        // 다음 레벨까지 필요 경험치
}

// Badge (배지 정의)
@Entity
public class Badge {
    Long id;
    String code;                // FIRST_COMPLETE, WEEK_STREAK_7 등
    String name;                // 배지 이름
    String description;         // 달성 조건 설명
    String iconUrl;             // 배지 아이콘
    Integer xpReward;           // 보상 XP
}

// UserBadge (사용자 배지 획득)
@Entity
public class UserBadge {
    Long id;
    Long userId;                // FK → User
    Long badgeId;               // FK → Badge
    LocalDateTime earnedAt;     // 획득 일시
}

// Challenge (독서 챌린지)
@Entity
public class Challenge {
    Long id;
    String title;               // 챌린지 제목
    String description;         // 설명
    Long creatorId;             // FK → User
    Integer targetBooks;        // 목표 권수
    LocalDate startDate;
    LocalDate endDate;
    LocalDateTime createdAt;
}

// ChallengeParticipant (챌린지 참가자)
@Entity
public class ChallengeParticipant {
    Long id;
    Long challengeId;           // FK → Challenge
    Long userId;                // FK → User
    Integer completedBooks;     // 달성 권수
    LocalDateTime joinedAt;
}

// Highlight (하이라이트/인용구)
@Entity
public class Highlight {
    Long id;
    Long userBookId;            // FK → UserBook
    Integer pageNumber;         // 페이지 번호
    String content;             // 인용구/하이라이트 텍스트
    String memo;                // 메모
    LocalDateTime createdAt;
}

// ReadingSession (독서 타이머 세션)
@Entity
public class ReadingSession {
    Long id;
    Long userBookId;            // FK → UserBook
    LocalDateTime startTime;    // 시작 시간
    LocalDateTime endTime;      // 종료 시간
    Integer durationMinutes;    // 독서 시간(분)
    Integer pagesRead;          // 읽은 페이지
}
```

### 3.2 Entity Relationships

```
[User] 1 ──── N [UserBook] N ──── 1 [Book]
  │                │
  │                ├── 1 ──── N [ReadingRecord]
  │                ├── 1 ──── N [Review]
  │                ├── N ──── N [Tag]       (via BookTag)
  │                ├── N ──── N [Category]  (via BookCategory)
  │                ├── 1 ──── N [Highlight]
  │                └── 1 ──── N [ReadingSession]
  │
  ├── 1 ──── N [ReadingGoal]
  ├── 1 ──── 1 [UserLevel]
  ├── 1 ──── N [UserBadge] N ──── 1 [Badge]
  ├── N ──── N [User]       (via Follow)
  ├── 1 ──── N [ReadingGroup] (as creator)
  ├── N ──── N [ReadingGroup] (via GroupMember)
  ├── 1 ──── N [Discussion]
  ├── 1 ──── N [Comment]
  ├── 1 ──── N [Challenge] (as creator)
  └── N ──── N [Challenge] (via ChallengeParticipant)
```

### 3.3 Database Schema

```sql
-- Phase 1 핵심 테이블

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    nickname VARCHAR(50) NOT NULL,
    profile_image_url VARCHAR(500),
    provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    provider_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE books (
    id BIGSERIAL PRIMARY KEY,
    isbn VARCHAR(13) UNIQUE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    cover_image_url VARCHAR(500),
    total_pages INTEGER,
    description TEXT,
    published_date DATE,
    created_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_books (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id),
    status VARCHAR(20) NOT NULL DEFAULT 'WANT_TO_READ',
    rating DECIMAL(2,1) CHECK (rating >= 0.5 AND rating <= 5.0),
    current_page INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

CREATE TABLE reading_records (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    read_date DATE NOT NULL,
    pages_read INTEGER NOT NULL,
    from_page INTEGER,
    to_page INTEGER,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1'
);

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    UNIQUE(user_id, name)
);

CREATE TABLE book_tags (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(user_book_id, tag_id)
);

CREATE TABLE book_categories (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(user_book_id, category_id)
);

CREATE TABLE reading_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_year INTEGER NOT NULL,
    target_month INTEGER,
    target_books INTEGER NOT NULL,
    completed_books INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase 2 커뮤니티/게이미피케이션 테이블

CREATE TABLE follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

CREATE TABLE reading_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    creator_id BIGINT NOT NULL REFERENCES users(id),
    max_members INTEGER DEFAULT 50,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE discussions (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES reading_groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    discussion_id BIGINT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_levels (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    current_level_xp INTEGER DEFAULT 0,
    next_level_xp INTEGER DEFAULT 100
);

CREATE TABLE badges (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NOT NULL,
    icon_url VARCHAR(500),
    xp_reward INTEGER DEFAULT 10
);

CREATE TABLE user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id BIGINT NOT NULL REFERENCES badges(id),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE challenges (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id BIGINT NOT NULL REFERENCES users(id),
    target_books INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE challenge_participants (
    id BIGSERIAL PRIMARY KEY,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_books INTEGER DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

CREATE TABLE highlights (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    page_number INTEGER,
    content TEXT NOT NULL,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reading_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    pages_read INTEGER
);

-- 인덱스
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_status ON user_books(user_id, status);
CREATE INDEX idx_reading_records_user_book ON reading_records(user_book_id);
CREATE INDEX idx_reading_records_date ON reading_records(read_date);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_public ON reviews(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_discussions_group ON discussions(group_id);
CREATE INDEX idx_books_isbn ON books(isbn);
```

---

## 4. API Specification

### 4.1 공통 규칙

- Base URL: `/api/v1`
- 인증: `Authorization: Bearer {JWT}`
- 응답 형식:

```json
// 성공 (단일)
{ "data": { ... } }

// 성공 (목록)
{ "data": [...], "pagination": { "page": 1, "size": 20, "total": 100, "totalPages": 5 } }

// 에러
{ "error": { "code": "ERROR_CODE", "message": "사용자 메시지", "details": {} } }
```

### 4.2 Phase 1 API Endpoints

#### Auth (인증)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/signup` | 이메일 회원가입 | - |
| POST | `/api/v1/auth/login` | 이메일 로그인 → JWT 반환 | - |
| POST | `/api/v1/auth/oauth/{provider}` | 소셜 로그인 (google/github/kakao) | - |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 | Refresh Token |
| GET | `/api/v1/auth/me` | 내 정보 조회 | Required |

#### Books (책)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/books/search?q={query}` | 도서 검색 (알라딘/네이버 API) | Required |
| POST | `/api/v1/books` | 책 수동 등록 | Required |
| GET | `/api/v1/books/{id}` | 책 상세 조회 | Required |

#### UserBooks (내 서재)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/books?status={status}&page={p}` | 내 서재 목록 (필터: 상태/카테고리/태그) | Required |
| POST | `/api/v1/my/books` | 내 서재에 책 추가 | Required |
| GET | `/api/v1/my/books/{id}` | 내 서재 책 상세 (기록/리뷰 포함) | Required |
| PATCH | `/api/v1/my/books/{id}` | 상태/별점/페이지 수정 | Required |
| DELETE | `/api/v1/my/books/{id}` | 내 서재에서 책 제거 | Required |

#### ReadingRecords (독서 기록)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/books/{bookId}/records` | 독서 기록 목록 | Required |
| POST | `/api/v1/my/books/{bookId}/records` | 독서 기록 추가 | Required |
| PUT | `/api/v1/my/books/{bookId}/records/{id}` | 독서 기록 수정 | Required |
| DELETE | `/api/v1/my/books/{bookId}/records/{id}` | 독서 기록 삭제 | Required |

#### Reviews (독후감)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/books/{bookId}/reviews` | 내 독후감 목록 | Required |
| POST | `/api/v1/my/books/{bookId}/reviews` | 독후감 작성 | Required |
| PUT | `/api/v1/reviews/{id}` | 독후감 수정 | Required |
| DELETE | `/api/v1/reviews/{id}` | 독후감 삭제 | Required |
| GET | `/api/v1/reviews/public?page={p}` | 공개 독후감 피드 | Optional |

#### Categories & Tags (분류)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/categories` | 내 카테고리 목록 | Required |
| POST | `/api/v1/my/categories` | 카테고리 생성 | Required |
| PUT | `/api/v1/my/categories/{id}` | 카테고리 수정 | Required |
| DELETE | `/api/v1/my/categories/{id}` | 카테고리 삭제 | Required |
| GET | `/api/v1/my/tags` | 내 태그 목록 | Required |
| POST | `/api/v1/my/tags` | 태그 생성 | Required |
| DELETE | `/api/v1/my/tags/{id}` | 태그 삭제 | Required |

#### Stats (통계)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/stats/summary` | 전체 통계 요약 | Required |
| GET | `/api/v1/my/stats/monthly?year={y}` | 월별 독서량 (차트 데이터) | Required |
| GET | `/api/v1/my/stats/genres` | 장르 분포 (파이 차트) | Required |
| GET | `/api/v1/my/stats/yearly?year={y}` | 연간 통계 | Required |

#### Goals (독서 목표)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/goals?year={y}` | 목표 목록 | Required |
| POST | `/api/v1/my/goals` | 목표 설정 | Required |
| PUT | `/api/v1/my/goals/{id}` | 목표 수정 | Required |
| DELETE | `/api/v1/my/goals/{id}` | 목표 삭제 | Required |

### 4.3 Phase 2 API Endpoints

#### Profile & Follow

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/users/{id}/profile` | 사용자 프로필 | Optional |
| PUT | `/api/v1/my/profile` | 내 프로필 수정 | Required |
| POST | `/api/v1/users/{id}/follow` | 팔로우 | Required |
| DELETE | `/api/v1/users/{id}/follow` | 언팔로우 | Required |
| GET | `/api/v1/users/{id}/followers?page={p}` | 팔로워 목록 | Optional |
| GET | `/api/v1/users/{id}/following?page={p}` | 팔로잉 목록 | Optional |
| GET | `/api/v1/my/feed?page={p}` | 타임라인 피드 | Required |

#### Groups & Discussions

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/groups?page={p}` | 모임 목록 | Optional |
| POST | `/api/v1/groups` | 모임 생성 | Required |
| GET | `/api/v1/groups/{id}` | 모임 상세 | Optional |
| POST | `/api/v1/groups/{id}/join` | 모임 참가 | Required |
| DELETE | `/api/v1/groups/{id}/leave` | 모임 탈퇴 | Required |
| GET | `/api/v1/groups/{id}/discussions?page={p}` | 토론 목록 | Required |
| POST | `/api/v1/groups/{id}/discussions` | 토론 작성 | Required |
| GET | `/api/v1/discussions/{id}/comments` | 댓글 목록 | Required |
| POST | `/api/v1/discussions/{id}/comments` | 댓글 작성 | Required |

#### Gamification

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/level` | 내 레벨/XP | Required |
| GET | `/api/v1/my/badges` | 내 배지 목록 | Required |
| GET | `/api/v1/badges` | 전체 배지 목록 (달성 가능) | Required |
| GET | `/api/v1/leaderboard?period={week\|month}` | 리더보드 | Optional |
| GET | `/api/v1/challenges?page={p}` | 챌린지 목록 | Optional |
| POST | `/api/v1/challenges` | 챌린지 생성 | Required |
| POST | `/api/v1/challenges/{id}/join` | 챌린지 참가 | Required |
| GET | `/api/v1/challenges/{id}` | 챌린지 상세 | Optional |

#### Highlights & Timer

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/books/{bookId}/highlights` | 하이라이트 목록 | Required |
| POST | `/api/v1/my/books/{bookId}/highlights` | 하이라이트 추가 | Required |
| DELETE | `/api/v1/highlights/{id}` | 하이라이트 삭제 | Required |
| POST | `/api/v1/my/books/{bookId}/sessions/start` | 타이머 시작 | Required |
| POST | `/api/v1/my/books/{bookId}/sessions/{id}/stop` | 타이머 종료 | Required |
| GET | `/api/v1/my/books/{bookId}/sessions` | 세션 기록 | Required |

---

## 5. UI/UX Design

### 5.1 Screen Layout

```
┌──────────────────────────────────────────────────┐
│  Sidebar (collapsible)  │  Header (검색, 프로필)  │
├─────────────────────────┤                         │
│  📚 내 서재             │  ┌──────────────────┐   │
│  📖 독서 기록           │  │                  │   │
│  ✍️  독후감              │  │  Main Content    │   │
│  📊 통계               │  │                  │   │
│  🎯 목표               │  │                  │   │
│  ─────────             │  │                  │   │
│  👥 커뮤니티            │  └──────────────────┘   │
│  🏆 챌린지             │                         │
│  ⚙️  설정               │  Footer (optional)      │
└──────────────────────────────────────────────────┘

Mobile (< 768px): Bottom Tab Navigation
```

### 5.2 User Flow

```
[랜딩페이지] → [회원가입/로그인] → [대시보드]
                                      │
              ┌───────────────────────┼───────────────────┐
              ▼                       ▼                   ▼
          [내 서재]              [책 검색/등록]        [독서 통계]
              │                       │
              ▼                       ▼
       [책 상세/기록]           [서재에 추가]
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
   [독서기록] [독후감] [하이라이트]
```

### 5.3 Frontend Routes (React Router)

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | 랜딩 페이지 (비로그인) |
| `/login` | Login | 로그인 |
| `/signup` | Signup | 회원가입 |
| `/oauth/callback/{provider}` | OAuthCallback | 소셜 로그인 콜백 |
| `/dashboard` | Dashboard | 대시보드 (통계 요약, 최근 활동) |
| `/books` | BookList | 내 서재 (그리드/리스트) |
| `/books/search` | BookSearch | 책 검색/등록 |
| `/books/:id` | BookDetail | 책 상세 (기록, 리뷰, 하이라이트) |
| `/records` | RecordList | 독서 기록 캘린더 뷰 |
| `/reviews` | ReviewList | 내 독후감 목록 |
| `/reviews/:id` | ReviewDetail | 독후감 상세 |
| `/reviews/:id/edit` | ReviewEdit | 독후감 편집 (Tiptap) |
| `/stats` | Stats | 독서 통계 대시보드 |
| `/goals` | Goals | 독서 목표 관리 |
| `/community` | Community | 커뮤니티 (모임 목록) |
| `/community/groups/:id` | GroupDetail | 모임 상세/토론 |
| `/community/feed` | Feed | 타임라인 피드 |
| `/challenges` | ChallengeList | 챌린지 목록 |
| `/challenges/:id` | ChallengeDetail | 챌린지 상세 |
| `/leaderboard` | Leaderboard | 리더보드 |
| `/profile/:id` | UserProfile | 사용자 프로필 |
| `/settings` | Settings | 설정 |

### 5.4 Page UI Checklist (v2.1.0)

#### Dashboard (대시보드)

- [ ] Card: 이번 달 독서 통계 (완독 N권 / 목표 M권, 진행률 바)
- [ ] Card: 현재 읽는 중 책 목록 (최대 3권, 표지+제목+진행률)
- [ ] Card: 최근 독서 기록 (최근 5건, 날짜+페이지)
- [ ] Chart: 주간 독서량 막대 차트 (최근 7일)
- [ ] Badge: 최근 획득 배지 (최대 3개)
- [ ] Level: 현재 레벨 + XP 진행 바

#### BookList (내 서재)

- [ ] Toggle: 그리드 뷰 / 리스트 뷰 전환
- [ ] Filter: 상태 드롭다운 (전체/읽고 싶은/읽는 중/완독)
- [ ] Filter: 카테고리 드롭다운
- [ ] Filter: 태그 멀티 셀렉트
- [ ] Sort: 최신순/제목순/별점순
- [ ] Card (그리드): 표지 이미지 + 제목 + 저자 + 별점 + 상태 뱃지
- [ ] Row (리스트): 표지 썸네일 + 제목 + 저자 + 진행률 바 + 별점
- [ ] Button: 책 추가 (→ BookSearch)
- [ ] Pagination: 페이지네이션

#### BookSearch (책 검색/등록)

- [ ] Input: 검색어 입력 (ISBN/제목/저자)
- [ ] Button: 검색
- [ ] List: 검색 결과 (표지+제목+저자+출판사+출판일)
- [ ] Button: "서재에 추가" (각 검색 결과)
- [ ] Form: 수동 등록 폼 (제목*, 저자*, 출판사, 페이지수, ISBN, 표지URL)
- [ ] Tab: 검색 / 수동 등록 전환

#### BookDetail (책 상세)

- [ ] Image: 책 표지 (large)
- [ ] Text: 제목, 저자, 출판사, 페이지수, ISBN
- [ ] Badge: 독서 상태 (읽고 싶은/읽는 중/완독)
- [ ] Select: 상태 변경 드롭다운
- [ ] StarRating: 별점 입력 (0.5단위)
- [ ] ProgressBar: 독서 진행률 (현재페이지/총페이지)
- [ ] Tab: 독서 기록 / 독후감 / 하이라이트
- [ ] Button: 기록 추가, 독후감 작성, 타이머 시작
- [ ] List: 태그 표시 + 추가/삭제
- [ ] List: 카테고리 표시 + 변경

#### Stats (독서 통계)

- [ ] Card: 연간 완독 권수 / 총 페이지 수 / 평균 독서일
- [ ] BarChart: 월별 독서량 (Recharts)
- [ ] PieChart: 장르 분포 (Recharts)
- [ ] LineChart: 독서 속도 트렌드 (페이지/일)
- [ ] Card: 독서 목표 달성률
- [ ] Select: 연도 필터

#### Goals (독서 목표)

- [ ] Card: 연간 목표 (진행률 원형 차트)
- [ ] Card: 월간 목표 (진행 바)
- [ ] Form: 새 목표 설정 (연간/월간, 목표 권수)
- [ ] Button: 목표 수정/삭제

#### ReviewEdit (독후감 편집)

- [ ] Input: 제목 입력
- [ ] Editor: Tiptap 마크다운 에디터 (WYSIWYG + 마크다운 전환)
- [ ] Toggle: 공개/비공개
- [ ] Button: 저장, 취소, 미리보기

---

## 6. Error Handling

### 6.1 Backend Error Code Definition

| Code | HTTP | Message | Handling |
|------|------|---------|----------|
| `AUTH_001` | 401 | 인증이 필요합니다 | 로그인 페이지로 리다이렉트 |
| `AUTH_002` | 401 | 토큰이 만료되었습니다 | 자동 토큰 갱신 시도 |
| `AUTH_003` | 400 | 이메일 또는 비밀번호가 틀렸습니다 | 에러 메시지 표시 |
| `AUTH_004` | 409 | 이미 가입된 이메일입니다 | 로그인 안내 |
| `BOOK_001` | 404 | 책을 찾을 수 없습니다 | 검색 페이지로 안내 |
| `BOOK_002` | 409 | 이미 서재에 추가된 책입니다 | toast 알림 |
| `VALID_001` | 400 | 입력값이 올바르지 않습니다 | 필드별 에러 메시지 |
| `EXTERNAL_001` | 502 | 도서 검색 서비스에 일시적 장애가 발생했습니다 | 재시도 안내 |
| `SERVER_001` | 500 | 서버 오류가 발생했습니다 | 문의 안내 |

### 6.2 Frontend Error Handling

```
API 호출 → Axios Interceptor
  → 401: 토큰 갱신 시도 → 실패 시 로그인 리다이렉트
  → 4xx: toast 에러 메시지 표시
  → 5xx: 에러 페이지 또는 toast
  → Network Error: "인터넷 연결을 확인해주세요" toast

페이지 레벨: React Error Boundary → 에러 폴백 UI
폼 레벨: React Hook Form validation → 필드별 에러 메시지
```

---

## 7. Security Considerations

- [x] Spring Security + JWT (Access Token 30분, Refresh Token 7일)
- [x] OAuth2 소셜 로그인 (Google, GitHub, Kakao)
- [x] 비밀번호 BCrypt 해싱
- [x] CORS 설정 (프론트엔드 도메인만 허용)
- [x] Input validation (`@Valid` + Bean Validation)
- [x] SQL Injection 방지 (JPA Parameterized Query)
- [x] XSS 방지 (React 기본 이스케이핑 + 독후감 마크다운 sanitize)
- [x] Rate Limiting (Spring Boot Bucket4j — 인증 API: 5회/분, 검색 API: 30회/분)
- [x] HTTPS 강제 (프로덕션)
- [ ] CSRF: SPA + JWT 방식이므로 별도 CSRF 토큰 불필요 (Cookie 미사용)

---

## 8. Test Plan (v2.3.0)

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L0: Unit Tests (BE) | Service 로직, 유틸 | JUnit 5 + Mockito | Do |
| L0: Unit Tests (FE) | Hooks, 유틸, 스토어 | Vitest | Do |
| L1: API Tests | REST 엔드포인트 | JUnit 5 + MockMvc / curl | Do |
| L2: UI Action Tests | 페이지 요소, 폼 | Playwright | Do |
| L3: E2E Tests | 전체 사용자 여정 | Playwright | Do |

### 8.2 L1: API Test Scenarios (Phase 1)

| # | Endpoint | Method | Test | Expected |
|---|----------|--------|------|----------|
| 1 | `/api/v1/auth/signup` | POST | 유효한 이메일+비밀번호 | 201, JWT 반환 |
| 2 | `/api/v1/auth/signup` | POST | 중복 이메일 | 409, AUTH_004 |
| 3 | `/api/v1/auth/login` | POST | 올바른 자격증명 | 200, JWT 반환 |
| 4 | `/api/v1/auth/login` | POST | 잘못된 비밀번호 | 400, AUTH_003 |
| 5 | `/api/v1/my/books` | GET | 인증 없음 | 401 |
| 6 | `/api/v1/my/books` | GET | 인증 있음 | 200, `.data` 배열 |
| 7 | `/api/v1/my/books` | POST | 유효한 책 추가 | 201, `.data.id` 존재 |
| 8 | `/api/v1/my/books` | POST | 중복 추가 | 409, BOOK_002 |
| 9 | `/api/v1/my/books/{id}` | PATCH | 상태 변경 | 200, 변경된 status |
| 10 | `/api/v1/books/search?q=자바` | GET | 검색 결과 | 200, `.data` 배열 |
| 11 | `/api/v1/my/books/{id}/records` | POST | 기록 추가 | 201 |
| 12 | `/api/v1/my/books/{id}/reviews` | POST | 독후감 작성 | 201 |
| 13 | `/api/v1/my/stats/monthly?year=2026` | GET | 월별 통계 | 200, 12개월 데이터 |

### 8.3 L2: UI Action Test Scenarios

| # | Page | Action | Expected Result |
|---|------|--------|----------------|
| 1 | Dashboard | 페이지 로드 | 통계 카드, 읽는 중 책, 차트 렌더링 |
| 2 | BookSearch | "자바" 검색 | 검색 결과 목록 표시 |
| 3 | BookSearch | "서재에 추가" 클릭 | 성공 toast + 서재에 반영 |
| 4 | BookList | 상태 필터 "완독" | 완독 책만 표시 |
| 5 | BookList | 뷰 토글 | 그리드 ↔ 리스트 전환 |
| 6 | BookDetail | 별점 3.5 입력 | 별점 저장 + UI 반영 |
| 7 | BookDetail | 독서 기록 추가 | 기록 리스트에 추가 |
| 8 | ReviewEdit | 마크다운 입력 + 저장 | 독후감 저장 성공 |
| 9 | Stats | 연도 변경 | 차트 데이터 갱신 |
| 10 | Goals | 새 목표 설정 | 목표 카드 생성 |

### 8.4 L3: E2E Scenario Test Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 신규 가입 → 첫 책 등록 | 회원가입 → 검색 → 서재 추가 → 상세 확인 | 서재에 책 존재 |
| 2 | 독서 사이클 | 책 상세 → 상태:"읽는 중" → 기록 추가 → 완독 → 별점+리뷰 | 통계에 반영 |
| 3 | 통계 확인 | 대시보드 → 통계 페이지 → 연도 변경 → 차트 확인 | 차트 데이터 정상 |
| 4 | 소셜 로그인 | Google OAuth → 프로필 확인 | 닉네임/이메일 표시 |

### 8.5 Seed Data Requirements

| Entity | Count | Key Fields |
|--------|:-----:|-----------|
| User | 3 | email, nickname, provider |
| Book | 10 | title, author, isbn, totalPages |
| UserBook | 15 | 다양한 status (WANT:5, READING:5, COMPLETED:5) |
| ReadingRecord | 30 | 날짜 분산 (최근 3개월) |
| Review | 5 | isPublic: true 3개, false 2개 |
| ReadingGoal | 2 | 연간+월간 |
| Category | 3 | 소설, 자기계발, 기술 |
| Tag | 5 | 추천, 재독, 필독, 베스트, 고전 |
| Badge | 5 | 기본 배지 세트 |

---

## 9. Clean Architecture

### 9.1 Layer Structure

**Frontend (React)**

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Pages** | 라우팅, 레이아웃, 데이터 페칭 | `src/pages/` |
| **Features** | 기능별 컴포넌트, 훅, API 호출 | `src/features/{domain}/` |
| **Components** | 재사용 가능 UI, shadcn/ui | `src/components/` |
| **Lib** | API 클라이언트, 유틸, 인증 | `src/lib/` |
| **Stores** | 전역 상태 (Zustand) | `src/stores/` |
| **Types** | TypeScript 타입/인터페이스 | `src/types/` |

**Backend (Spring Boot)**

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Controller** | HTTP 요청/응답, DTO 변환 | `domain/{name}/controller/` |
| **Service** | 비즈니스 로직, 트랜잭션 | `domain/{name}/service/` |
| **Repository** | DB 접근, JPA 쿼리 | `domain/{name}/repository/` |
| **Entity** | JPA 엔티티, 도메인 모델 | `domain/{name}/entity/` |
| **DTO** | 요청/응답 데이터 전송 객체 | `domain/{name}/dto/` |
| **Global** | 공통 설정, 예외, 보안 | `global/` |
| **Infra** | 외부 API 클라이언트 | `infra/` |

### 9.2 Dependency Rules

```
Backend:
  Controller → Service → Repository → Entity
                 ↓
               Infra (외부 API)

Frontend:
  Pages → Features → Lib/Stores → Types
            ↓
         Components (UI)
```

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

**Frontend**

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `BookCard`, `StarRating` |
| Hooks | use + PascalCase | `useBooks`, `useAuth` |
| Files (component) | PascalCase.tsx | `BookCard.tsx` |
| Files (hook) | use*.ts | `useBooks.ts` |
| Files (utility) | camelCase.ts | `formatDate.ts` |
| Folders | kebab-case | `book-search/` |
| Constants | UPPER_SNAKE | `API_BASE_URL` |

**Backend**

| Target | Rule | Example |
|--------|------|---------|
| Class | PascalCase | `BookService`, `UserController` |
| Method | camelCase | `findByUserId()`, `createBook()` |
| Variable | camelCase | `bookTitle`, `readDate` |
| Package | lowercase | `com.mylog.domain.book` |
| DB Table | snake_case (복수) | `user_books`, `reading_records` |
| DB Column | snake_case | `created_at`, `cover_image_url` |
| DTO | PascalCase + suffix | `BookCreateRequest`, `BookResponse` |
| Enum | UPPER_SNAKE | `WANT_TO_READ`, `COMPLETED` |

### 10.2 API Convention

```
REST Resource Naming:
  /api/v1/{resource}              # 복수형 사용
  /api/v1/my/{resource}           # 내 리소스 (인증된 사용자)
  /api/v1/users/{id}/{resource}   # 특정 사용자 리소스

Response:
  단일: { "data": { ... } }
  목록: { "data": [...], "pagination": { ... } }
  에러: { "error": { "code": "...", "message": "...", "details": {} } }

HTTP Status:
  200 OK, 201 Created, 204 No Content
  400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict
  500 Internal Server Error
```

---

## 11. Implementation Guide

### 11.1 File Structure

```
my-log/
├── frontend/                          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui 컴포넌트
│   │   │   ├── layout/               # Header, Sidebar, Footer, MobileNav
│   │   │   └── common/               # StarRating, ProgressBar, EmptyState
│   │   ├── features/
│   │   │   ├── auth/                  # LoginForm, SignupForm, OAuthButton, useAuth
│   │   │   ├── books/                 # BookCard, BookGrid, BookSearch, useBooks
│   │   │   ├── records/              # RecordForm, RecordList, RecordCalendar
│   │   │   ├── reviews/              # ReviewEditor, ReviewCard, ReviewList
│   │   │   ├── stats/                # StatCard, MonthlyChart, GenrePie
│   │   │   ├── goals/                # GoalCard, GoalForm, GoalProgress
│   │   │   ├── community/            # GroupCard, DiscussionList, FeedItem (Phase 2)
│   │   │   └── gamification/         # LevelBadge, BadgeGrid, ChallengeCard (Phase 2)
│   │   ├── hooks/                     # useDebounce, useInfiniteScroll
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios 인스턴스 + 인터셉터
│   │   │   ├── auth.ts               # JWT 토큰 관리
│   │   │   ├── queryClient.ts        # TanStack Query 설정
│   │   │   └── utils.ts              # cn(), formatDate() 등
│   │   ├── pages/                     # React Router 페이지 (위 5.3 참조)
│   │   ├── stores/
│   │   │   ├── authStore.ts           # 인증 상태
│   │   │   └── uiStore.ts            # UI 상태 (사이드바, 테마)
│   │   ├── types/
│   │   │   ├── book.ts               # Book, UserBook, ReadingStatus
│   │   │   ├── record.ts             # ReadingRecord
│   │   │   ├── review.ts             # Review
│   │   │   ├── user.ts               # User, AuthToken
│   │   │   ├── stats.ts              # StatsData, ChartData
│   │   │   └── api.ts                # ApiResponse, PaginatedResponse, ApiError
│   │   ├── App.tsx                    # Router + Layout
│   │   └── main.tsx                   # Entry point
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                           # Spring Boot 3 + Gradle
│   ├── src/main/java/com/mylog/
│   │   ├── MyLogApplication.java
│   │   ├── domain/
│   │   │   ├── user/
│   │   │   │   ├── entity/User.java
│   │   │   │   ├── repository/UserRepository.java
│   │   │   │   ├── service/UserService.java
│   │   │   │   ├── controller/AuthController.java
│   │   │   │   └── dto/SignupRequest.java, LoginRequest.java, UserResponse.java
│   │   │   ├── book/
│   │   │   │   ├── entity/Book.java, UserBook.java
│   │   │   │   ├── repository/BookRepository.java, UserBookRepository.java
│   │   │   │   ├── service/BookService.java, UserBookService.java
│   │   │   │   ├── controller/BookController.java, UserBookController.java
│   │   │   │   └── dto/BookCreateRequest.java, BookResponse.java, ...
│   │   │   ├── record/
│   │   │   │   ├── entity/ReadingRecord.java
│   │   │   │   ├── repository/ReadingRecordRepository.java
│   │   │   │   ├── service/ReadingRecordService.java
│   │   │   │   ├── controller/ReadingRecordController.java
│   │   │   │   └── dto/RecordCreateRequest.java, RecordResponse.java
│   │   │   ├── review/
│   │   │   │   ├── entity/Review.java
│   │   │   │   ├── repository/ReviewRepository.java
│   │   │   │   ├── service/ReviewService.java
│   │   │   │   ├── controller/ReviewController.java
│   │   │   │   └── dto/ReviewCreateRequest.java, ReviewResponse.java
│   │   │   ├── category/              # Category, Tag, BookTag, BookCategory
│   │   │   ├── stats/                 # StatsService, StatsController (no entity)
│   │   │   └── goal/                  # ReadingGoal entity + CRUD
│   │   ├── global/
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java
│   │   │   │   ├── CorsConfig.java
│   │   │   │   ├── SwaggerConfig.java
│   │   │   │   └── QueryDslConfig.java
│   │   │   ├── auth/
│   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── CustomUserDetailsService.java
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   ├── BusinessException.java
│   │   │   │   └── ErrorCode.java (enum)
│   │   │   └── common/
│   │   │       ├── BaseEntity.java (createdAt, updatedAt)
│   │   │       ├── ApiResponse.java
│   │   │       └── PageResponse.java
│   │   └── infra/
│   │       └── booksearch/
│   │           ├── BookSearchClient.java (interface)
│   │           ├── AladinBookSearchClient.java
│   │           ├── NaverBookSearchClient.java
│   │           └── BookSearchDto.java
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   ├── application-dev.yml
│   │   ├── application-prod.yml
│   │   └── db/migration/
│   │       ├── V1__init_schema.sql
│   │       └── V2__add_phase2_tables.sql
│   ├── src/test/java/com/mylog/       # 테스트
│   ├── build.gradle
│   └── settings.gradle
│
├── docs/                              # PDCA 문서
└── docker-compose.yml                 # 로컬 개발용 (PostgreSQL)
```

### 11.2 Implementation Order

**Phase 1 (핵심)**

1. [ ] 프로젝트 초기 셋업 (FE: Vite + React, BE: Spring Boot + Gradle)
2. [ ] DB 스키마 + Flyway 마이그레이션 (V1__init_schema.sql)
3. [ ] 공통 인프라 (BaseEntity, ApiResponse, GlobalExceptionHandler, CORS, Swagger)
4. [ ] 인증 (Spring Security + JWT + OAuth2 → AuthController → FE LoginForm)
5. [ ] 도서 검색 (infra/BookSearchClient → BookController → FE BookSearch)
6. [ ] 내 서재 CRUD (UserBook → UserBookController → FE BookList/BookDetail)
7. [ ] 독서 기록 CRUD (ReadingRecord → Controller → FE RecordForm/RecordList)
8. [ ] 독후감 CRUD + Tiptap 에디터 (Review → Controller → FE ReviewEditor)
9. [ ] 카테고리/태그 (Category, Tag → Controllers → FE 필터 UI)
10. [ ] 별점 (UserBook.rating → FE StarRating 컴포넌트)
11. [ ] 통계 대시보드 (StatsService 쿼리 → StatsController → FE Recharts)
12. [ ] 독서 목표 CRUD (ReadingGoal → Controller → FE GoalCard)
13. [ ] 레이아웃 + 반응형 (Sidebar, Header, MobileNav, 라우팅)

**Phase 2 (커뮤니티/게이미피케이션)**

14. [ ] 팔로우/팔로잉 + 프로필 페이지
15. [ ] 독서 모임 CRUD + 멤버 관리
16. [ ] 토론 게시판 + 댓글
17. [ ] 타임라인 피드
18. [ ] 레벨/XP 시스템 + 배지
19. [ ] 챌린지 CRUD + 리더보드
20. [ ] 하이라이트 + 독서 타이머
21. [ ] 알림 시스템

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Effort |
|--------|-----------|-------------|:---------------:|
| 프로젝트 셋업 + 인프라 | `module-1` | FE/BE 프로젝트 생성, DB, 공통 설정 | Medium |
| 인증 시스템 | `module-2` | JWT + OAuth2, 로그인/회원가입 UI | High |
| 책 관리 + 서재 | `module-3` | 도서 검색, 내 서재 CRUD, 카테고리/태그 | High |
| 독서 기록 + 독후감 | `module-4` | 기록 CRUD, Tiptap 에디터, 별점 | Medium |
| 통계 + 목표 | `module-5` | Recharts 대시보드, 목표 CRUD | Medium |
| 레이아웃 + 반응형 | `module-6` | Sidebar, Header, Router, 모바일 대응 | Medium |
| 커뮤니티 | `module-7` | 팔로우, 모임, 토론, 피드 (Phase 2) | High |
| 게이미피케이션 | `module-8` | 레벨, 배지, 챌린지, 리더보드 (Phase 2) | High |

#### Recommended Session Plan

| Session | Phase | Scope | Description |
|---------|-------|-------|-------------|
| Session 1 | Do | `--scope module-1` | 프로젝트 초기 셋업, DB, 공통 인프라 |
| Session 2 | Do | `--scope module-2` | 인증 (BE + FE) |
| Session 3 | Do | `--scope module-3` | 책 관리 + 서재 (BE + FE) |
| Session 4 | Do | `--scope module-4` | 독서 기록 + 독후감 (BE + FE) |
| Session 5 | Do | `--scope module-5` | 통계 + 목표 (BE + FE) |
| Session 6 | Do | `--scope module-6` | 레이아웃 통합 + 반응형 |
| Session 7 | Check | 전체 | Phase 1 Gap Analysis |
| Session 8 | Do | `--scope module-7` | 커뮤니티 (Phase 2) |
| Session 9 | Do | `--scope module-8` | 게이미피케이션 (Phase 2) |
| Session 10 | Check + Report | 전체 | Phase 2 Gap Analysis + 완료 보고 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-01 | Initial draft — Option C 실용적 균형 아키텍처 | kyungheelee |
