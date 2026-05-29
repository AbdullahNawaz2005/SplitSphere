package com.splitsphere.dto.settlement;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateSettlementRequest(
        UUID groupId,
        @NotNull UUID payerId,
        @JsonAlias("payeeId") @NotNull UUID receiverId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @Size(max = 255) @Pattern(regexp = "^[^<>]*$", message = "must not contain HTML markup") String note
) {
    public CreateSettlementRequest {
        note = note == null ? null : note.trim();
    }
}
