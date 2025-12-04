// RTNCrypto Library JNI Entry Point
// This library provides JNI bindings for libsodium crypto operations

#include <fbjni/fbjni.h>
#include <jni.h>

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    // JNI initialization complete
    // The native methods in CryptoModuleJNI.cpp are automatically registered
  });
}
