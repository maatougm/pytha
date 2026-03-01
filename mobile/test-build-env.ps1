# Test Build Environment for School Hub APK
# This script validates all prerequisites before building

$ErrorCount = 0
$WarningCount = 0

function Test-Command {
    param($Command, $Name)
    $cmd = Get-Command $Command -ErrorAction SilentlyContinue
    if ($cmd) {
        Write-Host "  Found $Name" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  NOT FOUND: $Name" -ForegroundColor Red
        return $false
    }
}

function Test-PathExists {
    param($Path, $Name)
    if (Test-Path $Path) {
        Write-Host "  Found $Name" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  NOT FOUND: $Name" -ForegroundColor Red
        return $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  School Hub Build Environment Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Java Installation
Write-Host "1. Checking Java Installation..." -ForegroundColor Yellow
$javaHomePaths = @(
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\Java\jdk-21",
    "C:\Program Files\Android\Android Studio\jbr",
    "${env:LOCALAPPDATA}\Programs\Eclipse Adoptium\jdk-17.0.12.7-hotspot"
)

$javaFound = $false
foreach ($path in $javaHomePaths) {
    if (Test-Path "$path\bin\java.exe") {
        Write-Host "  Java found at: $path" -ForegroundColor Green
        $env:JAVA_HOME = $path
        $javaFound = $true
        break
    }
}

if (-not $javaFound) {
    Write-Host "  ERROR: Java JDK not found!" -ForegroundColor Red
    Write-Host "  Install from: https://adoptium.net/" -ForegroundColor Yellow
    $ErrorCount++
} else {
    # Test Java version
    try {
        $javaVersion = & "$env:JAVA_HOME\bin\java" -version 2>&1 | Select-String "version" | Select-Object -First 1
        Write-Host "  Java version: $javaVersion" -ForegroundColor Green
    } catch {
        Write-Host "  WARNING: Could not verify Java version" -ForegroundColor Yellow
        $WarningCount++
    }
}

# Test 2: Android SDK
Write-Host ""
Write-Host "2. Checking Android SDK..." -ForegroundColor Yellow
$sdkPaths = @(
    "$env:LocalAppData\Android\Sdk",
    "$env:ProgramFiles\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk"
)

$sdkFound = $false
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        Write-Host "  SDK found at: $path" -ForegroundColor Green
        $env:ANDROID_HOME = $path
        $sdkFound = $true
        break
    }
}

if (-not $sdkFound) {
    Write-Host "  ERROR: Android SDK not found!" -ForegroundColor Red
    Write-Host "  Install Android Studio: https://developer.android.com/studio" -ForegroundColor Yellow
    $ErrorCount++
}

# Test 3: Required Environment Variables
Write-Host ""
Write-Host "3. Checking Environment Variables..." -ForegroundColor Yellow

if ($env:JAVA_HOME) {
    Write-Host "  JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
} else {
    Write-Host "  ERROR: JAVA_HOME not set" -ForegroundColor Red
    $ErrorCount++
}

if ($env:ANDROID_HOME) {
    Write-Host "  ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "  ERROR: ANDROID_HOME not set" -ForegroundColor Red
    $ErrorCount++
}

# Test 4: Required Files
Write-Host ""
Write-Host "4. Checking Required Files..." -ForegroundColor Yellow

$requiredFiles = @(
    @{Path=".\assets\images\icon.jpg"; Name="App Icon"},
    @{Path=".\assets\images\adaptive-icon.jpg"; Name="Adaptive Icon"},
    @{Path=".\assets\images\splash.jpg"; Name="Splash Screen"},
    @{Path=".\assets\images\notification-icon.jpg"; Name="Notification Icon"},
    @{Path=".\.env"; Name="Environment File"},
    @{Path=".\app.json"; Name="App Configuration"},
    @{Path=".\eas.json"; Name="EAS Configuration"}
)

foreach ($file in $requiredFiles) {
    if (-not (Test-PathExists -Path $file.Path -Name $file.Name)) {
        $ErrorCount++
    }
}

# Test 5: Check .env configuration
Write-Host ""
Write-Host "5. Checking Environment Configuration..." -ForegroundColor Yellow

if (Test-Path ".\.env") {
    $envContent = Get-Content ".\.env" -Raw
    if ($envContent -match "EXPO_PUBLIC_API_URL") {
        $apiUrl = ($envContent -split "EXPO_PUBLIC_API_URL=")[1] -split "`n" | Select-Object -First 1
        Write-Host "  API URL: $apiUrl" -ForegroundColor Green
        
        if ($apiUrl -match "localhost") {
            Write-Host "  WARNING: API URL uses 'localhost' - phone won't connect!" -ForegroundColor Yellow
            $WarningCount++
        }
    } else {
        Write-Host "  ERROR: EXPO_PUBLIC_API_URL not found in .env" -ForegroundColor Red
        $ErrorCount++
    }
    
    if ($envContent -match "EXPO_PUBLIC_WS_URL") {
        $wsUrl = ($envContent -split "EXPO_PUBLIC_WS_URL=")[1] -split "`n" | Select-Object -First 1
        Write-Host "  WebSocket URL: $wsUrl" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: EXPO_PUBLIC_WS_URL not found in .env" -ForegroundColor Red
        $ErrorCount++
    }
}

# Test 6: Check Node.js and npm
Write-Host ""
Write-Host "6. Checking Node.js..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Node.js not found" -ForegroundColor Red
        $ErrorCount++
    }
    
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "  npm: $npmVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "  ERROR: Could not check Node.js" -ForegroundColor Red
    $ErrorCount++
}

# Test 7: Check Backend Connection
Write-Host ""
Write-Host "7. Testing Backend Connection..." -ForegroundColor Yellow

if (Test-Path ".\.env") {
    $envContent = Get-Content ".\.env" -Raw
    if ($envContent -match "EXPO_PUBLIC_API_URL=http://([^:]+):(\d+)/api") {
        $ip = $matches[1]
        $port = $matches[2]
        
        Write-Host "  Testing connection to $ip`:$port..." -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri "http://$ip`:$port/api/health" -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "  Backend is ONLINE" -ForegroundColor Green
            } else {
                Write-Host "  Backend returned status: $($response.StatusCode)" -ForegroundColor Yellow
                $WarningCount++
            }
        } catch {
            Write-Host "  WARNING: Could not connect to backend" -ForegroundColor Yellow
            Write-Host "    Make sure backend is running: docker-compose up -d" -ForegroundColor Gray
            $WarningCount++
        }
    }
}

# Test 8: Gradle Cache Issues
Write-Host ""
Write-Host "8. Checking Gradle Cache..." -ForegroundColor Yellow

if (Test-Path ".\android\.gradle") {
    Write-Host "  Gradle cache exists" -ForegroundColor Yellow
    Write-Host "  Run 'cd android && .\gradlew clean' to clean cache" -ForegroundColor Gray
} else {
    Write-Host "  Gradle cache clean" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "  ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "  You can now build the APK with: .\build-apk.ps1" -ForegroundColor Green
    exit 0
} elseif ($ErrorCount -eq 0) {
    Write-Host "  $WarningCount Warning(s) found" -ForegroundColor Yellow
    Write-Host "  Build may work but with issues" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  You can try building with: .\build-apk.ps1" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "  $ErrorCount Error(s), $WarningCount Warning(s) found" -ForegroundColor Red
    Write-Host "  Please fix errors before building" -ForegroundColor Red
    exit 1
}
