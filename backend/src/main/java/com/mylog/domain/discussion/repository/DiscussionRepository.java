package com.mylog.domain.discussion.repository;

import com.mylog.domain.discussion.entity.Discussion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {

    Page<Discussion> findByGroupIdOrderByCreatedAtDesc(Long groupId, Pageable pageable);
}
