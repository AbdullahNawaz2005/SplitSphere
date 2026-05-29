# SplitSphere Backend

Production-oriented Spring Boot backend for a collaborative expense management platform. SplitSphere supports secure users, groups, expenses, custom/equal splits, balance calculation, optimized settlements, settlement history, analytics, PostgreSQL persistence, Flyway migrations, JWT auth, and Swagger docs.

## Tech Stack

- Java 21
- Spring Boot 3
- Maven
- PostgreSQL
- Spring Security + JWT
- JPA/Hibernate
- Flyway
- Lombok
- Docker / Docker Compose
- OpenAPI / Swagger UI

## Architecture

```text
src/main/java/com/splitsphere
  config/        Security, CORS, OpenAPI configuration
  controller/    REST controllers with thin HTTP handling
  dto/           Request/response DTOs
  entity/        JPA domain model
  exception/     Global error handling
  repository/    Spring Data repositories
  security/      JWT and UserDetails integration
  service/       Business logic and transactions
  util/          Reusable helpers
```

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `SERVER_PORT` | `8080` | API port |
| `DB_URL` | `jdbc:postgresql://localhost:5432/splitsphere` | PostgreSQL JDBC URL |
| `DB_USERNAME` | `splitsphere` | Database username |
| `DB_PASSWORD` | `splitsphere` | Database password |
| `JWT_SECRET` | development fallback | HMAC signing secret, use a long random value in production |
| `JWT_EXPIRATION_MINUTES` | `60` | Access token lifetime |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | Comma-separated frontend origins |

## Run Locally

Start PostgreSQL and the API:

```bash
docker compose up --build
```

Or run the API directly:

```bash
mvn spring-boot:run
```

Swagger UI:

```text
http://localhost:8080/swagger-ui.html
```

## Database Schema

Flyway migrations live in `src/main/resources/db/migration`.

Core tables:

- `users`
- `groups`
- `group_members`
- `categories`
- `expenses`
- `expense_splits`
- `settlements`

The schema uses UUID primary keys, foreign keys, unique constraints, amount checks, active membership tracking, audit timestamps, indexes for lookup-heavy paths, and cascade behavior where deleting a group removes its expenses, splits, settlements, and memberships.

## API Overview

All endpoints except auth registration/login require:

```http
Authorization: Bearer <jwt>
```

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Register request:

```json
{
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "password": "StrongPass123"
}
```

Auth response:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "expiresInSeconds": 3600,
  "user": {
    "id": "2efaf778-a0a3-44b3-83f6-c3424359301a",
    "name": "Ayesha Khan",
    "email": "ayesha@example.com",
    "role": "USER",
    "createdAt": "2026-05-26T10:15:30Z"
  }
}
```

### Groups

```http
GET    /api/groups
POST   /api/groups
POST   /api/groups/join
GET    /api/groups/{groupId}/members
POST   /api/groups/{groupId}/leave
DELETE /api/groups/{groupId}
```

Create group:

```json
{
  "name": "Lahore Trip",
  "description": "Weekend trip expenses"
}
```

### Expenses

```http
POST   /api/expenses
GET    /api/expenses/group/{groupId}?page=0&size=20&search=dinner
PUT    /api/expenses/{expenseId}
DELETE /api/expenses/{expenseId}
```

Equal split request:

```json
{
  "groupId": "9bedb08a-b998-45f2-b7f4-8d8f83c6f5a5",
  "payerId": "2efaf778-a0a3-44b3-83f6-c3424359301a",
  "categoryId": "10000000-0000-0000-0000-000000000001",
  "description": "Dinner",
  "amount": 1500.00,
  "splitType": "EQUAL",
  "expenseDate": "2026-05-26",
  "splits": [
    { "userId": "2efaf778-a0a3-44b3-83f6-c3424359301a" },
    { "userId": "a74a68dc-1eb0-417a-8f09-d836d458b578" },
    { "userId": "535548cb-d64b-443e-a83e-dd1205a79ff4" }
  ]
}
```

Custom split request:

```json
{
  "groupId": "9bedb08a-b998-45f2-b7f4-8d8f83c6f5a5",
  "payerId": "2efaf778-a0a3-44b3-83f6-c3424359301a",
  "description": "Groceries",
  "amount": 1200.00,
  "splitType": "CUSTOM",
  "splits": [
    { "userId": "2efaf778-a0a3-44b3-83f6-c3424359301a", "amount": 500.00 },
    { "userId": "a74a68dc-1eb0-417a-8f09-d836d458b578", "amount": 700.00 }
  ]
}
```

### Balances and Settlement Optimization

```http
GET /api/balances/group/{groupId}
GET /api/balances/group/{groupId}/settlements
```

The balance engine calculates each member's net position:

- Expense payer receives credit for the paid amount.
- Each participant is debited by their split amount.
- Recorded settlements reduce the payer's debt and the payee's receivable.

Then the engine minimizes payments by matching the largest debtors against the largest creditors. Example: if A owes B 500 and B owes C 500, the optimized output is A pays C 500.

Sample response:

```json
{
  "groupId": "9bedb08a-b998-45f2-b7f4-8d8f83c6f5a5",
  "balances": [
    { "userId": "11111111-1111-1111-1111-111111111111", "userName": "A", "netBalance": -500.00 },
    { "userId": "22222222-2222-2222-2222-222222222222", "userName": "B", "netBalance": 0.00 },
    { "userId": "33333333-3333-3333-3333-333333333333", "userName": "C", "netBalance": 500.00 }
  ],
  "optimizedSettlements": [
    {
      "fromUserId": "11111111-1111-1111-1111-111111111111",
      "fromUserName": "A",
      "toUserId": "33333333-3333-3333-3333-333333333333",
      "toUserName": "C",
      "amount": 500.00
    }
  ]
}
```

### Settlements

```http
POST /api/settlements
GET  /api/settlements?groupId={groupId}&page=0&size=20
```

```json
{
  "groupId": "9bedb08a-b998-45f2-b7f4-8d8f83c6f5a5",
  "payerId": "2efaf778-a0a3-44b3-83f6-c3424359301a",
  "payeeId": "535548cb-d64b-443e-a83e-dd1205a79ff4",
  "amount": 500.00,
  "note": "Paid via bank transfer"
}
```

### Categories and Analytics

```http
GET /api/categories
GET /api/analytics/group/{groupId}
```

## Security Notes

- Passwords are hashed with BCrypt strength 12.
- JWT auth is stateless; no server-side session is created.
- Protected resources enforce active group membership.
- Group deletion is restricted to the owner.
- Expense update/delete is restricted to the payer, creator, or group owner.
- Secrets are sourced from environment variables for production deployment.

## Build and Test

```bash
mvn test
mvn package
```

## Production Hardening Ideas

This implementation includes the core production structure. For a live fintech product, add refresh token rotation, idempotency keys for settlements, structured JSON logs, API rate limiting at the gateway, observability, database backups, secret manager integration, and CI checks for tests, formatting, dependency scanning, and container vulnerability scans.
