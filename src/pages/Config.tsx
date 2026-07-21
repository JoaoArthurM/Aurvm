import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import {
  IconBell, IconBellRinging, IconChevronLeft, IconChevronRight, IconDownload, IconEyeCheck, IconGripVertical,
  IconEyeOff, IconHome, IconInfoCircle, IconLayoutNavbar, IconLogout, IconMoon, IconPalette,
  IconPigMoney, IconRefresh, IconReportMoney, IconShieldCheck, IconSun, IconTableColumn,
  IconUpload, IconUser, IconUserDollar,
} from '@tabler/icons-react'
import { AurvmSelect } from '../components/AurvmControls'
import { Button, Card, ConfirmDialog, Input, Toggle } from '../components/ui'
import { cn } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import { defaultNavigation, navigationLabels } from '../lib/navigation'
import type { FinancasData, Tab } from '../lib/types'
import { exportBackupFile, isFinancasData } from '../services/local-backup'

const startScreenMeta:Record<Tab,{caption:string;icon:ReactNode;color:string}>={
  inicio:{caption:'Resumo e visão geral',icon:<IconHome size={15}/>,color:'var(--accent)'},
  tabela:{caption:'Planejamento mensal',icon:<IconReportMoney size={15}/>,color:'var(--red)'},
  economia:{caption:'Reservas e metas',icon:<IconPigMoney size={15}/>,color:'var(--green)'},
  emprestimos:{caption:'Cobranças e dívidas',icon:<IconUserDollar size={15}/>,color:'#4B82F4'},
  flux:{caption:'Movimentações diárias',icon:<IconTableColumn size={15}/>,color:'var(--flux-orange)'},
  config:{caption:'Preferências do aplicativo',icon:<IconLayoutNavbar size={15}/>,color:'var(--t2)'},
}

