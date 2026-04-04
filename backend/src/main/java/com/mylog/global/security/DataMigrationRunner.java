package com.mylog.global.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

// Design Ref: §2.4 — One-time migration: populate email_hash for existing users
// This runner sets email_hash for users where it is NULL (pre-encryption users).
// After encryption is enabled via @Converter, new users get email_hash at signup.
@Slf4j
@Component
@RequiredArgsConstructor
public class DataMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;
    private final AesEncryptor aesEncryptor;

    @Override
    public void run(ApplicationArguments args) {
        List<Map<String, Object>> users = jdbcTemplate.queryForList(
                "SELECT id, email FROM users WHERE email_hash IS NULL"
        );

        if (users.isEmpty()) {
            log.info("[DataMigration] No users need email_hash migration.");
            return;
        }

        log.info("[DataMigration] Migrating email_hash for {} users...", users.size());

        int migrated = 0;
        for (Map<String, Object> row : users) {
            Long id = ((Number) row.get("id")).longValue();
            String email = (String) row.get("email");

            try {
                // email might already be encrypted if @Converter ran — try decrypt first
                String plainEmail;
                try {
                    plainEmail = aesEncryptor.decrypt(email);
                } catch (Exception e) {
                    // Not encrypted yet — use as-is
                    plainEmail = email;
                }

                String emailHash = AesEncryptor.sha256(plainEmail);
                jdbcTemplate.update(
                        "UPDATE users SET email_hash = ? WHERE id = ?",
                        emailHash, id
                );
                migrated++;
            } catch (Exception e) {
                log.error("[DataMigration] Failed to migrate user id={}: {}", id, e.getMessage());
            }
        }

        log.info("[DataMigration] Migrated {}/{} users.", migrated, users.size());
    }
}
