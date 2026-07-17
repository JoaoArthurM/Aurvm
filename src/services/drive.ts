import { Capacitor } from '@capacitor/core'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import type { FinancasData } from '../lib/types'

const FILE_NAME = 'financas.json'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
let accessToken: string | null = null
let fileId: string | null = null

export const driveService = {
  async initialize() {
    if (!Capacitor.isNativePlatform()) return false
    await GoogleAuth.initialize({ clientId: import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID, scopes: [DRIVE_SCOPE], grantOfflineAccess: true })
    return true
  },

  async signIn() {
    const user = await GoogleAuth.signIn()
    accessToken = user.authentication.accessToken
    return { name: user.name ?? user.email, email: user.email }
  },

  async restoreSession() {
    if (!Capacitor.isNativePlatform()) return false
    try {
      await this.initialize()
      const authentication = await GoogleAuth.refresh()
      accessToken = authentication.accessToken
      return true
    } catch { return false }
  },

  async signOut() {
    await GoogleAuth.signOut()
    accessToken = null
    fileId = null
  },

  get connected() { return Boolean(accessToken) },

  async read(): Promise<FinancasData | null> {
    if (!accessToken) return null
    fileId = await findFile()
    if (!fileId) return null
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: authHeaders() })
    if (!response.ok) throw new Error('Não foi possível ler financas.json')
    return response.json() as Promise<FinancasData>
  },

  async write(data: FinancasData) {
    if (!accessToken) return
    fileId ??= await findFile()
    const body = JSON.stringify(data, null, 2)
    if (fileId) {
      const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH', headers: { ...authHeaders(), 'Content-Type': 'application/json' }, body,
      })
      if (!response.ok) throw new Error('Falha ao sincronizar com o Google Drive')
      return
    }
    const boundary = `aurvm_${Date.now()}`
    const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST', headers: { ...authHeaders(), 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart,
    })
    if (!response.ok) throw new Error('Falha ao criar financas.json')
    fileId = (await response.json()).id
  },
}

const authHeaders = () => ({ Authorization: `Bearer ${accessToken}` })
async function findFile() {
  const query = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`)
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)&pageSize=1`, { headers: authHeaders() })
  if (!response.ok) throw new Error('Falha ao localizar financas.json')
  const result = await response.json()
  return result.files?.[0]?.id ?? null
}
