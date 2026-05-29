package com.splitsphere.dto.balance;

import java.util.List;
import java.util.UUID;

public record GroupBalanceResponse(
        UUID groupId,
        List<UserBalanceResponse> balances,
        List<DebtResponse> optimizedSettlements
) {
}
