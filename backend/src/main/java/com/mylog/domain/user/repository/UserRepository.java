package com.mylog.domain.user.repository;

import com.mylog.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// Design Ref: §3.3 — email_hash based lookup for encrypted email
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    Optional<User> findByEmailHash(String emailHash);
    boolean existsByEmailHash(String emailHash);
}
