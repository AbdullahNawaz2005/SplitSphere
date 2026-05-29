package com.splitsphere.util;

import com.splitsphere.exception.BadRequestException;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class MoneyUtils {

    private MoneyUtils() {
    }

    public static BigDecimal normalize(BigDecimal amount) {
        if (amount == null) {
            throw new BadRequestException("Amount is required");
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }

    public static void requirePositive(BigDecimal amount, String field) {
        if (normalize(amount).compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(field + " must be greater than zero");
        }
    }
}
