#include "RTNCrypto.h"
#include <cstring>
#include <iomanip>
#include <sodium.h>
#include <sstream>
#include <stdexcept>
#include <vector>

namespace facebook::react {

// Initialize libsodium
static bool sodiumInitialized = false;
static void ensureSodiumInit() {
  if (!sodiumInitialized) {
    if (sodium_init() < 0) {
      throw std::runtime_error("libsodium initialization failed");
    }
    sodiumInitialized = true;
  }
}

RTNCrypto::RTNCrypto(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeRTNCryptoCxxSpec(std::move(jsInvoker)) {
  ensureSodiumInit();
}

// Helper: Convert vector of bytes to base64 string using libsodium
static std::string bytesToBase64(const std::vector<uint8_t> &bytes) {
  size_t encoded_len =
      sodium_base64_encoded_len(bytes.size(), sodium_base64_VARIANT_ORIGINAL);
  std::vector<char> encoded(encoded_len);
  sodium_bin2base64(encoded.data(), encoded_len, bytes.data(), bytes.size(),
                    sodium_base64_VARIANT_ORIGINAL);
  return std::string(encoded.data());
}

// Helper: Convert base64 string to vector of bytes using libsodium
static std::vector<uint8_t> base64ToBytes(const std::string &encoded_string) {
  size_t max_len = encoded_string.size();
  std::vector<uint8_t> bytes(max_len);
  size_t bin_len = 0;

  if (sodium_base642bin(bytes.data(), bytes.size(), encoded_string.c_str(),
                        encoded_string.size(), nullptr, &bin_len, nullptr,
                        sodium_base64_VARIANT_ORIGINAL) != 0) {
    throw std::runtime_error("Failed to decode base64 string");
  }

  bytes.resize(bin_len);
  return bytes;
}

// Helper: Validate buffer length
static void validateBufferLength(jsi::Runtime &rt,
                                 const std::vector<uint8_t> &data,
                                 size_t expected, const std::string &label) {
  if (data.size() != expected) {
    std::stringstream ss;
    ss << label << " must be " << expected << " bytes. Got " << data.size();
    throw jsi::JSError(rt, ss.str());
  }
}

// Generate key pair for crypto_box (public-key cryptography)
jsi::Object RTNCrypto::cryptoBoxKeypair(jsi::Runtime &rt) {
  ensureSodiumInit();

  std::vector<uint8_t> pk(crypto_box_PUBLICKEYBYTES);
  std::vector<uint8_t> sk(crypto_box_SECRETKEYBYTES);

  crypto_box_keypair(pk.data(), sk.data());

  // Create Uint8Array-like objects for publicKey and privateKey
  jsi::Object result(rt);

  // Create publicKey as Uint8Array
  jsi::Array publicKeyArray(rt, pk.size());
  for (size_t i = 0; i < pk.size(); i++) {
    publicKeyArray.setValueAtIndex(rt, i, jsi::Value(static_cast<int>(pk[i])));
  }

  // Create privateKey as Uint8Array
  jsi::Array privateKeyArray(rt, sk.size());
  for (size_t i = 0; i < sk.size(); i++) {
    privateKeyArray.setValueAtIndex(rt, i, jsi::Value(static_cast<int>(sk[i])));
  }

  result.setProperty(rt, "publicKey", publicKeyArray);
  result.setProperty(rt, "privateKey", privateKeyArray);

  return result;
}

// Generate random bytes (like randombytes_buf)
jsi::String RTNCrypto::randombytesBuf(jsi::Runtime &rt, double length) {
  ensureSodiumInit();

  int byteLength = static_cast<int>(length);
  if (byteLength <= 0) {
    return jsi::String::createFromUtf8(rt, "");
  }

  std::vector<uint8_t> bytes(static_cast<size_t>(byteLength));
  randombytes_buf(bytes.data(), bytes.size());

  std::string result = bytesToBase64(bytes);
  return jsi::String::createFromUtf8(rt, result);
}

// Public-key authenticated encryption
jsi::String RTNCrypto::cryptoBoxEasy(jsi::Runtime &rt, jsi::String message,
                                     jsi::String nonce,
                                     jsi::String recipientPublicKey,
                                     jsi::String senderSecretKey) {
  ensureSodiumInit();

  std::string messageStr = message.utf8(rt);
  std::string nonceStr = nonce.utf8(rt);
  std::string pkStr = recipientPublicKey.utf8(rt);
  std::string skStr = senderSecretKey.utf8(rt);

  auto nonceBytes = base64ToBytes(nonceStr);
  auto pkBytes = base64ToBytes(pkStr);
  auto skBytes = base64ToBytes(skStr);

  validateBufferLength(rt, nonceBytes, crypto_box_NONCEBYTES, "Nonce");
  validateBufferLength(rt, pkBytes, crypto_box_PUBLICKEYBYTES,
                       "Recipient public key");
  validateBufferLength(rt, skBytes, crypto_box_SECRETKEYBYTES,
                       "Sender secret key");

  std::vector<uint8_t> ciphertext(crypto_box_MACBYTES + messageStr.size());

  if (crypto_box_easy(
          ciphertext.data(),
          reinterpret_cast<const unsigned char *>(messageStr.data()),
          messageStr.size(), nonceBytes.data(), pkBytes.data(),
          skBytes.data()) != 0) {
    throw jsi::JSError(rt, "crypto_box_easy failed");
  }

  std::string encodedCipher = bytesToBase64(ciphertext);
  return jsi::String::createFromUtf8(rt, encodedCipher);
}

// Public-key authenticated decryption
jsi::String RTNCrypto::cryptoBoxOpenEasy(jsi::Runtime &rt,
                                         jsi::String ciphertext,
                                         jsi::String nonce,
                                         jsi::String senderPublicKey,
                                         jsi::String recipientSecretKey) {
  ensureSodiumInit();

  std::string ciphertextStr = ciphertext.utf8(rt);
  std::string nonceStr = nonce.utf8(rt);
  std::string pkStr = senderPublicKey.utf8(rt);
  std::string skStr = recipientSecretKey.utf8(rt);

  auto cipherBytes = base64ToBytes(ciphertextStr);
  auto nonceBytes = base64ToBytes(nonceStr);
  auto pkBytes = base64ToBytes(pkStr);
  auto skBytes = base64ToBytes(skStr);

  validateBufferLength(rt, nonceBytes, crypto_box_NONCEBYTES, "Nonce");
  validateBufferLength(rt, pkBytes, crypto_box_PUBLICKEYBYTES,
                       "Sender public key");
  validateBufferLength(rt, skBytes, crypto_box_SECRETKEYBYTES,
                       "Recipient secret key");

  if (cipherBytes.size() < crypto_box_MACBYTES) {
    throw jsi::JSError(rt, "Ciphertext too short");
  }

  std::vector<uint8_t> decrypted(cipherBytes.size() - crypto_box_MACBYTES);

  if (crypto_box_open_easy(decrypted.data(), cipherBytes.data(),
                           cipherBytes.size(), nonceBytes.data(),
                           pkBytes.data(), skBytes.data()) != 0) {
    throw jsi::JSError(rt, "crypto_box_open_easy failed (verification failed "
                           "or corrupted ciphertext)");
  }

  return jsi::String::createFromUtf8(
      rt, std::string(decrypted.begin(), decrypted.end()));
}

// Convert byte array to base64 string
jsi::String RTNCrypto::toBase64(jsi::Runtime &rt, jsi::Array bytes) {
  ensureSodiumInit();

  size_t length = bytes.size(rt);
  std::vector<uint8_t> data(length);

  for (size_t i = 0; i < length; i++) {
    data[i] = static_cast<uint8_t>(bytes.getValueAtIndex(rt, i).asNumber());
  }

  std::string result = bytesToBase64(data);
  return jsi::String::createFromUtf8(rt, result);
}

// Convert base64 string to byte array
jsi::Array RTNCrypto::fromBase64(jsi::Runtime &rt, jsi::String base64String) {
  ensureSodiumInit();

  std::string encoded = base64String.utf8(rt);
  auto bytes = base64ToBytes(encoded);

  jsi::Array result(rt, bytes.size());
  for (size_t i = 0; i < bytes.size(); i++) {
    result.setValueAtIndex(rt, i, jsi::Value(static_cast<int>(bytes[i])));
  }

  return result;
}

} // namespace facebook::react
