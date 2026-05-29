-- Expenses capture who paid and how much the group needs to split.
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    payer_id UUID NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category_id UUID,
    notes TEXT,
    receipt_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_expenses_group
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_payer
        FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT chk_expenses_title_not_blank CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_expenses_amount_positive CHECK (amount > 0)
);

-- Per-user liability for an expense. Balances are derived from this table.
CREATE TABLE IF NOT EXISTS expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL,
    user_id UUID NOT NULL,
    owed_amount NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    CONSTRAINT uk_expense_splits_expense_user UNIQUE (expense_id, user_id),
    CONSTRAINT fk_expense_splits_expense
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_expense_splits_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_expense_splits_owed_amount_non_negative CHECK (owed_amount >= 0),
    CONSTRAINT chk_expense_splits_status CHECK (status IN ('PENDING', 'PAID'))
);

DROP TRIGGER IF EXISTS trg_expenses_set_updated_at ON expenses;

CREATE TRIGGER trg_expenses_set_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
