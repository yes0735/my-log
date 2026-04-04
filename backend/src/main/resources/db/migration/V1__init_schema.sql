-- Design Ref: §3.3 — Phase 1 core tables

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255),
    nickname VARCHAR(50) NOT NULL,
    profile_image_url VARCHAR(500),
    provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    provider_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE books (
    id BIGSERIAL PRIMARY KEY,
    isbn VARCHAR(13) UNIQUE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    cover_image_url VARCHAR(500),
    total_pages INTEGER,
    description TEXT,
    published_date DATE,
    created_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_books (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id),
    status VARCHAR(20) NOT NULL DEFAULT 'WANT_TO_READ',
    rating DECIMAL(2,1) CHECK (rating >= 0.5 AND rating <= 5.0),
    current_page INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, book_id)
);

CREATE TABLE reading_records (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    read_date DATE NOT NULL,
    pages_read INTEGER NOT NULL,
    from_page INTEGER,
    to_page INTEGER,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1'
);

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    UNIQUE(user_id, name)
);

CREATE TABLE book_tags (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    UNIQUE(user_book_id, tag_id)
);

CREATE TABLE book_categories (
    id BIGSERIAL PRIMARY KEY,
    user_book_id BIGINT NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(user_book_id, category_id)
);

CREATE TABLE reading_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_year INTEGER NOT NULL,
    target_month INTEGER,
    target_books INTEGER NOT NULL,
    completed_books INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_status ON user_books(user_id, status);
CREATE INDEX idx_reading_records_user_book ON reading_records(user_book_id);
CREATE INDEX idx_reading_records_date ON reading_records(read_date);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_public ON reviews(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_books_isbn ON books(isbn);
