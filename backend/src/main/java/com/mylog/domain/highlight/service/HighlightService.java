package com.mylog.domain.highlight.service;

import com.mylog.domain.book.repository.UserBookRepository;
import com.mylog.domain.highlight.dto.HighlightRequest;
import com.mylog.domain.highlight.dto.HighlightResponse;
import com.mylog.domain.highlight.entity.Highlight;
import com.mylog.domain.highlight.repository.HighlightRepository;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HighlightService {

    private final HighlightRepository highlightRepository;
    private final UserBookRepository userBookRepository;

    public List<HighlightResponse> getHighlights(Long userBookId) {
        return highlightRepository.findByUserBookIdOrderByPageNumberAsc(userBookId)
                .stream().map(HighlightResponse::from).toList();
    }

    @Transactional
    public HighlightResponse createHighlight(Long userBookId, HighlightRequest request) {
        Highlight highlight = Highlight.builder()
                .userBookId(userBookId)
                .pageNumber(request.getPageNumber())
                .content(request.getContent())
                .memo(request.getMemo())
                .build();

        return HighlightResponse.from(highlightRepository.save(highlight));
    }

    @Transactional
    public void deleteHighlight(Long userId, Long highlightId) {
        Highlight highlight = highlightRepository.findById(highlightId)
                .orElseThrow(() -> new BusinessException(ErrorCode.HIGHLIGHT_NOT_FOUND));

        // Verify ownership: the highlight's userBook must belong to this user
        userBookRepository.findByIdAndUserId(highlight.getUserBookId(), userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCESS_DENIED));

        highlightRepository.delete(highlight);
    }
}
