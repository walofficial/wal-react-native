import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoModule from '../../modules/crypto/specs/RTNCryptoWrapper';

const KEYS_STORAGE = 'user_keys';
const REMOTE_KEY_PREFIX = 'remote_key_';

class WalCrypto {
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

    // Generate new keys using C++ turbo module
    const keyPair = CryptoModule.generateKeyPair();
    const registrationId = Math.floor(Math.random() * 16383) + 1;
    
    // Store keys locally
    await AsyncStorage.setItem(
      KEYS_STORAGE,
      JSON.stringify({
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        registrationId,
      }),
    );

    return {
      identityKeyPair: {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
      },
      registrationId,
      isCached: false,
    };
  }

  public async getPreKeyBundle(): Promise<{ publicKey: string }> {
    const keys = await AsyncStorage.getItem(KEYS_STORAGE);
    if (!keys) {
      throw new Error('No keys available');
    }

    const { publicKey } = JSON.parse(keys);
    return {
      publicKey,
    };
  }

  public async encryptMessage(
    userId: string,
    message: string,
  ): Promise<{ encrypted_content: string; nonce: string }> {
    const nonce = CryptoModule.randomBytes(CryptoModule.NONCE_BYTES);
    const secretKey = await this.getSharedSecretKey(userId);

    if (!secretKey) {
      throw new Error('No shared secret key available for this user');
    }

    const encryptedMessage = CryptoModule.secretBoxSeal(
      message,
      nonce,
      secretKey,
    );

    return {
      encrypted_content: encryptedMessage,
      nonce,
    };
  }

  public async decryptMessage(
    senderId: string,
    encryptedData: { encryptedMessage: string; nonce: string },
  ): Promise<string> {
    const secretKey = await this.getSharedSecretKey(senderId);

    if (!secretKey) {
      throw new Error("Shared secret key for sender isn't available");
    }

    return CryptoModule.secretBoxOpen(
      encryptedData.encryptedMessage,
      encryptedData.nonce,
      secretKey,
    );
  }

  private async getKeyPair(): Promise<{ publicKey: string; privateKey: string } | null> {
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

  private async getSharedSecretKey(userId: string): Promise<string | null> {
    const storedSecret = await AsyncStorage.getItem(`${REMOTE_KEY_PREFIX}${userId}`);
    if (!storedSecret) {
      return null;
    }

    try {
      const parsed = JSON.parse(storedSecret);
      return parsed.secretKey ?? null;
    } catch (error) {
      console.warn('Failed to parse shared secret key', error);
      return null;
    }
  }

  async storeSharedSecretKey(userId: string, secretKey: string): Promise<void> {
    await AsyncStorage.setItem(
      `${REMOTE_KEY_PREFIX}${userId}`,
      JSON.stringify({ secretKey }),
    );
  }

  async generateSharedSecretKey(): Promise<string> {
    return CryptoModule.generateSecretKey();
  }
}

export default new WalCrypto();
