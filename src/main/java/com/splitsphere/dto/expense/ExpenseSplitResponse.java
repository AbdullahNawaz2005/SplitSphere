package com.splitsphere.dto.expense;

import com.splitsphere.entity.ExpenseSplit;

import java.math.BigDecimal;
import java.util.UUID;

public record ExpenseSplitResponse(
        UUID userId,
        String userName,
        BigDecimal amount,
        boolean paid
) {
    public static ExpenseSplitResponse from(ExpenseSplit split) {
        return new ExpenseSplitResponse(
                split.getUser().getId(),
                split.getUser().getName(),
                split.getOwedAmount(),
                split.getStatus().name().equals("PAID")
        );
    }
}
