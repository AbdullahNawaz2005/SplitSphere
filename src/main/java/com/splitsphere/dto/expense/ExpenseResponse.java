package com.splitsphere.dto.expense;

import com.splitsphere.entity.Expense;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record ExpenseResponse(
        UUID id,
        UUID groupId,
        String description,
        BigDecimal amount,
        String splitType,
        Instant expenseDate,
        UUID payerId,
        String payerName,
        UUID categoryId,
        String categoryName,
        List<ExpenseSplitResponse> splits,
        Instant createdAt
) {
    public static ExpenseResponse from(Expense expense) {
        UUID categoryId = expense.getCategory() == null ? null : expense.getCategory().getId();
        String categoryName = expense.getCategory() == null ? null : expense.getCategory().getName();

        return new ExpenseResponse(
                expense.getId(),
                expense.getGroup().getId(),
                expense.getTitle(),
                expense.getAmount(),
                "CUSTOM",
                expense.getCreatedAt(),
                expense.getPayer().getId(),
                expense.getPayer().getName(),
                categoryId,
                categoryName,
                expense.getSplits().stream()
                        .sorted(Comparator.comparing(split -> split.getUser().getName()))
                        .map(ExpenseSplitResponse::from)
                        .toList(),
                expense.getCreatedAt()
        );
    }
}
