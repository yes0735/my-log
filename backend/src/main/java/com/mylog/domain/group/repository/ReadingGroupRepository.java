package com.mylog.domain.group.repository;

import com.mylog.domain.group.entity.ReadingGroup;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingGroupRepository extends JpaRepository<ReadingGroup, Long> {

    Page<ReadingGroup> findByIsPublicTrue(Pageable pageable);
}
