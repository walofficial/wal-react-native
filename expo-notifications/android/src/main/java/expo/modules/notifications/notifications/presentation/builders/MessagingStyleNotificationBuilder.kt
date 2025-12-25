package expo.modules.notifications.notifications.presentation.builders

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import androidx.core.app.RemoteInput
import androidx.core.graphics.drawable.IconCompat
import expo.modules.notifications.notifications.model.ChatNotificationData
import expo.modules.notifications.notifications.model.NotificationAction
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.notifications.model.RemoteNotificationContent
import expo.modules.notifications.notifications.model.TextInputNotificationAction
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.NotificationsService.Companion.createNotificationResponseIntent
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore

/**
 * Notification builder for Signal-style MessagingStyle notifications.
 * 
 * Uses NotificationCompat.MessagingStyle to display chat-like notifications with:
 * - Sender avatar
 * - Sender name
 * - Message content
 * - Conversation grouping
 * - Inline reply action
 */
class MessagingStyleNotificationBuilder(
  context: Context,
  notification: expo.modules.notifications.notifications.model.Notification,
  store: SharedPreferencesNotificationCategoriesStore,
  private val chatData: ChatNotificationData
) : ExpoNotificationBuilder(context, notification, store) {

  companion object {
    const val CHAT_CHANNEL_ID = "expo_notifications_chat_channel"
    const val CHAT_CHANNEL_NAME = "Chat Messages"
    const val REPLY_ACTION_ID = "expo.notifications.REPLY_ACTION"
    const val MARK_READ_ACTION_ID = "expo.notifications.MARK_READ_ACTION"
    
    private const val TAG = "MessagingStyleBuilder"

    /**
     * Checks if a notification should use MessagingStyle rendering
     */
    fun shouldUseMessagingStyle(content: RemoteNotificationContent): Boolean {
      return content.chatNotificationData.isMessagingStyle
    }

    /**
     * Creates or updates the chat notification channel
     */
    @RequiresApi(Build.VERSION_CODES.O)
    fun ensureChatChannelExists(context: Context) {
      val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      
      if (notificationManager.getNotificationChannel(CHAT_CHANNEL_ID) == null) {
        val channel = NotificationChannel(
          CHAT_CHANNEL_ID,
          CHAT_CHANNEL_NAME,
          NotificationManager.IMPORTANCE_HIGH
        ).apply {
          description = "Notifications for chat messages"
          setShowBadge(true)
          enableVibration(true)
          enableLights(true)
          lightColor = Color.BLUE
          lockscreenVisibility = Notification.VISIBILITY_PRIVATE
        }
        notificationManager.createNotificationChannel(channel)
      }
    }
  }

  override suspend fun build(): Notification {
    // Ensure chat channel exists on Android O+
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      ensureChatChannelExists(context)
    }

    val builder = createMessagingStyleBuilder()
    return builder.build()
  }

  private suspend fun createMessagingStyleBuilder(): NotificationCompat.Builder {
    val builder = NotificationCompat.Builder(context, CHAT_CHANNEL_ID)

    // Basic notification properties
    builder.setSmallIcon(icon)
    builder.setPriority(NotificationCompat.PRIORITY_HIGH)
    builder.setCategory(NotificationCompat.CATEGORY_MESSAGE)
    builder.setAutoCancel(true)

    // Set accent color
    chatData.accentColor?.let { colorString ->
      try {
        builder.color = Color.parseColor(colorString)
      } catch (e: Exception) {
        Log.w(TAG, "Invalid accent color: $colorString")
      }
    }

    // Download sender avatar
    val senderAvatar = downloadSenderAvatar()

    // Create the sender Person
    val sender = createSenderPerson(senderAvatar)

    // Create "You" person for the current user (needed for MessagingStyle)
    val self = Person.Builder()
      .setName("You")
      .setKey("self")
      .build()

    // Build the MessagingStyle
    val messagingStyle = NotificationCompat.MessagingStyle(self)
      .setConversationTitle(getConversationTitle())
      .setGroupConversation(chatData.isGroupConversation)

    // Add the message
    val messageText = notificationContent.text ?: chatData.messageText ?: ""
    val message = NotificationCompat.MessagingStyle.Message(
      messageText,
      chatData.timestamp,
      sender
    )
    messagingStyle.addMessage(message)

    builder.setStyle(messagingStyle)

    // Set shortcut ID for conversation (enables bubbles on Android 11+)
    chatData.conversationId?.let { conversationId ->
      builder.setShortcutId(conversationId)
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        builder.setLocusId(androidx.core.content.LocusIdCompat(conversationId))
      }
    }

    // Add inline reply action
    if (chatData.enableInlineReply) {
      addInlineReplyAction(builder)
    }

    // Add mark as read action
    addMarkAsReadAction(builder)

    // Set content intent (tap action)
    val defaultAction = NotificationAction(NotificationResponse.DEFAULT_ACTION_IDENTIFIER, null, true)
    builder.setContentIntent(
      createNotificationResponseIntent(context, notification, defaultAction)
    )

    // Add notification request to extras for later retrieval
    val requestExtras = Bundle()
    requestExtras.putByteArray(
      EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY,
      marshallNotificationRequest(notification.notificationRequest)
    )
    builder.addExtras(requestExtras)

    // Add body data to extras
    notificationContent.body?.let { body ->
      val extras = builder.extras
      extras.putString(EXTRAS_BODY_KEY, body.toString())
      builder.setExtras(extras)
    }

    return builder
  }

  private suspend fun downloadSenderAvatar(): Bitmap? {
    return chatData.senderAvatarUrl?.let { uri ->
      try {
        downloadImage(uri)
      } catch (e: Exception) {
        Log.w(TAG, "Failed to download sender avatar: ${e.message}")
        null
      }
    }
  }

  private fun createSenderPerson(avatar: Bitmap?): Person {
    return Person.Builder()
      .setName(chatData.senderDisplayName ?: notificationContent.title ?: "Unknown")
      .setKey(chatData.senderId ?: "unknown_sender")
      .apply {
        avatar?.let { 
          setIcon(IconCompat.createWithBitmap(it))
        }
      }
      .build()
  }

  private fun getConversationTitle(): String? {
    // For group conversations, show the group name
    // For 1:1 conversations, return null (MessagingStyle uses sender name)
    return if (chatData.isGroupConversation) {
      chatData.groupName ?: chatData.senderDisplayName
    } else {
      null
    }
  }

  private fun addInlineReplyAction(builder: NotificationCompat.Builder) {
    // Create the RemoteInput for inline reply
    val remoteInput = RemoteInput.Builder(NotificationsService.USER_TEXT_RESPONSE_KEY)
      .setLabel("Reply")
      .build()

    // Create a TextInputNotificationAction for the reply
    val replyAction = TextInputNotificationAction(
      REPLY_ACTION_ID,
      "Reply",
      false, // Don't open app to foreground for inline reply
      "Type a message..."
    )

    val replyPendingIntent = createNotificationResponseIntent(
      context,
      notification,
      replyAction
    )

    val action = NotificationCompat.Action.Builder(
      0, // No icon - modern text-only action style
      "Reply",
      replyPendingIntent
    )
      .addRemoteInput(remoteInput)
      .setAllowGeneratedReplies(true)
      .setSemanticAction(NotificationCompat.Action.SEMANTIC_ACTION_REPLY)
      .setShowsUserInterface(false)
      .build()

    builder.addAction(action)
  }

  private fun addMarkAsReadAction(builder: NotificationCompat.Builder) {
    val markReadAction = NotificationAction(
      MARK_READ_ACTION_ID,
      "Mark as Read",
      false // Don't open app to foreground
    )

    val markReadPendingIntent = createNotificationResponseIntent(
      context,
      notification,
      markReadAction
    )

    val action = NotificationCompat.Action.Builder(
      0, // No icon - modern text-only action style
      "Mark as Read",
      markReadPendingIntent
    )
      .setSemanticAction(NotificationCompat.Action.SEMANTIC_ACTION_MARK_AS_READ)
      .setShowsUserInterface(false)
      .build()

    builder.addAction(action)
  }
}

