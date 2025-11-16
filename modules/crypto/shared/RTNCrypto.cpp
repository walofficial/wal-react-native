#include "RTNCrypto.h"
#include "TweetNaClSecretbox.h"
#include <sstream>
#include <iomanip>
#include <vector>
#include <cstring>
#include <stdexcept>
#include <fstream>
#if defined(__APPLE__)
#include <Security/SecRandom.h>
#endif
#include <random>

namespace facebook::react {

RTNCrypto::RTNCrypto(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeRTNCryptoCxxSpec(std::move(jsInvoker)) {}

static std::vector<uint8_t> secureRandomBytes(size_t length) {
  std::vector<uint8_t> bytes(length);
#if defined(__APPLE__)
  if (SecRandomCopyBytes(kSecRandomDefault, length, bytes.data()) != errSecSuccess) {
    throw std::runtime_error("Failed to generate secure random bytes");
  }
  return bytes;
#else
  std::ifstream urandom("/dev/urandom", std::ios::in | std::ios::binary);
  if (urandom.good()) {
    urandom.read(reinterpret_cast<char*>(bytes.data()), static_cast<std::streamsize>(length));
    if (urandom.gcount() == static_cast<std::streamsize>(length)) {
      return bytes;
    }
  }
  std::random_device rd;
  for (size_t i = 0; i < length; ++i) {
    bytes[i] = static_cast<uint8_t>(rd());
  }
  return bytes;
#endif
}

// Helper function to convert bytes to base64
static std::string toBase64(const std::vector<uint8_t>& bytes) {
  static const char* base64_chars = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";
  
  std::string result;
  int i = 0;
  int j = 0;
  uint8_t char_array_3[3];
  uint8_t char_array_4[4];
  size_t in_len = bytes.size();
  const uint8_t* bytes_to_encode = bytes.data();

  while (in_len--) {
    char_array_3[i++] = *(bytes_to_encode++);
    if (i == 3) {
      char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
      char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
      char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
      char_array_4[3] = char_array_3[2] & 0x3f;

      for(i = 0; (i <4) ; i++)
        result += base64_chars[char_array_4[i]];
      i = 0;
    }
  }

  if (i) {
    for(j = i; j < 3; j++)
      char_array_3[j] = '\0';

    char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
    char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
    char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);

    for (j = 0; (j < i + 1); j++)
      result += base64_chars[char_array_4[j]];

    while((i++ < 3))
      result += '=';
  }

  return result;
}

// Helper function to convert base64 to bytes
static std::vector<uint8_t> fromBase64(const std::string& encoded_string) {
  static const std::string base64_chars = 
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789+/";

  size_t in_len = encoded_string.size();
  int i = 0;
  int j = 0;
  int in_ = 0;
  uint8_t char_array_4[4], char_array_3[3];
  std::vector<uint8_t> result;

  while (in_len-- && ( encoded_string[in_] != '=') && 
         (isalnum(encoded_string[in_]) || (encoded_string[in_] == '+') || (encoded_string[in_] == '/'))) {
    char_array_4[i++] = encoded_string[in_]; in_++;
    if (i ==4) {
      for (i = 0; i <4; i++)
        char_array_4[i] = base64_chars.find(char_array_4[i]);

      char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
      char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);
      char_array_3[2] = ((char_array_4[2] & 0x3) << 6) + char_array_4[3];

      for (i = 0; (i < 3); i++)
        result.push_back(char_array_3[i]);
      i = 0;
    }
  }

  if (i) {
    for (j = i; j <4; j++)
      char_array_4[j] = 0;

    for (j = 0; j <4; j++)
      char_array_4[j] = base64_chars.find(char_array_4[j]);

    char_array_3[0] = (char_array_4[0] << 2) + ((char_array_4[1] & 0x30) >> 4);
    char_array_3[1] = ((char_array_4[1] & 0xf) << 4) + ((char_array_4[2] & 0x3c) >> 2);

    for (j = 0; (j < i - 1); j++) result.push_back(char_array_3[j]);
  }

  return result;
}

jsi::Object RTNCrypto::generateKeyPair(jsi::Runtime& rt) {
  auto publicKeyBytes = secureRandomBytes(32);
  auto privateKeyBytes = secureRandomBytes(32);
  
  std::string publicKey = toBase64(publicKeyBytes);
  std::string privateKey = toBase64(privateKeyBytes);
  
  // Create JSI object with publicKey and privateKey
  jsi::Object result(rt);
  result.setProperty(rt, "publicKey", jsi::String::createFromUtf8(rt, publicKey));
  result.setProperty(rt, "privateKey", jsi::String::createFromUtf8(rt, privateKey));
  
  return result;
}

