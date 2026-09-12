@_exported import WALAPI
@_exported import WALCrypto

/// Version of the headless core. Bumped per checkpoint so walctl and the app can assert compatibility.
public enum WALCoreInfo {
    public static let version = "0.1.0"
    public static let checkpoint = "CP0"
}
