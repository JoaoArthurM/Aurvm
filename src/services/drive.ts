import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import type { FinancasData } from '../lib/types'
import { isFinancasData, type BackupRecord } from './local-backup'

const FILE_NAME = 'financas.json'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
let accessToken: string | null = null
let fileId: string | null = null

export const driveService = {
  async initialize() {
    const clientId=import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID
    if(!clientId||clientId.startsWith('seu-client-id'))throw new Error('Configure VITE_GOOGLE_WEB_CLIENT_ID para ativar o Google Login.')
    await GoogleAuth.initialize({ clientId, scopes: ['profile','email',DRIVE_SCOPE], grantOfflineAccess: false })
    return true
  },

  async signIn() {
    const user = await GoogleAuth.signIn()
    accessToken = user.authentication.accessToken
    return { name: user.name ?? user.email, email: user.email }
  },

  async restoreSession() {
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
