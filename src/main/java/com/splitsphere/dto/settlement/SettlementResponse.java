package com.splitsphere.dto.settlement;

import com.splitsphere.entity.Settlement;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SettlementResponse(
        UUID id,
        UUID groupId,
        UUID payerId,
        String payerName,
        UUID receiverId,
        String receiverName,
        BigDecimal amount,
        String status,
        Instant settledAt,
        Instant createdAt
) {
    public static SettlementResponse from(Settlement settlement) {
        return new SettlementResponse(
                settlement.getId(),
                settlement.getGroup().getId(),
                settlement.getPayer().getId(),
                settlement.getPayer().getName(),
                settlement.getReceiver().getId(),
                settlement.getReceiver().getName(),
                settlement.getAmount(),
                settlement.getStatus().name(),
                settlement.getSettledAt(),
                settlement.getCreatedAt()
        );
    }
}
