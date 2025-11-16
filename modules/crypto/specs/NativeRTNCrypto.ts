import { TurboModule, TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  generateKeyPair(): { publicKey: string; privateKey: string };
  randomBytes(length: number): string;
  generateSecretKey(): string;
  secretBoxSeal(message: string, nonce: string, secretKey: string): string;
  secretBoxOpen(encryptedMessage: string, nonce: string, secretKey: string): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('RTNCrypto');

