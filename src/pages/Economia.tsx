import { useMemo, useState } from 'react'
import { IconTrash as Trash2 } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader'
import { Currency } from '../components/Currency'
import { AddButton, Card, MoneyInput, Pill, SectionTitle } from '../components/ui'
import { monthLabel, monthTableLabel, projectSavings, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import type { Economia as EconomiaItem } from '../lib/types'

const ECONOMY_GREEN = '#20A968'

export function EconomiaPage() {
  const { data, mutate, setTab } = useFinancas()
  const projection = useMemo(()=>projectSavings(data,12),[data])
  const [selected,setSelected]=useState(0)
  const point=projection[Math.min(selected,projection.length-1)]
  return <div className="page"><PageHeader title="Economia" subtitle="saldo inicial e entradas extras"/><div className="space-y-3 px-4">
    <Card className="flex items-center justify-between rounded-[14px] p-4" style={{borderColor:`${ECONOMY_GREEN}45`}}><div><p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.8px] text-t3">Saldo inicial</p><MoneyInput value={data.perfil.saldo_inicial} onValueChange={value=>mutate(d=>{d.perfil.saldo_inicial=value})} className="number h-9 w-44 border-0 bg-transparent p-0 text-[28px] font-black tracking-[-1.5px]" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">o que você já tem guardado hoje</p></div><span className="rounded-lg border px-3 py-2 text-xs font-bold" style={{borderColor:`${ECONOMY_GREEN}35`,background:`${ECONOMY_GREEN}10`,color:ECONOMY_GREEN}}>Editar</span></Card><Card className="flex items-center justify-between rounded-[14px] px-4 py-[13px]" style={{borderColor:`${ECONOMY_GREEN}45`,background:`${ECONOMY_GREEN}10`}}><div><p className="mb-1 text-[10px] font-extrabold uppercase tracking-[.8px] text-t3">Economia mensal</p><Currency value={data.perfil.economia_mensal} className="text-[26px] font-black tracking-[-1.5px]" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">preenchido automaticamente · vem da Tabela</p></div><button onClick={()=>setTab('tabela')} className="rounded-lg border px-[10px] py-[7px] text-[11px] font-bold" style={{borderColor:`${ECONOMY_GREEN}35`,background:`${ECONOMY_GREEN}10`,color:ECONOMY_GREEN}}>→ Tabela</button></Card>
    <section><SectionTitle eyebrow="Complementos" title="Economias extras" action={<AddButton color={ECONOMY_GREEN} onClick={()=>mutate(d=>d.economias.push({id:uid(),label:'Nova economia',valor:0,tipo:'recorrente',vezes:null,mes:null}))}/>}/><div className="space-y-2">{data.economias.map(item=><EconomyRow key={item.id} item={item}/>)}</div></section>
    <Card className="p-5" style={{borderColor:`${ECONOMY_GREEN}35`}}><div className="flex items-center justify-between"><div><p className="text-[10px] text-t3">Detalhe do mês</p><select value={selected} onChange={e=>setSelected(Number(e.target.value))} className="mt-1 bg-transparent text-sm font-semibold outline-none" style={{color:ECONOMY_GREEN}}>{projection.map((p,i)=><option key={p.key} value={i}>{monthLabel(p.key,true)}</option>)}</select></div><Pill color={ECONOMY_GREEN}>+ <Currency value={point.entrou}/></Pill></div><Currency value={point.acumulado} className="mt-5 text-[31px] font-bold" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">acumulado até este mês</p><div className="mt-5 space-y-2 border-t border-border pt-4">{point.breakdown.map((b,i)=><div key={`${b.label}${i}`} className="flex justify-between text-[11px]"><span className="text-t2">{b.label}</span><span className="flex items-baseline" style={{color:ECONOMY_GREEN}}>+ <Currency value={b.valor} className="ml-1 font-bold"/></span></div>)}</div></Card>
    <section className="pb-3"><SectionTitle eyebrow="Visão detalhada" title="Tabela mensal"/><Card className="overflow-hidden" style={{borderColor:`${ECONOMY_GREEN}35`}}><div className="grid grid-cols-3 px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-t3"><span>Mês</span><span className="text-right">Entrou</span><span className="text-right">Acumulado</span></div>{projection.map((p,i)=><button key={p.key} onClick={()=>setSelected(i)} className="grid w-full grid-cols-3 border-t border-border px-4 py-3 text-left text-[11px] transition" style={selected===i?{background:`${ECONOMY_GREEN}0D`}:undefined}><span className="text-t2">{monthTableLabel(p.key)}</span><Currency value={p.entrou} className="justify-self-end" style={{color:ECONOMY_GREEN}}/><Currency value={p.acumulado} className="justify-self-end font-bold" style={{color:ECONOMY_GREEN}}/></button>)}</Card></section>
  </div></div>
}

function EconomyRow({item}:{item:EconomiaItem}) {
  const mutate=useFinancas(s=>s.mutate)
  const update=(change:(target:EconomiaItem)=>void)=>mutate(d=>{const target=d.economias.find(x=>x.id===item.id);if(target)change(target)})
  const controlStyle={background:'var(--el)',borderColor:'var(--border)',color:'var(--t2)'}
  const valueStyle={background:`${ECONOMY_GREEN}0A`,borderColor:`${ECONOMY_GREEN}20`,color:ECONOMY_GREEN}
  const deleteStyle={background:'#D84A4A0D',borderColor:'#D84A4A33',color:'#D84A4A'}
  return <Card className="rounded-[18px] p-3.5 shadow-[0_6px_22px_rgba(35,138,91,.035)]" style={{borderColor:`${ECONOMY_GREEN}28`}}>
    <div className="flex items-center gap-3">
      <input value={item.label} onChange={e=>update(x=>{x.label=e.target.value})} className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-t1 outline-none"/>
      <MoneyInput value={item.valor} onValueChange={value=>update(x=>{x.valor=value})} className="h-8 w-auto rounded-[10px] border px-2.5 text-xs font-bold" inputClassName="w-[68px] flex-none text-right" style={valueStyle}/>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <select value={item.tipo} onChange={e=>update(x=>{x.tipo=e.target.value as EconomiaItem['tipo'];x.vezes=x.tipo==='parcelado'?1:null;x.mes=x.tipo==='pontual'?new Date().toISOString().slice(0,7):null})} className="h-8 min-w-[112px] rounded-[10px] border px-2.5 text-[9px] font-semibold outline-none" style={controlStyle}>
        <option value="recorrente">Recorrente</option><option value="parcelado">Parcelado</option><option value="pontual">Pontual</option>
      </select>
      {item.tipo==='parcelado'&&<label className="flex h-8 items-center gap-1 rounded-[10px] border px-2.5 text-[9px] font-semibold" style={controlStyle}><input type="number" min="1" value={item.vezes??1} onChange={e=>update(x=>{x.vezes=Math.max(1,Number(e.target.value))})} className="w-7 bg-transparent text-center outline-none"/>×</label>}
      {item.tipo==='pontual'&&<input type="month" value={item.mes??''} onChange={e=>update(x=>{x.mes=e.target.value})} className="h-8 min-w-0 flex-1 rounded-[10px] border px-2.5 text-[9px] font-semibold outline-none" style={controlStyle}/>} 
      <button aria-label={`Excluir ${item.label}`} onClick={()=>mutate(d=>{d.economias=d.economias.filter(x=>x.id!==item.id)})} className="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border transition active:scale-95" style={deleteStyle}><Trash2 size={13}/></button>
    </div>
  </Card>
}
