import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  IconCalendarStats as CalendarRange, IconCashBanknoteMinus, IconCashBanknotePlus,
  IconAdjustmentsDollar, IconArrowBadgeLeft, IconArrowBadgeRight, IconCalendar, IconCalendarMonth, IconCheck, IconChevronDown, IconChevronLeft as ChevronLeft, IconChevronRight as ChevronRight, IconCreditCard, IconPencil,
  IconEye, IconEyeOff, IconPigMoney, IconPlus as Plus, IconReceiptDollar, IconRepeat, IconSearch as Search,
  IconSortAscendingLetters, IconSortDescendingNumbers, IconStarFilled, IconTag, IconTrash, IconX as X,
} from '@tabler/icons-react'
import { AddButton, Button, Card, DangerButton, Input, MoneyInput } from '../components/ui'
import { AurvmDatePicker, AurvmSelect } from '../components/AurvmControls'
import { Currency } from '../components/Currency'
import { cn, fluxMeta, getLimites, money, monthKey, ocorreEm, ocorreNoMes, quintoDiaUtil, recurrenceOccurrenceIndex, saldoStyle, tempTiers, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import type { Cartao, FluxLancamento, FluxTipo, RepeticaoFrequencia } from '../lib/types'

const fluxIcons = { entrada: IconCashBanknotePlus, saida: IconCashBanknoteMinus, diario: IconReceiptDollar, economia: IconPigMoney, cartao: IconCreditCard } as const
function FluxTypeIcon({tipo,size=12}:{tipo:FluxTipo;size?:number}){const Icon=fluxIcons[tipo];return <Icon size={size} strokeWidth={2.4}/>}
function DailyPlanNotice({value}:{value:number}){return <div className="mt-2 flex items-center justify-center gap-2.5 rounded-[12px] border border-dashed bg-surface px-2.5 py-2" style={{borderColor:`${fluxMeta.diario.color}55`}}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px]" style={{color:fluxMeta.diario.color,background:`${fluxMeta.diario.color}14`}}><FluxTypeIcon tipo="diario" size={13}/></span><span className="min-w-0 text-center"><span className="block text-[11px] font-semibold text-t1">Previsão diária</span><span className="mt-0.5 block text-[9px] text-t3">planejamento automático</span></span><Currency value={value} className="shrink-0 text-[11px] font-bold" style={{color:fluxMeta.diario.color}}/></div>}
const recurrenceSuggestions=[2,3,4,5,6,7,8,9,10,11,12]
const recurrenceOptions=[
 {value:'mensal',label:'mensalmente',caption:'repete o mesmo valor mensalmente',icon:<IconRepeat size={13}/>,color:'var(--green)'},
 {value:'semanal',label:'semanalmente',caption:'repete o mesmo valor semanalmente',icon:<IconRepeat size={13}/>,color:'var(--green)'},
 {value:'diaria',label:'diariamente',caption:'repete o mesmo valor diariamente',icon:<IconRepeat size={13}/>,color:'var(--green)'},
 {value:'nao',label:'não repete',caption:'somente nesta data',icon:<IconCalendar size={13}/>,color:'var(--t2)'},
]

const cardDueDate=(year:number,month:number,vencimento:number)=>new Date(year,month,Math.min(vencimento,new Date(year,month+1,0).getDate()))
const nextDueDate=(vencimento:number)=>{const today=new Date();today.setHours(0,0,0,0);const due=cardDueDate(today.getFullYear(),today.getMonth(),vencimento);return due<today?cardDueDate(today.getFullYear(),today.getMonth()+1,vencimento):due}
const nextDueLabel=(vencimento:number)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(nextDueDate(vencimento)).replace('.','')
const cardBillingDates=(card:Cartao,reference=new Date())=>{
 const ref=new Date(reference);ref.setHours(0,0,0,0)
 const currentClose=cardDueDate(ref.getFullYear(),ref.getMonth(),card.fechamento)
 const fechamento=ref<=currentClose?currentClose:cardDueDate(ref.getFullYear(),ref.getMonth()+1,card.fechamento)
 const dueMonth=fechamento.getMonth()+(card.vencimento<=card.fechamento?1:0)
 const vencimento=cardDueDate(fechamento.getFullYear(),dueMonth,card.vencimento)
 return{fechamento,vencimento}
}
const shortDateLabel=(date:Date)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(date).replace('.','')
const cardMonthLabel=(value:string)=>{const [year,month]=value.split('-').map(Number);const label=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(year,month-1,1));return label.charAt(0).toUpperCase()+label.slice(1)}
// 5º dia útil: conta segunda a sábado, pulando apenas domingos.
const localISO=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
const isFifthBusinessDay=(value:string)=>{const [year,month,day]=value.split('-').map(Number);return day===quintoDiaUtil(new Date(year,month-1,1))}

type FluxTab='saldos'|'totais'|'tags'|'menu'
export function Flux(){
 const {data,mutate}=useFinancas(); const [monthOffset,setMonthOffset]=useState(0); const tab=data.config.preferencias?.flux_aba??'saldos';const [horizon,setHorizon]=useState(false);const [adding,setAdding]=useState(false);const [editing,setEditing]=useState<{item:FluxLancamento;occurrenceDate:string}|null>(null);const [saldosFocusRequest,setSaldosFocusRequest]=useState(0)
 const setTab=(value:FluxTab)=>mutate(d=>{d.config.preferencias??={};d.config.preferencias.flux_aba=value})
 const today=new Date();const base=new Date(today.getFullYear(),today.getMonth()+monthOffset,1);const key=monthKey(base);const label=new Intl.DateTimeFormat('pt-BR',{month:'short',year:'2-digit'}).format(base).replace('.','')
  return <div className="page min-h-full bg-bg"><header className="px-5 pt-[14px]"><p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-accent">Fluxo diário</p><div className="flex items-center justify-between gap-2"><h1 className="min-w-0 font-display text-[26px] font-semibold leading-none tracking-[-1.2px] text-t1">{label}</h1><div className="flex shrink-0 items-center gap-1"><button aria-label="Mês anterior" onClick={()=>setMonthOffset(x=>x-1)} className="glass-action glass-neutral grid h-9 w-9 place-items-center rounded-full border transition active:scale-95"><IconArrowBadgeLeft size={18}/></button><button aria-label="Próximo mês" onClick={()=>setMonthOffset(x=>x+1)} className="glass-action glass-neutral grid h-9 w-9 place-items-center rounded-full border transition active:scale-95"><IconArrowBadgeRight size={18}/></button><button aria-label="Ir para o mês atual" disabled={monthOffset===0} onClick={()=>setMonthOffset(0)} className={cn('glass-action inline-flex h-9 items-center gap-1 rounded-full border px-2.5 text-[9px] font-bold transition active:scale-95 disabled:opacity-40',monthOffset===0?'glass-accent':'glass-neutral')}><IconCalendar size={14}/>Hoje</button><button aria-label="Horizonte de saldos" onClick={()=>setHorizon(true)} className="glass-action glass-neutral grid h-9 w-9 place-items-center rounded-full border transition active:scale-95"><IconCalendarMonth size={17}/></button><button aria-label="Nova movimentação" onClick={()=>{setEditing(null);setAdding(true)}} className="glass-action glass-accent grid h-9 w-9 place-items-center rounded-full border transition active:scale-95"><Plus size={17} strokeWidth={2.4}/></button></div></div></header>
 <div className="flux-tabs-sticky sticky z-20 grid grid-cols-4 border-b border-border">{(['saldos','totais','tags','menu'] as FluxTab[]).map(x=><button onClick={()=>{setTab(x);if(x==='saldos')setSaldosFocusRequest(value=>value+1)}} key={x} className={cn('border-b-2 border-transparent py-[10px] text-xs font-semibold capitalize text-t3 transition',tab===x&&'border-flux text-flux')}>{x}</button>)}</div>
  <div className={cn(tab!=='saldos'&&'px-4 pt-4')}>{tab==='saldos'&&<Saldos month={base} focusRequest={saldosFocusRequest} onEdit={(item,occurrenceDate)=>setEditing({item,occurrenceDate})}/>} {tab==='totais'&&<Totais monthKey={key}/>} {tab==='tags'&&<Tags monthKey={key}/>} {tab==='menu'&&<FluxMenu/>}</div>
  {horizon&&<Horizon close={()=>setHorizon(false)}/>} {(adding||editing)&&<NewTransaction edit={editing?.item??null} occurrenceDate={editing?.occurrenceDate} close={()=>{setAdding(false);setEditing(null)}}/>}</div>
}

