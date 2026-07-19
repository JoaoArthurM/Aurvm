export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return <header className="px-5 pb-3 pt-[14px]">
    {eyebrow && <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-accent">{eyebrow}</p>}
    <h1 className="font-display text-[26px] font-semibold leading-none tracking-[-1.2px] text-t1">{title}</h1>
    {subtitle && <p className="mt-1.5 text-[12px] text-t2">{subtitle}</p>}
  </header>
}
