package com.mylog.infra.booksearch;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

// Design Ref: §2.3 — Aladin TTB Open API integration (replaces Naver)
// ItemSearch: 키워드 검색 (기본 정보)
// ItemLookUp: ISBN13 기반 단일 조회 (itemPage 등 상세 메타데이터)
// 검색 후 각 결과에 대해 ItemLookUp을 병렬 호출하여 페이지 수 자동 채우기.
// Docs: https://blog.aladin.co.kr/openapi/manual
@Slf4j
@Component
public class AladinBookSearchClient implements BookSearchClient {

    private static final String SEARCH_URL = "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx";
    private static final String LOOKUP_URL = "http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx";

    // 병렬 ItemLookUp용 스레드 풀 (최대 10 동시)
    private static final int LOOKUP_POOL_SIZE = 10;
    private static final long LOOKUP_TIMEOUT_SECONDS = 4;

    @Value("${aladin.ttb-key:}")
    private String ttbKey;

    private final RestTemplate restTemplate;
    private final ExecutorService lookupExecutor = Executors.newFixedThreadPool(LOOKUP_POOL_SIZE);

    public AladinBookSearchClient() {
        // 타임아웃 설정 (RestTemplate 기본은 infinite → 외부 API 행 방지)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000); // 3초
        factory.setReadTimeout(5000);    // 5초
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public List<BookSearchResult> search(String query, int maxResults) {
        if (ttbKey == null || ttbKey.isEmpty()) {
            log.warn("Aladin TTB Key not configured (aladin.ttb-key), returning mock data");
            return getMockResults(query);
        }

        try {
            // Phase 1: ItemSearch로 기본 정보 획득
            List<Map<String, Object>> rawItems = callItemSearch(query, maxResults);
            if (rawItems.isEmpty()) return List.of();

            // Phase 2: 각 결과를 병렬로 ItemLookUp → itemPage 수집
            List<CompletableFuture<BookSearchResult>> futures = rawItems.stream()
                    .map(item -> CompletableFuture
                            .supplyAsync(() -> enrichWithLookup(item), lookupExecutor)
                            .orTimeout(LOOKUP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                            .exceptionally(ex -> {
                                log.debug("ItemLookUp fallback for isbn13={}: {}",
                                        str(item.get("isbn13")), ex.getMessage());
                                return toBookSearchResult(item, null);
                            }))
                    .toList();

            return futures.stream()
                    .map(CompletableFuture::join)
                    .toList();
        } catch (Exception e) {
            log.error("Aladin book search failed: query={}", query, e);
            return getMockResults(query);
        }
    }

    /**
     * Phase 1: ItemSearch.aspx 호출 → 기본 book 정보 리스트 반환
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> callItemSearch(String query, int maxResults) {
        URI uri = UriComponentsBuilder.fromHttpUrl(SEARCH_URL)
                .queryParam("ttbkey", ttbKey)
                .queryParam("Query", query)
                .queryParam("QueryType", "Keyword")
                .queryParam("MaxResults", Math.min(maxResults, 50))
                .queryParam("start", 1)
                .queryParam("SearchTarget", "Book")
                .queryParam("Cover", "Big")
                .queryParam("Output", "JS")
                .queryParam("Version", "20131101")
                .build()
                .encode(StandardCharsets.UTF_8)
                .toUri();

        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "mylog/1.0");
        headers.setAccept(List.of(MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN, MediaType.ALL));

        ResponseEntity<Map> response = restTemplate.exchange(
                uri, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

        Map<String, Object> body = response.getBody();
        if (body == null) {
            log.warn("Aladin ItemSearch response body is null for query={}", query);
            return List.of();
        }

        List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("item");
        if (items == null || items.isEmpty()) {
            log.debug("Aladin returned no items for query={}", query);
            return List.of();
        }
        return items;
    }

    /**
     * Phase 2: 단일 item에 대해 ItemLookUp 호출 → itemPage 획득 → 병합 결과 반환
     * 실패 시 base 정보만 (totalPages=null) 반환.
     */
    private BookSearchResult enrichWithLookup(Map<String, Object> searchItem) {
        String isbn13 = str(searchItem.get("isbn13"));
        if (isbn13.isEmpty()) {
            // ISBN13 없으면 ItemLookUp 불가
            return toBookSearchResult(searchItem, null);
        }

        Integer itemPage = fetchItemPageByIsbn13(isbn13);
        return toBookSearchResult(searchItem, itemPage);
    }

    /**
     * ItemLookUp.aspx 호출하여 subInfo.itemPage 추출.
     * 실패 시 null 반환 (graceful fallback).
     */
    @SuppressWarnings("unchecked")
    private Integer fetchItemPageByIsbn13(String isbn13) {
        try {
            URI uri = UriComponentsBuilder.fromHttpUrl(LOOKUP_URL)
                    .queryParam("ttbkey", ttbKey)
                    .queryParam("itemIdType", "ISBN13")
                    .queryParam("ItemId", isbn13)
                    .queryParam("Cover", "Big")
                    .queryParam("Output", "JS")
                    .queryParam("Version", "20131101")
                    .build()
                    .encode(StandardCharsets.UTF_8)
                    .toUri();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "mylog/1.0");
            headers.setAccept(List.of(MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN, MediaType.ALL));

            ResponseEntity<Map> response = restTemplate.exchange(
                    uri, HttpMethod.GET, new HttpEntity<>(headers), Map.class);

            Map<String, Object> body = response.getBody();
            if (body == null) return null;

            List<Map<String, Object>> items = (List<Map<String, Object>>) body.get("item");
            if (items == null || items.isEmpty()) return null;

            Map<String, Object> item = items.get(0);
            Object subInfoObj = item.get("subInfo");
            if (!(subInfoObj instanceof Map)) return null;

            Map<String, Object> subInfo = (Map<String, Object>) subInfoObj;
            Object pageObj = subInfo.get("itemPage");
            if (pageObj instanceof Number) {
                int page = ((Number) pageObj).intValue();
                return page > 0 ? page : null;
            }
            return null;
        } catch (Exception e) {
            log.debug("ItemLookUp failed for isbn13={}: {}", isbn13, e.getMessage());
            return null;
        }
    }

    /**
     * ItemSearch item + (optional) itemPage → BookSearchResult 변환
     */
    private BookSearchResult toBookSearchResult(Map<String, Object> item, Integer itemPage) {
        // ISBN 우선순위: isbn13 > isbn (13자리가 더 안정적)
        String isbn13 = str(item.get("isbn13"));
        String isbn = isbn13.isEmpty() ? str(item.get("isbn")) : isbn13;

        // 알라딘 categoryName (계층형, 빈 문자열이면 null로)
        String categoryName = str(item.get("categoryName"));
        String originalCategory = categoryName.isEmpty() ? null : categoryName;

        return BookSearchResult.builder()
                .isbn(isbn)
                .title(stripHtml(str(item.get("title"))))
                .author(stripHtml(str(item.get("author"))))
                .publisher(str(item.get("publisher")))
                .coverImageUrl(str(item.get("cover")))
                .totalPages(itemPage)
                .description(stripHtml(str(item.get("description"))))
                .publishedDate(str(item.get("pubDate")))
                .originalCategory(originalCategory)
                .build();
    }

    private String str(Object o) {
        return o == null ? "" : String.valueOf(o);
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", "").trim();
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
