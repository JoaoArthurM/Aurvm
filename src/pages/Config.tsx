import { useState, type ReactNode } from 'react'
import {
  IconArrowDown, IconArrowUp, IconBell, IconChevronRight, IconDeviceMobile, IconEye,
  IconEyeOff, IconInfoCircle, IconLayoutNavbar, IconLogout, IconMoon, IconPalette,
  IconRefresh, IconShieldCheck, IconSun, IconUser,
} from '@tabler/icons-react'
import { Button, Card, Toggle } from '../components/ui'
import { cn } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import { defaultNavigation, navigationLabels } from '../lib/navigation'
import type { Tab } from '../lib/types'

export function Config(){
  const {data,mutate,connected,accountName,syncStatus,connect,disconnect,logout}=useFinancas()
  const [error,setError]=useState('')
  const busy=syncStatus==='syncing'
  const setTheme=(tema:'light'|'dark')=>mutate(d=>{d.config.tema=tema})
  const navigationItems=data.config.navegacao??defaultNavigation
  const toggleNavigation=(id:Tab)=>{
    if(id==='config')return
    mutate(d=>{
      const items=d.config.navegacao??defaultNavigation.map(item=>({...item}))
      d.config.navegacao=items
      const item=items.find(item=>item.id===id)
      if(item)item.visivel=!item.visivel
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

  return <div className="page min-h-full pb-4 font-sans">
    <header className="px-5 pb-5 pt-4">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-accent">Preferências</p>
      <h1 className="font-display text-[30px] font-semibold leading-none tracking-[-1.4px] text-t1">Configurações</h1>
      <p className="mt-2 text-[12px] text-t2">Deixe o Aurvm com a sua cara.</p>
    </header>

    <div className="space-y-5 px-4">
      <ConfigSection icon={<GoogleDriveMark className="h-4 w-[18px]"/>} title="Conta e dados">
        <Card className="overflow-hidden shadow-[0_10px_28px_rgba(55,35,20,.045)]">
          <div className="flex items-center px-4 py-4">
            <div className={cn('mr-3 grid h-11 w-11 place-items-center rounded-[14px]',connected?'bg-green/10':'bg-el')}>
              {busy?<IconRefresh size={18} className="animate-spin text-accent"/>:<GoogleDriveMark className="h-6 w-7"/>} 
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-t1">{connected?(accountName??'Google Drive conectado'):'Google Drive desconectado'}</p>
              <p className="mt-1 text-[10px] text-t3">{connected?syncStatus==='synced'?'financas.json sincronizado':syncStatus==='error'?'Erro na última sincronização':'Sincronização ativa':'Seus dados estão apenas nesta sessão'}</p>
            </div>
            <Toggle checked={connected} onChange={async()=>{setError('');try{connected?await disconnect():await connect()}catch(e){setError(e instanceof Error?e.message:'Falha ao conectar')}}}/>
          </div>
          {error&&<p className="border-t border-border px-4 py-3 text-[10px] text-red">{error}</p>}
          <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-[9px] text-t3"><IconShieldCheck size={13} className="text-accent"/>Escopo privado drive.file · somente arquivos do Aurvm</div>
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
          {navigationItems.map((item,index)=>{
            const locked=item.id==='config'
            return <div key={item.id} className={cn('flex items-center border-b border-border px-3 py-3 last:border-0',!item.visivel&&'opacity-55')}>
              <button type="button" disabled={locked} onClick={()=>toggleNavigation(item.id)} aria-label={item.visivel?`Ocultar ${navigationLabels[item.id]}`:`Mostrar ${navigationLabels[item.id]}`} className={cn('mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-xl transition',item.visivel?'bg-[#238A5B]/10 text-[#238A5B]':'bg-el text-t3',locked&&'cursor-not-allowed')}>
                {item.visivel?<IconEye size={17}/>:<IconEyeOff size={17}/>} 
              </button>
              <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-t1">{navigationLabels[item.id]}</p><p className="mt-0.5 text-[9px] text-t3">{locked?'Sempre visível':item.visivel?'Visível no menu':'Oculta do menu'}</p></div>
              <div className="flex gap-1">
                <button type="button" disabled={index===0} onClick={()=>moveNavigation(item.id,-1)} aria-label={`Mover ${navigationLabels[item.id]} para cima`} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-el text-t2 transition active:scale-95 disabled:opacity-25"><IconArrowUp size={14}/></button>
                <button type="button" disabled={index===navigationItems.length-1} onClick={()=>moveNavigation(item.id,1)} aria-label={`Mover ${navigationLabels[item.id]} para baixo`} className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-el text-t2 transition active:scale-95 disabled:opacity-25"><IconArrowDown size={14}/></button>
              </div>
            </div>
          })}
        </Card>
      </ConfigSection>

      <ConfigSection icon={<IconBell size={15}/>} title="Notificações">
        <Card className="overflow-hidden shadow-[0_10px_28px_rgba(55,35,20,.045)]">
          <SettingRow icon={<IconBell size={16}/>} label="Alertas de gasto" caption="Avisar ao ultrapassar o planejado"><Toggle checked={data.config.alertas_gasto} onChange={()=>mutate(d=>{d.config.alertas_gasto=!d.config.alertas_gasto})}/></SettingRow>
          <SettingRow icon={<IconDeviceMobile size={16}/>} label="Lembrete mensal" caption={`Dia ${data.config.dia_lembrete} de cada mês`}><Toggle checked={data.config.lembrete_mensal} onChange={()=>mutate(d=>{d.config.lembrete_mensal=!d.config.lembrete_mensal})}/></SettingRow>
          {data.config.lembrete_mensal&&<div className="flex items-center gap-3 border-t border-border px-4 py-3"><span className="flex-1 text-[10px] text-t2">Dia do lembrete</span><input type="number" min="1" max="28" value={data.config.dia_lembrete} onChange={e=>mutate(d=>{d.config.dia_lembrete=Math.min(28,Math.max(1,Number(e.target.value)))})} className="number w-12 rounded-lg border border-border bg-el px-2 py-1.5 text-center text-xs text-t1 outline-none focus:border-accent"/></div>}
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
  </div>
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
