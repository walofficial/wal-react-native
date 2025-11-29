#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$(dirname "$SCRIPT_DIR")"
VENDOR_DIR="$MODULE_DIR/vendor"

echo "📦 Setting up libsodium..."

# Create vendor directories
mkdir -p "$VENDOR_DIR/include"

# Check if already set up
if [ -d "$VENDOR_DIR/libsodium.xcframework" ]; then
    echo "✅ libsodium.xcframework already exists"
    exit 0
fi

# Try to download prebuilt xcframework from various sources
echo "⬇️  Downloading prebuilt libsodium..."

TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# Option 1: Try jedisct1's prebuilt releases
PREBUILT_URL="https://github.com/nicwise/libsodium-ios/releases/download/1.0.20/libsodium-ios.zip"
if curl -fsSL -o libsodium.zip "$PREBUILT_URL" 2>/dev/null; then
    echo "Downloaded from nicwise/libsodium-ios"
    unzip -q libsodium.zip
    
    if [ -d "libsodium-ios" ]; then
        # This package structure
        cp -R libsodium-ios/include/* "$VENDOR_DIR/include/" 2>/dev/null || true
        
        # Create xcframework from the static libraries
        if [ -f "libsodium-ios/lib/libsodium.a" ]; then
            mkdir -p "$VENDOR_DIR/ios-device"
            mkdir -p "$VENDOR_DIR/ios-simulator"
            cp "libsodium-ios/lib/libsodium.a" "$VENDOR_DIR/ios-device/"
            
            # Create a simple xcframework structure
            xcodebuild -create-xcframework \
                -library "$VENDOR_DIR/ios-device/libsodium.a" \
                -headers "$VENDOR_DIR/include" \
                -output "$VENDOR_DIR/libsodium.xcframework" 2>/dev/null || {
                    # Fallback: just use the static library directly
                    echo "Using static library fallback..."
                    mkdir -p "$VENDOR_DIR/lib"
                    cp "libsodium-ios/lib/libsodium.a" "$VENDOR_DIR/lib/"
                }
        fi
    fi
else
    echo "Prebuilt not available, building from source..."
    
    # Download source and build
    LIBSODIUM_VERSION="1.0.20"
    curl -fsSL "https://download.libsodium.org/libsodium/releases/libsodium-${LIBSODIUM_VERSION}.tar.gz" -o libsodium.tar.gz
    tar -xzf libsodium.tar.gz
    cd "libsodium-${LIBSODIUM_VERSION}"
    
    # Build for iOS device (arm64)
    echo "🔨 Building for iOS device..."
    export CFLAGS="-arch arm64 -isysroot $(xcrun --sdk iphoneos --show-sdk-path) -mios-version-min=13.0 -fembed-bitcode"
    export LDFLAGS="-arch arm64 -isysroot $(xcrun --sdk iphoneos --show-sdk-path)"
    ./configure --host=arm-apple-darwin --prefix="$TEMP_DIR/ios-device" --disable-shared --enable-static
    make clean && make -j$(sysctl -n hw.ncpu) && make install
    
    # Build for iOS simulator (arm64 for M1)
    echo "🔨 Building for iOS simulator (arm64)..."
    export CFLAGS="-arch arm64 -isysroot $(xcrun --sdk iphonesimulator --show-sdk-path) -mios-simulator-version-min=13.0"
    export LDFLAGS="-arch arm64 -isysroot $(xcrun --sdk iphonesimulator --show-sdk-path)"
    ./configure --host=arm-apple-darwin --prefix="$TEMP_DIR/ios-sim-arm64" --disable-shared --enable-static
    make clean && make -j$(sysctl -n hw.ncpu) && make install
    
    # Build for iOS simulator (x86_64 for Intel)
    echo "🔨 Building for iOS simulator (x86_64)..."
    export CFLAGS="-arch x86_64 -isysroot $(xcrun --sdk iphonesimulator --show-sdk-path) -mios-simulator-version-min=13.0"
    export LDFLAGS="-arch x86_64 -isysroot $(xcrun --sdk iphonesimulator --show-sdk-path)"
    ./configure --host=x86_64-apple-darwin --prefix="$TEMP_DIR/ios-sim-x86" --disable-shared --enable-static
    make clean && make -j$(sysctl -n hw.ncpu) && make install
    
    # Create fat simulator library
    mkdir -p "$TEMP_DIR/ios-sim/lib"
    lipo -create \
        "$TEMP_DIR/ios-sim-arm64/lib/libsodium.a" \
        "$TEMP_DIR/ios-sim-x86/lib/libsodium.a" \
        -output "$TEMP_DIR/ios-sim/lib/libsodium.a"
    
    # Copy headers
    cp -R "$TEMP_DIR/ios-device/include/"* "$VENDOR_DIR/include/"
    
    # Create xcframework
    echo "📁 Creating XCFramework..."
    xcodebuild -create-xcframework \
        -library "$TEMP_DIR/ios-device/lib/libsodium.a" \
        -headers "$TEMP_DIR/ios-device/include" \
        -library "$TEMP_DIR/ios-sim/lib/libsodium.a" \
        -headers "$TEMP_DIR/ios-device/include" \
        -output "$VENDOR_DIR/libsodium.xcframework"
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Verify
if [ -d "$VENDOR_DIR/libsodium.xcframework" ]; then
    echo "✅ libsodium.xcframework created successfully!"
elif [ -f "$VENDOR_DIR/lib/libsodium.a" ]; then
    echo "✅ libsodium.a created (static library fallback)"
else
    echo "❌ Failed to setup libsodium"
    exit 1
fi

echo ""
echo "Now run: cd ios && pod install"


