package com.mylog.domain.gamification.service;

import com.mylog.domain.gamification.dto.LeaderboardEntry;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final JdbcTemplate jdbcTemplate;

    public List<LeaderboardEntry> getLeaderboard(String period) {
        LocalDate startDate = calculateStartDate(period);

        String sql = """
                SELECT u.id as user_id, u.nickname, u.profile_image_url,
                       COUNT(CASE WHEN ub.status = 'COMPLETED' THEN 1 END) as completed_books,
                       COALESCE(SUM(rr.pages_read), 0) as pages_read
                FROM users u
                LEFT JOIN user_books ub ON ub.user_id = u.id
                  AND ub.status = 'COMPLETED'
                  AND ub.updated_at >= ?
                LEFT JOIN reading_records rr ON rr.user_book_id = ub.id
                  AND rr.read_date >= ?
                GROUP BY u.id, u.nickname, u.profile_image_url
                HAVING COUNT(CASE WHEN ub.status = 'COMPLETED' THEN 1 END) > 0
                ORDER BY completed_books DESC, pages_read DESC
                LIMIT 20
                """;

        AtomicInteger rankCounter = new AtomicInteger(1);

        return jdbcTemplate.query(sql, (rs, rowNum) ->
                LeaderboardEntry.builder()
                        .rank(rankCounter.getAndIncrement())
                        .userId(rs.getLong("user_id"))
                        .nickname(rs.getString("nickname"))
                        .profileImageUrl(rs.getString("profile_image_url"))
                        .completedBooks(rs.getInt("completed_books"))
                        .pagesRead(rs.getInt("pages_read"))
                        .build(),
                startDate, startDate
        );
    }

    private LocalDate calculateStartDate(String period) {
        LocalDate today = LocalDate.now();
        if ("month".equalsIgnoreCase(period)) {
            return today.with(TemporalAdjusters.firstDayOfMonth());
        }
        // Default: week
        return today.minusDays(7);
    }
}
