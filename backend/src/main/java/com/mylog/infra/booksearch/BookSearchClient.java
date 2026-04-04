package com.mylog.infra.booksearch;

import java.util.List;

// Design Ref: §1.2 — External API abstraction via interface
public interface BookSearchClient {
    List<BookSearchResult> search(String query, int maxResults);
}
