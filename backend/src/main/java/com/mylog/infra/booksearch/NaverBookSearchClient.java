package com.mylog.infra.booksearch;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;

// Design Ref: §2.3 — Naver Book Search API integration (infra layer)
@Slf4j
@Component
public class NaverBookSearchClient implements BookSearchClient {

    @Value("${naver.client-id:}")
    private String clientId;

    @Value("${naver.client-secret:}")
    private String clientSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public List<BookSearchResult> search(String query, int maxResults) {
        if (clientId.isEmpty() || clientSecret.isEmpty()) {
            log.warn("Naver API keys not configured, returning mock data");
            return getMockResults(query);
        }

        try {
            String url = "https://openapi.naver.com/v1/search/book.json?query=" + query + "&display=" + maxResults;
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Naver-Client-Id", clientId);
            headers.set("X-Naver-Client-Secret", clientSecret);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            List<Map<String, Object>> items = (List<Map<String, Object>>) response.getBody().get("items");
            if (items == null) return List.of();

            return items.stream().map(item -> BookSearchResult.builder()
                    .isbn(String.valueOf(item.getOrDefault("isbn", "")))
                    .title(stripHtml(String.valueOf(item.getOrDefault("title", ""))))
                    .author(stripHtml(String.valueOf(item.getOrDefault("author", ""))))
                    .publisher(String.valueOf(item.getOrDefault("publisher", "")))
                    .coverImageUrl(String.valueOf(item.getOrDefault("image", "")))
                    .description(stripHtml(String.valueOf(item.getOrDefault("description", ""))))
                    .publishedDate(String.valueOf(item.getOrDefault("pubdate", "")))
                    .build()
            ).toList();
        } catch (Exception e) {
            log.error("Naver book search failed", e);
            return getMockResults(query);
        }
    }

    private String stripHtml(String html) {
        return html.replaceAll("<[^>]*>", "");
    }

    private List<BookSearchResult> getMockResults(String query) {
        return List.of(
                BookSearchResult.builder()
                        .isbn("9788936434120")
                        .title("채식주의자")
                        .author("한강")
                        .publisher("창비")
                        .coverImageUrl("https://via.placeholder.com/120x174?text=Book")
                        .totalPages(247)
                        .description("2016 맨부커상 수상작")
                        .publishedDate("2007-10-30")
                        .build(),
                BookSearchResult.builder()
                        .isbn("9788932917245")
                        .title("데미안")
                        .author("헤르만 헤세")
                        .publisher("민음사")
                        .coverImageUrl("https://via.placeholder.com/120x174?text=Book")
                        .totalPages(248)
                        .description("새는 알에서 나오려고 투쟁한다")
                        .publishedDate("2000-05-15")
                        .build(),
                BookSearchResult.builder()
                        .isbn("9788937460470")
                        .title("어린 왕자")
                        .author("생텍쥐페리")
                        .publisher("문학동네")
                        .coverImageUrl("https://via.placeholder.com/120x174?text=Book")
                        .totalPages(136)
                        .description("가장 사랑받는 고전")
                        .publishedDate("2007-03-20")
                        .build()
        );
    }
}
