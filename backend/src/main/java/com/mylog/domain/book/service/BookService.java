package com.mylog.domain.book.service;

import com.mylog.domain.book.dto.*;
import com.mylog.domain.book.entity.Book;
import com.mylog.domain.book.repository.BookRepository;
import com.mylog.infra.booksearch.BookSearchClient;
import com.mylog.infra.booksearch.BookSearchResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

// Design Ref: §4.2 — Book search + manual registration
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final BookSearchClient bookSearchClient;

    public List<BookSearchResult> searchBooks(String query) {
        return bookSearchClient.search(query, 10);
    }

    @Transactional
    public BookResponse createBook(BookCreateRequest request, Long userId) {
        // If ISBN exists, return existing book
        if (request.getIsbn() != null && !request.getIsbn().isEmpty()) {
            var existing = bookRepository.findByIsbn(request.getIsbn());
            if (existing.isPresent()) {
                return BookResponse.from(existing.get());
            }
        }

        Book book = Book.builder()
                .isbn(request.getIsbn())
                .title(request.getTitle())
                .author(request.getAuthor())
                .publisher(request.getPublisher())
                .coverImageUrl(request.getCoverImageUrl())
                .totalPages(request.getTotalPages())
                .description(request.getDescription())
                .publishedDate(request.getPublishedDate() != null ? LocalDate.parse(request.getPublishedDate()) : null)
                .originalCategory(request.getOriginalCategory())
                .createdByUserId(userId)
                .build();

        return BookResponse.from(bookRepository.save(book));
    }

    public BookResponse getBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new com.mylog.global.exception.BusinessException(
                        com.mylog.global.exception.ErrorCode.BOOK_NOT_FOUND));
        return BookResponse.from(book);
    }

    @Transactional
    public BookResponse updateBook(Long id, BookUpdateRequest request) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new com.mylog.global.exception.BusinessException(
                        com.mylog.global.exception.ErrorCode.BOOK_NOT_FOUND));
        book.update(request.getTitle(), request.getAuthor(), request.getPublisher(),
                request.getTotalPages(), request.getDescription());
        return BookResponse.from(book);
    }
}
