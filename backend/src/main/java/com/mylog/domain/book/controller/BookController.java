package com.mylog.domain.book.controller;

import com.mylog.domain.book.dto.BookCreateRequest;
import com.mylog.domain.book.dto.BookResponse;
import com.mylog.domain.book.dto.BookUpdateRequest;
import com.mylog.domain.book.service.BookService;
import com.mylog.global.common.ApiResponse;
import com.mylog.infra.booksearch.BookSearchResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Design Ref: §4.2 — Book search + registration endpoints
@Tag(name = "Books", description = "책 검색/등록 API")
@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @Operation(summary = "도서 검색 (네이버 API)")
    @GetMapping("/search")
    public ApiResponse<List<BookSearchResult>> searchBooks(@RequestParam String q) {
        return ApiResponse.ok(bookService.searchBooks(q));
    }

    @Operation(summary = "책 수동 등록")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BookResponse> createBook(
            @Valid @RequestBody BookCreateRequest request,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(bookService.createBook(request, userId));
    }

    @Operation(summary = "책 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<BookResponse> getBook(@PathVariable Long id) {
        return ApiResponse.ok(bookService.getBook(id));
    }

    @Operation(summary = "책 정보 수정")
    @PatchMapping("/{id}")
    public ApiResponse<BookResponse> updateBook(
            @PathVariable Long id,
            @RequestBody BookUpdateRequest request) {
        return ApiResponse.ok(bookService.updateBook(id, request));
    }
}
