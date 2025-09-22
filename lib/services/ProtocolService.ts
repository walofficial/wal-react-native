import {
  crypto_box_keypair,
  crypto_box_easy,
  crypto_box_open_easy,
  randombytes_buf,
  to_base64,
  from_base64,
  to_string,
  crypto_box_PUBLICKEYBYTES,
  crypto_box_SECRETKEYBYTES,
  crypto_box_NONCEBYTES,
} from 'react-native-libsodium';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS_STORAGE = 'user_keys';

interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

class SignalProtocolService {
  constructor() { }

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

    // Generate new keys only if they don't exist
    const keyPair = crypto_box_keypair();
    const registrationId = Math.floor(Math.random() * 16383) + 1;

    // Store keys locally
    await AsyncStorage.setItem(
      KEYS_STORAGE,
      JSON.stringify({
        publicKey: to_base64(keyPair.publicKey),
        privateKey: to_base64(keyPair.privateKey),
        registrationId,
      }),
    );

    return {
      identityKeyPair: {
        publicKey: to_base64(keyPair.publicKey),
        privateKey: to_base64(keyPair.privateKey),
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
      publicKey: to_base64(keyPair.publicKey),
    };
  }

  public async encryptMessage(
    userId: string,
    message: string,
  ): Promise<{ encrypted_content: string; nonce: string }> {
    const nonce = randombytes_buf(crypto_box_NONCEBYTES);
    const keyPair = await this.getKeyPair();

    if (!keyPair) {
      throw new Error('No key pair available');
    }

    const remoteKeyBundle = await AsyncStorage.getItem(`remote_key_${userId}`);
    if (!remoteKeyBundle) {
      throw new Error('Remote key bundle not found');
    }

    const recipientPublicKey = JSON.parse(remoteKeyBundle).publicKey;

    const encryptedMessage = crypto_box_easy(
      message,
      nonce,
      from_base64(recipientPublicKey),
      keyPair.privateKey,
    );

    return {
      encrypted_content: to_base64(encryptedMessage),
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

    const senderPublicKey = JSON.parse(remoteKeyBundle).publicKey;
    const decryptedMessage = crypto_box_open_easy(
      from_base64(encryptedData.encryptedMessage),
      from_base64(encryptedData.nonce),
      from_base64(senderPublicKey),
      keyPair.privateKey,
    );

    return to_string(decryptedMessage);
  }

  private async getKeyPair(): Promise<KeyPair | null> {
    const keys = await AsyncStorage.getItem(KEYS_STORAGE);
    if (keys) {
      const { publicKey, privateKey } = JSON.parse(keys);
      return {
        publicKey: from_base64(publicKey),
        privateKey: from_base64(privateKey),
      };
    }
    return null;
  }

  async getRemotePublicKey(userId: string): Promise<string | null> {
    const remoteKeyBundle = await AsyncStorage.getItem(`remote_key_${userId}`);
    return remoteKeyBundle ? JSON.parse(remoteKeyBundle).publicKey : null;
  }

  async storeRemotePublicKey(userId: string, publicKey: string): Promise<void> {
    await AsyncStorage.setItem(
      `remote_key_${userId}`,
      JSON.stringify({ publicKey }),
    );
  }
}

export default new SignalProtocolService();
