import Foundation
import UserNotifications
import Intents
import os

class NotificationService: UNNotificationServiceExtension {
  var contentHandler: ((UNNotificationContent) -> Void)?
  var bestAttemptContent: UNMutableNotificationContent?
  private let logger = Logger(
    subsystem: Bundle.main.bundleIdentifier ?? "wal.notification-service",
    category: "NotificationServiceExtension"
  )

  private struct CommunicationNotificationPayload {
    let conversationIdentifier: String
    let senderId: String
    let senderDisplayName: String
    let senderAvatarUrl: URL?
  }

  private func extractCommunicationPayload(from userInfo: [AnyHashable: Any]) -> CommunicationNotificationPayload? {
    func string(from dict: [String: Any], key: String) -> String? {
      if let value = dict[key] as? String, !value.isEmpty {
        return value
      }
      return nil
    }

    var data: [String: Any]? = nil
    if let raw = userInfo["data"] as? [String: Any] {
      data = raw
    }

    let dict = data ?? (userInfo as? [String: Any]) ?? [:]

    let roomId = string(from: dict, key: "roomId") ?? string(from: dict, key: "conversationId")
    let senderId = string(from: dict, key: "senderId") ?? string(from: dict, key: "authorId")
    let senderDisplayName = string(from: dict, key: "senderDisplayName") ?? string(from: dict, key: "senderName")
    let senderAvatarUrlString = string(from: dict, key: "senderAvatarUrl")

    guard
      let conversationIdentifier = roomId,
      let senderId = senderId,
      let senderDisplayName = senderDisplayName
    else {
      return nil
    }

    let avatarUrl = senderAvatarUrlString.flatMap { URL(string: $0) }

    return CommunicationNotificationPayload(
      conversationIdentifier: conversationIdentifier,
      senderId: senderId,
      senderDisplayName: senderDisplayName,
      senderAvatarUrl: avatarUrl
    )
  }

  private func extractImageURL(from userInfo: [AnyHashable: Any]) -> URL? {
    let keys = userInfo.keys.map { String(describing: $0) }.sorted().joined(separator: ",")
    logger.info("extractImageURL userInfo keys=[\(keys, privacy: .public)]")
    // Expo pushes typically deliver custom payload under `data` (top-level key in APNS payload).
    if let data = userInfo["data"] as? [String: Any] {
      // Support nested schema: data.richContent.image
      if let richContent = data["richContent"] as? [String: Any],
        let imageUrlString = richContent["image"] as? String,
        let url = URL(string: imageUrlString) {
        logger.info("matched data.richContent.image=\(url.absoluteString, privacy: .public)")
        return url
      }

      if let mediaUrlString = data["mediaUrl"] as? String,
        let url = URL(string: mediaUrlString) {
        logger.info("matched data.mediaUrl=\(url.absoluteString, privacy: .public)")
        return url
      }

      // Optional: support chat-style pushes attaching sender avatar
      if let senderAvatarUrlString = data["senderAvatarUrl"] as? String,
        let url = URL(string: senderAvatarUrlString) {
        logger.info("matched data.senderAvatarUrl=\(url.absoluteString, privacy: .public)")
        return url
      }
    }

    // Some providers may flatten custom keys at top-level.
    // Support nested schema: richContent.image
    if let richContent = userInfo["richContent"] as? [String: Any],
      let imageUrlString = richContent["image"] as? String,
      let url = URL(string: imageUrlString) {
      logger.info("matched richContent.image=\(url.absoluteString, privacy: .public)")
      return url
    }

    if let mediaUrlString = userInfo["mediaUrl"] as? String,
      let url = URL(string: mediaUrlString) {
      logger.info("matched mediaUrl=\(url.absoluteString, privacy: .public)")
      return url
    }
    if let senderAvatarUrlString = userInfo["senderAvatarUrl"] as? String,
      let url = URL(string: senderAvatarUrlString) {
      logger.info("matched senderAvatarUrl=\(url.absoluteString, privacy: .public)")
      return url
    }

    // OneSignal-style rich content: `body._richContent.image`
    if let body = userInfo["body"] as? [String: Any],
      let richContent = body["_richContent"] as? [String: Any],
      let imageUrlString = richContent["image"] as? String,
      let url = URL(string: imageUrlString) {
      logger.info("matched body._richContent.image=\(url.absoluteString, privacy: .public)")
      return url
    }

    return nil
  }

  private func fetchImageData(from url: URL) async -> Data? {
    do {
      let (data, response) = try await URLSession.shared.data(from: url)
      if let http = response as? HTTPURLResponse, http.statusCode >= 400 {
        return nil
      }
      return data
    } catch {
      return nil
    }
  }

