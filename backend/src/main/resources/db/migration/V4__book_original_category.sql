-- Aladin original category (계층형 분류 문자열)
-- Example: "국내도서>소설/시/희곡>한국소설>2000년대 이후 한국소설"
-- 사용자 개인 카테고리(categories 테이블)와 별개의 "알라딘 원본 분류" 필드

ALTER TABLE books
    ADD COLUMN IF NOT EXISTS original_category VARCHAR(500);
