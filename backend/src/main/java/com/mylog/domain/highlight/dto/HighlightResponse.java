package com.mylog.domain.highlight.dto;

import com.mylog.domain.highlight.entity.Highlight;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class HighlightResponse {
    private Long id;
    private Long userBookId;
    private Integer pageNumber;
    private String content;
    private String memo;
    private String createdAt;

    public static HighlightResponse from(Highlight h) {
        return HighlightResponse.builder()
                .id(h.getId())
                .userBookId(h.getUserBookId())
                .pageNumber(h.getPageNumber())
                .content(h.getContent())
                .memo(h.getMemo())
                .createdAt(h.getCreatedAt() != null ? h.getCreatedAt().toString() : null)
                .build();
    }
}
