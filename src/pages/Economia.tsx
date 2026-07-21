import { useMemo, useState } from 'react'
import { IconArrowRight, IconCalendar, IconChevronRight, IconPencil, IconRepeat, IconStarFilled } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader'
import { Currency } from '../components/Currency'
import { AddButton, Card, ChipButton, DangerButton, MoneyInput, Pill } from '../components/ui'
import { AurvmMonthPicker, AurvmSelect } from '../components/AurvmControls'
import { SunriseHero } from '../components/SunriseHero'
import { cn, monthLabel, monthTableLabel, projectSavings, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import type { Economia as EconomiaItem } from '../lib/types'

const ECONOMY_GREEN = '#2E9E5B'
const economyTypeOptions=[
  {value:'recorrente',label:'Recorrente',caption:'entra todos os meses',icon:<IconRepeat size={13}/>,color:ECONOMY_GREEN},
  {value:'parcelado',label:'Parcelado',caption:'por uma quantidade de meses',icon:<IconCalendar size={13}/>,color:'#718096'},
  {value:'pontual',label:'Pontual',caption:'somente no mês escolhido',icon:<IconStarFilled size={12}/>,color:'#D99A20'},
]

export function EconomiaPage() {
  const { data, mutate, setTab } = useFinancas()
  const projection = useMemo(()=>projectSavings(data,12),[data])
  const [selected,setSelected]=useState(0)
  const [expandedEconomy,setExpandedEconomy]=useState<string|null>(null)
  const point=projection[Math.min(selected,projection.length-1)]
  return <div className="page"><PageHeader eyebrow="Reserva" title="Economia" subtitle="saldo inicial e entradas extras"/><SunriseHero label="Reserva em 12 meses" value={<Currency value={projection[projection.length-1]?.acumulado??data.perfil.saldo_inicial}/>} caption={<>projeção com saldo inicial <span>+</span> economia mensal <span>+</span> extras</>} kpis={[{label:'Guardado hoje',value:<Currency value={data.perfil.saldo_inicial}/>,sub:'saldo inicial',className:'text-green'},{label:'Por mês',value:<Currency value={data.perfil.economia_mensal}/>,sub:'vem da Tabela',className:'text-green'},{label:'Extras',value:String(data.economias.length),sub:data.economias.length===1?'complemento ativo':'complementos ativos'}]}/><div className="space-y-3 px-4">
    <Card className="flex items-center justify-between rounded-[14px] p-4"><div><p className="mb-1 flex items-center text-[10px] font-extrabold uppercase tracking-[.8px] text-t3"><i className="mark-diamond"/>Saldo inicial</p><MoneyInput value={data.perfil.saldo_inicial} onValueChange={value=>mutate(d=>{d.perfil.saldo_inicial=value})} className="number h-9 w-44 border-0 bg-transparent p-0 text-[28px] font-black tracking-[-1.5px]" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">o que você já tem guardado hoje</p></div><span className="glass-action glass-neutral inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold"><IconPencil size={12}/>Editar</span></Card><Card className="flex items-center justify-between rounded-[14px] px-4 py-[13px]" style={{background:`${ECONOMY_GREEN}0A`}}><div><p className="mb-1 flex items-center text-[10px] font-extrabold uppercase tracking-[.8px] text-t3"><i className="mark-diamond"/>Economia mensal</p><Currency value={data.perfil.economia_mensal} className="text-[26px] font-black tracking-[-1.5px]" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">preenchido automaticamente · vem da Tabela</p></div><ChipButton onClick={()=>setTab('tabela')}>Tabela<IconArrowRight size={12}/></ChipButton></Card>
    <section><div className="flex items-center justify-between px-[14px] pb-1.5 pt-2 text-[10px] font-extrabold uppercase tracking-[1px] text-t3"><span className="flex items-center"><i className="mark-diamond"/>Economias extras</span><AddButton onClick={()=>{const id=uid();mutate(d=>d.economias.push({id,label:'Nova economia',valor:0,tipo:'recorrente',vezes:null,mes:null}));setExpandedEconomy(id)}}/></div><div className="space-y-2">{data.economias.map(item=><EconomyRow key={item.id} item={item} open={expandedEconomy===item.id} onToggle={()=>setExpandedEconomy(current=>current===item.id?null:item.id)} onDelete={()=>setExpandedEconomy(null)}/>)}</div></section>
    <Card className="p-5"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-[10px] text-t3">Detalhe do mês</p><AurvmSelect ariaLabel="Mês do detalhe" value={String(selected)} onChange={value=>setSelected(Number(value))} side="bottom" className="mt-1 h-8 border-0 bg-transparent px-0 text-sm" options={projection.map((p,i)=>({value:String(i),label:monthLabel(p.key,true),icon:p.pontual?<IconStarFilled size={11}/>:<IconCalendar size={12}/>,color:p.pontual?'#D99A20':ECONOMY_GREEN}))}/></div><Pill color={ECONOMY_GREEN}>+ <Currency value={point.entrou}/></Pill></div><Currency value={point.acumulado} className="mt-5 text-[31px] font-bold" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">acumulado até este mês</p><div className="mt-5 space-y-2 border-t border-border pt-4">{point.breakdown.map((b,i)=><div key={`${b.label}${i}`} className="flex justify-between text-[11px]"><span className="text-t2">{b.label}</span><span className="flex items-baseline" style={{color:ECONOMY_GREEN}}>+ <Currency value={b.valor} className="ml-1 font-bold"/></span></div>)}</div></Card>
    <section className="pb-3"><p className="flex items-center px-[14px] pb-1.5 pt-2 text-[10px] font-extrabold uppercase tracking-[1px] text-t3"><i className="mark-diamond"/>Tabela mensal</p><Card className="overflow-hidden"><div className="grid grid-cols-3 px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-t3"><span>Mês</span><span className="text-right">Entrou</span><span className="text-right">Acumulado</span></div>{projection.map((p,i)=><button key={p.key} onClick={()=>setSelected(i)} className="grid w-full grid-cols-3 border-t border-border px-4 py-3 text-left text-[11px] transition" style={selected===i?{background:`${ECONOMY_GREEN}0D`}:undefined}><span className="flex items-center gap-1 text-t2">{monthTableLabel(p.key)}{p.pontual&&<IconStarFilled aria-label="mês com economia pontual" size={9} className="shrink-0 text-yellow"/>}</span><Currency value={p.entrou} className="justify-self-end" style={{color:ECONOMY_GREEN}}/><Currency value={p.acumulado} className="justify-self-end font-bold" style={{color:ECONOMY_GREEN}}/></button>)}</Card></section>
  </div></div>
}

function EconomyRow({item,open,onToggle,onDelete}:{item:EconomiaItem;open:boolean;onToggle:()=>void;onDelete:()=>void}) {
  const mutate=useFinancas(s=>s.mutate)
  const update=(change:(target:EconomiaItem)=>void)=>mutate(d=>{const target=d.economias.find(x=>x.id===item.id);if(target)change(target)})
  const valueStyle={background:`${ECONOMY_GREEN}0A`,borderColor:`${ECONOMY_GREEN}20`,color:ECONOMY_GREEN}
  const chip='inline-flex h-7 shrink-0 items-center rounded-full border border-border bg-el/60 text-[10px] font-semibold text-t2'
  return <Card className="overflow-hidden rounded-[16px]">
    <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center gap-3 px-[14px] py-3 text-left transition active:bg-el/50">
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-t1">{item.label||'Nova economia'}</span>
      <Currency value={item.valor} className="text-[13px] font-bold" style={{color:ECONOMY_GREEN}}/>
      <IconChevronRight size={14} className={cn('shrink-0 text-t3 transition',open&&'rotate-90')}/>
    </button>
    {open&&<div className="border-t border-border bg-el/25 px-[14px] pb-3 pt-3">
      <div className="grid grid-cols-[minmax(0,1fr)_128px] gap-2">
        <label className="min-w-0"><span className="mb-1 block text-[8px] font-bold uppercase tracking-[.7px] text-t3">Nome</span><input aria-label={`Nome de ${item.label}`} value={item.label} onChange={e=>update(x=>{x.label=e.target.value})} className="h-9 w-full rounded-[11px] border border-border bg-surface px-3 text-xs font-semibold text-t1 outline-none transition focus:border-accent"/></label>
        <label><span className="mb-1 block text-[8px] font-bold uppercase tracking-[.7px] text-t3">Valor</span><MoneyInput aria-label={`Valor de ${item.label}`} value={item.valor} onValueChange={value=>update(x=>{x.valor=value})} className="h-9 rounded-[11px] bg-surface px-2.5 text-xs font-bold" inputClassName="text-right" style={valueStyle}/></label>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        <AurvmSelect ariaLabel={`Tipo de ${item.label}`} value={item.tipo} onChange={value=>update(x=>{x.tipo=value as EconomiaItem['tipo'];x.vezes=x.tipo==='parcelado'?1:null;x.mes=x.tipo==='pontual'?new Date().toISOString().slice(0,7):null})} options={economyTypeOptions} className="h-8 rounded-full px-3 text-[10px]"/>
        {item.tipo==='parcelado'&&<label className={`${chip} h-8 gap-0.5 px-3`}><input aria-label={`Quantidade de parcelas de ${item.label}`} type="number" min="1" value={item.vezes??1} onChange={e=>update(x=>{x.vezes=Math.max(1,Number(e.target.value))})} className="no-spin w-5 bg-transparent text-right outline-none"/><span aria-hidden="true">x</span></label>}
        {item.tipo==='pontual'&&<AurvmMonthPicker ariaLabel={`Mês de ${item.label}`} value={item.mes??new Date().toISOString().slice(0,7)} onChange={value=>update(x=>{x.mes=value})} icon={<IconStarFilled aria-hidden="true" size={9} className="shrink-0 text-yellow"/>} className="h-8 max-w-[155px]"/>}
        <DangerButton aria-label={`Excluir ${item.label}`} onClick={()=>{mutate(d=>{d.economias=d.economias.filter(x=>x.id!==item.id)});onDelete()}} className="ml-auto"/>
      </div>
    </div>}
  </Card>
}
