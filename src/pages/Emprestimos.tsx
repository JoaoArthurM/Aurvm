import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import {
  IconBell as Bell,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconChevronLeft,
  IconSortAscendingLetters,
  IconSortDescendingNumbers,
  IconTrash,
  IconUserDollar,
  IconX,
} from '@tabler/icons-react'
import { AurvmDatePicker } from '../components/AurvmControls'
import { Currency } from '../components/Currency'
import { Button, Card, DangerButton, Input, MoneyInput } from '../components/ui'
import { SunriseHero } from '../components/SunriseHero'
import type { LancamentoPessoa, Pessoa } from '../lib/types'
import { cn, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'

const paidGreen = '#238A5B'
const loanColor = 'oklch(0.60 0.12 5)'
const uniquePersonColors = (people: Pessoa[]) => people.map(() => loanColor)
const nextPersonColor = (_people: Pessoa[]) => loanColor

export function Emprestimos() {
  const { data, mutate, setTab } = useFinancas()
  const personColors = uniquePersonColors(data.emprestimos.pessoas)
  const people = data.emprestimos.pessoas.map((person,index) => ({ ...person, cor: personColors[index] }))
  useEffect(() => {
    if (data.emprestimos.pessoas.some((person,index) => person.cor !== personColors[index])) {
      mutate(draft => draft.emprestimos.pessoas.forEach((person,index) => { person.cor = personColors[index] }))
    }
  }, [data.emprestimos.pessoas, mutate, personColors])
  const [active, setActive] = useState(data.emprestimos.pessoas[0]?.id ?? '')
  const [adding, setAdding] = useState(false)
  const [personOrder, setPersonOrder] = useState<'valor'|'nome'>('valor')
  const [personToDelete, setPersonToDelete] = useState<Pessoa|null>(null)
  const [loanToDelete, setLoanToDelete] = useState<{ person: Pessoa; loan: LancamentoPessoa }|null>(null)
  const allLoans = data.emprestimos.pessoas.flatMap((person) => person.lancamentos)
  const pending = allLoans.filter((loan) => !loan.pago)
  const received = allLoans.filter((loan) => loan.pago).reduce((sum, loan) => sum + loan.valor, 0)
  const total = pending.reduce((sum, loan) => sum + loan.valor, 0)
  const activePerson = people.find(person => person.id === active)
  const sortedPeople = [...people].sort((a, b) => {
    if (personOrder === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR')
    const aTotal = a.lancamentos.filter(loan => !loan.pago).reduce((sum, loan) => sum + loan.valor, 0)
    const bTotal = b.lancamentos.filter(loan => !loan.pago).reduce((sum, loan) => sum + loan.valor, 0)
    return bTotal - aTotal || a.nome.localeCompare(b.nome, 'pt-BR')
  })
  const addPerson = (rawName: string) => {
    const name = rawName.trim()
    if (!name) return
    const id = uid()
    mutate((draft) => draft.emprestimos.pessoas.push({
      id,
      nome: name,
      cor: nextPersonColor(draft.emprestimos.pessoas),
      lancamentos: [],
    }))
    setActive(id)
    setAdding(false)
  }

  return (
    <div className="pb-4">
      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-[22px] pb-[14px] pt-0.5">
        <button type="button" aria-label="Voltar para o início" onClick={() => setTab('inicio')} className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-surface text-t2 shadow-[0_2px_8px_rgba(15,37,64,.07)]"><IconChevronLeft size={20}/></button>
        <div className="text-center"><p className="font-mono text-[9.5px] font-bold uppercase tracking-[2px]" style={{color:loanColor}}>Contas a receber</p><h1 className="mt-1 font-display text-[16px] font-bold leading-none tracking-[-.35px] text-t1">Empr&#233;stimos</h1></div>
        <div className="flex h-9 items-center justify-self-end rounded-xl bg-el p-[3px]"><button type="button" aria-label="Ordenar por maior valor" onClick={() => setPersonOrder('valor')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition', personOrder === 'valor' ? 'shadow-[0_2px_7px_rgba(15,37,64,.09)]' : 'text-t3')} style={personOrder === 'valor' ? {color:loanColor,background:'var(--surface)'} : undefined}><IconSortDescendingNumbers size={15}/></button><button type="button" aria-label="Ordenar por nome" onClick={() => setPersonOrder('nome')} className={cn('grid h-full w-9 place-items-center rounded-[9px] transition', personOrder === 'nome' ? 'shadow-[0_2px_7px_rgba(15,37,64,.09)]' : 'text-t3')} style={personOrder === 'nome' ? {color:loanColor,background:'var(--surface)'} : undefined}><IconSortAscendingLetters size={15}/></button></div>
      </header>
      <div className="overflow-hidden px-5">
      <section className="rounded-[24px] px-[22px] pb-[22px] pt-5" style={{background:'linear-gradient(150deg,#3a1f38 0%,#8f3f6c 52%,#c98fb0 112%)'}}><p className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[1.5px] text-white/85"><IconUserDollar size={12} strokeWidth={2.4}/>Total a receber</p><Currency value={total} className="mt-3 text-[40px] font-black leading-none tracking-[-2px]" symbolClassName="opacity-55" style={{color:'#fff'}}/><p className="mt-2 text-[11px] text-white/85">{people.length} pessoas · {pending.length} lançamentos pendentes</p></section>
      <div className="mt-3 grid grid-cols-3 gap-2.5"><LoanKpi label="Pessoas" value={String(people.length)} color="#12233c"/><LoanKpi label="Pendentes" value={String(pending.length)} color={loanColor}/><LoanKpi label="Recebido" value={<Currency value={received} symbolClassName="opacity-100" style={{color:paidGreen}}/>} color={paidGreen}/></div>
      {false && <SunriseHero
        label="Total a receber"
        value={<Currency value={total} />}
        caption={<>{data.emprestimos.pessoas.length} pessoas <span>·</span> {pending.length} lançamentos pendentes</>}
        kpis={[
          { label: 'Pessoas', value: String(data.emprestimos.pessoas.length), sub: 'com lançamentos' },
          { label: 'Pendentes', value: String(pending.length), sub: 'a receber', className: 'text-red' },
          { label: 'Recebido', value: <Currency value={received} />, sub: 'já pago', className: 'text-green' },
        ]}
      />}
      <div className="mt-4 space-y-[14px] px-0 pb-[30px]">
        <div className="grid grid-cols-3 gap-2.5">
          {sortedPeople.map((person) => {
            const amount = person.lancamentos.filter((loan) => !loan.pago).reduce((sum, loan) => sum + loan.valor, 0)
            const selected = active === person.id

            return (
              <button
                key={person.id}
                onClick={() => setActive(person.id)}
                className="min-w-0 rounded-[16px] border px-3 py-3 text-left shadow-[0_2px_9px_rgba(15,37,64,.04)] transition active:scale-[.98]"
                style={{
                  borderColor: selected ? person.cor : 'var(--border)',
                  background: selected
                    ? `color-mix(in srgb, ${person.cor} 7%, var(--surface))`
                    : 'var(--surface)',
                  boxShadow: selected
                    ? `0 5px 18px color-mix(in srgb, ${person.cor} 12%, transparent)`
                    : 'none',
                }}
              >
                <span
                  className="mb-2 grid h-9 w-9 place-items-center rounded-full text-xs font-black text-white"
                  style={{ background: person.cor }}
                >
                  {person.nome[0]}
                </span>
                <b className="block truncate text-xs">{person.nome}</b>
                <Currency value={amount} className="mt-1 block text-[12px] font-black leading-none" symbolClassName="opacity-100" style={{ color: person.cor }} />
                <small className="hidden">
                  {person.lancamentos.length} {person.lancamentos.length === 1 ? 'lançamento' : 'lançamentos'}
                </small>
              </button>
            )
          })}
        </div>

        <section>
          <div className="space-y-[10px]">
            {activePerson&&<PersonCard key={activePerson.id} person={activePerson} onRequestDelete={()=>setPersonToDelete(activePerson)} onRequestDeleteLoan={(loan)=>setLoanToDelete({ person:activePerson, loan })} />}
          </div>
        </section>

        {adding ? (
          <Card className="p-4">
            <Input
              autoFocus
              placeholder="Nome da pessoa"
              onBlur={(event) => addPerson(event.currentTarget.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') addPerson(event.currentTarget.value) }}
            />
            <p className="mt-2 text-[9px] text-t3">Pressione Enter para adicionar</p>
          </Card>
        ) : (
          <div className="flex justify-end">
            <button type="button" onClick={() => setAdding(true)} className="rounded-full px-[11px] py-[5px] text-[11px] font-semibold transition active:scale-95" style={{color:loanColor,background:`color-mix(in oklch,${loanColor} 12%,transparent)`}}>+ Nova pessoa</button>
          </div>
        )}
        {personToDelete&&<div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55" onClick={()=>setPersonToDelete(null)}>
          <div role="alertdialog" aria-label={`Confirmar exclusão de ${personToDelete.nome}`} className="safe-bottom w-full max-w-[390px] rounded-t-[28px] border-x border-t border-border bg-bg px-4 pb-5 pt-2.5 shadow-[0_-20px_60px_rgba(35,27,22,.24)]" onClick={event=>event.stopPropagation()}>
            <div aria-hidden="true" className="mx-auto mb-4 h-1 w-9 rounded-full bg-border"/>
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-red/10 text-red"><IconTrash size={19}/></span><div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-red">Excluir pessoa</p><h2 className="mt-0.5 truncate text-[17px] font-bold text-t1">Excluir {personToDelete.nome}?</h2></div><button type="button" aria-label="Fechar" onClick={()=>setPersonToDelete(null)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-el text-t3"><IconX size={15}/></button></div>
            <p className="mt-4 rounded-[15px] border border-border bg-surface p-3 text-[10px] leading-relaxed text-t2">A pessoa e todos os seus lançamentos serão removidos. Essa ação não pode ser desfeita.</p>
            <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setPersonToDelete(null)} className="h-11 rounded-[14px] border border-border bg-surface text-[11px] font-bold text-t2">Cancelar</button><button type="button" onClick={()=>{const id=personToDelete.id;mutate(draft=>{draft.emprestimos.pessoas=draft.emprestimos.pessoas.filter(person=>person.id!==id)});setPersonToDelete(null)}} className="h-11 rounded-[14px] bg-red text-[11px] font-bold text-white">Excluir pessoa</button></div>
          </div>
        </div>}
        {loanToDelete&&<div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55" onClick={()=>setLoanToDelete(null)}>
          <div role="alertdialog" aria-label={`Confirmar exclusão de ${loanToDelete.loan.motivo}`} className="safe-bottom w-full max-w-[390px] rounded-t-[28px] border-x border-t border-border bg-bg px-4 pb-5 pt-2.5 shadow-[0_-20px_60px_rgba(35,27,22,.24)]" onClick={event=>event.stopPropagation()}>
            <div aria-hidden="true" className="mx-auto mb-4 h-1 w-9 rounded-full bg-border"/>
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-red/10 text-red"><IconTrash size={19}/></span><div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold uppercase tracking-[1px] text-red">Excluir lançamento</p><h2 className="mt-0.5 truncate text-[17px] font-bold text-t1">Excluir {loanToDelete.loan.motivo}?</h2></div><button type="button" aria-label="Fechar" onClick={()=>setLoanToDelete(null)} className="grid h-9 w-9 place-items-center rounded-full border border-border bg-el text-t3"><IconX size={15}/></button></div>
            <p className="mt-4 rounded-[15px] border border-border bg-surface p-3 text-[10px] leading-relaxed text-t2">O lançamento de {loanToDelete.person.nome} no valor de <Currency value={loanToDelete.loan.valor} /> será removido. Essa ação não pode ser desfeita.</p>
            <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setLoanToDelete(null)} className="h-11 rounded-[14px] border border-border bg-surface text-[11px] font-bold text-t2">Cancelar</button><button type="button" onClick={()=>{const { person, loan } = loanToDelete;mutate(draft=>{const currentPerson=draft.emprestimos.pessoas.find(item=>item.id===person.id);if(currentPerson)currentPerson.lancamentos=currentPerson.lancamentos.filter(item=>item.id!==loan.id)});setLoanToDelete(null)}} className="h-11 rounded-[14px] bg-red text-[11px] font-bold text-white">Excluir lançamento</button></div>
          </div>
        </div>}
      </div>
      </div>
    </div>
  )
}

function LoanKpi({ label, value, color }: { label: string; value: ReactNode; color: string }) {
  return <div className="min-w-0 rounded-[16px] bg-surface p-[13px] shadow-[0_2px_10px_rgba(15,37,64,.05)]"><p className="truncate font-mono text-[8.5px] font-medium uppercase tracking-[.8px] text-t3">{label}</p><div className="mt-[7px] truncate text-[16px] font-bold" style={{color}}>{value}</div></div>
}

function PersonCard({ person,onRequestDelete,onRequestDeleteLoan }: { person: Pessoa;onRequestDelete:()=>void;onRequestDeleteLoan:(loan:LancamentoPessoa)=>void }) {
  const mutate = useFinancas((state) => state.mutate)
  const [open, setOpen] = useState(true)
  const [adding, setAdding] = useState(false)
  const [reminderLoanId,setReminderLoanId]=useState<string|null>(null)
  const [loanView,setLoanView]=useState<'pending'|'paid'>('pending')
  const pendingLoans=person.lancamentos.filter((loan)=>!loan.pago)
  const paidLoans=person.lancamentos.filter((loan)=>loan.pago)
  const visibleLoans=loanView==='pending'?pendingLoans:paidLoans
  const pendingTotal = pendingLoans.reduce((sum, loan) => sum + loan.valor, 0)
  const paidTotal = paidLoans.reduce((sum, loan) => sum + loan.valor, 0)
  const personTotal = person.lancamentos.reduce((sum, loan) => sum + loan.valor, 0) || 1

  return (
    <Card className="overflow-hidden rounded-[20px] border-0 shadow-[0_2px_10px_rgba(15,37,64,.05)]">
      <div className="flex items-center">
        <button onClick={() => setOpen((value) => !value)} className="flex min-w-0 flex-1 items-center py-4 pl-4 pr-2 text-left">
          <span
            className="mr-3 grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white"
            style={{ background: person.cor }}
          >
            {person.nome.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{person.nome}</p>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-t2">
              <Currency value={pendingTotal} />
              <span>pendente</span>
              <span className="text-t3">·</span>
              <span>{person.lancamentos.length} {person.lancamentos.length === 1 ? 'lançamento' : 'lançamentos'}</span>
            </div>
          </div>
        </button>
        {open&&<DangerButton
          className="mr-1 h-10 w-10 rounded-[11px]"
          aria-label={`Excluir ${person.nome}`}
          onClick={onRequestDelete}
        />}
        <button aria-label={open?'Recolher pessoa':'Expandir pessoa'} onClick={() => setOpen((value) => !value)} className="mr-2 grid h-10 w-8 shrink-0 place-items-center rounded-[10px] text-t3 transition active:bg-el/60">
          <ChevronDown size={16} className={cn('transition', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div className="border-t border-border px-3 pb-3 pt-0.5">
          <div className="mt-2.5 grid grid-cols-2 gap-1 rounded-[14px] bg-el p-1">
            <button onClick={()=>setLoanView('pending')} className={cn('rounded-[11px] px-2.5 py-2 text-left transition',loanView==='pending'?'bg-surface shadow-sm':'text-t3')}><span className="flex items-center justify-between gap-2"><span className="text-[9px] font-bold">Pendentes</span><span className="number text-[9px] font-bold" style={{color:loanView==='pending'?person.cor:undefined}}>{pendingLoans.length}</span></span><Currency value={pendingTotal} className="mt-1 block text-[11px] font-bold" style={{color:loanView==='pending'?person.cor:undefined}}/></button>
            <button onClick={()=>setLoanView('paid')} className={cn('rounded-[11px] px-2.5 py-2 text-left transition',loanView==='paid'?'bg-surface shadow-sm':'text-t3')}><span className="flex items-center justify-between gap-2"><span className="text-[9px] font-bold">Pagos</span><span className="number text-[9px] font-bold" style={{color:loanView==='paid'?paidGreen:undefined}}>{paidLoans.length}</span></span><Currency value={paidTotal} className="mt-1 block text-[11px] font-bold" style={{color:loanView==='paid'?paidGreen:undefined}}/></button>
          </div>
          {visibleLoans.length===0&&<div className="mt-2.5 rounded-[14px] border border-dashed border-border bg-el/25 px-4 py-6 text-center"><p className="text-[11px] font-semibold text-t2">{loanView==='paid'?'Nenhum pagamento recebido':'Nenhum lançamento pendente'}</p><p className="mt-1 text-[9px] text-t3">{loanView==='paid'?'Os itens marcados como pagos aparecerão aqui.':'Adicione um lançamento para começar.'}</p></div>}
          {visibleLoans.map((loan) => {
            const percentage = (loan.valor / personTotal) * 100
            const percentageLabel = percentage.toLocaleString('pt-BR', {
              minimumFractionDigits: percentage % 1 === 0 ? 0 : 1,
              maximumFractionDigits: 1,
            })

            return (
              <article
                key={loan.id}
                className={cn('mt-2.5 overflow-hidden rounded-[16px] border bg-surface shadow-[0_2px_9px_rgba(15,37,64,.04)]', loan.pago && 'opacity-55')}
                style={{borderColor:`color-mix(in oklch,${person.cor} 24%,var(--border))`}}
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/60 px-3.5 pb-3 pt-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{background:person.cor}}/><p className={cn('truncate text-[13px] font-bold text-t1', loan.pago && 'line-through')}>{loan.motivo}</p></div>
                    <AurvmDatePicker
                      value={loan.data}
                      onChange={(date) => mutate((draft) => {
                        const current = draft.emprestimos.pessoas
                          .find((item) => item.id === person.id)?.lancamentos
                          .find((item) => item.id === loan.id)
                        if (current) current.data = date
                      })}
                      ariaLabel={`Editar data de ${loan.motivo}`}
                      accentColor={person.cor}
                      compact
                      className="mt-1 h-6 border-0 bg-transparent px-0 text-[10px] font-medium text-t3"
                    />
                  </div>
                  <div className="shrink-0 text-right"><p className="font-mono text-[8px] font-bold uppercase tracking-[.7px] text-t3">Valor</p><Currency value={loan.valor} className="mt-0.5 block text-[16px] font-black" symbolClassName="opacity-55" style={{color:person.cor}} /></div>
                </div>

                <div className="px-3.5 pb-3 pt-3">
                  <div className="rounded-[12px] border border-border/70 bg-bg/70 px-3 py-2.5">
                    <div className="flex items-center justify-between text-[9px]"><span className="font-mono font-bold uppercase tracking-[.55px] text-t3">Participação no total</span><strong style={{color:person.cor}}>{percentageLabel}%</strong></div>
                    <div className="mt-2 h-[5px] overflow-hidden rounded-full bg-el"><div className="h-full rounded-full transition-all" style={{width:`${Math.min(percentage,100)}%`,background:person.cor}}/></div>
                  </div>

                  {loan.lembrete&&<div className="mt-2.5 flex items-center gap-2 rounded-[12px] border border-border bg-bg px-3 py-2.5 text-t2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-el text-t3"><Bell size={13}/></span><div className="min-w-0"><p className="text-[9px] font-bold">Lembrar em {new Date(`${loan.lembrete.data}T12:00:00`).toLocaleDateString('pt-BR')}</p>{loan.lembrete.observacao&&<p className="mt-0.5 truncate text-[8px] text-t3">{loan.lembrete.observacao}</p>}</div></div>}

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                    <button aria-label={loan.lembrete?'Editar lembrete':'Adicionar lembrete'} title={loan.lembrete?'Editar lembrete':'Adicionar lembrete'} onClick={()=>setReminderLoanId(current=>current===loan.id?null:loan.id)} className={cn('glass-action glass-neutral grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border transition active:scale-95',loan.lembrete&&'ring-1 ring-border')}><Bell size={14}/></button>
                    <button
                      onClick={() => mutate((draft) => {
                        const current = draft.emprestimos.pessoas
                          .find((item) => item.id === person.id)?.lancamentos
                          .find((item) => item.id === loan.id)
                        if (current) current.pago = !current.pago
                      })}
                      className="glass-action inline-flex h-9 items-center gap-1.5 rounded-[10px] border px-3 text-[10px] font-semibold transition active:scale-95"
                      style={{'--glass-color':paidGreen} as CSSProperties}
                    >
                      <Check size={12} strokeWidth={2.2}/>
                      {loan.pago?'Reabrir':'Marcar como pago'}
                    </button>
                    <DangerButton className="h-9 w-9 rounded-[10px]" aria-label={`Excluir ${loan.motivo}`} onClick={() => onRequestDeleteLoan(loan)} />
                  </div>
                  {reminderLoanId===loan.id&&<LoanReminder personId={person.id} loan={loan} done={()=>setReminderLoanId(null)}/>} 
                </div>
              </article>
            )
          })}

          {adding ? (
            <NewLoan personId={person.id} done={() => {setAdding(false);setLoanView('pending')}} />
          ) : (
            <div className="mt-3 flex items-center justify-end">
              <button type="button" onClick={() => setAdding(true)} className="rounded-full px-[11px] py-[5px] text-[11px] font-semibold transition active:scale-95" style={{color:loanColor,background:`color-mix(in oklch,${loanColor} 12%,transparent)`}}>+ Adicionar lançamento</button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function LoanReminder({personId,loan,done}:{personId:string;loan:LancamentoPessoa;done:()=>void}){
  const mutate=useFinancas(state=>state.mutate)
  const [date,setDate]=useState(loan.lembrete?.data??new Date().toISOString().slice(0,10))
  const [note,setNote]=useState(loan.lembrete?.observacao??'')
  const update=(reminder:LancamentoPessoa['lembrete'])=>mutate(draft=>{const current=draft.emprestimos.pessoas.find(person=>person.id===personId)?.lancamentos.find(item=>item.id===loan.id);if(current)current.lembrete=reminder})
  return <div className="mt-3 rounded-[13px] border border-yellow/20 bg-surface p-3 shadow-[0_6px_18px_rgba(70,40,24,.04)]">
    <div className="mb-2 flex items-center gap-2 text-t2"><span className="grid h-7 w-7 place-items-center rounded-[9px] bg-el"><Bell size={13}/></span><div><p className="text-[10px] font-bold text-t1">Lembrete de cobrança</p><p className="text-[8px] text-t3">Defina quando deseja lembrar.</p></div></div>
    <AurvmDatePicker value={date} onChange={setDate} accentColor="var(--t2)" className="h-9 w-full justify-between bg-el/50 px-3"/>
    <Input aria-label="Observação do lembrete" placeholder="Observação opcional" value={note} onChange={event=>setNote(event.target.value)} className="mt-2 h-9 bg-el/50 text-xs"/>
    <div className="mt-2 flex items-center justify-end gap-2">{loan.lembrete&&<DangerButton aria-label="Remover lembrete" title="Remover lembrete" onClick={()=>{update(null);done()}}/>}<button onClick={done} className="h-8 rounded-[10px] px-2.5 text-[9px] font-semibold text-t2 transition active:scale-95">Cancelar</button><Button disabled={!date} onClick={()=>{update({data:date,observacao:note.trim()});done()}} className="h-8 rounded-[10px] bg-accent px-3 text-[9px]">Salvar lembrete</Button></div>
  </div>
}

function NewLoan({ personId, done }: { personId: string; done: () => void }) {
  const mutate = useFinancas((state) => state.mutate)
  const [motivo, setMotivo] = useState('')
  const [valor, setValor] = useState(0)

  return (
    <div className="mt-3 rounded-[14px] border border-border bg-surface p-3">
      <div className="grid grid-cols-[1.25fr_1fr] gap-2">
        <div className="min-w-0"><span className="mb-1.5 block font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3">Motivo</span><Input aria-label="Motivo do lançamento" placeholder="Ex.: parcela, serviço..." value={motivo} onChange={(event) => setMotivo(event.target.value)} className="h-10 rounded-[11px] bg-bg px-3 text-xs font-semibold" /></div>
        <div className="min-w-0"><span className="mb-1.5 block font-mono text-[8.5px] font-bold uppercase tracking-[.8px] text-t3">Valor</span><MoneyInput aria-label="Valor do lançamento" value={valor} onValueChange={setValor} className="h-10 rounded-[11px] bg-bg px-2.5 text-xs font-bold" inputClassName="text-right" style={{color:loanColor}} /></div>
      </div>
      <Button
        disabled={!motivo || !valor}
        onClick={() => {
          mutate((draft) => draft.emprestimos.pessoas.find((person) => person.id === personId)?.lancamentos.push({
            id: uid(),
            data: new Date().toISOString().slice(0, 10),
            motivo,
            valor,
            pago: false,
          }))
          done()
        }}
        className="mt-3 h-10 w-full rounded-[11px] text-[11px] font-bold"
        style={{background:loanColor}}
      >
        Salvar
      </Button>
    </div>
  )
}
