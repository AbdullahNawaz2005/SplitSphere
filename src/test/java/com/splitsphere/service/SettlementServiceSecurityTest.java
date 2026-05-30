package com.splitsphere.service;

import com.splitsphere.dto.settlement.CreateSettlementRequest;
import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.Settlement;
import com.splitsphere.entity.User;
import com.splitsphere.entity.enums.SettlementStatus;
import com.splitsphere.exception.ForbiddenException;
import com.splitsphere.repository.SettlementRepository;
import com.splitsphere.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SettlementServiceSecurityTest {

    @Mock
    private SettlementRepository settlementRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private GroupService groupService;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private ActivityLogService activityLogService;

    private SettlementService settlementService;
    private User owner;
    private User userA;
    private User userB;
    private User userC;
    private ExpenseGroup group;

    @BeforeEach
    void setUp() {
        settlementService = new SettlementService(
                settlementRepository,
                userRepository,
                groupService,
                currentUserService,
                activityLogService
        );
        owner = user("Owner");
        userA = user("User A");
        userB = user("User B");
        userC = user("User C");
        group = group(owner);
    }

    @Test
    void userCannotRecordSettlementWithAnotherUserAsPayer() {
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(groupService.getGroup(group.getId())).thenReturn(group);

        CreateSettlementRequest request = createRequest(userB.getId(), userA.getId());

        assertThatThrownBy(() -> settlementService.recordSettlement(request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("only record settlements where you are the payer");

        verify(settlementRepository, never()).save(any());
    }

    @Test
    void userCanRecordSettlementWhereActorIsPayer() {
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(groupService.getGroup(group.getId())).thenReturn(group);
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = settlementService.recordSettlement(createRequest(userA.getId(), userB.getId()));

        assertThat(response.payerId()).isEqualTo(userA.getId());
        assertThat(response.receiverId()).isEqualTo(userB.getId());
    }

    @Test
    void missingPayerDefaultsToAuthenticatedUser() {
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(groupService.getGroup(group.getId())).thenReturn(group);
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = settlementService.recordSettlement(createRequest(null, userB.getId()));

        assertThat(response.payerId()).isEqualTo(userA.getId());
    }

    @Test
    void receiverMustBeGroupMember() {
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(groupService.getGroup(group.getId())).thenReturn(group);
        when(userRepository.findById(userC.getId())).thenReturn(Optional.of(userC));
        org.mockito.Mockito.doAnswer(invocation -> {
            User checkedUser = invocation.getArgument(1);
            if (checkedUser.getId().equals(userC.getId())) {
                throw new ForbiddenException("User is not an active member of this group");
            }
            return null;
        }).when(groupService).requireActiveMember(eq(group), any(User.class));

        assertThatThrownBy(() -> settlementService.recordSettlement(createRequest(userA.getId(), userC.getId())))
                .isInstanceOf(ForbiddenException.class);

        verify(settlementRepository, never()).save(any());
    }

    @Test
    void payerCannotCompleteSettlementUnlessOwner() {
        Settlement settlement = settlement(userA, userB);
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(settlementRepository.findById(settlement.getId())).thenReturn(Optional.of(settlement));

        assertThatThrownBy(() -> settlementService.completeSettlement(settlement.getId()))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("receiver or group owner");

        verify(settlementRepository, never()).save(any());
    }

    @Test
    void receiverCanCompleteSettlement() {
        Settlement settlement = settlement(userA, userB);
        when(currentUserService.getCurrentUser()).thenReturn(userB);
        when(settlementRepository.findById(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = settlementService.completeSettlement(settlement.getId());

        assertThat(response.status()).isEqualTo(SettlementStatus.COMPLETED.name());
        assertThat(response.settledAt()).isNotNull();
    }

    @Test
    void groupOwnerCanCompleteSettlement() {
        Settlement settlement = settlement(userA, userB);
        when(currentUserService.getCurrentUser()).thenReturn(owner);
        when(settlementRepository.findById(settlement.getId())).thenReturn(Optional.of(settlement));
        when(settlementRepository.save(any(Settlement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = settlementService.completeSettlement(settlement.getId());

        assertThat(response.status()).isEqualTo(SettlementStatus.COMPLETED.name());
    }

    private CreateSettlementRequest createRequest(UUID payerId, UUID receiverId) {
        return new CreateSettlementRequest(group.getId(), payerId, receiverId, new BigDecimal("50.00"), "settled");
    }

    private Settlement settlement(User payer, User receiver) {
        Settlement settlement = new Settlement();
        settlement.setId(UUID.randomUUID());
        settlement.setGroup(group);
        settlement.setPayer(payer);
        settlement.setReceiver(receiver);
        settlement.setAmount(new BigDecimal("50.00"));
        settlement.setStatus(SettlementStatus.PENDING);
        return settlement;
    }

    private static User user(String name) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName(name);
        user.setEmail(name.toLowerCase().replace(" ", ".") + "@example.com");
        return user;
    }

    private static ExpenseGroup group(User owner) {
        ExpenseGroup group = new ExpenseGroup();
        group.setId(UUID.randomUUID());
        group.setName("Trip");
        group.setOwner(owner);
        group.setInviteCode("ABC123");
        return group;
    }
}
