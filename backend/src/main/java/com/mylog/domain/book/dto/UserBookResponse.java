package com.mylog.domain.book.dto;

import com.mylog.domain.book.entity.UserBook;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
@AllArgsConstructor
public class UserBookResponse {
    private Long id;
    private BookResponse book;
    private String status;
    private BigDecimal rating;
    private Integer currentPage;
    private String startDate;
    private String endDate;
    private String createdAt;

    public static UserBookResponse from(UserBook ub) {
        return UserBookResponse.builder()
                .id(ub.getId())
                .book(BookResponse.from(ub.getBook()))
                .status(ub.getStatus().name())
                .rating(ub.getRating())
                .currentPage(ub.getCurrentPage())
                .startDate(ub.getStartDate() != null ? ub.getStartDate().toString() : null)
                .endDate(ub.getEndDate() != null ? ub.getEndDate().toString() : null)
                .createdAt(ub.getCreatedAt() != null ? ub.getCreatedAt().toString() : null)
                .build();
    }
}
