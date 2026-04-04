package com.mylog.domain.highlight.repository;

import com.mylog.domain.highlight.entity.Highlight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HighlightRepository extends JpaRepository<Highlight, Long> {
    List<Highlight> findByUserBookIdOrderByPageNumberAsc(Long userBookId);
    long countByUserBookId(Long userBookId);
}
