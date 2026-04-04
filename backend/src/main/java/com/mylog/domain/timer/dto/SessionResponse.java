package com.mylog.domain.timer.dto;

import com.mylog.domain.timer.entity.ReadingSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SessionResponse {
    private Long id;
    private Long userBookId;
    private String startTime;
    private String endTime;
    private Integer durationMinutes;
    private Integer pagesRead;

    public static SessionResponse from(ReadingSession s) {
        return SessionResponse.builder()
                .id(s.getId())
                .userBookId(s.getUserBookId())
                .startTime(s.getStartTime() != null ? s.getStartTime().toString() : null)
                .endTime(s.getEndTime() != null ? s.getEndTime().toString() : null)
                .durationMinutes(s.getDurationMinutes())
                .pagesRead(s.getPagesRead())
                .build();
    }
}
