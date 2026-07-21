import { create } from 'zustand'
import { seedData } from '../lib/seed'
import type { FinancasData, Tab } from '../lib/types'
import { driveService } from '../services/drive'
import { loadDeviceBackup, loadLocalBackup, persistLocalBackup } from '../services/local-backup'

type SyncStatus = 'local' | 'syncing' | 'synced' | 'error'
type Store = {
  data: FinancasData
  tab: Tab
  syncStatus: SyncStatus
  connected: boolean
  signedIn: boolean
  accountName: string | null
  lastBackupAt: number | null
  lastSyncAt: number | null
  valuesHidden: boolean
  toggleValues: () => void
  setTab: (tab: Tab) => void
  replaceData: (data: FinancasData) => void
  mutate: (recipe: (draft: FinancasData) => void) => void
  connect: () => Promise<void>
  syncNow: () => Promise<void>
  restore: () => Promise<void>
  disconnect: () => Promise<void>
  loginDemo: () => void
  logout: () => Promise<void>
}

let syncTimer: ReturnType<typeof setTimeout> | undefined
let syncInFlight=false
let editRevision=0
const INSTALL_MARKER='aurvm:installation-ready:v1'
const mayRestoreGoogleSession=(()=>{
  try{
    if(window.localStorage.getItem(INSTALL_MARKER)==='1')return true
    window.localStorage.setItem(INSTALL_MARKER,'1')
  }catch{/* A tela de login continua sendo a opção segura sem armazenamento. */}
  return false
})()
const initialBackup=loadLocalBackup()
let latestSavedAt=initialBackup?.updatedAt??Date.now()

const isLegacyDemoData=(data:FinancasData)=>{
  const ids=new Set([
    ...data.tabela.entradas,...data.tabela.fixos,...data.tabela.variaveis,...data.tabela.assinaturas,
    ...data.economias,...data.emprestimos.pessoas,...data.flux.lancamentos,
  ].map(item=>item.id))
  return ['e1','e2','f1','f2','f3','v1','v2','v3','a1','a2','a3','a4','ec1','ec2','ec3','ec4','p1','p2','p3','fl1','fl2','fl3','fl4','fl5','fl6','fl7','fl8'].every(id=>ids.has(id))
}

const normalizeData=(source:FinancasData)=>{
  const data=structuredClone(source)
  if(isLegacyDemoData(data)){
    const clean=structuredClone(seedData)
    clean.config={...clean.config,...data.config,preferencias:{...clean.config.preferencias,...data.config.preferencias}}
    clean.config.navegacao?.forEach(item=>{
      if(item.id==='inicio'||item.id==='config')item.visivel=true
    })
    return clean
  }
  data.flux.saldo_inicial??=data.perfil.saldo_inicial
  data.config.preferencias??={}
  data.config.navegacao?.forEach(item=>{
    if(item.id==='inicio'||item.id==='config')item.visivel=true
  })
  return data
}
const initialData=normalizeData(initialBackup?.data??seedData)

export const useFinancas = create<Store>((set, get) => {
  const scheduleSync=(delay=450)=>{
    clearTimeout(syncTimer)
    syncTimer=setTimeout(async()=>{
      if(!get().connected||syncInFlight)return
      syncInFlight=true
      const revision=editRevision
      const snapshot=structuredClone(get().data)
      const savedAt=latestSavedAt
      try{
        await driveService.write(snapshot,savedAt)
        if(revision===editRevision)set({syncStatus:'synced',lastSyncAt:Date.now()})
      }catch{set({syncStatus:'error'})}
      finally{
        syncInFlight=false
        if(revision!==editRevision&&get().connected)scheduleSync(0)
      }
    },delay)
  }
  const save=(data:FinancasData)=>{
    latestSavedAt=Date.now()
    editRevision++
    persistLocalBackup(data,latestSavedAt)
    set({lastBackupAt:latestSavedAt})
    scheduleSync(0)
  }
  const useBackup=(record:{data:FinancasData;updatedAt:number})=>{
    const data=normalizeData(record.data)
    latestSavedAt=record.updatedAt
    persistLocalBackup(data,record.updatedAt)
    set({data,tab:data.config.tela_inicial??'inicio',valuesHidden:data.config.preferencias?.valores_ocultos??false,lastBackupAt:record.updatedAt})
  }
  const reconcileRemote=async()=>{
    const remote=await driveService.read()
    const local=loadLocalBackup()
    if(remote&&(!local||remote.updatedAt>=local.updatedAt))useBackup(remote)
    else await driveService.write(get().data,local?.updatedAt??latestSavedAt)
    set({syncStatus:'synced',lastSyncAt:Date.now()})
  }
  return {
  data: initialData, tab: initialData.config.tela_inicial ?? 'inicio', syncStatus: 'local', connected: false, signedIn: false, accountName: null, lastBackupAt:initialBackup?.updatedAt??null, lastSyncAt:null,
  valuesHidden: initialData.config.preferencias?.valores_ocultos??false,
  toggleValues: () => {
    const data=structuredClone(get().data)
    data.config.preferencias??={}
    const valuesHidden=!(data.config.preferencias.valores_ocultos??false)
    data.config.preferencias.valores_ocultos=valuesHidden
    set({data,valuesHidden,syncStatus:get().connected?'syncing':'local'})
    save(data)
  },
  setTab: (tab) => set({ tab }),
  replaceData: (data) => {
    data=normalizeData(data)
    set({ data, tab: data.config.tela_inicial ?? get().tab, valuesHidden:data.config.preferencias?.valores_ocultos??false, syncStatus: get().connected ? 'syncing' : 'local' })
    save(data)
  },
  mutate: (recipe) => {
    const next = structuredClone(get().data)
    recipe(next)
    set({ data: next, syncStatus: get().connected ? 'syncing' : 'local' })
    save(next)
  },
  connect: async () => {
    await driveService.initialize()
    const account = await driveService.signIn()
    set({ connected: true, signedIn:true, accountName: account.name, syncStatus: 'syncing' })
    await reconcileRemote()
  },
  syncNow: async () => {
    if (!get().connected || syncInFlight) return
    clearTimeout(syncTimer)
    syncInFlight = true
    const revision = editRevision
    set({ syncStatus: 'syncing' })
    try {
      await reconcileRemote()
    } catch (error) {
      set({ syncStatus: 'error' })
      throw error
    } finally {
      syncInFlight = false
      if (revision !== editRevision && get().connected) scheduleSync(0)
    }
  },
  restore: async () => {
    const device=await loadDeviceBackup()
    const local=loadLocalBackup()
    if(device&&(!local||device.updatedAt>local.updatedAt))useBackup(device)
    // Uma instalação nova deve sempre pedir que o usuário escolha a conta.
    // Nas próximas aberturas, a sessão pode ser recuperada sem novo prompt.
    if(!mayRestoreGoogleSession)return
    if (!await driveService.restoreSession()) return
    set({ connected: true, signedIn:true, syncStatus: 'syncing' })
    try {
      await reconcileRemote()
    } catch { set({ syncStatus: 'error' }) }
  },
  disconnect: async () => { await driveService.signOut(); set({ connected: false, accountName: null, syncStatus: 'local', lastSyncAt:null }) },
  loginDemo: () => set({ signedIn: true, tab: get().data.config.tela_inicial ?? 'inicio' }),
  logout: async () => { if (get().connected) await driveService.signOut().catch(()=>undefined); set({ signedIn: false, connected: false, accountName: null, syncStatus: 'local', lastSyncAt:null }) },
  }
})
