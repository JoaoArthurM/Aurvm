import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.aurvm.app',
  appName: 'Aurvm',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { backgroundColor: '#0C0C10' },
  plugins: {
    GoogleAuth: {
      clientId: (globalThis as any).process?.env?.VITE_GOOGLE_WEB_CLIENT_ID,
      androidClientId: (globalThis as any).process?.env?.VITE_GOOGLE_ANDROID_CLIENT_ID,
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
    },
  },
}

export default config
