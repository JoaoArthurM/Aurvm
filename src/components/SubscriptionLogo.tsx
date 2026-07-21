import { useState } from 'react'
import { IconBarbell, IconCloud, IconReceipt } from '@tabler/icons-react'
import type { Item } from '../lib/types'
import { useFinancas } from '../store/use-financas'
import { cn } from '../lib/utils'

export function SubscriptionLogo({item,size=36,frosted=false}:{item:Item;size?:number;frosted?:boolean}){
  const normalized=item.label.toLowerCase()
  const FallbackIcon=normalized.includes('academ')?IconBarbell:normalized.includes('icloud')||normalized.includes('nuvem')?IconCloud:IconReceipt
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-[28%] border ${frosted?'border-white/30 bg-white/20 backdrop-blur-sm':'border-white/10 bg-el'}`} style={{width:size,height:size}}>{item.emoji?<span aria-hidden="true" style={{fontSize:size*.52,lineHeight:1}}>{item.emoji}</span>:<FallbackIcon size={size*.52} stroke={1.7} className={frosted?'text-white/85':'text-t3'}/>}</span>
}

export function SubscriptionEditor({item}:{item:Item}){
  const mutate=useFinancas(s=>s.mutate)
  const [query,setQuery]=useState(item.label)
  const [pickerOpen,setPickerOpen]=useState(false)
  const [customEmoji,setCustomEmoji]=useState(item.emoji??'')
  const emojis=['🎬','🎵','🏋️','☁️','🎮','📚','📰','💻','📱','🏠','❤️','✨']
  const setEmoji=(emoji:string|null)=>mutate(d=>{const target=d.tabela.assinaturas.find(x=>x.id===item.id);if(target)target.emoji=emoji})
  return <div className="border-b border-border bg-surface p-3"><div className="flex items-center gap-3"><button type="button" aria-label="Escolher emoji da assinatura" title="Escolher emoji" onClick={()=>setPickerOpen(value=>!value)} className="glass-action glass-neutral rounded-[13px] transition active:scale-95"><SubscriptionLogo item={item} size={44}/></button><div className="min-w-0 flex-1"><label className="text-[9px] font-bold uppercase tracking-[.7px] text-t3">Nome da assinatura</label><input value={query} onChange={e=>{const value=e.target.value;setQuery(value);mutate(d=>{const x=d.tabela.assinaturas.find(x=>x.id===item.id);if(x)x.label=value})}} placeholder="Ex.: streaming, academia..." className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-3 text-xs outline-none focus:border-accent"/></div></div>{pickerOpen&&<div className="mt-3 rounded-[15px] border border-border bg-surface p-3 shadow-[0_10px_26px_rgba(55,35,20,.08)]"><div className="mb-2 flex items-center justify-between"><div><p className="text-[10px] font-bold text-t1">Emoji da assinatura</p><p className="mt-0.5 text-[8px] text-t3">Escolha uma opção ou cole outro emoji.</p></div>{item.emoji&&<button type="button" onClick={()=>{setEmoji(null);setCustomEmoji('')}} className="glass-action glass-neutral h-7 rounded-full border px-2.5 text-[8px] font-bold">Usar ícone</button>}</div><div className="grid grid-cols-6 gap-1.5">{emojis.map(emoji=><button type="button" key={emoji} aria-label={`Usar ${emoji}`} onClick={()=>{setEmoji(emoji);setCustomEmoji(emoji)}} className={cn('glass-action glass-neutral grid h-9 place-items-center rounded-[10px] border text-lg transition active:scale-95',item.emoji===emoji&&'ring-1 ring-accent/40')}>{emoji}</button>)}</div><div className="mt-2 flex gap-2"><input aria-label="Emoji personalizado" value={customEmoji} onChange={event=>setCustomEmoji(event.target.value)} placeholder="Cole um emoji" className="h-9 min-w-0 flex-1 rounded-[11px] border border-border bg-el px-3 text-xs text-t1 outline-none focus:border-accent"/><button type="button" disabled={!customEmoji.trim()} onClick={()=>setEmoji(customEmoji.trim())} className="glass-action glass-accent h-9 rounded-[11px] border px-3 text-[9px] font-bold disabled:opacity-40">Usar</button></div></div>}</div>
}
