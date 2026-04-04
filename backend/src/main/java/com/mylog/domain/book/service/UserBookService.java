package com.mylog.domain.book.service;

import com.mylog.domain.book.dto.*;
import com.mylog.domain.book.entity.*;
import com.mylog.domain.book.repository.*;
import com.mylog.domain.gamification.service.XpEventService;
import com.mylog.global.common.ApiResponse;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

// Design Ref: §4.2 — UserBook (내 서재) CRUD service
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserBookService {

    private final UserBookRepository userBookRepository;
    private final BookRepository bookRepository;
    private final XpEventService xpEventService;

    public Page<UserBookResponse> getMyBooks(Long userId, String status, Pageable pageable) {
        Page<UserBook> page;
        if (status != null && !status.isEmpty()) {
            page = userBookRepository.findByUserIdAndStatus(userId, ReadingStatus.valueOf(status), pageable);
        } else {
            page = userBookRepository.findByUserId(userId, pageable);
        }
        return page.map(UserBookResponse::from);
    }

    @Transactional
    public UserBookResponse addToShelf(Long userId, AddToShelfRequest request) {
        if (userBookRepository.existsByUserIdAndBookId(userId, request.getBookId())) {
            throw new BusinessException(ErrorCode.BOOK_ALREADY_IN_SHELF);
        }

        Book book = bookRepository.findById(request.getBookId())
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND));

        ReadingStatus status = request.getStatus() != null
                ? ReadingStatus.valueOf(request.getStatus())
                : ReadingStatus.WANT_TO_READ;

        UserBook userBook = UserBook.builder()
                .userId(userId)
                .book(book)
                .status(status)
                .currentPage(0)
                .build();

        if (status == ReadingStatus.READING) {
            userBook.setStartDate(LocalDate.now());
        }

        return UserBookResponse.from(userBookRepository.save(userBook));
    }

    public UserBookResponse getMyBook(Long userId, Long userBookId) {
        UserBook ub = userBookRepository.findByIdAndUserId(userBookId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND));
        return UserBookResponse.from(ub);
    }

    @Transactional
    public UserBookResponse updateMyBook(Long userId, Long userBookId, UpdateUserBookRequest request) {
        UserBook ub = userBookRepository.findByIdAndUserId(userBookId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND));

        if (request.getStatus() != null) {
            ReadingStatus newStatus = ReadingStatus.valueOf(request.getStatus());
            if (newStatus == ReadingStatus.READING && ub.getStartDate() == null) {
                ub.setStartDate(LocalDate.now());
            }
            if (newStatus == ReadingStatus.COMPLETED && ub.getEndDate() == null) {
                ub.setEndDate(LocalDate.now());
                if (ub.getBook().getTotalPages() != null) {
                    ub.setCurrentPage(ub.getBook().getTotalPages());
                }
            }
            ub.setStatus(newStatus);

            // Gamification: award XP and check badges on completion
            if (newStatus == ReadingStatus.COMPLETED) {
                xpEventService.onBookCompleted(userId);
            }
        }
        if (request.getRating() != null) ub.setRating(request.getRating());
        if (request.getCurrentPage() != null) ub.setCurrentPage(request.getCurrentPage());
        if (request.getStartDate() != null) ub.setStartDate(LocalDate.parse(request.getStartDate()));
        if (request.getEndDate() != null) ub.setEndDate(LocalDate.parse(request.getEndDate()));

        return UserBookResponse.from(ub);
    }

    @Transactional
    public void removeFromShelf(Long userId, Long userBookId) {
        UserBook ub = userBookRepository.findByIdAndUserId(userBookId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND));
        userBookRepository.delete(ub);
    }
}
