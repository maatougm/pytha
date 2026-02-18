# Flutter SDK Auto-Installer for Windows

Two batch files to automatically install Flutter SDK on Windows.

## 📁 Files

| File | Description |
|------|-------------|
| `install_flutter.bat` | Full featured installer with progress, checks, and prompts |
| `install_flutter_quick.bat` | Minimal installer, quick and simple |

## 🚀 Quick Start

### Option 1: Full Installer (Recommended)
```powershell
# Right-click on install_flutter.bat → Run as Administrator
```

### Option 2: Quick Installer
```powershell
# Right-click on install_flutter_quick.bat → Run as Administrator
```

## 📋 What They Do

1. ✅ Check for admin privileges
2. ✅ Download Flutter SDK (~600MB) from official Google servers
3. ✅ Extract to `C:\flutter`
4. ✅ Add Flutter to your User PATH
5. ✅ Set `FLUTTER_ROOT` environment variable
6. ✅ Run `flutter doctor` to verify

## ⚡ After Installation

### Close and reopen PowerShell, then:

```powershell
# Verify installation
flutter --version

# Check for any missing dependencies
flutter doctor

# Navigate to your mobile project
cd C:\Users\BigPoppa\Desktop\minivirson\mobile

# Install dependencies
flutter pub get

# Run on your phone (make sure USB debugging is enabled)
flutter run
```

## 🔧 Manual Setup (If Batch Files Don't Work)

### Step 1: Download Flutter
Go to: https://docs.flutter.dev/get-started/install/windows

### Step 2: Extract
Extract the zip to `C:\flutter`

### Step 3: Add to PATH
```powershell
# In PowerShell as Admin
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\flutter\bin", "User")
[Environment]::SetEnvironmentVariable("FLUTTER_ROOT", "C:\flutter", "User")
```

### Step 4: Verify
```powershell
# Close and reopen PowerShell
flutter doctor
```

## 📱 Connect Your Phone

1. **Enable Developer Options**:
   - Settings → About Phone → Tap "Build Number" 7 times

2. **Enable USB Debugging**:
   - Settings → Developer Options → USB Debugging ON

3. **Connect phone via USB**

4. **Allow debugging** when prompted on phone

5. **Verify connection**:
   ```powershell
   flutter devices
   ```

## 🛠️ Android Studio Setup

1. Install Android Studio
2. Install Flutter plugin: `File → Settings → Plugins → Flutter`
3. Restart Android Studio
4. Configure Flutter SDK path: `File → Settings → Languages & Frameworks → Flutter`
5. Set SDK path to: `C:\flutter`

## ❓ Troubleshooting

### "flutter is not recognized as a command"
- Close and reopen PowerShell/CMD
- Or log out and log back in to Windows

### Download fails
- Check your internet connection
- Try downloading manually from flutter.dev

### Extraction fails
- Make sure you have enough disk space (~2GB free)
- Make sure `C:\` is writable

### flutter doctor shows issues
- Install Android Studio and SDK
- Run: `flutter doctor --android-licenses`
- Accept all licenses
