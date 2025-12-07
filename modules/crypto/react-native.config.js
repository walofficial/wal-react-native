module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.rtncrypto.CryptoPackage;',
        packageInstance: 'new CryptoPackage()',
      },
      ios: {},
    },
  },
};

