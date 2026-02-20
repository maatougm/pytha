# 📱 Build APK for Your Server

Your app is now configured to connect to: **http://187.77.70.67:3000**

---

## ⚡ Option 1: Build on Your PC (Fastest)

### Step 1: Install Flutter (if not installed)
Download from: https://docs.flutter.dev/get-started/install/windows

### Step 2: Build APK

**Open PowerShell as Administrator:**

```powershell
# Go to mobile folder
cd C:\Users\BigPoppa\Desktop\minivirson\mobile

# Get dependencies
flutter pub get

# Build APK
flutter build apk --release

# The APK will be at:
# build\app\outputs\flutter-apk\app-release.apk
```

### Step 3: Find Your APK

After build completes, your APK is here:
```
C:\Users\BigPoppa\Desktop\minivirson\mobile\build\app\outputs\flutter-apk\app-release.apk
```

**Share this APK file!** 📱

---

## ☁️ Option 2: Build Online (No Install Needed)

### Using Codemagic (Free)

1. Go to: https://codemagic.io
2. Sign up with GitHub
3. Connect your repo
4. Click "Start new build"
5. Download the APK when done!

---

## 📋 APK Configuration

Your APK is already configured to connect to:
```
Server: http://187.77.70.67:3000
API: http://187.77.70.67:3000/api
```

**Demo login (same as web):**
- Email: admin@school.com
- Password: Password123!

---

## 🔧 Build Commands Reference

| Command | What It Does |
|---------|--------------|
| `flutter pub get` | Download dependencies |
| `flutter build apk` | Build release APK |
| `flutter build apk --debug` | Build debug APK (faster) |
| `flutter build appbundle` | Build for Google Play |

---

## 📤 Share the APK

### Via Email:
- Attach `app-release.apk`
- Recipient installs it
- May need to "Allow unknown sources"

### Via WhatsApp/Telegram:
- Send the APK file
- Tap to install

### Via Website:
- Upload APK to your server
- Download link: http://187.77.70.67/app-release.apk

---

## ⚠️ Important Notes

1. **Android Security**: Users need to enable "Install from unknown sources"
2. **Internet**: App requires internet to connect to your server
3. **HTTP**: App uses HTTP (not HTTPS) - this is OK for testing
4. **Server must be running**: Make sure http://187.77.70.67:3000 is accessible

---

## 🎯 Quick Start for Users

1. Download APK
2. Install (allow unknown sources)
3. Open app
4. Login with demo account
5. Start using!

---

## 🆘 Build Errors?

### "Flutter not found"
→ Install Flutter SDK first

### "Android SDK not found"
→ Install Android Studio or Android SDK

### "Gradle error"
→ Run: `flutter clean` then `flutter build apk`

### "Out of memory"
→ Close other programs or build debug APK instead

---

## 💡 Alternative: Build on Your Server

If you can't build on Windows, use a Linux VM or Docker:

```bash
# On a Linux machine with Flutter installed
cd mobile
flutter build apk --release
```

---

**Your APK will connect to: http://187.77.70.67:3000** 🚀
