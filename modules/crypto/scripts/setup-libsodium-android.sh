#!/bin/bash
# ============================================================================
# NOTE: This script is OPTIONAL for Android!
#
# Android builds libsodium from source automatically using CMake FetchContent.
# The CMakeLists.txt fetches libsodium-cmake which handles everything.
#
# This script can be used to:
# 1. Pre-warm the CMake cache by triggering a build
# 2. Verify the Android build setup is working
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$(dirname "$MODULE_DIR")")"

echo "📦 Android libsodium Setup"
echo ""
echo "ℹ️  libsodium is built from source automatically via CMake FetchContent."
echo "   No manual setup is required for Android!"
echo ""
echo "The CMakeLists.txt uses robinlinden/libsodium-cmake to:"
echo "  • Download libsodium source code"
echo "  • Build for all Android ABIs (arm64-v8a, armeabi-v7a, x86, x86_64)"
echo "  • Link statically with your native module"
echo ""
echo "To build the Android app:"
echo "  cd $PROJECT_ROOT"
echo "  npx expo run:android"
echo ""
echo "Or to just verify the native build works:"
echo "  cd $PROJECT_ROOT/android"
echo "  ./gradlew :rtn-crypto:assembleDebug"
echo ""
echo "✅ No action needed - Android setup is automatic!"
