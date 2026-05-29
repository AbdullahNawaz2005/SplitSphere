package com.splitsphere.dto.expense;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SplitRequest(
        @NotNull UUID userId,
        @DecimalMin(value = "0.00") BigDecimal amount
) {
}
