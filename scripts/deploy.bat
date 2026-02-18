@echo off
REM =============================================================================
REM School Hub - Windows Deployment Script
REM =============================================================================
REM Usage: deploy.bat [environment]
REM Environments: local (default), production
REM =============================================================================

setlocal EnableDelayedExpansion

REM Default environment
if "%~1"=="" (
    set ENV=local
) else (
    set ENV=%~1
)

echo ========================================
echo   School Hub Deployment
echo   Environment: %ENV%
echo ========================================
echo.

REM =============================================================================
REM Validate Environment
REM =============================================================================

if not "%ENV%"=="local" if not "%ENV%"=="production" (
    echo [ERROR] Invalid environment: %ENV%
    echo Valid environments: local, production
    exit /b 1
)

echo [INFO] Validating environment: %ENV%

REM =============================================================================
REM Pre-deployment Checks
REM =============================================================================

echo [INFO] Running pre-deployment checks...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose is not installed
    exit /b 1
)

echo [SUCCESS] Pre-deployment checks passed

REM =============================================================================
REM Build Flutter Web
REM =============================================================================

if "%SKIP_FLUTTER_BUILD%"=="true" (
    echo [WARNING] Skipping Flutter build (SKIP_FLUTTER_BUILD=true)
) else (
    echo [INFO] Building Flutter web app...
    
    cd ..\mobile
    
    REM Check if Flutter is installed
    flutter --version >nul 2>&1
    if errorlevel 1 (
        echo [ERROR] Flutter is not installed or not in PATH
        echo Please install Flutter: https://flutter.dev/docs/get-started/install
        exit /b 1
    )
    
    echo [INFO] Getting Flutter dependencies...
    call flutter pub get
    if errorlevel 1 (
        echo [ERROR] Failed to get Flutter dependencies
        exit /b 1
    )
    
    echo [INFO] Building for web (release mode)...
    call flutter build web --release
    if errorlevel 1 (
        echo [ERROR] Failed to build Flutter web
        exit /b 1
    )
    
    cd ..\scripts
    echo [SUCCESS] Flutter web build complete
)

REM =============================================================================
REM Determine Compose File
REM =============================================================================

if "%ENV%"=="production" (
    set COMPOSE_FILE=docker-compose.production.yml
) else (
    set COMPOSE_FILE=docker-compose.yml
)

echo [INFO] Using compose file: %COMPOSE_FILE%

REM =============================================================================
REM Build Docker Images
REM =============================================================================

echo [INFO] Building Docker images...
cd ..
docker-compose -f %COMPOSE_FILE% build
if errorlevel 1 (
    echo [ERROR] Failed to build Docker images
    exit /b 1
)
echo [SUCCESS] Docker images built successfully

REM =============================================================================
REM Deploy Application
REM =============================================================================

echo [INFO] Deploying application (%ENV%)...
docker-compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo [ERROR] Failed to deploy application
    exit /b 1
)

REM Wait for services
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM =============================================================================
REM Verify Deployment
REM =============================================================================

echo [INFO] Verifying deployment...
echo.
echo Running containers:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

REM Check API health
curl -s http://localhost:3000/api/health >nul
if not errorlevel 1 (
    echo [SUCCESS] API is responding at http://localhost:3000
) else (
    echo [WARNING] API may not be fully ready yet
)

REM Check web app
curl -s http://localhost:8085 >nul
if not errorlevel 1 (
    echo [SUCCESS] Web app is responding at http://localhost:8085
) else (
    echo [WARNING] Web app may not be fully ready yet
)

REM =============================================================================
REM Cleanup
REM =============================================================================

echo [INFO] Cleaning up old images...
docker image prune -f

REM =============================================================================
REM Done
REM =============================================================================

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo API:     http://localhost:3000
echo Web App: http://localhost:8085
echo API Docs: http://localhost:3000/api/docs
echo.

endlocal
