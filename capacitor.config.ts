import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ptc.quacktrack',
  appName: 'QuackTrack',
  webDir: 'www',
  
  // Standalone app - connects to production server at Render
  server: {
    url: 'https://quacktrack-dsvr.onrender.com',
    cleartext: false,
  },
  
  // Android specific configuration
  android: {
    backgroundColor: '#FFFFFF',
  },
  
  // iOS specific configuration
  ios: {
    backgroundColor: '#FFFFFF',
  },
  
  // Plugins
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FFFFFF',
      showSpinner: true,
      spinnerColor: '#fbbf24',
      splashFullScreen: true,
      splashImmersive: true,
    },
    App: {
      // Handle all URLs internally
      allowNavigationTo: ['*'],
    },
    Browser: {
      // Prevent external links from opening
      windowProperties: {
        toolbar: false,
        location: false,
      },
    },
  },
};

export default config;