  @available(iOS 15.0, *)
  private func buildCommunicationIntent(
    payload: CommunicationNotificationPayload,
    messageText: String,
    avatarImageData: Data?
  ) -> INSendMessageIntent {
    let handle = INPersonHandle(value: payload.senderId, type: .unknown)
    let avatar = avatarImageData.map { INImage(imageData: $0) }

    let sender = INPerson(
      personHandle: handle,
      nameComponents: nil,
      displayName: payload.senderDisplayName,
      image: avatar,
      contactIdentifier: nil,
      customIdentifier: payload.senderId
    )

    // Incoming message: don't include current user as recipient.
    return INSendMessageIntent(
      recipients: nil,
      outgoingMessageType: .outgoingMessageText,
      content: messageText,
      speakableGroupName: nil,
      conversationIdentifier: payload.conversationIdentifier,
      serviceName: nil,
      sender: sender,
      attachments: nil
    )
  }

  override func didReceive(
    _ request: UNNotificationRequest,
    withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
  ) {
    self.contentHandler = contentHandler
    bestAttemptContent =
      (request.content.mutableCopy() as? UNMutableNotificationContent)

    guard let bestAttemptContent = bestAttemptContent else {
      return
    }

    let userInfo = request.content.userInfo
    logger.info("didReceive requestIdentifier=\(request.identifier, privacy: .public)")
    let imageUrl = extractImageURL(from: userInfo)

    // Best-effort "Communication Notification" upgrade (WhatsApp-style avatar).
    // Requires app target capability "Communication Notifications" and NSUserActivityTypes including INSendMessageIntent.
    if #available(iOS 15.0, *), let commPayload = extractCommunicationPayload(from: userInfo) {
      Task {
        let messageText = bestAttemptContent.body
        var avatarData: Data? = nil
        if let avatarUrl = commPayload.senderAvatarUrl {
          avatarData = await fetchImageData(from: avatarUrl)
        }

        let intent = buildCommunicationIntent(
          payload: commPayload,
          messageText: messageText,
          avatarImageData: avatarData
        )

        let interaction = INInteraction(intent: intent, response: nil)
        interaction.direction = .incoming

        do {
          try await interaction.donate()

          let updatedContent = try request.content.updating(from: intent)
          let updatedMutable =
            (updatedContent.mutableCopy() as? UNMutableNotificationContent) ?? bestAttemptContent

          logger.info("communication notification updated conversation=\(commPayload.conversationIdentifier, privacy: .public)")

          if let imageUrl = imageUrl {
            downloadAndAttachImage(url: imageUrl, to: updatedMutable) { content in
              contentHandler(content)
            }
            return
          }

          contentHandler(updatedMutable)
        } catch {
          logger.error("communication notification failed error=\(error.localizedDescription, privacy: .public)")
          // Fallback to standard behavior below.
          if let imageUrl = imageUrl {
            downloadAndAttachImage(url: imageUrl, to: bestAttemptContent) { content in
              contentHandler(content)
            }
            return
          }
          contentHandler(bestAttemptContent)
        }
      }

      return
    }

    // Standard rich push attachment behavior.
    if let imageUrl = imageUrl {
      downloadAndAttachImage(url: imageUrl, to: bestAttemptContent) { content in
        contentHandler(content)
      }
      return
    }

    contentHandler(bestAttemptContent)
  }

  private func downloadAndAttachImage(
    url: URL,
    to content: UNMutableNotificationContent,
    completion: @escaping (UNNotificationContent) -> Void
  ) {
    logger.info("downloading attachment url=\(url.absoluteString, privacy: .public)")
    let task = URLSession.shared.downloadTask(with: url) { temporaryFileLocation, _, error in
      guard let temporaryFileLocation = temporaryFileLocation else {
        if let error = error {
          self.logger.error("download failed error=\(error.localizedDescription, privacy: .public)")
        } else {
          self.logger.error("download failed (no temp file, no error)")
        }
        completion(content)
        return
      }

      let fileManager = FileManager.default
      let tempDirectory = URL(fileURLWithPath: NSTemporaryDirectory())
      let targetFileName = temporaryFileLocation.lastPathComponent + ".jpg"
      let targetUrl = tempDirectory.appendingPathComponent(targetFileName)

      try? fileManager.removeItem(at: targetUrl)

      do {
        try fileManager.moveItem(at: temporaryFileLocation, to: targetUrl)

        let attachment = try UNNotificationAttachment(
          identifier: "image",
          url: targetUrl,
          options: nil
        )

        content.attachments = [attachment]
      } catch {
        self.logger.error("attachment processing error=\(error.localizedDescription, privacy: .public)")
      }

      completion(content)
    }

    task.resume()
  }

  override func serviceExtensionTimeWillExpire() {
    // Called just before the extension will be terminated by the system.
    // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
    if let contentHandler = contentHandler,
      let bestAttemptContent = bestAttemptContent {
      contentHandler(bestAttemptContent)
    }
  }
}