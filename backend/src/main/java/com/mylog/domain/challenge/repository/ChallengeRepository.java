package com.mylog.domain.challenge.repository;

import com.mylog.domain.challenge.entity.Challenge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    Page<Challenge> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
