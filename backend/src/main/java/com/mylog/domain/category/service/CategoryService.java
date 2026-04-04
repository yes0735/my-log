package com.mylog.domain.category.service;

import com.mylog.domain.category.dto.*;
import com.mylog.domain.category.entity.*;
import com.mylog.domain.category.repository.*;
import com.mylog.global.exception.BusinessException;
import com.mylog.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final BookTagRepository bookTagRepository;
    private final BookCategoryRepository bookCategoryRepository;

    public List<CategoryResponse> getCategories(Long userId) {
        return categoryRepository.findByUserIdOrderByNameAsc(userId).stream()
                .map(CategoryResponse::from).toList();
    }

    @Transactional
    public CategoryResponse createCategory(Long userId, CategoryRequest req) {
        Category category = Category.builder()
                .userId(userId).name(req.getName())
                .color(req.getColor() != null ? req.getColor() : "#6366f1")
                .build();
        return CategoryResponse.from(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse updateCategory(Long userId, Long id, CategoryRequest req) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
        if (!category.getUserId().equals(userId)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        category.setName(req.getName());
        if (req.getColor() != null) category.setColor(req.getColor());
        return CategoryResponse.from(category);
    }

    @Transactional
    public void deleteCategory(Long userId, Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
        if (!category.getUserId().equals(userId)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        categoryRepository.delete(category);
    }

    // Tag operations
    public List<TagResponse> getTags(Long userId) {
        return tagRepository.findByUserIdOrderByNameAsc(userId).stream()
                .map(TagResponse::from).toList();
    }

    @Transactional
    public TagResponse createTag(Long userId, TagRequest req) {
        Tag tag = Tag.builder().userId(userId).name(req.getName()).build();
        return TagResponse.from(tagRepository.save(tag));
    }

    @Transactional
    public void deleteTag(Long userId, Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.ENTITY_NOT_FOUND));
        if (!tag.getUserId().equals(userId)) throw new BusinessException(ErrorCode.ACCESS_DENIED);
        tagRepository.delete(tag);
    }

    // BookTag operations
    public List<TagResponse> getBookTags(Long userBookId) {
        return bookTagRepository.findByUserBookId(userBookId).stream()
                .map(bt -> tagRepository.findById(bt.getTagId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .map(TagResponse::from).toList();
    }

    @Transactional
    public void addTagToBook(Long userBookId, Long tagId) {
        bookTagRepository.save(BookTag.builder().userBookId(userBookId).tagId(tagId).build());
    }

    @Transactional
    public void removeTagFromBook(Long userBookId, Long tagId) {
        bookTagRepository.deleteByUserBookIdAndTagId(userBookId, tagId);
    }

    // BookCategory operations
    public List<CategoryResponse> getBookCategories(Long userBookId) {
        return bookCategoryRepository.findByUserBookId(userBookId).stream()
                .map(bc -> categoryRepository.findById(bc.getCategoryId()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .map(CategoryResponse::from).toList();
    }

    @Transactional
    public void addCategoryToBook(Long userBookId, Long categoryId) {
        bookCategoryRepository.save(BookCategory.builder().userBookId(userBookId).categoryId(categoryId).build());
    }

    @Transactional
    public void removeCategoryFromBook(Long userBookId, Long categoryId) {
        bookCategoryRepository.deleteByUserBookIdAndCategoryId(userBookId, categoryId);
    }
}
