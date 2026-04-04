package com.mylog.domain.discussion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class CommentResponse {

    private Long id;
    private Long discussionId;
    private Long userId;
    private String authorNickname;
    private String authorProfileImageUrl;
    private String content;
    private Long parentId;
    private LocalDateTime createdAt;
}
