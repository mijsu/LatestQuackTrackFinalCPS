import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ptc.quacktrack',
  appName: 'QuackTrack',
  webDir: 'out',

  // Use the production server URL - this is required for authentication to work!
  // Capacitor will load the app from this URL (WebView approach)
  // This ensures cookies and sessions work properly for NextAuth
  server: {
    url: 'https://quacktrack-dsvr.onrender.com',
    cleartext: true,
  },

  android: {
    backgroundColor: '#0a0a0a',
  },

  ios: {
    backgroundColor: '#0a0a0a',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: true,
      spinnerColor: '#fbbf24',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
      overlay: true,
    },
  },
};

export default config;
