## Environment Variables

This project uses Expo's environment variable system in two different contexts:

1. **Building the app**: Environment variables for building are specified in the `eas.json` file.

Example: to build a preview build, use: eas build --profile preview

2. **EAS Updates**: When updating the app (not building), environment variables are pulled from the Expo EAS service. These are public environment variables configured on the EAS service.

Example: To deploy an update to a preview environment, use: eas update --channel preview --message "MESSAGE" --environment preview

## Local Development

For local backend development, it is recommended to use `pnpm start` to run the app without tunneling. This provides a direct connection to your local backend services.
