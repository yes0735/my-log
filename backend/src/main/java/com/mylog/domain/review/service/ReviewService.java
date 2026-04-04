package com.mylog.domain.review.service;

import com.mylog.domain.book.repository.UserBookRepository;
import com.mylog.domain.gamification.service.XpEventService;
import com.mylog.domain.review.dto.ReviewCreateRequest;
import com.mylog.domain.review.dto.ReviewResponse;
import com.mylog.domain.review.entity.Review;
import com.mylog.domain.review.repository.ReviewRepository;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// Design Ref: §4.2 — Review CRUD service
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserBookRepository userBookRepository;
    private final XpEventService xpEventService;

    public List<ReviewResponse> getReviewsByBook(Long userId, Long userBookId) {
        userBookRepository.findByIdAndUserId(userBookId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND));
        return reviewRepository.findByUserBookIdOrderByCreatedAtDesc(userBookId)
                .stream().map(ReviewResponse::from).toList();
    }

    public List<ReviewResponse> getMyReviews(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(ReviewResponse::from).toList();
    }

    public Page<ReviewResponse> getPublicReviews(Pageable pageable) {
        return reviewRepository.findByIsPublicTrueOrderByCreatedAtDesc(pageable)
                .map(ReviewResponse::from);
    }

    @Transactional
    public ReviewResponse createReview(Long userId, Long userBookId, ReviewCreateRequest request) {
        userBookRepository.findByIdAndUserId(userBookId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND));

        Review review = Review.builder()
                .userBookId(userBookId)
                .userId(userId)
                .title(request.getTitle())
                .content(request.getContent())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .build();

        ReviewResponse response = ReviewResponse.from(reviewRepository.save(review));

        // Gamification: award XP and check badges
        xpEventService.onReviewCreated(userId);

        return response;
    }

    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, ReviewCreateRequest request) {
        Review review = reviewRepository.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND, "독후감을 찾을 수 없습니다"));

        review.setTitle(request.getTitle());
        review.setContent(request.getContent());
        if (request.getIsPublic() != null) review.setIsPublic(request.getIsPublic());

        return ReviewResponse.from(review);
    }

    @Transactional
    public void deleteReview(Long userId, Long reviewId) {
        Review review = reviewRepository.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BOOK_NOT_FOUND, "독후감을 찾을 수 없습니다"));
        reviewRepository.delete(review);
    }
}
