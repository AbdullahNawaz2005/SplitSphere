package com.splitsphere.dto.balance;

import java.math.BigDecimal;
import java.util.UUID;

public record UserBalanceResponse(
        UUID userId,
        String userName,
        BigDecimal netBalance
) {
}
