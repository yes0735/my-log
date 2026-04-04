package com.mylog.domain.category.repository;

import com.mylog.domain.category.entity.BookCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookCategoryRepository extends JpaRepository<BookCategory, Long> {
    List<BookCategory> findByUserBookId(Long userBookId);
    void deleteByUserBookIdAndCategoryId(Long userBookId, Long categoryId);
}
