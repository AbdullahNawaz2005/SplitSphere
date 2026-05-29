package com.splitsphere.entity;

import com.splitsphere.entity.enums.SplitStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "expense_splits")
public class ExpenseSplit extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id")
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, name = "owed_amount", precision = 12, scale = 2)
    private BigDecimal owedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SplitStatus status = SplitStatus.PENDING;
}
