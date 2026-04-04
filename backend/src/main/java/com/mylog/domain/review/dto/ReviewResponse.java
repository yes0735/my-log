package com.mylog.domain.review.dto;

import com.mylog.domain.review.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long userBookId;
    private Long userId;
    private String title;
    private String content;
    private Boolean isPublic;
    private String createdAt;
    private String updatedAt;

    public static ReviewResponse from(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .userBookId(r.getUserBookId())
                .userId(r.getUserId())
                .title(r.getTitle())
                .content(r.getContent())
                .isPublic(r.getIsPublic())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
                .updatedAt(r.getUpdatedAt() != null ? r.getUpdatedAt().toString() : null)
                .build();
    }
}
