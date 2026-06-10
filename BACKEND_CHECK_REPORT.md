# SplitSphere Backend Check Report

## 0. Compilation Fix - 2026-05-29

Exact cause:

- The entities and security classes already used Lombok annotations such as `@Getter`, `@Setter`, and `@RequiredArgsConstructor`.
- The build was running on JDK 26, but the effective POM used Spring Boot's managed Lombok `1.18.34` and did not explicitly configure Lombok in `maven-compiler-plugin` annotation processor paths.
- As a result, Lombok-generated accessors and constructors were not available to javac, producing missing method errors such as `getId()`, `getName()`, `getGroup()`, `setUser()`, and related methods.

Files changed:

- `pom.xml`

Fix applied:

- Added `lombok.version` property set to `1.18.46`.
- Pinned the Lombok dependency to `${lombok.version}`.
- Added explicit `maven-compiler-plugin` configuration with:
  - `release` set to `${java.version}`
  - `proc` set to `full`
  - `annotationProcessorPaths` containing Lombok `${lombok.version}`
- No entity fields, API behavior, security logic, or Flyway schema files were changed.
- No explicit getters/setters were added because Lombok is now configured correctly.

Commands run:

```bash
mvn clean test -DskipTests
mvn clean test
```

Current build status:

- `mvn clean test -DskipTests`: success, main and test sources compile cleanly.
- `mvn clean test`: success, 2 tests run, 0 failures, 0 errors, 0 skipped.

Remaining blockers:

- Runtime/Flyway/API testing still requires a reachable PostgreSQL database and required environment variables such as `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET`.
- A JDK 26 warning remains from Lombok using a terminally deprecated `sun.misc.Unsafe` method, but it does not fail compilation or tests.

## 0.1 Runtime / Database Integration Check - 2026-05-29

Configuration inspected:

- `src/main/resources/application.yml`
- Required runtime environment variables:
  - `DB_URL`, default: `jdbc:postgresql://localhost:5432/splitsphere`
  - `DB_USERNAME`, default: `splitsphere`
  - `DB_PASSWORD`, default: `splitsphere`
  - `JWT_SECRET`, no usable default and must be at least 32 characters
  - Optional: `JWT_EXPIRATION_MINUTES`, `SERVER_PORT`, `CORS_ALLOWED_ORIGINS`

Local PostgreSQL availability:

- `localhost:5432` is not accepting TCP connections.
- No PostgreSQL Windows service was found.
- `psql.exe`, `postgres.exe`, Docker, Docker Compose, Podman, and an installed WSL distro were not available.
- The repo has a valid `docker-compose.yml` for PostgreSQL, but Docker is not installed on this machine.

Local PostgreSQL install attempts:

- `winget search PostgreSQL` found official PostgreSQL packages from PostgreSQL Global Development Group.
- `winget show --id PostgreSQL.PostgreSQL.16 --source winget` confirmed the package metadata points to PostgreSQL/EDB official Windows downloads.
- Installing `PostgreSQL.PostgreSQL.16` failed while downloading with HTTP 403 from the EDB URL.
- Installing `PostgreSQL.PostgreSQL.17` downloaded and verified the installer, then failed with `0x800704c7: The operation was canceled by the user`, likely due to a declined or closed Windows elevation/install prompt.

Application startup attempt:

```bash
mvn spring-boot:run
```

Environment used for the attempt:

```text
DB_URL=jdbc:postgresql://localhost:5432/splitsphere
DB_USERNAME=splitsphere
DB_PASSWORD=splitsphere
JWT_SECRET=<valid local secret>
```

Result:

- Startup failed before Flyway migrations could run.
- Failure cause: Flyway could not obtain a PostgreSQL connection.

Key error:

```text
Unable to obtain connection from database: Connection to localhost:5432 refused.
Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.
```

Endpoint verification:

- Not executed because the Spring Boot app cannot start without a reachable PostgreSQL database.
- No endpoint success was faked.

Next valid database options:

- Approve/install local PostgreSQL 17 with database `splitsphere`, user `splitsphere`, password `splitsphere`, listening on port `5432`.
- Install/start Docker Desktop and run the repo's `docker-compose.yml`.
- Provide a cloud PostgreSQL JDBC URL, username, and password, then run with:

