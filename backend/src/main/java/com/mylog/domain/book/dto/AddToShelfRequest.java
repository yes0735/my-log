package com.mylog.domain.book.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class AddToShelfRequest {
    @NotNull(message = "책 ID는 필수입니다")
    private Long bookId;
    private String status; // WANT_TO_READ (default), READING, COMPLETED
}
