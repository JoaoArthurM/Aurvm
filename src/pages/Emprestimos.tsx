import { useState, type CSSProperties } from 'react'
import {
  IconBell as Bell,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
} from '@tabler/icons-react'
import { AurvmDatePicker } from '../components/AurvmControls'
import { Currency } from '../components/Currency'
import { PageHeader } from '../components/PageHeader'
import { AddButton, Button, Card, DangerButton, Input, MoneyInput } from '../components/ui'
import { SunriseHero } from '../components/SunriseHero'
import type { LancamentoPessoa, Pessoa } from '../lib/types'
import { cn, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'

const paidGreen = '#238A5B'

export function Emprestimos() {
  const { data, mutate } = useFinancas()
  const [active, setActive] = useState(data.emprestimos.pessoas[0]?.id ?? '')
  const [adding, setAdding] = useState(false)
  const allLoans = data.emprestimos.pessoas.flatMap((person) => person.lancamentos)
  const pending = allLoans.filter((loan) => !loan.pago)
  const received = allLoans.filter((loan) => loan.pago).reduce((sum, loan) => sum + loan.valor, 0)
  const total = pending.reduce((sum, loan) => sum + loan.valor, 0)

  return (
    <div className="page">
      <PageHeader eyebrow="Contas a receber" title="Empréstimos" subtitle="toque no nome para ver os detalhes" />
      <SunriseHero
        label="Total a receber"
        value={<Currency value={total} />}
        caption={<>{data.emprestimos.pessoas.length} pessoas <span>·</span> {pending.length} lançamentos pendentes</>}
        kpis={[
          { label: 'Pessoas', value: String(data.emprestimos.pessoas.length), sub: 'com lançamentos' },
          { label: 'Pendentes', value: String(pending.length), sub: 'a receber', className: 'text-red' },
          { label: 'Recebido', value: <Currency value={received} />, sub: 'já pago', className: 'text-green' },
        ]}
      />
      <div className="space-y-[10px] px-4">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {data.emprestimos.pessoas.map((person) => {
            const amount = person.lancamentos.filter((loan) => !loan.pago).reduce((sum, loan) => sum + loan.valor, 0)
            const selected = active === person.id

            return (
              <button
                key={person.id}
                onClick={() => setActive(person.id)}
                className="min-w-[126px] shrink-0 rounded-[16px] border px-3 py-3 text-left transition active:scale-[.98]"
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
                  className="mb-2 grid h-8 w-8 place-items-center rounded-full text-xs font-black text-white"
                  style={{ background: person.cor }}
                >
                  {person.nome[0]}
                </span>
                <b className="block truncate text-xs">{person.nome}</b>
                <Currency value={amount} className="mt-1 block text-sm font-black leading-none" style={{ color: person.cor }} />
                <small className="mt-1.5 block text-[9px] text-t3">
                  {person.lancamentos.length} {person.lancamentos.length === 1 ? 'lançamento' : 'lançamentos'}
                </small>
              </button>
            )
          })}
        </div>

        <section>
          <div className="space-y-[10px]">
            {data.emprestimos.pessoas.map((person) => <PersonCard key={person.id} person={person} />)}
          </div>
        </section>

        {adding ? (
          <Card className="p-4">
            <Input
              autoFocus
              placeholder="Nome da pessoa"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                  const name = event.currentTarget.value.trim()
                  mutate((draft) => draft.emprestimos.pessoas.push({
                    id: uid(),
                    nome: name,
                    cor: ['#8B5CF6', '#10B981', '#F59E0B', '#3B82F6'][draft.emprestimos.pessoas.length % 4],
                    lancamentos: [],
                  }))
                  setAdding(false)
                }
              }}
            />
            <p className="mt-2 text-[9px] text-t3">Pressione Enter para adicionar</p>
          </Card>
        ) : (
          <div className="mb-3 flex justify-end">
            <AddButton onClick={() => setAdding(true)}>Nova pessoa</AddButton>
          </div>
        )}
      </div>
    </div>
  )
}

