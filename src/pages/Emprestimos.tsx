import { useState } from 'react'
import {
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconTrash as Trash2,
} from '@tabler/icons-react'
import { Currency } from '../components/Currency'
import { PageHeader } from '../components/PageHeader'
import { AddButton, Button, Card, DangerButton, Input, MoneyInput } from '../components/ui'
import { SunriseHero } from '../components/SunriseHero'
import type { Pessoa } from '../lib/types'
import { cn, uid } from '../lib/utils'
import { useFinancas } from '../store/use-financas'

const paidGreen = '#238A5B'
const deleteRed = '#E14D4D'

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
  const pendingTotal = person.lancamentos.filter((loan) => !loan.pago).reduce((sum, loan) => sum + loan.valor, 0)
  const personTotal = person.lancamentos.reduce((sum, loan) => sum + loan.valor, 0) || 1

  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-center px-4 py-4 text-left">
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
        <ChevronDown size={16} className={cn('shrink-0 text-t3 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-border px-3 pb-3 pt-0.5">
          {person.lancamentos.map((loan) => {
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

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => mutate((draft) => {
                      const current = draft.emprestimos.pessoas
                        .find((item) => item.id === person.id)?.lancamentos
                        .find((item) => item.id === loan.id)
                      if (current) current.pago = !current.pago
                    })}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[10px] border px-2.5 text-[9px] font-semibold transition active:scale-95"
                    style={{ color: paidGreen, borderColor: `${paidGreen}33`, background: `${paidGreen}0D` }}
                  >
                    <Check size={12} strokeWidth={2.2} />
                    {loan.pago ? 'Reabrir' : 'Marcar como pago'}
                  </button>
                  <button
                    aria-label={`Excluir ${loan.motivo}`}
                    onClick={() => mutate((draft) => {
                      const currentPerson = draft.emprestimos.pessoas.find((item) => item.id === person.id)
                      if (currentPerson) currentPerson.lancamentos = currentPerson.lancamentos.filter((item) => item.id !== loan.id)
                    })}
                    className="grid h-8 w-8 place-items-center rounded-[10px] border transition active:scale-95"
                    style={{ color: deleteRed, borderColor: `${deleteRed}33`, background: `${deleteRed}0D` }}
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>
              </article>
            )
          })}

          {adding ? (
            <NewLoan personId={person.id} done={() => setAdding(false)} />
          ) : (
            <div className="mt-3 flex items-center justify-between">
              <DangerButton
                aria-label={`Excluir ${person.nome}`}
                onClick={() => mutate((draft) => {
                  draft.emprestimos.pessoas = draft.emprestimos.pessoas.filter((item) => item.id !== person.id)
                })}
              >
                Excluir pessoa
              </DangerButton>
              <AddButton onClick={() => setAdding(true)}>Adicionar lançamento</AddButton>
            </div>
          )}
        </div>
      )}
    </Card>
  )
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
