import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { IconCalendar, IconChevronLeft, IconChevronRight, IconPigMoney, IconRepeat, IconSortAscendingLetters, IconSortDescendingNumbers, IconStarFilled } from '@tabler/icons-react'
import { Currency } from '../components/Currency'
import { Card, ConfirmDialog, DangerButton, MoneyInput, Pill } from '../components/ui'
import { AurvmMonthPicker, AurvmSelect } from '../components/AurvmControls'
import { catColors, cn, localISO, monthLabel, monthTableLabel, projectSavings, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import type { Economia as EconomiaItem, RepeticaoFrequencia } from '../lib/types'

const ECONOMY_GREEN = catColors.economia
const installmentSuggestions = [2,3,4,5,6,7,8,9,10,11,12]
const repetitionOptions=[
  {value:'mensal',label:'mensalmente',caption:'repete o mesmo valor mensalmente',icon:<IconRepeat size={13}/>,color:ECONOMY_GREEN},
  {value:'semanal',label:'semanalmente',caption:'repete o mesmo valor semanalmente',icon:<IconRepeat size={13}/>,color:ECONOMY_GREEN},
  {value:'diaria',label:'diariamente',caption:'repete o mesmo valor diariamente',icon:<IconRepeat size={13}/>,color:ECONOMY_GREEN},
  {value:'nenhuma',label:'não repete',caption:'somente nesta data',icon:<IconCalendar size={13}/>,color:'var(--t2)'},
]
const economyTypeOptions=[
  {value:'recorrente',label:'Recorrente',caption:'entra todos os meses',icon:<IconRepeat size={13}/>,color:ECONOMY_GREEN},
  {value:'parcelado',label:'Parcelado',caption:'por uma quantidade de meses',icon:<IconCalendar size={13}/>,color:'#718096'},
  {value:'pontual',label:'Pontual',caption:'somente no mês escolhido',icon:<IconStarFilled size={12}/>,color:'#D99A20'},
]
type EconomyOrder='valor'|'nome'
const sortEconomies=(items:EconomiaItem[],order:EconomyOrder)=>[...items].sort((a,b)=>order==='nome'?a.label.localeCompare(b.label,'pt-BR'):b.valor-a.valor||a.label.localeCompare(b.label,'pt-BR'))

export function EconomiaPage() {
  const { data, mutate, setTab } = useFinancas()
  const projection = useMemo(()=>projectSavings(data,12),[data])
  const [selected,setSelected]=useState(0)
  const [expandedEconomy,setExpandedEconomy]=useState<string|null>(null)
  const order=data.config.preferencias?.economia_ordenacao??'valor'
  const setOrder=(value:EconomyOrder)=>mutate(d=>{d.config.preferencias??={};d.config.preferencias.economia_ordenacao=value})
  const point=projection[Math.min(selected,projection.length-1)]
  return <div className="pb-4">
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-[22px] pb-[14px] pt-0.5">
      <button onClick={()=>setTab('inicio')} className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-surface text-t2 shadow-[0_2px_8px_rgba(15,37,64,.07)]"><IconChevronLeft size={20}/></button>
      <div className="text-center"><p className="font-mono text-[9.5px] font-bold uppercase tracking-[2px]" style={{color:ECONOMY_GREEN}}>Reserva</p><h2 className="text-[16px] font-bold">Economia</h2></div>
      <div className="flex h-9 items-center justify-self-end rounded-xl bg-el p-[3px]"><button type="button" aria-label="Ordenar por maior valor" onClick={()=>setOrder('valor')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition',order==='valor'?'bg-surface shadow-[0_2px_7px_rgba(15,37,64,.09)]':'text-t3')} style={order==='valor'?{color:ECONOMY_GREEN}:undefined}><IconSortDescendingNumbers size={15}/></button><button type="button" aria-label="Ordenar por nome" onClick={()=>setOrder('nome')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition',order==='nome'?'bg-surface shadow-[0_2px_7px_rgba(15,37,64,.09)]':'text-t3')} style={order==='nome'?{color:ECONOMY_GREEN}:undefined}><IconSortAscendingLetters size={15}/></button></div>
    </div>
    <div className="overflow-hidden px-5 pb-[30px]">
      <EconomyHero forecast={projection[projection.length-1]?.acumulado??data.perfil.saldo_inicial} initial={data.perfil.saldo_inicial} monthly={data.perfil.economia_mensal} extras={data.economias.length}/>
      <div className="mt-3 space-y-3">
    <div className="overflow-hidden rounded-[18px] bg-surface shadow-[0_2px_10px_rgba(15,37,64,.05)]"><div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3" style={{background:`color-mix(in oklch,${ECONOMY_GREEN} 8%,transparent)`}}><div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase tracking-[1px] text-t3">Saldo inicial</p><p className="mt-1 text-[10px] text-t2">o que você já tem guardado hoje</p></div><MoneyInput aria-label="Saldo inicial" value={data.perfil.saldo_inicial} onValueChange={value=>mutate(d=>{d.perfil.saldo_inicial=value})} className="h-11 w-[154px] shrink-0 rounded-[12px] border-border bg-surface px-3 text-[22px] font-black tracking-[-1.1px]" inputClassName="text-right" style={{color:ECONOMY_GREEN}}/></div><div className="bg-bg/50 px-4 py-3"><p className="text-[9px] text-t3">Esse valor alimenta automaticamente a aba Economia.</p></div></div>
    <section><div className="mx-1 flex items-center justify-between pb-3 pt-2"><div className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-[2px]" style={{background:ECONOMY_GREEN}}/><span className="text-[14px] font-bold text-t1">Economias extras</span></div><button onClick={()=>{const id=uid();mutate(d=>d.economias.push({id,label:'Nova economia',valor:0,tipo:'recorrente',vezes:null,mes:null,frequencia:'mensal'}));setExpandedEconomy(id)}} className="rounded-full px-[11px] py-[5px] text-[11px] font-semibold" style={{color:ECONOMY_GREEN,background:`color-mix(in oklch,${ECONOMY_GREEN} 12%,transparent)`}}>+ Adicionar</button></div><div className="space-y-[9px]">{sortEconomies(data.economias,order).map(item=><EconomyRow key={item.id} item={item} open={expandedEconomy===item.id} onToggle={()=>setExpandedEconomy(current=>current===item.id?null:item.id)} onDelete={()=>setExpandedEconomy(null)}/>)}</div></section>
    <Card className="overflow-hidden rounded-[18px] border-0 p-0 shadow-[0_2px_10px_rgba(15,37,64,.05)]"><div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4"><div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase tracking-[.8px] text-t3">Detalhe do mês</p><AurvmSelect ariaLabel="Mês do detalhe" value={String(selected)} onChange={value=>setSelected(Number(value))} side="bottom" className="mt-1 h-8 border-0 bg-transparent px-0 text-[13px] font-semibold" options={projection.map((p,i)=>({value:String(i),label:monthLabel(p.key,true),icon:p.pontual?<IconStarFilled size={11}/>:<IconCalendar size={12}/>,color:p.pontual?'#D99A20':ECONOMY_GREEN}))}/></div><Pill color={ECONOMY_GREEN}>+ <Currency value={point.entrou} symbolClassName="opacity-100"/></Pill></div><div className="mx-4 rounded-[14px] px-3 py-3" style={{background:`color-mix(in oklch,${ECONOMY_GREEN} 8%,transparent)`}}><p className="font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3">Acumulado até este mês</p><Currency value={point.acumulado} className="mt-1 text-[28px] font-bold" symbolClassName="opacity-100" style={{color:ECONOMY_GREEN}}/></div><div className="px-4 pb-4 pt-3"><p className="font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3">Composição do mês</p><div className="mt-2 space-y-2 border-t border-border pt-3">{point.breakdown.map((b,i)=><div key={`${b.label}${i}`} className="flex items-center justify-between text-[12px]"><span className="text-t2">{b.label}</span><span className="flex items-baseline text-[12px]" style={{color:ECONOMY_GREEN}}>+ <Currency value={b.valor} className="ml-1 text-[12px] font-bold" symbolClassName="opacity-100"/></span></div>)}</div></div></Card>
    <section className="pb-3"><div className="mx-1 flex items-center gap-2 pb-3 pt-2 text-[14px] font-bold text-t1"><span className="h-2 w-2 shrink-0 rounded-[2px]" style={{background:ECONOMY_GREEN}}/>Tabela mensal</div><Card className="overflow-hidden rounded-[18px] border-0 shadow-[0_2px_10px_rgba(15,37,64,.05)]"><div className="grid grid-cols-3 bg-bg px-4 py-3 font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3"><span>Mês</span><span className="text-right">Entrou</span><span className="text-right">Acumulado</span></div>{projection.map((p,i)=><button key={p.key} onClick={()=>setSelected(i)} className="grid w-full grid-cols-3 border-t border-border/60 px-4 py-3 text-left text-[12px] transition active:bg-el/50" style={selected===i?{background:`color-mix(in oklch,${ECONOMY_GREEN} 8%,transparent)`}:undefined}><span className="flex items-center gap-1 text-t2">{monthTableLabel(p.key)}{p.pontual&&<IconStarFilled aria-label="mês com economia pontual" size={10} className="shrink-0 text-yellow"/>}</span><Currency value={p.entrou} className="text-[12px] justify-self-end" symbolClassName="opacity-100" style={{color:ECONOMY_GREEN}}/><Currency value={p.acumulado} className="text-[12px] justify-self-end font-bold" symbolClassName="opacity-100" style={{color:ECONOMY_GREEN}}/></button>)}</Card></section>
      </div>
    </div>
  </div>
}