export function Config(){
  const {data,mutate,replaceData,connected,accountName,syncStatus,lastBackupAt,lastSyncAt,connect,disconnect,syncNow,logout,setTab}=useFinancas()
  const [error,setError]=useState('')
  const [backupStatus,setBackupStatus]=useState<{type:'success'|'error';text:string}|null>(null)
  const [pendingImport,setPendingImport]=useState<FinancasData|null>(null)
  const [dragging,setDragging]=useState<Tab|null>(null)
  const backupInputRef=useRef<HTMLInputElement>(null)
  const dragRef=useRef<{id:Tab;startY:number;index:number}|null>(null)
  const busy=syncStatus==='syncing'
  const tableReminderCount=Object.values(data.tabela).flat().filter(item=>item.lembrete).length
  const debtReminderCount=data.emprestimos.pessoas.flatMap(person=>person.lancamentos).filter(item=>item.lembrete).length
  const reminderCount=tableReminderCount+debtReminderCount
  const exportBackup=async()=>{
    setBackupStatus(null)
    try{
      const path=await exportBackupFile(data)
      setBackupStatus({type:'success',text:`Backup salvo em ${path}.`})
    }catch(error){setBackupStatus({type:'error',text:error instanceof Error?error.message:'Não foi possível exportar o backup.'})}
  }
  const importBackup=async(event:ChangeEvent<HTMLInputElement>)=>{
    const file=event.target.files?.[0];event.target.value='';if(!file)return
    try{
      if(file.size>5*1024*1024)throw new Error('Arquivo muito grande')
      const parsed=JSON.parse(await file.text()) as unknown
      const candidate=parsed&&typeof parsed==='object'&&'data' in parsed?(parsed as {data:unknown}).data:parsed
      if(!isFinancasData(candidate))throw new Error('Formato inválido')
      setPendingImport(structuredClone(candidate))
    }catch{setBackupStatus({type:'error',text:'Arquivo inválido. Escolha um backup JSON gerado pelo Aurvm.'})}
  }
  const applyImport=()=>{if(!pendingImport)return;replaceData(pendingImport);setPendingImport(null);setBackupStatus({type:'success',text:'Backup importado. Todos os dados foram restaurados.'})}
  const synchronizeNow=async()=>{
    if(!connected||busy)return
    setError('')
    try{await syncNow()}catch(error){setError(error instanceof Error?error.message:'Falha ao sincronizar')}
  }
  const setTheme=(tema:'light'|'dark')=>mutate(d=>{d.config.tema=tema})
  const navigationItems=data.config.navegacao??defaultNavigation
  const visibleStartScreens=navigationItems.filter(item=>item.id!=='config'&&item.visivel)
  const startScreen=visibleStartScreens.some(item=>item.id===data.config.tela_inicial)?data.config.tela_inicial??'inicio':visibleStartScreens[0]?.id??'inicio'
  const toggleNavigation=(id:Tab)=>{
    if(id==='inicio'||id==='config')return
    mutate(d=>{
      const items=d.config.navegacao??defaultNavigation.map(item=>({...item}))
      d.config.navegacao=items
      const item=items.find(item=>item.id===id)
      if(item?.visivel&&items.filter(entry=>entry.id!=='config'&&entry.visivel).length===1)return
      if(item)item.visivel=!item.visivel
      if(item&&!item.visivel&&(d.config.tela_inicial??'inicio')===id)d.config.tela_inicial=items.find(entry=>entry.id!=='config'&&entry.visivel)?.id??'inicio'
    })
  }
  const moveNavigation=(id:Tab,direction:-1|1)=>mutate(d=>{
    const items=d.config.navegacao??defaultNavigation.map(item=>({...item}))
    d.config.navegacao=items
    const index=items.findIndex(item=>item.id===id)
    const target=index+direction
    if(index<0||target<0||target>=items.length)return
    ;[items[index],items[target]]=[items[target],items[index]]
  })
  const dropNavigation=(clientY:number)=>{
    const drag=dragRef.current
    if(!drag)return
    const steps=Math.round((clientY-drag.startY)/61)
    if(steps!==0)mutate(d=>{
      const items=d.config.navegacao??defaultNavigation.map(item=>({...item}))
      d.config.navegacao=items
      const index=items.findIndex(item=>item.id===drag.id)
      if(index<0)return
      const target=Math.max(0,Math.min(items.length-1,drag.index+steps))
      const [moved]=items.splice(index,1)
      items.splice(target,0,moved)
    })
    dragRef.current=null
    setDragging(null)
  }

  return <><div className="page min-h-full font-sans">
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-[22px] pb-[14px] pt-0.5">
      <button type="button" aria-label="Voltar para o início" onClick={()=>setTab('inicio')} className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-surface text-t2 shadow-[0_2px_8px_rgba(15,37,64,.07)]"><IconChevronLeft size={20}/></button>
      <div className="text-center"><p className="font-mono text-[9.5px] font-bold uppercase tracking-[2px] text-accent">Preferências</p><h2 className="text-[16px] font-bold">Configurações</h2></div>
      <div />
    </div>

    <div className="space-y-5 px-4">
      <ConfigSection icon={<GoogleDriveMark className="h-4 w-[18px]"/>} title="Conta e dados">
        <Card className="overflow-hidden shadow-[0_10px_28px_rgba(55,35,20,.045)]">
          <div className="flex items-center px-4 py-4">
            <div className={cn('mr-3 grid h-11 w-11 place-items-center rounded-[14px]',connected?'bg-green/10':'bg-el')}>
              {busy?<IconRefresh size={18} className="animate-spin text-accent"/>:<GoogleDriveMark className="h-6 w-7"/>} 
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-t1">{connected?(accountName??'Google Drive conectado'):'Google Drive desconectado'}</p>
              <p className="mt-1 text-[10px] text-t3">{connected?syncStatus==='synced'?'financas.json sincronizado':syncStatus==='error'?'Erro na última sincronização':'Sincronização ativa':'Dados protegidos neste aparelho'}</p>
            </div>
            <Toggle checked={connected} onChange={async()=>{setError('');try{connected?await disconnect():await connect()}catch(e){setError(e instanceof Error?e.message:'Falha ao conectar')}}}/>
          </div>
          {error&&<p className="border-t border-border px-4 py-3 text-[10px] text-red">{error}</p>}
          <div className="grid grid-cols-2 border-t border-border text-[9px]">
            <div className="border-r border-border px-4 py-3"><span className="block text-t3">Neste aparelho</span><span className="mt-1 block font-semibold text-green">{lastBackupAt?`Protegido às ${new Date(lastBackupAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:'Aguardando primeira edição'}</span></div>
            <div className="px-4 py-3"><span className="block text-t3">Google Drive</span><span className={cn('mt-1 block font-semibold',syncStatus==='error'?'text-red':connected?'text-green':'text-t3')}>{!connected?'Não conectado':syncStatus==='syncing'?'Sincronizando…':syncStatus==='error'?'Falha ao sincronizar':lastSyncAt?`Sincronizado às ${new Date(lastSyncAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:'Conectado'}</span></div>
          </div>
          <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-[9px] text-t3"><IconShieldCheck size={13} className="text-accent"/>Acesso limitado drive.file · somente arquivos criados pelo Aurvm</div>
          <div className="border-t border-border p-3">
            <button type="button" disabled={!connected||busy} onClick={synchronizeNow} className="glass-action glass-accent flex w-full items-center gap-2.5 rounded-[13px] border px-3 py-3 text-left transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-accent/10 text-accent"><IconRefresh size={15} className={busy?'animate-spin':''}/></span>
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold text-t1">Sincronizar agora</span><span className="mt-0.5 block text-[8px] text-t3">{connected?'Atualizar financas.json no Google Drive':'Conecte o Google Drive para sincronizar'}</span></span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
            <button type="button" onClick={exportBackup} className="glass-action glass-neutral flex min-w-0 items-center gap-2.5 rounded-[13px] border px-3 py-3 text-left transition active:scale-[.98]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-green/10 text-green"><IconDownload size={15}/></span><span className="min-w-0"><span className="block text-[10px] font-bold text-t1">Exportar</span><span className="mt-0.5 block text-[8px] text-t3">Salvar JSON</span></span></button>
            <button type="button" onClick={()=>backupInputRef.current?.click()} className="glass-action glass-accent flex min-w-0 items-center gap-2.5 rounded-[13px] border px-3 py-3 text-left transition active:scale-[.98]"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-accent/10 text-accent"><IconUpload size={15}/></span><span className="min-w-0"><span className="block text-[10px] font-bold text-t1">Importar</span><span className="mt-0.5 block text-[8px] text-t3">Abrir JSON</span></span></button>
            <input ref={backupInputRef} type="file" accept="application/json,.json" onChange={importBackup} className="hidden"/>
          </div>
          {backupStatus&&<p className={cn('border-t border-border px-4 py-3 text-[9px]',backupStatus.type==='success'?'text-green':'text-red')}>{backupStatus.text}</p>}
        </Card>
      </ConfigSection>

      <ConfigSection icon={<IconPalette size={15}/>} title="Aparência">
        <Card className="overflow-hidden shadow-[0_10px_28px_rgba(55,35,20,.045)]">
          <SettingRow icon={data.config.tema==='light'?<IconSun size={16} className="text-[#B88624]"/>:<IconMoon size={16} className="text-[#8A78B5]"/>} label="Tema" caption="Interface do aplicativo">
            <div className="theme-segment flex h-[34px] items-center rounded-[12px] border p-[3px] text-[9px] font-semibold">
              <button onClick={()=>setTheme('light')} className={cn('flex h-[26px] items-center gap-1 rounded-[9px] px-2.5 transition',data.config.tema==='light'?'theme-segment-active theme-light-active':'theme-segment-inactive')}><IconSun size={12} stroke={1.8}/>Claro</button>
              <button onClick={()=>setTheme('dark')} className={cn('flex h-[26px] items-center gap-1 rounded-[9px] px-2.5 transition',data.config.tema==='dark'?'theme-segment-active theme-dark-active':'theme-segment-inactive')}><IconMoon size={12} stroke={1.8}/>Escuro</button>
            </div>
          </SettingRow>
          <SettingRow icon={<span className="font-display text-[11px] font-bold text-[#238A5B]">R$</span>} label="Moeda" caption="Formato dos valores"><span aria-hidden="true" className="text-[14px] leading-none">🇧🇷</span><span className="font-mono text-[10px] font-bold text-t2">BRL</span><IconChevronRight size={14} className="text-t3"/></SettingRow>
        </Card>
      </ConfigSection>

      <ConfigSection icon={<IconLayoutNavbar size={15}/>} title="Organização">
        <Card className="overflow-hidden shadow-[0_10px_28px_rgba(55,35,20,.045)]">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><IconHome size={16}/></span>
            <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-t1">Tela padrão</p><p className="mt-0.5 text-[9px] text-t3">Abre primeiro ao entrar no Aurvm</p></div>
            <AurvmSelect ariaLabel="Escolher tela padrão" value={startScreen} onChange={value=>mutate(d=>{d.config.tela_inicial=value as Tab})} side="bottom" className="glass-action glass-accent h-10 w-[128px] bg-transparent" menuClassName="pb-6" options={visibleStartScreens.map(item=>({value:item.id,label:navigationLabels[item.id],caption:startScreenMeta[item.id].caption,icon:startScreenMeta[item.id].icon,color:startScreenMeta[item.id].color}))}/>
          </div>
          <div className="flex items-center gap-2 border-b border-border bg-el/35 px-4 py-2.5 text-[9px] text-t3"><IconGripVertical size={13}/><span>Segure a alça e arraste para reorganizar</span></div>
          {navigationItems.filter(item=>item.id!=='config').map(item=>{
            const index=navigationItems.findIndex(entry=>entry.id===item.id)
            const locked=item.id==='inicio'
            return <div key={item.id} className={cn('flex items-center border-b border-border px-3 py-3 transition last:border-0',!item.visivel&&'opacity-55',dragging===item.id&&'scale-[.985] bg-accent/5 shadow-inner')}>
              <button type="button" disabled={locked} onClick={()=>toggleNavigation(item.id)} aria-label={item.visivel?`Ocultar ${navigationLabels[item.id]}`:`Mostrar ${navigationLabels[item.id]}`} className={cn('mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition',item.visivel?'bg-[#238A5B]/10 text-[#238A5B]':'bg-el text-t3',locked&&'cursor-not-allowed')}>
                {item.visivel?<IconEyeCheck size={17}/>:<IconEyeOff size={17}/>}
              </button>
              <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-t1">{navigationLabels[item.id]}</p><p className="mt-0.5 text-[9px] text-t3">{locked?'Sempre visível':item.visivel?'Visível no menu':'Oculta do menu'}</p></div>
              <button type="button" aria-label={`Reordenar ${navigationLabels[item.id]}`} title="Segure e arraste" className="grid h-10 w-9 touch-none place-items-center rounded-xl text-t3 transition active:bg-el active:text-t1" onPointerDown={e=>{dragRef.current={id:item.id,startY:e.clientY,index};setDragging(item.id);e.currentTarget.setPointerCapture(e.pointerId)}} onPointerUp={e=>dropNavigation(e.clientY)} onPointerCancel={()=>{dragRef.current=null;setDragging(null)}} onKeyDown={e=>{if(e.key==='ArrowUp'&&index>0){e.preventDefault();moveNavigation(item.id,-1)}if(e.key==='ArrowDown'&&index<navigationItems.length-1){e.preventDefault();moveNavigation(item.id,1)}}}><IconGripVertical size={20} strokeWidth={2}/></button>
            </div>
          })}
        </Card>
      </ConfigSection>

      <ConfigSection icon={<IconBell size={15}/>} title="Notificações">
        <Card className="overflow-hidden shadow-[0_10px_28px_rgba(55,35,20,.045)]">
          <SettingRow icon={<IconBellRinging size={16}/>} label="Lembretes de cobranças e dívidas" caption={reminderCount?`${reminderCount} ${reminderCount===1?'lembrete cadastrado':'lembretes cadastrados'}`:'Nenhum lembrete cadastrado'}><Toggle checked={data.config.lembrete_mensal} onChange={()=>mutate(d=>{d.config.lembrete_mensal=!d.config.lembrete_mensal})}/></SettingRow>
        </Card>
      </ConfigSection>

      <ConfigSection icon={<IconInfoCircle size={15}/>} title="Sobre">
        <Card className="overflow-hidden shadow-[0_10px_28px_rgba(55,35,20,.045)]">
          <SettingRow icon={<img src="/aurvm-icon.svg" alt="Logo do Aurvm" className="h-8 w-8 rounded-[10px] shadow-[0_5px_14px_rgba(17,17,22,.18)]"/>} label="Aurvm" caption="Gestão financeira pessoal"><span className="font-mono text-[9px] text-t3">v0.1.0</span></SettingRow>
          <SettingRow icon={<IconUser size={17}/>} label="Desenvolvedor" caption="Arthur Macedo"><IconChevronRight size={14} className="text-t3"/></SettingRow>
        </Card>
      </ConfigSection>

      <Button onClick={logout} className="h-12 w-full border border-red bg-surface text-red shadow-[0_10px_28px_rgba(55,35,20,.045)]"><IconLogout size={16}/>Sair da conta</Button>
    </div>
  </div>{pendingImport&&<ConfirmDialog title="Restaurar este backup?" message="A restauração substituirá todos os dados atuais deste aparelho. Exporte um backup atual antes de continuar, se precisar preservá-los." confirmLabel="Restaurar backup" onConfirm={applyImport} onCancel={()=>setPendingImport(null)}/>}</>
}

function ConfigSection({icon,title,children}:{icon:ReactNode;title:string;children:ReactNode}){
  return <section><div className="mb-2.5 flex items-center gap-2 text-accent"><span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10">{icon}</span><h2 className="font-display text-[11px] font-semibold uppercase tracking-[.12em] text-t2">{title}</h2></div>{children}</section>
}

function SettingRow({icon,label,caption,children}:{icon:ReactNode;label:string;caption:string;children:ReactNode}){
  return <div className="flex items-center border-b border-border px-4 py-4 last:border-0"><span className="mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">{icon}</span><div className="min-w-0 flex-1"><p className="text-[13px] font-semibold text-t1">{label}</p><p className="mt-1 text-[10px] text-t3">{caption}</p></div><div className="flex items-center gap-1">{children}</div></div>
}

function GoogleDriveMark({className}:{className?:string}){
  return <svg aria-hidden="true" viewBox="0 0 256 229" className={className}>
    <path fill="#0066DA" d="m19.35 196.03 11.29 19.5c2.35 4.11 5.72 7.33 9.68 9.68 11.34-14.39 19.23-25.44 23.68-33.14 4.51-7.81 10.06-20.03 16.64-36.65-17.74-2.34-31.18-3.5-40.32-3.5-8.78 0-22.22 1.16-40.32 3.5 0 4.55 1.17 9.09 3.52 13.2Z"/>
    <path fill="#EA4335" d="M215.68 225.21c3.96-2.34 7.33-5.57 9.68-9.68l4.69-8.06 22.43-38.85A26.57 26.57 0 0 0 256 155.42c-18.21-2.34-31.63-3.5-40.25-3.5-9.27 0-22.69 1.16-40.24 3.5 6.5 16.72 11.97 28.94 16.42 36.65 4.48 7.79 12.4 18.84 23.75 33.14"/>
    <path fill="#00832D" d="M128 73.31c13.12-15.84 22.16-28.06 27.13-36.65 4-6.92 8.4-17.97 13.2-33.14C164.36 1.17 159.82 0 155.12 0h-54.25c-4.69 0-9.23 1.32-13.19 3.52 6.1 17.4 11.28 29.78 15.54 37.15 4.7 8.14 12.96 19.02 24.78 32.64"/>
    <path fill="#2684FC" d="M175.36 155.42H80.64l-40.32 69.79c3.96 2.35 8.5 3.52 13.2 3.52h148.96c4.7 0 9.24-1.32 13.2-3.52Z"/>
    <path fill="#00AC47" d="M128 73.31 87.68 3.52c-3.96 2.34-7.33 5.57-9.68 9.68L3.52 142.22A26.57 26.57 0 0 0 0 155.42h80.64Z"/>
    <path fill="#FFBA00" d="m215.24 77.71-37.24-64.51c-2.35-4.11-5.72-7.33-9.68-9.68L128 73.31l47.36 82.11h80.5c0-4.55-1.18-9.09-3.52-13.2Z"/>
  </svg>
}
