-- Settlements record money transfers between members after balances are optimized.
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    payer_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMPTZ,

    CONSTRAINT fk_settlements_group
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_settlements_payer
        FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_settlements_receiver
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_settlements_amount_positive CHECK (amount > 0),
    CONSTRAINT chk_settlements_distinct_users CHECK (payer_id <> receiver_id),
    CONSTRAINT chk_settlements_status CHECK (status IN ('PENDING', 'PENDING_CONFIRMATION', 'COMPLETED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT chk_settlements_completed_has_settled_at
        CHECK (status <> 'COMPLETED' OR settled_at IS NOT NULL)
);
