package com.mylog.domain.record.service;

import com.mylog.domain.book.entity.UserBook;
import com.mylog.domain.book.repository.UserBookRepository;
import com.mylog.domain.gamification.service.XpEventService;
import com.mylog.domain.record.dto.RecordCreateRequest;
import com.mylog.domain.record.dto.RecordResponse;
import com.mylog.domain.record.entity.ReadingRecord;
import com.mylog.domain.record.repository.ReadingRecordRepository;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

// Design Ref: §4.2 — ReadingRecord CRUD service
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReadingRecordService {

    private final ReadingRecordRepository recordRepository;
    private final UserBookRepository userBookRepository;
    private final XpEventService xpEventService;

    public List<RecordResponse> getRecords(Long userId, Long userBookId) {
        verifyOwnership(userId, userBookId);
        return recordRepository.findByUserBookIdOrderByReadDateDesc(userBookId)
                .stream().map(RecordResponse::from).toList();
    }

    @Transactional
    public RecordResponse createRecord(Long userId, Long userBookId, RecordCreateRequest request) {
        UserBook userBook = verifyOwnership(userId, userBookId);

        ReadingRecord record = ReadingRecord.builder()
                .userBookId(userBookId)
                .readDate(LocalDate.parse(request.getReadDate()))
                .pagesRead(request.getPagesRead())
                .fromPage(request.getFromPage())
                .toPage(request.getToPage())
                .memo(request.getMemo())
                .build();

        ReadingRecord saved = recordRepository.save(record);

        // Update currentPage on UserBook
        if (request.getToPage() != null && request.getToPage() > userBook.getCurrentPage()) {
            userBook.setCurrentPage(request.getToPage());
        }

        // Gamification: award XP and check badges
        xpEventService.onRecordCreated(userId);

        return RecordResponse.from(saved);
    }

    @Transactional
    public RecordResponse updateRecord(Long userId, Long userBookId, Long recordId, RecordCreateRequest request) {
        verifyOwnership(userId, userBookId);
        ReadingRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND, "독서 기록을 찾을 수 없습니다"));

        record.setReadDate(LocalDate.parse(request.getReadDate()));
        record.setPagesRead(request.getPagesRead());
        record.setFromPage(request.getFromPage());
        record.setToPage(request.getToPage());
        record.setMemo(request.getMemo());

        return RecordResponse.from(record);
    }

    @Transactional
    public void deleteRecord(Long userId, Long userBookId, Long recordId) {
        verifyOwnership(userId, userBookId);
        recordRepository.deleteById(recordId);
    }

    private UserBook verifyOwnership(Long userId, Long userBookId) {
        return userBookRepository.findByIdAndUserId(userBookId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND));
    }
}
