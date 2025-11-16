import AsyncStorage from '@react-native-async-storage/async-storage';
import ProtocolService from '../ProtocolService';
import CryptoModule from '../../../modules/crypto/specs/RTNCryptoWrapper';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../../modules/crypto/specs/RTNCryptoWrapper', () => {
  const mock = {
    NONCE_BYTES: 24,
    SECRET_KEY_BYTES: 32,
    MAC_BYTES: 16,
    generateKeyPair: jest.fn(),
    randomBytes: jest.fn(),
    generateSecretKey: jest.fn(),
    secretBoxSeal: jest.fn(),
    secretBoxOpen: jest.fn(),
  };

  return {
    __esModule: true,
    default: mock,
  };
});

describe('ProtocolService secret box flow', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('encrypts messages with stored shared secret key', async () => {
    const secretKey = 'secret-key-b64';
    const nonce = 'nonce-b64';
    await ProtocolService.storeSharedSecretKey('user-1', secretKey);

    (CryptoModule.randomBytes as jest.Mock).mockReturnValueOnce(nonce);
    (CryptoModule.secretBoxSeal as jest.Mock).mockReturnValueOnce('cipher-b64');

    const result = await ProtocolService.encryptMessage('user-1', 'hello world');

    expect(CryptoModule.randomBytes).toHaveBeenCalledWith(CryptoModule.NONCE_BYTES);
    expect(CryptoModule.secretBoxSeal).toHaveBeenCalledWith(
      'hello world',
      nonce,
      secretKey,
    );
    expect(result).toEqual({
      encrypted_content: 'cipher-b64',
      nonce,
    });
  });

  it('throws when decrypting without a shared key', async () => {
    await expect(
      ProtocolService.decryptMessage('missing-user', {
        encryptedMessage: 'cipher',
        nonce: 'nonce',
      }),
    ).rejects.toThrow('Shared secret key');
  });

  it('decrypts messages with shared secret', async () => {
    await ProtocolService.storeSharedSecretKey('user-2', 'secret-key-b64');
    (CryptoModule.secretBoxOpen as jest.Mock).mockReturnValueOnce('plain text');

    const result = await ProtocolService.decryptMessage('user-2', {
      encryptedMessage: 'cipher',
      nonce: 'nonce',
    });

    expect(CryptoModule.secretBoxOpen).toHaveBeenCalledWith(
      'cipher',
      'nonce',
      'secret-key-b64',
    );
    expect(result).toBe('plain text');
  });
});


