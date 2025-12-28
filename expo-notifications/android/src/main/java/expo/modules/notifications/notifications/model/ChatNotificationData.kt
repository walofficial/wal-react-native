package expo.modules.notifications.notifications.model

import android.net.Uri
import org.json.JSONObject

/**
 * Data class representing chat/messaging notification payload.
 * Parses sender info, avatar, conversation ID etc. from the push notification data.
 *
 * The data can come in multiple formats:
 * - `data.body.*` (Expo custom payload wrapper)
 * - `data.*` (flat data payload)
 * - Top-level `*` (very flat)
 */
class ChatNotificationData(private val data: Map<String, String>) {

  private val bodyJson: JSONObject? by lazy {
    try {
      data["body"]?.let { JSONObject(it) }
    } catch (e: Exception) {
      null
    }
  }

  /**
   * Whether this notification should be rendered as a MessagingStyle notification
   */
  val isMessagingStyle: Boolean
    get() = type == "new_message" || type == "chat" || (senderId != null && roomId != null)

  val type: String?
    get() = getStringValue("type")

  val roomId: String?
    get() = getStringValue("roomId") ?: getStringValue("conversationId")

  val conversationId: String?
    get() = getStringValue("conversationId") ?: roomId

  val senderId: String?
    get() = getStringValue("senderId") ?: getStringValue("authorId")

  val senderDisplayName: String?
    get() = getStringValue("senderDisplayName") ?: getStringValue("senderName")

  val senderAvatarUrl: Uri?
    get() = getStringValue("senderAvatarUrl")?.let { Uri.parse(it) }

  val messageText: String?
    get() = getStringValue("message") ?: data["message"]

  val accentColor: String?
    get() = getStringValue("accentColor") ?: data["color"]

  val enableInlineReply: Boolean
    get() = getStringValue("enableInlineReply")?.toBooleanStrictOrNull() ?: true

  /**
   * Whether to show any actions (reply, mark as read) on the notification.
   * Set to false for communication notifications where user shouldn't take action.
   * Defaults to true.
   */
  val enableActions: Boolean
    get() = getStringValue("enableActions")?.toBooleanStrictOrNull() ?: true

  val isGroupConversation: Boolean
    get() = getStringValue("isGroup")?.toBooleanStrictOrNull() ?: false

  val groupName: String?
    get() = getStringValue("groupName") ?: getStringValue("conversationTitle")

  val timestamp: Long
    get() = getStringValue("timestamp")?.toLongOrNull() ?: System.currentTimeMillis()

  /**
   * Gets a string value from the notification data, checking body JSON first, then flat data.
   */
  private fun getStringValue(key: String): String? {
    // Try body JSON first (nested Expo payload)
    bodyJson?.optString(key)?.takeIf { it.isNotBlank() }?.let { return it }
    
    // Try flat data
    return data[key]?.takeIf { it.isNotBlank() }
  }

  companion object {
    /**
     * Creates ChatNotificationData from a RemoteMessage data map
     */
    fun fromRemoteMessageData(data: Map<String, String>): ChatNotificationData {
      return ChatNotificationData(data)
    }
  }
}

