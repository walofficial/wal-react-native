import { isIOS } from './platform';

// TestFlight detection for iOS
// In production, you can detect TestFlight by checking the receipt file
// For now, we'll default to false and you can implement your own detection logic
export const IS_TESTFLIGHT = false;

// Alternative detection methods you could implement:
// 1. Check for sandbox receipt: FileSystem.documentDirectory + '../StoreKit/sandboxReceipt'
// 2. Use a build-time environment variable
// 3. Check the app's distribution method via native modules 