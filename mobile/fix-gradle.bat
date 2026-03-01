@echo off
echo Stopping all Java and Gradle processes...
taskkill /F /IM java.exe 2>nul
taskkill /F /IM javaw.exe 2>nul
taskkill /F /IM gradle.exe 2>nul
taskkill /F /IM gradlew.bat 2>nul

echo Waiting for processes to release files...
timeout /t 3 /nobreak >nul

echo Deleting Gradle cache...
if exist "android\.gradle" (
    rmdir /s /q "android\.gradle"
    echo .gradle folder deleted
)

echo Cleaning build directory...
if exist "android\app\build" (
    rmdir /s /q "android\app\build"
    echo build folder deleted
)

echo Done! You can now rebuild.
pause