type SaldoFilter='total'|FluxTipo
function Saldos({month,focusRequest,onEdit}:{month:Date;focusRequest:number;onEdit:(item:FluxLancamento,occurrenceDate:string)=>void}){
 const {data,mutate}=useFinancas();const hidden=useFinancas(s=>s.valuesHidden)
 const filter=data.config.preferencias?.flux_filtro??'total'
 const showDailyPlan=data.config.preferencias?.flux_mostrar_planejamento_diario??true
 const [filterOpen,setFilterOpen]=useState(false)
 const [openCell,setOpenCell]=useState<{month:'current'|'next';day:number}|null>(null)
 const setFilter=(value:SaldoFilter)=>mutate(d=>{d.config.preferencias??={};d.config.preferencias.flux_filtro=value})
 const toggleDailyPlan=()=>mutate(d=>{d.config.preferencias??={};d.config.preferencias.flux_mostrar_planejamento_diario=!showDailyPlan})
 const [deleteId,setDeleteId]=useState<string|null>(null)
 const [recurrenceDelete,setRecurrenceDelete]=useState<{id:string;date:string}|null>(null)
 const [cardDayEditor,setCardDayEditor]=useState<{monthKey:string;value:string}|null>(null)
 const currentKey=monthKey(month);const days=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();const today=new Date();today.setHours(0,0,0,0);const isCurrentMonth=currentKey===monthKey(today);const nowDay=isCurrentMonth?today.getDate():-1
 const todayRowRef=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(nowDay<1)return;const frame=requestAnimationFrame(()=>todayRowRef.current?.scrollIntoView({block:'start',behavior:'smooth'}));return()=>cancelAnimationFrame(frame)},[currentKey,focusRequest,nowDay])
 const limites=getLimites(data.flux.temperatura)
 const nextDate=new Date(month.getFullYear(),month.getMonth()+1,1)
 const monthHead=(d:Date)=>`${new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(d).replace('.','')}/${String(d.getFullYear()).slice(2)}`
 const nextDays=new Date(nextDate.getFullYear(),nextDate.getMonth()+1,0).getDate()
 const movementOn=(date:Date)=>data.flux.lancamentos.filter(l=>ocorreEm(l,localISO(date))).reduce((total,l)=>total+(l.tipo==='entrada'?l.valor:-l.valor),0)
 const dayNumber=(date:Date)=>Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())
 const todayBalance=(data.flux.saldo_inicial??0)+movementOn(today)
 const balanceBeforeToday=(target:Date)=>{
  let value=data.flux.saldo_inicial??0
  const cursor=new Date(target);cursor.setDate(cursor.getDate()+1)
  while(dayNumber(cursor)<dayNumber(today)){
   value-=movementOn(cursor)
   cursor.setDate(cursor.getDate()+1)
  }
  return value
 }
 const projectFromToday=(target:Date)=>{
  let projected=todayBalance
  const cursor=new Date(today)
  while(dayNumber(cursor)<dayNumber(target)){
   cursor.setDate(cursor.getDate()+1)
   projected+=movementOn(cursor)-data.flux.valor_diario_planejado
  }
  return projected
 }
 const previousMonthEnd=new Date(month.getFullYear(),month.getMonth(),0)
 const monthOpeningBalance=dayNumber(previousMonthEnd)>=dayNumber(today)?projectFromToday(previousMonthEnd):(data.flux.saldo_inicial??0)
 const plannedForDate=(date:Date)=>data.flux.valor_diario_planejado>0&&dayNumber(date)>dayNumber(today)?data.flux.valor_diario_planejado:0
 const plannedDaysInCurrentMonth=Array.from({length:days},(_,index)=>plannedForDate(new Date(month.getFullYear(),month.getMonth(),index+1))).filter(value=>value>0).length
 const currentMonthEndBalance=monthOpeningBalance+data.flux.lancamentos.filter(l=>ocorreNoMes(l,currentKey)).reduce((total,l)=>total+(l.tipo==='entrada'?l.valor:-l.valor),0)-plannedDaysInCurrentMonth*data.flux.valor_diario_planejado
 const projectNextFromSelectedEnd=(target:Date)=>{
  let projected=currentMonthEndBalance
  const cursor=new Date(nextDate)
  while(dayNumber(cursor)<=dayNumber(target)){
   projected+=movementOn(cursor)
   if(dayNumber(cursor)>dayNumber(nextDate))projected-=data.flux.valor_diario_planejado
   cursor.setDate(cursor.getDate()+1)
  }
  return projected
 }
 const plannedForCurrentDate=(date:Date)=>plannedForDate(date)
 const plannedForNextDate=(date:Date)=>isCurrentMonth?plannedForDate(date):data.flux.valor_diario_planejado>0&&dayNumber(date)>dayNumber(nextDate)?data.flux.valor_diario_planejado:0
 let balance=monthOpeningBalance
  const rows=Array.from({length:days},(_,i)=>{const day=i+1;const date=`${currentKey}-${String(day).padStart(2,'0')}`;const tx=data.flux.lancamentos.filter(l=>ocorreEm(l,date));const currentDate=new Date(month.getFullYear(),month.getMonth(),day);const planned=plannedForCurrentDate(currentDate);tx.forEach(l=>balance+=l.tipo==='entrada'?l.valor:-l.valor);balance-=planned;const saldo=isCurrentMonth?(day<nowDay?balanceBeforeToday(currentDate):projectFromToday(currentDate)):balance;const nextTarget=new Date(nextDate.getFullYear(),nextDate.getMonth(),day);const nextDateKey=localISO(nextTarget);const nextTx=day<=nextDays?data.flux.lancamentos.filter(l=>ocorreEm(l,nextDateKey)):[];const plannedNext=day<=nextDays?plannedForNextDate(nextTarget):0;const projetado=isCurrentMonth?projectFromToday(nextTarget):projectNextFromSelectedEnd(nextTarget);return{day,date,tx,nextTx,nextDate:nextDateKey,saldo,projetado,planned,plannedNext}})
  const dayValue=(tx:typeof rows[number]['tx'],planned=0)=>{const visiblePlanned=showDailyPlan?planned:0;return filter==='total'?tx.reduce((a,l)=>a+(l.tipo==='entrada'?l.valor:-l.valor),0)-visiblePlanned:tx.filter(l=>l.tipo===filter).reduce((a,l)=>a+l.valor,0)+(filter==='diario'?visiblePlanned:0)}
  const visibleTransactions=(tx:typeof rows[number]['tx'])=>filter==='total'?tx:tx.filter(item=>item.tipo===filter)
  const categoryTotals=(tx:typeof rows[number]['tx'],planned=0)=>{const visiblePlanned=showDailyPlan?planned:0;return (Object.keys(fluxMeta) as FluxTipo[]).map(type=>({type,value:tx.filter(item=>item.tipo===type).reduce((total,item)=>total+item.valor,0)+(type==='diario'?visiblePlanned:0)})).filter(item=>item.value!==0)}
 const isSunday=(d:Date,day:number)=>new Date(d.getFullYear(),d.getMonth(),day).getDay()===0
 const weekday=(d:Date,day:number)=>new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(new Date(d.getFullYear(),d.getMonth(),day)).replace('.','').slice(0,3)
 const deleteRecurring=(mode:'one'|'future'|'all')=>{
  const target=recurrenceDelete
  if(!target)return
  mutate(d=>{
   const item=d.flux.lancamentos.find(entry=>entry.id===target.id)
   if(!item?.repete)return
   if(mode==='all'){d.flux.lancamentos=d.flux.lancamentos.filter(entry=>entry.id!==target.id);return}
   if(mode==='one'){item.repete.excluidas=Array.from(new Set([...(item.repete.excluidas??[]),target.date]));return}
   const previousOccurrences=recurrenceOccurrenceIndex(item,target.date)
   if(previousOccurrences<=0){d.flux.lancamentos=d.flux.lancamentos.filter(entry=>entry.id!==target.id);return}
   item.repete.vezes=item.repete.vezes==null?previousOccurrences:Math.min(item.repete.vezes,previousOccurrences)
   item.repete.excluidas=item.repete.excluidas?.filter(date=>date<target.date)
  })
  setRecurrenceDelete(null)
 }
 const cardMovementsInMonth=(period:string)=>data.flux.lancamentos.filter(item=>item.tipo==='cartao'&&ocorreNoMes(item,period))
 const hasCardDayAdjustment=(period:string)=>cardMovementsInMonth(period).some(item=>Boolean(item.cartao?.ajustes?.[period]))
 const updateCardDay=(period:string,value:string|null)=>{
  mutate(d=>{
   d.flux.lancamentos.forEach(item=>{
    if(item.tipo!=='cartao'||!ocorreNoMes(item,period))return
    if(value){
     item.cartao??={}
     item.cartao.ajustes={...(item.cartao.ajustes??{}),[period]:value}
     return
    }
    if(!item.cartao?.ajustes)return
    const {[period]:removed,...rest}=item.cartao.ajustes
    item.cartao.ajustes=rest
    if(Object.keys(rest).length===0)delete item.cartao
   })
  })
  setCardDayEditor(null)
 }
 const cols='grid-cols-[minmax(0,1fr)_46px_68px_46px_68px]'
 return <Card className="rounded-none border-x-0">
  <div style={{background:'color-mix(in srgb, var(--el) 60%, var(--surface))'}} className={cn('sticky top-[38px] z-10 grid items-center border-b border-border py-2 text-[9px] font-bold uppercase tracking-wider text-t3',cols)}>
   <div className="relative ml-2 flex items-center gap-1">
    <button aria-label="Filtrar transações por tipo" aria-expanded={filterOpen} onClick={()=>setFilterOpen(v=>!v)} className="glass-action glass-neutral inline-flex h-7 items-center gap-1.5 rounded-full border pl-1.5 pr-2.5 text-[9px] font-bold uppercase tracking-wider transition active:scale-95">
     <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full" style={filter==='total'?{color:'var(--t2)',background:'var(--el)'}:{color:'#FFF',background:fluxMeta[filter].color}}>{filter==='total'?<IconAdjustmentsDollar size={11}/>:<FluxTypeIcon tipo={filter} size={10}/>}</span>
     {filter==='total'?'Total':fluxMeta[filter].label}
     <IconChevronDown size={11} className={cn('text-t3 transition',filterOpen&&'rotate-180')}/>
    </button>
    {filterOpen&&<>
     <div className="fixed inset-0 z-20" onClick={()=>setFilterOpen(false)}/>
     <div className="absolute left-0 top-[33px] z-30 w-44 overflow-hidden rounded-[16px] border border-border bg-surface shadow-[0_14px_34px_rgba(30,30,45,.16)]">
      {(['total',...(Object.keys(fluxMeta) as FluxTipo[])] as SaldoFilter[]).map(opt=><button key={opt} onClick={()=>{setFilter(opt);setFilterOpen(false)}} className={cn('flex w-full items-center gap-2.5 border-b border-border/60 px-3 py-2.5 text-left text-[10px] font-bold normal-case tracking-normal transition last:border-0 active:bg-el/60',filter===opt?'text-t1':'text-t2')}>
       <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={opt==='total'?{color:'var(--t2)',background:'var(--el)'}:{color:'#FFF',background:fluxMeta[opt as FluxTipo].color}}>{opt==='total'?<IconAdjustmentsDollar size={14}/>:<FluxTypeIcon tipo={opt as FluxTipo} size={12}/>}</span>
       <span className="flex-1">{opt==='total'?'Total':fluxMeta[opt as FluxTipo].label}</span>
       {filter===opt&&<IconCheck size={13} className="shrink-0 text-flux"/>}
      </button>)}
     </div>
    </>}
    <button type="button" aria-pressed={showDailyPlan} aria-label={showDailyPlan?'Ocultar planejamento diário':'Mostrar planejamento diário'} title={showDailyPlan?'Ocultar planejamento diário':'Mostrar planejamento diário'} onClick={toggleDailyPlan} className="glass-action glass-neutral grid h-7 w-7 place-items-center rounded-full border transition active:scale-95">{showDailyPlan?<IconEye size={12}/>:<IconEyeOff size={12}/>}</button>
   </div>
   <span className="col-span-2 text-center">{monthHead(month)}</span>
   <span className="col-span-2 text-center opacity-60">{monthHead(nextDate)}</span>
  </div>
  {rows.map(row=>{
     const value=dayValue(row.tx,row.planned)
     // No TOTAL, a célula deve abrir a lista bruta do dia, sem reduzir por tipo.
     const currentTx=filter==='total'?row.tx:visibleTransactions(row.tx)
     const nextTx=filter==='total'?row.nextTx:visibleTransactions(row.nextTx)
    const categories=filter==='total'?categoryTotals(row.tx,row.planned):[]
    const currentOpen=openCell?.month==='current'&&openCell.day===row.day
    const nextOpen=openCell?.month==='next'&&openCell.day===row.day
    const valueColor=filter==='total'?(value>0?'var(--green)':'var(--red)'):fluxMeta[filter].color
    const nextExists=row.day<=nextDays
    const DayCell=({date,exists=true}:{date:Date;exists?:boolean})=>{const fifth=exists&&row.day===quintoDiaUtil(date);return <span aria-label={fifth?`${row.day}, quinto dia útil`:undefined} className={cn('number flex items-center justify-center border-l border-border/60 bg-el/40 text-[10px] font-bold',!exists&&'opacity-0',isSunday(date,row.day)?'text-red':'text-t2',row.day===nowDay&&'text-flux',fifth&&'bg-yellow/10')}><span className="inline-flex items-center gap-[2px]">{fifth&&<IconStarFilled size={7} className="shrink-0 text-yellow"/>}<span>{String(row.day).padStart(2,'0')}<span className="text-[8px] font-semibold opacity-70">/{weekday(date,row.day)}</span></span></span></span>}
    const transactionDetails=(tx:typeof rows[number]['tx'],date:string,period:string)=><div className="border-t border-border/60 bg-el/40 px-3 py-2.5"><p className="text-[9px] font-extrabold uppercase tracking-[.8px] text-t3">Movimentações de {period} · dia {date.slice(-2)}</p>{tx.length===0?<p className="mt-2 rounded-[12px] border border-dashed border-border bg-surface/60 px-3 py-3 text-[10px] text-t3">Nenhuma entrada ou saída neste dia.</p>:<div className="mt-2 space-y-1.5">{tx.map(item=>{const txTagIds=item.tag_ids?.length?item.tag_ids:item.tag_id?[item.tag_id]:[];const txTags=txTagIds.map(id=>data.flux.tags.find(t=>t.id===id)).filter((tag):tag is NonNullable<typeof tag>=>Boolean(tag));return <div key={item.id} className="flex items-center gap-2.5 rounded-[12px] border border-border/70 bg-surface px-2.5 py-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-white" style={{background:fluxMeta[item.tipo].color}}><FluxTypeIcon tipo={item.tipo} size={13}/></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-t1">{item.descricao}</span><span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-t3">{item.repete&&<IconRepeat size={9} strokeWidth={2.6}/>} {typeSingular[item.tipo]}{txTags.map(tag=><span key={tag.id} className="inline-flex items-center gap-[3px] rounded-md px-1.5 py-[2px] text-[8px] font-bold" style={{color:tag.cor,background:`${tag.cor}14`}}><IconTag size={9} strokeWidth={2.6}/>{tag.label}</span>)}</span></span><Currency value={item.valor} className="shrink-0 text-[11px] font-bold" style={{color:fluxMeta[item.tipo].color}}/>{deleteId===item.id?<span className="flex shrink-0 items-center gap-1 rounded-full border border-red/20 bg-red/5 p-0.5"><button type="button" aria-label="Cancelar exclusão" onClick={()=>setDeleteId(null)} className="grid h-7 w-7 place-items-center rounded-full text-t3 transition active:scale-95"><X size={13}/></button><DangerButton aria-label={`Confirmar exclusão de ${item.descricao}`} title={item.repete?'Excluir lançamento e recorrências':'Confirmar exclusão'} onClick={()=>{mutate(d=>{d.flux.lancamentos=d.flux.lancamentos.filter(entry=>entry.id!==item.id)});setDeleteId(null)}} className="h-7 w-7"/></span>:<DangerButton aria-label={`Excluir ${item.descricao}`} title={item.repete?'Excluir lançamento recorrente':'Excluir lançamento'} onClick={()=>item.repete?setRecurrenceDelete({id:item.id,date}):setDeleteId(item.id)} className="h-7 w-7"/>}</div>})}</div>}</div>
   return <div ref={row.day===nowDay?todayRowRef:undefined} key={row.date} className={cn('border-b border-border/60 last:border-0',row.day===nowDay&&'scroll-mt-[92px]')}>
     <div className={cn('grid min-h-[52px] w-full items-stretch',cols,row.day===nowDay&&'bg-flux/5')}>
      <button type="button" aria-label={`Ver movimentações de ${monthHead(month)}, dia ${row.day}`} aria-expanded={currentOpen} onClick={()=>setOpenCell(currentOpen?null:{month:'current',day:row.day})} className={cn('col-span-3 grid min-w-0 grid-cols-[minmax(0,1fr)_46px_68px] items-stretch text-left transition',currentOpen&&'bg-flux/10')}>
       {filter==='total'&&categories.length>0
        ?<span className="flex min-w-0 flex-col justify-center gap-1 py-1 pl-2 pr-1">
          {categories.map(({type,value})=><span key={type} className="flex min-w-0 items-center gap-1.5">
           <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md" style={{color:fluxMeta[type].color,background:`color-mix(in srgb, ${fluxMeta[type].color} 12%, transparent)`}}><FluxTypeIcon tipo={type} size={11}/></span>
           <Currency value={value} className="min-w-0 text-[10px] font-bold" style={{color:fluxMeta[type].color}}/>
          </span>)}
         </span>
        :<span className="flex items-center gap-1.5 pl-2 pr-1">
          {value!==0
           ?<><span className="grid h-5 w-5 shrink-0 place-items-center rounded-md" style={{color:valueColor,background:`color-mix(in srgb, ${valueColor} 12%, transparent)`}}>{filter==='total'?<FluxTypeIcon tipo={value>0?'entrada':'saida'} size={11}/>:<FluxTypeIcon tipo={filter} size={11}/>}</span><Currency value={value} className="text-[11px] font-bold" style={{color:valueColor}}/></>
           :<Currency value={0} className="text-[11px] text-t3/50"/>}
         </span>}
       <DayCell date={month}/>
       <span className="flex items-center justify-end border-l border-border/60 pr-1.5" style={saldoStyle(row.saldo,limites)}>
        <b className="number text-[11px] font-bold">{hidden?'••••':money(row.saldo)}</b>
       </span>
      </button>
      {nextExists
       ?<button type="button" aria-label={`Ver movimentações de ${monthHead(nextDate)}, dia ${row.day}`} aria-expanded={nextOpen} onClick={()=>setOpenCell(nextOpen?null:{month:'next',day:row.day})} className={cn('col-span-2 grid min-w-0 grid-cols-[46px_68px] items-stretch text-left transition',nextOpen&&'bg-flux/10')}>
        <DayCell date={nextDate} exists/>
        <span className="flex items-center justify-end border-l border-border/60 pr-1.5 opacity-80" style={saldoStyle(row.projetado,limites)}><b className="number text-[11px] font-bold">{hidden?'••••':money(row.projetado)}</b></span>
       </button>
       :<span className="col-span-2 bg-el/30"/>}
     </div>
     {currentOpen&&currentTx.length>0&&<div className="space-y-1.5 border-t border-border/60 bg-el/40 px-3 py-2.5"><div className="mb-1 flex items-center justify-between gap-2"><p className="min-w-0 text-[9px] font-extrabold uppercase tracking-[.8px] text-t3">{filter==='total'?'Todas as movimentações':'Movimentações filtradas'} de {monthHead(month)} · dia {row.date.slice(-2)}</p>{currentTx.some(item=>item.tipo==='cartao')&&<button type="button" aria-label="Alterar dia dos cartões neste mês" onClick={()=>setCardDayEditor({monthKey:currentKey,value:row.date})} className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[8px] font-bold normal-case tracking-normal text-t2 transition active:scale-95">Alterar dia</button>}</div>
       {currentTx.map(tx=>{const txTagIds=tx.tag_ids?.length?tx.tag_ids:tx.tag_id?[tx.tag_id]:[];const txTags=txTagIds.map(id=>data.flux.tags.find(t=>t.id===id)).filter((item):item is NonNullable<typeof item>=>Boolean(item));return <div key={tx.id} role="button" tabIndex={0} onClick={event=>{if((event.target as HTMLElement).closest('button'))return;onEdit(tx,row.date)}} onKeyDown={event=>{if((event.key==='Enter'||event.key===' ')&&(event.target as HTMLElement).closest('button')===null){event.preventDefault();onEdit(tx,row.date)}}} className="flex cursor-pointer items-center gap-2.5 rounded-[12px] border border-border/70 bg-surface px-2.5 py-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-white" style={{background:fluxMeta[tx.tipo].color}}><FluxTypeIcon tipo={tx.tipo} size={13}/></span>
      <span className="min-w-0 flex-1">
       <span className="block truncate text-[11px] font-semibold text-t1">{tx.descricao}</span>
       <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-t3">{tx.repete&&<IconRepeat size={9} strokeWidth={2.6}/>}{typeSingular[tx.tipo]}{txTags.map(tg=><span key={tg.id} className="inline-flex items-center gap-[3px] rounded-md px-1.5 py-[2px] text-[8px] font-bold" style={{color:tg.cor,background:`${tg.cor}14`}}><IconTag size={9} strokeWidth={2.6}/>{tg.label}</span>)}</span>
      </span>
      <Currency value={tx.valor} className="shrink-0 text-[11px] font-bold" style={{color:fluxMeta[tx.tipo].color}}/>
      {deleteId===tx.id
       ?<span className="flex shrink-0 items-center gap-1 rounded-full border border-red/20 bg-red/5 p-0.5"><button type="button" aria-label="Cancelar exclusão" onClick={()=>setDeleteId(null)} className="grid h-7 w-7 place-items-center rounded-full text-t3 transition active:scale-95"><X size={13}/></button><DangerButton aria-label={`Confirmar exclusão de ${tx.descricao}`} title={tx.repete?'Excluir lançamento e recorrências':'Confirmar exclusão'} onClick={()=>{mutate(d=>{d.flux.lancamentos=d.flux.lancamentos.filter(item=>item.id!==tx.id)});setDeleteId(null)}} className="h-7 w-7"/></span>
       :<DangerButton aria-label={`Excluir ${tx.descricao}`} title={tx.repete?'Excluir lançamento recorrente':'Excluir lançamento'} onClick={()=>tx.repete?setRecurrenceDelete({id:tx.id,date:row.date}):setDeleteId(tx.id)} className="h-7 w-7"/>}
     </div>})}
      </div>}
       {currentOpen&&currentTx.length===0&&<>{transactionDetails(currentTx,row.date,monthHead(month))}{showDailyPlan&&row.planned>0&&<DailyPlanNotice value={row.planned}/>}</>}
       {nextOpen&&<div className="space-y-1.5 border-t border-border/60 bg-el/40 px-3 py-2.5"><div className="mb-1 flex items-center justify-between gap-2"><p className="min-w-0 text-[9px] font-extrabold uppercase tracking-[.8px] text-t3">{filter==='total'?'Todas as movimentações':'Movimentações filtradas'} de {monthHead(nextDate)} · dia {row.nextDate.slice(-2)}</p>{nextTx.some(item=>item.tipo==='cartao')&&<button type="button" aria-label="Alterar dia dos cartões neste mês" onClick={()=>setCardDayEditor({monthKey:monthKey(nextDate),value:row.nextDate})} className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[8px] font-bold normal-case tracking-normal text-t2 transition active:scale-95">Alterar dia</button>}</div>{nextTx.length===0?<p className="rounded-[12px] border border-dashed border-border bg-surface/60 px-3 py-3 text-[10px] text-t3">Nenhuma entrada ou saída neste dia.</p>:nextTx.map(tx=>{const txTagIds=tx.tag_ids?.length?tx.tag_ids:tx.tag_id?[tx.tag_id]:[];const txTags=txTagIds.map(id=>data.flux.tags.find(t=>t.id===id)).filter((item):item is NonNullable<typeof item>=>Boolean(item));return <div key={tx.id} role="button" tabIndex={0} onClick={event=>{if((event.target as HTMLElement).closest('button'))return;onEdit(tx,row.nextDate)}} onKeyDown={event=>{if((event.key==='Enter'||event.key===' ')&&(event.target as HTMLElement).closest('button')===null){event.preventDefault();onEdit(tx,row.nextDate)}}} className="flex cursor-pointer items-center gap-2.5 rounded-[12px] border border-border/70 bg-surface px-2.5 py-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-white" style={{background:fluxMeta[tx.tipo].color}}><FluxTypeIcon tipo={tx.tipo} size={13}/></span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-t1">{tx.descricao}</span><span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-t3">{tx.repete&&<IconRepeat size={9} strokeWidth={2.6}/>} {typeSingular[tx.tipo]}{txTags.map(tg=><span key={tg.id} className="inline-flex items-center gap-[3px] rounded-md px-1.5 py-[2px] text-[8px] font-bold" style={{color:tg.cor,background:`${tg.cor}14`}}><IconTag size={9} strokeWidth={2.6}/>{tg.label}</span>)}</span></span><Currency value={tx.valor} className="shrink-0 text-[11px] font-bold" style={{color:fluxMeta[tx.tipo].color}}/><DangerButton aria-label={`Excluir ${tx.descricao}`} title={tx.repete?'Excluir lançamento recorrente':'Excluir lançamento'} onClick={event=>{event.stopPropagation();tx.repete?setRecurrenceDelete({id:tx.id,date:row.nextDate}):setDeleteId(tx.id)}} className="h-7 w-7"/></div>})}</div>}
   </div>
  })}
  <div className="flux-closing bg-[linear-gradient(180deg,var(--surface),color-mix(in_srgb,var(--flux-orange)_7%,var(--el)))] px-4 pt-5">
   <div className="flex items-center gap-3 rounded-[18px] border border-flux/15 bg-surface/75 p-3.5 shadow-[0_8px_24px_rgba(55,35,20,.06)]">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-flux/10 text-flux"><CalendarRange size={18}/></span>
    <div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-t3">Fechamento de {monthHead(month)}</p><p className="mt-1 text-[11px] text-t2">{days} dias projetados · próximo período {monthHead(nextDate)}</p></div>
    <div className="shrink-0 text-right"><p className="text-[9px] text-t3">saldo final</p><b className="number text-[12px] text-t1">{hidden?'••••':money(rows[rows.length-1]?.saldo??0)}</b></div>
   </div>
  </div>
  {recurrenceDelete&&<div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65" onClick={()=>setRecurrenceDelete(null)}>
   <div className="safe-bottom w-full max-w-[390px] rounded-t-[28px] border-t border-border bg-bg px-4 pb-5 pt-2.5 shadow-[0_-18px_44px_rgba(0,0,0,.2)]" onClick={event=>event.stopPropagation()}>
    <div aria-hidden="true" className="mx-auto mb-4 h-1 w-9 rounded-full bg-border"/>
    <div className="mb-3 flex items-center gap-3 px-1"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-red/10 text-red"><IconRepeat size={18}/></span><div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-red">Lançamento recorrente</p><h2 className="mt-0.5 truncate text-[17px] font-bold text-t1">O que deseja excluir?</h2></div></div>
    <div className="overflow-hidden rounded-[20px] border border-border bg-surface">
     <button type="button" onClick={()=>deleteRecurring('one')} className="flex w-full items-center border-b border-border px-4 py-4 text-left transition active:bg-el/60"><span className="flex-1"><span className="block text-[12px] font-bold text-t1">Somente esta</span><span className="mt-1 block text-[9px] text-t3">Mantém as outras ocorrências</span></span><ChevronRight size={15} className="text-t3"/></button>
     <button type="button" onClick={()=>deleteRecurring('future')} className="flex w-full items-center border-b border-border px-4 py-4 text-left transition active:bg-el/60"><span className="flex-1"><span className="block text-[12px] font-bold text-t1">Esta e as próximas</span><span className="mt-1 block text-[9px] text-t3">Mantém somente as anteriores</span></span><ChevronRight size={15} className="text-t3"/></button>
     <button type="button" onClick={()=>deleteRecurring('all')} className="flex w-full items-center px-4 py-4 text-left text-red transition active:bg-red/5"><span className="flex-1"><span className="block text-[12px] font-bold">Todas</span><span className="mt-1 block text-[9px] opacity-70">Apaga a série inteira</span></span><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-red/25 bg-red/10"><IconTrash size={14}/></span></button>
    </div>
    <button type="button" onClick={()=>setRecurrenceDelete(null)} className="mt-2 h-11 w-full text-[12px] font-bold text-t2">Cancelar</button>
   </div>
  </div>}
  {cardDayEditor&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65" onClick={()=>setCardDayEditor(null)}>
   <div role="dialog" aria-label="Alterar dia dos cartões" className="safe-bottom w-full max-w-[390px] rounded-t-[28px] border-t border-border bg-bg px-4 pb-5 pt-2.5 shadow-[0_-18px_44px_rgba(0,0,0,.2)]" onClick={event=>event.stopPropagation()}>
    <div aria-hidden="true" className="mx-auto mb-4 h-1 w-9 rounded-full bg-border"/>
    <div className="mb-3 flex items-center gap-3 px-1"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-flux/10 text-flux"><IconCreditCard size={18}/></span><div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-flux">Lançamentos de cartão</p><h2 className="mt-0.5 truncate text-[17px] font-bold text-t1">Alterar dia</h2></div><button type="button" aria-label="Fechar" onClick={()=>setCardDayEditor(null)} className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-t2"><X size={15}/></button></div>
    <p className="mb-3 rounded-[15px] border border-border bg-surface p-3 text-[10px] leading-relaxed text-t2">Somente os lançamentos de cartão de <b className="text-t1">{cardMonthLabel(cardDayEditor.monthKey)}</b> serão alterados. Os outros meses continuarão iguais.</p>
    <div className="rounded-[18px] border border-border bg-surface p-3"><p className="mb-2 text-[9px] font-bold uppercase tracking-[.8px] text-t3">Novo dia no mês</p><AurvmDatePicker value={cardDayEditor.value} onChange={value=>{if(value.slice(0,7)===cardDayEditor.monthKey)setCardDayEditor(current=>current?{...current,value}:current)}} ariaLabel="Escolher novo dia dos cartões" accentColor="var(--flux-orange)" className="h-10 w-full justify-between bg-el/45 px-3"/><p className="mt-2 text-[9px] text-t3">Escolha uma data dentro de {cardMonthLabel(cardDayEditor.monthKey)}.</p></div>
    <button type="button" onClick={()=>updateCardDay(cardDayEditor.monthKey,cardDayEditor.value)} className="mt-3 h-11 w-full rounded-[14px] bg-flux text-[12px] font-bold text-white shadow-[0_8px_20px_rgba(255,105,36,.18)]">Aplicar somente neste mês</button>
    {hasCardDayAdjustment(cardDayEditor.monthKey)&&<button type="button" onClick={()=>updateCardDay(cardDayEditor.monthKey,null)} className="mt-2 h-10 w-full rounded-[14px] border border-border bg-surface text-[11px] font-bold text-t2">Restaurar dia do vencimento</button>}
    <button type="button" onClick={()=>setCardDayEditor(null)} className="mt-1 h-10 w-full text-[11px] font-bold text-t2">Cancelar</button>
   </div>
  </div>}
 </Card>
}

function ChainIcon({tipo,dashed}:{tipo:FluxTipo;dashed?:boolean}){return <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full',dashed&&'border border-dashed')} style={{color:fluxMeta[tipo].color,background:dashed?'transparent':`${fluxMeta[tipo].color}18`,borderColor:dashed?fluxMeta[tipo].color:undefined}}><FluxTypeIcon tipo={tipo} size={11}/></span>}
function TotalsCardHeader({title,caption,icon}:{title:string;caption:string;icon:ReactNode}){return <div className="flex items-center gap-3 border-b border-border bg-el/25 px-4 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-surface text-flux shadow-sm">{icon}</span><span className="min-w-0"><span className="block text-[11px] font-bold text-t1">{title}</span><span className="mt-0.5 block text-[9px] text-t3">{caption}</span></span></div>}

function Totais({monthKey:key}:{monthKey:string}){
 const data=useFinancas(s=>s.data)
 const tx=data.flux.lancamentos.filter(l=>ocorreNoMes(l,key))
 const sums=(type:FluxTipo)=>tx.filter(l=>l.tipo===type).reduce((a,b)=>a+b.valor,0)
 const entrada=sums('entrada'),saida=sums('saida'),diario=sums('diario'),economia=sums('economia'),cartao=sums('cartao')
 const perf=entrada-saida-diario-economia-cartao;const rate=entrada?economia/entrada*100:0;const custo=saida+diario+cartao
 const today=new Date();const totalDays=new Date(Number(key.slice(0,4)),Number(key.slice(5,7)),0).getDate();const currentMonth=key===monthKey(today)
 const daysPassed=Math.max(1,currentMonth?today.getDate():totalDays);const remaining=Math.max(0,totalDays-daysPassed);const mediaDiaria=diario/daysPassed;const planejado=data.flux.valor_diario_planejado
 const positive=perf>=0;const resultColor=positive?'var(--green)':'var(--red)';const rawMonthName=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(Number(key.slice(0,4)),Number(key.slice(5,7))-1,1));const monthName=rawMonthName.charAt(0).toUpperCase()+rawMonthName.slice(1)
 const movementRows=(Object.keys(fluxMeta) as FluxTipo[]).map(type=>({type,value:sums(type)}))
 return <div className="space-y-3">
  <section className="overflow-hidden rounded-[24px] border p-4 shadow-[0_12px_30px_rgba(70,40,24,.07)]" style={{borderColor:`color-mix(in srgb, ${resultColor} 18%, var(--border))`,background:`linear-gradient(145deg,color-mix(in srgb, ${resultColor} 12%, var(--surface)),var(--surface) 72%)`}}>
   <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2.5"><span className="grid h-10 w-10 place-items-center rounded-[13px] text-white" style={{background:resultColor}}><CalendarRange size={18}/></span><div><p className="text-[9px] font-extrabold uppercase tracking-[1px]" style={{color:resultColor}}>Resultado do mês</p><p className="mt-0.5 text-[11px] font-semibold text-t2">{monthName}</p></div></div><span className="rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[8px] font-bold text-t3">{tx.length} movimentações</span></div>
   <div className="mt-4"><Currency value={perf} className="text-[32px] font-black tracking-[-1.4px]" style={{color:resultColor}}/><p className="mt-1 text-[10px] text-t2">{positive?'valor disponível depois de todos os compromissos':'valor que ultrapassou as entradas do mês'}</p></div>
   <div className="mt-4 grid grid-cols-3 border-t pt-3" style={{borderColor:`color-mix(in srgb, ${resultColor} 16%, var(--border))`}}>
    <div><p className="text-[8px] font-bold uppercase tracking-[.6px] text-t3">Economizado</p><p className="number mt-1 text-[13px] font-bold text-green">{rate.toFixed(1).replace('.',',')}%</p></div>
    <div className="border-x border-border px-3"><p className="text-[8px] font-bold uppercase tracking-[.6px] text-t3">Custo de vida</p><Currency value={custo} className="mt-1 text-[12px] font-bold text-t1"/></div>
    <div className="pl-3"><p className="text-[8px] font-bold uppercase tracking-[.6px] text-t3">Média diária</p><Currency value={mediaDiaria} className="mt-1 text-[12px] font-bold text-t1"/></div>
   </div>
  </section>

  <Card className="overflow-hidden rounded-[20px]"><TotalsCardHeader title="Composição do mês" caption="Quanto cada categoria movimentou" icon={<IconCashBanknoteMinus size={17}/>}/><div className="grid grid-cols-2 gap-2 p-3">{movementRows.map(({type,value},index)=><div key={type} className={cn('rounded-[15px] border border-border bg-el/25 p-3',index===movementRows.length-1&&'col-span-2')}><div className="flex items-center justify-between gap-2"><span className="grid h-8 w-8 place-items-center rounded-[10px]" style={{color:fluxMeta[type].color,background:`${fluxMeta[type].color}14`}}><FluxTypeIcon tipo={type} size={14}/></span><Currency value={value} className="text-[12px] font-bold" style={{color:fluxMeta[type].color}}/></div><p className="mt-2 text-[10px] font-semibold text-t2">{fluxMeta[type].label}</p></div>)}</div></Card>

  <Card className="overflow-hidden rounded-[20px]"><TotalsCardHeader title="Indicadores" caption="Leitura rápida da saúde do mês" icon={<IconPigMoney size={17}/>}/><div className="grid grid-cols-2 gap-px bg-border"><div className="bg-surface p-4"><div className="flex items-center gap-1.5"><ChainIcon tipo="economia"/><span className="text-[9px] font-bold text-t3">Meta de economia</span></div><div className="mt-2 flex items-end justify-between gap-2"><Currency value={economia} className="text-[20px] font-bold text-green"/><span className="number mb-0.5 rounded-full bg-green/10 px-2 py-1 text-[8px] font-bold text-green">{rate.toFixed(1).replace('.',',')}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-el"><i className="block h-full rounded-full bg-green" style={{width:`${Math.min(100,rate)}%`}}/></div><p className="mt-2 text-[8px] text-t3">{rate>=20?'acima do ideal':'ideal sugerido: 20%'}</p></div><div className="bg-surface p-4"><div className="flex items-center gap-1.5"><ChainIcon tipo="diario"/><span className="text-[9px] font-bold text-t3">Controle diário</span></div><Currency value={mediaDiaria} className="mt-2 text-[20px] font-bold text-t1"/><p className="mt-2 text-[8px] text-t3">planejado <Currency value={planejado} className="font-bold"/></p><span className={cn('mt-2 inline-flex rounded-full px-2 py-1 text-[8px] font-bold',mediaDiaria<=planejado?'bg-green/10 text-green':'bg-red/10 text-red')}>{mediaDiaria<=planejado?'dentro do plano':'acima do plano'}</span></div></div></Card>

  <section className="rounded-[20px] border border-dashed p-4" style={{borderColor:`color-mix(in srgb, ${fluxMeta.diario.color} 36%, var(--border))`,background:`color-mix(in srgb, ${fluxMeta.diario.color} 6%, var(--surface))`}}><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px]" style={{color:fluxMeta.diario.color,background:`${fluxMeta.diario.color}14`}}><IconReceiptDollar size={18}/></span><div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[.8px]" style={{color:fluxMeta.diario.color}}>Projeção até o fim do mês</p><p className="mt-1 text-[10px] text-t2">{remaining} {remaining===1?'dia restante':'dias restantes'} no valor planejado</p></div><Currency value={remaining*planejado} className="text-[14px] font-bold" style={{color:fluxMeta.diario.color}}/></div><div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3"><div className="rounded-[12px] bg-surface/70 p-2.5"><p className="text-[8px] text-t3">Pelo planejamento</p><Currency value={remaining*planejado} className="mt-1 text-[11px] font-bold text-t1"/></div><div className="rounded-[12px] bg-surface/70 p-2.5"><p className="text-[8px] text-t3">No ritmo atual</p><Currency value={mediaDiaria*remaining} className="mt-1 text-[11px] font-bold" style={{color:mediaDiaria<=planejado?'var(--green)':'var(--red)'}}/></div></div></section>
 </div>
}

function Tags({monthKey:key}:{monthKey:string}){
 const {data,mutate}=useFinancas();const [search,setSearch]=useState('')
 const [creating,setCreating]=useState(false);const [newLabel,setNewLabel]=useState('');const [newColor,setNewColor]=useState('#FF6A1A');const [deleteId,setDeleteId]=useState<string|null>(null)
 const sort=data.config.preferencias?.flux_tags_ordenacao??'valor'
 const setSort=(value:'valor'|'nome')=>mutate(d=>{d.config.preferencias??={};d.config.preferencias.flux_tags_ordenacao=value})
 const [showHidden,setShowHidden]=useState(false)
 const colors=['#FF6A1A','#2EA86B','#E84D55','#ED9D00','#8B78BE','#3D7DFF','#E94C91','#1AAE9F']
 const totalOf=(id:string)=>data.flux.lancamentos.filter(l=>ocorreNoMes(l,key)&&(l.tag_ids?.length?l.tag_ids.includes(id):l.tag_id===id)).reduce((a,b)=>a+b.valor,0)
 const enriched=data.flux.tags.map(tag=>({tag,total:totalOf(tag.id)})).filter(({tag})=>tag.label.toLowerCase().includes(search.toLowerCase()))
 const sorted=[...enriched].sort((a,b)=>sort==='nome'?a.tag.label.localeCompare(b.tag.label,'pt-BR'):b.total-a.total)
 const visiveis=sorted.filter(({tag})=>!tag.oculta)
 const ocultas=sorted.filter(({tag})=>tag.oculta)
 const toggleHide=(id:string)=>mutate(d=>{const tag=d.flux.tags.find(x=>x.id===id);if(tag)tag.oculta=!tag.oculta})
 const createTag=()=>{
  const label=newLabel.trim()
  if(!label||data.flux.tags.some(tag=>tag.label.localeCompare(label,'pt-BR',{sensitivity:'accent'})===0))return
  mutate(d=>d.flux.tags.push({id:uid(),label,cor:newColor}))
  setNewLabel('');setNewColor('#FF6A1A');setCreating(false)
 }
 const deleteTag=()=>{
  if(!deleteId)return
  mutate(d=>{
   d.flux.tags=d.flux.tags.filter(tag=>tag.id!==deleteId)
   d.flux.lancamentos.forEach(item=>{
    if(item.tag_id===deleteId)item.tag_id=null
    if(item.tag_ids)item.tag_ids=item.tag_ids.filter(id=>id!==deleteId)
   })
  })
  setDeleteId(null)
 }
 const TagRow=({tag,total,hiddenRow}:{tag:typeof data.flux.tags[number];total:number;hiddenRow?:boolean})=><div className={cn('flex items-center border-b border-border px-4 py-3.5 last:border-0',hiddenRow&&'opacity-60')}>
  <span className="mr-3 grid h-9 w-9 place-items-center rounded-xl" style={{color:tag.cor,background:`${tag.cor}18`}}><IconTag size={16}/></span>
  <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{tag.label}</p><p className="mt-1 text-[9px] text-t3">Total do mês</p></div>
  <Currency value={total} className="text-xs font-bold" style={{color:tag.cor}}/>
  <button aria-label={tag.oculta?`Mostrar ${tag.label}`:`Ocultar ${tag.label}`} onClick={()=>toggleHide(tag.id)} className="ml-2.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-el/60 text-t3 transition active:scale-95">{tag.oculta?<IconEye size={13}/>:<IconEyeOff size={13}/>}</button>
  <DangerButton aria-label={`Excluir tag ${tag.label}`} onClick={()=>setDeleteId(tag.id)} className="ml-1.5 h-7 w-7"/>
 </div>
 return <div>
  <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-t1">Suas tags</p><p className="mt-0.5 text-[9px] text-t3">Organize e categorize seus lançamentos</p></div><AddButton onClick={()=>setCreating(true)}>Nova tag</AddButton></div>
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
  {creating&&<div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55" onClick={()=>setCreating(false)}>
   <div role="dialog" aria-label="Criar tag" className="safe-bottom w-full max-w-[390px] rounded-t-[28px] border-x border-t border-border bg-bg px-4 pb-5 pt-2.5 shadow-[0_-20px_60px_rgba(35,27,22,.24)]" onClick={event=>event.stopPropagation()}>
    <div aria-hidden="true" className="mx-auto mb-4 h-1 w-9 rounded-full bg-border"/>
    <div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[13px]" style={{color:newColor,background:`${newColor}18`}}><IconTag size={18}/></span><div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-flux">Organização</p><h2 className="mt-0.5 text-[18px] font-bold text-t1">Criar nova tag</h2></div><button aria-label="Fechar" onClick={()=>setCreating(false)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-el text-t3"><X size={15}/></button></div>
    <Card className="p-3.5"><label><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[.7px] text-t3">Nome da tag</span><Input autoFocus maxLength={28} value={newLabel} onChange={event=>setNewLabel(event.target.value)} onKeyDown={event=>{if(event.key==='Enter')createTag()}} placeholder="Ex.: Casa, Mercado, Trabalho" className="bg-surface focus:border-flux"/></label><div className="mt-4"><span className="mb-2 block text-[8px] font-bold uppercase tracking-[.7px] text-t3">Cor</span><div className="grid grid-cols-8 gap-2">{colors.map(color=><button key={color} aria-label={`Usar cor ${color}`} onClick={()=>setNewColor(color)} className={cn('relative grid aspect-square place-items-center rounded-full border-2 transition active:scale-90',newColor===color?'border-t1':'border-transparent')}><span className="h-6 w-6 rounded-full" style={{background:color}}/>{newColor===color&&<IconCheck size={12} className="absolute text-white"/>}</button>)}</div></div></Card>
    <Button disabled={!newLabel.trim()||data.flux.tags.some(tag=>tag.label.localeCompare(newLabel.trim(),'pt-BR',{sensitivity:'accent'})===0)} onClick={createTag} className="mt-4 h-[50px] w-full rounded-[17px] bg-flux">Criar tag</Button>
   </div>
  </div>}
  {deleteId&&<div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55" onClick={()=>setDeleteId(null)}>
   <div role="alertdialog" aria-label="Excluir tag" className="safe-bottom w-full max-w-[390px] rounded-t-[28px] border-x border-t border-border bg-bg px-4 pb-5 pt-2.5 shadow-[0_-20px_60px_rgba(35,27,22,.24)]" onClick={event=>event.stopPropagation()}>
    <div aria-hidden="true" className="mx-auto mb-4 h-1 w-9 rounded-full bg-border"/>
    <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-red/10 text-red"><IconTrash size={19}/></span><div><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-red">Excluir tag</p><h2 className="mt-0.5 text-[17px] font-bold text-t1">{data.flux.tags.find(tag=>tag.id===deleteId)?.label}</h2></div></div>
    <p className="mt-4 rounded-[15px] border border-border bg-surface p-3 text-[10px] leading-relaxed text-t2">Os lançamentos serão mantidos. Somente esta tag será removida deles.</p>
    <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={()=>setDeleteId(null)} className="h-11 rounded-[14px] border border-border bg-surface text-[11px] font-bold text-t2">Cancelar</button><button onClick={deleteTag} className="h-11 rounded-[14px] bg-red text-[11px] font-bold text-white">Excluir tag</button></div>
   </div>
  </div>}
 </div>
}

function FluxMenu(){
 const {data,mutate}=useFinancas()
 const cartoes=data.flux.cartoes??[]
 const [addingCard,setAddingCard]=useState(false)
 return <div className="space-y-3">
  <Card className="p-4"><p className="text-xs font-semibold">Saldo inicial do Flux</p><p className="mt-1 text-[9px] text-t3">Base exclusiva deste módulo · não altera a Tabela</p><MoneyInput aria-label="Saldo inicial do Flux" value={data.flux.saldo_inicial??0} onValueChange={value=>mutate(d=>{d.flux.saldo_inicial=value})} className="number mt-4 focus-within:border-flux"/></Card>
  <Card className="p-4"><p className="text-xs font-semibold">Planejamento diário</p><p className="mt-1 text-[9px] text-t3">Valor usado nas previsões futuras</p><MoneyInput value={data.flux.valor_diario_planejado} onValueChange={value=>mutate(d=>{d.flux.valor_diario_planejado=value})} className="number mt-4 focus-within:border-flux"/></Card>
  <Card className="p-4">
   <div className="flex items-center justify-between"><div><p className="text-xs font-semibold">Cartões</p><p className="mt-1 text-[9px] text-t3">Fechamento e vencimento das faturas</p></div>{!addingCard&&<AddButton onClick={()=>setAddingCard(true)}>Novo</AddButton>}</div>
   <div className="mt-3 space-y-2">
    {cartoes.map(card=><div key={card.id} className="flex items-center gap-2.5 rounded-[14px] border border-border bg-el/40 p-3">
     <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-flux/10 text-flux"><IconCreditCard size={17}/></span>
     <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-semibold text-t1">{card.nome}</p><p className="mt-0.5 text-[9px] text-t3">fecha dia {card.fechamento} · vence dia {card.vencimento}</p></div>
     <div className="shrink-0 text-right"><p className="text-[8px] font-bold uppercase tracking-[.5px] text-t3">Próx. venc.</p><p className="number mt-0.5 text-[11px] font-bold text-flux">{nextDueLabel(card.vencimento)}</p></div>
     <DangerButton aria-label={`Excluir cartão ${card.nome}`} onClick={()=>mutate(d=>{d.flux.cartoes=(d.flux.cartoes??[]).filter(x=>x.id!==card.id)})}/>
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
 const today=new Date();today.setHours(0,0,0,0)
 const dayNumber=(date:Date)=>Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())
 const movementOn=(date:Date)=>data.flux.lancamentos.filter(l=>ocorreEm(l,localISO(date))).reduce((total,l)=>total+(l.tipo==='entrada'?l.valor:-l.valor),0)
 let running=(data.flux.saldo_inicial??0)+movementOn(today)
 const months=Array.from({length:6},(_,i)=>new Date(today.getFullYear(),today.getMonth()+i,1)).map(start=>{
  const total=new Date(start.getFullYear(),start.getMonth()+1,0).getDate()
  const dias=Array.from({length:total},(_,i)=>{
   const day=i+1
   const dt=new Date(start.getFullYear(),start.getMonth(),day)
   if(dayNumber(dt)>dayNumber(today))running+=movementOn(dt)-data.flux.valor_diario_planejado
   else if(dayNumber(dt)===dayNumber(today))running=movementOn(today)+(data.flux.saldo_inicial??0)
   return{day,saldo:running,domingo:dt.getDay()===0,quinto:day===quintoDiaUtil(start),wd:new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(dt).replace('.','').slice(0,3)}
  })
  return{start,dias}
 })
 return <div className="absolute inset-0 z-50 flex h-full min-w-0 flex-col overflow-hidden bg-bg">
  <header className="safe-top flex shrink-0 items-center justify-between border-b border-border bg-bg/95 px-5 pb-4 backdrop-blur"><div><p className="text-[10px] font-bold uppercase tracking-wider text-flux">Horizonte</p><h2 className="mt-1 text-lg font-bold">Saldos futuros</h2></div><button onClick={close} className="grid h-9 w-9 place-items-center rounded-full bg-el"><X size={16}/></button></header>
  <div className="min-h-0 flex-1 overflow-auto">
  <div className="flex w-max gap-2 p-4">
   {months.map(({start,dias})=><div key={String(start)} className="w-[168px]">
    <p className="mb-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-t3">{new Intl.DateTimeFormat('pt-BR',{month:'short',year:'2-digit'}).format(start).replace('.','')}</p>
    <div className="overflow-hidden rounded-[10px] border border-border">
     {dias.map(({day,saldo,domingo,quinto,wd})=><div key={day} className={cn('grid grid-cols-[52px_1fr] border-b border-border/60 last:border-0',quinto&&'ring-1 ring-inset ring-yellow/30')}>
      <span aria-label={quinto?`${day}, quinto dia útil`:undefined} className={cn('number flex items-center justify-center bg-el/50 py-[8px] text-[11px] font-bold',domingo?'text-red':'text-t2',quinto&&'bg-yellow/10')}><span className="inline-flex items-center gap-[3px]">{quinto&&<IconStarFilled size={7} className="shrink-0 text-yellow"/>}<span>{String(day).padStart(2,'0')}<span className="text-[9px] font-semibold opacity-70">/{wd}</span></span></span></span>
      <span className="number flex items-center justify-end pr-2 text-[11px] font-semibold" style={saldoStyle(saldo,limites)}>{hidden?'••••':money(saldo)}</span>
     </div>)}
   </div>
  </div>)}
  </div>
  </div>
 </div>
}

const typeSingular:Record<FluxTipo,string>={entrada:'entrada',saida:'saída',diario:'diário',economia:'economia',cartao:'gasto com cartão'}
const typeHint:Record<FluxTipo,string>={entrada:'salário, comissão, vales',saida:'gastos fixos, boletos, aluguel',diario:'gastos variáveis, compras',economia:'reserva, investimento',cartao:'gastos ou total da fatura'}

function NewTransaction({close,edit,occurrenceDate}:{close:()=>void;edit:FluxLancamento|null;occurrenceDate?:string}){
  const {data,mutate}=useFinancas()
  const [type,setType]=useState<FluxTipo|null>(edit?.tipo??null)
  const [desc,setDesc]=useState(edit?.descricao??'');const [value,setValue]=useState(edit?.valor??0);const [tags,setTags]=useState<string[]>(edit?.tag_ids?.length?edit.tag_ids:edit?.tag_id?[edit.tag_id]:[])
  const [date,setDate]=useState(edit?(occurrenceDate??edit.data):localISO(new Date()))
  const [repete,setRepete]=useState(Boolean(edit?.repete))
  const [frequencia,setFrequencia]=useState<RepeticaoFrequencia>(edit?.repete?.frequencia??'mensal')
  const [vezes,setVezes]=useState(edit?.repete?.vezes??0)
  const [installmentDraft,setInstallmentDraft]=useState(edit?.repete?.vezes?String(edit.repete.vezes):'')
  const [installmentFocused,setInstallmentFocused]=useState(false)
  const [dateScopeOpen,setDateScopeOpen]=useState(false)
 const cartoes:Cartao[]=data.flux.cartoes??[]
 const [cartaoId,setCartaoId]=useState(cartoes[0]?.id??'')
 const cartao=cartoes.find(c=>c.id===cartaoId)
 const color=type?fluxMeta[type].color:'var(--flux-orange)'
 const row='flex min-h-[56px] items-center gap-3 border-b border-border last:border-0'
 const formOriginalDate=occurrenceDate??edit?.data
 const formDateChanged=Boolean(edit?.repete&&formOriginalDate&&date!==formOriginalDate)
 const formValueChanged=Boolean(edit?.repete&&edit&&value!==edit.valor)
 const formRecurrenceChanged=Boolean(edit?.repete&&frequencia!==(edit.repete.frequencia??'mensal'))
 const updateInstallments=(raw:string)=>{const draft=raw.replace(/\D/g,'').slice(0,3);setInstallmentDraft(draft);setVezes(draft?Math.min(120,Number(draft)):0)}
 const selectInstallments=(months:number)=>{setInstallmentDraft(String(months));setVezes(months);setInstallmentFocused(false)}
 const commitInstallments=()=>{const months=Math.min(120,Math.max(0,Number(installmentDraft)||0));setInstallmentDraft(months?String(months):'');setVezes(months);setInstallmentFocused(false)}
 const saveTransaction=(scope:'one'|'future'|null=null)=>{
  if(!type||!desc||!value)return
  const selectedFormDate=occurrenceDate??edit?.data
  const recurrenceRule:'data'|'quinto_util'=repete&&frequencia==='mensal'&&(isFifthBusinessDay(date)||(edit?.repete?.regra==='quinto_util'&&date===selectedFormDate))?'quinto_util':'data'
  const nextRepete=repete?{vezes:vezes>0?vezes:null,frequencia,regra:recurrenceRule,...(edit?.repete?.excluidas?{excluidas:edit.repete.excluidas}: {})}:null
  mutate(d=>{
   if(!edit){d.flux.lancamentos.push({id:uid(),data:date,tipo:type,valor:value,descricao:desc,tag_id:tags[0]??null,tag_ids:tags,repete:nextRepete});return}
   const current=d.flux.lancamentos.find(item=>item.id===edit.id)
   if(!current)return
   const selectedDate=occurrenceDate??current.data
   const dateChanged=Boolean(current.repete&&date!==selectedDate)
   const valueChanged=Boolean(current.repete&&value!==current.valor)
   const recurrenceChanged=dateChanged||valueChanged||formRecurrenceChanged
   const fields={tipo:type,valor:value,descricao:desc,tag_id:tags[0]??null,tag_ids:tags}
   if(scope==='one'&&recurrenceChanged&&current.repete){
    current.repete.excluidas=Array.from(new Set([...(current.repete.excluidas??[]),selectedDate]))
    d.flux.lancamentos.push({id:uid(),data:date,...fields,repete:null})
    return
   }
   if(scope==='future'&&recurrenceChanged&&current.repete){
    const originalRepete=current.repete
    const index=occurrenceDate?recurrenceOccurrenceIndex(current,occurrenceDate):0
    if(index<=0){current.data=date;Object.assign(current,fields);current.repete=nextRepete;return}
    current.repete={...originalRepete,vezes:originalRepete.vezes==null?index:Math.min(originalRepete.vezes,index),excluidas:originalRepete.excluidas?.filter(item=>item<selectedDate)}
    const remaining=originalRepete.vezes==null?null:Math.max(1,originalRepete.vezes-index)
    d.flux.lancamentos.push({id:uid(),data:date,...fields,repete:repete?{vezes:remaining,regra:recurrenceRule}:null})
    return
   }
   current.data=occurrenceDate&&occurrenceDate!==current.data?current.data:date
   Object.assign(current,fields)
   current.repete=nextRepete
  })
  close()
 }
 const submit=()=>{
  if(edit?.repete&&(formDateChanged||formValueChanged||formRecurrenceChanged)){setDateScopeOpen(true);return}
  saveTransaction()
 }
 return <div className="absolute inset-0 z-50 flex items-end bg-black/70" onClick={close}>
  <div onClick={e=>e.stopPropagation()} className="safe-bottom max-h-[92%] w-full overflow-y-auto rounded-t-[28px] border-t border-border bg-bg px-4 pb-5 pt-2.5 shadow-[0_-18px_44px_rgba(0,0,0,.18)]">
   <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-border"/>
   {!type?<>
    <div className="mb-3 flex items-center justify-between gap-3 px-1"><div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-flux">Nova movimentação</p><h2 className="mt-0.5 text-[18px] font-bold text-t1">O que deseja adicionar?</h2></div><button aria-label="Fechar" onClick={close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-t2 transition active:scale-95"><X size={15}/></button></div>
    <div className="mb-3 overflow-hidden rounded-[22px] border border-flux/15 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--flux-orange)_10%,var(--surface)),var(--surface)_74%)] p-4 shadow-[0_10px_28px_rgba(70,40,24,.06)]"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-flux text-white shadow-sm"><Plus size={18} strokeWidth={2.5}/></span><div><p className="text-[11px] font-bold text-t1">Escolha o tipo da movimentação</p><p className="mt-0.5 text-[9px] leading-relaxed text-t3">Depois você informa valor, data e organização.</p></div></div></div>
    <p className="mb-2 px-1 text-[8px] font-extrabold uppercase tracking-[1px] text-t3">Categorias</p>
    <div className="grid grid-cols-2 gap-2">
     {(Object.keys(fluxMeta) as FluxTipo[]).map((x,index)=><button key={x} onClick={()=>{setType(x);if(x==='cartao'&&cartoes[0])setDate(localISO(cardBillingDates(cartoes[0]).vencimento))}} className={cn('group min-h-[112px] rounded-[18px] border bg-surface p-3 text-left shadow-[0_7px_20px_rgba(70,40,24,.04)] transition active:scale-[.97]',index===4&&'col-span-2 min-h-[88px]')} style={{borderColor:`color-mix(in srgb, ${fluxMeta[x].color} 18%, var(--border))`,background:`linear-gradient(145deg,color-mix(in srgb, ${fluxMeta[x].color} 7%, var(--surface)),var(--surface) 68%)`}}>
      <span className={cn('flex h-full gap-2.5',index===4?'items-center':'flex-col justify-between')}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] text-white shadow-sm" style={{background:fluxMeta[x].color}}><FluxTypeIcon tipo={x} size={16}/></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-1"><b className="block text-[13px] font-bold text-t1">{typeSingular[x]}</b><ChevronRight size={13} className="shrink-0 text-t3"/></span><span className="mt-1 block text-[9px] leading-snug text-t3">{typeHint[x]}</span></span></span>
     </button>)}
    </div>
   </>:<>
    <div className="mb-3 flex items-center justify-between gap-3 px-1">
     <button type="button" aria-label="Voltar aos tipos" onClick={()=>setType(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-t2 transition active:scale-95"><ChevronLeft size={16}/></button>
     <div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[1px]" style={{color}}>{edit?'Editar movimentação':'Nova movimentação'}</p><h2 className="truncate text-[17px] font-bold text-t1">{edit?'Editar':'Adicionar'} {typeSingular[type]}</h2></div>
     <button type="button" aria-label="Fechar" onClick={close} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-surface text-t2 transition active:scale-95"><X size={15}/></button>
    </div>

    <div className="overflow-hidden rounded-[22px] border p-4 shadow-[0_10px_28px_rgba(70,40,24,.06)]" style={{borderColor:`color-mix(in srgb, ${color} 20%, var(--border))`,background:`linear-gradient(135deg,color-mix(in srgb, ${color} 12%, var(--surface)),var(--surface) 72%)`}}>
     <button type="button" onClick={()=>setType(null)} className="flex w-full items-center gap-2.5 text-left">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[11px] text-white shadow-sm" style={{background:color}}><FluxTypeIcon tipo={type} size={14}/></span>
      <span className="min-w-0 flex-1"><span className="block text-[11px] font-bold text-t1">{typeSingular[type]}</span><span className="block truncate text-[9px] text-t3">{typeHint[type]}</span></span>
      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-t3">alterar<IconChevronDown size={12}/></span>
     </button>
     <div className="mt-4 border-t pt-3" style={{borderColor:`color-mix(in srgb, ${color} 18%, var(--border))`}}>
      <p className="text-[9px] font-extrabold uppercase tracking-[1px] text-t3">Valor da movimentação</p>
      <MoneyInput autoFocus aria-label="Valor" value={value} onValueChange={setValue} className="mt-0.5 h-auto rounded-none border-0 bg-transparent p-0 text-[38px] font-black tracking-[-1.8px]" style={{color:value?color:undefined}}/>
     </div>
    </div>

    <div className="mt-3 overflow-hidden rounded-[20px] border border-border bg-surface shadow-[0_8px_24px_rgba(70,40,24,.045)]">
     <div className="border-b border-border bg-el/25 px-4 py-2"><p className="text-[8px] font-extrabold uppercase tracking-[1px] text-t3">Detalhes</p></div>
     <label className={cn(row,'px-4')}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-el text-t2"><IconPencil size={15}/></span><span className="min-w-0 flex-1"><span className="block text-[9px] font-semibold text-t3">Descrição</span><input aria-label="Descrição" placeholder="Ex.: salário de julho" value={desc} onChange={e=>setDesc(e.target.value)} className="mt-0.5 h-5 w-full bg-transparent text-[13px] font-semibold text-t1 outline-none placeholder:font-normal placeholder:text-t3"/></span></label>
     <div className="px-4 py-3">
      <div className="flex items-center gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-el text-t2"><IconCalendar size={15}/></span><span className="flex-1"><span className="block text-[9px] font-semibold text-t3">Data</span><span className="text-[12px] font-semibold text-t1">Quando aconteceu</span></span><AurvmDatePicker value={date} onChange={setDate} accentColor={color} className="h-8 bg-el/45 px-2.5"/></div>
     </div>
    </div>

    <div className={cn('mt-3 rounded-[20px] border border-border bg-surface shadow-[0_8px_24px_rgba(70,40,24,.045)]',installmentFocused?'overflow-visible':'overflow-hidden')}>
     <div className="border-b border-border bg-el/25 px-4 py-2"><p className="text-[8px] font-extrabold uppercase tracking-[1px] text-t3">Organização</p></div>
     <div className={cn(row,'px-4')}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-el text-t2"><IconRepeat size={15}/></span><AurvmSelect ariaLabel="Repetir" value={repete?frequencia:'nao'} onChange={value=>{if(value==='nao'){setRepete(false);return}setRepete(true);setFrequencia(value as RepeticaoFrequencia)}} className="h-full flex-1 border-0 bg-transparent px-0 text-[13px]" options={recurrenceOptions}/>{repete&&<div className="relative shrink-0"><label className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[10px] font-semibold text-t2"><span>por</span><input aria-label={`Quantidade de ${frequencia==='semanal'?'semanas':frequencia==='diaria'?'dias':'meses'}`} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={installmentDraft} placeholder="∞" onFocus={()=>setInstallmentFocused(true)} onBlur={commitInstallments} onChange={e=>updateInstallments(e.target.value)} className="no-spin w-8 bg-transparent text-center text-t1 outline-none"/><span>{vezes?(vezes===1?(frequencia==='semanal'?'semana':frequencia==='diaria'?'dia':'mês'):(frequencia==='semanal'?'semanas':frequencia==='diaria'?'dias':'meses')):'sem fim'}</span></label>{installmentFocused&&<div role="listbox" aria-label={`Sugestões de ${frequencia==='semanal'?'semanas':frequencia==='diaria'?'dias':'meses'}`} className="absolute bottom-full right-0 z-30 mb-1 grid min-w-[188px] grid-cols-4 gap-1 rounded-[12px] border border-border bg-surface p-1.5 shadow-[0_12px_28px_rgba(0,0,0,.3)]">{recurrenceSuggestions.map(months=><button key={months} type="button" role="option" aria-label={`Usar ${months} ${frequencia==='semanal'?'semanas':frequencia==='diaria'?'dias':'meses'}`} onPointerDown={event=>event.preventDefault()} onClick={()=>selectInstallments(months)} className="h-8 rounded-[9px] bg-el/60 text-[11px] font-bold text-t2 transition hover:bg-el active:scale-95">{months}</button>)}</div>}</div>}</div>
    {type==='cartao'&&cartoes.length>0&&<>
     <div className={cn(row,'px-4')}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-el text-t2"><IconCreditCard size={15}/></span><AurvmSelect ariaLabel="Cartão" value={cartaoId} onChange={value=>{setCartaoId(value);const selected=cartoes.find(card=>card.id===value);if(selected)setDate(localISO(cardBillingDates(selected).vencimento))}} className="h-full flex-1 border-0 bg-transparent px-0 text-[13px]" options={cartoes.map(card=>({value:card.id,label:card.nome,caption:`fecha dia ${card.fechamento} · vence dia ${card.vencimento}`,icon:<IconCreditCard size={13}/>,color}))}/></div>
     {cartao&&<><div className={cn(row,'px-4')}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-el text-t2"><IconCalendar size={15}/></span><span className="flex-1 text-[13px] font-semibold text-t1">fechamento da fatura</span><span className="number text-[12px] font-semibold text-t2">{shortDateLabel(cardBillingDates(cartao).fechamento)}</span></div><div className={cn(row,'px-4')}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-el text-t2"><CalendarRange size={15}/></span><span className="flex-1 text-[13px] font-semibold text-t1">vencimento no Flux</span><span className="number text-[12px] font-semibold text-flux">{shortDateLabel(cardBillingDates(cartao).vencimento)}</span></div></>}
     </>}
     <div className={cn(row,'px-4')}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-el text-t2"><IconTag size={15}/></span><AurvmSelect ariaLabel="Tags" multiple values={tags} onValuesChange={setTags} placeholder="Sem tag" searchable searchPlaceholder="Buscar tag" className="h-full flex-1 border-0 bg-transparent px-0 text-[13px]" options={[{value:'',label:'Sem tag',caption:'não categorizar',icon:<IconTag size={13}/>,color:'var(--t3)'},...data.flux.tags.filter(t=>!t.oculta).map(item=>({value:item.id,label:item.label,caption:'tag de movimentação',icon:<IconTag size={13}/>,color:item.cor}))]}/></div>
    </div>
     <button disabled={!desc||!value} onClick={submit} className="mt-4 h-[52px] w-full rounded-[18px] text-sm font-bold text-white shadow-[0_10px_24px_rgba(55,35,20,.12)] transition active:scale-[.98] disabled:shadow-none disabled:opacity-40" style={{background:color}}>{edit?'salvar alterações':`adicionar ${typeSingular[type]}`}</button>
    <button onClick={close} className="mt-2 h-10 w-full text-sm font-bold text-t2 transition active:scale-95">cancelar</button>
   {dateScopeOpen&&<div className="fixed inset-0 z-[80] flex items-end bg-black/70" onClick={()=>setDateScopeOpen(false)}>
    <div onClick={event=>event.stopPropagation()} className="safe-bottom w-full rounded-t-[26px] border-t border-border bg-bg px-4 pb-5 pt-2.5 shadow-[0_-18px_44px_rgba(0,0,0,.2)]">
     <div aria-hidden="true" className="mx-auto mb-4 h-1 w-9 rounded-full bg-border"/>
     <div className="mb-3 flex items-center gap-3 px-1"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-flux/10 text-flux"><IconRepeat size={18}/></span><div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-flux">Lançamento recorrente</p><h2 className="mt-0.5 text-[17px] font-bold text-t1">Aplicar alteração</h2></div></div>
     <p className="mb-3 px-1 text-[10px] leading-relaxed text-t2">Escolha se a alteração deve valer somente para esta ocorrência ou também para os próximos lançamentos.</p>
     <div className="overflow-hidden rounded-[20px] border border-border bg-surface">
      <button type="button" onClick={()=>{setDateScopeOpen(false);saveTransaction('one')}} className="flex w-full items-center border-b border-border px-4 py-4 text-left transition active:bg-el/60"><span className="flex-1"><span className="block text-[12px] font-bold text-t1">Somente este</span><span className="mt-1 block text-[9px] text-t3">Mantém as outras ocorrências como estão</span></span><ChevronRight size={15} className="text-t3"/></button>
      <button type="button" onClick={()=>{setDateScopeOpen(false);saveTransaction('future')} } className="flex w-full items-center px-4 py-4 text-left transition active:bg-el/60"><span className="flex-1"><span className="block text-[12px] font-bold text-t1">Este e os próximos</span><span className="mt-1 block text-[9px] text-t3">Mantém somente as ocorrências anteriores</span></span><ChevronRight size={15} className="text-t3"/></button>
     </div>
     <button type="button" onClick={()=>setDateScopeOpen(false)} className="mt-2 h-11 w-full text-[12px] font-bold text-t2">Cancelar</button>
    </div>
   </div>}
   </>}
  </div>
 </div>
}
