import type { CapacitorConfig } from '@capacitor/cli'
import { loadEnv } from 'vite'

const env=loadEnv('',(globalThis as any).process?.cwd?.()??'.','VITE_')

const config: CapacitorConfig = {
  appId: 'com.aurvm.app',
  appName: 'Aurvm',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { backgroundColor: '#F7F4F1' },
  plugins: {
    GoogleAuth: {
      clientId: env.VITE_GOOGLE_WEB_CLIENT_ID,
      androidClientId: env.VITE_GOOGLE_ANDROID_CLIENT_ID,
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
    },
  },
}

export default config
