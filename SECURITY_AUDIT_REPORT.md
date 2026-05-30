# SplitSphere Security Audit Remediation Report

Run date: 2026-05-30

## Production Readiness Status

Status: Backend authorization fixes are implemented and unit-tested. The app is ready to redeploy from the backend security perspective after normal deployment configuration is confirmed.

Runtime API smoke testing was not completed in this shell because `http://localhost:8080/actuator/health` returned HTTP `000`, meaning no backend process was reachable.

## Vulnerabilities Fixed

### 1. Expense payer impersonation

- `ExpenseService.createExpense` now resolves the authenticated actor from `CurrentUserService`.
- A missing `payerId` defaults to the authenticated actor.
- A provided `payerId` must match the authenticated actor or the service returns `403`.
- The payer and every split participant must still be active members of the group.
- Non-members remain blocked from creating group expenses.

Security decision: normal users cannot record expenses on behalf of others. This keeps identity authority server-side and avoids trusting frontend IDs.

### 2. Settlement impersonation

- `SettlementService.recordSettlement` now resolves the actor from `CurrentUserService`.
- A missing `payerId` defaults to the authenticated actor.
- A provided `payerId` must match the authenticated actor or the service returns `403`.
- Receiver membership is still validated server-side.
- Payer and receiver cannot be the same user.

Security decision: settlement creation means "I paid/settled with someone", so only that payer can record it.

### 3. Settlement completion authorization flaw

- Settlement completion now allows the receiver or the group owner.
- A payer who is not also the group owner can no longer mark their own settlement completed.
- Cancelled settlements still cannot be completed.

Security decision: receiver confirmation is the safer default because the receiver is the party who can confirm they were paid. Group owner override is retained for group administration.

### 4. Rate limiter IP spoofing

- `RateLimitingFilter` no longer trusts `X-Forwarded-For`.
- The limiter uses `request.getRemoteAddr()` for public/IP-scoped limits.
- Authenticated request limiting remains keyed by authenticated user id.
- Login, register, group join, and general authenticated endpoint limits remain active.

Render/proxy assumption: forwarded headers are not trusted until a trusted proxy chain is explicitly configured. This prevents clients from bypassing limits by rotating spoofed `X-Forwarded-For` values.

### 5. Duplicate API routes

- Duplicate route families were kept for frontend compatibility:
  - `/api/expenses` and `/api/groups/{groupId}/expenses`
  - `/api/settlements` and `/api/groups/{groupId}/settlements`
  - `/api/analytics/group/{groupId}` and `/api/groups/{groupId}/analytics`
- The duplicate expense and settlement controllers already delegate into the same secured service methods.
- No duplicate route was removed because the current frontend still uses both top-level fallback and group-scoped routes.

### 6. Swagger/OpenAPI production exposure

- OpenAPI bean creation is restricted to `local` and `dev` profiles.
- `springdoc.api-docs.enabled` and `springdoc.swagger-ui.enabled` default to `false`.
- Local/dev profiles enable Swagger by default unless overridden.
- Security only permits unauthenticated Swagger routes in `local` or `dev` profiles.

Production behavior: Swagger/API docs are disabled by default and are not publicly permitted unless the app is explicitly running a local/dev profile.

## Files Changed

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

## Tests Added

- Expense security:
  - User A cannot create an expense with User B as payer.
  - User A can create an expense with their own payer id.
  - Missing expense payer defaults to the authenticated actor.
  - Non-member cannot create an expense in a group.
- Settlement security:
  - User A cannot create a settlement with User B as payer.
  - User A can create a settlement where User A is payer.
  - Missing settlement payer defaults to the authenticated actor.
  - Receiver must be a group member.
- Settlement completion:
  - Payer cannot complete unless group owner.
  - Receiver can complete.
  - Group owner can complete.
- Rate limiter:
  - Spoofed `X-Forwarded-For` values do not bypass the login rate limit.

## Verification

```powershell
mvn clean test
```

Result: PASS

Summary:

- Tests run: 19
- Failures: 0
- Errors: 0
- Skipped: 0

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/actuator/health
```

Result: `000`

`tools/run-api-test.ps1` was not run because the backend was not reachable on `localhost:8080`.

## Remaining Risks

- The current rate limiter is in-memory. It is acceptable for one backend instance, but a shared limiter such as Redis should be used before horizontal scaling.
- Swagger remains available in local/dev profiles for developer use. Do not run production with `local` or `dev` active profiles.
- Full API smoke testing should be rerun after the backend is started with valid database and JWT environment variables.