function EconomyHero({forecast,initial,monthly,extras}:{forecast:number;initial:number;monthly:number;extras:number}){
  return <section className="mb-0">
    <div className="rounded-[24px] px-[22px] pb-[22px] pt-5" style={{background:'linear-gradient(150deg,#173a44 0%,#2d7d84 55%,#8fc9c6 112%)'}}>
      <p className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[1.5px] text-white/85"><IconPigMoney size={12} strokeWidth={2.4}/>Reserva em 12 meses</p>
      <Currency value={forecast} className="mt-3 text-[40px] font-black leading-none tracking-[-2px] text-white" symbolClassName="text-white opacity-55" amountClassName="text-white"/>
      <p className="mt-2 text-[11px] text-white">saldo inicial + economia mensal + extras</p>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2.5">
      <EconomyKpi label="Guardado hoje"><Currency value={initial} className="text-[15px] font-bold" symbolClassName="opacity-100" style={{color:ECONOMY_GREEN}}/></EconomyKpi>
      <EconomyKpi label="Por mês"><Currency value={monthly} className="text-[15px] font-bold" symbolClassName="opacity-100" style={{color:ECONOMY_GREEN}}/></EconomyKpi>
      <EconomyKpi label="Extras"><span className="number text-[15px] font-bold text-t1">{extras}</span></EconomyKpi>
    </div>
  </section>
}

