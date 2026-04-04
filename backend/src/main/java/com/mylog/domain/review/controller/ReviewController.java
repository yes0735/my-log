package com.mylog.domain.review.controller;

import com.mylog.domain.review.dto.ReviewCreateRequest;
import com.mylog.domain.review.dto.ReviewResponse;
import com.mylog.domain.review.service.ReviewService;
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

import java.util.List;

// Design Ref: §4.2 — Review CRUD endpoints
@Tag(name = "Reviews", description = "독후감 API")
@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "책별 독후감 목록")
    @GetMapping("/api/v1/my/books/{bookId}/reviews")
    public ApiResponse<List<ReviewResponse>> getReviewsByBook(
            Authentication auth, @PathVariable Long bookId) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(reviewService.getReviewsByBook(userId, bookId));
    }

    @Operation(summary = "독후감 작성")
    @PostMapping("/api/v1/my/books/{bookId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> createReview(
            Authentication auth, @PathVariable Long bookId,
            @Valid @RequestBody ReviewCreateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(reviewService.createReview(userId, bookId, request));
    }

    @Operation(summary = "내 독후감 전체 목록")
    @GetMapping("/api/v1/my/reviews")
    public ApiResponse<List<ReviewResponse>> getMyReviews(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(reviewService.getMyReviews(userId));
    }

    @Operation(summary = "독후감 수정")
    @PutMapping("/api/v1/reviews/{id}")
    public ApiResponse<ReviewResponse> updateReview(
            Authentication auth, @PathVariable Long id,
            @Valid @RequestBody ReviewCreateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(reviewService.updateReview(userId, id, request));
    }

    @Operation(summary = "독후감 삭제")
    @DeleteMapping("/api/v1/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(Authentication auth, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        reviewService.deleteReview(userId, id);
    }

    @Operation(summary = "공개 독후감 피드")
    @GetMapping("/api/v1/reviews/public")
    public ApiResponse<Page<ReviewResponse>> getPublicReviews(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.ok(reviewService.getPublicReviews(pageable));
    }
}
