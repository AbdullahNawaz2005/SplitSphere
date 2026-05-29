$ErrorActionPreference = 'Stop'

$base = 'http://localhost:8080'
$runId = Get-Date -Format 'yyyyMMddHHmmss'
$password = 'StrongPass123!'
$ownerEmail = "api.owner.$runId@example.com"
$memberEmail = "api.member.$runId@example.com"
$results = [ordered]@{}

function ConvertTo-SanitizedObject {
    param(
        [object]$Value,
        [string[]]$Tokens
    )

    if ($null -eq $Value) {
        return $null
    }

    $json = $Value | ConvertTo-Json -Depth 50
    foreach ($token in $Tokens) {
        if ($token) {
            $json = $json -replace [regex]::Escape($token), '<JWT>'
        }
    }
    $json = $json -replace 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', '<JWT>'
    $json = $json -replace [regex]::Escape($password), '<password>'
    return $json | ConvertFrom-Json
}

function Invoke-Api {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Token = $null,
        [switch]$AllowFail
    )

    $headers = @{}
    if ($Token) {
        $headers.Authorization = "Bearer $Token"
    }

    $params = @{
        Method  = $Method
        Uri     = "$base$Path"
        Headers = $headers
    }
    if ($null -ne $Body) {
        $params.ContentType = 'application/json'
        $params.Body = $Body | ConvertTo-Json -Depth 20
    }

    try {
        $response = Invoke-RestMethod @params
        $results[$Name] = [ordered]@{
            status      = 'PASS'
            method      = $Method
            path        = $Path
            jwtRequired = [bool]$Token
            request     = $Body
            response    = $response
        }
        return $response
    } catch {
        $message = $_.ErrorDetails.Message
        if (-not $message) {
            $message = $_.Exception.Message
        }
        $results[$Name] = [ordered]@{
            status      = 'FAIL'
            method      = $Method
            path        = $Path
            jwtRequired = [bool]$Token
            request     = $Body
            error       = $message
        }
        if (-not $AllowFail) {
            throw
        }
        return $null
    }
}

$ownerRegister = Invoke-Api 'registerOwner' 'POST' '/api/auth/register' @{
    name = 'API Owner'
    email = $ownerEmail
    password = $password
}
$ownerLogin = Invoke-Api 'loginOwner' 'POST' '/api/auth/login' @{
    email = $ownerEmail
    password = $password
}
$ownerToken = $ownerLogin.accessToken
$ownerId = $ownerLogin.user.id

$memberRegister = Invoke-Api 'registerMember' 'POST' '/api/auth/register' @{
    name = 'API Member'
    email = $memberEmail
    password = $password
}
$memberLogin = Invoke-Api 'loginMember' 'POST' '/api/auth/login' @{
    email = $memberEmail
    password = $password
}
$memberToken = $memberLogin.accessToken
$memberId = $memberLogin.user.id

$groupsBefore = Invoke-Api 'getGroupsBefore' 'GET' '/api/groups' $null $ownerToken
$group = Invoke-Api 'createGroup' 'POST' '/api/groups' @{
    name = "API Test Group $runId"
    description = 'End-to-end API test group'
} $ownerToken
$groupId = $group.id
$inviteCode = $group.inviteCode

$memberJoined = Invoke-Api 'joinGroupMember' 'POST' '/api/groups/join' @{
    inviteCode = $inviteCode
} $memberToken
$groupsAfterJoin = Invoke-Api 'getGroupsAfterJoin' 'GET' '/api/groups' $null $memberToken
$members = Invoke-Api 'getGroupMembers' 'GET' "/api/groups/$groupId/members" $null $ownerToken

$expenseBodyScoped = [ordered]@{
    payerId = $ownerId
    title = 'API test dinner'
    amount = 100.00
    splitType = 'EQUAL'
    splits = @(
        @{ userId = $ownerId },
        @{ userId = $memberId }
    )
}
$scopedExpense = Invoke-Api 'createGroupExpenseScoped' 'POST' "/api/groups/$groupId/expenses" $expenseBodyScoped $ownerToken -AllowFail

$expenseBody = [ordered]@{
    groupId = $groupId
    payerId = $ownerId
    title = 'API test dinner'
    amount = 100.00
    splitType = 'EQUAL'
    splits = @(
        @{ userId = $ownerId },
        @{ userId = $memberId }
    )
}
if ($scopedExpense) {
    $expense = $scopedExpense
} else {
    $expense = Invoke-Api 'createExpenseTopLevelFallback' 'POST' '/api/expenses' $expenseBody $ownerToken
}

$expenses = Invoke-Api 'getGroupExpenses' 'GET' "/api/groups/$groupId/expenses" $null $ownerToken
$balances = Invoke-Api 'getGroupBalances' 'GET' "/api/groups/$groupId/balances" $null $ownerToken
$suggestions = Invoke-Api 'getSettlementSuggestions' 'GET' "/api/groups/$groupId/settlement-suggestions" $null $ownerToken

if ($null -ne $suggestions) {
    $suggestion = @($suggestions)[0]
    $settlementBodyScoped = [ordered]@{
        payerId = $suggestion.fromUserId
        receiverId = $suggestion.toUserId
        amount = $suggestion.amount
        note = 'API test settlement'
    }
    if ($suggestion.fromUserId -eq $ownerId) {
        $settlementToken = $ownerToken
    } else {
        $settlementToken = $memberToken
    }
    $settlementScoped = Invoke-Api 'createGroupSettlementScoped' 'POST' "/api/groups/$groupId/settlements" $settlementBodyScoped $settlementToken -AllowFail
    if ($settlementScoped) {
        $settlement = $settlementScoped
    } else {
        $settlementBody = [ordered]@{
            groupId = $groupId
            payerId = $suggestion.fromUserId
            receiverId = $suggestion.toUserId
            amount = $suggestion.amount
            note = 'API test settlement'
        }
        $settlement = Invoke-Api 'createSettlementTopLevelFallback' 'POST' '/api/settlements' $settlementBody $settlementToken
    }
    $completedSettlement = Invoke-Api 'completeSettlement' 'PATCH' "/api/settlements/$($settlement.id)/complete" $null $settlementToken
    $balancesAfterSettlement = Invoke-Api 'getGroupBalancesAfterSettlement' 'GET' "/api/groups/$groupId/balances" $null $ownerToken
} else {
    $results['createGroupSettlementScoped'] = [ordered]@{
        status = 'SKIP'
        reason = 'No settlement suggestions returned.'
    }
    $results['completeSettlement'] = [ordered]@{
        status = 'SKIP'
        reason = 'No settlement was created.'
    }
}

$tokens = @($ownerToken, $memberToken)
foreach ($entry in $results.GetEnumerator()) {
    foreach ($side in @('request', 'response')) {
        if ($entry.Value.Contains($side)) {
            $entry.Value[$side] = ConvertTo-SanitizedObject $entry.Value[$side] $tokens
        }
    }
}

$outDir = 'target\api-test'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$summaryPath = Join-Path $outDir 'api-test-results-final.json'
[ordered]@{
    runId = $runId
    baseUrl = $base
    ownerEmail = $ownerEmail
    memberEmail = $memberEmail
    groupId = $groupId
    ownerId = $ownerId
    memberId = $memberId
    results = $results
} | ConvertTo-Json -Depth 60 | Set-Content -Path $summaryPath -Encoding UTF8

"API_TEST_RESULTS=$summaryPath"
"OWNER_EMAIL=$ownerEmail"
"MEMBER_EMAIL=$memberEmail"
"GROUP_ID=$groupId"
foreach ($key in $results.Keys) {
    "$key=$($results[$key].status)"
}
