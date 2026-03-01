# Local build with file locking fixes
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "$env:LocalAppData\Android\Sdk"

# Disable Gradle file locking
$env:GRADLE_OPTS = "-Dorg.gradle.daemon=false -Dorg.gradle.configureondemand=false"

Write-Host "Building with file locking disabled..." -ForegroundColor Cyan
Write-Host "This prevents 'Could not move temporary workspace' errors" -ForegroundColor Gray
Write-Host ""

# Clean first
if (Test-Path "android\.gradle") {
    Write-Host "Cleaning Gradle cache..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "android\.gradle" -ErrorAction SilentlyContinue
}

# Build
Set-Location android
.\gradlew assembleRelease --no-daemon --offline 2>&1 | ForEach-Object {
    if ($_ -match "BUILD FAILED") {
        Write-Host $_ -ForegroundColor Red
    } elseif ($_ -match "BUILD SUCCESS") {
        Write-Host $_ -ForegroundColor Green
    } else {
        Write-Host $_ -ForegroundColor Gray
    }
}

Set-Location ..

# Copy APK if successful
if (Test-Path "android\app\build\outputs\apk\release\app-release.apk") {
    if (-not (Test-Path "downloads")) { New-Item -ItemType Directory -Path "downloads" | Out-Null }
    Copy-Item "android\app\build\outputs\apk\release\app-release.apk" "downloads\SchoolHub-local.apk" -Force
    Write-Host ""
    Write-Host "APK created: downloads\SchoolHub-local.apk" -ForegroundColor Green
}
