# 게이미피케이션 & 유틸리티 Design Document

> **Summary**: 레벨/XP + 배지 + 챌린지 + 리더보드 + 하이라이트 + 타이머를 Option C 아키텍처로 구현
>
> **Project**: my-log
> **Version**: 0.1.0
> **Author**: kyungheelee
> **Date**: 2026-04-04
> **Status**: Draft
> **Planning Doc**: [gamification.plan.md](../../01-plan/features/gamification.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 개인 성취감과 경쟁 요소로 독서 지속 동기부여 강화 |
| **WHO** | 기존 사용자 (독서 기록 중, 커뮤니티 활동 중) |
| **RISK** | XP 밸런싱, 배지 자동 감지 복잡도 |
| **SUCCESS** | XP 획득+레벨업, 배지 자동 달성, 챌린지 E2E, 리더보드, 하이라이트 CRUD, 타이머 |
| **SCOPE** | 레벨/XP + 배지 + 챌린지 + 리더보드 + 하이라이트 + 타이머 |

---

## 1. Architecture Decision

**Selected**: Option C — 실용적 균형

4개 BE 도메인 (gamification, challenge, highlight, timer) + XP 이벤트 서비스.

---

## 2. Data Model

### 2.1 Entities (DB 테이블 이미 존재)

```java
// UserLevel — 사용자 레벨/XP
@Entity @Table(name = "user_levels")
public class UserLevel {
    Long id;
    Long userId;            // FK -> User (unique)
    Integer level;          // default 1
    Integer totalXp;        // default 0
    Integer currentLevelXp; // 현재 레벨 내 XP
    Integer nextLevelXp;    // 다음 레벨까지 필요 XP (default 100)
}

// Badge — 배지 정의
@Entity @Table(name = "badges")
public class Badge {
    Long id;
    String code;            // FIRST_COMPLETE, STREAK_7 등 (unique)
    String name;
    String description;
    String iconUrl;
    Integer xpReward;       // default 10
}

// UserBadge — 획득 배지
@Entity @Table(name = "user_badges")
public class UserBadge {
    Long id;
    Long userId;
    Long badgeId;
    LocalDateTime earnedAt;
}

// Challenge — 독서 챌린지
@Entity @Table(name = "challenges")
public class Challenge {
    Long id;
    String title;
    String description;
    Long creatorId;
    Integer targetBooks;
    LocalDate startDate;
    LocalDate endDate;
    LocalDateTime createdAt;
}

// ChallengeParticipant
@Entity @Table(name = "challenge_participants")
public class ChallengeParticipant {
    Long id;
    Long challengeId;
    Long userId;
    Integer completedBooks;  // default 0
    LocalDateTime joinedAt;
}

// Highlight — 하이라이트/인용구
@Entity @Table(name = "highlights")
public class Highlight {
    Long id;
    Long userBookId;
    Integer pageNumber;
    String content;
    String memo;
    LocalDateTime createdAt;
}

// ReadingSession — 독서 타이머
@Entity @Table(name = "reading_sessions")
public class ReadingSession {
    Long id;
    Long userBookId;
    LocalDateTime startTime;
    LocalDateTime endTime;
    Integer durationMinutes;
    Integer pagesRead;
}
```

---

## 3. API Specification

### 3.1 Module F: Level & XP

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/level` | 내 레벨/XP 조회 | Required |

> XP 부여는 직접 API 아님 — 기존 API(완독, 리뷰, 기록)에서 이벤트로 처리

### 3.2 Module G: Badges

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/badges` | 내 배지 목록 | Required |
| GET | `/api/v1/badges` | 전체 배지 목록 (달성 여부 포함) | Required |

### 3.3 Module H: Challenges

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/challenges?page={p}` | 챌린지 목록 | Optional |
| POST | `/api/v1/challenges` | 챌린지 생성 | Required |
| GET | `/api/v1/challenges/{id}` | 챌린지 상세 (참가자 포함) | Optional |
| POST | `/api/v1/challenges/{id}/join` | 챌린지 참가 | Required |

### 3.4 Module I: Leaderboard

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/leaderboard?period={week\|month}` | 리더보드 | Optional |

### 3.5 Module J: Highlights

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/my/books/{bookId}/highlights` | 하이라이트 목록 | Required |
| POST | `/api/v1/my/books/{bookId}/highlights` | 하이라이트 추가 | Required |
| DELETE | `/api/v1/highlights/{id}` | 하이라이트 삭제 | Required |

### 3.6 Module K: Timer

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/my/books/{bookId}/sessions/start` | 타이머 시작 | Required |
| POST | `/api/v1/my/books/{bookId}/sessions/{id}/stop` | 타이머 종료 | Required |
| GET | `/api/v1/my/books/{bookId}/sessions` | 세션 기록 목록 | Required |

**Total: 14 endpoints**

---

## 4. XP Event System Design

### 4.1 XpEventService

XP 부여는 기존 서비스에 이벤트 후크로 연결:

```java
@Service
public class XpEventService {
    // 기존 서비스에서 호출:
    // - ReadingRecordService.create() → awardXp(userId, "RECORD", 10)
    // - UserBookService.updateMyBook(status=COMPLETED) → awardXp(userId, "COMPLETED", 100)
    // - ReviewService.create() → awardXp(userId, "REVIEW", 50)

    public void awardXp(Long userId, String action, int xp) {
        UserLevel level = getOrCreateLevel(userId);
        level.setTotalXp(level.getTotalXp() + xp);
        level.setCurrentLevelXp(level.getCurrentLevelXp() + xp);

        // 레벨업 체크
        while (level.getCurrentLevelXp() >= level.getNextLevelXp()) {
            level.setCurrentLevelXp(level.getCurrentLevelXp() - level.getNextLevelXp());
            level.setLevel(level.getLevel() + 1);
            level.setNextLevelXp(calculateNextLevelXp(level.getLevel()));
        }

        // 배지 체크
        badgeService.checkAndAward(userId, action);
    }
}
```

### 4.2 Badge Check Logic

```java
@Service
public class BadgeService {
    public void checkAndAward(Long userId, String action) {
        switch (action) {
            case "COMPLETED" -> {
                long count = userBookRepo.countByUserIdAndStatus(userId, COMPLETED);
                if (count == 1) awardIfNotEarned(userId, "FIRST_COMPLETE");
                if (count >= 10) awardIfNotEarned(userId, "BOOKWORM_10");
                if (count >= 50) awardIfNotEarned(userId, "BOOKWORM_50");
            }
            case "REVIEW" -> {
                long count = reviewRepo.countByUserId(userId);
                if (count >= 5) awardIfNotEarned(userId, "REVIEWER");
            }
            case "RECORD" -> {
                // 연속 일수 체크 (STREAK_7, STREAK_30)
                int streak = calculateStreak(userId);
                if (streak >= 7) awardIfNotEarned(userId, "STREAK_7");
                if (streak >= 30) awardIfNotEarned(userId, "STREAK_30");
            }
        }
    }
}
```

---

## 5. UI/UX Design

### 5.1 New Routes

| Route | Page | Module |
|-------|------|--------|
| `/challenges` | ChallengeList | H |
| `/challenges/:id` | ChallengeDetail | H |
| `/leaderboard` | Leaderboard | I |

### 5.2 Page UI Checklist

#### Dashboard (수정)
- [ ] 레벨/XP 진행 바 위젯 추가
- [ ] 최근 획득 배지 (최대 3개) 추가

#### UserProfile (수정)
- [ ] 레벨 표시 + XP 바
- [ ] 획득 배지 목록

#### BookDetail (수정)
- [ ] 하이라이트 탭 추가 (기존 info 탭 교체/추가)
- [ ] 타이머 위젯 (시작/정지/종료 버튼)

#### ChallengeList
- [ ] 챌린지 카드 목록 (제목, 기간, 참가자 수, 진행률)
- [ ] 챌린지 생성 버튼 -> 생성 폼
- [ ] 필터: 진행 중/완료

#### ChallengeDetail
- [ ] 챌린지 정보 (제목, 설명, 목표, 기간)
- [ ] 참가/탈퇴 버튼
- [ ] 참가자 목록 + 각 참가자 달성 현황

#### Leaderboard
- [ ] 주간/월간 탭 전환
- [ ] 랭킹 테이블 (순위, 프로필, 완독 수, 페이지 수)
- [ ] 내 순위 하이라이트

---

## 6. Backend Structure

```
domain/
├── gamification/           # [신규]
│   ├── entity/UserLevel.java, Badge.java, UserBadge.java
│   ├── repository/UserLevelRepository.java, BadgeRepository.java, UserBadgeRepository.java
│   ├── service/LevelService.java, BadgeService.java, XpEventService.java
│   ├── controller/LevelController.java, BadgeController.java, LeaderboardController.java
│   └── dto/LevelResponse.java, BadgeResponse.java, LeaderboardEntry.java
│
├── challenge/              # [신규]
│   ├── entity/Challenge.java, ChallengeParticipant.java
│   ├── repository/ChallengeRepository.java, ChallengeParticipantRepository.java
│   ├── service/ChallengeService.java
│   ├── controller/ChallengeController.java
│   └── dto/ChallengeCreateRequest.java, ChallengeResponse.java, ParticipantResponse.java
│
├── highlight/              # [신규]
│   ├── entity/Highlight.java
│   ├── repository/HighlightRepository.java
│   ├── service/HighlightService.java
│   ├── controller/HighlightController.java
│   └── dto/HighlightRequest.java, HighlightResponse.java
│
└── timer/                  # [신규]
    ├── entity/ReadingSession.java
    ├── repository/ReadingSessionRepository.java
    ├── service/TimerService.java
    ├── controller/TimerController.java
    └── dto/SessionResponse.java, StartSessionRequest.java, StopSessionRequest.java
```

**Modified files** (XP 이벤트 연동):
- `domain/record/service/ReadingRecordService.java` — XP 부여 호출 추가
- `domain/book/service/UserBookService.java` — 완독 시 XP 부여
- `domain/review/service/ReviewService.java` — 리뷰 작성 시 XP 부여

**BE 파일 수**: 신규 ~35 + 수정 ~5

---

## 7. Frontend Structure

```
src/
├── features/
│   ├── gamification/       # [신규]
│   │   ├── api.ts          # level, badge, leaderboard API
│   │   ├── LevelBadge.tsx  # 레벨+XP 바 위젯
│   │   └── BadgeList.tsx   # 배지 그리드
│   ├── challenge/          # [신규]
│   │   ├── api.ts
│   │   └── ChallengeCard.tsx
│   ├── highlight/          # [신규]
│   │   ├── api.ts
│   │   └── HighlightList.tsx
│   └── timer/              # [신규]
│       ├── api.ts
│       └── TimerWidget.tsx
│
├── pages/
│   ├── Challenges.tsx      # [신규] 챌린지 목록
│   ├── ChallengeDetail.tsx # [신규] 챌린지 상세
│   └── Leaderboard.tsx     # [신규] 리더보드
│
├── types/
│   └── gamification.ts     # [신규]
│
└── App.tsx                 # [수정] 라우트 추가
    Sidebar.tsx             # [수정] challenges, leaderboard 라우트 활성화
    Dashboard.tsx           # [수정] 레벨/배지 위젯 추가
    BookDetail.tsx          # [수정] 하이라이트 탭 + 타이머 위젯
    UserProfile.tsx         # [수정] 레벨/배지 표시
```

**FE 파일 수**: 신규 ~13 + 수정 ~5

---

## 8. Badge Seed Data

```sql
INSERT INTO badges (code, name, description, icon_url, xp_reward) VALUES
('FIRST_COMPLETE', '첫 완독', '첫 번째 책을 완독했습니다', NULL, 20),
('BOOKWORM_10', '다독가', '10권을 완독했습니다', NULL, 50),
('BOOKWORM_50', '독서왕', '50권을 완독했습니다', NULL, 100),
('STREAK_7', '7일 연속', '7일 연속 독서 기록을 남겼습니다', NULL, 30),
('STREAK_30', '30일 연속', '30일 연속 독서 기록을 남겼습니다', NULL, 100),
('REVIEWER', '리뷰어', '독후감 5편을 작성했습니다', NULL, 30),
('SOCIAL', '소셜 독서가', '10명 이상을 팔로우했습니다', NULL, 20),
('CHALLENGER', '챌린저', '챌린지를 1회 완료했습니다', NULL, 50);
```

Migration: `V2__badge_seed_data.sql`

---

## 9. Implementation Guide

### 9.1 Module Map

| Key | Module | BE Files | FE Files | Dependencies |
|-----|--------|:--------:|:--------:|-------------|
| `module-F` | 레벨/XP | ~8 | ~3 | XpEventService + 기존 서비스 수정 |
| `module-G` | 배지 | ~6 | ~2 | BadgeService + XpEventService |
| `module-H` | 챌린지 | ~8 | ~4 | 독립 |
| `module-I` | 리더보드 | ~3 | ~2 | JdbcTemplate 쿼리 |
| `module-J` | 하이라이트 | ~5 | ~2 | 독립 |
| `module-K` | 타이머 | ~5 | ~2 | 독립 |

### 9.2 Session Guide

| Session | Modules | Command | Estimated |
|:-------:|---------|---------|-----------|
| 1 | F + G | `--scope module-F,module-G` | BE ~14, FE ~5 (레벨+배지 코어) |
| 2 | H + I | `--scope module-H,module-I` | BE ~11, FE ~6 (챌린지+리더보드) |
| 3 | J + K | `--scope module-J,module-K` | BE ~10, FE ~4 (하이라이트+타이머) |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-04-04 | Initial design -- Option C selected |
