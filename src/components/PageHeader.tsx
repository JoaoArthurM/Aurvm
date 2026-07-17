export function PageHeader({ title, subtitle }: { title: string; subtitle?: string; flux?: boolean }) {
  return <header className="px-5 pb-3 pt-[14px]"><h1 className="font-display text-[22px] font-extrabold tracking-[-.5px] text-t1">{title}</h1>{subtitle && <p className="mt-0.5 text-[13px] text-t2">{subtitle}</p>}</header>
}
