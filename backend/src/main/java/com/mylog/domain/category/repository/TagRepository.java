package com.mylog.domain.category.repository;

import com.mylog.domain.category.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByUserIdOrderByNameAsc(Long userId);
}
