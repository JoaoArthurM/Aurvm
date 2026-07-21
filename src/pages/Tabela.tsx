import { useState } from 'react'
import { IconChevronLeft, IconChevronRight as ChevronRight, IconSortAscendingLetters, IconSortDescendingNumbers } from '@tabler/icons-react'
import { SubscriptionEditor, SubscriptionLogo } from '../components/SubscriptionLogo'
import { ConfirmDialog, DangerButton, Input, MoneyInput } from '../components/ui'
import { Currency } from '../components/Currency'
import { catColors, cn, sum, totals, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'
import type { FinancasData, Item } from '../lib/types'

type Category=keyof FinancasData['tabela']
const sections:{key:Category;label:string;color:string}[]=[{key:'entradas',label:'Entradas',color:catColors.entradas},{key:'fixos',label:'Gastos fixos',color:catColors.fixos},{key:'variaveis',label:'Gastos variáveis',color:catColors.variaveis},{key:'assinaturas',label:'Assinaturas',color:catColors.assinaturas}]
type TabelaOrder='valor'|'nome'
const sortItems=(items:Item[],order:TabelaOrder)=>[...items].sort((a,b)=>order==='nome'?a.label.localeCompare(b.label,'pt-BR'):b.valor-a.valor||a.label.localeCompare(b.label,'pt-BR'))

export function Tabela(){
 const {data,mutate,setTab}=useFinancas();const t=totals(data)
 const order=data.config.preferencias?.tabela_ordenacao??'valor'
 const setOrder=(value:TabelaOrder)=>mutate(d=>{d.config.preferencias??={};d.config.preferencias.tabela_ordenacao=value})
 return <div className="pb-4">
  <div className="grid grid-cols-[1fr_auto_1fr] items-center px-[22px] pb-[14px] pt-0.5">
    <button onClick={()=>setTab('inicio')} className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-surface text-t2 shadow-[0_2px_8px_rgba(15,37,64,.07)]"><IconChevronLeft size={20}/></button>
    <div className="text-center"><p className="font-mono text-[9.5px] font-bold uppercase tracking-[2px] text-accent">Planejamento</p><h2 className="text-[16px] font-bold">Entradas e Gastos</h2></div>
    <div className="flex h-9 items-center justify-self-end rounded-xl bg-el p-[3px]">
      <button type="button" aria-label="Ordenar por maior valor" onClick={()=>setOrder('valor')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition',order==='valor'?'bg-surface text-accent shadow-[0_2px_7px_rgba(15,37,64,.09)]':'text-t3')}><IconSortDescendingNumbers size={15}/></button>
      <button type="button" aria-label="Ordenar por nome" onClick={()=>setOrder('nome')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition',order==='nome'?'bg-surface text-accent shadow-[0_2px_7px_rgba(15,37,64,.09)]':'text-t3')}><IconSortAscendingLetters size={15}/></button>
    </div>
  </div>
  <div className="overflow-hidden px-5 pb-[30px]">
   <PlanningHero saldo={t.saldo} entradas={t.entradas} gastos={t.gastos} economia={data.perfil.economia_mensal}/>
   {sections.map(s=><BudgetSection key={s.key} section={s} items={sortItems(data.tabela[s.key],order)}/>)}
  <section className="mx-1 mb-4 mt-[22px]">
    <div className="mb-3 flex items-center justify-between px-1"><div className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-[2px]" style={{background:catColors.economia}}/><h3 className="text-[14px] font-bold">Economia</h3></div></div>
    <div className="overflow-hidden rounded-[18px] bg-surface shadow-[0_2px_10px_rgba(15,37,64,.05)]">
      <div className="flex items-center justify-between gap-3 px-4 py-[13px]" style={{background:`color-mix(in oklch,${catColors.economia} 9%,transparent)`}}>
        <div className="min-w-0"><p className="font-mono text-[9px] font-bold uppercase tracking-[.8px] text-t3">Economia mensal</p><p className="mt-1 text-[10px] text-t2">meta reservada todos os meses</p></div>
        <MoneyInput aria-label="Economia mensal comprometida" value={data.perfil.economia_mensal} onValueChange={value=>mutate(d=>{d.perfil.economia_mensal=value})} className="h-11 w-[154px] shrink-0 rounded-[12px] border-border bg-surface px-3 text-[22px] font-black tracking-[-1.1px] focus-within:border-accent" inputClassName="text-right" style={{color:catColors.economia}}/>
      </div>
      <div className="border-t border-border/60 bg-bg/50 px-4 py-3"><p className="text-[9px] text-t3">Esse valor alimenta automaticamente a aba Economia.</p></div>
    </div>
  </section></div></div>
}

function PlanningHero({saldo,entradas,gastos,economia}:{saldo:number;entradas:number;gastos:number;economia:number}){
 return <section className="mb-0">
  <div className="rounded-[24px] px-[22px] pb-[22px] pt-5" style={{background:'linear-gradient(155deg,#1b2f4a 0%,#3f6c8f 55%,#8fb5c9 108%)'}}>
   <p className="font-mono text-[9.5px] font-bold uppercase tracking-[1.5px] text-white/80">Resultado mensal</p>
   <div className="number mt-3 text-[38px] font-black leading-none tracking-[-1.8px] text-white"><Currency value={saldo} symbolClassName="opacity-55" amountClassName="text-white"/></div>
   <p className="mt-2 text-[11px] text-white">entradas − gastos − economia</p>
  </div>
  <div className="mt-3 grid grid-cols-3 gap-2.5">
   <PlanningKpi label="Entradas" value={entradas} color={catColors.entradas}/>
   <PlanningKpi label="Gastos" value={gastos} color={catColors.fixos}/>
   <PlanningKpi label="Economia" value={economia} color={catColors.economia}/>
  </div>
 </section>
}

function PlanningKpi({label,value,color}:{label:string;value:number;color:string}){
 return <div className="min-w-0 rounded-[16px] bg-surface p-[13px] shadow-[0_2px_10px_rgba(15,37,64,.05)]">
  <p className="truncate font-mono text-[8.5px] font-medium uppercase tracking-[.8px] text-t3">{label}</p>
  <Currency value={value} className="mt-[7px] block truncate text-[16px] font-bold" style={{color}}/>
 </div>
}

function BudgetSection({section,items}:{section:typeof sections[number];items:Item[]}){
 const mutate=useFinancas(s=>s.mutate);const [expanded,setExpanded]=useState<string|null>(null)
 const addItem=()=>{const id=uid();mutate(d=>d.tabela[section.key].push({id,label:section.key==='assinaturas'?'':'Novo item',valor:0}));setExpanded(id)}
 return <section className="mx-1 mb-4 mt-[22px]">
  <div className="mb-3 flex items-center justify-between">
    <div className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-[2px]" style={{background:section.color}}/><h3 className="text-[14px] font-bold">{section.label}</h3></div>
    <button onClick={addItem} className="rounded-full px-[11px] py-[5px] text-[11px] font-semibold" style={{color:section.color,background:`color-mix(in oklch,${section.color} 12%,transparent)`}}>+ Adicionar</button>
  </div>
  <div className="overflow-hidden rounded-[18px] bg-surface shadow-[0_2px_10px_rgba(15,37,64,.05)]">
    {items.map((item,i)=><div key={item.id}>
      <button onClick={()=>setExpanded(expanded===item.id?null:item.id)} className={cn('flex w-full items-center justify-between px-4 py-[14px] text-left transition active:bg-el/50',i>0&&'border-t border-border/60')}>
        <span className="flex items-center gap-2.5 text-[13.5px] font-medium text-t1">{section.key==='assinaturas'&&<SubscriptionLogo item={item} size={28}/>}{item.label||'Nova assinatura'}</span>
        <span className="flex items-center gap-1"><Currency value={item.valor} className="text-[13.5px] font-bold" style={{color:section.color}}/><ChevronRight size={14} className={cn('text-t3 transition',expanded===item.id&&'rotate-90')}/></span>
      </button>
      {expanded===item.id&&<div className="border-t border-border/60 bg-bg/70 px-3 pb-3 pt-3">{section.key==='assinaturas'?<div className="overflow-hidden rounded-[14px] border border-border bg-surface"><SubscriptionEditor item={item}/><BudgetItemEditor section={section} item={item}/></div>:<BudgetItemEditor section={section} item={item}/>}<p className="mt-3 flex items-center rounded-t-[14px] border border-border bg-surface px-3 pb-2 pt-3 text-[9px] font-bold uppercase tracking-[.8px] text-t3">{section.key==='entradas'?'Se manter esse valor, você vai acumular':'Custo acumulado'}</p>{[[3,'3 meses'],[6,'6 meses'],[12,'1 ano'],[24,'2 anos'],[60,'5 anos']].map(([n,l])=><div key={String(l)} className="flex items-center justify-between border-x border-b border-border/70 bg-surface px-3 py-2.5 last:rounded-b-[14px]"><span className="text-[11px] text-t2">{l}</span><Currency value={item.valor*Number(n)} className="text-[13px] font-bold" style={{color:section.color}}/></div>)}</div>}
    </div>)}
    <div className="flex justify-between bg-bg px-4 py-3"><span className="font-mono text-[10px] uppercase tracking-[.5px] text-t3">Total {section.label.toLowerCase()}</span><Currency value={sum(items)} className="text-[13px] font-bold" style={{color:section.color}}/></div>
  </div>
 </section>
}

function BudgetItemEditor({section,item}:{section:typeof sections[number];item:Item}){
 const mutate=useFinancas(s=>s.mutate)
 const [confirming,setConfirming]=useState(false)
 const update=(change:(target:Item)=>void)=>mutate(d=>{const target=d.tabela[section.key].find(entry=>entry.id===item.id);if(target)change(target)})
 return <><div className={cn(section.key==='assinaturas'?'border-b border-border/60 bg-surface p-3':'rounded-[14px] border border-border bg-surface p-3')}>
  {section.key!=='assinaturas'&&<label className="block min-w-0"><span className="mb-1.5 block font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3">Nome</span><input aria-label={`Nome de ${item.label||'item'}`} value={item.label} onChange={event=>update(target=>{target.label=event.target.value})} className="h-10 w-full rounded-[11px] border border-border bg-bg px-3 text-xs font-semibold text-t1 outline-none transition focus:border-accent"/></label>}
  <div className={cn('flex items-end gap-2',section.key!=='assinaturas'&&'mt-2.5')}><label className="min-w-0 flex-1"><span className="mb-1.5 block font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3">Valor mensal</span><MoneyInput minValue={0} aria-label={`Valor de ${item.label||'item'}`} value={item.valor} onValueChange={value=>update(target=>{target.valor=value})} className="h-10 rounded-[11px] bg-bg px-2.5 text-xs font-bold" inputClassName="text-right" style={{color:section.color}}/></label><DangerButton className="h-10 w-10 rounded-[11px]" aria-label={`Excluir ${item.label||'item'}`} onClick={()=>setConfirming(true)}/></div>
 </div>{confirming&&<ConfirmDialog title={`Excluir ${item.label||'este item'}?`} message="Este item será removido do planejamento mensal. Essa ação não pode ser desfeita." confirmLabel="Excluir item" onConfirm={()=>{mutate(d=>{d.tabela[section.key]=d.tabela[section.key].filter(x=>x.id!==item.id)});setConfirming(false)}} onCancel={()=>setConfirming(false)}/>}</>
}

function Result({data,totals:t}:{data:FinancasData;totals:ReturnType<typeof totals>}){const rows=[['Entradas',t.entradas,catColors.entradas],['Gastos fixos',t.fixos,catColors.fixos],['Gastos variáveis',t.variaveis,catColors.variaveis],['Assinaturas',t.assinaturas,catColors.assinaturas],['Economia',data.perfil.economia_mensal,catColors.economia]] as const;return <section className="mx-4 mb-2 mt-2 overflow-hidden rounded-[18px] bg-surface p-4 shadow-[0_2px_10px_rgba(15,37,64,.05)]"><div className="mb-4 flex items-center gap-2 px-1"><span className="h-2 w-2 shrink-0 rounded-[2px] bg-accent"/><h3 className="text-[14px] font-bold">Resultado mensal</h3></div><div className="px-1">{rows.map(([l,v,c])=><div key={l} className="mb-[11px] flex items-center gap-2"><span className="w-[128px] text-xs text-t2">{l}</span><span className="h-[5px] flex-1 overflow-hidden rounded-full bg-el"><i className="block h-full rounded-full" style={{width:`${Math.min(100,t.entradas?v/t.entradas*100:0)}%`,background:c}}/></span><span className="number flex w-[94px] shrink-0 items-center justify-end gap-1 text-right"><Currency value={v} className="text-xs font-bold" style={{color:c}}/><i className="h-3 w-px bg-border"/><small className="text-[9px] not-italic text-t3">{t.entradas?(v/t.entradas*100).toFixed(0):0}%</small></span></div>)}</div></section>}
