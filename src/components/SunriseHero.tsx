import type { ReactNode } from 'react'
import { EyeToggle } from './ui'

export type HeroKpi = { label: string; value: ReactNode; sub?: ReactNode; className?: string }

export function SunriseHero({ label, right, value, caption, kpis }: { label: string; right?: ReactNode; value: ReactNode; caption?: ReactNode; kpis?: HeroKpi[] }) {
  return <section className="mx-4 mb-[10px] rounded-[26px] border border-border bg-surface p-2.5 shadow-[0_8px_32px_rgba(0,0,0,.08)]">
    <div className="relative overflow-hidden rounded-[18px]" style={{ background: 'linear-gradient(155deg,#182b45 0%,#3f6c8f 26%,#8fb5c9 60%,#dfeaf0 100%)' }}>
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <p className="flex items-center text-[10px] font-bold uppercase tracking-[1.1px] text-white/70"><i className="mark-diamond mark-diamond-light"/>{label}</p>
        <span className="flex items-center gap-1.5">{right}<EyeToggle className="hero-eye-toggle"/></span>
      </div>
      <div className="px-5 pb-5 pt-2">
        <div className="number text-[44px] font-black leading-none tracking-[-2.2px] text-[#12283f]">{value}</div>
        {caption && <p className="mt-[7px] flex flex-wrap items-baseline gap-1 text-[11px] text-[#2c465f]">{caption}</p>}
      </div>
    </div>
    {kpis && kpis.length > 0 && <div className="grid grid-cols-3 divide-x divide-border pt-1">
      {kpis.map(kpi => <div key={kpi.label} className="px-[10px] py-3">
        <span className="block truncate text-[9px] font-semibold uppercase tracking-[.5px] text-t3">{kpi.label}</span>
        <b className={`number mt-0.5 block truncate text-[13px] font-bold ${kpi.className ?? 'text-t1'}`}>{kpi.value}</b>
        {kpi.sub && <span className="mt-0.5 block truncate text-[9px] text-t3">{kpi.sub}</span>}
      </div>)}
    </div>}
  </section>
}
