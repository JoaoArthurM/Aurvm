import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconCalendar, IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconSearch, IconSortAscendingLetters, IconSortDescendingLetters, IconStarFilled } from '@tabler/icons-react'
import { cn } from '../lib/utils'

type SelectOption = { value:string; label:string; caption?:string; icon?:ReactNode; color?:string }

const useEscape=(open:boolean,close:()=>void)=>useEffect(()=>{
  if(!open)return
  const handler=(event:KeyboardEvent)=>{if(event.key==='Escape')close()}
  document.addEventListener('keydown',handler)
  return()=>document.removeEventListener('keydown',handler)
},[open,close])

export function AurvmSelect({value='',onChange,values=[],onValuesChange,multiple=false,options,ariaLabel,placeholder='Selecionar',className,menuClassName,side='top',searchable=false,searchPlaceholder='Buscar'}:{
  value?:string;onChange?:(value:string)=>void;values?:string[];onValuesChange?:(values:string[])=>void;multiple?:boolean;options:SelectOption[];ariaLabel:string;placeholder?:string;className?:string;menuClassName?:string;side?:'top'|'bottom';searchable?:boolean;searchPlaceholder?:string
}){
  const [open,setOpen]=useState(false)
  const [search,setSearch]=useState('')
  const [sort,setSort]=useState<'asc'|'desc'>('asc')
  useEscape(open,()=>setOpen(false))
  const selected=options.find(option=>option.value===value)
  const selectedMultiple=options.filter(option=>values.includes(option.value))
  const displayOption=multiple?selectedMultiple[0]:selected
  const displayLabel=multiple?(selectedMultiple.length===0?placeholder:selectedMultiple.length===1?selectedMultiple[0].label:`${selectedMultiple.length} tags`):(selected?.label??placeholder)
  const visibleOptions=useMemo(()=>{
    const normalized=search.trim().toLocaleLowerCase('pt-BR')
    const filtered=normalized?options.filter(option=>`${option.label} ${option.caption??''}`.toLocaleLowerCase('pt-BR').includes(normalized)):options
    if(!searchable)return filtered
    return [...filtered].sort((a,b)=>{
      if(a.value==='')return -1
      if(b.value==='')return 1
      const result=a.label.localeCompare(b.label,'pt-BR',{sensitivity:'base'})
      return sort==='asc'?result:-result
    })
  },[options,search,searchable,sort])
  useEffect(()=>{if(!open)setSearch('')},[open])
  return <div className="relative min-w-0">
    <button type="button" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(state=>!state)} className={cn('flex h-9 min-w-0 items-center gap-2 rounded-xl border border-border bg-el/45 px-3 text-left text-[11px] font-semibold text-t1 transition hover:border-accent/25 active:scale-[.98]',className)}>
      {displayOption?.icon&&<span className="shrink-0" style={{color:displayOption.color}}>{displayOption.icon}</span>}
      <span className="min-w-0 flex-1 truncate" style={{color:displayOption?.color}}>{displayLabel}</span>
      <IconChevronDown size={13} className={cn('shrink-0 text-t3 transition',open&&'rotate-180')}/>
    </button>
    {open&&createPortal(<>
      <button type="button" aria-label="Fechar opções" onClick={event=>{event.stopPropagation();setOpen(false)}} className="aurvm-sheet-backdrop fixed inset-0 z-[60] cursor-default bg-black/45 backdrop-blur-[1px]"/>
      <div role={searchable?'dialog':'listbox'} aria-label={ariaLabel} data-side={side} onClick={event=>event.stopPropagation()} className={cn('aurvm-sheet safe-bottom fixed bottom-0 left-1/2 z-[70] max-h-[min(520px,78vh)] w-[min(390px,100vw)] -translate-x-1/2 overflow-y-auto rounded-t-[28px] border-x border-t border-border bg-surface px-4 pb-4 pt-2.5 shadow-[0_-20px_60px_rgba(35,27,22,.22)]',menuClassName)}>
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-border"/>
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[1px] text-t3">{ariaLabel}</p>
        {searchable&&<div className="sticky top-0 z-10 mb-2 flex items-center gap-2 bg-surface pb-2">
          <label className="relative min-w-0 flex-1"><IconSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-t3"/><input autoFocus aria-label={`Buscar em ${ariaLabel}`} value={search} onChange={event=>setSearch(event.target.value)} placeholder={searchPlaceholder} className="h-10 w-full rounded-[12px] border border-border bg-el/35 pl-9 pr-3 text-[11px] font-semibold text-t1 outline-none transition placeholder:text-t3 focus:border-accent/35 focus:bg-surface"/></label>
          <div className="flex h-10 shrink-0 items-center rounded-[12px] bg-el p-[3px]">
            <button type="button" aria-label="Ordenar de A a Z" onClick={()=>setSort('asc')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition',sort==='asc'?'bg-surface text-accent shadow-[0_2px_7px_rgba(45,31,23,.09)]':'text-t3')}><IconSortAscendingLetters size={15}/></button>
            <button type="button" aria-label="Ordenar de Z a A" onClick={()=>setSort('desc')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition',sort==='desc'?'bg-surface text-accent shadow-[0_2px_7px_rgba(45,31,23,.09)]':'text-t3')}><IconSortDescendingLetters size={15}/></button>
          </div>
        </div>}
        <div role={searchable?'listbox':undefined} aria-label={searchable?ariaLabel:undefined}>{visibleOptions.map(option=>{const active=multiple?(option.value===''?values.length===0:values.includes(option.value)):option.value===value;return <button role="option" aria-selected={active} type="button" key={option.value} onClick={()=>{if(multiple){if(option.value==='')onValuesChange?.([]);else onValuesChange?.(active?values.filter(item=>item!==option.value):[...values,option.value])}else{onChange?.(option.value);setOpen(false)}}} className={cn('flex w-full items-center gap-3 rounded-[15px] px-3 py-3 text-left transition active:scale-[.99]',active?'bg-accent/10':'hover:bg-el/60')}>
          {option.icon&&<span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px]" style={{color:option.color??'var(--accent)',background:`color-mix(in srgb, ${option.color??'var(--accent)'} 12%, transparent)`}}>{option.icon}</span>}
          <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold" style={{color:option.color??'var(--t1)'}}>{option.label}</span>{option.caption&&<span className="mt-0.5 block truncate text-[9px] text-t3">{option.caption}</span>}</span>
          {active&&<IconCheck size={14} className="shrink-0 text-accent"/>}
        </button>})}{visibleOptions.length===0&&<p className="px-3 py-8 text-center text-[10px] text-t3">Nenhum resultado encontrado</p>}</div>
        {multiple&&<div className="sticky bottom-0 mt-2 border-t border-border bg-surface pt-3"><button type="button" onClick={()=>setOpen(false)} className="h-11 w-full rounded-[14px] bg-accent text-[11px] font-bold text-white shadow-[0_7px_18px_rgba(255,106,26,.2)]">Concluir{values.length?` · ${values.length} ${values.length===1?'tag':'tags'}`:''}</button></div>}
      </div>
    </>,document.body)}
  </div>
}

const dateParts=(value:string)=>{const [year,month,day]=value.split('-').map(Number);return{year,month,day}}
const dateISO=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
const dateLabel=(value:string)=>{const {year,month,day}=dateParts(value);return new Intl.DateTimeFormat('pt-BR').format(new Date(year,month-1,day))}
const monthTitle=(date:Date)=>{const label=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(date);return label.charAt(0).toUpperCase()+label.slice(1)}
const weekdays=['S','T','Q','Q','S','S','D']
const shiftedDateISO=(amount:number)=>{const date=new Date();date.setDate(date.getDate()+amount);return dateISO(date)}
const fifthBusinessDayISO=(view:Date)=>{let count=0;for(let day=1;day<=31;day++){const date=new Date(view.getFullYear(),view.getMonth(),day);if(date.getMonth()!==view.getMonth())break;if(date.getDay()!==0&&date.getDay()!==6){count++;if(count===5)return dateISO(date)}}return dateISO(view)}

export function AurvmDatePicker({value,onChange,ariaLabel='Data',className,accentColor='var(--flux-orange)',compact=false}:{value:string;onChange:(value:string)=>void;ariaLabel?:string;className?:string;accentColor?:string;compact?:boolean}){
  const initial=dateParts(value||dateISO(new Date()))
  const [open,setOpen]=useState(false)
  const [view,setView]=useState(()=>new Date(initial.year,initial.month-1,1))
  useEscape(open,()=>setOpen(false))
  useEffect(()=>{if(open){const next=dateParts(value||dateISO(new Date()));setView(new Date(next.year,next.month-1,1))}},[open,value])
  const days=useMemo(()=>{
    const first=new Date(view.getFullYear(),view.getMonth(),1)
    const mondayIndex=(first.getDay()+6)%7
    return Array.from({length:42},(_,index)=>new Date(view.getFullYear(),view.getMonth(),index-mondayIndex+1))
  },[view])
  const todayDate=new Date();const today=dateISO(todayDate)
  const fifthDate=fifthBusinessDayISO(view)
  const isCurrentView=view.getFullYear()===todayDate.getFullYear()&&view.getMonth()===todayDate.getMonth()
  const quickFifthDate=isCurrentView&&fifthDate<today?fifthBusinessDayISO(new Date(view.getFullYear(),view.getMonth()+1,1)):fifthDate
  const quickDates=[{label:'Hoje',value:shiftedDateISO(0)},{label:'Ontem',value:shiftedDateISO(-1)},{label:'Anteontem',value:shiftedDateISO(-2)},{label:'5º útil',value:quickFifthDate,fifth:true}]
  return <div className="relative">
    <button type="button" aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(state=>!state)} className={cn(compact?'inline-flex h-6 items-center gap-1 rounded-md border border-border bg-el/45 px-1.5 text-[9px] font-semibold text-t1 transition active:scale-[.98]':'inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-el/45 px-3 text-[11px] font-bold text-t1 transition active:scale-[.98]',className)}><span className="number">{dateLabel(value)}</span><IconCalendar size={compact?11:14} style={{color:accentColor}}/></button>
    {open&&createPortal(<>
      <button type="button" aria-label="Fechar calendário" onClick={event=>{event.stopPropagation();setOpen(false)}} className="aurvm-sheet-backdrop fixed inset-0 z-[60] cursor-default bg-black/45 backdrop-blur-[1px]"/>
      <div role="dialog" aria-label="Calendário" onClick={event=>event.stopPropagation()} className="aurvm-sheet safe-bottom fixed bottom-0 left-1/2 z-[70] w-[min(390px,100vw)] -translate-x-1/2 rounded-t-[28px] border-x border-t border-border bg-bg px-4 pb-4 pt-2.5 shadow-[0_-20px_60px_rgba(35,27,22,.24)]">
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-border"/>
        <div className="flex items-center justify-between px-1 pb-3"><div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-[12px]" style={{color:accentColor,background:`color-mix(in srgb, ${accentColor} 12%, var(--surface))`}}><IconCalendar size={16}/></span><div><p className="text-[9px] font-bold uppercase tracking-[1px]" style={{color:accentColor}}>Escolher data</p><p className="mt-0.5 text-[14px] font-bold text-t1">{monthTitle(view)}</p></div></div><div className="flex gap-1"><button type="button" aria-label="Mês anterior" onClick={()=>setView(date=>new Date(date.getFullYear(),date.getMonth()-1,1))} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-t2 shadow-sm"><IconChevronLeft size={15}/></button><button type="button" aria-label="Próximo mês" onClick={()=>setView(date=>new Date(date.getFullYear(),date.getMonth()+1,1))} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-t2 shadow-sm"><IconChevronRight size={15}/></button></div></div>
        <div className="rounded-[20px] border border-border bg-surface p-2.5 shadow-[0_8px_24px_rgba(70,40,24,.045)]"><div className="grid grid-cols-7 pb-1">{weekdays.map((day,index)=><span key={`${day}${index}`} className={cn('py-1 text-center text-[9px] font-bold text-t3',index===6&&'text-red')}>{day}</span>)}</div>
        <div className="grid grid-cols-7 gap-0.5">{days.map(day=>{const iso=dateISO(day);const selected=iso===value;const isToday=iso===today;const outside=day.getMonth()!==view.getMonth();const sunday=!outside&&day.getDay()===0;const fifth=!outside&&iso===fifthDate;const stateStyle=selected?{color:'#fff',background:accentColor,boxShadow:`0 5px 14px color-mix(in srgb, ${accentColor} 28%, transparent)`}:isToday?{color:accentColor,borderColor:`color-mix(in srgb, ${accentColor} 35%, var(--border))`,background:`color-mix(in srgb, ${accentColor} 7%, var(--surface))`}:undefined;return <button type="button" key={iso} aria-label={fifth?`${day.getDate()}, quinto dia útil`:undefined} onClick={()=>{onChange(iso);setOpen(false)}} style={stateStyle} className={cn('number grid h-9 place-items-center rounded-[11px] border border-transparent text-[10px] font-semibold transition active:scale-90',outside?'text-t3/40':'text-t2',!selected&&!isToday&&sunday&&'bg-red/5 text-red')}><span className="relative inline-flex items-center">{day.getDate()}{fifth&&<IconStarFilled aria-hidden="true" size={7} className="absolute -right-2.5 -top-1.5 text-yellow"/>}</span></button>})}</div></div>
        <div className="mt-3 rounded-[20px] border border-border bg-surface p-3 shadow-[0_8px_24px_rgba(70,40,24,.045)]"><div className="mb-2 flex items-center justify-between"><span className="text-[9px] font-bold uppercase tracking-[.7px] text-t3">Predefinições</span><span className="number rounded-full bg-el/60 px-2 py-1 text-[9px] font-semibold text-t2">{dateLabel(value)}</span></div><div className="grid grid-cols-4 gap-1.5">{quickDates.map(preset=>{const active=value===preset.value;return <button type="button" key={preset.label} onClick={()=>{onChange(preset.value);setOpen(false)}} style={active&&!preset.fifth?{color:accentColor,borderColor:`color-mix(in srgb, ${accentColor} 28%, var(--border))`,background:`color-mix(in srgb, ${accentColor} 9%, var(--surface))`}:undefined} className={cn('inline-flex h-9 items-center justify-center gap-1 rounded-full border px-1 text-[9px] font-bold transition active:scale-95',active&&preset.fifth?'border-yellow/35 bg-yellow/15 text-t1':!active?'border-border bg-el/35 text-t2':'')}>{preset.fifth&&<IconStarFilled size={8} className="shrink-0 text-yellow"/>}{preset.label}</button>})}</div></div>
      </div>
    </>,document.body)}
  </div>
}

