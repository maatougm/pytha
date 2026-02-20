#!/bin/bash

# Build script for Flutter Web on Render

echo "🏗️ Building School Hub Web App..."

# Install Flutter if not present
if ! command -v flutter &> /dev/null; then
    echo "📦 Installing Flutter..."
    git clone https://github.com/flutter/flutter.git -b stable --depth 1
    export PATH="$PATH:$PWD/flutter/bin"
fi

# Verify Flutter
flutter doctor

# Build web app
cd mobile
flutter pub get
flutter build web --release

echo "✅ Build complete! Output in mobile/build/web/"
