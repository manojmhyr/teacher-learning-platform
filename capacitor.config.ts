import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor packages the same web build as iOS and Android apps.
 *
 * Run `npm run cap:add:android` / `cap:add:ios` once to generate the native
 * projects, then `npm run cap:sync` after each web build.
 *
 * Android capture blocking: after adding the Android platform, set
 * FLAG_SECURE in MainActivity — see docs/SECURITY.md. The privacy-screen
 * plugin does this for you, and the manual flag is the belt-and-braces option.
 */
const config: CapacitorConfig = {
  appId: 'edu.lumenacademy.teacherportal',
  appName: 'Teacher Portal',
  webDir: 'dist',

  server: {
    // https on Android so the webview origin is a secure context.
    androidScheme: 'https',
  },

  android: {
    // Blocks the webview from being captured by other apps.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true,
  },

  plugins: {
    PrivacyScreen: {
      enable: true,
      imageName: 'Splash',
      preventScreenshots: true,
    },
  },
};

export default config;
