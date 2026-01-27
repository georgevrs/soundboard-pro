#!/bin/bash

# Test script to diagnose mpv playback issues

echo "🔍 Testing mpv Configuration"
echo "============================"
echo ""

# Check if mpv is installed
echo "1. Checking mpv installation..."
if command -v mpv &> /dev/null; then
    MPV_PATH=$(which mpv)
    echo "   ✓ mpv found at: $MPV_PATH"
    mpv --version | head -1
else
    echo "   ✗ mpv not found in PATH"
    echo "   Install with: sudo apt install mpv"
    exit 1
fi

echo ""
echo "2. Checking audio devices..."
if command -v pactl &> /dev/null; then
    echo "   Available audio devices:"
    pactl list short sinks | while read line; do
        echo "   - $line"
    done
else
    echo "   ⚠ pactl not found (cannot list audio devices)"
fi

echo ""
echo "3. Testing mpv with a test file..."
TEST_URL="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
echo "   Testing with: $TEST_URL"
echo "   (This will play for 2 seconds, then stop)"
echo ""

timeout 2 mpv --no-video "$TEST_URL" 2>&1 || echo "   Test completed or timed out"

echo ""
echo "4. Check backend logs for detailed mpv errors"
echo "   Look for lines starting with 'Playing sound' and 'mpv'"
