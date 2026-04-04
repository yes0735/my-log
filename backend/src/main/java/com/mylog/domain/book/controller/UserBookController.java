package com.mylog.domain.book.controller;

import com.mylog.domain.book.dto.*;
import com.mylog.domain.book.service.UserBookService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

// Design Ref: §4.2 — UserBook (내 서재) CRUD endpoints
@Tag(name = "My Books", description = "내 서재 API")
@RestController
@RequestMapping("/api/v1/my/books")
@RequiredArgsConstructor
public class UserBookController {

    private final UserBookService userBookService;

    @Operation(summary = "내 서재 목록 조회")
    @GetMapping
    public ApiResponse<Page<UserBookResponse>> getMyBooks(
            Authentication auth,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 20) Pageable pageable) {
        Long userId = (Long) auth.getPrincipal();
        Page<UserBookResponse> page = userBookService.getMyBooks(userId, status, pageable);
        return ApiResponse.ok(page);
    }

    @Operation(summary = "내 서재에 책 추가")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserBookResponse> addToShelf(
            Authentication auth,
            @Valid @RequestBody AddToShelfRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(userBookService.addToShelf(userId, request));
    }

    @Operation(summary = "내 서재 책 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<UserBookResponse> getMyBook(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(userBookService.getMyBook(userId, id));
    }

    @Operation(summary = "상태/별점/페이지 수정")
    @PatchMapping("/{id}")
    public ApiResponse<UserBookResponse> updateMyBook(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody UpdateUserBookRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(userBookService.updateMyBook(userId, id, request));
    }

    @Operation(summary = "내 서재에서 책 제거")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFromShelf(
            Authentication auth,
            @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        userBookService.removeFromShelf(userId, id);
    }
}