const monthValue=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
const monthLabel=(value:string)=>{const [year,month]=value.split('-').map(Number);return new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(year,month-1,1))}

export function AurvmMonthPicker({value,onChange,ariaLabel='Mês',className,icon}:{value:string;onChange:(value:string)=>void;ariaLabel?:string;className?:string;icon?:ReactNode}){
  const initial=value?Number(value.slice(0,4)):new Date().getFullYear()
  const [open,setOpen]=useState(false)
  const [year,setYear]=useState(initial)
  useEscape(open,()=>setOpen(false))
  useEffect(()=>{if(open&&value)setYear(Number(value.slice(0,4)))},[open,value])
  return <div className="relative min-w-0">
    <button type="button" aria-label={ariaLabel} aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(state=>!state)} className={cn('inline-flex h-8 min-w-0 items-center gap-1.5 rounded-full border border-border bg-el/45 px-3 text-[10px] font-semibold capitalize text-t2 transition active:scale-[.98]',className)}>{icon}<span className="truncate">{monthLabel(value)}</span><IconChevronDown size={12} className={cn('shrink-0 text-t3 transition',open&&'rotate-180')}/></button>
    {open&&createPortal(<>
      <button type="button" aria-label="Fechar meses" onClick={event=>{event.stopPropagation();setOpen(false)}} className="aurvm-sheet-backdrop fixed inset-0 z-[60] cursor-default bg-black/45 backdrop-blur-[1px]"/>
      <div role="dialog" aria-label="Selecionar mês" onClick={event=>event.stopPropagation()} className="aurvm-sheet safe-bottom fixed bottom-0 left-1/2 z-[70] w-[min(390px,100vw)] -translate-x-1/2 rounded-t-[28px] border-x border-t border-border bg-surface px-5 pb-4 pt-2.5 shadow-[0_-20px_60px_rgba(35,27,22,.24)]">
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-border"/>
        <div className="mb-3 flex items-center justify-between"><button type="button" aria-label="Ano anterior" onClick={()=>setYear(value=>value-1)} className="grid h-8 w-8 place-items-center rounded-full bg-el text-t2"><IconChevronLeft size={15}/></button><span className="number text-sm font-bold text-t1">{year}</span><button type="button" aria-label="Próximo ano" onClick={()=>setYear(value=>value+1)} className="grid h-8 w-8 place-items-center rounded-full bg-el text-t2"><IconChevronRight size={15}/></button></div>
        <div className="grid grid-cols-3 gap-1.5">{Array.from({length:12},(_,month)=>{const date=new Date(year,month,1);const key=monthValue(date);const selected=key===value;return <button type="button" key={key} onClick={()=>{onChange(key);setOpen(false)}} className={cn('h-10 rounded-[12px] text-[10px] font-semibold capitalize transition active:scale-95',selected?'bg-accent text-white shadow-[0_5px_14px_rgba(255,105,36,.2)]':'bg-el/45 text-t2')}>{new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(date).replace('.','')}</button>})}</div>
        <button type="button" onClick={()=>{const current=monthValue(new Date());onChange(current);setYear(new Date().getFullYear());setOpen(false)}} className="mt-3 h-8 w-full rounded-full bg-accent/10 text-[9px] font-bold text-accent">Este mês</button>
      </div>
    </>,document.body)}
  </div>
}