jsi::String RTNCrypto::randomBytes(jsi::Runtime& rt, double length) {
  int byteLength = static_cast<int>(length);
  if (byteLength <= 0) {
    return jsi::String::createFromUtf8(rt, "");
  }
  auto bytes = secureRandomBytes(static_cast<size_t>(byteLength));
  std::string result = toBase64(bytes);
  return jsi::String::createFromUtf8(rt, result);
}

jsi::String RTNCrypto::generateSecretKey(jsi::Runtime& rt) {
  auto keyBytes = secureRandomBytes(tweetnacl::SECRETBOX_KEY_BYTES);
  std::string result = toBase64(keyBytes);
  return jsi::String::createFromUtf8(rt, result);
}

static void validateBufferLength(jsi::Runtime& rt,
                                 const std::vector<uint8_t>& data,
                                 size_t expected,
                                 const std::string& label) {
  if (data.size() != expected) {
    std::stringstream ss;
    ss << label << " must be " << expected << " bytes.";
    throw jsi::JSError(rt, ss.str());
  }
}

jsi::String RTNCrypto::secretBoxSeal(jsi::Runtime& rt,
                                     jsi::String message,
                                     jsi::String nonce,
                                     jsi::String secretKey) {
  std::string messageStr = message.utf8(rt);
  std::string nonceStr = nonce.utf8(rt);
  std::string secretKeyStr = secretKey.utf8(rt);

  auto nonceBytes = fromBase64(nonceStr);
  auto keyBytes = fromBase64(secretKeyStr);

  validateBufferLength(rt, nonceBytes, tweetnacl::SECRETBOX_NONCE_BYTES, "Nonce");
  validateBufferLength(rt, keyBytes, tweetnacl::SECRETBOX_KEY_BYTES, "Secret key");

  std::vector<uint8_t> cipher(messageStr.size() + tweetnacl::SECRETBOX_MAC_BYTES);
  int result = tweetnacl::crypto_secretbox_easy(
      cipher.data(),
      reinterpret_cast<const uint8_t*>(messageStr.data()),
      static_cast<unsigned long long>(messageStr.size()),
      nonceBytes.data(),
      keyBytes.data());

  if (result != 0) {
    throw jsi::JSError(rt, "Failed to seal message.");
  }

  std::string encodedCipher = toBase64(cipher);
  return jsi::String::createFromUtf8(rt, encodedCipher);
}

jsi::String RTNCrypto::secretBoxOpen(jsi::Runtime& rt,
                                     jsi::String encryptedMessage,
                                     jsi::String nonce,
                                     jsi::String secretKey) {
  std::string encryptedMessageStr = encryptedMessage.utf8(rt);
  std::string nonceStr = nonce.utf8(rt);
  std::string secretKeyStr = secretKey.utf8(rt);

  auto encryptedBytes = fromBase64(encryptedMessageStr);
  auto nonceBytes = fromBase64(nonceStr);
  auto keyBytes = fromBase64(secretKeyStr);

  validateBufferLength(rt, nonceBytes, tweetnacl::SECRETBOX_NONCE_BYTES, "Nonce");
  validateBufferLength(rt, keyBytes, tweetnacl::SECRETBOX_KEY_BYTES, "Secret key");

  if (encryptedBytes.size() < tweetnacl::SECRETBOX_MAC_BYTES) {
    throw jsi::JSError(rt, "Encrypted message is too short.");
  }

  std::vector<uint8_t> plaintext(encryptedBytes.size() - tweetnacl::SECRETBOX_MAC_BYTES);
  int result = tweetnacl::crypto_secretbox_open_easy(
      plaintext.data(),
      encryptedBytes.data(),
      static_cast<unsigned long long>(encryptedBytes.size()),
      nonceBytes.data(),
      keyBytes.data());

  if (result != 0) {
    throw jsi::JSError(rt, "Failed to open message. The ciphertext may be corrupted or the key is invalid.");
  }

  std::string decodedMessage(plaintext.begin(), plaintext.end());
  return jsi::String::createFromUtf8(rt, decodedMessage);
}

} // namespace facebook::react

