package com.mylog.domain.feed.service;

import com.mylog.domain.feed.dto.FeedItem;
import com.mylog.domain.follow.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedService {
    private final FollowRepository followRepository;
    private final JdbcTemplate jdbcTemplate;

    public List<FeedItem> getFeed(Long userId, int page, int size) {
        int offset = page * size;

        String sql = """
            SELECT 'COMPLETED' as type, ub.user_id, u.nickname, u.profile_image_url,
                   b.id as book_id, b.title as book_title, b.cover_image_url,
                   NULL as content, ub.updated_at as created_at
            FROM user_books ub
            JOIN users u ON u.id = ub.user_id
            JOIN books b ON b.id = ub.book_id
            WHERE ub.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
              AND ub.status = 'COMPLETED'
            UNION ALL
            SELECT 'REVIEW' as type, r.user_id, u.nickname, u.profile_image_url,
                   b.id as book_id, b.title as book_title, b.cover_image_url,
                   r.title as content, r.created_at
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            JOIN user_books ub ON ub.id = r.user_book_id
            JOIN books b ON b.id = ub.book_id
            WHERE r.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)
              AND r.is_public = true
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> FeedItem.builder()
                .type(rs.getString("type"))
                .userId(rs.getLong("user_id"))
                .nickname(rs.getString("nickname"))
                .profileImageUrl(rs.getString("profile_image_url"))
                .bookId(rs.getLong("book_id"))
                .bookTitle(rs.getString("book_title"))
                .bookCoverUrl(rs.getString("cover_image_url"))
                .content(rs.getString("content"))
                .createdAt(rs.getTimestamp("created_at").toLocalDateTime())
                .build(),
                userId, userId, size, offset);
    }
}
