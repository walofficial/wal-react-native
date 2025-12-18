#!/bin/bash

set -euo pipefail

# Workaround for react-native-libsodium npm tarball missing Clibsodium.xcframework.
# Without it, iOS builds can fail with:
#   fatal error: 'sodium.h' file not found
#   or linking errors around libsodium
#
# This script is safe to run multiple times and will no-op when:
# - Not on macOS / xcodebuild isn't available
# - The XCFramework already exists
# - The expected static libs/headers aren't present

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "ℹ️  xcodebuild not found. Skipping Clibsodium.xcframework creation."
  exit 0
fi

LIBSODIUM_PATH="node_modules/react-native-libsodium/libsodium/build/libsodium-apple"
XCFRAMEWORK_PATH="${LIBSODIUM_PATH}/Clibsodium.xcframework"

if [ -d "${XCFRAMEWORK_PATH}" ]; then
  echo "ℹ️  Clibsodium.xcframework already exists. Skipping."
  exit 0
fi

IOS_LIB="${LIBSODIUM_PATH}/ios/lib/libsodium.a"
IOS_HEADERS="${LIBSODIUM_PATH}/ios/include"
SIM_LIB="${LIBSODIUM_PATH}/ios-simulators/lib/libsodium.a"
SIM_HEADERS="${LIBSODIUM_PATH}/ios-simulators/include"

if [ ! -f "${IOS_LIB}" ] || [ ! -d "${IOS_HEADERS}" ] || [ ! -f "${SIM_LIB}" ] || [ ! -d "${SIM_HEADERS}" ]; then
  echo "ℹ️  libsodium static libs/headers not found. Skipping."
  exit 0
fi

echo "🔧 Creating Clibsodium.xcframework..."

xcodebuild -create-xcframework \
  -library "${IOS_LIB}" \
  -headers "${IOS_HEADERS}" \
  -library "${SIM_LIB}" \
  -headers "${SIM_HEADERS}" \
  -output "${XCFRAMEWORK_PATH}"

echo "✅ Clibsodium.xcframework created successfully."

