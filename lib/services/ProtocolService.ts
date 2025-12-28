import {
  crypto_box_keypair,
  crypto_box_easy,
  crypto_box_open_easy,
  randombytes_buf,
  to_base64,
  from_base64,
  to_string,
  crypto_box_NONCEBYTES,
} from 'react-native-libsodium';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS_STORAGE = 'user_keys_v2';

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

    // Generate new X25519 key pair (libsodium crypto_box keypair)
    const keyPair = crypto_box_keypair();

    // Convert to base64 for storage
    const publicKeyBase64 = to_base64(keyPair.publicKey);
    const privateKeyBase64 = to_base64(keyPair.privateKey);

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
    const recipientPublicKey = from_base64(recipientPublicKeyBase64);
    const senderSecretKey = from_base64(keyPair.privateKey);

    // Generate nonce (24 bytes for crypto_box)
    const nonce = randombytes_buf(crypto_box_NONCEBYTES);

    const encrypted = crypto_box_easy(
      message,
      nonce,
      recipientPublicKey,
      senderSecretKey,
    );
    return {
      encrypted_content: to_base64(encrypted),
      nonce: to_base64(nonce),
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
    const senderPublicKey = from_base64(senderPublicKeyBase64);
    const recipientSecretKey = from_base64(keyPair.privateKey);

    const nonce = from_base64(encryptedData.nonce);
    const ciphertext = from_base64(encryptedData.encryptedMessage);
    const decrypted = crypto_box_open_easy(
      ciphertext,
      nonce,
      senderPublicKey,
      recipientSecretKey,
    );

    return to_string(decrypted);
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
