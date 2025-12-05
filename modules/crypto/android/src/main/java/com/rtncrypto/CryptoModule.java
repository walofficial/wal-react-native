package com.rtncrypto;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = CryptoModule.NAME)
public class CryptoModule extends NativeRTNCryptoSpec {
    public static final String NAME = "RTNCrypto";

    static {
        System.loadLibrary("rtncrypto");
    }

    public CryptoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    // Native methods - implemented in C++
    private native byte[] nativeCryptoBoxKeypairPublic();
    private native byte[] nativeCryptoBoxKeypairPrivate();
    private native byte[] nativeRandombytesBuf(int length);
    private native byte[] nativeCryptoBoxEasy(byte[] message, byte[] nonce, byte[] recipientPublicKey, byte[] senderSecretKey);
    private native byte[] nativeCryptoBoxOpenEasy(byte[] ciphertext, byte[] nonce, byte[] senderPublicKey, byte[] recipientSecretKey);

    @Override
    public WritableMap cryptoBoxKeypair() {
        byte[] publicKey = nativeCryptoBoxKeypairPublic();
        byte[] privateKey = nativeCryptoBoxKeypairPrivate();
        
        WritableMap result = Arguments.createMap();
        result.putArray("publicKey", byteArrayToWritableArray(publicKey));
        result.putArray("privateKey", byteArrayToWritableArray(privateKey));
        return result;
    }

    @Override
    public String randombytesBuf(double length) {
        byte[] bytes = nativeRandombytesBuf((int) length);
        return android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP);
    }

    @Override
    public String cryptoBoxEasy(String message, String nonce, String recipientPublicKey, String senderSecretKey) {
        byte[] messageBytes = android.util.Base64.decode(message, android.util.Base64.NO_WRAP);
        byte[] nonceBytes = android.util.Base64.decode(nonce, android.util.Base64.NO_WRAP);
        byte[] recipientPkBytes = android.util.Base64.decode(recipientPublicKey, android.util.Base64.NO_WRAP);
        byte[] senderSkBytes = android.util.Base64.decode(senderSecretKey, android.util.Base64.NO_WRAP);
        
        byte[] ciphertext = nativeCryptoBoxEasy(messageBytes, nonceBytes, recipientPkBytes, senderSkBytes);
        return android.util.Base64.encodeToString(ciphertext, android.util.Base64.NO_WRAP);
    }

    @Override
    public String cryptoBoxOpenEasy(String ciphertext, String nonce, String senderPublicKey, String recipientSecretKey) {
        byte[] ciphertextBytes = android.util.Base64.decode(ciphertext, android.util.Base64.NO_WRAP);
        byte[] nonceBytes = android.util.Base64.decode(nonce, android.util.Base64.NO_WRAP);
        byte[] senderPkBytes = android.util.Base64.decode(senderPublicKey, android.util.Base64.NO_WRAP);
        byte[] recipientSkBytes = android.util.Base64.decode(recipientSecretKey, android.util.Base64.NO_WRAP);
        
        byte[] plaintext = nativeCryptoBoxOpenEasy(ciphertextBytes, nonceBytes, senderPkBytes, recipientSkBytes);
        return android.util.Base64.encodeToString(plaintext, android.util.Base64.NO_WRAP);
    }

    @Override
    public String toBase64(ReadableArray bytes) {
        byte[] byteArray = readableArrayToByteArray(bytes);
        return android.util.Base64.encodeToString(byteArray, android.util.Base64.NO_WRAP);
    }

    @Override
    public WritableArray fromBase64(String base64String) {
        byte[] bytes = android.util.Base64.decode(base64String, android.util.Base64.NO_WRAP);
        return byteArrayToWritableArray(bytes);
    }

    // Helper methods
    private WritableArray byteArrayToWritableArray(byte[] bytes) {
        WritableArray array = Arguments.createArray();
        for (byte b : bytes) {
            array.pushInt(b & 0xFF);
        }
        return array;
    }

    private byte[] readableArrayToByteArray(ReadableArray array) {
        byte[] bytes = new byte[array.size()];
        for (int i = 0; i < array.size(); i++) {
            bytes[i] = (byte) array.getInt(i);
        }
        return bytes;
    }
}
