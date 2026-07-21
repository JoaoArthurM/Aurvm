import NumberFlow from '@number-flow/react'
import { IconSettings2, IconPlus, IconTableColumn } from '@tabler/icons-react'
import { useFinancas } from '../store/use-financas'
import { brl, catColors, money, sum, totals } from '../lib/utils'
import { useSelic } from '../hooks/use-selic'
import { SubscriptionLogo } from '../components/SubscriptionLogo'
import { Currency, useAnimatedValue } from '../components/Currency'
import { EyeToggle } from '../components/ui'

const HERO_GRADIENT = 'linear-gradient(162deg,#182b45 0%,#3f6c8f 46%,#8fb5c9 84%,#dfeaf0 112%)'

function BrlStyled({ value, numClass, symClass }: { value: number; numClass?: string; symClass?: string }) {
  const hidden = useFinancas(s => s.valuesHidden)
  const display = useAnimatedValue(value, hidden)
  const str = brl(value)
  const idx = str.search(/\s/)
  const sym = idx > -1 ? str.slice(0, idx) : 'R$'
  return <><span className={`font-extrabold opacity-50 ${symClass ?? ''}`}>{sym}&nbsp;</span>{hidden ? <span className={`tracking-[.1em] ${numClass ?? ''}`}>••••</span> : <NumberFlow value={display} locales="pt-BR" format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} className={numClass} />}</>
}

function SvgCurrency({ value, suffix }: { value: number; suffix?: string }) {
  const hidden = useFinancas(s => s.valuesHidden)
  return <><tspan fontSize=".7em" fontWeight="700" fillOpacity=".52">R$</tspan><tspan> {hidden ? '••••' : money(value)}{suffix}</tspan></>
}

