package com.mylog.domain.stats.service;

import com.mylog.domain.book.entity.ReadingStatus;
import com.mylog.domain.book.repository.UserBookRepository;
import com.mylog.domain.stats.dto.GenreStats;
import com.mylog.domain.stats.dto.MonthlyStats;
import com.mylog.domain.stats.dto.StatsSummary;
import com.mylog.domain.stats.dto.YearlyStats;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

// Design Ref: §4.2 — Stats service (query-based, no entity)
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final UserBookRepository userBookRepository;
    private final EntityManager em;

    public StatsSummary getSummary(Long userId) {
        long total = userBookRepository.findByUserId(userId, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
        long completed = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.COMPLETED);
        long reading = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.READING);
        long wantToRead = userBookRepository.countByUserIdAndStatus(userId, ReadingStatus.WANT_TO_READ);

        // Total pages read from reading_records
        Query pagesQuery = em.createNativeQuery(
                "SELECT COALESCE(SUM(rr.pages_read), 0) FROM reading_records rr " +
                "JOIN user_books ub ON rr.user_book_id = ub.id WHERE ub.user_id = :userId");
        pagesQuery.setParameter("userId", userId);
        long totalPages = ((Number) pagesQuery.getSingleResult()).longValue();

        // Total records
        Query recordsQuery = em.createNativeQuery(
                "SELECT COUNT(*) FROM reading_records rr " +
                "JOIN user_books ub ON rr.user_book_id = ub.id WHERE ub.user_id = :userId");
        recordsQuery.setParameter("userId", userId);
        long totalRecords = ((Number) recordsQuery.getSingleResult()).longValue();

        // Average rating
        Query ratingQuery = em.createNativeQuery(
                "SELECT COALESCE(AVG(rating), 0) FROM user_books WHERE user_id = :userId AND rating IS NOT NULL");
        ratingQuery.setParameter("userId", userId);
        double avgRating = ((Number) ratingQuery.getSingleResult()).doubleValue();

        return StatsSummary.builder()
                .totalBooks(total)
                .completedBooks(completed)
                .readingBooks(reading)
                .wantToReadBooks(wantToRead)
                .totalPagesRead(totalPages)
                .totalRecords(totalRecords)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .build();
    }

    public List<MonthlyStats> getMonthlyStats(Long userId, int year) {
        Query query = em.createNativeQuery(
                "SELECT EXTRACT(MONTH FROM rr.read_date)::int AS month, " +
                "COUNT(DISTINCT CASE WHEN ub.status = 'COMPLETED' AND EXTRACT(YEAR FROM ub.end_date) = :year " +
                "  AND EXTRACT(MONTH FROM ub.end_date) = EXTRACT(MONTH FROM rr.read_date) THEN ub.id END) AS books_completed, " +
                "COALESCE(SUM(rr.pages_read), 0) AS pages_read, " +
                "COUNT(rr.id) AS record_count " +
                "FROM reading_records rr " +
                "JOIN user_books ub ON rr.user_book_id = ub.id " +
                "WHERE ub.user_id = :userId AND EXTRACT(YEAR FROM rr.read_date) = :year " +
                "GROUP BY EXTRACT(MONTH FROM rr.read_date) " +
                "ORDER BY month");
        query.setParameter("userId", userId);
        query.setParameter("year", year);

        List<Object[]> results = query.getResultList();
        List<MonthlyStats> stats = new ArrayList<>();

        // Fill all 12 months
        java.util.Map<Integer, MonthlyStats> monthMap = new java.util.HashMap<>();
        for (Object[] row : results) {
            int month = ((Number) row[0]).intValue();
            monthMap.put(month, MonthlyStats.builder()
                    .month(month)
                    .booksCompleted(((Number) row[1]).longValue())
                    .pagesRead(((Number) row[2]).longValue())
                    .recordCount(((Number) row[3]).longValue())
                    .build());
        }
        for (int m = 1; m <= 12; m++) {
            stats.add(monthMap.getOrDefault(m, MonthlyStats.builder()
                    .month(m).booksCompleted(0).pagesRead(0).recordCount(0).build()));
        }
        return stats;
    }

    public List<GenreStats> getGenreDistribution(Long userId) {
        Query query = em.createNativeQuery(
                "SELECT c.name, COUNT(bc.id) AS cnt " +
                "FROM book_categories bc " +
                "JOIN categories c ON bc.category_id = c.id " +
                "JOIN user_books ub ON bc.user_book_id = ub.id " +
                "WHERE ub.user_id = :userId " +
                "GROUP BY c.name " +
                "ORDER BY cnt DESC");
        query.setParameter("userId", userId);

        List<Object[]> results = query.getResultList();
        List<GenreStats> genres = new ArrayList<>();
        for (Object[] row : results) {
            genres.add(GenreStats.builder()
                    .name((String) row[0])
                    .count(((Number) row[1]).longValue())
                    .build());
        }
        return genres;
    }

    public YearlyStats getYearlyStats(Long userId, int year) {
        // Total books added this year
        Query totalQuery = em.createNativeQuery(
                "SELECT COUNT(*) FROM user_books WHERE user_id = :userId " +
                "AND EXTRACT(YEAR FROM created_at) = :year");
        totalQuery.setParameter("userId", userId);
        totalQuery.setParameter("year", year);
        long totalBooks = ((Number) totalQuery.getSingleResult()).longValue();

        // Completed books this year
        Query completedQuery = em.createNativeQuery(
                "SELECT COUNT(*) FROM user_books WHERE user_id = :userId " +
                "AND status = 'COMPLETED' AND EXTRACT(YEAR FROM end_date) = :year");
        completedQuery.setParameter("userId", userId);
        completedQuery.setParameter("year", year);
        long completedBooks = ((Number) completedQuery.getSingleResult()).longValue();

        // Total pages read this year
        Query pagesQuery = em.createNativeQuery(
                "SELECT COALESCE(SUM(rr.pages_read), 0) FROM reading_records rr " +
                "JOIN user_books ub ON rr.user_book_id = ub.id " +
                "WHERE ub.user_id = :userId AND EXTRACT(YEAR FROM rr.read_date) = :year");
        pagesQuery.setParameter("userId", userId);
        pagesQuery.setParameter("year", year);
        long totalPagesRead = ((Number) pagesQuery.getSingleResult()).longValue();

        // Average rating for books completed this year
        Query ratingQuery = em.createNativeQuery(
                "SELECT COALESCE(AVG(rating), 0) FROM user_books " +
                "WHERE user_id = :userId AND rating IS NOT NULL " +
                "AND status = 'COMPLETED' AND EXTRACT(YEAR FROM end_date) = :year");
        ratingQuery.setParameter("userId", userId);
        ratingQuery.setParameter("year", year);
        double avgRating = ((Number) ratingQuery.getSingleResult()).doubleValue();

        return YearlyStats.builder()
                .totalBooks(totalBooks)
                .completedBooks(completedBooks)
                .totalPagesRead(totalPagesRead)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .build();
    }
}
