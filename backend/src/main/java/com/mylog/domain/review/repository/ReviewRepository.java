package com.mylog.domain.review.repository;

import com.mylog.domain.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByUserBookIdOrderByCreatedAtDesc(Long userBookId);
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Review> findByIsPublicTrueOrderByCreatedAtDesc(Pageable pageable);
    Optional<Review> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
}
