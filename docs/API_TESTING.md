# SplitSphere API Testing

Test run: 2026-05-30

Base URL: `http://localhost:8080`

Result source: `target/api-test/api-test-results-final.json`

Secrets are redacted. JWT values are shown as `<JWT>` and passwords as `<password>`.

## Summary

| Endpoint | Method | JWT required | Result |
| --- | --- | --- | --- |
| `/api/auth/register` | `POST` | No | PASS |
| `/api/auth/login` | `POST` | No | PASS |
| `/api/groups` | `GET` | Yes | PASS |
| `/api/groups` | `POST` | Yes | PASS |
| `/api/groups/join` | `POST` | Yes | PASS |
| `/api/groups/{groupId}/members` | `GET` | Yes | PASS |
| `/api/groups/{groupId}/expenses` | `POST` | Yes | FAIL on currently running process |
| `/api/expenses` | `POST` | Yes | PASS fallback |
| `/api/groups/{groupId}/expenses` | `GET` | Yes | PASS |
| `/api/groups/{groupId}/balances` | `GET` | Yes | PASS |
| `/api/groups/{groupId}/settlement-suggestions` | `GET` | Yes | PASS |
| `/api/groups/{groupId}/settlements` | `POST` | Yes | FAIL on currently running process |
| `/api/settlements` | `POST` | Yes | PASS fallback |
| `/api/settlements/{settlementId}/complete` | `PATCH` | Yes | PASS |

The scoped `POST /api/groups/{groupId}/expenses` and `POST /api/groups/{groupId}/settlements` failures were caused by DTO validation requiring `groupId` in the request body before the controllers inject the path variable. Code has been patched so `groupId` is validated in the service after scoped controllers populate it. The running backend process must be restarted to pick up that fix.

## Register Owner

Endpoint: `POST /api/auth/register`

JWT required: No

Request:

```json
{
  "name": "API Owner",
  "email": "api.owner.20260530005813@example.com",
  "password": "<password>"
}
```

Response:

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresInSeconds": 3600,
  "user": {
    "id": "2e97b8ef-72e0-40db-9a0e-f82620832747",
    "name": "API Owner",
    "email": "api.owner.20260530005813@example.com",
    "role": "USER",
    "createdAt": "2026-05-29T19:58:14.064705400Z"
  }
}
```

Result: PASS

## Login Owner

Endpoint: `POST /api/auth/login`

JWT required: No

Request:

```json
{
  "email": "api.owner.20260530005813@example.com",
  "password": "<password>"
}
```

Response:

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresInSeconds": 3600,
  "user": {
    "id": "2e97b8ef-72e0-40db-9a0e-f82620832747",
    "name": "API Owner",
    "email": "api.owner.20260530005813@example.com",
    "role": "USER"
  }
}
```

Result: PASS. The access token was captured automatically and used as `Authorization: Bearer <JWT>`.

## Create Group

Endpoint: `POST /api/groups`

JWT required: Yes

Request:

```json
{
  "name": "API Test Group 20260530005813",
  "description": "End-to-end API test group"
}
```

Response:

```json
{
  "id": "3ae5d8f8-3bbb-4078-8b59-10110c277ce5",
  "name": "API Test Group 20260530005813",
  "description": null,
  "inviteCode": "8XVMXZA2",
  "ownerId": "2e97b8ef-72e0-40db-9a0e-f82620832747",
  "ownerName": "API Owner"
}
```

Result: PASS

## Join Group

Endpoint: `POST /api/groups/join`

JWT required: Yes

Request:

```json
{
  "inviteCode": "8XVMXZA2"
}
```

Response:

```json
{
  "id": "3ae5d8f8-3bbb-4078-8b59-10110c277ce5",
  "name": "API Test Group 20260530005813",
  "inviteCode": "8XVMXZA2",
  "ownerId": "2e97b8ef-72e0-40db-9a0e-f82620832747",
  "ownerName": "API Owner"
}
```

Result: PASS

## Get Groups

Endpoint: `GET /api/groups`

JWT required: Yes

Request body: none

Response:

```json
{
  "id": "3ae5d8f8-3bbb-4078-8b59-10110c277ce5",
  "name": "API Test Group 20260530005813",
  "inviteCode": "8XVMXZA2",
  "ownerId": "2e97b8ef-72e0-40db-9a0e-f82620832747",
  "ownerName": "API Owner"
}
```

Result: PASS

## Add Expense

Endpoint tested first: `POST /api/groups/{groupId}/expenses`

JWT required: Yes

Request:

```json
{
  "payerId": "2e97b8ef-72e0-40db-9a0e-f82620832747",
  "title": "API test dinner",
  "amount": 100,
  "splitType": "EQUAL",
  "splits": [
    { "userId": "2e97b8ef-72e0-40db-9a0e-f82620832747" },
    { "userId": "210d245d-28d5-4847-bd0b-dc1c33b16484" }
  ]
}
```

