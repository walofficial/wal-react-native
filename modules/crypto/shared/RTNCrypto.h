#pragma once

#include <RTNCryptoSpecJSI.h>
#include <memory>
#include <string>

namespace facebook::react {

class RTNCrypto : public NativeRTNCryptoCxxSpec<RTNCrypto> {
public:
  RTNCrypto(std::shared_ptr<CallInvoker> jsInvoker);
  
  // Key pair generation for crypto_box (public-key cryptography)
  jsi::Object cryptoBoxKeypair(jsi::Runtime& rt);
  
  // Random bytes generation
  jsi::String randombytesBuf(jsi::Runtime& rt, double length);
  
  // Public-key authenticated encryption (crypto_box)
  jsi::String cryptoBoxEasy(jsi::Runtime& rt,
                            jsi::String message,
                            jsi::String nonce,
                            jsi::String recipientPublicKey,
                            jsi::String senderSecretKey);
  
  // Public-key authenticated decryption (crypto_box_open)
  jsi::String cryptoBoxOpenEasy(jsi::Runtime& rt,
                                jsi::String ciphertext,
                                jsi::String nonce,
                                jsi::String senderPublicKey,
                                jsi::String recipientSecretKey);
  
  // Base64 encoding/decoding
  jsi::String toBase64(jsi::Runtime& rt, jsi::Array bytes);
  jsi::Array fromBase64(jsi::Runtime& rt, jsi::String base64String);
  
  // Constants
  double getCryptoBoxPublickeybytes(jsi::Runtime& rt);
  double getCryptoBoxSecretkeybytes(jsi::Runtime& rt);
  double getCryptoBoxNoncebytes(jsi::Runtime& rt);
  double getCryptoBoxMacbytes(jsi::Runtime& rt);
};

} // namespace facebook::react
