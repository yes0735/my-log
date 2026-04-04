package com.mylog.global.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

// Design Ref: §4.1 — Unified API response format
@Getter
@Builder
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private T data;
    private PageInfo pagination;
    private ErrorInfo error;

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder().data(data).build();
    }

    public static <T> ApiResponse<T> ok(T data, PageInfo pagination) {
        return ApiResponse.<T>builder().data(data).pagination(pagination).build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .error(new ErrorInfo(code, message, null))
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return ApiResponse.<T>builder()
                .error(new ErrorInfo(code, message, details))
                .build();
    }

    @Getter
    @AllArgsConstructor
    public static class ErrorInfo {
        private String code;
        private String message;
        @JsonInclude(JsonInclude.Include.NON_NULL)
        private Object details;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class PageInfo {
        private int page;
        private int size;
        private long total;
        private int totalPages;
    }
}
