package com.rtncrypto;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.BaseReactPackage;
import java.util.HashMap;
import java.util.Map;

public class CryptoPackage extends BaseReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
      if (name.equals(CryptoModule.NAME)) {
          return new CryptoModule(reactContext);
      } else {
          return null;
      }
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
                          true,  // isCxxModule
                          true   // isTurboModule
          ));
          return moduleInfos;
      };
  }
}

