# RTN Crypto - Libsodium Turbo Native Module

A C++ Turbo Native Module providing libsodium cryptographic functions for React Native, with an API compatible with `react-native-libsodium`.

## Features

- ✨ Cross-platform C++ implementation (iOS & Android)
- 🔐 Public-key authenticated encryption (crypto_box)
- 🔑 Key pair generation
- 🎲 Secure random bytes generation
- ⚡ Fast native performance using JSI
- 📦 API compatible with `react-native-libsodium`

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
import {
  crypto_box_keypair,
  crypto_box_easy,
  crypto_box_open_easy,
  randombytes_buf,
  to_base64,
  from_base64,
  to_string,
  crypto_box_NONCEBYTES,
} from 'rtn-crypto';

// Generate key pairs for Alice and Bob
const aliceKeys = crypto_box_keypair();
const bobKeys = crypto_box_keypair();

// Alice encrypts a message for Bob
const nonce = randombytes_buf(crypto_box_NONCEBYTES);
const message = 'Hello, Bob!';
const ciphertext = crypto_box_easy(
  message,
  nonce,
  bobKeys.publicKey,    // Bob's public key
  aliceKeys.privateKey  // Alice's secret key
);

// Bob decrypts the message from Alice
const decrypted = crypto_box_open_easy(
  ciphertext,
  nonce,
  aliceKeys.publicKey,  // Alice's public key
  bobKeys.privateKey    // Bob's secret key
);

console.log('Decrypted:', to_string(decrypted)); // "Hello, Bob!"
```

## Module Structure

```
modules/crypto/
├── specs/               # JavaScript specifications
│   ├── NativeRTNCrypto.ts    # Turbo module spec
│   ├── RTNCryptoWrapper.ts   # TypeScript wrapper
│   └── index.ts
├── shared/              # C++ implementation (using libsodium)
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

### Constants

- `crypto_box_PUBLICKEYBYTES` - Size of public key (32 bytes)
- `crypto_box_SECRETKEYBYTES` - Size of secret key (32 bytes)
- `crypto_box_NONCEBYTES` - Size of nonce (24 bytes)
- `crypto_box_MACBYTES` - Size of MAC (16 bytes)

### `crypto_box_keypair()`

Generates a new key pair for public-key authenticated encryption.

**Returns:** `{ publicKey: Uint8Array, privateKey: Uint8Array }`

### `randombytes_buf(length: number)`

Generates cryptographically secure random bytes.

**Parameters:**
- `length`: Number of bytes to generate

**Returns:** `Uint8Array` - Random bytes

### `crypto_box_easy(message, nonce, recipientPublicKey, senderSecretKey)`

Encrypts and authenticates a message using the recipient's public key and sender's secret key.

**Parameters:**
- `message`: Plaintext string or Uint8Array
- `nonce`: 24-byte Uint8Array (must be unique per message)
- `recipientPublicKey`: Recipient's 32-byte public key
- `senderSecretKey`: Sender's 32-byte secret key

**Returns:** `Uint8Array` - Authenticated ciphertext

### `crypto_box_open_easy(ciphertext, nonce, senderPublicKey, recipientSecretKey)`

Decrypts and verifies a message encrypted with `crypto_box_easy`.

**Parameters:**
- `ciphertext`: Encrypted message from `crypto_box_easy`
- `nonce`: 24-byte nonce used during encryption
- `senderPublicKey`: Sender's 32-byte public key
- `recipientSecretKey`: Recipient's 32-byte secret key

**Returns:** `Uint8Array` - Decrypted plaintext

### `to_base64(bytes: Uint8Array)`

Converts bytes to base64 string.

**Returns:** `string` - Base64 encoded string

### `from_base64(base64String: string)`

Converts base64 string to bytes.

**Returns:** `Uint8Array` - Decoded bytes

### `to_string(bytes: Uint8Array)`

Converts bytes to UTF-8 string.

**Returns:** `string` - UTF-8 decoded string

## Current Implementation

The shared C++ layer uses [libsodium](https://libsodium.org/) to provide:
- **crypto_box**: Public-key authenticated encryption using X25519 + XSalsa20-Poly1305
- **randombytes_buf**: Cryptographically secure random number generation

## Integration with ProtocolService

This module is integrated with `lib/services/ProtocolService.ts` to provide end-to-end encryption capabilities using public-key cryptography.

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
