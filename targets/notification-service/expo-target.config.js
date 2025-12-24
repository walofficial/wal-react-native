/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'notification-service',
  // Must match the embedded appex name: PlugIns/<name>.appex
  name: 'NotificationServiceExtension',
  displayName: 'NotificationServiceExtension',
  // Match the rest of the project.
  deploymentTarget: '15.1',
  // Uses "<main bundle id>.notification-service"
  bundleIdentifier: '.notification-service',
  // System frameworks used by the Swift implementation.
  frameworks: ['UserNotifications', 'Intents'],
  exportJs: false,
});