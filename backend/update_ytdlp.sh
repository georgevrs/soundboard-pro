#!/bin/bash

# Script to update yt-dlp to the latest version
# This fixes YouTube 403 Forbidden errors

echo "🔄 Updating yt-dlp to fix YouTube 403 errors..."
echo ""

# Check current version
CURRENT_VERSION=$(yt-dlp --version 2>/dev/null || echo "unknown")
echo "Current version: $CURRENT_VERSION"
echo ""

# Try different update methods
if command -v pip3 &> /dev/null; then
    echo "📦 Updating via pip3..."
    pip3 install -U yt-dlp
    if [ $? -eq 0 ]; then
        echo "✅ Update successful via pip3"
        NEW_VERSION=$(yt-dlp --version 2>/dev/null || echo "unknown")
        echo "New version: $NEW_VERSION"
        exit 0
    fi
fi

if command -v pip &> /dev/null; then
    echo "📦 Updating via pip..."
    pip install -U yt-dlp
    if [ $? -eq 0 ]; then
        echo "✅ Update successful via pip"
        NEW_VERSION=$(yt-dlp --version 2>/dev/null || echo "unknown")
        echo "New version: $NEW_VERSION"
        exit 0
    fi
fi

# Try yt-dlp's built-in updater
echo "📦 Updating via yt-dlp -U..."
yt-dlp -U
if [ $? -eq 0 ]; then
    echo "✅ Update successful via yt-dlp -U"
    NEW_VERSION=$(yt-dlp --version 2>/dev/null || echo "unknown")
    echo "New version: $NEW_VERSION"
    exit 0
fi

# Try apt if available
if command -v apt &> /dev/null; then
    echo "📦 Updating via apt..."
    sudo apt update
    sudo apt install --only-upgrade yt-dlp
    if [ $? -eq 0 ]; then
        echo "✅ Update successful via apt"
        NEW_VERSION=$(yt-dlp --version 2>/dev/null || echo "unknown")
        echo "New version: $NEW_VERSION"
        exit 0
    fi
fi

echo "❌ Failed to update yt-dlp. Please update manually:"
echo "   pip install -U yt-dlp"
echo "   OR: yt-dlp -U"
exit 1
