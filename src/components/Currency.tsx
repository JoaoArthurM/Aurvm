import { useEffect, useState, type HTMLAttributes } from 'react'
import NumberFlow from '@number-flow/react'
import { cn } from '../lib/utils'
import { useFinancas } from '../store/use-financas'

// Monta em 0 e sobe até o valor real — a contagem roda a cada troca de tela (remount) e ao revelar valores ocultos.
export function useAnimatedValue(value: number, hidden = false) {
  const [display, setDisplay] = useState(0)
  useEffect(() => { setDisplay(hidden ? 0 : value) }, [value, hidden])
  return display
}

type CurrencyProps = HTMLAttributes<HTMLSpanElement> & {
  value: number
  symbolClassName?: string
  amountClassName?: string
}

export function Currency({ value, className, symbolClassName, amountClassName, ...props }: CurrencyProps) {
  const hidden = useFinancas(s => s.valuesHidden)
  const display = useAnimatedValue(Math.abs(value), hidden)
  const negative = value < 0
  return <span className={cn('number inline-flex items-baseline whitespace-nowrap',className)} {...props}>
    {negative&&!hidden&&<span aria-hidden="true">−</span>}
    <span className={cn('mr-[.22em] text-[.68em] font-extrabold opacity-50',symbolClassName)}>R$</span>
    {hidden
      ?<span className={cn('tracking-[.1em]',amountClassName)}>••••</span>
      :<NumberFlow value={display} locales="pt-BR" format={{minimumFractionDigits:2,maximumFractionDigits:2}} className={amountClassName}/>}
  </span>
}
