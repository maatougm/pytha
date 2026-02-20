#!/bin/bash

# APK Release Script
# This script automates building and releasing a new APK version
# Usage: ./scripts/release-apk.sh [version_name] [version_code]
# Example: ./scripts/release-apk.sh 1.0.2 3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version info from args or prompt
if [ -z "$1" ]; then
    read -p "Enter version name (e.g., 1.0.2): " VERSION_NAME
else
    VERSION_NAME=$1
fi

if [ -z "$2" ]; then
    read -p "Enter version code (e.g., 3): " VERSION_CODE
else
    VERSION_CODE=$2
fi

# Validate inputs
if [ -z "$VERSION_NAME" ] || [ -z "$VERSION_CODE" ]; then
    echo -e "${RED}Error: Version name and code are required${NC}"
    echo "Usage: $0 [version_name] [version_code]"
    exit 1
fi

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Releasing Minivirson v${VERSION_NAME} (${VERSION_CODE})${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Step 1: Update pubspec.yaml
echo -e "${YELLOW}Step 1: Updating pubspec.yaml...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/^version: .*/version: ${VERSION_NAME}+${VERSION_CODE}/" mobile/pubspec.yaml
else
    # Linux
    sed -i "s/^version: .*/version: ${VERSION_NAME}+${VERSION_CODE}/" mobile/pubspec.yaml
fi
echo -e "${GREEN}✓ pubspec.yaml updated${NC}"

# Step 2: Update backend version
echo -e "${YELLOW}Step 2: Updating backend version...${NC}"
UPDATE_CONTROLLER="server/src/update/update.controller.ts"

# Update versionCode
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/versionCode: [0-9]*/versionCode: ${VERSION_CODE}/" "$UPDATE_CONTROLLER"
    sed -i '' "s/versionName: '[^']*'/versionName: '${VERSION_NAME}'/" "$UPDATE_CONTROLLER"
else
    sed -i "s/versionCode: [0-9]*/versionCode: ${VERSION_CODE}/" "$UPDATE_CONTROLLER"
    sed -i "s/versionName: '[^']*'/versionName: '${VERSION_NAME}'/" "$UPDATE_CONTROLLER"
fi
echo -e "${GREEN}✓ Backend version updated${NC}"

# Step 3: Build APK
echo -e "${YELLOW}Step 3: Building APK...${NC}"
cd mobile
flutter clean
flutter pub get
flutter build apk --release
cd "$PROJECT_ROOT"
echo -e "${GREEN}✓ APK built successfully${NC}"

# Step 4: Copy to downloads folder
echo -e "${YELLOW}Step 4: Copying APK to downloads folder...${NC}"
mkdir -p server/downloads
cp mobile/build/app/outputs/flutter-apk/app-release.apk server/downloads/minivirson-latest.apk
echo -e "${GREEN}✓ APK copied to server/downloads/minivirson-latest.apk${NC}"

# Step 5: Show changelog prompt
echo ""
echo -e "${YELLOW}Step 5: Changelog${NC}"
echo "Update the changelog in: server/src/update/update.controller.ts"
echo "Current changelog:"
grep -A 10 "changelog:" server/src/update/update.controller.ts | head -n 10
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Release v${VERSION_NAME} Ready!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Update the changelog in server/src/update/update.controller.ts"
echo "2. Restart the backend server: cd server && npm run start:prod"
echo "3. Users will automatically receive the update notification"
echo ""
echo "APK Location: server/downloads/minivirson-latest.apk"
echo "APK Size: $(du -h server/downloads/minivirson-latest.apk | cut -f1)"
