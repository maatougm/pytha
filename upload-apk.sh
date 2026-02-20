#!/bin/bash
# Upload APK to server for easy download

echo "📱 Uploading APK to server..."

# Check if APK exists
if [ ! -f "mobile/build/app/outputs/flutter-apk/app-release.apk" ]; then
    echo "❌ APK not found! Build it first:"
    echo "   cd mobile && flutter build apk --release"
    exit 1
fi

# Upload to server
scp mobile/build/app/outputs/flutter-apk/app-release.apk root@187.77.70.67:/opt/school-hub/flutter-web/

# Create download link
echo ""
echo "✅ APK uploaded!"
echo "Download URL: https://pythagore-init.com/app-release.apk"
echo ""
echo "Share this link with friends!"
