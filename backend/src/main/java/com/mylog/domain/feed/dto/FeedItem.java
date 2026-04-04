package com.mylog.domain.feed.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Builder @AllArgsConstructor
public class FeedItem {
    private String type;          // COMPLETED, REVIEW, RECORD
    private Long userId;
    private String nickname;
    private String profileImageUrl;
    private Long bookId;
    private String bookTitle;
    private String bookCoverUrl;
    private String content;       // review title or record memo
    private LocalDateTime createdAt;
}
