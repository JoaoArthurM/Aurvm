import { useState, type ReactNode } from 'react'
import {
  IconCalendarStats as CalendarRange, IconCashBanknoteMinus, IconCashBanknotePlus,
  IconCalendar, IconCheck, IconChevronDown, IconChevronLeft as ChevronLeft, IconChevronRight as ChevronRight, IconCreditCard, IconPencil,
  IconEye, IconEyeOff, IconPigMoney, IconPlus as Plus, IconReceiptDollar, IconRepeat, IconSearch as Search,
  IconSortAscendingLetters, IconSortDescendingNumbers, IconStarFilled, IconTag, IconTrash, IconX as X,
} from '@tabler/icons-react'
import { AddButton, Button, Card, Input, MoneyInput } from '../components/ui'
import { Currency } from '../components/Currency'
import { cn, fluxMeta, getLimites, money, monthKey, ocorreEm, ocorreNoMes, saldoStyle, tempTiers, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import type { Cartao, FluxTipo } from '../lib/types'

const fluxIcons = { entrada: IconCashBanknotePlus, saida: IconCashBanknoteMinus, diario: IconReceiptDollar, economia: IconPigMoney, cartao: IconCreditCard } as const
function FluxTypeIcon({tipo,size=12}:{tipo:FluxTipo;size?:number}){const Icon=fluxIcons[tipo];return <Icon size={size} strokeWidth={2.4}/>}

const nextDueDate=(vencimento:number)=>{const today=new Date();const due=new Date(today.getFullYear(),today.getMonth(),vencimento);return due<=today?new Date(today.getFullYear(),today.getMonth()+1,vencimento):due}
const nextDueLabel=(vencimento:number)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(nextDueDate(vencimento)).replace('.','')
// 5º dia útil: conta segunda a sábado, pulando apenas domingos.
const quintoDiaUtil=(d:Date)=>{const total=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();let uteis=0;for(let day=1;day<=total;day++){const wd=new Date(d.getFullYear(),d.getMonth(),day).getDay();if(wd!==0){uteis++;if(uteis===5)return day}}return 0}
const quintoDiaUtilISO=(d:Date)=>`${monthKey(d)}-${String(quintoDiaUtil(d)).padStart(2,'0')}`

type FluxTab='saldos'|'totais'|'tags'|'menu'
export function Flux(){
 const {data}=useFinancas(); const [monthOffset,setMonthOffset]=useState(0); const [tab,setTab]=useState<FluxTab>('saldos');const [horizon,setHorizon]=useState(false);const [adding,setAdding]=useState(false)
 const base=new Date(2026,6+monthOffset,1);const key=monthKey(base);const label=new Intl.DateTimeFormat('pt-BR',{month:'short',year:'2-digit'}).format(base).replace('.','')
 return <div className="page min-h-full bg-bg"><header className="px-5 pt-[14px]"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-accent">Fluxo diário</p><div className="flex items-center justify-between"><h1 className="font-display text-[26px] font-semibold leading-none tracking-[-1.2px] text-t1">{label}</h1><div className="flex items-center gap-1.5"><button aria-label="Mês anterior" onClick={()=>setMonthOffset(x=>x-1)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-t2 transition active:scale-95"><ChevronLeft size={16}/></button><button aria-label="Próximo mês" onClick={()=>setMonthOffset(x=>x+1)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-t2 transition active:scale-95"><ChevronRight size={16}/></button><button aria-label="Horizonte de saldos" onClick={()=>setHorizon(true)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-t2 transition active:scale-95"><CalendarRange size={16}/></button><button aria-label="Nova movimentação" onClick={()=>setAdding(true)} className="grid h-9 w-9 place-items-center rounded-full bg-flux text-white transition active:scale-95"><Plus size={17} strokeWidth={2.4}/></button></div></div></header>
 <div className="sticky top-0 z-20 mt-[10px] grid grid-cols-4 border-b border-border bg-bg/95 backdrop-blur">{(['saldos','totais','tags','menu'] as FluxTab[]).map(x=><button onClick={()=>setTab(x)} key={x} className={cn('border-b-2 border-transparent py-[10px] text-xs font-semibold capitalize text-t3 transition',tab===x&&'border-flux text-flux')}>{x}</button>)}</div>
 <div className={cn('pb-6',tab!=='saldos'&&'px-4 pt-4')}>{tab==='saldos'&&<Saldos month={base}/>} {tab==='totais'&&<Totais monthKey={key}/>} {tab==='tags'&&<Tags monthKey={key}/>} {tab==='menu'&&<FluxMenu/>}</div>
 {horizon&&<Horizon close={()=>setHorizon(false)}/>} {adding&&<NewTransaction close={()=>setAdding(false)}/>}</div>
}

type SaldoFilter='total'|FluxTipo
function Saldos({month}:{month:Date}){
 const data=useFinancas(s=>s.data);const hidden=useFinancas(s=>s.valuesHidden)
 const [filter,setFilter]=useState<SaldoFilter>('total')
 const [filterOpen,setFilterOpen]=useState(false)
 const [openDay,setOpenDay]=useState<number|null>(null)
 const currentKey=monthKey(month);const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();const nowDay=17
 const limites=getLimites(data.flux.temperatura)
 const nextDate=new Date(month.getFullYear(),month.getMonth()+1,1)
 const nextNet=data.flux.lancamentos.filter(l=>ocorreNoMes(l,monthKey(nextDate))).reduce((a,l)=>a+(l.tipo==='entrada'?l.valor:-l.valor),0)
 const monthHead=(d:Date)=>`${new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(d).replace('.','')}/${String(d.getFullYear()).slice(2)}`
 const nextDays=new Date(nextDate.getFullYear(),nextDate.getMonth()+1,0).getDate()
 let balance=data.perfil.saldo_inicial
 const rows=Array.from({length:days},(_,i)=>{const day=i+1;const date=`${currentKey}-${String(day).padStart(2,'0')}`;const tx=data.flux.lancamentos.filter(l=>ocorreEm(l,date));tx.forEach(l=>balance+=l.tipo==='entrada'?l.valor:-l.valor);const projetado=balance+nextNet-data.flux.valor_diario_planejado*Math.max(0,day-nowDay);return{day,date,tx,saldo:balance,projetado}})
 const dayValue=(tx:typeof rows[number]['tx'])=>filter==='total'?tx.reduce((a,l)=>a+(l.tipo==='entrada'?l.valor:-l.valor),0):tx.filter(l=>l.tipo===filter).reduce((a,l)=>a+l.valor,0)
 const isSunday=(d:Date,day:number)=>new Date(d.getFullYear(),d.getMonth(),day).getDay()===0
 const weekday=(d:Date,day:number)=>new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(new Date(d.getFullYear(),d.getMonth(),day)).replace('.','').slice(0,3)
 const cols='grid-cols-[minmax(0,1fr)_46px_68px_46px_68px]'
 return <Card className="rounded-none border-x-0">
  <div style={{background:'color-mix(in srgb, var(--el) 60%, var(--surface))'}} className={cn('sticky top-[38px] z-10 grid items-center border-b border-border py-2 text-[9px] font-bold uppercase tracking-wider text-t3',cols)}>
   <div className="relative ml-2 w-max">
    <button aria-label="Filtrar transações por tipo" aria-expanded={filterOpen} onClick={()=>setFilterOpen(v=>!v)} className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface pl-1.5 pr-2.5 text-[9px] font-bold uppercase tracking-wider text-t1 transition active:scale-95">
     <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full" style={filter==='total'?{color:'var(--t2)',background:'var(--el)'}:{color:'#FFF',background:fluxMeta[filter].color}}>{filter==='total'?<i className="h-1.5 w-1.5 rounded-full bg-t2"/>:<FluxTypeIcon tipo={filter} size={10}/>}</span>
     {filter==='total'?'Total':fluxMeta[filter].label}
     <IconChevronDown size={11} className={cn('text-t3 transition',filterOpen&&'rotate-180')}/>
    </button>
    {filterOpen&&<>
     <div className="fixed inset-0 z-20" onClick={()=>setFilterOpen(false)}/>
     <div className="absolute left-0 top-[33px] z-30 w-44 overflow-hidden rounded-[16px] border border-border bg-surface shadow-[0_14px_34px_rgba(30,30,45,.16)]">
      {(['total',...(Object.keys(fluxMeta) as FluxTipo[])] as SaldoFilter[]).map(opt=><button key={opt} onClick={()=>{setFilter(opt);setFilterOpen(false)}} className={cn('flex w-full items-center gap-2.5 border-b border-border/60 px-3 py-2.5 text-left text-[10px] font-bold normal-case tracking-normal transition last:border-0 active:bg-el/60',filter===opt?'text-t1':'text-t2')}>
       <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={opt==='total'?{color:'var(--t2)',background:'var(--el)'}:{color:'#FFF',background:fluxMeta[opt as FluxTipo].color}}>{opt==='total'?<i className="h-1.5 w-1.5 rounded-full bg-t2"/>:<FluxTypeIcon tipo={opt as FluxTipo} size={12}/>}</span>
       <span className="flex-1">{opt==='total'?'Total':fluxMeta[opt as FluxTipo].label}</span>
       {filter===opt&&<IconCheck size={13} className="shrink-0 text-flux"/>}
      </button>)}
     </div>
    </>}
   </div>
   <span className="col-span-2 text-center">{monthHead(month)}</span>
   <span className="col-span-2 text-center opacity-60">{monthHead(nextDate)}</span>
  </div>
  {rows.map(row=>{
   const value=dayValue(row.tx)
   const open=openDay===row.day
   const valueColor=filter==='total'?(value>0?'var(--green)':'var(--red)'):fluxMeta[filter].color
   const nextExists=row.day<=nextDays
   const DayCell=({date,exists=true}:{date:Date;exists?:boolean})=><span className={cn('number flex items-center justify-center border-l border-border/60 bg-el/40 text-[10px] font-bold',!exists&&'opacity-0',isSunday(date,row.day)?'text-red':'text-t2',row.day===nowDay&&'text-flux')}><span className="relative">{row.day===quintoDiaUtil(date)&&<IconStarFilled size={7} className="absolute -left-[10px] top-1/2 -translate-y-1/2 text-yellow"/>}{String(row.day).padStart(2,'0')}<span className="text-[8px] font-semibold opacity-70">/{weekday(date,row.day)}</span></span></span>
   return <div key={row.date} className="border-b border-border/60 last:border-0">
    <button onClick={()=>setOpenDay(open?null:row.day)} className={cn('grid min-h-[52px] w-full items-stretch text-left',cols,row.day===nowDay&&'bg-flux/5')}>
     <span className="flex items-center gap-1.5 pl-2 pr-1">
      {value!==0
       ?<><span className="grid h-5 w-5 shrink-0 place-items-center rounded-md" style={{color:valueColor,background:`color-mix(in srgb, ${valueColor} 12%, transparent)`}}>{filter==='total'?<FluxTypeIcon tipo={value>0?'entrada':'saida'} size={11}/>:<FluxTypeIcon tipo={filter} size={11}/>}</span><Currency value={value} className="text-[11px] font-bold" style={{color:valueColor}}/></>
       :<Currency value={0} className="text-[11px] text-t3/50"/>}
     </span>
     <DayCell date={month}/>
     <span className="flex items-center justify-end pr-1.5" style={saldoStyle(row.saldo,limites)}>
      <b className="number text-[11px] font-bold">{hidden?'••••':money(row.saldo)}</b>
     </span>
     <DayCell date={nextDate} exists={nextExists}/>
     {nextExists
      ?<span className="flex items-center justify-end pr-1.5 opacity-80" style={saldoStyle(row.projetado,limites)}><b className="number text-[11px] font-bold">{hidden?'••••':money(row.projetado)}</b></span>
      :<span className="bg-el/30"/>}
    </button>
    {open&&row.tx.length>0&&<div className="space-y-1.5 border-t border-border/60 bg-el/40 px-3 py-2.5">
     {row.tx.map(tx=>{const tg=tx.tag_id?data.flux.tags.find(t=>t.id===tx.tag_id):null;return <div key={tx.id} className="flex items-center gap-2.5 rounded-[12px] border border-border/70 bg-surface px-2.5 py-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-white" style={{background:fluxMeta[tx.tipo].color}}><FluxTypeIcon tipo={tx.tipo} size={13}/></span>
      <span className="min-w-0 flex-1">
       <span className="block truncate text-[11px] font-semibold text-t1">{tx.descricao}</span>
       <span className="mt-0.5 flex items-center gap-1.5 text-[9px] text-t3">{tx.repete&&<IconRepeat size={9} strokeWidth={2.6}/>}{typeSingular[tx.tipo]}{tg&&<span className="inline-flex items-center gap-[3px] rounded-md px-1.5 py-[2px] text-[8px] font-bold" style={{color:tg.cor,background:`${tg.cor}14`}}><IconTag size={9} strokeWidth={2.6}/>{tg.label}</span>}</span>
      </span>
      <Currency value={tx.valor} className="shrink-0 text-[11px] font-bold" style={{color:fluxMeta[tx.tipo].color}}/>
     </div>})}
    </div>}
   </div>
  })}
 </Card>
}

function ChainIcon({tipo,dashed}:{tipo:FluxTipo;dashed?:boolean}){return <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full',dashed&&'border border-dashed')} style={{color:fluxMeta[tipo].color,background:dashed?'transparent':`${fluxMeta[tipo].color}18`,borderColor:dashed?fluxMeta[tipo].color:undefined}}><FluxTypeIcon tipo={tipo} size={11}/></span>}
function ChainOp({children}:{children:string}){return <span className="text-[10px] font-bold text-t3">{children}</span>}
function CalcRow({label,chain,value,status}:{label:string;chain:ReactNode;value:ReactNode;status:ReactNode}){
 return <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5 last:border-0">
  <div className="min-w-0"><p className="text-[12px] font-semibold text-t1">{label}</p><div className="mt-1.5 flex flex-wrap items-center gap-1">{chain}</div></div>
  <div className="shrink-0 text-right"><div>{value}</div><p className="mt-1 text-[9px] text-t3">{status}</p></div>
 </div>
}
function FluxSection({label,children}:{label:string;children:ReactNode}){return <section><p className="mb-1.5 flex items-center px-[6px] text-[10px] font-extrabold uppercase tracking-[1px] text-t3"><i className="mark-diamond"/>{label}</p>{children}</section>}

function Totais({monthKey:key}:{monthKey:string}){const data=useFinancas(s=>s.data);const tx=data.flux.lancamentos.filter(l=>ocorreNoMes(l,key));const sums=(type:FluxTipo)=>tx.filter(l=>l.tipo===type).reduce((a,b)=>a+b.valor,0);const entrada=sums('entrada'),saida=sums('saida'),diario=sums('diario'),economia=sums('economia'),cartao=sums('cartao');const perf=entrada-saida-diario-economia-cartao;const rate=entrada?economia/entrada*100:0;const daysPassed=Math.max(1,17);const remaining=Math.max(0,new Date(Number(key.slice(0,4)),Number(key.slice(5,7)),0).getDate()-daysPassed);const custo=saida+diario+cartao;const mediaDiaria=diario/daysPassed;const planejado=data.flux.valor_diario_planejado
return <div className="space-y-5">
 <FluxSection label="Cálculos do mês">
  <Card className="overflow-hidden">
   <CalcRow label="Performance" chain={<><ChainIcon tipo="entrada"/><ChainOp>−</ChainOp><ChainIcon tipo="saida"/><ChainOp>−</ChainOp><ChainIcon tipo="diario"/><ChainOp>−</ChainOp><ChainIcon tipo="economia"/><ChainOp>−</ChainOp><ChainIcon tipo="cartao"/></>} value={<Currency value={perf} className={cn('text-[15px] font-bold',perf>=0?'text-green':'text-red')}/>} status={perf>=0?'sobrou dinheiro':'faltou dinheiro'}/>
   <CalcRow label="Economizado" chain={<><ChainIcon tipo="economia"/><span className="h-1.5 w-14 overflow-hidden rounded-full bg-el"><i className="block h-full rounded-full bg-green" style={{width:`${Math.min(100,rate)}%`}}/></span><ChainIcon tipo="entrada"/></>} value={<span className="number text-[15px] font-bold text-green">{rate.toFixed(1).replace('.',',')}%</span>} status={rate>=20?'acima do ideal':'abaixo do ideal'}/>
   <CalcRow label="Custo de vida" chain={<><ChainIcon tipo="saida"/><ChainOp>+</ChainOp><ChainIcon tipo="diario"/><ChainOp>+</ChainOp><ChainIcon tipo="cartao"/></>} value={<Currency value={custo} className="text-[15px] font-bold text-t1"/>} status={custo<=entrada?'dentro da renda':'acima da renda'}/>
   <CalcRow label="Diário médio" chain={<><ChainIcon tipo="diario"/><ChainOp>/</ChainOp><span className="number text-[10px] font-bold text-t2">{daysPassed}</span></>} value={<Currency value={mediaDiaria} className="text-[15px] font-bold text-t1"/>} status={<span className="flex items-center justify-end gap-1"><ChainIcon tipo="diario" dashed/><Currency value={planejado}/></span>}/>
  </Card>
 </FluxSection>
 <FluxSection label="Movimentações do mês">
  <Card className="overflow-hidden">{(Object.keys(fluxMeta) as FluxTipo[]).map(type=><div key={type} className="flex items-center border-b border-border px-4 py-3 last:border-0"><span className="mr-3 grid h-7 w-7 place-items-center rounded-lg" style={{color:fluxMeta[type].color,background:`${fluxMeta[type].color}18`}}><FluxTypeIcon tipo={type} size={14}/></span><span className="flex-1 text-[11px] font-semibold text-t2">{fluxMeta[type].label}</span><Currency value={sums(type)} className="text-xs font-bold"/></div>)}</Card>
 </FluxSection>
 <FluxSection label="Previsão de diários do mês">
  <Card className="border-dashed border-flux/40 p-4">
   <div className="flex items-center justify-between"><span className="flex items-center gap-2"><ChainIcon tipo="diario" dashed/><span className="text-[11px] font-semibold text-t1">Previsão de diário <span className="text-t3">× {remaining}</span></span></span><Currency value={remaining*planejado} className="text-xs font-bold text-flux"/></div>
   <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-[9px] text-t3"><span>no ritmo atual · média <Currency value={mediaDiaria}/> × {remaining} dias</span><Currency value={mediaDiaria*remaining} className="text-[11px] font-bold" style={{color:mediaDiaria<=planejado?'var(--green)':'var(--red)'}}/></div>
  </Card>
 </FluxSection>
</div>}

function Tags({monthKey:key}:{monthKey:string}){
 const {data,mutate}=useFinancas();const [search,setSearch]=useState('')
 const [sort,setSort]=useState<'valor'|'nome'>('valor')
 const [showHidden,setShowHidden]=useState(false)
 const totalOf=(id:string)=>data.flux.lancamentos.filter(l=>ocorreNoMes(l,key)&&l.tag_id===id).reduce((a,b)=>a+b.valor,0)
 const enriched=data.flux.tags.map(tag=>({tag,total:totalOf(tag.id)})).filter(({tag})=>tag.label.toLowerCase().includes(search.toLowerCase()))
 const sorted=[...enriched].sort((a,b)=>sort==='nome'?a.tag.label.localeCompare(b.tag.label,'pt-BR'):b.total-a.total)
 const visiveis=sorted.filter(({tag})=>!tag.oculta)
 const ocultas=sorted.filter(({tag})=>tag.oculta)
 const toggleHide=(id:string)=>mutate(d=>{const tag=d.flux.tags.find(x=>x.id===id);if(tag)tag.oculta=!tag.oculta})
 const TagRow=({tag,total,hiddenRow}:{tag:typeof data.flux.tags[number];total:number;hiddenRow?:boolean})=><div className={cn('flex items-center border-b border-border px-4 py-3.5 last:border-0',hiddenRow&&'opacity-60')}>
  <span className="mr-3 grid h-9 w-9 place-items-center rounded-xl" style={{color:tag.cor,background:`${tag.cor}18`}}><IconTag size={16}/></span>
  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{tag.label}</p><p className="mt-1 text-[9px] text-t3">Total do mês</p></div>
  <Currency value={total} className="text-xs font-bold" style={{color:tag.cor}}/>
  <button aria-label={tag.oculta?`Mostrar ${tag.label}`:`Ocultar ${tag.label}`} onClick={()=>toggleHide(tag.id)} className="ml-2.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-el/60 text-t3 transition active:scale-95">{tag.oculta?<IconEye size={13}/>:<IconEyeOff size={13}/>}</button>
 </div>
 return <div>
  <div className="mb-4 flex items-center gap-2">
   <div className="relative flex-1"><Search className="absolute left-3 top-3 text-t3" size={15}/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filtrar tags" className="pl-9 focus:border-flux"/></div>
   <div className="flex h-11 items-center rounded-xl bg-el p-[3px]">
    <button aria-label="Ordenar por valor" onClick={()=>setSort('valor')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition',sort==='valor'?'bg-surface text-flux shadow-[0_2px_7px_rgba(45,31,23,.09)]':'text-t3')}><IconSortDescendingNumbers size={15}/></button>
    <button aria-label="Ordenar por nome" onClick={()=>setSort('nome')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition',sort==='nome'?'bg-surface text-flux shadow-[0_2px_7px_rgba(45,31,23,.09)]':'text-t3')}><IconSortAscendingLetters size={15}/></button>
   </div>
  </div>
  <Card className="overflow-hidden">{visiveis.map(({tag,total})=><TagRow key={tag.id} tag={tag} total={total}/>)}{visiveis.length===0&&<p className="px-4 py-6 text-center text-[10px] text-t3">Nenhuma tag visível</p>}</Card>
  {ocultas.length>0&&<>
   <button onClick={()=>setShowHidden(v=>!v)} className="mt-3 flex w-full items-center justify-center gap-1.5 py-1 text-[10px] font-semibold text-t3 transition active:scale-95"><IconEyeOff size={12}/>Ocultas ({ocultas.length})<IconChevronDown size={12} className={cn('transition',showHidden&&'rotate-180')}/></button>
   {showHidden&&<Card className="mt-2 overflow-hidden">{ocultas.map(({tag,total})=><TagRow key={tag.id} tag={tag} total={total} hiddenRow/>)}</Card>}
  </>}
 </div>
}

function FluxMenu(){
 const {data,mutate}=useFinancas()
 const cartoes=data.flux.cartoes??[]
 const [addingCard,setAddingCard]=useState(false)
 return <div className="space-y-3">
  <Card className="p-4"><p className="text-xs font-semibold">Planejamento diário</p><p className="mt-1 text-[9px] text-t3">Valor usado nas previsões futuras</p><MoneyInput value={data.flux.valor_diario_planejado} onValueChange={value=>mutate(d=>{d.flux.valor_diario_planejado=value})} className="number mt-4 focus-within:border-flux"/></Card>
  <Card className="p-4">
   <div className="flex items-center justify-between"><div><p className="text-xs font-semibold">Cartões</p><p className="mt-1 text-[9px] text-t3">Fechamento e vencimento das faturas</p></div>{!addingCard&&<AddButton onClick={()=>setAddingCard(true)}>Novo</AddButton>}</div>
   <div className="mt-3 space-y-2">
    {cartoes.map(card=><div key={card.id} className="flex items-center gap-2.5 rounded-[14px] border border-border bg-el/40 p-3">
     <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-flux/10 text-flux"><IconCreditCard size={17}/></span>
     <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-t1">{card.nome}</p><p className="mt-0.5 text-[9px] text-t3">fecha dia {card.fechamento} · vence dia {card.vencimento}</p></div>
     <div className="shrink-0 text-right"><p className="text-[8px] font-bold uppercase tracking-[.5px] text-t3">Próx. venc.</p><p className="number mt-0.5 text-[11px] font-bold text-flux">{nextDueLabel(card.vencimento)}</p></div>
     <button aria-label={`Excluir cartão ${card.nome}`} onClick={()=>mutate(d=>{d.flux.cartoes=(d.flux.cartoes??[]).filter(x=>x.id!==card.id)})} className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-red/25 bg-red/5 text-red transition active:scale-95"><IconTrash size={12}/></button>
    </div>)}
    {cartoes.length===0&&!addingCard&&<p className="rounded-[14px] border border-dashed border-border px-3 py-4 text-center text-[10px] text-t3">Nenhum cartão cadastrado</p>}
   </div>
   {addingCard&&<NewCard close={()=>setAddingCard(false)}/>}
  </Card>
  <TemperaturaCard/>
 </div>
}

function TemperaturaCard(){
 const {data,mutate}=useFinancas()
 const limites=getLimites(data.flux.temperatura)
 const setLimite=(index:number,value:number)=>mutate(d=>{const arr=[...getLimites(d.flux.temperatura)];arr[index]=value;d.flux.temperatura={limites:arr}})
 return <Card className="p-4">
  <p className="text-xs font-semibold">Temperatura do saldo</p>
  <p className="mt-1 text-[9px] text-t3">As cores são fixas — ajuste os limites de valor à sua renda</p>
  <div className="mt-3 flex h-3 overflow-hidden rounded-full">{tempTiers.map(tier=><span key={tier.label} className="flex-1" style={{background:tier.bg}}/>)}</div>
  <div className="mt-3 space-y-1.5">
   {tempTiers.map((tier,index)=>{
    const last=index===tempTiers.length-1
    const editable=!last&&index>=2
    return <div key={tier.label} className="flex items-center gap-2.5">
     <span className="number grid h-8 w-10 shrink-0 place-items-center rounded-[8px] text-[10px] font-bold" style={{background:tier.bg,color:tier.fg}}>123</span>
     <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-t1">{tier.label}</span><span className="block text-[8px] text-t3">{last?'acima de':'até'}</span></span>
     {editable
      ?<MoneyInput aria-label={`Limite da faixa ${tier.label}`} value={limites[index]} onValueChange={value=>setLimite(index,value)} className="number h-8 w-28 rounded-[10px] border-border bg-surface px-2.5 text-xs"/>
      :<Currency value={limites[Math.min(index,limites.length-1)]} className="pr-2.5 text-xs font-bold text-t2"/>}
    </div>
   })}
  </div>
 </Card>
}

function NewCard({close}:{close:()=>void}){
 const mutate=useFinancas(s=>s.mutate)
 const [nome,setNome]=useState('');const [fechamento,setFechamento]=useState(8);const [vencimento,setVencimento]=useState(15)
 const chip='inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[10px] font-semibold text-t2'
 const clampDay=(value:number)=>Math.min(31,Math.max(1,value||1))
 return <div className="mt-3 rounded-[14px] bg-el p-3">
  <Input autoFocus placeholder="Nome do cartão" value={nome} onChange={e=>setNome(e.target.value)} className="h-9 bg-surface focus:border-flux"/>
  <div className="mt-2 flex flex-wrap items-center gap-2">
   <label className={chip}>fecha dia<input type="number" min="1" max="31" value={fechamento} onChange={e=>setFechamento(clampDay(Number(e.target.value)))} className="no-spin w-7 bg-transparent text-center outline-none"/></label>
   <label className={chip}>vence dia<input type="number" min="1" max="31" value={vencimento} onChange={e=>setVencimento(clampDay(Number(e.target.value)))} className="no-spin w-7 bg-transparent text-center outline-none"/></label>
   <span className="ml-auto text-[9px] font-semibold text-flux">próx.: {nextDueLabel(vencimento)}</span>
  </div>
  <div className="mt-2.5 flex gap-2">
   <Button disabled={!nome.trim()} onClick={()=>{mutate(d=>{d.flux.cartoes=[...(d.flux.cartoes??[]),{id:uid(),nome:nome.trim(),fechamento,vencimento}]});close()}} className="h-8 flex-1 bg-flux text-xs">Salvar cartão</Button>
   <button onClick={close} className="grid h-8 w-8 place-items-center rounded-xl border border-border bg-surface text-t3"><X size={14}/></button>
  </div>
 </div>
}

function Horizon({close}:{close:()=>void}){
 const data=useFinancas(s=>s.data);const hidden=useFinancas(s=>s.valuesHidden);const limites=getLimites(data.flux.temperatura)
 let running=data.perfil.saldo_inicial
 const months=Array.from({length:6},(_,i)=>new Date(2026,6+i,1)).map(start=>{
  const total=new Date(start.getFullYear(),start.getMonth()+1,0).getDate()
  const dias=Array.from({length:total},(_,i)=>{
   const day=i+1
   const date=`${monthKey(start)}-${String(day).padStart(2,'0')}`
   data.flux.lancamentos.filter(l=>ocorreEm(l,date)).forEach(l=>{running+=l.tipo==='entrada'?l.valor:-l.valor})
   const dt=new Date(start.getFullYear(),start.getMonth(),day)
   return{day,saldo:running,domingo:dt.getDay()===0,wd:new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(dt).replace('.','').slice(0,3)}
  })
  return{start,dias}
 })
 return <div className="absolute inset-0 z-50 overflow-auto bg-bg">
  <header className="safe-top sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/95 px-5 pb-4 backdrop-blur"><div><p className="text-[10px] font-bold uppercase tracking-wider text-flux">Horizonte</p><h2 className="mt-1 text-lg font-bold">Saldos futuros</h2></div><button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-el"><X size={16}/></button></header>
  <div className="flex w-max gap-2 p-4">
   {months.map(({start,dias})=><div key={String(start)} className="w-[168px]">
    <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-t3">{new Intl.DateTimeFormat('pt-BR',{month:'short',year:'2-digit'}).format(start).replace('.','')}</p>
    <div className="overflow-hidden rounded-[10px] border border-border">
     {dias.map(({day,saldo,domingo,wd})=><div key={day} className="grid grid-cols-[52px_1fr] border-b border-border/60 last:border-0">
      <span className={cn('number flex items-center justify-center bg-el/50 py-[8px] text-[11px] font-bold',domingo?'text-red':'text-t2')}><span>{String(day).padStart(2,'0')}<span className="text-[9px] font-semibold opacity-70">/{wd}</span></span></span>
      <span className="number flex items-center justify-end pr-2 text-[11px] font-semibold" style={saldoStyle(saldo,limites)}>{hidden?'••••':money(saldo)}</span>
     </div>)}
    </div>
   </div>)}
  </div>
 </div>
}

const typeSingular:Record<FluxTipo,string>={entrada:'entrada',saida:'saída',diario:'diário',economia:'economia',cartao:'gasto com cartão'}
const typeHint:Record<FluxTipo,string>={entrada:'salário, comissão, vales',saida:'gastos fixos, boletos, aluguel',diario:'gastos variáveis, compras',economia:'reserva, investimento',cartao:'gastos ou total da fatura'}

function NewTransaction({close}:{close:()=>void}){
 const {data,mutate}=useFinancas()
 const [type,setType]=useState<FluxTipo|null>(null)
 const [desc,setDesc]=useState('');const [value,setValue]=useState(0);const [tag,setTag]=useState('')
 const [date,setDate]=useState(new Date().toISOString().slice(0,10))
 const [repete,setRepete]=useState(false)
 const [vezes,setVezes]=useState(0)
 const cartoes:Cartao[]=data.flux.cartoes??[]
 const [cartaoId,setCartaoId]=useState(cartoes[0]?.id??'')
 const cartao=cartoes.find(c=>c.id===cartaoId)
 const hoje=new Date()
 const quintoTarget=hoje.toISOString().slice(0,10)<=quintoDiaUtilISO(hoje)?quintoDiaUtilISO(hoje):quintoDiaUtilISO(new Date(hoje.getFullYear(),hoje.getMonth()+1,1))
 const isQuinto=date===quintoTarget
 const color=type?fluxMeta[type].color:'var(--flux-orange)'
 const row='flex min-h-[54px] items-center gap-3 border-b border-border last:border-0'
 return <div className="absolute inset-0 z-50 flex items-end bg-black/70" onClick={close}>
  <div onClick={e=>e.stopPropagation()} className="safe-bottom max-h-[88%] w-full overflow-y-auto rounded-t-[28px] border-t border-border bg-surface px-5 pb-5 pt-2.5 shadow-[0_-18px_44px_rgba(0,0,0,.14)]">
   <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-border"/>
   {!type?<>
    <div className="mb-1 flex items-center justify-between"><h2 className="text-lg font-bold">Adicionar</h2><button aria-label="Fechar" onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-el text-t2 transition active:scale-95"><X size={15}/></button></div>
    {(Object.keys(fluxMeta) as FluxTipo[]).map(x=><button key={x} onClick={()=>setType(x)} className="flex w-full items-center gap-3.5 border-b border-border py-[15px] text-left transition last:border-0 active:bg-el/50">
     <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white" style={{background:fluxMeta[x].color}}><FluxTypeIcon tipo={x} size={19}/></span>
     <span className="min-w-0"><b className="block text-[15px] font-bold text-t1">{typeSingular[x]}</b><span className="mt-0.5 block text-[11px] text-t3">{typeHint[x]}</span></span>
    </button>)}
   </>:<>
    <p className="px-1 pt-1 text-[10px] font-bold uppercase tracking-[.8px] text-t3">valor</p>
    <MoneyInput autoFocus aria-label="Valor" value={value} onValueChange={setValue} className="h-auto rounded-none border-0 bg-transparent px-1 pb-4 pt-1 text-[38px] font-black tracking-[-1.8px]" style={{color:value?color:undefined}}/>
    <button onClick={()=>setType(null)} className={cn(row,'w-full px-1 text-left transition active:bg-el/50')}>
     <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white" style={{background:color}}><FluxTypeIcon tipo={type} size={14}/></span>
     <span className="flex-1 text-sm font-semibold text-t1">{typeSingular[type]}</span><IconChevronDown size={15} className="text-t3"/>
    </button>
    <label className={cn(row,'px-1')}><IconPencil size={17} className="shrink-0 text-t3"/><input placeholder="descrição" value={desc} onChange={e=>setDesc(e.target.value)} className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-t1 outline-none placeholder:text-t3"/></label>
    <label className={cn(row,'px-1')}><IconCalendar size={17} className="shrink-0 text-t3"/><span className="flex-1 text-sm font-semibold text-t1">data</span>
     <button type="button" onClick={()=>setDate(quintoTarget)} className={cn('inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[9px] font-bold transition active:scale-95',isQuinto?'border-transparent bg-yellow/15 text-t1':'border-border text-t3')}><IconStarFilled size={9} className="text-yellow"/>5º útil</button>
     <input aria-label="Data" type="date" value={date} onChange={e=>setDate(e.target.value)} className="number bg-transparent text-right text-sm font-semibold text-t1 outline-none"/></label>
    <label className={cn(row,'px-1')}><IconRepeat size={17} className="shrink-0 text-t3"/>
     <select aria-label="Repetição" value={repete?'mensal':'nao'} onChange={e=>setRepete(e.target.value==='mensal')} className="h-full flex-1 appearance-none bg-transparent text-sm font-semibold text-t1 outline-none"><option value="nao">não repete</option><option value="mensal">repete todo mês</option></select>
     {repete&&<span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-border px-2.5 text-[10px] font-semibold text-t2">por<input aria-label="Quantidade de meses" type="number" min="0" max="120" value={vezes||''} placeholder="∞" onChange={e=>setVezes(Math.max(0,Math.min(120,Number(e.target.value)||0)))} className="no-spin w-8 bg-transparent text-center text-t1 outline-none"/>{vezes?(vezes===1?'mês':'meses'):'sem fim'}</span>}
     <IconChevronDown size={15} className="text-t3"/></label>
    {type==='cartao'&&cartoes.length>0&&<>
     <label className={cn(row,'px-1')}><IconCreditCard size={17} className="shrink-0 text-t3"/><select aria-label="Cartão" value={cartaoId} onChange={e=>setCartaoId(e.target.value)} className="h-full flex-1 appearance-none bg-transparent text-sm font-semibold text-t1 outline-none">{cartoes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select><IconChevronDown size={15} className="text-t3"/></label>
     {cartao&&<div className={cn(row,'px-1')}><IconCalendar size={17} className="shrink-0 text-t3"/><span className="flex-1 text-sm font-semibold text-t1">vencimento</span><span className="number text-sm font-semibold text-t2">{nextDueLabel(cartao.vencimento)}</span></div>}
    </>}
    <label className={cn(row,'px-1')}><IconTag size={17} className="shrink-0 text-t3"/><select aria-label="Tag" value={tag} onChange={e=>setTag(e.target.value)} className="h-full flex-1 appearance-none bg-transparent text-sm font-semibold outline-none" style={{color:tag?data.flux.tags.find(t=>t.id===tag)?.cor:'var(--t1)'}}><option value="">tags</option>{data.flux.tags.filter(t=>!t.oculta).map(t=><option key={t.id} value={t.id}>{t.label}</option>)}</select><IconChevronDown size={15} className="text-t3"/></label>
    <button disabled={!desc||!value} onClick={()=>{mutate(d=>d.flux.lancamentos.push({id:uid(),data:date,tipo:type,valor:value,descricao:desc,tag_id:tag||null,...(repete?{repete:{vezes:vezes>0?vezes:null}}:{})}));close()}} className="mt-5 h-[52px] w-full rounded-full text-sm font-bold text-white transition active:scale-[.98] disabled:opacity-40" style={{background:color}}>adicionar {typeSingular[type]}</button>
    <button onClick={close} className="mt-2 h-10 w-full text-sm font-bold text-t2 transition active:scale-95">cancelar</button>
   </>}
  </div>
 </div>
}
