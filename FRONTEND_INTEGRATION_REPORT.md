# SplitSphere Frontend Integration Report

Run date: 2026-05-30

## Status

The Stitch frontend is connected to the verified Spring Boot backend through `VITE_API_BASE_URL`.

Frontend URL: `http://localhost:5173`

Backend URL: `http://localhost:8080`

Use `localhost:5173` for browser testing. Backend CORS allows `http://localhost:5173`; `http://127.0.0.1:5173` did not return CORS allow headers in the preflight check.

## Files Changed

- `.gitignore`
- `FRONTEND_INTEGRATION_REPORT.md`
- `FrontEnd/.env`
- `FrontEnd/.env.example`
- `FrontEnd/package.json`
- `FrontEnd/package-lock.json`
- `FrontEnd/src/main.tsx`
- `FrontEnd/src/App.tsx`
- `FrontEnd/src/contexts/AppearanceContext.tsx`
- `FrontEnd/src/services/api.ts`
- `FrontEnd/src/services/authService.ts`
- `FrontEnd/src/services/groupService.ts`
- `FrontEnd/src/services/expenseService.ts`
- `FrontEnd/src/services/settlementService.ts`
- `FrontEnd/src/contexts/AuthContext.tsx`
- `FrontEnd/src/contexts/ToastContext.tsx`
- `FrontEnd/src/utils/display.ts`
- `FrontEnd/src/utils/preferences.ts`
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
- `FrontEnd/vercel.json`
- `FrontEnd/src/data/mockData.ts` deleted

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
- Demo financial data has been removed from dashboard, insights, profile, add-expense summary fallbacks, and the landing preview.
- Empty analytics states now show: "No expenses yet. Add your first expense to see insights."
- Profile settings were reduced to real account information, global dark mode, currency selection, and sign out.
- Dark mode is applied globally with the existing glassmorphism style and persists in `localStorage`.
- Currency selection supports `PKR Rs.`, `USD $`, and `GBP £`, persists in `localStorage`, and uses frontend-only display/input conversion while backend amounts remain stored in PKR.
- Temporary conversion rates are `1 USD = 280 PKR` and `1 GBP = 355 PKR`. Backend PKR values are converted for display only; Add Expense input values are converted back to PKR once before POSTing.
- Add Expense amount input now shows the selected currency symbol and placeholder (`Rs. 0.00`, `$0.00`, or `£0.00`), and split preview uses the entered display currency instead of re-converting typed values.
- Add Expense requires a short description/title for the actual expense, such as "Dinner at Monal", with an 80-character limit.
- Add Expense category selection now uses realistic frontend labels and Lucide icons: Food & Dining, Groceries, Transport, Fuel, Rent, Utilities, Shopping, Travel, Entertainment, Medical, Education, Subscriptions, Gifts, Home Supplies, Maintenance, Fitness, Pets, Events, and Other.
- Category search was added to the Add Expense step. Known backend category/icon slugs such as `party-popper`, `bolt`, `circle`, `utensils`, and `shopping-cart` are mapped to readable category names instead of being shown as raw text.
- Payment methods, notifications, theme, help/support, privacy/security, fake profile stats, reminder delivery, and other dead settings were removed from visible UI.

Google sign-in/sign-up uses Google Identity via `@react-oauth/google`, sends the Google ID token to `POST /api/auth/google`, stores the returned JWT the same way as email/password login, and redirects to the dashboard.

## Google Login Flow

1. User clicks the existing Google button on login/signup.
2. Google returns `credentialResponse.credential` (ID token).
3. Frontend sends `{ "idToken": "<credential>" }` to `POST /api/auth/google`.
4. Backend returns the standard auth response; frontend stores the JWT and updates auth context before redirecting to `/dashboard`.

## Still Mocked Or Partial

- Dashboard weekly spending trend and Insights monthly/weekly charts were removed because there is no verified time-series endpoint.
- Insights category split is shown only when the backend analytics endpoint returns real category totals.
- Profile editing is read-only because no verified update-profile endpoint exists.
- Login provider details are not exposed by the backend, so Profile states that the login method is not exposed instead of guessing.
- Password change, notification preferences, theme switching, payment methods, support links, and reminder delivery are not shown because no verified backend behavior exists for them.

## Commands Run

```powershell
npm install @react-oauth/google
```

Result: PASS

```powershell
npm run build
```

Result: PASS. Re-run after production cleanup.

```powershell
npm run dev -- --host 127.0.0.1
```

Result: PASS. Vite served the app and `http://localhost:5173` returned HTTP 200.

Additional production cleanup verification:

```powershell
npm run build
```

Result: PASS. Vite bundle completed with the existing large chunk warning only.

Add Expense currency/category cleanup verification:

```powershell
npm run build
```

Result: PASS.

```powershell
node --input-type=module -e "const rates={PKR:1,USD:280,GBP:355}; for (const c of ['PKR','USD','GBP']) { const entered=10; const base=entered*rates[c]; const displayed=base/rates[c]; console.log(c + ': entered=' + entered + ', backendPKR=' + base + ', displayed=' + displayed); }"
```

