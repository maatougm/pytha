@echo off
REM =============================================================================
REM Git Setup Script for Production (Windows)
REM =============================================================================

echo ========================================
echo   School Hub - Git Setup
echo ========================================
echo.

REM Change to project root
cd /d "%~dp0\.."

REM =============================================================================
REM 1. Configure Git Hooks Path
REM =============================================================================
echo [1/6] Configuring git hooks path...
git config core.hooksPath .githooks
echo [OK] Git hooks path set to .githooks

REM =============================================================================
REM 2. Set Git Attributes
REM =============================================================================
echo [2/6] Configuring git attributes...
git config core.attributesfile .gitattributes
echo [OK] Git attributes configured

REM =============================================================================
REM 3. Configure Line Endings
REM =============================================================================
echo [3/6] Configuring line endings...
git config core.autocrlf true
git config core.eol crlf
echo [OK] Line endings configured (CRLF for Windows)

REM =============================================================================
REM 4. Set Up Production Branch Protection (Optional)
REM =============================================================================
echo [4/6] Setting up branch configuration...

REM Check for main branch
git show-ref --verify --quiet refs/heads/main
if errorlevel 1 (
    git show-ref --verify --quiet refs/heads/master
    if not errorlevel 1 (
        git branch -m master main
        echo [OK] Renamed master to main
    )
)

REM Set default push behavior
git config push.default simple

REM Set pull to rebase
git config pull.rebase true

echo [OK] Branch configuration complete

REM =============================================================================
REM 5. Check for Sensitive Files
REM =============================================================================
echo [5/6] Checking for sensitive files...

if exist ".env" (
    git ls-files --error-unmatch .env >nul 2>&1
    if not errorlevel 1 (
        echo [WARNING] .env is tracked by git!
        echo Run: git rm --cached .env
    ) else (
        echo [OK] .env is not tracked
    )
)

if exist ".env.production" (
    git ls-files --error-unmatch .env.production >nul 2>&1
    if not errorlevel 1 (
        echo [WARNING] .env.production is tracked by git!
        echo Run: git rm --cached .env.production
    ) else (
        echo [OK] .env.production is not tracked
    )
)

REM =============================================================================
REM 6. Show Status
REM =============================================================================
echo [6/6] Git configuration status:
echo.
git config --local --list | findstr "hook autocrlf eol"

echo.
echo ========================================
echo Git setup complete!
echo ========================================
echo.
echo Next steps:
echo   1. Create .env.production from .env.production.example
echo   2. Run: git add . ^&^& git commit -m "Prepare for production"
echo   3. Push to remote: git push origin main
echo.

pause
