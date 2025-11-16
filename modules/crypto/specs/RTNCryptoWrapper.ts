import RTNCrypto from './NativeRTNCrypto';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export class CryptoModule {
  static readonly NONCE_BYTES = 24; // Standard nonce size for NaCl/libsodium
  static readonly SECRET_KEY_BYTES = 32;
  static readonly MAC_BYTES = 16;

  /**
   * Generate a random key pair
   * @returns Object with publicKey and privateKey as base64 strings
   */
  static generateKeyPair(): KeyPair {
    return RTNCrypto.generateKeyPair();
  }

  /**
   * Generate random bytes
   * @param length Number of bytes to generate
   * @returns Base64 string of random bytes
   */
  static randomBytes(length: number): string {
    return RTNCrypto.randomBytes(length);
  }

  /**
   * Generate a 32-byte secret key suitable for secretbox usage.
   */
  static generateSecretKey(): string {
    return RTNCrypto.generateSecretKey();
  }

  /**
   * Encrypt a message using XSalsa20-Poly1305 authenticated encryption.
   * @param message Message to encrypt
   * @param nonce Base64 encoded nonce
   * @param secretKey Base64 encoded 32-byte key
   */
  static secretBoxSeal(message: string, nonce: string, secretKey: string): string {
    return RTNCrypto.secretBoxSeal(message, nonce, secretKey);
  }

  /**
   * Decrypt a message sealed with secretBoxSeal.
   * @param encryptedMessage Base64 string containing MAC + ciphertext
   * @param nonce Base64 encoded nonce
   * @param secretKey Base64 encoded 32-byte key
   */
  static secretBoxOpen(encryptedMessage: string, nonce: string, secretKey: string): string {
    return RTNCrypto.secretBoxOpen(encryptedMessage, nonce, secretKey);
  }
}

export default CryptoModule;