function PersonCard({ person }: { person: Pessoa }) {
  const mutate = useFinancas((state) => state.mutate)
  const [open, setOpen] = useState(false)
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
    <Card className="overflow-hidden">
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
          className="mr-1"
          aria-label={`Excluir ${person.nome}`}
          onClick={() => mutate((draft) => {
            draft.emprestimos.pessoas = draft.emprestimos.pessoas.filter((item) => item.id !== person.id)
          })}
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
                className={cn('mt-2.5 rounded-[14px] border border-border bg-el/35 p-3', loan.pago && 'opacity-55')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={cn('truncate text-xs font-semibold', loan.pago && 'line-through')}>{loan.motivo}</p>
                    <p className="mt-1 text-[9px] text-t3">
                      {new Date(`${loan.data}T12:00:00`).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Currency value={loan.valor} className="shrink-0 text-sm font-black" style={{ color: person.cor }} />
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px]">
                  <span className="font-medium uppercase tracking-[.55px] text-t3">Participação no total</span>
                  <strong style={{ color: person.cor }}>{percentageLabel}%</strong>
                </div>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-el">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(percentage, 100)}%`, background: person.cor }}
                  />
                </div>

                {loan.lembrete&&<div className="mt-3 flex items-start gap-2 rounded-[11px] border border-yellow/20 bg-yellow/[.07] px-2.5 py-2 text-yellow"><Bell size={13} className="mt-0.5 shrink-0"/><div className="min-w-0"><p className="text-[9px] font-bold">Lembrar em {new Date(`${loan.lembrete.data}T12:00:00`).toLocaleDateString('pt-BR')}</p>{loan.lembrete.observacao&&<p className="mt-0.5 truncate text-[8px] text-t2">{loan.lembrete.observacao}</p>}</div></div>}

                <div className="mt-3 flex justify-end gap-2">
                  <button aria-label={loan.lembrete?'Editar lembrete':'Adicionar lembrete'} title={loan.lembrete?'Editar lembrete':'Adicionar lembrete'} onClick={()=>setReminderLoanId(current=>current===loan.id?null:loan.id)} className={cn('glass-action glass-yellow grid h-8 w-8 shrink-0 place-items-center rounded-[10px] border transition active:scale-95',loan.lembrete&&'ring-1 ring-yellow/20')}><Bell size={14}/></button>
                  <button
                    onClick={() => mutate((draft) => {
                      const current = draft.emprestimos.pessoas
                        .find((item) => item.id === person.id)?.lancamentos
                        .find((item) => item.id === loan.id)
                      if (current) current.pago = !current.pago
                    })}
                    className="glass-action inline-flex h-8 items-center gap-1.5 rounded-[10px] border px-2.5 text-[9px] font-semibold transition active:scale-95"
                    style={{ '--glass-color': paidGreen } as CSSProperties}
                  >
                    <Check size={12} strokeWidth={2.2} />
                    {loan.pago ? 'Reabrir' : 'Marcar como pago'}
                  </button>
                  <DangerButton
                    aria-label={`Excluir ${loan.motivo}`}
                    onClick={() => mutate((draft) => {
                      const currentPerson = draft.emprestimos.pessoas.find((item) => item.id === person.id)
                      if (currentPerson) currentPerson.lancamentos = currentPerson.lancamentos.filter((item) => item.id !== loan.id)
                    })}
                  />
                </div>
                {reminderLoanId===loan.id&&<LoanReminder personId={person.id} loan={loan} done={()=>setReminderLoanId(null)}/>}
              </article>
            )
          })}

          {adding ? (
            <NewLoan personId={person.id} done={() => {setAdding(false);setLoanView('pending')}} />
          ) : (
            <div className="mt-3 flex items-center justify-end">
              <AddButton onClick={() => setAdding(true)}>Adicionar lançamento</AddButton>
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
    <div className="mb-2 flex items-center gap-2 text-yellow"><span className="grid h-7 w-7 place-items-center rounded-[9px] bg-yellow/10"><Bell size={13}/></span><div><p className="text-[10px] font-bold text-t1">Lembrete de cobrança</p><p className="text-[8px] text-t3">Defina quando deseja lembrar.</p></div></div>
    <AurvmDatePicker value={date} onChange={setDate} accentColor="var(--yellow)" className="h-9 w-full justify-between bg-el/50 px-3"/>
    <Input aria-label="Observação do lembrete" placeholder="Observação opcional" value={note} onChange={event=>setNote(event.target.value)} className="mt-2 h-9 bg-el/50 text-xs"/>
    <div className="mt-2 flex items-center justify-end gap-2">{loan.lembrete&&<DangerButton aria-label="Remover lembrete" title="Remover lembrete" onClick={()=>{update(null);done()}}/>}<button onClick={done} className="h-8 rounded-[10px] px-2.5 text-[9px] font-semibold text-t2 transition active:scale-95">Cancelar</button><Button disabled={!date} onClick={()=>{update({data:date,observacao:note.trim()});done()}} className="h-8 rounded-[10px] bg-yellow px-3 text-[9px]">Salvar lembrete</Button></div>
  </div>
}

function NewLoan({ personId, done }: { personId: string; done: () => void }) {
  const mutate = useFinancas((state) => state.mutate)
  const [motivo, setMotivo] = useState('')
  const [valor, setValor] = useState(0)

  return (
    <div className="mt-3 rounded-xl bg-el p-3">
      <div className="flex gap-2">
        <Input placeholder="Motivo" value={motivo} onChange={(event) => setMotivo(event.target.value)} className="h-9" />
        <MoneyInput aria-label="Valor" value={valor} onValueChange={setValor} className="number h-9 w-28" />
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
        className="mt-2 h-8 w-full"
      >
        Salvar
      </Button>
    </div>
  )
}
