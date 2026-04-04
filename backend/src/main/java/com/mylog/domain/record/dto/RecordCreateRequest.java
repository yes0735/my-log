package com.mylog.domain.record.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

@Getter
public class RecordCreateRequest {
    @NotNull(message = "독서 날짜는 필수입니다")
    private String readDate;

    @NotNull(message = "읽은 페이지 수는 필수입니다")
    @Positive(message = "읽은 페이지 수는 1 이상이어야 합니다")
    private Integer pagesRead;

    private Integer fromPage;
    private Integer toPage;
    private String memo;
}
