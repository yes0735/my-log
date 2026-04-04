package com.mylog.domain.group.dto;

import com.mylog.domain.group.entity.ReadingGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class GroupResponse {

    private Long id;
    private String name;
    private String description;
    private Long creatorId;
    private String creatorNickname;
    private Integer maxMembers;
    private Boolean isPublic;
    private long memberCount;
    private Boolean isMember;
    private LocalDateTime createdAt;

    public static GroupResponse from(ReadingGroup g, String creatorNickname, long memberCount, boolean isMember) {
        return GroupResponse.builder()
                .id(g.getId())
                .name(g.getName())
                .description(g.getDescription())
                .creatorId(g.getCreatorId())
                .creatorNickname(creatorNickname)
                .maxMembers(g.getMaxMembers())
                .isPublic(g.getIsPublic())
                .memberCount(memberCount)
                .isMember(isMember)
                .createdAt(g.getCreatedAt())
                .build();
    }
}
