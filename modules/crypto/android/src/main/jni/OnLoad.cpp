#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <autolinking.h>
#include <fbjni/fbjni.h>
#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#include <rncore.h>

// Include the RTNCrypto header
#include <RTNCrypto.h>

namespace facebook::react {

std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  
  // This code registers the module so that when the JS side asks for it, the app can return it
  if (name == "RTNCrypto") {
    return std::make_shared<RTNCrypto>(jsInvoker);
  }

  // And we fallback to the CXX module providers autolinked
  return autolinking_cxxModuleProvider(name, jsInvoker);
}

std::shared_ptr<TurboModule> javaModuleProvider(
    const std::string& name,
    const JavaTurboModule::InitParams& params) {
  return autolinking_ModuleProvider(name, params);
}

} // namespace facebook::react

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::
        cxxModuleProvider = &facebook::react::cxxModuleProvider;
    facebook::react::DefaultTurboModuleManagerDelegate::
        javaModuleProvider = &facebook::react::javaModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint = &facebook::react::rncore_registerComponentDescriptorsFromEntryPoint;
  });
}







