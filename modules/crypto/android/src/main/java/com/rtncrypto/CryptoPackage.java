package com.rtncrypto;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.TurboReactPackage;
import java.util.HashMap;
import java.util.Map;

public class CryptoPackage extends TurboReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
      if (name.equals(CryptoModule.NAME)) {
          return new CryptoModule(reactContext);
      }
      return null;
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
      return () -> {
          final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
          moduleInfos.put(
                  CryptoModule.NAME,
                  new ReactModuleInfo(
                          CryptoModule.NAME,
                          CryptoModule.NAME,
                          false, // canOverrideExistingModule
                          false, // needsEagerInit
                          false, // isCxxModule - now false since it's a Java module bridging to C++
                          true   // isTurboModule
          ));
          return moduleInfos;
      };
  }
}
