package com.mylog.domain.discussion.dto;

import com.mylog.domain.discussion.entity.Discussion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class DiscussionResponse {

    private Long id;
    private Long groupId;
    private Long userId;
    private String authorNickname;
    private String authorProfileImageUrl;
    private String title;
    private String content;
    private long commentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DiscussionResponse from(Discussion d, String nickname, String profileImageUrl, long commentCount) {
        return DiscussionResponse.builder()
                .id(d.getId())
                .groupId(d.getGroupId())
                .userId(d.getUserId())
                .authorNickname(nickname)
                .authorProfileImageUrl(profileImageUrl)
                .title(d.getTitle())
                .content(d.getContent())
                .commentCount(commentCount)
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