export function Dashboard() {
  const data = useFinancas(s => s.data)
  const setTab = useFinancas(s => s.setTab)
  const accountName = useFinancas(s => s.accountName)
  const t = totals(data)
  const selic = useSelic()
  const selicLabel = selic.isLoading ? '···' : selic.isError ? 'N/D' : `${selic.data?.toFixed(2).replace('.', ',')}%`
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())
  const monthTitle = (month.charAt(0).toUpperCase() + month.slice(1)).toUpperCase()
  const firstName = accountName ? accountName.split(' ')[0].toUpperCase() : 'PESSOAL'

  const economia = Math.max(data.perfil.economia_mensal, 0)
  const baseTotal = t.entradas || 1
  const fixosPct = Math.round(t.fixos / baseTotal * 100)
  const assinaturasPct = Math.round(t.assinaturas / baseTotal * 100)
  const economiaPct = Math.round(economia / baseTotal * 100)

  return (
    <div className="page min-h-full">
      {/* Hero com gradiente */}
      <div
        className="pb-[46px]"
        style={{
          marginTop: 'calc(-1 * max(10px, env(safe-area-inset-top)))',
          paddingTop: 'max(10px, env(safe-area-inset-top))',
          background: HERO_GRADIENT,
        }}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-[22px] pt-3">
          <button
            aria-label="Configurações"
            onClick={() => setTab('config')}
            className="grid h-[38px] w-[38px] place-items-center rounded-[12px] transition active:scale-95"
            style={{ background: 'rgba(255,255,255,.16)' }}
          >
            <IconSettings2 size={17} className="text-white" strokeWidth={2} />
          </button>
          <div
            className="flex items-center gap-2.5 rounded-full py-[5px] pl-[5px] pr-[14px]"
            style={{ background: 'rgba(255,255,255,.16)' }}
          >
            <div className="h-7 w-7 rounded-full" style={{ background: 'linear-gradient(135deg,#c2d8e3,#6b97b3)' }} />
            <span className="font-mono text-[11px] font-bold tracking-[1px] text-white">{firstName} ▾</span>
          </div>
          <EyeToggle className="hero-eye-toggle" />
        </div>

        {/* Saldo */}
        <div className="px-[26px] pt-11">
          <p className="font-mono text-[10px] font-medium tracking-[2px] text-white">
            SALDO LÍQUIDO · {monthTitle}
          </p>
          <HeroBalance value={t.saldo} />

          {/* Botões */}
          <div className="mt-[14px] flex gap-[10px]">
            <button
              onClick={() => setTab('tabela')}
              className="flex flex-1 items-center justify-center gap-[7px] rounded-[15px] py-[14px] text-[13px] font-semibold text-white transition active:scale-[.98]"
              style={{ background: '#12283f' }}
            >
              <IconPlus size={15} strokeWidth={2.5} /> Adicionar
            </button>
            <button
              onClick={() => setTab('flux')}
              className="flex flex-1 items-center justify-center gap-[7px] rounded-[15px] py-[14px] text-[13px] font-semibold transition active:scale-[.98]"
              style={{ background: 'rgba(255,255,255,.55)', backdropFilter: 'blur(6px)', color: '#12283f' }}
            >
              <IconTableColumn size={14} strokeWidth={2} /> Ver fluxo
            </button>
          </div>
        </div>
      </div>

      {/* Sheet */}
      <div
        className="-mt-[30px] rounded-t-[30px] bg-bg px-5 pt-[22px]"
        style={{ boxShadow: '0 -6px 24px rgba(15,37,64,.06)' }}
      >
        {/* KPIs 2×2 */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <KpiCard label="ENTRADAS" value={t.entradas} sub={`${data.tabela.entradas.length} fonte${data.tabela.entradas.length !== 1 ? 's' : ''}`} color="oklch(0.55 0.10 165)" dotColor="oklch(0.70 0.10 165)" />
          <KpiCard label="GASTOS" value={t.gastos} sub={`${t.entradas ? (t.gastos / t.entradas * 100).toFixed(1).replace('.', ',') : '0'}% da renda`} color="oklch(0.58 0.12 30)" dotColor="oklch(0.64 0.12 30)" />
          <KpiCard label="ECONOMIA" value={data.perfil.economia_mensal} sub={`${t.entradas ? Math.round(data.perfil.economia_mensal / t.entradas * 100) : 0}% comprometida`} color="oklch(0.52 0.09 195)" dotColor="oklch(0.73 0.09 195)" />
          <KpiCard label="SELIC" textValue={selicLabel} sub="a.a. · via BCB" color="oklch(0.50 0.10 250)" dotColor="oklch(0.55 0.10 250)" />
        </div>

        {/* Barra de distribuição */}
        <div className="mb-3 rounded-[20px] bg-surface p-[17px] shadow-[0_2px_10px_rgba(15,37,64,.05)]">
          <div className="mb-[14px] flex items-baseline justify-between">
            <span className="font-mono text-[9.5px] font-medium tracking-[1.2px] text-t3">DISTRIBUIÇÃO DOS GASTOS</span>
            <button onClick={() => setTab('tabela')} className="text-[10px] text-t3 transition active:text-accent">ver tudo ›</button>
          </div>
          <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
            {fixosPct > 0 && <div style={{ width: `${fixosPct}%`, background: 'oklch(0.60 0.10 250)', minWidth: 4 }} />}
            {assinaturasPct > 0 && <div style={{ width: `${assinaturasPct}%`, background: 'oklch(0.65 0.11 305)', minWidth: 4 }} />}
            {economiaPct > 0 && <div style={{ width: `${economiaPct}%`, background: 'oklch(0.73 0.09 195)', minWidth: 4 }} />}
            <div style={{ flex: 1, background: '#e2eaf1' }} />
          </div>
          <div className="mt-[14px] flex gap-x-3">
            <LegendItem color="oklch(0.60 0.10 250)" label="Fixos" value={t.fixos} />
            <LegendItem color="oklch(0.65 0.11 305)" label="Assin." value={t.assinaturas} />
            <LegendItem color="oklch(0.73 0.09 195)" label="Econ." value={economia} />
          </div>
        </div>

        {/* Donut */}
        <DonutCard fixos={t.fixos} variaveis={t.variaveis} assinaturas={t.assinaturas} economia={data.perfil.economia_mensal} saldo={t.saldo} />

        {/* Sankey */}
        <SankeyCard data={data} />

        {/* Escala de economia */}
        <EconomyScale income={t.entradas} current={Math.max(data.perfil.economia_mensal, 0)} />

        {/* Assinaturas */}
        <Subscriptions />
      </div>
    </div>
  )
}

