import RTNCrypto from './NativeRTNCrypto';

// Constants (matching libsodium - hardcoded values)
export const crypto_box_PUBLICKEYBYTES = 32;
export const crypto_box_SECRETKEYBYTES = 32;
export const crypto_box_NONCEBYTES = 24;
export const crypto_box_MACBYTES = 16;

/**
 * Generate a key pair for crypto_box (public-key cryptography)
 * Returns an object with publicKey and privateKey as Uint8Array
 */
export function crypto_box_keypair(): {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
} {
  const result = RTNCrypto.cryptoBoxKeypair();
  return {
    publicKey: new Uint8Array(result.publicKey),
    privateKey: new Uint8Array(result.privateKey),
  };
}

/**
 * Generate random bytes
 * @param length Number of bytes to generate
 * @returns Uint8Array of random bytes
 */
export function randombytes_buf(length: number): Uint8Array {
  const base64 = RTNCrypto.randombytesBuf(length);
  return from_base64(base64);
}

/**
 * Public-key authenticated encryption (crypto_box)
 * Encrypts a message using the recipient's public key and sender's secret key
 * @param message The plaintext message (string or Uint8Array)
 * @param nonce 24-byte nonce (Uint8Array)
 * @param recipientPublicKey Recipient's 32-byte public key (Uint8Array)
 * @param senderSecretKey Sender's 32-byte secret key (Uint8Array)
 * @returns Encrypted message as Uint8Array
 */
export function crypto_box_easy(
  message: string | Uint8Array,
  nonce: Uint8Array,
  recipientPublicKey: Uint8Array,
  senderSecretKey: Uint8Array,
): Uint8Array {
  const messageStr =
    typeof message === 'string' ? message : to_string(message);
  const nonceBase64 = to_base64(nonce);
  const pkBase64 = to_base64(recipientPublicKey);
  const skBase64 = to_base64(senderSecretKey);

  const resultBase64 = RTNCrypto.cryptoBoxEasy(
    messageStr,
    nonceBase64,
    pkBase64,
    skBase64,
  );
  return from_base64(resultBase64);
}

/**
 * Public-key authenticated decryption (crypto_box_open)
 * Decrypts a message using the sender's public key and recipient's secret key
 * @param ciphertext The encrypted message (Uint8Array)
 * @param nonce 24-byte nonce (Uint8Array)
 * @param senderPublicKey Sender's 32-byte public key (Uint8Array)
 * @param recipientSecretKey Recipient's 32-byte secret key (Uint8Array)
 * @returns Decrypted message as Uint8Array
 */
export function crypto_box_open_easy(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  senderPublicKey: Uint8Array,
  recipientSecretKey: Uint8Array,
): Uint8Array {
  const ciphertextBase64 = to_base64(ciphertext);
  const nonceBase64 = to_base64(nonce);
  const pkBase64 = to_base64(senderPublicKey);
  const skBase64 = to_base64(recipientSecretKey);

  const resultBase64 = RTNCrypto.cryptoBoxOpenEasy(
    ciphertextBase64,
    nonceBase64,
    pkBase64,
    skBase64,
  );
  return from_base64(resultBase64);
}

/**
 * Convert Uint8Array to base64 string
 */
export function to_base64(bytes: Uint8Array): string {
  return RTNCrypto.toBase64(Array.from(bytes));
}

/**
 * Convert base64 string to Uint8Array
 */
export function from_base64(base64String: string): Uint8Array {
  const result = RTNCrypto.fromBase64(base64String);
  return new Uint8Array(result);
}

/**
 * Convert Uint8Array to string (UTF-8)
 */
export function to_string(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert string to Uint8Array (UTF-8)
 */
export function from_string(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Legacy exports for backwards compatibility
export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export class CryptoModule {
  static readonly NONCE_BYTES = crypto_box_NONCEBYTES;
  static readonly PUBLIC_KEY_BYTES = crypto_box_PUBLICKEYBYTES;
  static readonly SECRET_KEY_BYTES = crypto_box_SECRETKEYBYTES;
  static readonly MAC_BYTES = crypto_box_MACBYTES;

  static generateKeyPair(): KeyPair {
    return crypto_box_keypair();
  }

  static randomBytes(length: number): Uint8Array {
    return randombytes_buf(length);
  }
}

export default CryptoModule;
