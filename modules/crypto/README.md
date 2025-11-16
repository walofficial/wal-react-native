# RTN Crypto - C++ Turbo Native Module

A C++ Turbo Native Module for generating cryptographic key pairs in React Native.

## Features

- ✨ Cross-platform C++ implementation (iOS & Android)
- 🔑 Generate random key pairs
- 🎲 Generate random bytes
- ⚡ Fast native performance using JSI

## Installation

From your React Native app root:

```bash
# Add the module
npm install ../modules/crypto

# iOS - Install pods
cd ios
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
cd ..

# Android - Enable New Architecture
# Open android/gradle.properties and set:
# newArchEnabled=true
```

## Usage

```typescript
import CryptoModule from 'rtn-crypto/specs/RTNCryptoWrapper';

// Generate a key pair
const keyPair = CryptoModule.generateKeyPair();
console.log('Public Key:', keyPair.publicKey);
console.log('Private Key:', keyPair.privateKey);

// Generate random bytes
const randomHex = CryptoModule.randomBytes(32);
console.log('Random bytes:', randomHex);
```

## Module Structure

```
modules/crypto/
├── specs/               # JavaScript specifications
│   ├── NativeRTNCrypto.ts    # Turbo module spec
│   ├── RTNCryptoWrapper.ts   # TypeScript wrapper
│   └── index.ts
├── shared/              # C++ implementation
│   ├── RTNCrypto.h
│   └── RTNCrypto.cpp
├── ios/                 # iOS specific files
│   ├── RTNCryptoProvider.h
│   └── RTNCryptoProvider.mm
├── android/             # Android specific files
│   ├── build.gradle
│   └── src/main/
│       ├── java/...
│       └── jni/...
├── package.json
└── rtn-crypto.podspec
```

## API

### `generateKeyPair()`

Generates a random 32-byte key pair using the native secure RNG.

**Returns:** `{ publicKey: string, privateKey: string }`

- `publicKey`: Base64-encoded 32-byte public key
- `privateKey`: Base64-encoded 32-byte private key

### `randomBytes(length: number)`

Generates random bytes of specified length.

**Parameters:**
- `length`: Number of bytes to generate

**Returns:** `string` - Base64 encoded random bytes

### `generateSecretKey()`

Creates a 32-byte secret suitable for XSalsa20-Poly1305 secretbox encryption.

**Returns:** `string` - Base64 encoded key

### `secretBoxSeal(message, nonce, secretKey)`

Encrypts and authenticates `message` using XSalsa20-Poly1305.

**Parameters:**
- `message`: Plaintext string
- `nonce`: Base64 encoded 24-byte nonce (must be unique per message)
- `secretKey`: Base64 encoded 32-byte key

**Returns:** `string` - Base64 encoded ciphertext prefixed with the MAC.

### `secretBoxOpen(encryptedMessage, nonce, secretKey)`

Authenticates and decrypts a payload produced by `secretBoxSeal`.

**Parameters:**
- `encryptedMessage`: Base64 encoded MAC + ciphertext
- `nonce`: Base64 encoded 24-byte nonce used during encryption
- `secretKey`: Base64 encoded 32-byte key

**Returns:** `string` - Decrypted plaintext

## Current Implementation

The shared C++ layer bundles a compact [TweetNaCl](https://tweetnacl.cr.yp.to/) implementation that powers XSalsa20-Poly1305 secretbox encryption and uses platform secure random sources for entropy.

## Integration with ProtocolService

This module is integrated with `lib/services/ProtocolService.ts` to provide key generation capabilities for the Signal Protocol implementation.

## Development

To regenerate codegen files:

```bash
# iOS
node node_modules/react-native/scripts/generate-codegen-artifacts.js \
  --targetPlatform ios \
  --path . \
  --outputPath modules/crypto/generated/

# Android
cd android
./gradlew generateCodegenArtifactsFromSchema
```

## License

MIT