function HeroBalance({ value }: { value: number }) {
  const hidden = useFinancas(s => s.valuesHidden)
  const display = useAnimatedValue(value, hidden)
  return (
    <div className="number mt-3 flex items-baseline gap-1 leading-none tracking-[-2px] text-white">
      <span className="text-[30px] font-black opacity-55">R$</span>
      {hidden
        ? <span className="text-[42px] font-black tracking-[.1em]">••••</span>
        : <NumberFlow value={display} locales="pt-BR" format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} className="text-[52px] font-black text-white" />
      }
    </div>
  )
}

function KpiCard({ label, value, textValue, sub, color, dotColor }: { label: string; value?: number; textValue?: string; sub: string; color: string; dotColor: string }) {
  return (
    <div className="rounded-[18px] bg-surface p-[15px] shadow-[0_2px_10px_rgba(15,37,64,.05)]">
      <div className="flex items-center gap-[7px]">
        <span className="h-[9px] w-[9px] shrink-0 rounded-[3px]" style={{ background: dotColor }} />
        <span className="font-mono text-[9.5px] tracking-[1px] text-t3">{label}</span>
      </div>
      <div className="number mt-[10px] text-[22px] font-black leading-none tracking-[-0.8px]">
        {textValue !== undefined ? <span style={{ color }}>{textValue}</span> : <Currency value={value!} style={{ color }} />}
      </div>
      <p className="mt-1 text-[10px]" style={{ color }}>{sub}</p>
    </div>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-[6px] text-[11px] text-t2">
      <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: color }} />
      {label} <Currency value={value} className="font-bold text-t1" />
    </div>
  )
}

function DonutCard({ fixos, variaveis, assinaturas, economia, saldo }: { fixos: number; variaveis: number; assinaturas: number; economia: number; saldo: number }) {
  const s = Math.max(saldo, 0)
  const gastos = ([
    ['Fixos', fixos, catColors.fixos],
    ['Variáveis', variaveis, catColors.variaveis],
    ['Assinaturas', assinaturas, catColors.assinaturas],
    ['Economia', Math.max(economia, 0), catColors.economia],
  ] as const).filter(([, value]) => value > 0)
  const pieTotal = gastos.reduce((total, [, value]) => total + value, 0)
  const legTotal = pieTotal + s || 1
  const gap = 1.8; const segmentTotal = Math.max(0, 100 - gap * gastos.length); let cursor = 0; const parts: string[] = []
  gastos.forEach(([, value, color]) => { const pct = value / (pieTotal || 1) * segmentTotal; parts.push(`#fff ${cursor}% ${cursor + gap}%`); cursor += gap; parts.push(`${color} ${cursor}% ${cursor + pct}%`); cursor += pct })
  const background = parts.length ? `conic-gradient(${parts.join(',')})` : 'var(--el)'
  return <section className="mb-3 rounded-[20px] bg-surface p-4 shadow-[0_2px_10px_rgba(15,37,64,.05)]"><p className="mb-3 font-mono text-[9.5px] font-medium uppercase tracking-[1.2px] text-t3">Alocação por categoria</p><div className="flex items-center gap-4"><div className="relative h-[108px] w-[108px] shrink-0 rounded-full" style={{ background }}><div className="absolute inset-[22px] rounded-full bg-surface" /></div><div className="min-w-0 flex-1">{gastos.map(([label, value, color]) => <div key={label} className="mb-2 flex items-center gap-2"><i className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} /><span className="flex-1 text-xs text-t2">{label}</span><b className="number flex items-baseline gap-1 text-xs" style={{ color }}><BrlStyled value={value} numClass="text-xs" symClass="text-[10px] opacity-55" /><span className="opacity-25">|</span><small className="text-[10px] font-normal text-t3">{Math.round(value / legTotal * 100)}%</small></b></div>)}<div className={gastos.length ? 'mt-2 border-t border-border pt-2' : ''}><div className="flex items-center gap-2"><i className="h-2 w-2 shrink-0 rounded-full bg-t3" /><span className="flex-1 text-xs font-semibold text-t3">Saldo</span><b className="number flex items-baseline gap-1 text-xs text-t3"><BrlStyled value={s} numClass="text-xs text-t3" symClass="text-[10px] text-t3/60" /><span className="opacity-25">|</span><small className="text-[10px] font-semibold text-t3">100%</small></b></div></div></div></div></section>
}

