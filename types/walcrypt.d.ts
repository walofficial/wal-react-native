declare module 'walcrypt' {
  export const crypto_box_NONCEBYTES: number;

  export function crypto_box_keypair(): {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  };

  export function crypto_box_easy(
    message: string,
    nonce: Uint8Array,
    recipientPublicKey: Uint8Array,
    senderSecretKey: Uint8Array,
  ): Uint8Array;

  export function crypto_box_open_easy(
    ciphertext: Uint8Array,
    nonce: Uint8Array,
    senderPublicKey: Uint8Array,
    recipientSecretKey: Uint8Array,
  ): Uint8Array;

  export function randombytes_buf(size: number): Uint8Array;
  export function to_base64(bytes: Uint8Array): string;
  export function from_base64(base64: string): Uint8Array;
  export function to_string(bytes: Uint8Array): string;

  // Keep a default export for compatibility with expo-module template default export.
  const defaultExport: unknown;
  export default defaultExport;
}


