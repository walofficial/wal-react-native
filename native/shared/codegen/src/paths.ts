import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Repository root (the Expo app lives here). */
export const REPO_ROOT = path.resolve(here, '../../../..');
/** `native/` root. */
export const NATIVE_ROOT = path.join(REPO_ROOT, 'native');
export const SHARED_ROOT = path.join(NATIVE_ROOT, 'shared');
export const IOS_ROOT = path.join(NATIVE_ROOT, 'ios');
export const ANDROID_ROOT = path.join(NATIVE_ROOT, 'android');

/** React Native generated API surface (input for the reconstructed OpenAPI document). */
export const RN_TYPES_GEN = path.join(REPO_ROOT, 'lib/api/generated/types.gen.ts');
export const RN_SDK_GEN = path.join(REPO_ROOT, 'lib/api/generated/sdk.gen.ts');
export const RN_LOCALES_DIR = path.join(REPO_ROOT, 'locales');

/** Shared, language-neutral artifacts. */
export const OPENAPI_JSON = path.join(SHARED_ROOT, 'api/openapi.json');
export const TOKENS_JSON = path.join(SHARED_ROOT, 'design/tokens.json');
export const ROUTES_JSON = path.join(SHARED_ROOT, 'navigation/routes.json');
export const COMMANDS_JSON = path.join(SHARED_ROOT, 'cli/commands.json');

/** Swift output locations. */
export const SWIFT_API_GENERATED_DIR = path.join(IOS_ROOT, 'WALCore/Sources/WALAPI/Generated');
export const SWIFT_CORE_GENERATED_DIR = path.join(IOS_ROOT, 'WALCore/Sources/WALCore/Generated');
export const SWIFT_CORE_RESOURCES_LOCALES_DIR = path.join(IOS_ROOT, 'WALCore/Sources/WALCore/Resources/Locales');

/** Kotlin output locations (future Android port; generator emits into these). */
export const KOTLIN_API_GENERATED_DIR = path.join(
  ANDROID_ROOT,
  'core/src/main/kotlin/ge/wal/core/api/generated',
);
export const KOTLIN_CORE_GENERATED_DIR = path.join(
  ANDROID_ROOT,
  'core/src/main/kotlin/ge/wal/core/generated',
);