Result: PASS. `PKR` submitted `10`, `USD` submitted `2800`, and `GBP` submitted `3550` for an entered value of `10`; converting each backend PKR amount back to display currency returned `10`, confirming no double conversion in the frontend conversion boundary.

```powershell
npm run preview -- --host 127.0.0.1 --port 4173
```

Result: PASS. Preview route smoke checks returned HTTP 200 and served the React app shell for `/dashboard`, `/groups`, and `/profile`.

```powershell
Invoke-WebRequest http://127.0.0.1:5173
```

Result: PASS. Local Vite server returned HTTP 200.

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://localhost:8080/api/auth/me
```

Result: Backend unavailable in this verification session (`000`), so a live brand-new account UI flow could not be completed here. The frontend empty states were verified by source and build: mock financial imports were removed, `mockData.ts` was deleted, and dashboard/insights/profile now render empty states unless live backend expense data exists.

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

## Settlement Confirmation And Flexible Splits - 2026-06-01

Frontend changes:

- Add Expense now shows a real "Split between" member checklist using backend group member IDs.
- The payer is no longer inserted automatically into splits; checked members are the only submitted split participants.
- Payer can still be checked, and their own share is represented as a split without creating self-debt in optimized balances.
- Select all, Clear, and live split preview were added.
- Dashboard group switching passes the matching group's real member list into the modal.
- Settlement suggestions now create pending settlement requests instead of immediately completing.
- Receiver-visible pending confirmations show real backend settlement rows with Confirm Received and Not Received actions.
- Settlement status badges distinguish Pending confirmation, Completed, and Rejected.

Verification:

```powershell
npm run build
```

Result: PASS. TypeScript and Vite production build completed successfully.

## Final Production Blocker Fixes - 2026-06-02

Frontend changes:

- Settlement confirm/reject buttons are now shown only to the settlement receiver. Group owners no longer see normal-path controls for another member's pending settlement.
- Dashboard, Groups, Activity, Insights, Settlements, Profile, and Add Expense modal were tightened for 360px, 390px, and 430px mobile widths.
- Mobile card rows now use responsive stacking/wrapping, `min-w-0`, and `break-words` where long group names, settlement messages, or currency values previously caused cramped layouts.
- Add Expense modal now has `role="dialog"`, `aria-modal`, labelled title/step text, Escape-to-close, a focus loop, labelled close button, labelled amount/search/description inputs, and a constrained mobile height with internal scrolling.
- Create/Join Group modal now has `role="dialog"`, `aria-modal`, labelled title, Escape-to-close, a focus loop, labelled backdrop/close controls, and a constrained mobile height.
- Icon-only controls now have accessible names: mobile navigation menu, profile avatar link, Add Expense floating action button, modal close buttons, password visibility toggles, and Group Detail back button.
- Focus-visible styling was strengthened with an additional focus ring shadow and textarea/role-button coverage.

Verification:

```powershell
npm run build
```

Result: PASS. Vite still reports the existing large chunk warning; no TypeScript errors.

```powershell
mvn clean test
```

Result: PASS. Backend security test count is now 28 after adding group-owner settlement denial coverage.

Local frontend smoke test:

- Ran a temporary headless Chrome/CDP smoke test with mocked authenticated backend responses.
- Checked `/dashboard`, `/groups`, `/activity`, `/insights`, `/settlements`, `/profile`, and the Add Expense modal at 360px, 390px, and 430px CSS widths.
- Result: PASS. No horizontal overflow, no visible unlabeled icon-only buttons, and no application console errors were detected.

## Final Blocker Follow-Up - 2026-06-10

Frontend changes:

- Added explicit label associations for Add Expense amount, description, group selector, and category search controls.
- Added accessible labels for Groups search, Create/Join Group modal fields, Insights group selector, Profile display currency selector, and toast dismiss controls.
- Create/Join Group modal now focuses the group-name field when opened while retaining Escape close and keyboard focus looping.
- Profile dark-mode toggle now reports `aria-pressed`.
- Group Detail mobile rows now use tighter padding, responsive stacking, `min-w-0`, truncation, and `break-words` so long names and currency values do not force horizontal scrolling.

Verification:

```powershell
npm run build
```

Result: PASS. Vite still reports the existing large chunk warning only.

```powershell
mvn clean test
```

Result: PASS. 28 tests, 0 failures.

Local frontend smoke test:

- Started Vite locally on `http://127.0.0.1:5173`.
- Ran a temporary headless Chrome/CDP smoke test with mocked authenticated API responses.
- Checked Dashboard, Groups, Activity, Insights, Settlements, Profile, and Dashboard Add Expense modal at 360px, 390px, and 430px.
- Result: PASS across 21 checks. No horizontal overflow, no visible unlabeled icon-only buttons, no unlabeled dialogs, and no runtime/console errors.
