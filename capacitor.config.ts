import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.arrowagain.game',
  appName: 'Arrow Again',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#DDF3EC'
    }
  }
};

export default config;
