# School Hub APK Build Script for Windows
# This script builds an APK that connects to your local server

param(
    [switch]$SkipTests,
    [switch]$Clean
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "  School Hub APK Builder" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Pre-build checks
if (-not $SkipTests) {
    Write-Host "Running pre-build checks..." -ForegroundColor Cyan
    
    # Check Java
    $javaPaths = @(
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Java\jdk-21",
        "C:\Program Files\Android\Android Studio\jbr"
    )
    
    $javaHome = $null
    foreach ($path in $javaPaths) {
        if (Test-Path "$path\bin\java.exe") {
            $javaHome = $path
            break
        }
    }
    
    if (-not $javaHome) {
        Write-Host "ERROR: Java not found! Install JDK 17+ from https://adoptium.net/" -ForegroundColor Red
        exit 1
    }
    
    $env:JAVA_HOME = $javaHome
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "Process")
    Write-Host "  Java: $javaHome" -ForegroundColor Green
    
    # Check Android SDK
    $sdkPaths = @(
        "$env:LocalAppData\Android\Sdk",
        "$env:ProgramFiles\Android\Sdk",
        "$env:USERPROFILE\AppData\Local\Android\Sdk"
    )
    
    $sdkFound = $false
    foreach ($path in $sdkPaths) {
        if (Test-Path $path) {
            $env:ANDROID_HOME = $path
            $sdkFound = $true
            break
        }
    }
    
    if (-not $sdkFound) {
        Write-Host "ERROR: Android SDK not found! Install Android Studio." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  Android SDK: $env:ANDROID_HOME" -ForegroundColor Green
    
    # Check required files
    $required = @(
        ".\assets\images\icon.jpg",
        ".\assets\images\adaptive-icon.jpg",
        ".\.env"
    )
    
    foreach ($file in $required) {
        if (-not (Test-Path $file)) {
            Write-Host "ERROR: Missing file: $file" -ForegroundColor Red
            exit 1
        }
    }
    
    Write-Host "  All required files present" -ForegroundColor Green
    Write-Host ""
}

# Get IP address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" 
} | Select-Object -First 1).IPAddress

if (-not $ipAddress) {
    $ipAddress = "172.18.192.1"
}

Write-Host "Computer IP: $ipAddress" -ForegroundColor Cyan
Write-Host ""

# Update .env
$envContent = @"
EXPO_PUBLIC_API_URL=http://$ipAddress`:3000/api
EXPO_PUBLIC_WS_URL=http://$ipAddress`:3000
"@
$envContent | Set-Content -Path ".env" -Encoding UTF8
Write-Host "Updated .env" -ForegroundColor Green

# Kill any running Gradle/Java processes to avoid file locks
Write-Host "Cleaning up processes..." -ForegroundColor Gray
taskkill /F /IM java.exe 2>$null | Out-Null
taskkill /F /IM gradle.exe 2>$null | Out-Null
Start-Sleep -Seconds 2

# Clean previous builds
if ($Clean -or (Test-Path ".\android\app\build")) {
    Write-Host "Cleaning previous builds..." -ForegroundColor Gray
    if (Test-Path ".\android\app\build") {
        Remove-Item -Recurse -Force ".\android\app\build" -ErrorAction SilentlyContinue
    }
}

# Run prebuild
Write-Host ""
Write-Host "Running Expo Prebuild..." -ForegroundColor Cyan
npx expo prebuild --platform android --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Prebuild failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Prebuild complete!" -ForegroundColor Green

# Build APK
Write-Host ""
Write-Host "Building APK (this takes 5-10 minutes)..." -ForegroundColor Cyan

Set-Location android

# Stop any Gradle daemon
.\gradlew --stop 2>$null | Out-Null
Start-Sleep -Seconds 2

# Build
.\gradlew assembleRelease --no-daemon

$buildResult = $LASTEXITCODE
Set-Location ..

if ($buildResult -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  BUILD FAILED" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Yellow
    Write-Host "  1. Delete android folder and retry: Remove-Item -Recurse -Force android" -ForegroundColor Yellow
    Write-Host "  2. Run with clean: .\build-apk.ps1 -Clean" -ForegroundColor Yellow
    Write-Host "  3. Check Android Studio SDK is installed" -ForegroundColor Yellow
    exit 1
}

# Copy APK
$apkSource = "android/app/build/outputs/apk/release/app-release.apk"
$apkDest = "downloads/SchoolHub-local.apk"

if (-not (Test-Path "downloads")) {
    New-Item -ItemType Directory -Path "downloads" | Out-Null
}

Copy-Item -Path $apkSource -Destination $apkDest -Force

# Success
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  APK BUILT SUCCESSFULLY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "APK: $apkDest" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Phone and computer must be on SAME WiFi" -ForegroundColor Yellow
Write-Host "  - Backend must be running: docker-compose up -d" -ForegroundColor Yellow
Write-Host "  - URL: http://$ipAddress`:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Login: admin@academy.edu" -ForegroundColor Cyan
Write-Host "Pass:  VJyhbuFmnPSiuEzpCz2CAa1!" -ForegroundColor Cyan
Write-Host ""