function EconomyKpi({label,children}:{label:string;children:ReactNode}){
  return <div className="min-w-0 rounded-[16px] bg-surface p-[13px] shadow-[0_2px_10px_rgba(15,37,64,.05)]"><p className="truncate font-mono text-[8.5px] font-medium uppercase tracking-[.8px] text-t3">{label}</p><div className="mt-[7px] truncate">{children}</div></div>
}

function EconomyRow({item,open,onToggle,onDelete}:{item:EconomiaItem;open:boolean;onToggle:()=>void;onDelete:()=>void}) {
  const mutate=useFinancas(s=>s.mutate)
  const [confirming,setConfirming]=useState(false)
  const update=(change:(target:EconomiaItem)=>void)=>mutate(d=>{const target=d.economias.find(x=>x.id===item.id);if(target)change(target)})
  const [installmentDraft,setInstallmentDraft]=useState(String(item.vezes??1))
  const [installmentFocused,setInstallmentFocused]=useState(false)
  useEffect(()=>{if(!installmentFocused)setInstallmentDraft(String(item.vezes??1))},[item.vezes,installmentFocused])
  const updateInstallments=(raw:string)=>{const draft=raw.replace(/\D/g,'').slice(0,3);setInstallmentDraft(draft);if(draft&&Number(draft)>0)update(target=>{target.vezes=Number(draft)})}
  const selectInstallments=(value:number)=>{setInstallmentDraft(String(value));update(target=>{target.vezes=value})}
  const commitInstallments=()=>{const value=Math.max(1,Number(installmentDraft)||1);setInstallmentDraft(String(value));update(target=>{target.vezes=value});setInstallmentFocused(false)}
  const frequency=item.frequencia??(item.tipo==='recorrente'?'mensal':'nenhuma')
  const valueStyle={background:`color-mix(in oklch,${ECONOMY_GREEN} 10%,transparent)`,borderColor:`color-mix(in oklch,${ECONOMY_GREEN} 20%,transparent)`,color:ECONOMY_GREEN}
  const chip='inline-flex h-10 shrink-0 items-center rounded-[11px] border border-border bg-bg text-[10px] font-semibold text-t2'
  return <><Card className={cn('rounded-[16px] border-0 shadow-[0_2px_9px_rgba(15,37,64,.04)]',open?'overflow-visible':'overflow-hidden')}>
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-[15px] text-left transition active:bg-el/50">
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-t1">{item.label||'Nova economia'}</span>
      <Currency value={item.valor} className="text-[13px] font-bold" symbolClassName="opacity-100" style={{color:ECONOMY_GREEN}}/>
      <IconChevronRight size={14} className={cn('shrink-0 text-t3 transition',open&&'rotate-90')}/>
    </button>
    {open&&<div className="border-t border-border/60 bg-bg/70 px-3 pb-3 pt-3">
      <div className="rounded-[14px] border border-border bg-surface p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_128px] gap-2">
          <label className="min-w-0"><span className="mb-1.5 block font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3">Nome</span><input aria-label={`Nome de ${item.label}`} value={item.label} onChange={e=>update(x=>{x.label=e.target.value})} className="h-10 w-full rounded-[11px] border border-border bg-bg px-3 text-xs font-semibold text-t1 outline-none transition focus:border-accent"/></label>
          <label><span className="mb-1.5 block font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3">Valor</span><MoneyInput aria-label={`Valor de ${item.label}`} value={item.valor} onValueChange={value=>update(x=>{x.valor=value})} className="h-10 rounded-[11px] bg-bg px-2.5 text-xs font-bold" inputClassName="text-right" style={valueStyle}/></label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <AurvmSelect ariaLabel={`Tipo de ${item.label}`} value={item.tipo} onChange={value=>update(x=>{x.tipo=value as EconomiaItem['tipo'];x.vezes=x.tipo==='parcelado'?1:null;x.mes=x.tipo==='pontual'?localISO(new Date()).slice(0,7):null;x.frequencia=x.tipo==='recorrente'?(x.frequencia==='nenhuma'||!x.frequencia?'mensal':x.frequencia):x.tipo==='pontual'?'nenhuma':null})} options={economyTypeOptions} className="h-10 rounded-[11px] border-border bg-bg px-3 text-[10px] font-semibold"/>
        {item.tipo==='recorrente'&&<AurvmSelect ariaLabel={`Repetir ${item.label}`} value={frequency} onChange={value=>update(x=>{if(value==='nenhuma'){x.tipo='pontual';x.frequencia='nenhuma';x.mes=localISO(new Date()).slice(0,7)}else{x.frequencia=value as RepeticaoFrequencia}})} options={repetitionOptions} className="h-10 rounded-[11px] border-border bg-bg px-3 text-[10px] font-semibold"/>}
        {item.tipo==='parcelado'&&<div className="relative"><label className={`${chip} h-10 gap-0.5 px-3`}><input aria-label={`Quantidade de parcelas de ${item.label}`} type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={installmentDraft} onFocus={()=>setInstallmentFocused(true)} onBlur={commitInstallments} onChange={e=>updateInstallments(e.target.value)} className="no-spin w-7 bg-transparent text-right outline-none"/><span aria-hidden="true">x</span></label>{installmentFocused&&<div role="listbox" aria-label="Sugestões de parcelas" className="absolute bottom-full left-0 z-30 mb-1 grid min-w-[188px] grid-cols-4 gap-1 rounded-[12px] border border-border bg-surface p-1.5 shadow-[0_12px_28px_rgba(0,0,0,.3)]">{installmentSuggestions.map(value=><button key={value} type="button" role="option" aria-label={`Usar ${value} parcelas`} onPointerDown={event=>event.preventDefault()} onClick={()=>selectInstallments(value)} className="h-8 rounded-[9px] bg-el/60 text-[11px] font-bold text-t2 transition hover:bg-el active:scale-95">{value}</button>)}</div>}</div>}
        {item.tipo==='pontual'&&<AurvmMonthPicker ariaLabel={`Mês de ${item.label}`} value={item.mes??localISO(new Date()).slice(0,7)} onChange={value=>update(x=>{x.mes=value})} icon={<IconStarFilled aria-hidden="true" size={9} className="shrink-0 text-yellow"/>} className="h-10 max-w-[155px] rounded-[11px] border-border bg-bg px-3"/>}
          <DangerButton aria-label={`Excluir ${item.label}`} onClick={()=>setConfirming(true)} className="ml-auto h-10 w-10 rounded-[11px]"/>
        </div>
      </div>
    </div>}
  </Card>{confirming&&<ConfirmDialog title={`Excluir ${item.label||'esta economia'}?`} message="Esta economia extra será removida da projeção. Essa ação não pode ser desfeita." confirmLabel="Excluir economia" onConfirm={()=>{mutate(d=>{d.economias=d.economias.filter(x=>x.id!==item.id)});setConfirming(false);onDelete()}} onCancel={()=>setConfirming(false)}/>}</>
}
