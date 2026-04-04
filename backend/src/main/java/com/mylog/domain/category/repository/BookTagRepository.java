package com.mylog.domain.category.repository;

import com.mylog.domain.category.entity.BookTag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookTagRepository extends JpaRepository<BookTag, Long> {
    List<BookTag> findByUserBookId(Long userBookId);
    void deleteByUserBookIdAndTagId(Long userBookId, Long tagId);
}
