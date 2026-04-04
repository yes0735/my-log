-- Design Ref: §2.3 — Security enhancements migration
-- 1. email_hash column for encrypted email search
-- 2. refresh_tokens table for DB-managed refresh tokens

-- Add email_hash column (nullable initially for migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_hash VARCHAR(64);

-- Remove unique constraint from email (encrypted values differ each time due to GCM IV)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(36) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
