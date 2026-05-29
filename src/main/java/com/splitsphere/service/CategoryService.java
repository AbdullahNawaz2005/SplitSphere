package com.splitsphere.service;

import com.splitsphere.dto.category.CategoryResponse;
import com.splitsphere.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> listCategories() {
        return categoryRepository.findAll().stream()
                .sorted(Comparator.comparing(category -> category.getName().equals("Other") ? "ZZZ" : category.getName()))
                .map(CategoryResponse::from)
                .toList();
    }
}
