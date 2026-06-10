package com.splitsphere.service;

import com.splitsphere.dto.common.PageResponse;
import com.splitsphere.dto.settlement.CreateSettlementRequest;
import com.splitsphere.dto.settlement.SettlementResponse;
import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.Settlement;
import com.splitsphere.entity.User;
import com.splitsphere.entity.enums.SettlementStatus;
import com.splitsphere.exception.BadRequestException;
import com.splitsphere.exception.ForbiddenException;
import com.splitsphere.exception.ResourceNotFoundException;
import com.splitsphere.repository.SettlementRepository;
import com.splitsphere.repository.UserRepository;
import com.splitsphere.util.MoneyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;
    private final CurrentUserService currentUserService;
    private final ActivityLogService activityLogService;

    @Transactional
    public SettlementResponse recordSettlement(CreateSettlementRequest request) {
        if (request.groupId() == null) {
            throw new BadRequestException("Group id is required");
        }
        User actor = currentUserService.getCurrentUser();
        ExpenseGroup group = groupService.getGroup(request.groupId());
        groupService.requireActiveMember(group, actor);

        User payer = resolvePayer(request.payerId(), actor);
        User receiver = loadUser(request.receiverId());

        if (payer.getId().equals(receiver.getId())) {
            throw new BadRequestException("Payer and receiver must be different users");
        }

        groupService.requireActiveMember(group, payer);
        groupService.requireActiveMember(group, receiver);
        MoneyUtils.requirePositive(request.amount(), "Settlement amount");

        Settlement settlement = new Settlement();
        settlement.setGroup(group);
        settlement.setPayer(payer);
        settlement.setReceiver(receiver);
        settlement.setAmount(MoneyUtils.normalize(request.amount()));
        settlement.setStatus(SettlementStatus.PENDING_CONFIRMATION);
        Settlement saved = settlementRepository.save(settlement);
        activityLogService.record(
                group,
                actor,
                "SETTLEMENT_CREATED",
                payer.getName() + " marked Rs. " + saved.getAmount() + " as paid to " + receiver.getName() + ". Confirm payment?"
        );
        return SettlementResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<SettlementResponse> listSettlements(UUID groupId, int page, int size) {
        groupService.requireActiveMember(groupId);
        var pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(settlementRepository.findByGroupId(groupId, pageable).map(SettlementResponse::from));
    }

    @Transactional
    public SettlementResponse completeSettlement(UUID settlementId) {
        User actor = currentUserService.getCurrentUser();
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found"));
        groupService.requireActiveMember(settlement.getGroup(), actor);
        requireReceiver(settlement, actor, "complete");
        requireConfirmable(settlement);
        settlement.setStatus(SettlementStatus.COMPLETED);
        settlement.setSettledAt(Instant.now());
        activityLogService.record(
                settlement.getGroup(),
                actor,
                "SETTLEMENT_CONFIRMED",
                actor.getName() + " confirmed receiving Rs. " + settlement.getAmount() + " from " + settlement.getPayer().getName()
        );
        return SettlementResponse.from(settlementRepository.save(settlement));
    }

    @Transactional
    public SettlementResponse rejectSettlement(UUID settlementId) {
        User actor = currentUserService.getCurrentUser();
        Settlement settlement = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new ResourceNotFoundException("Settlement not found"));
        groupService.requireActiveMember(settlement.getGroup(), actor);
        requireReceiver(settlement, actor, "reject");
        requireRejectable(settlement);
        settlement.setStatus(SettlementStatus.REJECTED);
        settlement.setSettledAt(null);
        activityLogService.record(
                settlement.getGroup(),
                actor,
                "SETTLEMENT_REJECTED",
                actor.getName() + " marked Rs. " + settlement.getAmount() + " from " + settlement.getPayer().getName() + " as not received"
        );
        return SettlementResponse.from(settlementRepository.save(settlement));
    }

    private void requireReceiver(Settlement settlement, User actor, String action) {
        if (!settlement.getReceiver().getId().equals(actor.getId())) {
            throw new ForbiddenException("Only the receiver can " + action + " this settlement");
        }
    }

    private void requireConfirmable(Settlement settlement) {
        if (settlement.getStatus() == SettlementStatus.COMPLETED) {
            throw new BadRequestException("Settlement is already completed");
        }
        if (settlement.getStatus() == SettlementStatus.CANCELLED) {
            throw new BadRequestException("Cancelled settlements cannot be completed");
        }
    }

    private void requireRejectable(Settlement settlement) {
        if (settlement.getStatus() == SettlementStatus.COMPLETED) {
            throw new BadRequestException("Completed settlements cannot be rejected");
        }
        if (settlement.getStatus() == SettlementStatus.CANCELLED) {
            throw new BadRequestException("Cancelled settlements cannot be rejected");
        }
        if (settlement.getStatus() == SettlementStatus.REJECTED) {
            throw new BadRequestException("Settlement is already rejected");
        }
    }

    private User loadUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private User resolvePayer(UUID requestedPayerId, User actor) {
        if (requestedPayerId == null) {
            return actor;
        }
        if (!requestedPayerId.equals(actor.getId())) {
            throw new ForbiddenException("You can only record settlements where you are the payer");
        }
        return actor;
    }
}
