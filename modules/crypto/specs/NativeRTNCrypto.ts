import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Key pair generation for crypto_box (public-key cryptography)
  cryptoBoxKeypair(): { publicKey: number[]; privateKey: number[] };

  // Random bytes generation (returns base64 string)
  randombytesBuf(length: number): string;

  // Public-key authenticated encryption
  cryptoBoxEasy(
    message: string,
    nonce: string,
    recipientPublicKey: string,
    senderSecretKey: string,
  ): string;

  // Public-key authenticated decryption
  cryptoBoxOpenEasy(
    ciphertext: string,
    nonce: string,
    senderPublicKey: string,
    recipientSecretKey: string,
  ): string;

  // Base64 encoding/decoding
  toBase64(bytes: number[]): string;
  fromBase64(base64String: string): number[];

  // Constants
  getCryptoBoxPublickeybytes(): number;
  getCryptoBoxSecretkeybytes(): number;
  getCryptoBoxNoncebytes(): number;
  getCryptoBoxMacbytes(): number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RTNCrypto');
