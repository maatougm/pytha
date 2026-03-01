# School Hub APK Build Guide

## Recommended: EAS Cloud Build (Easiest)

This builds your APK in Expo's cloud servers - no local setup needed!

### Steps:

1. **Login to Expo** (create free account at expo.dev if needed):
```bash
cd mobile
npx eas login
```

2. **Initialize project** (one-time setup):
```bash
npx eas init
# Type 'y' when asked to create a new project
```

3. **Build APK**:
```bash
npx eas build --platform android --profile preview
```

4. **Wait for email** (5-10 minutes) with download link

5. **Install on Android**:
   - Download APK from the link
   - Enable "Install from Unknown Sources" in Settings
   - Install the APK

---

## Alternative: Local Build (If Cloud Doesn't Work)

### Prerequisites:
- Android Studio installed
- JDK 17+ installed
- Environment variables set

### Fix Gradle Issues:
If you get "Could not move temporary workspace" errors, run:
```
fix-gradle.bat
```

Then retry:
```powershell
.\build-apk.ps1
```

---

## Configuration

### Current Settings:
- **API URL**: http://172.25.16.1:3000/api
- **WebSocket**: http://172.25.16.1:3000

### Demo Login:
- **Email**: admin@academy.edu
- **Password**: VJyhbuFmnPSiuEzpCz2CAa1!

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Could not move temporary workspace" | Run `fix-gradle.bat` then rebuild |
| "JAVA_HOME not set" | Install JDK 17 from https://adoptium.net/ |
| "Android SDK not found" | Install Android Studio |
| App won't connect | Make sure phone and PC are on same WiFi |

---

## Network Requirements

1. **Phone and PC on same WiFi**
2. **Windows Firewall**: Allow port 3000
3. **Backend running**: `docker-compose up -d`

Test connection from phone browser: `http://172.25.16.1:3000/api/health`
