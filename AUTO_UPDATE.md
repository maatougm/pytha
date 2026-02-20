# Automatic App Updates

This guide explains how the automatic in-app update system works for Minivirson.

## How It Works

1. **App Startup**: When users open the app, it automatically checks for updates
2. **Version Check**: App sends its current version to the backend
3. **Update Available?**: Backend compares versions and responds with update info
4. **User Notification**: If update exists, user sees a dialog with changelog
5. **Download & Install**: User taps "Update Now" to download and install the APK

## For Users

### Automatic Check
- The app checks for updates automatically when you open it
- If an update is available, you'll see a notification dialog
- Tap "Update Now" to download and install

### Manual Check
1. Go to **Profile** → **Check for Updates**
2. The app will check immediately and show results

## For Developers

### Releasing a New Version

Run the release script:

```bash
./scripts/release-apk.sh 1.0.2 3
```

Or manually:

1. **Update Version Numbers**
   - `mobile/pubspec.yaml`: Update `version: x.x.x+x`
   - `server/src/update/update.controller.ts`: Update `versionCode` and `versionName`

2. **Build APK**
   ```bash
   cd mobile
   flutter build apk --release
   ```

3. **Copy to Server**
   ```bash
   cp mobile/build/app/outputs/flutter-apk/app-release.apk server/downloads/minivirson-latest.apk
   ```

4. **Update Changelog** (optional)
   Edit `server/src/update/update.controller.ts` → `changelog` array

5. **Restart Backend**
   ```bash
   cd server
   npm run start:prod
   ```

### Force Update

To force users to update (blocking app usage until updated):

```typescript
// In server/src/update/update.controller.ts
private readonly currentVersion = {
    versionCode: 3,
    versionName: '1.0.2',
    forceUpdate: true,  // ← Set to true
    minVersionCode: 3,  // ← Set to current version
    // ...
};
```

### Version Code Rules

- **versionCode**: Integer that must increase with each release
- **versionName**: Human-readable version (e.g., "1.0.2")
- **minVersionCode**: Minimum supported version (users below this MUST update)

## Configuration

### Backend

Update configuration is in `server/src/update/update.controller.ts`:

```typescript
private readonly currentVersion = {
    versionCode: 2,           // Increment for each release
    versionName: '1.0.1',     // Human readable version
    forceUpdate: false,       // Force immediate update
    changelog: [...],         // List of changes
    minVersionCode: 1,        // Minimum supported version
};
```

### Mobile

Version is in `mobile/pubspec.yaml`:

```yaml
version: 1.0.0+2  # versionName+versionCode
```

**Important**: The `versionCode` in pubspec.yaml (after the `+`) must match the backend's `versionCode`!

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/updates/version` | GET | Get latest version info |
| `/api/updates/check` | POST | Check if update needed (send `{versionCode, platform}`) |
| `/api/updates/download/latest` | GET | Get download URL |
| `/api/updates/download/file` | GET | Download the APK file |

## Android Permissions

The following permissions are required (already in `AndroidManifest.xml`):

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
```

## Troubleshooting

### "Install permission denied"
- User needs to enable "Install unknown apps" in Android settings
- App will request this permission automatically

### "Download failed"
- Check if `server/downloads/minivirson-latest.apk` exists
- Check backend logs for errors
- Verify `API_BASE_URL` environment variable

### Update not showing
- Verify version codes match between Flutter and backend
- Check that backend is running and accessible
- Check app logs for errors

### APK won't install
- Ensure APK is signed with same keystore as installed app
- Version code must be higher than installed version
- Android requires uninstall if signing key differs
