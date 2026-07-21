import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import type { FinancasData } from '../lib/types'

export type BackupRecord={data:FinancasData;updatedAt:number}

const CURRENT_KEY='aurvm:backup:current:v1'
const HISTORY_KEY='aurvm:backup:history:v1'
const DEVICE_FILE='aurvm/financas.json'
const DEVICE_PREVIOUS_FILE='aurvm/financas.previous.json'
const HISTORY_LIMIT=20
let deviceWriteChain=Promise.resolve()
const browserStorage=()=>typeof window==='undefined'?null:window.localStorage

export const isFinancasData=(value:unknown):value is FinancasData=>{
  if(!value||typeof value!=='object')return false
  const data=value as Partial<FinancasData>
  return data.version===1&&Boolean(data.perfil)&&Boolean(data.config)&&Array.isArray(data.economias)&&Boolean(data.tabela)&&Boolean(data.emprestimos)&&Boolean(data.flux)
}

const parseRecord=(raw:string|null):BackupRecord|null=>{
  if(!raw)return null
  try{
    const parsed=JSON.parse(raw) as Partial<BackupRecord>
    return typeof parsed.updatedAt==='number'&&isFinancasData(parsed.data)?parsed as BackupRecord:null
  }catch{return null}
}

export const loadLocalBackup=():BackupRecord|null=>{
  const storage=browserStorage()
  if(!storage)return null
  const current=parseRecord(storage.getItem(CURRENT_KEY))
  if(current)return current
  try{
    const history=JSON.parse(storage.getItem(HISTORY_KEY)??'[]') as unknown[]
    return history.map(item=>parseRecord(JSON.stringify(item))).filter((item):item is BackupRecord=>Boolean(item)).sort((a,b)=>b.updatedAt-a.updatedAt)[0]??null
  }catch{return null}
}

export const persistLocalBackup=(data:FinancasData,updatedAt=Date.now()):BackupRecord=>{
  const record:BackupRecord={data,updatedAt}
  const storage=browserStorage()
  if(storage){
    const serialized=JSON.stringify(record)
    try{
      storage.setItem(CURRENT_KEY,serialized)
      const previous=JSON.parse(storage.getItem(HISTORY_KEY)??'[]') as BackupRecord[]
      const history=[record,...previous.filter(item=>item.updatedAt!==updatedAt)].slice(0,HISTORY_LIMIT)
      storage.setItem(HISTORY_KEY,JSON.stringify(history))
    }catch{
      try{storage.setItem(CURRENT_KEY,serialized);storage.setItem(HISTORY_KEY,JSON.stringify([record]))}catch{ /* native copy remains available */ }
    }
  }
  queueDeviceBackup(record)
  return record
}

export const exportBackupFile=async(data:FinancasData)=>{
  const filename=`aurvm-backup-${new Date().toISOString().slice(0,10)}.json`
  const payload=JSON.stringify({app:'Aurvm',exportedAt:new Date().toISOString(),data},null,2)

  if(Capacitor.isNativePlatform()){
    const permission=await Filesystem.requestPermissions()
    if(permission.publicStorage!=='granted')throw new Error('Permissão para salvar arquivos não concedida.')
    await Filesystem.writeFile({
      path:`Aurvm/${filename}`,
      data:payload,
      directory:Directory.Documents,
      encoding:Encoding.UTF8,
      recursive:true,
    })
    return `Documentos/Aurvm/${filename}`
  }

  const blob=new Blob([payload],{type:'application/json'})
  const url=URL.createObjectURL(blob)
  const anchor=document.createElement('a')
  anchor.href=url
  anchor.download=filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(()=>URL.revokeObjectURL(url),0)
  return filename
}

export const loadDeviceBackup=async():Promise<BackupRecord|null>=>{
  for(const path of [DEVICE_FILE,DEVICE_PREVIOUS_FILE]){
    try{
      const result=await Filesystem.readFile({path,directory:Directory.Data,encoding:Encoding.UTF8})
      const record=parseRecord(typeof result.data==='string'?result.data:null)
      if(record)return record
    }catch{ /* try the previous copy */ }
  }
  return null
}

const queueDeviceBackup=(record:BackupRecord)=>{
  deviceWriteChain=deviceWriteChain.then(async()=>{
    try{
      const current=await Filesystem.readFile({path:DEVICE_FILE,directory:Directory.Data,encoding:Encoding.UTF8})
      if(typeof current.data==='string')await Filesystem.writeFile({path:DEVICE_PREVIOUS_FILE,data:current.data,directory:Directory.Data,encoding:Encoding.UTF8,recursive:true})
    }catch{ /* first save has no previous copy */ }
    await Filesystem.writeFile({path:DEVICE_FILE,data:JSON.stringify(record),directory:Directory.Data,encoding:Encoding.UTF8,recursive:true})
  }).catch(()=>undefined)
}
