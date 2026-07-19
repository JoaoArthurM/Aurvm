import { useMemo, useState } from 'react'
import { IconArrowRight, IconChevronDown, IconPencil, IconTrash as Trash2 } from '@tabler/icons-react'
import { PageHeader } from '../components/PageHeader'
import { Currency } from '../components/Currency'
import { AddButton, Card, ChipButton, MoneyInput, Pill } from '../components/ui'
import { SunriseHero } from '../components/SunriseHero'
import { monthLabel, monthTableLabel, projectSavings, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import type { Economia as EconomiaItem } from '../lib/types'

const ECONOMY_GREEN = '#2E9E5B'

export function EconomiaPage() {
  const { data, mutate, setTab } = useFinancas()
  const projection = useMemo(()=>projectSavings(data,12),[data])
  const [selected,setSelected]=useState(0)
  const point=projection[Math.min(selected,projection.length-1)]
  return <div className="page"><PageHeader eyebrow="Reserva" title="Economia" subtitle="saldo inicial e entradas extras"/><SunriseHero label="Reserva em 12 meses" value={<Currency value={projection[projection.length-1]?.acumulado??data.perfil.saldo_inicial}/>} caption={<>projeção com saldo inicial <span>+</span> economia mensal <span>+</span> extras</>} kpis={[{label:'Guardado hoje',value:<Currency value={data.perfil.saldo_inicial}/>,sub:'saldo inicial',className:'text-green'},{label:'Por mês',value:<Currency value={data.perfil.economia_mensal}/>,sub:'vem da Tabela',className:'text-green'},{label:'Extras',value:String(data.economias.length),sub:data.economias.length===1?'complemento ativo':'complementos ativos'}]}/><div className="space-y-3 px-4">
    <Card className="flex items-center justify-between rounded-[14px] p-4"><div><p className="mb-1 flex items-center text-[10px] font-extrabold uppercase tracking-[.8px] text-t3"><i className="mark-diamond"/>Saldo inicial</p><MoneyInput value={data.perfil.saldo_inicial} onValueChange={value=>mutate(d=>{d.perfil.saldo_inicial=value})} className="number h-9 w-44 border-0 bg-transparent p-0 text-[28px] font-black tracking-[-1.5px]" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">o que você já tem guardado hoje</p></div><span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-border bg-el/60 px-2.5 text-[10px] font-semibold text-t2"><IconPencil size={12}/>Editar</span></Card><Card className="flex items-center justify-between rounded-[14px] px-4 py-[13px]" style={{background:`${ECONOMY_GREEN}0A`}}><div><p className="mb-1 flex items-center text-[10px] font-extrabold uppercase tracking-[.8px] text-t3"><i className="mark-diamond"/>Economia mensal</p><Currency value={data.perfil.economia_mensal} className="text-[26px] font-black tracking-[-1.5px]" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">preenchido automaticamente · vem da Tabela</p></div><ChipButton onClick={()=>setTab('tabela')}>Tabela<IconArrowRight size={12}/></ChipButton></Card>
    <section><div className="flex items-center justify-between px-[14px] pb-1.5 pt-2 text-[10px] font-extrabold uppercase tracking-[1px] text-t3"><span className="flex items-center"><i className="mark-diamond"/>Economias extras</span><AddButton onClick={()=>mutate(d=>d.economias.push({id:uid(),label:'Nova economia',valor:0,tipo:'recorrente',vezes:null,mes:null}))}/></div><div className="space-y-2">{data.economias.map(item=><EconomyRow key={item.id} item={item}/>)}</div></section>
    <Card className="p-5"><div className="flex items-center justify-between"><div><p className="text-[10px] text-t3">Detalhe do mês</p><select value={selected} onChange={e=>setSelected(Number(e.target.value))} className="mt-1 bg-transparent text-sm font-semibold outline-none" style={{color:ECONOMY_GREEN}}>{projection.map((p,i)=><option key={p.key} value={i}>{monthLabel(p.key,true)}{p.pontual?' ⭐':''}</option>)}</select></div><Pill color={ECONOMY_GREEN}>+ <Currency value={point.entrou}/></Pill></div><Currency value={point.acumulado} className="mt-5 text-[31px] font-bold" style={{color:ECONOMY_GREEN}}/><p className="mt-1 text-[10px] text-t3">acumulado até este mês</p><div className="mt-5 space-y-2 border-t border-border pt-4">{point.breakdown.map((b,i)=><div key={`${b.label}${i}`} className="flex justify-between text-[11px]"><span className="text-t2">{b.label}</span><span className="flex items-baseline" style={{color:ECONOMY_GREEN}}>+ <Currency value={b.valor} className="ml-1 font-bold"/></span></div>)}</div></Card>
    <section className="pb-3"><p className="flex items-center px-[14px] pb-1.5 pt-2 text-[10px] font-extrabold uppercase tracking-[1px] text-t3"><i className="mark-diamond"/>Tabela mensal</p><Card className="overflow-hidden"><div className="grid grid-cols-3 px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-t3"><span>Mês</span><span className="text-right">Entrou</span><span className="text-right">Acumulado</span></div>{projection.map((p,i)=><button key={p.key} onClick={()=>setSelected(i)} className="grid w-full grid-cols-3 border-t border-border px-4 py-3 text-left text-[11px] transition" style={selected===i?{background:`${ECONOMY_GREEN}0D`}:undefined}><span className="text-t2">{monthTableLabel(p.key)}{p.pontual&&<span aria-label="mês com economia pontual" className="ml-1 text-[9px]">⭐</span>}</span><Currency value={p.entrou} className="justify-self-end" style={{color:ECONOMY_GREEN}}/><Currency value={p.acumulado} className="justify-self-end font-bold" style={{color:ECONOMY_GREEN}}/></button>)}</Card></section>
  </div></div>
}

function EconomyRow({item}:{item:EconomiaItem}) {
  const mutate=useFinancas(s=>s.mutate)
  const update=(change:(target:EconomiaItem)=>void)=>mutate(d=>{const target=d.economias.find(x=>x.id===item.id);if(target)change(target)})
  const valueStyle={background:`${ECONOMY_GREEN}0A`,borderColor:`${ECONOMY_GREEN}20`,color:ECONOMY_GREEN}
  const chip='inline-flex h-7 shrink-0 items-center rounded-full border border-border bg-el/60 text-[10px] font-semibold text-t2'
  return <Card className="rounded-[18px] p-3.5">
    <div className="flex items-center gap-3">
      <input value={item.label} onChange={e=>update(x=>{x.label=e.target.value})} className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-t1 outline-none"/>
      <MoneyInput value={item.valor} onValueChange={value=>update(x=>{x.valor=value})} className="h-8 w-auto rounded-full border px-3 text-xs font-bold" inputClassName="w-[68px] flex-none text-right" style={valueStyle}/>
    </div>
    <div className="mt-3 flex items-center gap-1.5">
      <label className={`${chip} relative`}>
        <select value={item.tipo} onChange={e=>update(x=>{x.tipo=e.target.value as EconomiaItem['tipo'];x.vezes=x.tipo==='parcelado'?1:null;x.mes=x.tipo==='pontual'?new Date().toISOString().slice(0,7):null})} className="appearance-none bg-transparent pl-3 pr-7 font-semibold outline-none" style={{color:'inherit'}}>
          <option value="recorrente">Recorrente</option><option value="parcelado">Parcelado</option><option value="pontual">Pontual</option>
        </select>
        <IconChevronDown size={12} className="pointer-events-none absolute right-2.5 text-t3"/>
      </label>
      {item.tipo==='parcelado'&&<label className={`${chip} gap-1 px-3`}><input type="number" min="1" value={item.vezes??1} onChange={e=>update(x=>{x.vezes=Math.max(1,Number(e.target.value))})} className="no-spin w-7 bg-transparent text-center outline-none"/>×</label>}
      {item.tipo==='pontual'&&<label className={`${chip} min-w-0 gap-1 px-3`}><span aria-hidden="true" className="text-[9px]">⭐</span><input type="month" value={item.mes??''} onChange={e=>update(x=>{x.mes=e.target.value})} className="min-w-0 bg-transparent outline-none"/></label>}
      <button aria-label={`Excluir ${item.label}`} onClick={()=>mutate(d=>{d.economias=d.economias.filter(x=>x.id!==item.id)})} className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-full border border-red/25 bg-red/5 text-red transition active:scale-95"><Trash2 size={13}/></button>
    </div>
  </Card>
}
