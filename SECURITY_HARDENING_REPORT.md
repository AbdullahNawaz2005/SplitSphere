# SplitSphere Security Hardening Report

Run date: 2026-05-30

## Implemented Controls

### Rate limiting

- Added an in-memory `OncePerRequestFilter` for API rate limiting.
- Public/unauthenticated requests are limited by client IP.
- Authenticated requests are limited by authenticated user id.
- Stricter endpoint-specific limits:
  - `POST /api/auth/login`: 5 requests per minute per IP
  - `POST /api/auth/register`: 3 requests per minute per IP
  - `POST /api/groups/join`: 10 requests per minute per authenticated user, or IP if unauthenticated
- Rate-limit failures return clean JSON `429 Too Many Requests` responses with `Retry-After: 60`.

### Input validation

- Request DTO validation was tightened with Jakarta validation annotations.
- Added or strengthened:
  - `@NotBlank`
  - `@NotNull`
  - `@Email`
  - `@Size`
  - `@Pattern`
  - `@DecimalMin`
- Length limits are enforced for:
  - user names
  - emails
  - passwords
  - group names
  - group descriptions
  - invite codes
  - expense titles
  - settlement notes
  - split participant lists
  - expense search query parameters
- Existing tested API payloads remain valid.
- Unknown JSON fields are still rejected by Jackson via `spring.jackson.deserialization.fail-on-unknown-properties=true`.

### Input sanitization

- Added `InputSanitizer` for stored display text.
- Trimmed inbound user strings in request DTO constructors.
- Stored display fields are sanitized before persistence:
  - user names
  - group names
  - expense titles
  - activity log actions/descriptions
- Email normalization is unchanged.
- Passwords, UUIDs, JWTs, and financial amounts are not sanitized or transformed.

### Secret handling

- Removed hardcoded database credential defaults from `application.yml`.
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` are now required from the environment.
- Updated `docker-compose.yml` to require environment-provided database credentials and JWT secret.
- Added `.env.*` to root ignore rules and `.env` / `.env.*` to `FrontEnd/.gitignore`.
- Repo secret scan found no actual committed JWT secret, DB password, API key, or DB URL with credentials.

### Security headers

- Spring Security headers are explicitly configured for:
  - `X-Content-Type-Options`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - cache-control headers for secured responses
- Existing localhost CORS configuration is preserved.

### Error handling

- Authentication failures now return clean JSON instead of empty responses.
- Rate-limit failures return clean JSON.
- Existing global exception handler continues to hide stack traces, SQL internals, JWT parser details, and secrets from clients.

## Files Changed

- `src/main/java/com/splitsphere/config/SecurityConfig.java`
- `src/main/java/com/splitsphere/security/JsonAuthenticationEntryPoint.java`
- `src/main/java/com/splitsphere/security/RateLimitingFilter.java`
- `src/main/java/com/splitsphere/util/InputSanitizer.java`
- `src/main/java/com/splitsphere/dto/auth/LoginRequest.java`
- `src/main/java/com/splitsphere/dto/auth/RegisterRequest.java`
- `src/main/java/com/splitsphere/dto/group/CreateGroupRequest.java`
- `src/main/java/com/splitsphere/dto/group/JoinGroupRequest.java`
- `src/main/java/com/splitsphere/dto/expense/CreateExpenseRequest.java`
- `src/main/java/com/splitsphere/dto/expense/UpdateExpenseRequest.java`
- `src/main/java/com/splitsphere/dto/settlement/CreateSettlementRequest.java`
- `src/main/java/com/splitsphere/controller/ExpenseController.java`
- `src/main/java/com/splitsphere/controller/GroupExpenseController.java`
- `src/main/java/com/splitsphere/service/AuthService.java`
- `src/main/java/com/splitsphere/service/GroupService.java`
- `src/main/java/com/splitsphere/service/ExpenseService.java`
- `src/main/java/com/splitsphere/service/ActivityLogService.java`
- `src/main/resources/application.yml`
- `docker-compose.yml`
- `.gitignore`
- `FrontEnd/.gitignore`

## Verification

Command:

```powershell
& 'C:\Program Files\Apache\Maven\bin\mvn.cmd' clean test
```

Result: PASS

Summary:

- Compiled 83 backend source files.
- Ran `BalanceServiceTest`.
- Tests run: 2
- Failures: 0
- Errors: 0

Backend restart:

- Attempted to restart Spring Boot on `localhost:8080`.
- Environment recovery found `DB_URL` and `DB_USERNAME`, and this shell already had `DB_PASSWORD` and `JWT_SECRET`.
- Startup reached Neon PostgreSQL but failed authentication:
  - `ERROR: password authentication failed for user 'neondb_owner'`
- Because the old process was stopped for restart and the available password is not the correct Neon password, the backend is currently not running on port `8080` from this shell.

API test:

```powershell
powershell -ExecutionPolicy Bypass -File tools\run-api-test.ps1
```

Result: BLOCKED

Reason:

- `Invoke-RestMethod : Unable to connect to the remote server`
- Backend restart is blocked until the correct `DB_PASSWORD` is available in the environment.

## Remaining TODOs

- Set the correct Neon environment variables in the shell that starts the backend:
  - `DB_URL`
  - `DB_USERNAME`
  - `DB_PASSWORD`
  - `JWT_SECRET`
- Restart with:

```powershell
& 'C:\Program Files\Apache\Maven\bin\mvn.cmd' spring-boot:run
```

- Rerun:

```powershell
powershell -ExecutionPolicy Bypass -File tools\run-api-test.ps1
```

- Consider replacing the in-memory rate limiter with Redis or another shared limiter before running multiple backend instances.
