# 커뮤니티 & 소셜 기능 Design Document

> **Summary**: OAuth + 프로필/팔로우 + 독서 모임/토론 + 피드를 Option C(실용적 균형) 아키텍처로 구현
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-04
> **Status**: Draft
> **Planning Doc**: [community.plan.md](../../01-plan/features/community.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 개인 독서 기록만으로는 습관 유지가 어려움 -> 사회적 교류와 동기부여 필요 |
| **WHO** | Phase 1 사용자 + 독서 모임/토론에 관심 있는 신규 사용자 |
| **RISK** | OAuth 프로바이더별 설정 복잡도, 초기 커뮤니티 활성화, 피드 쿼리 성능 |
| **SUCCESS** | OAuth 로그인 동작, 팔로우 플로우, 모임->토론->댓글 E2E, 타임라인 피드 |
| **SCOPE** | OAuth + 프로필 + 팔로우 + 모임 + 토론 + 공개 리뷰 + 타임라인 |

---

## 1. Overview

### 1.1 Design Goals

- Phase 1 아키텍처(도메인별 패키지)와 완전 일관된 구조
- 5개 도메인 패키지 신규 추가: follow, group, discussion, feed, + user 수정
- OAuth2는 Spring Security OAuth2 Client 표준 사용
- 타임라인 피드는 Fan-out on read (초기 MVP, 단순)

### 1.2 Architecture Decision

**Selected**: Option C — 실용적 균형

| Criteria | Value |
|----------|-------|
| New BE Files | ~40 |
| New FE Files | ~15 |
| Complexity | Medium |
| Maintainability | High |
| Rationale | Phase 1과 동일한 도메인 패키지 패턴, 확장성 좋음 |

---

## 2. Data Model

### 2.1 New Entities (Phase 2 커뮤니티)

```java
// Follow (팔로우)
@Entity @Table(name = "follows")
public class Follow {
    Long id;
    Long followerId;    // FK -> User
    Long followingId;   // FK -> User
    LocalDateTime createdAt;
}

// ReadingGroup (독서 모임)
@Entity @Table(name = "reading_groups")
public class ReadingGroup {
    Long id;
    String name;            // 모임 이름 (max 100)
    String description;     // 모임 소개
    Long creatorId;         // FK -> User
    Integer maxMembers;     // 최대 인원 (default 50)
    Boolean isPublic;       // 공개 여부 (default true)
    LocalDateTime createdAt;
}

// GroupMember (모임 멤버)
@Entity @Table(name = "group_members")
public class GroupMember {
    Long id;
    Long groupId;           // FK -> ReadingGroup
    Long userId;            // FK -> User
    String role;            // CREATOR / ADMIN / MEMBER
    LocalDateTime joinedAt;
}

// Discussion (토론 게시글)
@Entity @Table(name = "discussions")
public class Discussion {
    Long id;
    Long groupId;           // FK -> ReadingGroup
    Long userId;            // FK -> User
    String title;
    String content;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}

// Comment (댓글)
@Entity @Table(name = "comments")
public class Comment {
    Long id;
    Long discussionId;      // FK -> Discussion
    Long userId;            // FK -> User
    String content;
    Long parentId;          // FK -> Comment (대댓글, nullable)
    LocalDateTime createdAt;
}
```

> DB 테이블은 Phase 1 마이그레이션(`V1__init_schema.sql`)에 이미 생성됨. Java 엔티티만 추가.

### 2.2 Modified Entities

- **User**: `provider`, `providerId` 필드 이미 존재. OAuth 로그인 시 활용.

---

## 3. API Specification

### 3.1 Module A: OAuth (수정)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/oauth/{provider}` | 소셜 로그인 (provider: google/github/kakao) | - |

**OAuth2 Flow**:
```
[FE] 사용자가 "Google로 로그인" 클릭
  -> [FE] window.location = /api/v1/auth/oauth/google (Spring redirect)
  -> [Google] 인증 → 콜백: /api/v1/auth/oauth/callback/google
  -> [BE] OAuth2 유저 정보 추출 → User 조회/생성 → JWT 발급
  -> [BE] Redirect: {FRONTEND_URL}/oauth/callback?token={JWT}
  -> [FE] OAuthCallback 페이지 → token 저장 → /dashboard 이동
```

**Spring Security Config 변경**:
```java
// SecurityConfig.java 추가
.oauth2Login(oauth -> oauth
    .authorizationEndpoint(e -> e.baseUri("/api/v1/auth/oauth"))
    .redirectionEndpoint(e -> e.baseUri("/api/v1/auth/oauth/callback/*"))
    .userInfoEndpoint(e -> e.userService(customOAuth2UserService))
    .successHandler(oAuth2SuccessHandler)  // JWT 발급 + FE redirect
)
```

### 3.2 Module B: Profile & Follow

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/users/{id}/profile` | 사용자 프로필 (통계 포함) | Optional |
| PUT | `/api/v1/my/profile` | 내 프로필 수정 | Required |
| POST | `/api/v1/users/{id}/follow` | 팔로우 | Required |
| DELETE | `/api/v1/users/{id}/follow` | 언팔로우 | Required |
| GET | `/api/v1/users/{id}/followers?page={p}` | 팔로워 목록 | Optional |
| GET | `/api/v1/users/{id}/following?page={p}` | 팔로잉 목록 | Optional |

**Profile Response DTO**:
```json
{
  "data": {
    "id": 1,
    "nickname": "독서왕",
    "profileImageUrl": "...",
    "stats": {
      "totalBooks": 42,
      "completedBooks": 30,
      "followerCount": 15,
      "followingCount": 8
    },
    "isFollowing": true,
    "recentBooks": [...]
  }
}
```

### 3.3 Module C: Groups

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/groups?page={p}` | 공개 모임 목록 | Optional |
| POST | `/api/v1/groups` | 모임 생성 | Required |
| GET | `/api/v1/groups/{id}` | 모임 상세 | Optional |
| POST | `/api/v1/groups/{id}/join` | 모임 참가 | Required |
| DELETE | `/api/v1/groups/{id}/leave` | 모임 탈퇴 | Required |

### 3.4 Module D: Discussions & Comments

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/groups/{id}/discussions?page={p}` | 토론 목록 | Required |
| POST | `/api/v1/groups/{id}/discussions` | 토론 작성 | Required |
| GET | `/api/v1/discussions/{id}` | 토론 상세 | Required |
| GET | `/api/v1/discussions/{id}/comments` | 댓글 목록 | Required |
| POST | `/api/v1/discussions/{id}/comments` | 댓글 작성 | Required |
| DELETE | `/api/v1/comments/{id}` | 댓글 삭제 | Required |

### 3.5 Module E: Feed

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/feed?page={p}` | 타임라인 피드 | Required |

**Feed 구현 전략** (Fan-out on read):
```sql
-- 팔로우한 사용자들의 최근 활동을 직접 쿼리
-- 활동 = 완독(status COMPLETED), 리뷰 작성, 독서 기록
SELECT ub.user_id, ub.book_id, 'COMPLETED' as type, ub.updated_at
FROM user_books ub
WHERE ub.user_id IN (SELECT following_id FROM follows WHERE follower_id = :userId)
  AND ub.status = 'COMPLETED'
UNION ALL
SELECT r.user_id, r.user_book_id, 'REVIEW' as type, r.created_at
FROM reviews r
WHERE r.user_id IN (SELECT following_id FROM follows WHERE follower_id = :userId)
  AND r.is_public = true
ORDER BY updated_at DESC
LIMIT 20 OFFSET :offset
```

---

## 4. UI/UX Design

### 4.1 New Routes

| Route | Page | Module |
|-------|------|--------|
| `/oauth/callback` | OAuthCallback | A |
| `/profile/:id` | UserProfile | B |
| `/community` | Community (모임 목록) | C |
| `/community/groups/:id` | GroupDetail (모임+토론) | C, D |
| `/feed` | Feed (타임라인) | E |

### 4.2 Page UI Checklist

#### OAuthCallback
- [ ] URL에서 token 추출 -> authStore에 저장 -> /dashboard redirect
- [ ] 에러 시 에러 메시지 + /login 링크

#### UserProfile
- [ ] 프로필 이미지 + 닉네임
- [ ] 독서 통계 카드 (완독, 읽는 중, 팔로워, 팔로잉)
- [ ] 팔로우/언팔로우 버튼
- [ ] 최근 공개 활동 목록
- [ ] 팔로워/팔로잉 탭

#### Community
- [ ] 공개 모임 리스트 (이름, 설명, 멤버 수, 공개 여부)
- [ ] 모임 생성 버튼 -> 생성 폼 (이름*, 설명, 최대인원, 공개여부)
- [ ] 검색/필터

#### GroupDetail
- [ ] 모임 정보 (이름, 설명, 멤버 수, 내 참가 상태)
- [ ] 참가/탈퇴 버튼
- [ ] 멤버 목록 (아바타 + 닉네임)
- [ ] 토론 목록 (제목, 작성자, 댓글 수, 날짜)
- [ ] 토론 작성 폼
- [ ] 토론 상세 -> 댓글/대댓글 목록

#### Feed
- [ ] 팔로우한 사용자의 활동 카드 (완독, 리뷰, 기록)
- [ ] 각 카드: 사용자 아바타 + 닉네임 + 활동 내용 + 시간
- [ ] 공개 독후감 링크
- [ ] 무한 스크롤 또는 페이지네이션

### 4.3 Sidebar 변경

현재 Sidebar에 이미 `/community`, `/challenges` 링크가 있음. 추가:
- `/feed` (타임라인) 메뉴 항목 추가
- `/community` 활성화 (현재 빈 경로)

### 4.4 Login 페이지 변경

소셜 로그인 버튼 3개 추가:
```
┌─────────────────────────┐
│     📚 MyLog 로그인      │
│                         │
│  [이메일]               │
│  [비밀번호]             │
│  [로그인]               │
│                         │
│  ──── 또는 ────         │
│                         │
│  [G] Google로 로그인    │
│  [🐙] GitHub로 로그인   │
│  [💬] Kakao로 로그인    │
│                         │
│  계정이 없으신가요? 회원가입│
└─────────────────────────┘
```

---

## 5. Backend Structure (Option C)

```
domain/
├── user/               # [수정] OAuth2 관련 추가
│   ├── controller/AuthController.java          # [수정] OAuth 엔드포인트
│   ├── service/UserService.java                # [수정] OAuth 유저 생성/조회
│   ├── service/CustomOAuth2UserService.java    # [신규] OAuth2 유저 서비스
│   └── service/OAuth2SuccessHandler.java       # [신규] JWT 발급 + redirect
│
├── follow/             # [신규] 팔로우 도메인
│   ├── entity/Follow.java
│   ├── repository/FollowRepository.java
│   ├── service/FollowService.java
│   ├── controller/FollowController.java
│   ├── dto/FollowResponse.java
│   └── dto/UserProfileResponse.java
│
├── group/              # [신규] 독서 모임 도메인
│   ├── entity/ReadingGroup.java
│   ├── entity/GroupMember.java
│   ├── repository/ReadingGroupRepository.java
│   ├── repository/GroupMemberRepository.java
│   ├── service/GroupService.java
│   ├── controller/GroupController.java
│   ├── dto/GroupCreateRequest.java
│   ├── dto/GroupResponse.java
│   └── dto/GroupMemberResponse.java
│
├── discussion/         # [신규] 토론/댓글 도메인
│   ├── entity/Discussion.java
│   ├── entity/Comment.java
│   ├── repository/DiscussionRepository.java
│   ├── repository/CommentRepository.java
│   ├── service/DiscussionService.java
│   ├── controller/DiscussionController.java
│   ├── dto/DiscussionCreateRequest.java
│   ├── dto/DiscussionResponse.java
│   ├── dto/CommentCreateRequest.java
│   └── dto/CommentResponse.java
│
└── feed/               # [신규] 타임라인 피드
    ├── service/FeedService.java
    ├── controller/FeedController.java
    └── dto/FeedItem.java
```

**BE 파일 수**: 신규 ~32파일 + 수정 ~5파일

---

## 6. Frontend Structure (Option C)

```
src/
├── features/
│   ├── community/          # [신규] 모임 관련
│   │   ├── api.ts          # groups API calls
│   │   ├── GroupCard.tsx    # 모임 리스트 카드
│   │   └── DiscussionList.tsx  # 토론 목록 컴포넌트
│   │
│   ├── follow/             # [신규] 팔로우 관련
│   │   ├── api.ts          # follow/profile API calls
│   │   ├── FollowButton.tsx    # 팔로우/언팔로우 버튼
│   │   └── FollowerList.tsx    # 팔로워/팔로잉 목록
│   │
│   ├── feed/               # [신규] 피드 관련
│   │   ├── api.ts          # feed API calls
│   │   └── FeedItem.tsx    # 피드 아이템 카드
│   │
│   └── auth/               # [수정] OAuth 버튼 추가
│       └── LoginForm.tsx   # 소셜 로그인 버튼 추가
│
├── pages/
│   ├── OAuthCallback.tsx   # [신규] OAuth 콜백 처리
│   ├── UserProfile.tsx     # [신규] 사용자 프로필
│   ├── Community.tsx       # [신규] 모임 목록
│   ├── GroupDetail.tsx     # [신규] 모임 상세 + 토론
│   └── Feed.tsx            # [신규] 타임라인 피드
│
├── types/
│   ├── community.ts        # [신규] Group, Discussion, Comment types
│   └── follow.ts           # [신규] Follow, Profile types
│
└── App.tsx                 # [수정] 신규 라우트 추가
```

**FE 파일 수**: 신규 ~14파일 + 수정 ~4파일

---

## 7. Security Considerations

- OAuth2 state 파라미터로 CSRF 방지 (Spring Security 자동 처리)
- OAuth 콜백 redirect URL을 환경변수로 관리 (`OAUTH_REDIRECT_URI`)
- 소셜 로그인 시 동일 이메일 기존 계정 자동 연동 (provider/providerId 업데이트)
- 모임 탈퇴/삭제는 본인만 가능 (userId 검증)
- 댓글 삭제는 작성자만 가능
- 비공개 모임은 멤버만 토론 조회 가능

---

## 8. Environment Variables (추가)

| Variable | Purpose | Scope |
|----------|---------|-------|
| `GOOGLE_CLIENT_ID` | Google OAuth | Server |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | Server |
| `GITHUB_CLIENT_ID` | GitHub OAuth | Server |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | Server |
| `KAKAO_CLIENT_ID` | Kakao OAuth | Server |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth Secret | Server |
| `OAUTH_REDIRECT_BASE` | 프론트엔드 콜백 URL 베이스 | Server |

---

## 9. Implementation Guide

### 9.1 Module Map

| Key | Module | BE Files | FE Files | Dependencies |
|-----|--------|:--------:|:--------:|-------------|
| `module-A` | OAuth 소셜 로그인 | ~5 | ~3 | SecurityConfig, User 수정 |
| `module-B` | 프로필 & 팔로우 | ~8 | ~5 | follow 도메인 신규 |
| `module-C` | 독서 모임 | ~9 | ~3 | group 도메인 신규 |
| `module-D` | 토론 게시판 | ~10 | ~4 | discussion 도메인 신규 |
| `module-E` | 피드 & 공개 리뷰 | ~3 | ~3 | feed 서비스, Follow 의존 |

### 9.2 Implementation Order

```
module-A (OAuth) → module-B (Follow) → module-C (Group) → module-D (Discussion) → module-E (Feed)
    │                  │                    │                   │                      │
    ▼                  ▼                    ▼                   ▼                      ▼
 SecurityConfig     Follow Entity       Group Entity       Discussion Entity     FeedService
 OAuth2UserService  FollowService       GroupService       DiscussionService     FeedController
 SuccessHandler     ProfileController   GroupController    CommentController     Feed.tsx
 OAuthCallback.tsx  UserProfile.tsx     Community.tsx      GroupDetail(토론부)
 LoginForm 수정     FollowButton.tsx
```

### 9.3 Session Guide

| Session | Modules | Scope | Estimated |
|:-------:|---------|-------|-----------|
| 1 | A + B | OAuth + 프로필/팔로우 | BE ~13, FE ~8 |
| 2 | C + D | 모임 + 토론 | BE ~19, FE ~7 |
| 3 | E + 통합 | 피드 + 라우팅 + Sidebar 업데이트 | BE ~3, FE ~5 |

**권장**: 2~3 세션으로 분할 구현. `/pdca do community --scope module-A,module-B`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-04 | Initial design -- Option C selected |
