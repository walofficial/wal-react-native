package com.rtncrypto;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.BaseReactPackage;

@ReactModule(name = CryptoModule.NAME)
public class CryptoModule {
    public static final String NAME = "RTNCrypto";

    static {
        System.loadLibrary("rtncrypto");
    }

    public CryptoModule(ReactApplicationContext context) {
        // Constructor
    }
}