```bash
set DB_URL=jdbc:postgresql://HOST:5432/DB_NAME?sslmode=require
set DB_USERNAME=USER
set DB_PASSWORD=PASSWORD
set JWT_SECRET=replace-with-at-least-32-characters
mvn spring-boot:run
```

## 0.2 Neon PostgreSQL Configuration Check - 2026-05-30

Configuration inspected:

- `src/main/resources/application.yml`

Datasource shape:

- `DB_URL` expects a full JDBC URL, not separate host/port/database values.
- `DB_USERNAME` and `DB_PASSWORD` are supplied separately.
- `JWT_SECRET` is supplied separately and must be at least 32 characters.

Neon values required:

```text
DB_URL=jdbc:postgresql://<neon-host>:5432/<database>?sslmode=require&channelBinding=require
DB_USERNAME=<neon role/user>
DB_PASSWORD=<neon role password>
JWT_SECRET=<application JWT secret, at least 32 characters>
```

Configuration change:

- Added an explicit PostgreSQL JDBC driver declaration.
- Added non-secret comments documenting the Neon JDBC URL shape.
- No credentials were hardcoded.

SSL verification:

- Neon connection strings include `sslmode=require`.
- Neon troubleshooting docs recommend `sslmode=require&channel_binding=require` for insecure-connection errors.
- The PostgreSQL JDBC parameter form used here is `channelBinding=require`.

Current environment status:

- `DB_PASSWORD` is set.
- `JWT_SECRET` is set.
- `DB_URL` is not set.
- `DB_USERNAME` is not set.

Runtime status:

- Neon startup was not attempted yet because the required Neon `DB_URL` and `DB_USERNAME` are not available in this process.
- Flyway migration execution and endpoint checks are pending until Neon credentials are configured.

## 0.3 Hibernate 6.5 Mapping Fix - 2026-05-30

Runtime progress reported:

- Neon PostgreSQL connection works.
- Hikari starts successfully.
- Flyway applied all 9 migrations.
- Tables were created in Neon.

Offending entity:

- `ExpenseSplit`

Offending field:

- `user`

Cause:

- `ExpenseSplit.user` is a `@ManyToOne` association.
- Hibernate 6.5 rejects `@BatchSize` directly on that to-one property with:

```text
Property 'user' may not be annotated '@BatchSize'
```

All `@BatchSize` usages found:

- `Expense.splits`: valid collection-side `@OneToMany` usage, kept in place.
- `ExpenseSplit.user`: invalid Hibernate 6.5 to-one property usage, removed.
- `User`: added type-level `@BatchSize(size = 50)` to preserve batching for lazy `User` proxy loading.

Exact fix:

- Removed `@BatchSize(size = 50)` from `ExpenseSplit.user`.
- Removed the now-unused `BatchSize` import from `ExpenseSplit`.
- Added `@BatchSize(size = 50)` to the `User` entity type.
- Kept `@BatchSize(size = 50)` on `Expense.splits`, where it is valid as a collection optimization.

Verification:

```bash
mvn clean test -DskipTests
```

Result:

- Success. Main and test sources compile cleanly after the Hibernate mapping fix.

Runtime verification status:

- `mvn spring-boot:run` could not be re-run against Neon from this agent process because `DB_URL` and `DB_USERNAME` are not visible in the current environment.
- Only `DB_PASSWORD` and `JWT_SECRET` are visible.
- Running without those Neon values would fall back to `localhost:5432` and fail before validating Hibernate startup.
- To complete startup verification, set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` in the same terminal/process used to run Maven, then run:

```bash
mvn spring-boot:run
```

## 0.4 End-to-End API Test - 2026-05-30

Target:

- `http://localhost:8080`

Artifact:

- `docs/API_TESTING.md`
- `target/api-test/api-test-results-final.json`

Token handling:

- Access tokens were captured automatically from register/login responses.
- Documentation and saved test artifacts redact JWT values as `<JWT>`.
- No database credentials or JWT secrets were written to docs.

Endpoints tested:

- `POST /api/auth/register`: PASS
- `POST /api/auth/login`: PASS
- `GET /api/groups`: PASS
- `POST /api/groups`: PASS
- `POST /api/groups/join`: PASS
- `GET /api/groups/{groupId}/members`: PASS
- `POST /api/groups/{groupId}/expenses`: FAIL on the already-running process
- `POST /api/expenses`: PASS fallback
- `GET /api/groups/{groupId}/expenses`: PASS
- `GET /api/groups/{groupId}/balances`: PASS
- `GET /api/groups/{groupId}/settlement-suggestions`: PASS
- `POST /api/groups/{groupId}/settlements`: FAIL on the already-running process
- `POST /api/settlements`: PASS fallback
- `PATCH /api/settlements/{settlementId}/complete`: PASS
- `GET /api/groups/{groupId}/balances` after completion: PASS, balances returned to zero

Bugs found:

- Group-scoped create expense and create settlement endpoints rejected valid requests with HTTP 400 because request DTO validation required `groupId` in the body before the controller could inject the path variable.

Fixes made:

- `CreateExpenseRequest.groupId` no longer has `@NotNull` field validation.
- `CreateSettlementRequest.groupId` no longer has `@NotNull` field validation.
- `ExpenseService.createExpense` now explicitly rejects missing `groupId` with `BadRequestException`.
- `SettlementService.recordSettlement` now explicitly rejects missing `groupId` with `BadRequestException`.

Verification status:

- `mvn clean test -DskipTests`: PASS after the scoped endpoint validation fix.
- The currently running Spring Boot process had not been restarted after the fix, so scoped endpoint retest still reflected the old loaded classes.
- Top-level fallback endpoints confirmed the underlying expense, balance, settlement suggestion, settlement creation, and settlement completion services work end-to-end against the running database.

## 1. Project Startup Status

Status: Maven build and tests execute successfully. Runtime startup is blocked by unavailable PostgreSQL.

Attempted:

```bash
mvn clean test
```

Result: build success.

Runtime result:

- `mvn spring-boot:run` fails because `localhost:5432` refuses connections.
- Flyway does not reach migration execution because it cannot open a database connection.

The application now requires `JWT_SECRET` to be set and at least 32 characters long. A local startup also requires PostgreSQL to be reachable through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`.

## 2. Database Migration Status

Status: statically inspected, not executed.

Migration files present:

```text
V1__init_extensions.sql
V2__create_users_table.sql
V3__create_groups_table.sql
V4__create_categories_table.sql
V5__create_expenses_table.sql
V6__create_settlements_table.sql
V7__create_activity_logs_table.sql
V8__create_indexes.sql
V9__seed_default_categories.sql
```

Verified statically:

- Flyway naming follows `V#__description.sql`.
- `pgcrypto` is enabled.
- UUID primary keys use `DEFAULT gen_random_uuid()`.
- Money columns use `NUMERIC(12,2)`.
- Core foreign keys, unique constraints, check constraints, and required indexes exist.
- Seed categories include Food, Transport, Rent, Groceries, Entertainment, Shopping, Utilities, and Other.

## 3. Auth Status

Status: statically inspected and hardened.

Verified/fixed:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- Passwords are hashed with BCrypt.
- JWT expiration is configurable.
- JWT secret is no longer using a hardcoded fallback and must come from `JWT_SECRET`.
- Missing/invalid JWTs are routed to a 401 entry point for protected routes.
- Backend current user is resolved from Spring Security context.

## 4. Group API Status

Status: statically inspected and fixed.

Endpoints available:

- `GET /api/groups`
- `POST /api/groups`
- `GET /api/groups/{groupId}`
- `POST /api/groups/join`
- `GET /api/groups/{groupId}/members`
- `POST /api/groups/{groupId}/leave`
- `DELETE /api/groups/{groupId}`
- `DELETE /api/groups/{groupId}/members/{userId}`
- `POST /api/groups/{groupId}/invite-code`

Authorization checks:

- Only members can view group details and members.
- Only owners can delete groups.
- Only owners can remove members.
- Only owners can regenerate invite codes.
- Users join only with a valid invite code.

## 5. Expense API Status

Status: statically inspected and fixed.

Endpoints available:

- `POST /api/expenses`
- `GET /api/expenses/group/{groupId}`
- `GET /api/expenses/{expenseId}`
- `PUT /api/expenses/{expenseId}`
- `DELETE /api/expenses/{expenseId}`
- `POST /api/groups/{groupId}/expenses`
- `GET /api/groups/{groupId}/expenses`

Verified/fixed:

