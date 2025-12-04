# Setup Instructions for RTNCrypto Module

This guide will help you integrate the RTNCrypto C++ Turbo Native Module into your React Native app.

## Prerequisites

- React Native 0.72 or higher with New Architecture enabled
- For iOS: CocoaPods installed, Xcode Command Line Tools
- For Android: Android Studio and NDK

## Step 1: Add the Module to Your App

From your app's root directory:

```bash
npm install ./modules/crypto
```

## Step 2: Setup libsodium

The module uses [libsodium](https://doc.libsodium.org/) for cryptographic operations.

### iOS (libsodium XCFramework)

Run the setup script to download and build libsodium for iOS:

```bash
./modules/crypto/scripts/setup-libsodium.sh
```

This will:
- Download libsodium 1.0.20 from official releases
- Build for iOS device (arm64) and simulator (arm64 + x86_64)
- Create an XCFramework at `vendor/libsodium.xcframework`

### Android (automatic via CMake)

**No setup required!** Android builds libsodium automatically from source using CMake FetchContent.

The CMakeLists.txt uses [robinlinden/libsodium-cmake](https://github.com/robinlinden/libsodium-cmake) to:
- Download libsodium source code during the build
- Compile for all Android ABIs (arm64-v8a, armeabi-v7a, x86, x86_64)
- Link statically with the native module

The first build will take longer as it compiles libsodium from source.

## Step 3: iOS Setup

1. **Install the pods:**

```bash
cd ios
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
cd ..
```

2. **Verify installation:**
   - Open `ios/YourApp.xcworkspace` in Xcode
   - The `rtn-crypto` pod should be listed in Pods project

## Step 4: Android Setup

1. **Enable New Architecture:**

Edit `android/gradle.properties`:

```properties
newArchEnabled=true
```

2. **Verify configuration:**

```bash
cd android
./gradlew generateCodegenArtifactsFromSchema
cd ..
```

This should generate codegen files without errors.

## Step 4: Run Codegen (Optional - for development)

If you want to see the generated code:

### iOS:
```bash
node node_modules/react-native/scripts/generate-codegen-artifacts.js \
  --targetPlatform ios \
  --path . \
  --outputPath modules/crypto/generated/
```

### Android:
```bash
cd android
./gradlew generateCodegenArtifactsFromSchema
```

## Step 5: Test the Module

Create a test component:

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import CryptoModule from 'rtn-crypto/specs/RTNCryptoWrapper';

export default function CryptoTest() {
  const [keys, setKeys] = React.useState<any>(null);

  const generateKeys = () => {
    const keyPair = CryptoModule.generateKeyPair();
    setKeys(keyPair);
    console.log('Generated keys:', keyPair);
  };

  return (
    <View style={{ padding: 20 }}>
      <Button title="Generate Keys" onPress={generateKeys} />
      {keys && (
        <View>
          <Text>Public: {keys.publicKey.substring(0, 20)}...</Text>
          <Text>Private: {keys.privateKey.substring(0, 20)}...</Text>
        </View>
      )}
    </View>
  );
}
```

## Step 6: Build and Run

### iOS:
```bash
npm run ios
```

### Android:
```bash
npm run android
```

## Troubleshooting

### libsodium Issues

**iOS: "libsodium.xcframework not found":**
```bash
# Run the setup script
./modules/crypto/scripts/setup-libsodium.sh

# Then reinstall pods
cd ios && pod install
```

**Android: libsodium build fails:**
```bash
# Clean and rebuild (libsodium is built automatically via CMake)
cd android && ./gradlew clean
cd .. && npx expo run:android
```

**Build fails with "sodium.h not found":**
- For iOS: Ensure you've run `./modules/crypto/scripts/setup-libsodium.sh`
- For iOS: Check that `vendor/include/sodium.h` exists
- For iOS: Verify `vendor/libsodium.xcframework` exists
- For Android: This is handled automatically by CMake FetchContent

### iOS Issues

**Pod install fails:**
```bash
cd ios
rm -rf Pods Podfile.lock
RCT_NEW_ARCH_ENABLED=1 bundle install
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
```

**Build fails with "RTNCryptoSpec.h not found":**
- Clean the build: `rm -rf ios/build`
- Reinstall pods: `cd ios && pod install`

### Android Issues

**Gradle sync fails:**
```bash
cd android
./gradlew clean
./gradlew generateCodegenArtifactsFromSchema
```

**CMake errors:**
- Ensure NDK is installed in Android Studio
- Check that `android/local.properties` has correct SDK path
- Verify libsodium is set up: `./modules/crypto/scripts/setup-libsodium-android.sh`

**Module not found at runtime:**
- Verify `newArchEnabled=true` in `gradle.properties`
- Clean and rebuild: `cd android && ./gradlew clean && cd .. && npm run android`

### General Issues

**"Cannot find module 'rtn-crypto'":**
- Ensure the module is added: `npm install ./modules/crypto`
- Clear cache: `npm start -- --reset-cache`

**TypeScript errors:**
- Install types: `npm install`
- Restart TypeScript server in your IDE

## Verifying Installation

Run this in your app to verify the module is working:

```typescript
import CryptoModule from 'rtn-crypto/specs/RTNCryptoWrapper';

// This should log a key pair with 64-character hex strings
console.log(CryptoModule.generateKeyPair());

// This should log a 64-character hex string (32 bytes)
console.log(CryptoModule.randomBytes(32));

// Generate a shared secret key and test authenticated encryption
const secretKey = CryptoModule.generateSecretKey();
const nonce = CryptoModule.randomBytes(CryptoModule.NONCE_BYTES);
const ciphertext = CryptoModule.secretBoxSeal('Hello', nonce, secretKey);
const plaintext = CryptoModule.secretBoxOpen(ciphertext, nonce, secretKey);
console.log({ secretKey, nonce, ciphertext, plaintext });
```

## Next Steps

- The module uses [libsodium](https://doc.libsodium.org/) for all cryptographic operations
- Cryptographic functions are implemented in `shared/RTNCrypto.cpp`
- Add more cryptographic primitives as needed (signatures, hashing, etc.)
- Add unit tests

## Integration with ProtocolService

The module is already integrated with `lib/services/ProtocolService.ts`. The `generateIdentityKeyPair()` method now uses the C++ Turbo Module for key generation.

