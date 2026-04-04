package com.mylog.domain.book.repository;

import com.mylog.domain.book.entity.ReadingStatus;
import com.mylog.domain.book.entity.UserBook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserBookRepository extends JpaRepository<UserBook, Long> {
    Page<UserBook> findByUserId(Long userId, Pageable pageable);
    Page<UserBook> findByUserIdAndStatus(Long userId, ReadingStatus status, Pageable pageable);
    Optional<UserBook> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndBookId(Long userId, Long bookId);
    long countByUserIdAndStatus(Long userId, ReadingStatus status);
    long countByUserId(Long userId);
}
