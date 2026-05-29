package com.splitsphere.dto.analytics;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record GroupAnalyticsResponse(
        UUID groupId,
        BigDecimal totalExpenses,
        long expenseCount,
        BigDecimal totalSettled,
        Map<String, BigDecimal> spendingByCategory
) {
}
