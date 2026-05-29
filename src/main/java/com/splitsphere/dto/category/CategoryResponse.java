package com.splitsphere.dto.category;

import com.splitsphere.entity.Category;

import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        String icon,
        String color
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getIcon(), category.getColor());
    }
}
