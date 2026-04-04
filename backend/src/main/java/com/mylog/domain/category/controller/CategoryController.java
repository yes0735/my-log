package com.mylog.domain.category.controller;

import com.mylog.domain.category.dto.*;
import com.mylog.domain.category.service.CategoryService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// Design Ref: §4.2 — Categories & Tags CRUD endpoints
@Tag(name = "Categories & Tags", description = "카테고리/태그 API")
@RestController
@RequestMapping("/api/v1/my")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @Operation(summary = "내 카테고리 목록")
    @GetMapping("/categories")
    public ApiResponse<List<CategoryResponse>> getCategories(Authentication auth) {
        return ApiResponse.ok(categoryService.getCategories((Long) auth.getPrincipal()));
    }

    @Operation(summary = "카테고리 생성")
    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CategoryResponse> createCategory(Authentication auth, @Valid @RequestBody CategoryRequest req) {
        return ApiResponse.ok(categoryService.createCategory((Long) auth.getPrincipal(), req));
    }

    @Operation(summary = "카테고리 수정")
    @PutMapping("/categories/{id}")
    public ApiResponse<CategoryResponse> updateCategory(Authentication auth, @PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
        return ApiResponse.ok(categoryService.updateCategory((Long) auth.getPrincipal(), id, req));
    }

    @Operation(summary = "카테고리 삭제")
    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(Authentication auth, @PathVariable Long id) {
        categoryService.deleteCategory((Long) auth.getPrincipal(), id);
    }

    @Operation(summary = "내 태그 목록")
    @GetMapping("/tags")
    public ApiResponse<List<TagResponse>> getTags(Authentication auth) {
        return ApiResponse.ok(categoryService.getTags((Long) auth.getPrincipal()));
    }

    @Operation(summary = "태그 생성")
    @PostMapping("/tags")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TagResponse> createTag(Authentication auth, @Valid @RequestBody TagRequest req) {
        return ApiResponse.ok(categoryService.createTag((Long) auth.getPrincipal(), req));
    }

    @Operation(summary = "태그 삭제")
    @DeleteMapping("/tags/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTag(Authentication auth, @PathVariable Long id) {
        categoryService.deleteTag((Long) auth.getPrincipal(), id);
    }
}
