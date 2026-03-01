# Building School Hub APK

## Option 1: Cloud Build (Easiest - No Android Studio needed)

### Prerequisites
- Expo account (free): https://expo.dev/signup
- EAS CLI installed: `npm install -g eas-cli`
- Logged in: `eas login`

### Steps

1. **Initialize EAS Project** (one-time setup):
```bash
cd mobile
eas init
# When prompted, type "y" to create a new project
```

2. **Build APK**:
```bash
eas build --platform android --profile preview
```

3. **Wait for build** (5-10 minutes) and download the APK from the link provided.

4. **Transfer APK to phone** via USB, email, or cloud storage.

5. **Install on Android phone**:
   - Enable "Install from Unknown Sources" in Settings
   - Open the APK file to install

---

## Option 2: Local Build (Requires Android Studio)

### Prerequisites
- Android Studio installed: https://developer.android.com/studio
- Android SDK configured
- `ANDROID_HOME` environment variable set

### Steps

1. **Run the build script**:
```powershell
cd mobile
.\build-apk.ps1
```

2. **Find your APK** at: `mobile/downloads/SchoolHub-local.apk`

3. **Transfer to phone** and install.

---

## 🔧 Configuration

### Current Server IP
The APK is configured to connect to:
- **API**: http://172.18.192.1:3000/api
- **WebSocket**: http://172.18.192.1:3000

### To Change the IP Address

Edit `mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://YOUR_IP:3000/api
EXPO_PUBLIC_WS_URL=http://YOUR_IP:3000
```

Then rebuild the APK.

---

## 📱 Installation on Android

1. **Enable Developer Options** (if not already):
   - Settings → About Phone → Tap "Build Number" 7 times

2. **Enable USB Debugging** (optional, for direct install):
   - Settings → Developer Options → USB Debugging

3. **Enable Install from Unknown Sources**:
   - Settings → Security → Unknown Sources (or Install Unknown Apps)

4. **Install APK**:
   - Transfer APK to phone
   - Open file manager, tap APK
   - Tap "Install"

---

## 🔑 Demo Login

| Email | Password |
|-------|----------|
| admin@academy.edu | VJyhbuFmnPSiuEzpCz2CAa1! |
| j.rodriguez@academy.edu | VJyhbuFmnPSiuEzpCz2CAa1! |
| carlos.garcia@student.academy.edu | VJyhbuFmnPSiuEzpCz2CAa1! |

---

## 🌐 Network Requirements

For the app to connect to your local server:

1. **Phone and computer must be on the SAME WiFi network**

2. **Windows Firewall must allow port 3000**:
   ```powershell
   netsh advfirewall firewall add rule name="School Hub API" dir=in action=allow protocol=tcp localport=3000
   ```

3. **Backend must be running**:
   ```bash
   docker-compose -f docker-compose.backend-only.yml up -d
   ```

---

## 🧪 Testing Connection

From your phone's browser, open:
```
http://172.18.192.1:3000/api/health
```

Should show: `{"status":"ok"}`

If this doesn't work, the app won't connect either.

---

## ❓ Troubleshooting

### "App not installed" error
- Uninstall any previous version first
- Make sure "Install from Unknown Sources" is enabled

### "Cannot connect to server" error
- Check phone and computer are on same WiFi
- Verify backend is running: `docker ps`
- Test from phone browser first
- Check Windows Firewall settings

### Wrong IP address
- Find your IP: `ipconfig` (look for IPv4 Address)
- Update `mobile/.env`
- Rebuild APK

---

## 📁 Build Output Locations

| Build Type | APK Location |
|------------|--------------|
| Local Build | `mobile/downloads/SchoolHub-local.apk` |
| Cloud Build | Download link from EAS |
