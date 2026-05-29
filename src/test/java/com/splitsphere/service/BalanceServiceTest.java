package com.splitsphere.service;

import com.splitsphere.dto.balance.DebtResponse;
import com.splitsphere.entity.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class BalanceServiceTest {

    private final BalanceService balanceService = new BalanceService(null, null, null, null);

    @Test
    void optimizesTransitiveDebtsIntoMinimalPayments() {
        User a = user("A");
        User b = user("B");
        User c = user("C");

        Map<UUID, BigDecimal> net = new LinkedHashMap<>();
        net.put(a.getId(), new BigDecimal("-500.00"));
        net.put(b.getId(), BigDecimal.ZERO);
        net.put(c.getId(), new BigDecimal("500.00"));

        Map<UUID, User> users = Map.of(a.getId(), a, b.getId(), b, c.getId(), c);

        List<DebtResponse> result = balanceService.optimizeDebts(net, users);

        assertThat(result).containsExactly(new DebtResponse(
                a.getId(),
                "A",
                c.getId(),
                "C",
                new BigDecimal("500.00")
        ));
    }

    @Test
    void minimizesMultipleDebtorsAndCreditors() {
        User a = user("A");
        User b = user("B");
        User c = user("C");
        User d = user("D");

        Map<UUID, BigDecimal> net = new LinkedHashMap<>();
        net.put(a.getId(), new BigDecimal("-40.00"));
        net.put(b.getId(), new BigDecimal("-60.00"));
        net.put(c.getId(), new BigDecimal("70.00"));
        net.put(d.getId(), new BigDecimal("30.00"));

        Map<UUID, User> users = Map.of(a.getId(), a, b.getId(), b, c.getId(), c, d.getId(), d);

        List<DebtResponse> result = balanceService.optimizeDebts(net, users);

        assertThat(result).hasSize(3);
        assertThat(result.stream().map(DebtResponse::amount))
                .containsExactly(new BigDecimal("60.00"), new BigDecimal("10.00"), new BigDecimal("30.00"));
        assertThat(result)
                .extracting(DebtResponse::fromUserName)
                .containsExactly("B", "A", "A");
    }

    private User user(String name) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setName(name);
        user.setEmail(name.toLowerCase() + "@example.com");
        return user;
    }
}
