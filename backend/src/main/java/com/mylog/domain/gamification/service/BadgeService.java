package com.mylog.domain.gamification.service;

import com.mylog.domain.book.entity.ReadingStatus;
import com.mylog.domain.book.repository.UserBookRepository;
import com.mylog.domain.follow.repository.FollowRepository;
import com.mylog.domain.gamification.dto.BadgeResponse;
import com.mylog.domain.gamification.entity.Badge;
import com.mylog.domain.gamification.entity.UserBadge;
import com.mylog.domain.gamification.repository.BadgeRepository;
import com.mylog.domain.gamification.repository.UserBadgeRepository;
import com.mylog.domain.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserBookRepository userBookRepository;
    private final ReviewRepository reviewRepository;
    private final FollowRepository followRepository;
    private final LevelService levelService;
    private final JdbcTemplate jdbcTemplate;

    public List<BadgeResponse> getMyBadges(Long userId) {
        List<UserBadge> earned = userBadgeRepository.findByUserId(userId);
        return earned.stream().map(ub -> {
            Badge badge = badgeRepository.findById(ub.getBadgeId()).orElse(null);
            if (badge == null) return null;
            return BadgeResponse.builder()
                    .id(badge.getId()).code(badge.getCode()).name(badge.getName())
                    .description(badge.getDescription()).iconUrl(badge.getIconUrl())
                    .xpReward(badge.getXpReward()).earned(true).earnedAt(ub.getEarnedAt())
                    .build();
        }).filter(Objects::nonNull).toList();
    }

    public List<BadgeResponse> getAllBadges(Long userId) {
        List<Badge> all = badgeRepository.findAll();
        List<UserBadge> earned = userBadgeRepository.findByUserId(userId);
        Set<Long> earnedIds = earned.stream().map(UserBadge::getBadgeId).collect(Collectors.toSet());

        return all.stream().map(b -> BadgeResponse.builder()
                .id(b.getId()).code(b.getCode()).name(b.getName())
                .description(b.getDescription()).iconUrl(b.getIconUrl())
                .xpReward(b.getXpReward())
                .earned(earnedIds.contains(b.getId()))
                .earnedAt(earned.stream().filter(ub -> ub.getBadgeId().equals(b.getId()))
                        .findFirst().map(UserBadge::getEarnedAt).orElse(null))
                .build()
        ).toList();
    }

    @Transactional
    public void checkAndAward(Long userId, String action) {
        switch (action) {
            case "COMPLETED" -> {
                long completedCount = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.COMPLETED);
                if (completedCount >= 1) awardIfNotEarned(userId, "FIRST_COMPLETE");
                if (completedCount >= 10) awardIfNotEarned(userId, "BOOKWORM_10");
                if (completedCount >= 50) awardIfNotEarned(userId, "BOOKWORM_50");
            }
            case "REVIEW" -> {
                long reviewCount = reviewRepository.countByUserId(userId);
                if (reviewCount >= 5) awardIfNotEarned(userId, "REVIEWER");
            }
            case "RECORD" -> {
                int streak = calculateStreak(userId);
                if (streak >= 7) awardIfNotEarned(userId, "STREAK_7");
                if (streak >= 30) awardIfNotEarned(userId, "STREAK_30");
            }
            case "FOLLOW" -> {
                long followingCount = followRepository.countByFollowerId(userId);
                if (followingCount >= 10) awardIfNotEarned(userId, "SOCIAL");
            }
            default -> { /* no-op */ }
        }
    }

    private void awardIfNotEarned(Long userId, String badgeCode) {
        Badge badge = badgeRepository.findByCode(badgeCode).orElse(null);
        if (badge == null) return;
        if (userBadgeRepository.existsByUserIdAndBadgeId(userId, badge.getId())) return;

        userBadgeRepository.save(UserBadge.builder()
                .userId(userId).badgeId(badge.getId()).build());

        levelService.addXp(userId, badge.getXpReward());
    }

    private int calculateStreak(Long userId) {
        String sql = """
                SELECT COUNT(*) FROM (
                    SELECT DISTINCT rr.read_date
                    FROM reading_records rr
                    JOIN user_books ub ON rr.user_book_id = ub.id
                    WHERE ub.user_id = ?
                      AND rr.read_date <= CURRENT_DATE
                      AND rr.read_date > CURRENT_DATE - INTERVAL '365 days'
                    ORDER BY rr.read_date DESC
                ) AS dates
                WHERE read_date >= (
                    SELECT COALESCE(
                        (SELECT d1.read_date + INTERVAL '1 day'
                         FROM (
                             SELECT DISTINCT rr2.read_date
                             FROM reading_records rr2
                             JOIN user_books ub2 ON rr2.user_book_id = ub2.id
                             WHERE ub2.user_id = ?
                         ) d1
                         WHERE NOT EXISTS (
                             SELECT 1 FROM (
                                 SELECT DISTINCT rr3.read_date
                                 FROM reading_records rr3
                                 JOIN user_books ub3 ON rr3.user_book_id = ub3.id
                                 WHERE ub3.user_id = ?
                             ) d2
                             WHERE d2.read_date = d1.read_date + INTERVAL '1 day'
                         )
                         AND d1.read_date < CURRENT_DATE
                         ORDER BY d1.read_date DESC
                         LIMIT 1),
                        '1900-01-01'::date
                    )
                )
                """;
        try {
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId, userId, userId);
            return count != null ? count : 0;
        } catch (Exception e) {
            return 0;
        }
    }
}
