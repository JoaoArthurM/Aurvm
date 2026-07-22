import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { localISO } from '../lib/utils'
import type { FinancasData } from '../lib/types'

export type BackupRecord={data:FinancasData;updatedAt:number}

const CURRENT_KEY='aurvm:backup:current:v1'
const HISTORY_KEY='aurvm:backup:history:v1'
const DEVICE_FILE='aurvm/financas.json'
const DEVICE_PREVIOUS_FILE='aurvm/financas.previous.json'
const HISTORY_LIMIT=20
let deviceWriteChain=Promise.resolve()
const browserStorage=()=>typeof window==='undefined'?null:window.localStorage

const isRecord=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==='object'&&!Array.isArray(value))
const isFiniteNumber=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)
const isDateKey=(value:unknown)=>{
  if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return false
  const [year,month,day]=value.split('-').map(Number)
  const parsed=new Date(year,month-1,day)
  return parsed.getFullYear()===year&&parsed.getMonth()===month-1&&parsed.getDate()===day
}
const isReminder=(value:unknown)=>value==null||(isRecord(value)&&isDateKey(value.data)&&typeof value.observacao==='string')
const isItem=(value:unknown)=>isRecord(value)&&typeof value.id==='string'&&typeof value.label==='string'&&isFiniteNumber(value.valor)&&value.valor>=0&&(value.emoji==null||typeof value.emoji==='string')&&isReminder(value.lembrete)
const isEconomia=(value:unknown)=>isRecord(value)&&typeof value.id==='string'&&typeof value.label==='string'&&isFiniteNumber(value.valor)&&value.valor>=0&&['recorrente','parcelado','pontual'].includes(String(value.tipo))&&(value.vezes==null||(typeof value.vezes==='number'&&Number.isInteger(value.vezes)&&value.vezes>=1))&&(value.mes==null||(typeof value.mes==='string'&&isDateKey(value.mes+'-01')))&&(value.frequencia==null||['mensal','semanal','diaria','nenhuma'].includes(String(value.frequencia)))
const isTag=(value:unknown)=>isRecord(value)&&typeof value.id==='string'&&typeof value.label==='string'&&typeof value.cor==='string'&&(value.oculta==null||typeof value.oculta==='boolean')
const isPersonLoan=(value:unknown)=>isRecord(value)&&typeof value.id==='string'&&isDateKey(value.data)&&typeof value.motivo==='string'&&isFiniteNumber(value.valor)&&value.valor>=0&&typeof value.pago==='boolean'&&isReminder(value.lembrete)
const isPerson=(value:unknown)=>isRecord(value)&&typeof value.id==='string'&&typeof value.nome==='string'&&typeof value.cor==='string'&&Array.isArray(value.lancamentos)&&value.lancamentos.every(isPersonLoan)
const isCard=(value:unknown)=>isRecord(value)&&typeof value.id==='string'&&typeof value.nome==='string'&&isFiniteNumber(value.fechamento)&&Number.isInteger(value.fechamento)&&value.fechamento>=1&&value.fechamento<=31&&isFiniteNumber(value.vencimento)&&Number.isInteger(value.vencimento)&&value.vencimento>=1&&value.vencimento<=31
const isRecurrence=(value:unknown)=>value==null||(isRecord(value)&&(value.vezes==null||(typeof value.vezes==='number'&&Number.isInteger(value.vezes)&&value.vezes>=0))&&(value.excluidas==null||Array.isArray(value.excluidas)&&value.excluidas.every(isDateKey))&&(value.frequencia==null||['mensal','semanal','diaria'].includes(String(value.frequencia)))&&(value.regra==null||['data','quinto_util'].includes(String(value.regra))))
const isFluxLoan=(value:unknown)=>isRecord(value)&&typeof value.id==='string'&&isDateKey(value.data)&&['entrada','saida','diario','economia','cartao'].includes(String(value.tipo))&&isFiniteNumber(value.valor)&&value.valor>=0&&typeof value.descricao==='string'&&(value.tag_id==null||typeof value.tag_id==='string')&&(value.tag_ids==null||Array.isArray(value.tag_ids)&&value.tag_ids.every(item=>typeof item==='string'))&&isRecurrence(value.repete)&&(value.cartao_id==null||typeof value.cartao_id==='string')&&(value.cartao==null||isRecord(value.cartao)&&(value.cartao.ajustes==null||isRecord(value.cartao.ajustes)&&Object.values(value.cartao.ajustes).every(isDateKey)))

export const isFinancasData=(value:unknown):value is FinancasData=>{
  if(!isRecord(value)||value.version!==1||!isRecord(value.perfil)||!isFiniteNumber(value.perfil.saldo_inicial)||!isFiniteNumber(value.perfil.economia_mensal)||!isFiniteNumber(value.perfil.valor_diario)||!isRecord(value.tabela)||!isRecord(value.emprestimos)||!isRecord(value.flux)||!isRecord(value.config))return false
  const tabela=value.tabela
  const config=value.config
  const flux=value.flux
  return ['entradas','fixos','variaveis','assinaturas'].every(key=>Array.isArray(tabela[key])&&tabela[key].every(isItem))&&Array.isArray(value.economias)&&value.economias.every(isEconomia)&&Array.isArray(value.emprestimos.pessoas)&&value.emprestimos.pessoas.every(isPerson)&&isFiniteNumber(flux.valor_diario_planejado)&&Array.isArray(flux.tags)&&flux.tags.every(isTag)&&Array.isArray(flux.lancamentos)&&flux.lancamentos.every(isFluxLoan)&&(flux.saldo_inicial==null||isFiniteNumber(flux.saldo_inicial))&&(flux.cartoes==null||Array.isArray(flux.cartoes)&&flux.cartoes.every(isCard))&&(config.tema==='light'||config.tema==='dark')&&config.moeda==='BRL'&&typeof config.lembrete_mensal==='boolean'&&(config.tela_inicial==null||['inicio','tabela','economia','emprestimos','flux','config'].includes(String(config.tela_inicial)))&&(config.navegacao==null||Array.isArray(config.navegacao)&&config.navegacao.every(item=>isRecord(item)&&['inicio','tabela','economia','emprestimos','flux','config'].includes(String(item.id))&&typeof item.visivel==='boolean'))
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
  const filename=`aurvm-backup-${localISO(new Date())}.json`
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
