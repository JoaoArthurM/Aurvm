import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { Capacitor } from '@capacitor/core'
import type { FinancasData } from '../lib/types'
import { isFinancasData, type BackupRecord } from './local-backup'

const FILE_NAME = 'financas.json'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const WEB_SCOPES = ['openid', 'email', 'profile', DRIVE_SCOPE].join(' ')
let accessToken: string | null = null
let fileId: string | null = null
let webScriptPromise: Promise<void> | null = null

type WebTokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type WebTokenClient = {
  requestAccessToken: (overrideConfig?: { prompt?: '' | 'select_account' }) => void
}

type GoogleIdentityServices = {
  accounts: {
    oauth2: {
      initTokenClient: (options: {
        client_id: string
        scope: string
        callback: (response: WebTokenResponse) => void
        error_callback?: (error: { type?: string }) => void
      }) => WebTokenClient
      revoke?: (token: string, callback: () => void) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityServices
  }
}

const isNative = () => Capacitor.isNativePlatform()

function webClientId() {
  const clientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID
  if (!clientId || clientId.startsWith('seu-client-id')) {
    throw new Error('Configure VITE_GOOGLE_WEB_CLIENT_ID para ativar o Google Login.')
  }
  return clientId
}

async function loadWebGoogle() {
  if (window.google?.accounts?.oauth2) return
  webScriptPromise ??= new Promise<void>((resolve, reject) => {
    const existing = document.getElementById('google-identity-services') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Nao foi possivel carregar o login do Google.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.id = 'google-identity-services'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Nao foi possivel carregar o login do Google.'))
    document.head.appendChild(script)
  })
  await webScriptPromise
  if (!window.google?.accounts?.oauth2) throw new Error('O login do Google nao ficou disponivel no navegador.')
}

async function requestWebAccessToken(prompt: '' | 'select_account') {
  await loadWebGoogle()
  const clientId = webClientId()
  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: WEB_SCOPES,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Nao foi possivel entrar com o Google.'))
          return
        }
        resolve(response.access_token)
      },
      error_callback: (error) => reject(new Error(error.type || 'Nao foi possivel abrir o login do Google.')),
    })
    tokenClient.requestAccessToken({ prompt })
  })
}

async function fetchGoogleProfile(token: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Nao foi possivel carregar os dados da conta Google.')
  const profile = await response.json() as { name?: string; email?: string }
  return { name: profile.name ?? profile.email ?? 'Google', email: profile.email ?? '' }
}

export const driveService = {
  async initialize() {
    const clientId=import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID
    if(!clientId||clientId.startsWith('seu-client-id'))throw new Error('Configure VITE_GOOGLE_WEB_CLIENT_ID para ativar o Google Login.')
    if (!isNative()) {
      await loadWebGoogle()
      return true
    }
    await GoogleAuth.initialize({ clientId, scopes: ['profile','email',DRIVE_SCOPE], grantOfflineAccess: false })
    return true
  },

  async signIn() {
    if (!isNative()) {
      const token = await requestWebAccessToken('select_account')
      const profile = await fetchGoogleProfile(token)
      accessToken = token
      return profile
    }
    const user = await GoogleAuth.signIn()
    accessToken = user.authentication.accessToken
    return { name: user.name ?? user.email, email: user.email }
  },

  async restoreSession() {
    try {
      await this.initialize()
      if (!isNative()) {
        const token = await requestWebAccessToken('')
        await fetchGoogleProfile(token)
        accessToken = token
        return true
      }
      const authentication = await GoogleAuth.refresh()
      accessToken = authentication.accessToken
      return true
    } catch { return false }
  },

  async signOut() {
    if (isNative()) await GoogleAuth.signOut()
    else if (accessToken && window.google?.accounts?.oauth2.revoke) {
      await new Promise<void>(resolve => window.google!.accounts.oauth2.revoke!(accessToken!, resolve))
    }
    accessToken = null
    fileId = null
  },

  get connected() { return Boolean(accessToken) },

  async read(): Promise<BackupRecord | null> {
    if (!accessToken) return null
    fileId = await findFile()
    if (!fileId) return null
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: authHeaders() })
    if (!response.ok) throw new Error('Não foi possível ler financas.json')
    const payload=await response.json() as FinancasData|BackupRecord
    if('data' in payload&&typeof payload.updatedAt==='number'&&isFinancasData(payload.data))return payload
    if(isFinancasData(payload))return {data:payload,updatedAt:0}
    throw new Error('O backup do Google Drive está corrompido ou possui formato incompatível.')
  },

  async write(data: FinancasData,updatedAt=Date.now()) {
    if (!accessToken) return
    fileId ??= await findFile()
    const body = JSON.stringify({app:'Aurvm',schemaVersion:1,updatedAt,data}, null, 2)
    if (fileId) {
      const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body,
      })
      if (!response.ok) throw new Error('Falha ao sincronizar com o Google Drive')
      return
    }
    const boundary = `aurvm_${Date.now()}`
    const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE_NAME, mimeType: 'application/json', appProperties:{application:'aurvm',schema:'1'} })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST', headers: { ...authHeaders(), 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart,
    })
    if (!response.ok) throw new Error('Falha ao criar financas.json')
    fileId = (await response.json()).id
  },
}

const authHeaders = () => ({ Authorization: `Bearer ${accessToken}` })
async function findFile() {
  for(const rawQuery of [`appProperties has { key='application' and value='aurvm' } and trashed=false`,`name='${FILE_NAME}' and trashed=false`]){
    const query=encodeURIComponent(rawQuery)
    const response=await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)&pageSize=1`,{headers:authHeaders()})
    if(!response.ok)throw new Error('Falha ao localizar financas.json')
    const result=await response.json()
    if(result.files?.[0]?.id)return result.files[0].id as string
  }
  return null
}
