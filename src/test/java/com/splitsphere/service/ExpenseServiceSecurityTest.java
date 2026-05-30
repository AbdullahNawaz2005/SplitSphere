package com.splitsphere.service;

import com.splitsphere.dto.expense.CreateExpenseRequest;
import com.splitsphere.dto.expense.SplitRequest;
import com.splitsphere.entity.Expense;
import com.splitsphere.entity.ExpenseGroup;
import com.splitsphere.entity.User;
import com.splitsphere.entity.enums.SplitType;
import com.splitsphere.exception.ForbiddenException;
import com.splitsphere.repository.CategoryRepository;
import com.splitsphere.repository.ExpenseRepository;
import com.splitsphere.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceSecurityTest {

    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private GroupService groupService;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private ActivityLogService activityLogService;

    private ExpenseService expenseService;
    private User owner;
    private User userA;
    private User userB;
    private ExpenseGroup group;

    @BeforeEach
    void setUp() {
        expenseService = new ExpenseService(
                expenseRepository,
                userRepository,
                categoryRepository,
                groupService,
                currentUserService,
                activityLogService
        );
        owner = user("Owner");
        userA = user("User A");
        userB = user("User B");
        group = group(owner);
    }

    @Test
    void userCannotCreateExpenseWithAnotherMemberAsPayer() {
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(groupService.getGroup(group.getId())).thenReturn(group);

        CreateExpenseRequest request = createRequest(userB.getId());

        assertThatThrownBy(() -> expenseService.createExpense(request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("only create expenses where you are the payer");

        verify(expenseRepository, never()).save(any());
    }

    @Test
    void userCanCreateExpenseWithOwnPayerId() {
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(groupService.getGroup(group.getId())).thenReturn(group);
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

        expenseService.createExpense(createRequest(userA.getId()));

        ArgumentCaptor<Expense> expenseCaptor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(expenseCaptor.capture());
        assertThat(expenseCaptor.getValue().getPayer().getId()).isEqualTo(userA.getId());
    }

    @Test
    void missingPayerDefaultsToAuthenticatedUser() {
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(groupService.getGroup(group.getId())).thenReturn(group);
        when(userRepository.findById(userA.getId())).thenReturn(Optional.of(userA));
        when(userRepository.findById(userB.getId())).thenReturn(Optional.of(userB));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocation -> invocation.getArgument(0));

        expenseService.createExpense(createRequest(null));

        ArgumentCaptor<Expense> expenseCaptor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(expenseCaptor.capture());
        assertThat(expenseCaptor.getValue().getPayer().getId()).isEqualTo(userA.getId());
    }

    @Test
    void nonMemberCannotCreateExpenseInGroup() {
        when(currentUserService.getCurrentUser()).thenReturn(userA);
        when(groupService.getGroup(group.getId())).thenReturn(group);
        doThrow(new ForbiddenException("You are not a member of this group"))
                .when(groupService).requireActiveMember(group, userA);

        assertThatThrownBy(() -> expenseService.createExpense(createRequest(userA.getId())))
                .isInstanceOf(ForbiddenException.class);

        verify(expenseRepository, never()).save(any());
    }

    private CreateExpenseRequest createRequest(UUID payerId) {
        return new CreateExpenseRequest(
                group.getId(),
                payerId,
                null,
                "Dinner",
                new BigDecimal("120.00"),
                SplitType.EQUAL,
                null,
                List.of(new SplitRequest(userA.getId(), null), new SplitRequest(userB.getId(), null))
        );
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
