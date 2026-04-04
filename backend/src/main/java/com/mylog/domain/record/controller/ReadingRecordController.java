package com.mylog.domain.record.controller;

import com.mylog.domain.record.dto.RecordCreateRequest;
import com.mylog.domain.record.dto.RecordResponse;
import com.mylog.domain.record.service.ReadingRecordService;
import com.mylog.global.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Design Ref: §4.2 — ReadingRecord CRUD endpoints
@Tag(name = "Reading Records", description = "독서 기록 API")
@RestController
@RequestMapping("/api/v1/my/books/{bookId}/records")
@RequiredArgsConstructor
public class ReadingRecordController {

    private final ReadingRecordService recordService;

    @Operation(summary = "독서 기록 목록")
    @GetMapping
    public ApiResponse<List<RecordResponse>> getRecords(
            Authentication auth, @PathVariable Long bookId) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(recordService.getRecords(userId, bookId));
    }

    @Operation(summary = "독서 기록 추가")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RecordResponse> createRecord(
            Authentication auth, @PathVariable Long bookId,
            @Valid @RequestBody RecordCreateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(recordService.createRecord(userId, bookId, request));
    }

    @Operation(summary = "독서 기록 수정")
    @PutMapping("/{id}")
    public ApiResponse<RecordResponse> updateRecord(
            Authentication auth, @PathVariable Long bookId, @PathVariable Long id,
            @Valid @RequestBody RecordCreateRequest request) {
        Long userId = (Long) auth.getPrincipal();
        return ApiResponse.ok(recordService.updateRecord(userId, bookId, id, request));
    }

    @Operation(summary = "독서 기록 삭제")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRecord(
            Authentication auth, @PathVariable Long bookId, @PathVariable Long id) {
        Long userId = (Long) auth.getPrincipal();
        recordService.deleteRecord(userId, bookId, id);
    }
}
