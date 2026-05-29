-- Stable UUIDs keep seeded categories deterministic across environments.
INSERT INTO categories (id, name, icon, color)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Food', 'utensils', '#16A34A'),
    ('10000000-0000-0000-0000-000000000002', 'Transport', 'car', '#2563EB'),
    ('10000000-0000-0000-0000-000000000003', 'Rent', 'home', '#9333EA'),
    ('10000000-0000-0000-0000-000000000004', 'Groceries', 'shopping-cart', '#65A30D'),
    ('10000000-0000-0000-0000-000000000005', 'Entertainment', 'party-popper', '#DB2777'),
    ('10000000-0000-0000-0000-000000000006', 'Shopping', 'shopping-bag', '#7C3AED'),
    ('10000000-0000-0000-0000-000000000007', 'Utilities', 'bolt', '#EA580C'),
    ('10000000-0000-0000-0000-000000000008', 'Other', 'circle', '#64748B')
ON CONFLICT (name) DO UPDATE
SET icon = EXCLUDED.icon,
    color = EXCLUDED.color;
