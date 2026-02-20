# Server Health Check Script
# Run this to verify the hosted server is working correctly

$serverIP = "187.77.70.67"
$serverPort = "3000"
$baseUrl = "http://${serverIP}:$serverPort"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "School Hub Server Health Check" -ForegroundColor Cyan
Write-Host "Server: $baseUrl" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Endpoint
Write-Host "Test 1: Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -TimeoutSec 10 -UseBasicParsing
    Write-Host "  ✅ Health: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Health: FAILED - $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Auth Login (expect 401, not 404)
Write-Host "Test 2: Auth Login (expect 401, NOT 404)..." -ForegroundColor Yellow
try {
    $body = '{"email":"admin@school.com","password":"wrongpassword"}'
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10 -UseBasicParsing
    Write-Host "  ✅ Auth: $($response.StatusCode) - Unexpected success" -ForegroundColor Green
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) {
        Write-Host "  ✅ Auth: 401 Unauthorized (CORRECT - server is working!)" -ForegroundColor Green
    } elseif ($status -eq 404) {
        Write-Host "  ❌ Auth: 404 Not Found (SERVER BROKEN - auth module not loaded)" -ForegroundColor Red
    } else {
        Write-Host "  ⚠️  Auth: $status - $_" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Check API Docs (if available)
Write-Host "Test 3: API Documentation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/docs" -TimeoutSec 10 -UseBasicParsing
    Write-Host "  ✅ API Docs: Available" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  API Docs: Not available (only in dev mode)" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Check Update Endpoint
Write-Host "Test 4: Update Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/update/check?version=1" -TimeoutSec 10 -UseBasicParsing
    Write-Host "  ✅ Update: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Update: FAILED - $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Check complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
