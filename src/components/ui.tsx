import { useEffect, useState, type ButtonHTMLAttributes, type FocusEvent, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { IconEyeCheck, IconEyeOff, IconPlus, IconTrash } from '@tabler/icons-react'
import { cn } from '../lib/utils'
import { money } from '../lib/utils'
import { useFinancas } from '../store/use-financas'

export const EyeToggle = ({ className }: { className?: string }) => {
  const hidden = useFinancas(s => s.valuesHidden)
  const toggle = useFinancas(s => s.toggleValues)
  return <button type="button" aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'} onClick={toggle} className={cn('glass-action glass-neutral grid h-7 w-7 shrink-0 place-items-center rounded-full border transition active:scale-95', className)}>{hidden ? <IconEyeOff size={14}/> : <IconEyeCheck size={14}/>}</button>
}

export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('card-glow rounded-[22px] border border-border bg-surface', className)} {...props} />
export const Button = ({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => <button className={cn('inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white transition active:scale-[.98] disabled:opacity-50', className)} {...props} />
export const AddButton = ({ children='Adicionar', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} className={cn('glass-action glass-accent inline-flex h-7 shrink-0 items-center gap-1 rounded-full border pl-2 pr-2.5 text-[10px] font-bold normal-case tracking-normal transition active:scale-95 disabled:opacity-50',className)}><IconPlus size={12} strokeWidth={3}/>{children}</button>
export const DangerButton = ({ className, title='Excluir', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} title={title} className={cn('glass-action glass-danger grid h-8 w-8 shrink-0 place-items-center rounded-full border p-0 transition active:scale-95 disabled:opacity-50',className)}><IconTrash size={14} strokeWidth={2.2}/></button>
export const ChipButton =({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} className={cn('glass-action glass-neutral inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold normal-case tracking-normal transition active:scale-95 disabled:opacity-50',className)}>{children}</button>
export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => <input className={cn('h-11 w-full rounded-xl border border-border bg-el px-3 text-sm text-t1 outline-none transition focus:border-accent', className)} {...props} />
type MoneyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'className'> & { value: number; onValueChange: (value: number) => void; className?: string; inputClassName?: string }
const parseMoney = (raw: string) => {
  const clean = raw.replace(/[^\d,.-]/g, '')
  const normalized = clean.includes(',') ? clean.replace(/\./g, '').replace(',', '.') : clean
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}
export const MoneyInput = ({ value, onValueChange, className, inputClassName, onFocus, onBlur, style, disabled, ...props }: MoneyInputProps) => {
  const hidden=useFinancas(s=>s.valuesHidden)
  const [focused,setFocused]=useState(false)
  const [draft,setDraft]=useState(money(value))
  useEffect(()=>{if(!focused)setDraft(money(value))},[value,focused])
  const focus=(event:FocusEvent<HTMLInputElement>)=>{if(hidden)return;const input=event.currentTarget;setFocused(true);setDraft(value.toFixed(2).replace('.',','));requestAnimationFrame(()=>input.select());onFocus?.(event)}
  const blur=(event:FocusEvent<HTMLInputElement>)=>{const parsed=parseMoney(draft);if(parsed!=null)onValueChange(parsed);setDraft(money(parsed??value));setFocused(false);onBlur?.(event)}
  return <label className={cn('number inline-flex h-11 w-full items-baseline gap-[.22em] rounded-xl border border-border bg-el px-3 text-sm text-t1 transition focus-within:border-accent',disabled&&'opacity-50',className)} style={style}>
    <span aria-hidden="true" className="shrink-0 text-[.68em] font-extrabold opacity-50">R$</span>
    <input {...props} disabled={disabled} readOnly={hidden} type="text" inputMode="decimal" value={hidden?'••••':draft} onFocus={focus} onBlur={blur} onChange={event=>{if(hidden)return;setDraft(event.target.value);const parsed=parseMoney(event.target.value);if(parsed!=null)onValueChange(parsed)}} className={cn('h-full min-w-0 flex-1 bg-transparent p-0 text-left outline-none',inputClassName)} style={{font:'inherit',color:'inherit'}}/>
  </label>
}
export const Pill = ({ children, color = 'var(--accent)', className }: { children: ReactNode; color?: string; className?: string }) => <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold', className)} style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>{children}</span>
export const Toggle = ({ checked, onChange, accent = false }: { checked: boolean; onChange: () => void; accent?: boolean }) => <button type="button" onClick={onChange} className={cn('relative h-7 w-12 rounded-full transition', checked ? (accent ? 'bg-flux' : 'bg-accent') : 'bg-el')}><span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white transition-all', checked ? 'left-6' : 'left-1')} /></button>
