# SplitSphere Frontend Integration Report

Run date: 2026-05-30

## Status

The Stitch frontend is connected to the verified Spring Boot backend through `VITE_API_BASE_URL`.

Frontend URL: `http://localhost:5173`

Backend URL: `http://localhost:8080`

Use `localhost:5173` for browser testing. Backend CORS allows `http://localhost:5173`; `http://127.0.0.1:5173` did not return CORS allow headers in the preflight check.

## Files Changed

- `.gitignore`
- `FrontEnd/.env`
- `FrontEnd/.env.example`
- `FrontEnd/package.json`
- `FrontEnd/package-lock.json`
- `FrontEnd/src/main.tsx`
- `FrontEnd/src/App.tsx`
- `FrontEnd/src/services/api.ts`
- `FrontEnd/src/services/authService.ts`
- `FrontEnd/src/services/groupService.ts`
- `FrontEnd/src/services/expenseService.ts`
- `FrontEnd/src/services/settlementService.ts`
- `FrontEnd/src/contexts/AuthContext.tsx`
- `FrontEnd/src/contexts/ToastContext.tsx`
- `FrontEnd/src/utils/display.ts`
- `FrontEnd/src/components/GoogleAuthButton.tsx`
- `FrontEnd/src/components/AddExpenseModal.tsx`
- `FrontEnd/src/components/Navigation.tsx`
- `FrontEnd/src/pages/LoginPage.tsx`
- `FrontEnd/src/pages/SignupPage.tsx`
- `FrontEnd/src/pages/DashboardPage.tsx`
- `FrontEnd/src/pages/GroupsPage.tsx`
- `FrontEnd/src/pages/GroupDetailPage.tsx`
- `FrontEnd/src/pages/SettlementsPage.tsx`
- `FrontEnd/src/pages/InsightsPage.tsx`
- `FrontEnd/src/pages/ActivityPage.tsx`
- `FrontEnd/src/pages/ProfilePage.tsx`

No backend code was changed for this integration pass.

## Configuration

`FrontEnd/.env`

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

JWTs are stored in `localStorage` under frontend-only keys. No secrets or credentials are hardcoded.

## Endpoints Connected

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `GET /api/groups`
- `POST /api/groups`
- `POST /api/groups/join`
- `GET /api/groups/{groupId}`
- `GET /api/groups/{groupId}/members`
- `GET /api/groups/{groupId}/expenses`
- `POST /api/groups/{groupId}/expenses`
- `POST /api/expenses` fallback for older running backend processes
- `GET /api/groups/{groupId}/balances`
- `GET /api/groups/{groupId}/settlement-suggestions`
- `GET /api/groups/{groupId}/settlements`
- `POST /api/groups/{groupId}/settlements`
- `POST /api/settlements` fallback for older running backend processes
- `PATCH /api/settlements/{settlementId}/complete`
- `GET /api/groups/{groupId}/activity`
- `GET /api/groups/{groupId}/analytics`
- `GET /api/categories`

## Frontend Behavior Connected

- Login and signup submit to the backend and store the returned access token.
- Protected app routes redirect unauthenticated users to login.
- Logged-in users are redirected away from login/signup to dashboard.
- Logout clears local auth state and returns to the landing page.
- Protected requests attach `Authorization: Bearer <token>`.
- `401` responses clear the local token and redirect to login.
- Groups list, group creation, and invite-code joining use live backend data.
- Group detail, members, expenses, balances, and settlement suggestions use live backend data.
- Add Expense modal now submits backend-compatible `EQUAL` split requests while preserving the existing step animation and glass UI.
- Settlement suggestions can be recorded and marked complete through backend endpoints.
- Activity is loaded from group activity endpoints.
- Insights load group analytics where available.
- Toast notifications and loading/empty states are implemented without redesigning the Stitch UI.

Google sign-in/sign-up uses Google Identity via `@react-oauth/google`, sends the Google ID token to `POST /api/auth/google`, stores the returned JWT the same way as email/password login, and redirects to the dashboard.

## Google Login Flow

1. User clicks the existing Google button on login/signup.
2. Google returns `credentialResponse.credential` (ID token).
3. Frontend sends `{ "idToken": "<credential>" }` to `POST /api/auth/google`.
4. Backend returns the standard auth response; frontend stores the JWT and updates auth context before redirecting to `/dashboard`.

## Still Mocked Or Partial

- Dashboard weekly spending trend remains mock data because the backend has no verified time-series trend endpoint.
- Insights monthly stacked chart remains mock data because the backend exposes group totals/category spending, not month-by-month history.
- Reminder delivery in settlements is frontend-only because no verified reminder endpoint exists.
- Profile settings, payment methods, dark mode, theme, and notification controls remain presentation-only because no verified backend endpoints exist for them.

## Commands Run

```powershell
npm install @react-oauth/google
```

Result: PASS

```powershell
npm run build
```

Result: PASS

```powershell
npm run dev -- --host 127.0.0.1
```

Result: PASS. Vite served the app and `http://localhost:5173` returned HTTP 200.

Backend API smoke verification was run with generated test users and automated JWT capture. Results:

```json
{
  "ownerRegistered": true,
  "ownerLoginTokenCaptured": true,
  "memberRegistered": true,
  "groupCreated": true,
  "memberJoined": true,
  "membersCount": 2,
  "expenseCreated": true,
  "expensesCount": 1,
  "balancesCount": 2,
  "suggestionsCount": 1,
  "frontendUrl": "http://localhost:5173",
  "corsAllowsLocalhost5173": true
}
```

## How To Run

Backend:

```powershell
cd "E:\Nust Assignments\SplitSphere"
mvn spring-boot:run
```

Frontend:

```powershell
cd "E:\Nust Assignments\SplitSphere\FrontEnd"
npm run dev
```

Open:

```text
http://localhost:5173
```

## Known Issues

- Use `http://localhost:5173` instead of `http://127.0.0.1:5173` unless backend CORS is expanded.
- Production bundle builds successfully but Vite reports a large chunk warning. This is not a functional blocker.
- In-app browser automation was not available in this environment, so verification used TypeScript build, Vite HTTP check, CORS preflight, and backend API smoke calls.

## Testing Steps

1. Configure `.env` with `VITE_API_BASE_URL` and `VITE_GOOGLE_CLIENT_ID`.
2. Run `npm run build` in `FrontEnd`.
3. Run `npm run dev` and test Google sign-in plus email/password login.
