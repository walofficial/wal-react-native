// Re-export everything from the wrapper module
export {
  // Functions matching react-native-libsodium API
  crypto_box_keypair,
  crypto_box_easy,
  crypto_box_open_easy,
  randombytes_buf,
  to_base64,
  from_base64,
  to_string,
  from_string,
  // Constants
  crypto_box_PUBLICKEYBYTES,
  crypto_box_SECRETKEYBYTES,
  crypto_box_NONCEBYTES,
  crypto_box_MACBYTES,
  // Legacy/backwards compatibility
  CryptoModule,
  type KeyPair,
} from './RTNCryptoWrapper';

export { default } from './NativeRTNCrypto';