- Actor must be a group member.
- Payer must be a group member.
- All split participants must be group members.
- Equal split rounds by cents and preserves total amount.
- Custom split total must equal expense amount.
- Negative custom split amounts are rejected.
- Java entity now maps migrated columns: `title`, `amount`, `notes`, `receipt_url`.
- Split entity now maps `owed_amount` and `status`.

## 6. Balance Calculation Status

Status: statically inspected and unit tested.

Logic:

- Payer is credited by full expense amount.
- Each participant is debited by their `owed_amount`.
- Payer's own split is naturally netted out.
- Only completed settlements reduce outstanding balances.
- Balances are scoped to the requested group.

## 7. Settlement Engine Status

Status: statically inspected and fixed.

Endpoints available:

- `POST /api/settlements`
- `GET /api/settlements?groupId={groupId}`
- `PATCH /api/settlements/{settlementId}/complete`
- `POST /api/groups/{groupId}/settlements`
- `GET /api/groups/{groupId}/settlements`
- `GET /api/groups/{groupId}/settlement-suggestions`

Verified/fixed:

- Settlement entity now maps `receiver_id`, `status`, `created_at`, and `settled_at`.
- `payer_id <> receiver_id` is enforced by DB and service validation.
- Settlement suggestions use debtor/creditor netting.
- No zero-amount suggestions are emitted.
- Completed settlements set `settled_at`.

## 8. Security Checks Completed

Completed:

- Public endpoints limited to auth, Swagger, and health.
- CORS is environment-driven.
- JWT secret is environment-driven and validated for minimum length.
- Unknown JSON fields are rejected.
- Global exception handler avoids stack trace leakage.
- DTO validation is used on auth, group, expense, and settlement requests.
- Service-level authorization checks protect group-scoped resources.

## 9. Bugs Found

- JPA entities did not match Flyway schema.
- Repositories queried removed fields such as `description`.
- Settlement code used `payee_id`, but migration uses `receiver_id`.
- Expense split code used `amount` and boolean `paid`, but migration uses `owed_amount` and `status`.
- User entity expected `role` and `enabled` columns not present in migrations.
- Group membership code expected an `active` column not present in migrations.
- Missing activity log entity/repository/controller.
- Missing nested group-scoped endpoint aliases expected by API shape.
- JWT fallback secret was hardcoded.
- Unknown JSON fields were not rejected.

## 10. Bugs Fixed

- Aligned entities with migration schema.
- Added `ActivityLog` entity, repository, service, DTO, and controller.
- Reworked settlement mapping to `receiver` and enum status.
- Reworked expense split mapping to `owedAmount` and enum status.
- Removed persistence dependency on non-migrated user `role` and `enabled`.
- Removed persistence dependency on non-migrated group member `active`.
- Updated repositories to match current entity fields.
- Added owner-only member removal and invite regeneration.
- Added group-scoped expenses, balances, settlements, analytics, and activity endpoints.
- Added settlement completion endpoint.
- Hardened JWT secret handling and unauthorized response behavior.

## 11. Remaining TODOs

- Start PostgreSQL and run Flyway migrations against a real database.
- Run `mvn spring-boot:run` with required env vars.
- Execute endpoint verification once the database is reachable.
- Add integration tests for auth, group membership, expense creation, and settlement completion.
- Decide whether `groups.description`, `expense_date`, and persisted `split_type` should be added back to the schema or kept API-only.
- Add refresh tokens and rate limiting later if needed.

## 12. Example Test Flow With curl

Set environment:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/splitsphere
export DB_USERNAME=splitsphere
export DB_PASSWORD=splitsphere
export JWT_SECRET=replace-this-with-a-very-long-local-development-secret
```

Start:

```bash
mvn spring-boot:run
```

Register:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Haider","email":"haider@example.com","password":"StrongPass123"}'
```

Login:

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"haider@example.com","password":"StrongPass123"}'
```

Create group:

```bash
curl -X POST http://localhost:8080/api/groups \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hostel Roommates"}'
```

Create expense:

```bash
curl -X POST http://localhost:8080/api/groups/GROUP_ID/expenses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payerId":"USER_ID",
    "title":"Dinner at Monal",
    "amount":3000.00,
    "splitType":"EQUAL",
    "splits":[
      {"userId":"USER_ID"}
    ]
  }'
```

View balances:

```bash
curl http://localhost:8080/api/groups/GROUP_ID/balances \
  -H "Authorization: Bearer TOKEN"
