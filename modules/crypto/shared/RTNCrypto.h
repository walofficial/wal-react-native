#pragma once

#include <RTNCryptoSpecJSI.h>
#include <memory>
#include <string>

namespace facebook::react {

class RTNCrypto : public NativeRTNCryptoCxxSpec<RTNCrypto> {
public:
  RTNCrypto(std::shared_ptr<CallInvoker> jsInvoker);
  
  jsi::Object generateKeyPair(jsi::Runtime& rt);
  jsi::String randomBytes(jsi::Runtime& rt, double length);
  jsi::String generateSecretKey(jsi::Runtime& rt);
  jsi::String secretBoxSeal(jsi::Runtime& rt,
                            jsi::String message,
                            jsi::String nonce,
                            jsi::String secretKey);
  jsi::String secretBoxOpen(jsi::Runtime& rt,
                            jsi::String encryptedMessage,
                            jsi::String nonce,
                            jsi::String secretKey);
};

} // namespace facebook::react

