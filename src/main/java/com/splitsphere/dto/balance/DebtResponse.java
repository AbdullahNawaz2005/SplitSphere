package com.splitsphere.dto.balance;

import java.math.BigDecimal;
import java.util.UUID;

public record DebtResponse(
        UUID fromUserId,
        String fromUserName,
        UUID toUserId,
        String toUserName,
        BigDecimal amount
) {
}