function SankeyCard({ data }: { data: ReturnType<typeof useFinancas.getState>['data'] }) {
  const t = totals(data); const sourceTotal = Math.max(t.entradas, 1)
  const flows = ([
    ['Fixos', t.fixos, catColors.fixos],
    ['Variáveis', t.variaveis, catColors.variaveis],
    ['Assinaturas', t.assinaturas, catColors.assinaturas],
    ['Economia', Math.max(data.perfil.economia_mensal, 0), catColors.economia],
  ] as const).filter(([, value]) => value > 0)
  const H = 240; const srcH = flows.reduce((total, [, value]) => total + value / sourceTotal * H, 0); const svgH = flows.length ? 18 + flows.reduce((height, [, value]) => height + Math.max(8, value / sourceTotal * H) + 5, 0) - 5 + 8 : 76; let dy = 18, ldy = 0
  return <section className="mb-3 overflow-hidden rounded-[20px] bg-surface px-3 pb-3 pt-[14px] shadow-[0_2px_10px_rgba(15,37,64,.05)]"><p className="mb-[10px] font-mono text-[9.5px] font-medium uppercase tracking-[1.2px] text-t3">Fluxo · Entradas e Saídas</p>{flows.length ? <svg viewBox={`0 0 340 ${svgH}`} className="w-full"><g><rect x="60" y="18" width="14" height={srcH} rx="3" fill={catColors.entradas} /><text x="57" y={18 + srcH / 2 - 5} textAnchor="end" fontSize="10" fill="var(--t2)" fontWeight="700">Entradas</text><text x="57" y={18 + srcH / 2 + 9} textAnchor="end" fontSize="9" fill={catColors.entradas}><SvgCurrency value={t.entradas} /></text></g>{flows.map(([label, value, color]) => { const lh = value / sourceTotal * H; const rh = Math.max(8, lh); const ly = 18 + ldy; const ry = dy; ldy += lh; dy += rh + 5; return <g key={label}><path d={`M74,${ly} C120,${ly} 212,${ry} 268,${ry} L268,${ry + rh} C212,${ry + rh} 120,${ly + lh} 74,${ly + lh} Z`} fill={color} opacity=".22" /><rect x="268" y={ry} width="14" height={rh} rx="2" fill={color} /><text x="284" y={ry + rh / 2 - 2} fontSize="10" fill={color} fontWeight="700">{label}</text><text x="284" y={ry + rh / 2 + 10} fontSize="9" fill={color}><SvgCurrency value={value} /></text></g>})}</svg> : <p className="py-5 text-center text-[10px] text-t3">Nenhuma saída informada</p>}</section>
}

