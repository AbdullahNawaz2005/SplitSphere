# SplitSphere Database

## Table Relationships

`users` owns accounts. `groups` are owned by a user through `groups.owner_id`, and users join groups through `group_members`, which enforces one membership per user per group. `expenses` belong to a group and record the paying user. `expense_splits` stores each participant's owed share for an expense. `settlements` records payments from one user to another inside a group. `activity_logs` stores group-level product history.

## Why UUIDs

UUID primary keys avoid guessable sequential IDs, work well across distributed systems, and make future mobile/offline or multi-region writes easier. PostgreSQL generates them with `gen_random_uuid()` from `pgcrypto`, so IDs are created consistently even when rows are inserted outside the Spring Boot app.

## Balance Calculation

Balances are derived, not stored. For each expense, the payer is credited by `expenses.amount`, while each participant is debited by their `expense_splits.owed_amount`. Completed settlements then reduce open debt by crediting the settlement payer and debiting the receiver.

Conceptually:

```text
net_balance(user) =
  sum(expenses paid by user)
  - sum(expense_splits owed by user)
  + sum(settlements paid by user)
  - sum(settlements received by user)
```

A positive net balance means the user should receive money. A negative net balance means the user owes money.

## Smart Settlements

The smart settlement engine should read `expense_splits` and `settlements`, compute each member's net balance, then match debtors to creditors. This minimizes transactions. For example, if A owes B 500 and B owes C 500, B nets to zero and the optimized settlement is A pays C 500.

`settlements.status` supports `PENDING`, `COMPLETED`, and `CANCELLED`, so the backend can propose settlements, confirm payment, and preserve history.

## Running Flyway

Spring Boot runs Flyway automatically on startup when `spring.flyway.enabled=true`.

With Maven:

```bash
mvn spring-boot:run
```

With Docker Compose:

```bash
docker compose up --build
```

The migrations live in:

```text
src/main/resources/db/migration/
```

Flyway applies them in version order from `V1__init_extensions.sql` through `V9__seed_default_categories.sql`.
