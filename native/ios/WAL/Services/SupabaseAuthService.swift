import Foundation
import WALCore

#if canImport(Auth)
import Auth
import Supabase
#endif

/// Live OTP via supabase-swift Auth. Absent credentials keep the mock `walctl` path.
final class SupabaseAuthService {
    static let shared: SupabaseAuthService? = {
        guard let url = AppEnvironment.supabaseURL, !AppEnvironment.supabaseAnonKey.isEmpty else { return nil }
        return SupabaseAuthService(url: url, anonKey: AppEnvironment.supabaseAnonKey)
    }()

    private let url: URL
    private let anonKey: String

    init(url: URL, anonKey: String) {
        self.url = url
        self.anonKey = anonKey
    }

    func sendOTP(phone: String) async throws {
        #if canImport(Auth)
        let client = SupabaseClient(supabaseURL: url, supabaseKey: anonKey)
        try await client.auth.signInWithOTP(phone: phone)
        #else
        throw AuthServiceError.unavailable
        #endif
    }

    func verifyOTP(phone: String, token: String) async throws -> SessionRecord {
        #if canImport(Auth)
        let client = SupabaseClient(supabaseURL: url, supabaseKey: anonKey)
        let session = try await client.auth.verifyOTP(phone: phone, token: token, type: .sms)
        return SessionRecord(
            accessToken: session.accessToken,
            refreshToken: session.refreshToken,
            userId: session.user.id.uuidString,
            phone: session.user.phone,
            expiresAt: session.expiresAt
        )
        #else
        throw AuthServiceError.unavailable
        #endif
    }
}

enum AuthServiceError: Error { case unavailable }
