import type { HTMLAttributes } from 'react'
import { cn, money } from '../lib/utils'

type CurrencyProps = HTMLAttributes<HTMLSpanElement> & {
  value: number
  symbolClassName?: string
  amountClassName?: string
}

export function Currency({ value, className, symbolClassName, amountClassName, ...props }: CurrencyProps) {
  const negative = value < 0
  return <span className={cn('number inline-flex items-baseline whitespace-nowrap',className)} {...props}>
    {negative&&<span aria-hidden="true">−</span>}
    <span className={cn('mr-[.22em] text-[.68em] font-extrabold opacity-50',symbolClassName)}>R$</span>
    <span className={amountClassName}>{money(Math.abs(value))}</span>
  </span>
}
