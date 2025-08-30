## Environment Variables

This project uses Expo's environment variable system in two different contexts:

1. **Building the app**: Environment variables for building are specified in the `eas.json` file.

Example: to build a preview build, use: eas build --profile preview

2. **EAS Updates**: When updating the app (not building), environment variables are pulled from the Expo EAS service. These are public environment variables configured on the EAS service.

Example: To deploy an update to a preview environment, use: eas update --channel preview --message "MESSAGE" --environment preview

## Local Development

For local backend development, it is recommended to use `pnpm start` to run the app without tunneling. This provides a direct connection to your local backend services.

## Push Notifications

This project uses push notifications for both Android and iOS platforms. The required configuration files are:

- `google-services.json`: Required for Android push notifications (development and production)
- `GoogleService-Info.plist`: Required for iOS push notifications (development and production)

These files should be properly configured for each environment (development and production).

## Web Support

There is experimental support for web using the `npx expo start --web` flag. However, this is not ready for production as we are waiting for server-side rendering support. Currently, Expo only supports static file generation during build time, with SSR support being blocked by Expo's current limitations.

#