Response:

```json
{
  "status": 400,
  "result": "Bad Request"
}
```

Result: FAIL on currently running process. Code fix is compiled and requires backend restart.

Fallback endpoint: `POST /api/expenses`

Request:

```json
{
  "groupId": "3ae5d8f8-3bbb-4078-8b59-10110c277ce5",
  "payerId": "2e97b8ef-72e0-40db-9a0e-f82620832747",
  "title": "API test dinner",
  "amount": 100,
  "splitType": "EQUAL",
  "splits": [
    { "userId": "2e97b8ef-72e0-40db-9a0e-f82620832747" },
    { "userId": "210d245d-28d5-4847-bd0b-dc1c33b16484" }
  ]
}
```

Response:

```json
{
  "id": "f0e85b91-4331-4f08-ac13-2527daa43fb3",
  "groupId": "3ae5d8f8-3bbb-4078-8b59-10110c277ce5",
  "description": "API test dinner",
  "amount": 100.00,
  "payerName": "API Owner",
  "splits": [
    { "userName": "API Member", "amount": 50.00, "paid": false },
    { "userName": "API Owner", "amount": 50.00, "paid": false }
  ]
}
```

Result: PASS

## Fetch Group Expenses

Endpoint: `GET /api/groups/{groupId}/expenses`

JWT required: Yes

Request body: none

Response:

```json
{
  "content": [
    {
      "id": "f0e85b91-4331-4f08-ac13-2527daa43fb3",
      "description": "API test dinner",
      "amount": 100.00,
      "payerName": "API Owner"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 1,
  "totalPages": 1,
  "last": true
}
```

Result: PASS

## Fetch Group Balances

Endpoint: `GET /api/groups/{groupId}/balances`

JWT required: Yes

Request body: none

Response:

```json
{
  "groupId": "3ae5d8f8-3bbb-4078-8b59-10110c277ce5",
  "balances": [
    { "userName": "API Member", "netBalance": -50.00 },
    { "userName": "API Owner", "netBalance": 50.00 }
  ],
  "optimizedSettlements": [
    {
      "fromUserName": "API Member",
      "toUserName": "API Owner",
      "amount": 50.00
    }
  ]
}
```

Result: PASS

## Fetch Settlement Suggestions

Endpoint: `GET /api/groups/{groupId}/settlement-suggestions`

JWT required: Yes

Request body: none

Response:

```json
{
  "fromUserId": "210d245d-28d5-4847-bd0b-dc1c33b16484",
  "fromUserName": "API Member",
  "toUserId": "2e97b8ef-72e0-40db-9a0e-f82620832747",
  "toUserName": "API Owner",
  "amount": 50.00
}
```

Result: PASS

## Create Settlement

Endpoint tested first: `POST /api/groups/{groupId}/settlements`

JWT required: Yes

Request:

```json
{
  "payerId": "210d245d-28d5-4847-bd0b-dc1c33b16484",
  "receiverId": "2e97b8ef-72e0-40db-9a0e-f82620832747",
  "amount": 50.00,
  "note": "API test settlement"
}
```

Result: FAIL on currently running process. Code fix is compiled and requires backend restart.

Fallback endpoint: `POST /api/settlements`

Request:

```json
{
  "groupId": "3ae5d8f8-3bbb-4078-8b59-10110c277ce5",
  "payerId": "210d245d-28d5-4847-bd0b-dc1c33b16484",
  "receiverId": "2e97b8ef-72e0-40db-9a0e-f82620832747",
  "amount": 50.00,
  "note": "API test settlement"
}
```

Response:

```json
{
  "id": "6efa4691-82d2-471b-b19c-6576109c8c9c",
  "payerName": "API Member",
  "receiverName": "API Owner",
  "amount": 50.00,
  "status": "PENDING",
  "settledAt": null
}
```

Result: PASS

## Complete Settlement

Endpoint: `PATCH /api/settlements/{settlementId}/complete`

JWT required: Yes

Request body: none

Response:

```json
{
  "id": "6efa4691-82d2-471b-b19c-6576109c8c9c",
  "payerName": "API Member",
  "receiverName": "API Owner",
  "amount": 50.00,
  "status": "COMPLETED",
  "settledAt": "2026-05-29T19:58:29.907604100Z"
}
```

Result: PASS

## Balances After Settlement

Endpoint: `GET /api/groups/{groupId}/balances`

JWT required: Yes

Response:

```json
{
  "balances": [
    { "userName": "API Member", "netBalance": 0.00 },
    { "userName": "API Owner", "netBalance": 0.00 }
  ],
  "optimizedSettlements": []
}
```

Result: PASS
