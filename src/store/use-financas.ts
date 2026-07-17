import { create } from 'zustand'
import { seedData } from '../lib/seed'
import type { FinancasData, Tab } from '../lib/types'
import { driveService } from '../services/drive'

type SyncStatus = 'local' | 'syncing' | 'synced' | 'error'
type Store = {
  data: FinancasData
  tab: Tab
  syncStatus: SyncStatus
  connected: boolean
  signedIn: boolean
  accountName: string | null
  setTab: (tab: Tab) => void
  replaceData: (data: FinancasData) => void
  mutate: (recipe: (draft: FinancasData) => void) => void
  connect: () => Promise<void>
  restore: () => Promise<void>
  disconnect: () => Promise<void>
  loginDemo: () => void
  logout: () => Promise<void>
}

let syncTimer: ReturnType<typeof setTimeout> | undefined

export const useFinancas = create<Store>((set, get) => ({
  data: structuredClone(seedData), tab: 'inicio', syncStatus: 'local', connected: false, signedIn: true, accountName: null,
  setTab: (tab) => set({ tab }),
  replaceData: (data) => set({ data }),
  mutate: (recipe) => {
    const next = structuredClone(get().data)
    recipe(next)
    set({ data: next, syncStatus: get().connected ? 'syncing' : 'local' })
    clearTimeout(syncTimer)
    syncTimer = setTimeout(async () => {
      if (!get().connected) return
      try { await driveService.write(get().data); set({ syncStatus: 'synced' }) }
      catch { set({ syncStatus: 'error' }) }
    }, 450)
  },
  connect: async () => {
    await driveService.initialize()
    const account = await driveService.signIn()
    set({ connected: true, accountName: account.name, syncStatus: 'syncing' })
    const remote = await driveService.read()
    if (remote) set({ data: remote, syncStatus: 'synced' })
    else { await driveService.write(get().data); set({ syncStatus: 'synced' }) }
  },
  restore: async () => {
    if (!await driveService.restoreSession()) return
    set({ connected: true, syncStatus: 'syncing' })
    try {
      const remote = await driveService.read()
      if (remote) set({ data: remote, syncStatus: 'synced' })
      else set({ syncStatus: 'local' })
    } catch { set({ syncStatus: 'error' }) }
  },
  disconnect: async () => { await driveService.signOut(); set({ connected: false, accountName: null, syncStatus: 'local' }) },
  loginDemo: () => set({ signedIn: true, tab: 'inicio' }),
  logout: async () => { if (get().connected) await driveService.signOut().catch(()=>undefined); set({ signedIn: false, connected: false, accountName: null, syncStatus: 'local' }) },
}))
