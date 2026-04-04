package com.mylog.domain.book.dto;

import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class UpdateUserBookRequest {
    private String status;
    private BigDecimal rating;
    private Integer currentPage;
    private String startDate;
    private String endDate;
}
