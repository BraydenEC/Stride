import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * App identity lives here so a rename touches one place.
 * The product name isn't decided yet; "Stride" is a placeholder.
 *
 * Bundle IDs can't be changed after the first store submission, so settle
 * BUNDLE_ID_BASE before Phase 8 (beta).
 */
const APP_NAME = 'Stride';
const SLUG = 'stride-app';
const SCHEME = 'stride';
const BUNDLE_ID_BASE = 'com.braydencredeur.strideapp';
const EAS_PROJECT_ID = '';

// APP_VARIANT=development gives the dev build its own bundle ID and name,
// so it can sit next to a TestFlight/production install on the same phone.
const IS_DEV = process.env.APP_VARIANT === 'development';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_DEV ? `${APP_NAME} (Dev)` : APP_NAME,
  slug: SLUG,
  scheme: IS_DEV ? `${SCHEME}-dev` : SCHEME,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: IS_DEV ? `${BUNDLE_ID_BASE}.dev` : BUNDLE_ID_BASE,
    icon: './assets/expo.icon',
    supportsTablet: false,
  },
  android: {
    package: IS_DEV ? `${BUNDLE_ID_BASE}.dev` : BUNDLE_ID_BASE,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#208AEF',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    'expo-sqlite',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // Paste the ID printed by `npx eas-cli init` here. It isn't a secret.
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
  },
});
