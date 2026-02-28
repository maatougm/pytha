# API Endpoint Verification Script
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  API Endpoint Check for School Hub" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "Checking if NestJS backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✅ Backend is RUNNING on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is NOT RUNNING!" -ForegroundColor Red
    Write-Host "   Start it with: cd server && npm run start:dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Checking Admin Metrics endpoint..." -ForegroundColor Yellow

$endpoints = @(
    "http://localhost:3000/api/admin/dashboard/metrics",
    "http://localhost:3000/api/admin/metrics"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Host "✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 401) {
            Write-Host "⚠️  $endpoint - Status: 401 (Unauthorized - needs auth token)" -ForegroundColor Yellow
        } elseif ($status -eq 403) {
            Write-Host "⚠️  $endpoint - Status: 403 (Forbidden - needs admin role)" -ForegroundColor Yellow
        } elseif ($status -eq 404) {
            Write-Host "❌ $endpoint - Status: 404 (Not Found)" -ForegroundColor Red
        } else {
            Write-Host "❌ $endpoint - Status: $status" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Expected endpoints:" -ForegroundColor Gray
Write-Host "  GET /api/admin/dashboard/metrics - Should return 401/403 (needs auth)" -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Cyan