function EconomyScale({ income, current }: { income: number; current: number }) {
  const targets = [20, 25, 30]
  const pct = income ? current / income * 100 : 0
  const remaining = Math.max(0, income * .3 - current)
  const progress = Math.max(0, Math.min(100, pct / 30 * 100))
  const tone = pct < 20 ? 'var(--red)' : pct < 25 ? 'var(--yellow)' : 'var(--green)'
  const tierColors = ['oklch(0.60 0.10 165)', 'oklch(0.52 0.11 165)', 'oklch(0.44 0.12 165)']

  return <section className="mb-3 overflow-hidden rounded-[20px] bg-surface shadow-[0_2px_10px_rgba(15,37,64,.05)]">
    <div className="flex items-center px-4 pb-2 pt-4">
      <div><h2 className="font-mono text-[9.5px] font-medium uppercase tracking-[1.2px] text-t3">Escala de economia</h2><p className="mt-0.5 text-[11px] text-t3">Metas calculadas sobre a sua renda</p></div>
      <span className="ml-auto flex items-baseline gap-1 font-mono text-[9px] text-t3">base <Currency value={income} /></span>
    </div>
    <div className="px-4 pb-4">
      <div className="mb-3 flex items-end justify-between">
        <p className="number text-[38px] font-black leading-none tracking-[-1.5px]" style={{ color: tone }}>{pct.toFixed(1).replace('.', ',')}%</p>
        <div className="text-right"><Currency value={current} className="text-[18px] font-bold" style={{ color: tone }} /><p className="mt-0.5 text-[9px] text-t3">comprometido/mês</p></div>
      </div>
      <div className="relative mb-1 h-[6px] rounded-full bg-el">
        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: tone }} />
        {targets.map(mark => <i key={mark} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-surface" style={{ left: `${mark / 30 * 100}%` }} />)}
      </div>
      <div className="mb-4 flex justify-between text-[8px] text-t3"><span>0%</span><span>meta principal · 30%</span></div>
      <div className="space-y-2">
        {targets.map((target, index) => {
          const value = income * target / 100
          const achieved = current >= value
          const color = tierColors[index]
          return <div key={target} className="flex items-center gap-3 rounded-[12px] border px-3 py-2.5" style={{ borderColor: achieved ? color : 'var(--border)', background: achieved ? `color-mix(in oklch, ${color} 5%, transparent)` : undefined }}>
            <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-bold" style={{ color, background: `color-mix(in oklch, ${color} 12%, transparent)` }}>{index + 1}</div>
            <b className="number flex-1 text-[15px] font-bold" style={{ color: achieved ? color : 'var(--t2)' }}>{target}%</b>
            <Currency value={value} className="font-mono text-[10px] font-bold text-t2" />
            <p className="shrink-0 text-[9px] font-medium" style={{ color: achieved ? color : 'var(--t3)' }}>{achieved ? '✓ atingida' : `R$ ${money(value - current)}`}</p>
          </div>
        })}
      </div>
      {pct < 30 && <p className="mt-3 flex items-baseline gap-1 text-[10px] font-semibold" style={{ color: tone }}>Faltam <Currency value={remaining} className="ml-1" /> para alcançar 30%</p>}
    </div>
  </section>
}

function Subscriptions() {
  const data = useFinancas(s => s.data)
  const items = data.tabela.assinaturas
  const total = sum(items)
  const sorted = [...items].sort((a, b) => b.valor - a.valor)
  const summaries = [['Total/mês', total], ['Trimestral', total * 3], ['Anual', total * 12]] as const

  return <section className="mb-3 rounded-[20px] bg-surface p-4 shadow-[0_2px_10px_rgba(15,37,64,.05)]">
    <div className="mb-4 flex items-start justify-between">
      <div><p className="font-mono text-[9.5px] font-medium uppercase tracking-[1.2px] text-t3">Assinaturas</p><p className="mt-0.5 text-[11px] text-t3">Distribuição dos serviços ativos</p></div>
      <span className="rounded-full bg-el px-2.5 py-1 font-mono text-[9px] font-bold text-t2">{items.length} ativas</span>
    </div>
    <div className="space-y-0.5">
      {sorted.map(item => {
        const pct = total ? item.valor / total * 100 : 0
        return <div key={item.id} className="flex items-center gap-3 border-b border-border/40 py-2.5 last:border-0">
          <SubscriptionLogo item={item} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-t1">{item.label || 'Nova assinatura'}</p>
            <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-el"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: catColors.assinaturas, opacity: .75 }} /></div>
          </div>
          <div className="shrink-0 text-right">
            <Currency value={item.valor} className="text-[13px] font-bold" symbolClassName="opacity-100" style={{ color: catColors.assinaturas }} />
            <p className="mt-0.5 font-mono text-[9px] text-t3">{pct.toFixed(0)}%</p>
          </div>
        </div>
      })}
    </div>
    <div className="mt-3 grid grid-cols-3 gap-2">{summaries.map(([label, value]) => <div key={label} className="min-w-0 rounded-[13px] bg-el/60 px-2.5 py-3"><p className="truncate text-[8px] font-bold uppercase tracking-[.6px] text-t3">{label}</p><Currency value={value} className="mt-1 text-[13px] font-bold" symbolClassName="opacity-100" style={{ color: catColors.assinaturas }} /></div>)}</div>
  </section>
}
