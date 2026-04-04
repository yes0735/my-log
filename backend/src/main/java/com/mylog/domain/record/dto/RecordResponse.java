package com.mylog.domain.record.dto;

import com.mylog.domain.record.entity.ReadingRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class RecordResponse {
    private Long id;
    private Long userBookId;
    private String readDate;
    private Integer pagesRead;
    private Integer fromPage;
    private Integer toPage;
    private String memo;
    private String createdAt;

    public static RecordResponse from(ReadingRecord r) {
        return RecordResponse.builder()
                .id(r.getId())
                .userBookId(r.getUserBookId())
                .readDate(r.getReadDate().toString())
                .pagesRead(r.getPagesRead())
                .fromPage(r.getFromPage())
                .toPage(r.getToPage())
                .memo(r.getMemo())
                .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
                .build();
    }
}
