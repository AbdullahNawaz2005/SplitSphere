package com.splitsphere.dto.expense;

import com.splitsphere.entity.enums.SplitType;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateExpenseRequest(
        @NotNull UUID payerId,
        UUID categoryId,
        @JsonAlias("title") @NotBlank @Size(max = 150) @Pattern(regexp = "^[^<>]*$", message = "must not contain HTML markup") String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull SplitType splitType,
        @NotNull LocalDate expenseDate,
        @NotNull @Valid @Size(min = 1, max = 100) List<SplitRequest> splits
) {
    public UpdateExpenseRequest {
        description = description == null ? null : description.trim();
    }
}
