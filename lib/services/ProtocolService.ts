import crypto from 'react-native-quick-crypto';
import { Buffer } from '@craftzdog/react-native-buffer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS_STORAGE = 'user_keys_v2';

// ChaCha20-Poly1305 uses 12-byte nonce
const NONCE_BYTES = 12;
// Auth tag is 16 bytes for ChaCha20-Poly1305
const AUTH_TAG_BYTES = 16;

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

class SignalProtocolService {
  constructor() {}

  public async clearKeys(): Promise<void> {
    await AsyncStorage.removeItem(KEYS_STORAGE);
  }

  public async generateIdentityKeyPair(): Promise<{
    identityKeyPair: { publicKey: string; privateKey: string };
    registrationId: number;
    isCached: boolean;
  }> {
    // Check if keys already exist
    const existingKeys = await AsyncStorage.getItem(KEYS_STORAGE);
    if (existingKeys) {
      const keys = JSON.parse(existingKeys);
      return {
        identityKeyPair: {
          publicKey: keys.publicKey,
          privateKey: keys.privateKey,
        },
        registrationId: keys.registrationId,
        isCached: true,
      };
    }

    // Generate new X25519 key pair
    const keyPair = crypto.generateKeyPairSync('x25519', {
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' },
    });

    const publicKey = keyPair.publicKey as ArrayBuffer;
    const privateKey = keyPair.privateKey as ArrayBuffer;

    // Convert to base64 for storage
    const publicKeyBase64 = Buffer.from(publicKey).toString('base64');
    const privateKeyBase64 = Buffer.from(privateKey).toString('base64');

    const registrationId = Math.floor(Math.random() * 16383) + 1;

    // Store keys locally
    await AsyncStorage.setItem(
      KEYS_STORAGE,
      JSON.stringify({
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
        registrationId,
      }),
    );

    return {
      identityKeyPair: {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64,
      },
      registrationId,
      isCached: false,
    };
  }

  public async getPreKeyBundle(): Promise<{ publicKey: string }> {
    const keyPair = await this.getKeyPair();
    if (!keyPair) {
      throw new Error('No keys available');
    }

    return {
      publicKey: keyPair.publicKey,
    };
  }

  public async encryptMessage(
    userId: string,
    message: string,
  ): Promise<{ encrypted_content: string; nonce: string }> {
    const keyPair = await this.getKeyPair();
    if (!keyPair) {
      throw new Error('No key pair available');
    }

    const remoteKeyBundle = await AsyncStorage.getItem(`remote_key_${userId}`);
    if (!remoteKeyBundle) {
      throw new Error('Remote key bundle not found');
    }

    const recipientPublicKeyBase64 = JSON.parse(remoteKeyBundle).publicKey;

    // Derive shared secret using Diffie-Hellman
    const sharedSecret = this.deriveSharedSecret(
      keyPair.privateKey,
      recipientPublicKeyBase64,
    );

    // Generate nonce (12 bytes for ChaCha20-Poly1305)
    const nonce = crypto.randomBytes(NONCE_BYTES);

    // Encrypt with ChaCha20-Poly1305
    const cipher = crypto.createCipheriv(
      'chacha20-poly1305',
      sharedSecret,
      nonce,
      { authTagLength: AUTH_TAG_BYTES },
    );

    const messageBuffer = Buffer.from(message, 'utf-8');
    const encrypted = Buffer.concat([
      cipher.update(messageBuffer),
      cipher.final(),
    ]);

    // Get auth tag and append to ciphertext
    const authTag = cipher.getAuthTag();
    const encryptedWithTag = Buffer.concat([encrypted, authTag]);

    return {
      encrypted_content: encryptedWithTag.toString('base64'),
      nonce: nonce.toString('base64'),
    };
  }

  public async decryptMessage(
    senderId: string,
    encryptedData: { encryptedMessage: string; nonce: string },
  ): Promise<string> {
    const keyPair = await this.getKeyPair();
    if (!keyPair) {
      throw new Error('No key pair available');
    }

    const remoteKeyBundle = await AsyncStorage.getItem(
      `remote_key_${senderId}`,
    );
    if (!remoteKeyBundle) {
      throw new Error("Sender's key bundle not found");
    }

    const senderPublicKeyBase64 = JSON.parse(remoteKeyBundle).publicKey;

    // Derive shared secret using Diffie-Hellman
    const sharedSecret = this.deriveSharedSecret(
      keyPair.privateKey,
      senderPublicKeyBase64,
    );

    // Decode nonce and ciphertext
    const nonce = Buffer.from(encryptedData.nonce, 'base64');
    const encryptedWithTag = Buffer.from(
      encryptedData.encryptedMessage,
      'base64',
    );

    // Split ciphertext and auth tag
    const ciphertext = encryptedWithTag.subarray(0, -AUTH_TAG_BYTES);
    const authTag = encryptedWithTag.subarray(-AUTH_TAG_BYTES);

    // Decrypt with ChaCha20-Poly1305
    const decipher = crypto.createDecipheriv(
      'chacha20-poly1305',
      sharedSecret,
      nonce,
      { authTagLength: AUTH_TAG_BYTES },
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf-8');
  }

  private deriveSharedSecret(
    privateKeyBase64: string,
    publicKeyBase64: string,
  ): Buffer {
    // Create KeyObjects from the stored keys
    const privateKeyDer = Buffer.from(privateKeyBase64, 'base64');
    const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');

    const privateKey = crypto.createPrivateKey({
      key: privateKeyDer,
      format: 'der',
      type: 'pkcs8',
    });

    const publicKey = crypto.createPublicKey({
      key: publicKeyDer,
      format: 'der',
      type: 'spki',
    });

    // Compute shared secret using Diffie-Hellman
    const sharedSecret = crypto.diffieHellman({
      privateKey,
      publicKey,
    }) as Buffer;

    return sharedSecret;
  }

  private async getKeyPair(): Promise<KeyPair | null> {
    const keys = await AsyncStorage.getItem(KEYS_STORAGE);
    if (keys) {
      const { publicKey, privateKey } = JSON.parse(keys);
      return {
        publicKey,
        privateKey,
      };
    }
    return null;
  }

  async storeRemotePublicKey(userId: string, publicKey: string): Promise<void> {
    await AsyncStorage.setItem(
      `remote_key_${userId}`,
      JSON.stringify({ publicKey }),
    );
  }
}

export default new SignalProtocolService();
