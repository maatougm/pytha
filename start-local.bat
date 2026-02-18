@echo off
REM =============================================================================
REM School Hub - Local Development Startup Script (WINDOWS)
REM =============================================================================
REM ⚠️  LOCAL USE ONLY - DO NOT USE IN PRODUCTION
REM ⚠️  This script is for local development/testing only
REM =============================================================================

echo ========================================
echo   School Hub - LOCAL STARTUP
echo   (Development Only - NOT for Production)
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"

REM =============================================================================
REM Step 1: Start Docker Services
REM =============================================================================
echo [1/3] Starting Docker services...
docker-compose up -d

if errorlevel 1 (
    echo [ERROR] Failed to start Docker services
    exit /b 1
)
echo [OK] Docker services started

REM Wait for services to initialize
echo [INFO] Waiting for services to initialize...
timeout /t 5 /nobreak >nul

REM =============================================================================
REM Step 2: Run Database Migrations
REM =============================================================================
echo [2/3] Running database migrations...
cd server
call npx prisma migrate deploy
if errorlevel 1 (
    echo [WARNING] Migration may have failed or already applied
)
cd ..

REM =============================================================================
REM Step 3: Build Flutter Web (if Flutter is available)
REM =============================================================================
echo [3/3] Building Flutter web app...

where flutter >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Flutter not found in PATH
    echo [INFO] Skipping Flutter build - using existing files if available
    echo [INFO] To build Flutter manually, run: flutter build web --release
) else (
    cd mobile
    call flutter pub get
    call flutter build web --release
    if errorlevel 1 (
        echo [ERROR] Flutter build failed
        cd ..
        exit /b 1
    )
    cd ..
    echo [OK] Flutter build complete
)

REM =============================================================================
REM Done
REM =============================================================================
echo.
echo ========================================
echo   LOCAL STARTUP COMPLETE!
echo ========================================
echo.
echo [LOCAL ONLY - NOT FOR PRODUCTION]
echo.
echo Services:
echo   API:      http://localhost:3000
echo   Web:      http://localhost:8085
echo   API Docs: http://localhost:3000/api/docs
echo.
echo To stop: docker-compose down
echo.

pause
