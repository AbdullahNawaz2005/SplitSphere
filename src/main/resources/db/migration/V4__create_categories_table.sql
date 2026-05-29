-- Expense categories are shared system data used for reporting and filtering.
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(30),

    CONSTRAINT uk_categories_name UNIQUE (name),
    CONSTRAINT chk_categories_name_not_blank CHECK (length(trim(name)) > 0)
);