```

View settlement suggestions:

```bash
curl http://localhost:8080/api/groups/GROUP_ID/settlement-suggestions \
  -H "Authorization: Bearer TOKEN"
```

## 13. Security Hardening Pass - 2026-05-30

Implemented backend security hardening while preserving existing API payload shapes.

Changes made:

- Added in-memory rate limiting with graceful JSON `429` responses.
- Added stricter limits for:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `POST /api/groups/join`
- Added user-based limiting for authenticated requests and IP-based limiting for unauthenticated requests.
- Tightened Jakarta validation on request DTOs.
- Added trimming constructors for request DTO string fields.
- Added stored-text sanitization for user names, group names, expense titles, and activity descriptions.
- Added JSON authentication errors.
- Explicitly configured security headers including content type options, frame denial, no-referrer, and cache control.
- Removed hardcoded DB credential defaults from backend config and Docker Compose.
- Added `.env.*` ignores and frontend `.env` ignores.

Files changed are listed in `SECURITY_HARDENING_REPORT.md`.

Verification:

- `& 'C:\Program Files\Apache\Maven\bin\mvn.cmd' clean test`
- Result: PASS, 2 tests run, 0 failures, 0 errors.

Runtime/API verification:

- Restart was attempted.
- Startup reached Neon but failed with database authentication:
  - `ERROR: password authentication failed for user 'neondb_owner'`
- `tools/run-api-test.ps1` was run after the failed restart and was blocked because `localhost:8080` was not reachable.

Current blocker:

- The correct Neon `DB_PASSWORD` is not available in this shell. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET`, restart the backend, then rerun `tools/run-api-test.ps1`.

## 14. Google Login Implementation - 2026-05-30

Implemented secure Google login without changing normal email/password auth.

Backend changes:

- Added required environment variable:
  - `GOOGLE_CLIENT_ID`
- Added endpoint:
  - `POST /api/auth/google`
- Added request DTO:

```json
{
  "idToken": "google-id-token"
}
```

Security behavior:

- Google ID tokens are verified server-side using Google's Java `GoogleIdTokenVerifier`.
- Verifier audience is configured from `GOOGLE_CLIENT_ID`.
- Backend rejects invalid tokens with `401`.
- Backend rejects `email_verified=false` with `401`.
- Backend rejects missing/blank `idToken` with validation `400`.
- Backend extracts `name`, `email`, and `picture` only from verified Google token payload claims.
- Backend never trusts frontend-provided Google profile fields.
- Existing users are reused by email.
- New Google users are created with:
  - verified Google email
  - sanitized Google display name, falling back to email when absent
  - Google picture URL in `avatar_url`
  - generated BCrypt password placeholder because `users.password_hash` is required by the current schema
- Auth response shape is unchanged and returns the normal SplitSphere JWT.

Frontend changes:

- Added Google Identity Services button component.
- Frontend reads:
  - `VITE_GOOGLE_CLIENT_ID`
- Frontend exchanges the Google `credential` ID token with:
  - `POST /api/auth/google`
- On success, the existing auth context stores the normal SplitSphere JWT exactly like email/password login.

Configuration:

Backend:

```powershell
$env:GOOGLE_CLIENT_ID = "<Google OAuth web client ID>"
```

Frontend:

```powershell
$env:VITE_GOOGLE_CLIENT_ID = "<Google OAuth web client ID>"
```

Docker Compose now requires `GOOGLE_CLIENT_ID` for the API container.

Verification:

- `& 'C:\Program Files\Apache\Maven\bin\mvn.cmd' clean test`
- Result: PASS, 2 tests run, 0 failures, 0 errors.
- `npm run build` in `FrontEnd`
- Result: PASS.

Runtime verification note:

- Live Google login requires a real Google OAuth web client ID configured in both backend and frontend and a browser sign-in to produce a Google ID token.
- Full backend API runtime verification remains blocked in this shell by the missing correct Neon `DB_PASSWORD` noted in section 13.

## 15. Security Audit Remediation - 2026-05-30

Fixed high-severity broken access control findings from the production security audit.

Files changed:

- `pom.xml`
- `src/main/java/com/splitsphere/config/OpenApiConfig.java`
- `src/main/java/com/splitsphere/config/SecurityConfig.java`
- `src/main/java/com/splitsphere/dto/expense/CreateExpenseRequest.java`
- `src/main/java/com/splitsphere/dto/settlement/CreateSettlementRequest.java`
- `src/main/java/com/splitsphere/security/RateLimitingFilter.java`
- `src/main/java/com/splitsphere/service/ExpenseService.java`
- `src/main/java/com/splitsphere/service/SettlementService.java`
- `src/main/resources/application.yml`
- `src/test/java/com/splitsphere/security/RateLimitingFilterTest.java`
- `src/test/java/com/splitsphere/service/ExpenseServiceSecurityTest.java`
- `src/test/java/com/splitsphere/service/SettlementServiceSecurityTest.java`
- `SECURITY_AUDIT_REPORT.md`

Security fixes:

- Expense creation now requires the authenticated actor to be the payer. Missing `payerId` defaults to the actor.
- Expense update now prevents non-owner payer reassignment to another user.
- Settlement creation now requires the authenticated actor to be the settlement payer. Missing `payerId` defaults to the actor.
- Settlement receiver must still be an active group member, and payer/receiver equality is rejected.
- Settlement completion now requires receiver confirmation. Group owner override was later removed from the normal confirmation path in the 2026-06-02 final blocker fix.
- Rate limiting no longer trusts `X-Forwarded-For`; public limits use `request.getRemoteAddr()` and authenticated limits use user id.
- Duplicate route families were kept for frontend compatibility, but both expense and settlement route variants use the same secured service methods.
- Swagger/OpenAPI is disabled by default, enabled by default only for `local`/`dev`, and unauthenticated Swagger access is only permitted in `local`/`dev` profiles.

Tests added:

- `ExpenseServiceSecurityTest`
- `SettlementServiceSecurityTest`
- `RateLimitingFilterTest`

Verification:

```powershell
mvn clean test
```

Result:

- PASS
- Tests run: 19
- Failures: 0
- Errors: 0
- Skipped: 0

API smoke test status:

- `curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/actuator/health` returned `000`.
- `tools/run-api-test.ps1` was not run because no backend process was reachable on `localhost:8080`.

Remaining production note:

- The in-memory rate limiter is suitable for a single backend instance. Use Redis or another shared limiter before horizontal scaling.

## 16. Settlement Confirmation And Flexible Split Participants - 2026-06-01

Backend changes:

- Settlement creation now stores `PENDING_CONFIRMATION` instead of immediately completing payment.
- Balance calculations continue to apply only `COMPLETED` settlements, so pending/rejected payments do not alter balances.
- `PATCH /api/settlements/{settlementId}/complete` is receiver confirmation, not payer self-completion.
- `POST /api/settlements/{settlementId}/reject` marks a pending settlement `REJECTED`.
- Activity log records `SETTLEMENT_CREATED`, `SETTLEMENT_CONFIRMED`, and `SETTLEMENT_REJECTED`.
- Settlement status database constraints now allow `PENDING_CONFIRMATION` and `REJECTED` via `V11__settlement_confirmation_statuses.sql`.
- Expense creation already supported explicit `splits`; tests now lock that behavior so selected participants are the only people included.

Authorization and validation:

- Payer can create settlements only for themselves.
- Receiver can confirm/reject settlement requests. Group owners cannot resolve another member's settlement through the normal confirmation/rejection endpoints.
- Payer alone cannot complete or reject their own payment.
- Expense split participants must be active group members.
- Empty split lists, duplicate user IDs, and invalid custom totals are rejected.

Verification:

```powershell
mvn clean test
```

Result: PASS. Tests run: 27, failures: 0, errors: 0, skipped: 0.

## 17. Final Settlement Authorization Blocker Fix - 2026-06-02

Backend changes:

- Removed group-owner override from standard settlement completion.
- Removed group-owner override from standard settlement rejection.
- `SettlementService.completeSettlement(...)` and `SettlementService.rejectSettlement(...)` now require the authenticated actor to be the receiver.

Tests updated:

- Payer cannot complete.
- Payer cannot reject.
- Receiver can complete.
- Receiver can reject.
- Group owner cannot complete another member's settlement.
- Group owner cannot reject another member's settlement.

Verification:

```powershell
mvn clean test
```

Result: PASS. Tests run: 28, failures: 0, errors: 0, skipped: 0.
